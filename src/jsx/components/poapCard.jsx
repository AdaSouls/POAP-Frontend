import React, { forwardRef, useRef, useState } from "react";
import { motion } from "framer-motion";
import { X } from "lucide-react";
import { useDrawer } from "../contexts/drawer/drawer.provider";
import poapNormal from "../../images/svg/poap-normal.svg";
import eventOwnerIcon from "../../icons/svg/collection-owner.svg";
import { useEventMetadata } from "../hooks/useEventMetadata";
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
  const { metadata } = useEventMetadata(poap.tokenMetadataURI || poap.metadataURI);
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
              <motion.div layout className="card-media-thumb-wrap" style={textStyle}>
                <img
                  className="card-media-thumb-icon"
                  src={metadata?.imageUrl || poapNormal}
                  alt=""
                  onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = poapNormal; }}
                />
              </motion.div>
              <div className="card-media-content" style={textStyle}>
                <h4 className="mb-1" style={{ fontSize: "15px", fontWeight: "600" }}>
                  {metadata?.name || `POAP #${String(poap.tokenId)}`}
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
                  {poap.isBurned && (
                    <span className="badge bg-secondary mr-2" style={{ fontSize: "10px", padding: "2px 8px" }}>
                      Burned
                    </span>
                  )}
                </div>

                <ul className="list-unstyled mb-2" style={{ fontSize: "12px" }}>
                  <li className="d-flex align-items-center mb-1">
                    <img className="mr-2" src={eventOwnerIcon} width="14" height="14" alt="" style={{ flexShrink: 0 }} />
                    <span className="text-muted small">
                      Issuer: <span className="text-white">{truncateHex(poap.issuerPkHex)}</span>
                    </span>
                  </li>
                  <li className="d-flex align-items-center mb-1">
                    <span className="text-muted small">
                      Event: <span className="text-white">{truncateHex(poap.firstEventId)}</span>
                    </span>
                  </li>
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
                <img
                  src={metadata?.imageUrl || poapNormal}
                  alt=""
                  onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = poapNormal; }}
                />
              </motion.div>
              <div className="poap-info flex-grow-1" style={textStyle}>
                <h4 className="mb-1" style={{ fontSize: "15px", fontWeight: "600" }}>
                  {metadata?.name || `POAP #${String(poap.tokenId)}`}
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
                  {poap.isBurned && (
                    <span className="badge bg-secondary mr-2" style={{ fontSize: "10px", padding: "2px 8px" }}>
                      Burned
                    </span>
                  )}
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
