import React, { forwardRef, useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { ArrowLeftRight, Award, X } from "lucide-react";
import { useDrawer } from "../contexts/drawer/drawer.provider";
import eventOwnerIcon from "../../icons/svg/collection-owner.svg";
import { useEventMetadata } from "../hooks/useEventMetadata";
import CategoryBadge from "./CategoryBadge";
import { getClaimActionLabel } from "../constants/eventCategories";
import {
  getTokenVisibility,
  setTokenVisibility,
  encodeShareableCollection,
  buildShareUrl,
} from "../../midnight/collection-share";

const truncateHex = (hex) => {
  if (!hex) return "N/A";
  return `${hex.slice(0, 8)}…${hex.slice(-6)}`;
};

// A "poap" here is one token from src/midnight/my-tokens.ts's getMyTokens — one card per token,
// one token per event (claim() mints a brand-new token scoped to (holder, event); see
// poap.compact). Sourced from the indexer by this wallet's per-issuer holder pk, not from local
// private state — that's what lets an organizer's push-mint (mintTo) show up here automatically,
// with no separate "claim it into this browser" step.
//
// This card renders both the collapsed grid tile and the expanded detail view — same component
// instance either way (parent keeps it mounted, keyed by tokenId, across expand/collapse), so
// framer-motion's `layout` prop can FLIP-animate the resize instead of needing a shared-element
// layoutId transition between two different components.
//
// forwardRef is required here, not stylistic: mySubscriptions.jsx renders this as a direct child of
// AnimatePresence with mode="popLayout", which clones its direct children to attach a ref for
// measuring/detaching exiting elements from layout flow. A plain function component can't receive
// that ref — framer-motion silently can't measure it (console warning, and popLayout degrades to
// default timing) unless the ref is forwarded down to the actual motion.div.
const PoapCard = forwardRef(({ poap, isExpanded = false, onExpand = () => {}, onCollapse = () => {} }, ref) => {
  const { midnight } = useDrawer();

  const [visible, setVisible] = useState(() => getTokenVisibility(poap.issuerPkHex, poap.tokenId));
  const [shareCopied, setShareCopied] = useState(false);
  const { metadata, loading: metadataLoading } = useEventMetadata(poap.tokenMetadataURI || poap.metadataURI);
  const poapImageUrl = metadata?.poapImageUrl || metadata?.imageUrl;
  // The parent event's own image, independent of whichever metadata resolved above — for a
  // self-claimed token these are the same URI, but an organizer's push-mint (mintTo) carries a
  // personalized tokenMetadataURI, so "which event is this from" still needs the event's own
  // metadataURI specifically (see IndexedToken's own comment in indexer.service.ts). Shares
  // useEventMetadata's cache, so this is a no-op fetch whenever the two URIs are equal.
  const { metadata: eventMetadata } = useEventMetadata(poap.metadataURI);
  const claimLabel = getClaimActionLabel(metadata);
  // Which of the two stacked thumb-stack images (POAP medallion / event badge) is currently on
  // top — purely a local display toggle, position of either element never changes, see
  // .event-in-front in theme-dark-glass.css.
  const [eventInFront, setEventInFront] = useState(false);
  // Same broken/loading treatment as eventCard.jsx's own cards — never a stale/placeholder image,
  // ever, while the real one isn't confirmed available.
  const [imgLoadError, setImgLoadError] = useState(false);
  useEffect(() => {
    setImgLoadError(false);
  }, [poapImageUrl]);
  const showBrokenImage = !metadataLoading && (!poapImageUrl || imgLoadError);
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

  const toggleVisibility = () => {
    const next = !visible;
    setTokenVisibility(poap.issuerPkHex, poap.tokenId, next);
    setVisible(next);
  };

  const copyShareLink = () => {
    const encoded = encodeShareableCollection([{ issuerPkHex: poap.issuerPkHex, tokenId: poap.tokenId }]);
    navigator.clipboard?.writeText(buildShareUrl(midnight?.provider?.address, encoded));
    setShareCopied(true);
    setTimeout(() => setShareCopied(false), 2000);
  };

  // No "pending"/claim state exists for a POAP — mintTo() (organizer push-mint) and claim()
  // (self-mint) both leave the token already owned by the recipient the instant the transaction
  // lands, with no separate claim/approval step (see mySubscriptions.jsx reading straight from the
  // indexer by holder pk). So the only real states here are "still owned" vs. "burned" — same
  // top-right badge slot/style as eventCard.jsx's own status badge, instead of Burned living down
  // in the row with Soulbound.
  // "Active" said nothing about how you got this POAP — same category-aware verb the explore-events
  // grid uses once claimed (Followed/Attended/Subscribed, see getClaimActionLabel), since every card
  // on this page is by definition already-held (no "Claimable" state exists here).
  const poapStatusBadgeClass = poap.isBurned ? "badge bg-secondary" : "badge status-badge-active";
  const poapStatusLabel = poap.isBurned ? "Burned" : claimLabel.done;

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
      <div className="card-hover-group">
        {!isExpanded && <div className="card-hover-peek" />}
        <motion.div
        layout
        className={`card card-poap card-classic card-outline-only${isExpanded ? " card-detail-expanded" : ""}`}
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
            <div className="d-flex align-items-stretch card-media-row">
              {/* The image is never part of textStyle's fade — only text fades out before the
                  resize and back in after, the image stays visible throughout (and stays the same
                  size/crop as the collapsed tile in the expanded branch below, not a smaller one).
                  poap-media-thumb-stack wraps the round POAP thumb together with a small square
                  "which event is this" badge pinned behind it, top-left-aligned to the same origin —
                  see .poap-event-badge in theme-dark-glass.css for the positioning/z-index. */}
              <div className={`poap-media-thumb-stack${eventInFront ? " event-in-front" : ""}`}>
                {eventMetadata?.imageUrl && (
                  <div className={`poap-event-badge${eventInFront ? " front-shadow" : ""}`}>
                    <img className="poap-event-badge-photo" src={eventMetadata.imageUrl} alt="" />
                  </div>
                )}
                <motion.div
                  layout
                  className={`card-media-thumb-wrap${eventInFront ? "" : " front-shadow"}`}
                  style={{ borderRadius: "50%", overflow: "hidden" }}
                >
                  {metadataLoading ? (
                    <div className="skeleton-block" style={{ width: "100%", height: "100%" }} />
                  ) : showBrokenImage ? (
                    <Award size={48} className="card-media-thumb-broken-icon card-media-thumb-broken-icon-role" />
                  ) : (
                    <img
                      className="card-media-thumb-photo"
                      src={poapImageUrl}
                      alt=""
                      onError={() => setImgLoadError(true)}
                    />
                  )}
                </motion.div>
                {eventMetadata?.imageUrl && (
                  <button
                    type="button"
                    className="poap-thumb-swap-btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      setEventInFront((current) => !current);
                    }}
                    aria-label={eventInFront ? "Bring the POAP image to the front" : "Bring the event image to the front"}
                  >
                    <ArrowLeftRight size={12} />
                  </button>
                )}
              </div>
              <div className="card-media-content" style={textStyle}>
                <div className="d-flex align-items-start justify-content-between mb-1">
                  <h4 className="mb-0" style={{ fontSize: "15px", fontWeight: "600" }}>
                    {metadata?.name || `POAP #${String(poap.tokenId)}`}
                  </h4>
                  <span
                    className={`${poapStatusBadgeClass} text-capitalize flex-shrink-0 ml-2`}
                    style={{ fontSize: "10px", padding: "2px 8px" }}
                  >
                    {poapStatusLabel}
                  </span>
                </div>
                {poap.isSoulbound && (
                  <div className="d-flex align-items-center mb-2">
                    <span
                      className="badge bg-info mr-2"
                      style={{ fontSize: "10px", padding: "2px 8px", cursor: "help" }}
                      title="Marked non-transferable by you at claim time — the contract does not enforce this restriction on-chain yet."
                    >
                      Soulbound
                    </span>
                  </div>
                )}

                <ul
                  className="list-unstyled mb-2 d-flex flex-column justify-content-center flex-grow-1"
                  style={{ fontSize: "12px" }}
                >
                  <li className="d-flex align-items-center mb-1">
                    <img className="mr-2" src={eventOwnerIcon} width="14" height="14" alt="" style={{ flexShrink: 0 }} />
                    <span className="text-muted small">
                      Issuer: <span className="text-white">{metadata?.organization?.name || truncateHex(poap.issuerPkHex)}</span>
                    </span>
                  </li>
                  <li className="d-flex align-items-center mb-1">
                    <span className="text-muted small">
                      Event: <span className="text-white">{truncateHex(poap.firstEventId)}</span>
                    </span>
                  </li>
                </ul>

                <div className="d-flex justify-content-end mt-auto">
                  <CategoryBadge category={metadata?.category} />
                </div>
              </div>
            </div>
          ) : (
            <div className="d-flex justify-content-start align-items-center mb-2">
              <motion.div layout className="card-media-thumb-wrap mr-3" style={{ borderRadius: "50%", overflow: "hidden" }}>
                {metadataLoading ? (
                  <div className="skeleton-block" style={{ width: "100%", height: "100%" }} />
                ) : showBrokenImage ? (
                  <Award size={14} className="card-media-thumb-broken-icon card-media-thumb-broken-icon-role" />
                ) : (
                  <img
                    className="card-media-thumb-photo"
                    src={poapImageUrl}
                    alt=""
                    onError={() => setImgLoadError(true)}
                  />
                )}
              </motion.div>
              <div className="poap-info flex-grow-1" style={textStyle}>
                <div className="d-flex align-items-center justify-content-between">
                  <h4 className="mb-1" style={{ fontSize: "15px", fontWeight: "600" }}>
                    {metadata?.name || `POAP #${String(poap.tokenId)}`}
                  </h4>
                  <span
                    className={`${poapStatusBadgeClass} text-capitalize flex-shrink-0 ml-2`}
                    style={{ fontSize: "11px", padding: "3px 10px" }}
                  >
                    {poapStatusLabel}
                  </span>
                </div>
                {poap.isSoulbound && (
                  <div className="d-flex align-items-center">
                    <span
                      className="badge bg-info mr-2"
                      style={{ fontSize: "10px", padding: "2px 8px", cursor: "help" }}
                      title="Marked non-transferable by you at claim time — the contract does not enforce this restriction on-chain yet."
                    >
                      Soulbound
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Only set on individually push-minted Credential tokens (see mintPoap.jsx) — the
              actual ticket/diploma/document content this credential represents. Absent for every
              other token (self-claimed, or Credential tokens minted before this field existed),
              so this block simply doesn't render rather than showing a placeholder. */}
          {isExpanded && metadata?.documentImageUrl && (
            <div className="mb-3" style={textStyle}>
              <img
                src={metadata.documentImageUrl}
                alt=""
                style={{ width: "100%", borderRadius: 12, display: "block" }}
              />
            </div>
          )}

          {isExpanded && (
            <div className="mt-3" style={textStyle}>
              <p className="m-0 small text-muted mb-1">Issuer (Organizer)</p>
              <p className="m-0 mb-3 text-break small font-weight-semibold">
                {poap.issuerPkHex || "N/A"}
              </p>

              <p className="m-0 small text-muted mb-1">Event</p>
              <p className="m-0 mb-3 text-break small font-weight-semibold">
                {metadata?.name || truncateHex(poap.firstEventId)}
              </p>

              {poap.isSoulbound && (
                <small className="text-muted d-block mb-3">
                  Marked non-transferable by you at claim time — the contract does not enforce
                  this restriction on-chain yet.
                </small>
              )}

              <hr className="my-4" />
              <h4 className="mb-3" style={{ fontSize: "16px" }}>On-Chain Proof</h4>
              {poap.mintedTx ? (
                <>
                  <div className="d-flex align-items-center mb-2">
                    <span className="badge bg-success mr-2">Verified ✓</span>
                    <span className="small text-muted">
                      This token was minted with a ZK-proved on-chain transaction.
                    </span>
                  </div>
                  <div className="d-flex align-items-center">
                    <code className="text-break small flex-grow-1">{poap.mintedTx}</code>
                    <button
                      className="btn btn-sm btn-outline-secondary ml-2"
                      onClick={() => navigator.clipboard?.writeText(poap.mintedTx)}
                    >
                      Copy
                    </button>
                  </div>
                </>
              ) : (
                <p className="text-muted small mb-0">No mint transaction found for this token.</p>
              )}

              <hr className="my-4" />
              <h4 className="mb-3" style={{ fontSize: "16px" }}>Share This Token</h4>
              <div className="form-check form-switch mb-2">
                <input
                  className="form-check-input"
                  type="checkbox"
                  id={`poap-card-share-${poap.tokenId}`}
                  checked={visible}
                  onChange={toggleVisibility}
                />
                <label className="form-check-label small" htmlFor={`poap-card-share-${poap.tokenId}`}>
                  Include in "Share my collection" links
                </label>
              </div>
              <button className="btn btn-sm btn-outline-secondary" onClick={copyShareLink} disabled={!midnight?.provider}>
                {shareCopied ? "Link copied ✓" : "Copy share link"}
              </button>
              <small className="text-muted d-block mt-2">
                Builds a link from data available right now: the token/issuer info is looked up live
                from the public indexer — not something the link can prove on its own, unlike the
                ZK-verified tx hash above.
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
