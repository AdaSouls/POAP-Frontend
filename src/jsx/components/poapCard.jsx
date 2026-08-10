import React, { forwardRef, useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { Calendar, X } from "lucide-react";
import { useDrawer } from "../contexts/drawer/drawer.provider";
import poapNormal from "../../images/svg/poap-normal.svg";
import eventOwnerIcon from "../../icons/svg/collection-owner.svg";
import { getLastClaimTx } from "../../midnight/attendance-proof";
import {
  getEventVisibility,
  setEventVisibility,
  encodeShareableCollection,
  buildShareUrl,
} from "../../midnight/collection-share";

// A "poap" here is one SPOAP token in the connected wallet's private state — one token per issuer,
// which accumulates attendance across every event claimed for that issuer (see
// src/midnight/witnesses.ts's PoapPrivateState). Attendance history is private witness state, not
// indexed on-chain, so this reads entirely from the local private-state token record, not the
// public indexer.
const truncateHex = (hex) => {
  if (!hex) return "N/A";
  return `${hex.slice(0, 8)}…${hex.slice(-6)}`;
};

// This card renders both the collapsed grid tile and the expanded detail view — same component
// instance either way (parent keeps it mounted, keyed by issuerPkHex, across expand/collapse), so
// framer-motion's `layout` prop can FLIP-animate the resize instead of needing a shared-element
// layoutId transition between two different components. Local state below (visibility,
// shareCopied) therefore survives the 5s poll in mySubscriptions.jsx and the expand/collapse
// toggle itself, since neither remounts this component.
//
// forwardRef is required here, not stylistic: mySubscriptions.jsx renders this as a direct child of
// AnimatePresence with mode="popLayout", which clones its direct children to attach a ref for
// measuring/detaching exiting elements from layout flow. A plain function component can't receive
// that ref — framer-motion silently can't measure it (console warning, and popLayout degrades to
// default timing) unless the ref is forwarded down to the actual motion.div.
const PoapCard = forwardRef(({ poap, isExpanded = false, onExpand = () => {}, onCollapse = () => {} }, ref) => {
  const { midnight } = useDrawer();

  const [visibility, setVisibility] = useState(() => {
    const map = {};
    (poap.attendedEventIds || []).forEach((eventId) => {
      map[eventId] = getEventVisibility(poap.issuerPkHex, eventId);
    });
    return map;
  });
  const [shareCopied, setShareCopied] = useState(false);
  // Text reflows (wrapping, line-count changes) as the card's width/height FLIP-animates, which
  // looks janky since framer-motion only interpolates the box, not text layout. So the text gets
  // its own short fade, sequenced (not overlapping) with the resize: fade out first, THEN trigger
  // the actual expand/collapse once the fade has finished (the resize starts only after that,
  // via the delayed onExpand/onCollapse below), and fade back in only once
  // `onLayoutAnimationComplete` confirms the resize itself is done. A plain CSS opacity transition
  // is enough here — no framer-motion animate needed for something this simple.
  const TEXT_FADE_MS = 150;
  const [showText, setShowText] = useState(true);
  const textStyle = { opacity: showText ? 1 : 0, transition: `opacity ${TEXT_FADE_MS}ms ease` };
  const pendingActionRef = useRef(null);

  useEffect(() => {
    return () => {
      if (pendingActionRef.current) clearTimeout(pendingActionRef.current);
    };
  }, []);

  const handleExpand = () => {
    setShowText(false);
    pendingActionRef.current = setTimeout(() => {
      pendingActionRef.current = null;
      onExpand();
    }, TEXT_FADE_MS);
  };

  const handleCollapse = () => {
    setShowText(false);
    pendingActionRef.current = setTimeout(() => {
      pendingActionRef.current = null;
      onCollapse();
    }, TEXT_FADE_MS);
  };

  const eventCount = poap.attendedEventIds?.length ?? 0;
  const lastClaimTx = poap.issuerPkHex ? getLastClaimTx(poap.issuerPkHex) : null;

  const toggleEventVisibility = (eventId) => {
    const next = !(visibility[eventId] ?? getEventVisibility(poap.issuerPkHex, eventId));
    setEventVisibility(poap.issuerPkHex, eventId, next);
    setVisibility((prev) => ({ ...prev, [eventId]: next }));
  };

  const copyTxHash = () => {
    if (lastClaimTx) navigator.clipboard?.writeText(lastClaimTx);
  };

  const copyShareLink = () => {
    const holderPkHex = midnight?.provider?.address;
    if (!holderPkHex || !poap.issuerPkHex) return;
    const visibleEventIds = (poap.attendedEventIds || []).filter(
      (eventId) => visibility[eventId] ?? getEventVisibility(poap.issuerPkHex, eventId)
    );
    const encoded = encodeShareableCollection([
      { issuerPkHex: poap.issuerPkHex, tokenId: poap.tokenId, visibleEventIds },
    ]);
    navigator.clipboard?.writeText(buildShareUrl(holderPkHex, encoded));
    setShareCopied(true);
    setTimeout(() => setShareCopied(false), 2000);
  };

  return (
    <motion.div
      ref={ref}
      layout
      className={isExpanded ? "col-12 mb-3" : "col-xxl-6 col-lg-6 col-md-12 mb-3"}
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      transition={{ layout: { duration: 0.3, ease: "easeInOut" }, duration: 0.2, ease: "easeInOut" }}
    >
      {/* .card-hover-group is a plain wrapper with no padding of its own, specifically so
          .card-hover-peek's inset:0 matches the card's own bounds exactly — putting position:
          relative directly on the outer Bootstrap column (which has its own gutter padding,
          e.g. ~15px each side) made the peek fill that column's full padding box instead, wider
          than the card actually rendered inside it. Static sibling, not a child of the card that
          moves — the whole point is that this does NOT lift with the card on hover, so the card
          sliding up 2px reveals a sliver of it underneath instead of both moving together (which
          was the bug with an earlier ::after-on-the-card-itself version: nothing ever moved
          relative to anything else). */}
      <div className="card-hover-group">
        {!isExpanded && <div className="card-hover-peek" />}
        <motion.div
        layout
        className={`card card-poap card-classic card-outline-only${isExpanded ? " card-detail-expanded" : ""}`}
        // borderRadius/boxShadow are set here as well as in .card-outline-only's CSS
        // (border-radius: 16px, border: 1px solid var(--glass-border), theme-dark-glass.css) on
        // purpose, not redundantly: framer-motion only auto-corrects distortion during a layout
        // FLIP animation for borderRadius/boxShadow read via the style prop — border-radius hidden
        // inside a CSS class visibly balloons at the corners while this card's own box resizes
        // (col-6 -> col-12 plus a height change), and `border`'s width isn't auto-corrected at
        // all (it visibly thickens/thins with the transform), which is why the visible edge here
        // is an inset box-shadow (which IS auto-corrected) instead of a real `border` — border is
        // explicitly turned off so the un-corrected CSS-class one doesn't show through underneath.
        style={{
          cursor: isExpanded ? "default" : "pointer",
          borderRadius: 16,
          border: "none",
          boxShadow: "inset 0 0 0 1px var(--glass-border)",
          position: "relative",
          zIndex: 1,
        }}
        whileHover={!isExpanded ? { y: -2 } : undefined}
        whileTap={!isExpanded ? { scale: 0.99 } : undefined}
        transition={{ layout: { duration: 0.3, ease: "easeInOut" }, duration: 0.2, ease: "easeInOut" }}
        onClick={!isExpanded ? handleExpand : undefined}
        onLayoutAnimationComplete={() => setShowText(true)}
      >
        <div className="card-body card-outline-only-body card-media-body">
          {isExpanded && (
            <button
              type="button"
              className="card-expand-close-btn"
              onClick={handleCollapse}
              aria-label="Collapse POAP details"
            >
              <X size={16} />
            </button>
          )}

          {!isExpanded ? (
            // Collapsed grid tile: the thumbnail moves from a small top-of-card circle to a
            // large square-rounded panel on the left, spanning almost the card's full height
            // (.card-media-row/.card-media-thumb-wrap in theme-dark-glass.css) — sized by
            // align-items:stretch against however tall the content column naturally is.
            <div className="d-flex align-items-stretch card-media-row">
              <motion.div layout className="card-media-thumb-wrap" style={textStyle}>
                <img className="card-media-thumb-icon" src={poapNormal} alt="" />
              </motion.div>
              <div className="card-media-content" style={textStyle}>
                <h4 className="mb-1" style={{ fontSize: "15px", fontWeight: "600" }}>
                  POAP #{String(poap.tokenId)}
                </h4>
                <div className="d-flex align-items-center mb-2">
                  {poap.isSoulbound && (
                    <span
                      className="badge bg-info mr-2"
                      style={{ fontSize: "10px", padding: "2px 8px", cursor: "help" }}
                      title="Marked non-transferable by you at claim time — the contract does not enforce this restriction on-chain yet."
                    >
                      Soulbound
                    </span>
                  )}
                  <span className="text-muted small">{eventCount} event{eventCount === 1 ? "" : "s"} attended</span>
                </div>

                <ul className="list-unstyled mb-2" style={{ fontSize: "12px" }}>
                  <li className="d-flex align-items-center mb-1">
                    <img className="mr-2" src={eventOwnerIcon} width="14" height="14" alt="" style={{ flexShrink: 0 }} />
                    <span className="text-muted small">
                      Issuer: <span className="text-white">{truncateHex(poap.issuerPkHex)}</span>
                    </span>
                  </li>
                  {poap.attendedEventIds?.slice(0, 2).map((eventId) => (
                    <li key={eventId} className="d-flex align-items-center mb-1">
                      <Calendar size={13} className="mr-2" style={{ width: "18px" }} />
                      <span className="text-muted small">{truncateHex(eventId)}</span>
                    </li>
                  ))}
                  {eventCount > 2 && (
                    <li className="text-muted small">…and {eventCount - 2} more</li>
                  )}
                </ul>

                <div className="d-flex justify-content-end mt-auto">
                  <button
                    type="button"
                    className="btn btn-white btn-small"
                    style={{ fontSize: "11px", padding: "3px 10px" }}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleExpand();
                    }}
                  >
                    View Details
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="d-flex justify-content-start align-items-center mb-2">
              <motion.div layout className="card-media-thumb-small-wrap mr-3" style={textStyle}>
                <img src={poapNormal} alt="" />
              </motion.div>
              <div className="poap-info flex-grow-1" style={textStyle}>
                <h4 className="mb-1" style={{ fontSize: "15px", fontWeight: "600" }}>
                  POAP #{String(poap.tokenId)}
                </h4>
                <div className="d-flex align-items-center">
                  {poap.isSoulbound && (
                    <span
                      className="badge bg-info mr-2"
                      style={{ fontSize: "10px", padding: "2px 8px", cursor: "help" }}
                      title="Marked non-transferable by you at claim time — the contract does not enforce this restriction on-chain yet."
                    >
                      Soulbound
                    </span>
                  )}
                  <span className="text-muted small">{eventCount} event{eventCount === 1 ? "" : "s"} attended</span>
                </div>
              </div>
            </div>
          )}

          {isExpanded && (
            <div className="mt-3" style={textStyle}>
              <p className="m-0 small text-muted mb-1">Issuer (Organizer)</p>
              <p className="m-0 mb-3 text-break small font-weight-semibold">
                {poap.issuerPkHex || "N/A"}
              </p>

              {poap.isSoulbound && (
                <small className="text-muted d-block mb-3">
                  Marked non-transferable by you at claim time — the contract does not enforce
                  this restriction on-chain yet.
                </small>
              )}

              <hr className="my-4" />
              <h4 className="mb-3" style={{ fontSize: "16px" }}>Prove Attendance</h4>
              {lastClaimTx ? (
                <>
                  <div className="d-flex align-items-center mb-2">
                    <span className="badge bg-success mr-2">Verified ✓</span>
                    <span className="small text-muted">This token was claimed with a ZK-proved on-chain transaction.</span>
                  </div>
                  <div className="d-flex align-items-center">
                    <code className="text-break small flex-grow-1">{lastClaimTx}</code>
                    <button className="btn btn-sm btn-outline-secondary ml-2" onClick={copyTxHash}>
                      Copy
                    </button>
                  </div>
                </>
              ) : (
                <p className="text-muted small mb-0">
                  No recent claim transaction recorded on this device. Claim (or reconcile) this token
                  here to generate a shareable proof.
                </p>
              )}
              <small className="text-muted d-block mt-2">
                This proves you hold a token for this contract — every claim is already a ZK-proved
                transaction verified on-chain. Proving specific attendance counts without revealing
                which events requires new contract circuits (planned follow-up work).
              </small>

              {eventCount > 0 && (
                <div>
                  <hr className="my-4" />
                  <h4 className="mb-3" style={{ fontSize: "16px" }}>Attendance (this device only)</h4>
                  <ul className="list-unstyled mb-0">
                    {poap.attendedEventIds.map((eventId) => (
                      <li key={eventId} className="d-flex align-items-center mb-2">
                        <input
                          type="checkbox"
                          className="mr-2"
                          id={`poap-card-share-event-${eventId}`}
                          checked={visibility[eventId] ?? true}
                          onChange={() => toggleEventVisibility(eventId)}
                        />
                        <label
                          htmlFor={`poap-card-share-event-${eventId}`}
                          className="d-flex align-items-center m-0"
                          style={{ cursor: "pointer" }}
                        >
                          <Calendar size={14} className="mr-2" />
                          <span className="text-break small">{truncateHex(eventId)}</span>
                        </label>
                      </li>
                    ))}
                  </ul>
                  <small className="text-muted d-block mt-2">
                    This list is stored only in this browser's private state and is never sent to any
                    server. Checked events are the ones included if you share this token below.
                  </small>
                </div>
              )}

              <hr className="my-4" />
              <h4 className="mb-3" style={{ fontSize: "16px" }}>Share This Token</h4>
              <button className="btn btn-sm btn-outline-secondary" onClick={copyShareLink} disabled={!midnight?.provider}>
                {shareCopied ? "Link copied ✓" : "Copy share link"}
              </button>
              <small className="text-muted d-block mt-2">
                Builds a link from data available right now: the token/issuer info is looked up live
                from the public indexer, and any events you left checked above are included as your
                own claim — not something the link can prove on its own, unlike the ZK-verified tx
                hash above.
              </small>
            </div>
          )}
        </div>
        </motion.div>
      </div>
    </motion.div>
  );
});

PoapCard.displayName = "PoapCard";

export default PoapCard;
