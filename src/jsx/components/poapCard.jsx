import React, { forwardRef, useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { Award, BadgeCheck, Calendar, ImageOff, X } from "lucide-react";
import { useDrawer } from "../contexts/drawer/drawer.provider";
import eventOwnerIcon from "../../icons/svg/collection-owner.svg";
import { useEventMetadata } from "../hooks/useEventMetadata";
import CategoryBadge from "./CategoryBadge";
import BlockchainField from "./BlockchainField";
import { getClaimActionLabel } from "../constants/eventCategories";
import { getEvent } from "../../midnight/indexer.service";
import { getEventStatus, getEventStatusLabel } from "../../utils/poapHelpers";
import formatDateToDDMMYYYY from "../../utils/formatDateToDDMMYYYY";
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
  const claimLabel = getClaimActionLabel(metadata);
  // Same broken/loading treatment as eventCard.jsx's own cards — never a stale/placeholder image,
  // ever, while the real one isn't confirmed available.
  const [imgLoadError, setImgLoadError] = useState(false);
  useEffect(() => {
    setImgLoadError(false);
  }, [poapImageUrl]);
  const showBrokenImage = !metadataLoading && (!poapImageUrl || imgLoadError);

  // The parent EVENT's own metadata (name/image/organization/category), independent of whichever
  // metadata resolved above — for a self-claimed token these are the same URI (cache hit, no extra
  // fetch), but a push-minted Credential's tokenMetadataURI is personalized, so the expanded card's
  // "event info" sidebar block specifically needs the event's own metadataURI to show the actual
  // event picture rather than this holder's own document/icon.
  const { metadata: eventMetadata, loading: eventMetadataLoading } = useEventMetadata(poap.metadataURI);
  const [eventImgLoadError, setEventImgLoadError] = useState(false);
  useEffect(() => {
    setEventImgLoadError(false);
  }, [eventMetadata?.imageUrl]);
  const showBrokenEventImage = !eventMetadataLoading && (!eventMetadata?.imageUrl || eventImgLoadError);

  // Live event stats (status/expiration/minted/maxSupply) for the expanded card's embedded "event
  // info" preview — not available from the IndexedToken itself (poap.* only carries the event ID),
  // so this is its own fetch, only while expanded, mirroring eventCard.jsx's own detail fetch.
  const [eventDetail, setEventDetail] = useState(null);
  useEffect(() => {
    if (!isExpanded) return undefined;
    let cancelled = false;
    getEvent(poap.firstEventId)
      .then((detail) => {
        if (!cancelled) setEventDetail(detail);
      })
      .catch((error) => {
        console.error("Error loading event detail:", error);
      });
    return () => {
      cancelled = true;
    };
  }, [isExpanded, poap.firstEventId]);
  const eventStatus = eventDetail ? getEventStatus(eventDetail) : null;
  const eventStatusLabel = eventStatus ? getEventStatusLabel(eventStatus) : null;
  const eventStatusBadgeClass = {
    active: "badge status-badge-active",
    expired: "badge bg-danger",
    full: "badge bg-warning",
    inactive: "badge bg-secondary",
  }[eventStatus];
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

  // Copy-button state for the expanded card's raw blockchain-data block (Token ID / Issuer /
  // Event ID / Block / Tx) — keyed by field name, same pattern as eventCard.jsx's own
  // copiedField/copyField, which BlockchainField (shared component) expects.
  const [copiedField, setCopiedField] = useState(null);
  const copyField = (field, value) => {
    navigator.clipboard?.writeText(value);
    setCopiedField(field);
    setTimeout(() => setCopiedField((current) => (current === field ? null : current)), 2000);
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
          {!isExpanded ? (
            <div className="d-flex align-items-stretch card-media-row">
              {/* The image is never part of textStyle's fade — only text fades out before the
                  resize and back in after, the image stays visible throughout (and stays the same
                  size/crop as the collapsed tile in the expanded branch below, not a smaller one). */}
              <motion.div
                layout
                className="card-media-thumb-wrap"
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
            /* Expanded detail: two columns, like eventCard.jsx's own expanded card — but inverted
               proportions. eventCard gives its bigger column to TEXT and its smaller column to
               actions. A POAP/credential card is the opposite: the image itself (especially a
               push-minted credential's actual document — diploma, ticket, ID) IS the content, so
               the LEFT column (2/3) keeps identity (same round POAP thumb + name as the collapsed
               tile) up top, then the credential's document image (when there is one — plain
               claimed/pushed POAPs never have one), then the raw blockchain data. The RIGHT column
               (1/3) is a stack of three "cards": a verification seal, a preview of the parent
               event (styled like that event's own collapsed tile), and the share controls. */
            <div className="row">
              <div className="col-md-8" style={textStyle}>
                <div className="d-flex align-items-center justify-content-between mb-2">
                  <div className="d-flex align-items-center" style={{ minWidth: 0 }}>
                    <motion.div
                      layout
                      className="card-media-thumb-wrap mr-3"
                      style={{ borderRadius: "50%", overflow: "hidden" }}
                    >
                      {metadataLoading ? (
                        <div className="skeleton-block" style={{ width: "100%", height: "100%" }} />
                      ) : showBrokenImage ? (
                        <Award size={32} className="card-media-thumb-broken-icon card-media-thumb-broken-icon-role" />
                      ) : (
                        <img
                          className="card-media-thumb-photo"
                          src={poapImageUrl}
                          alt=""
                          onError={() => setImgLoadError(true)}
                        />
                      )}
                    </motion.div>
                    <h4 className="mb-0 text-truncate" style={{ fontSize: "16px", fontWeight: "600" }}>
                      {metadata?.name || `POAP #${String(poap.tokenId)}`}
                    </h4>
                  </div>
                  <div className="d-flex flex-column align-items-end flex-shrink-0" style={{ gap: 6, marginLeft: 12 }}>
                    <span
                      className={`${poapStatusBadgeClass} text-capitalize`}
                      style={{ fontSize: "10px", padding: "2px 8px" }}
                    >
                      {poapStatusLabel}
                    </span>
                    <CategoryBadge category={metadata?.category} />
                  </div>
                </div>

                {poap.isSoulbound && (
                  <div className="mb-2">
                    <span
                      className="badge bg-info"
                      style={{ fontSize: "10px", padding: "2px 8px", cursor: "help" }}
                      title="Marked non-transferable by you at claim time — the contract does not enforce this restriction on-chain yet."
                    >
                      Soulbound
                    </span>
                    <small className="text-muted d-block mt-1">
                      Marked non-transferable by you at claim time — the contract does not enforce
                      this restriction on-chain yet.
                    </small>
                  </div>
                )}

                <hr style={{ marginTop: "12px", marginBottom: "18px" }} />

                {/* Only set on individually push-minted Credential tokens (see mintPoap.jsx) — the
                    actual ticket/diploma/document content this credential represents. No container
                    box on purpose (the document is the content, not a decorated tile) — just
                    capped at a max height so a tall/portrait document can't stretch the whole
                    expanded card, and centered in whatever space that leaves. */}
                {metadata?.documentImageUrl && (
                  <>
                    <div className="d-flex align-items-center justify-content-center">
                      <img className="poap-credential-document-image" src={metadata.documentImageUrl} alt="" />
                    </div>
                    <hr style={{ marginTop: "18px", marginBottom: "18px" }} />
                  </>
                )}

                <BlockchainField label="Token ID" value={String(poap.tokenId)} />
                <BlockchainField
                  label="Issuer"
                  value={poap.issuerPkHex}
                  copied={copiedField === "issuer"}
                  onCopy={() => copyField("issuer", poap.issuerPkHex)}
                  copyAriaLabel="Copy organizer key"
                  hint="Use this to generate your own key for this organizer (My Subscriptions → Get My Key)."
                />
                <BlockchainField label="Event ID" value={poap.firstEventId} />
                <BlockchainField label="Block" value={poap.mintedBlock ?? "N/A"} />
                <BlockchainField
                  label="Tx"
                  value={poap.mintedTx}
                  copied={copiedField === "tx"}
                  onCopy={() => copyField("tx", poap.mintedTx)}
                />
              </div>

              <div
                className="col-md-4"
                style={{ borderLeft: "1px solid var(--glass-border)", paddingLeft: "20px", ...textStyle }}
              >
                <div className="d-flex align-items-center justify-content-end mb-3">
                  <button
                    type="button"
                    className="card-expand-close-btn card-expand-close-btn-inline"
                    onClick={handleCollapse}
                    aria-label="Collapse POAP details"
                  >
                    <X size={16} />
                  </button>
                </div>

                {/* Verification "seal" — a bigger, more deliberate visual treatment than a plain
                    badge, since this is the one thing meant to read as proof-of-authenticity at a
                    glance rather than just another status label. */}
                <div className="poap-verified-seal-card">
                  {poap.mintedTx ? (
                    <>
                      <BadgeCheck size={36} className="poap-verified-seal-icon flex-shrink-0" />
                      <div>
                        <p className="m-0 font-weight-semibold">Verified</p>
                        <p className="m-0 text-muted small">
                          This token was minted with a ZK-proved on-chain transaction.
                        </p>
                      </div>
                    </>
                  ) : (
                    <p className="text-muted small mb-0">No mint transaction found for this token.</p>
                  )}
                </div>

                <hr style={{ marginTop: "18px", marginBottom: "18px" }} />

                {/* The parent event, previewed the same way its own collapsed tile looks
                    (eventCard.jsx, variant="manage", !isExpanded) — organizer/expiration/minted
                    stats live on the event, not the token, so this is its own fetch (eventDetail
                    above), not derivable from poap.* alone. */}
                <div className="poap-event-info-card">
                  <div className="d-flex align-items-stretch card-media-row">
                    <div className="card-media-thumb-wrap">
                      {eventMetadataLoading ? (
                        <div className="skeleton-block" style={{ width: "100%", height: "100%" }} />
                      ) : showBrokenEventImage ? (
                        <ImageOff size={20} className="card-media-thumb-broken-icon" />
                      ) : (
                        <img
                          className="card-media-thumb-photo"
                          src={eventMetadata.imageUrl}
                          alt=""
                          onError={() => setEventImgLoadError(true)}
                        />
                      )}
                    </div>
                    <div className="card-media-content">
                      <div className="d-flex align-items-start justify-content-between mb-1">
                        {eventMetadataLoading ? (
                          <div className="skeleton-block" style={{ height: "13px", width: "60%" }} />
                        ) : (
                          <h4 className="mb-0 text-truncate" style={{ fontSize: "13px", fontWeight: "600" }}>
                            {eventMetadata?.name || `Event ${truncateHex(poap.firstEventId)}`}
                          </h4>
                        )}
                        {eventStatusLabel && (
                          <span
                            className={`${eventStatusBadgeClass} flex-shrink-0 ml-2`}
                            style={{ fontSize: "9px", padding: "2px 6px" }}
                          >
                            {eventStatusLabel}
                          </span>
                        )}
                      </div>
                      <ul
                        className="list-unstyled mb-1 mt-1 d-flex flex-column justify-content-center"
                        style={{ fontSize: "11px" }}
                      >
                        <li className="d-flex align-items-center mb-1">
                          <img
                            className="mr-2"
                            src={eventOwnerIcon}
                            width="12"
                            height="12"
                            alt=""
                            style={{ flexShrink: 0 }}
                          />
                          <span className="text-muted small text-truncate">
                            {eventMetadata?.organization?.name || truncateHex(poap.issuerPkHex)}
                          </span>
                        </li>
                        {eventDetail && (
                          <li className="d-flex align-items-center">
                            <Calendar size={12} className="mr-2" style={{ flexShrink: 0 }} />
                            <span className="text-muted small">
                              {eventDetail.expiration > 0
                                ? formatDateToDDMMYYYY(new Date(eventDetail.expiration * 1000))
                                : "No expiry"}
                            </span>
                          </li>
                        )}
                      </ul>
                      {eventDetail && (
                        <div className="d-flex justify-content-between align-items-center">
                          <small className="text-muted" style={{ fontSize: "10px" }}>
                            Minted: <strong className="text-white">{eventDetail.minted}/{eventDetail.maxSupply || "∞"}</strong>
                          </small>
                          <CategoryBadge category={eventMetadata?.category} />
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <hr style={{ marginTop: "18px", marginBottom: "18px" }} />

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
                <button className="btn btn-card-detail-action btn-sm" onClick={copyShareLink} disabled={!midnight?.provider}>
                  {shareCopied ? "Link copied ✓" : "Copy share link"}
                </button>
                <small className="text-muted d-block mt-2">
                  Builds a link from data available right now: the token/issuer info is looked up
                  live from the public indexer — not something the link can prove on its own,
                  unlike the ZK-verified tx hash above.
                </small>
              </div>
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
