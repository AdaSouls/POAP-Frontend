import React, { forwardRef, useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Calendar, Info, X } from "lucide-react";
import { useDrawer, useDrawerDispatch } from "../contexts/drawer/drawer.provider";
import { useUserRoles } from "../contexts/user-roles/user-roles.provider";
import eventNormal from "../../images/svg/event-normal.svg";
import eventOwnerIcon from "../../icons/svg/collection-owner.svg";
import formatDateToDDMMYYYY from "../../utils/formatDateToDDMMYYYY";
import { getEventStatus } from "../../utils/poapHelpers";
import { getEvent, getTokensByEvent } from "../../midnight/indexer.service";

// Event data now comes entirely from the on-chain-only Midnight indexer (see
// src/midnight/indexer.service.ts) — there is no title/description/image metadata to show, only
// what the contract's ledger actually tracks: event id, organizer pk, supply, expiration, and
// active/public-mint flags.
const truncateHex = (hex) => {
  if (!hex) return "N/A";
  return `${hex.slice(0, 8)}…${hex.slice(-6)}`;
};

// Same collapsed/expanded dual-mode pattern as poapCard.jsx — same component instance either way
// (parent keeps it mounted across expand/collapse), forwardRef for AnimatePresence's
// mode="popLayout", layout on wrapper+card+icon, borderRadius/boxShadow set via style so
// framer-motion's layout FLIP auto-corrects them, and text hidden synchronously on click (fading
// out before the resize starts, back in only once onLayoutAnimationComplete fires).
const EventCard = forwardRef(({ event, isExpanded = false, onExpand = () => {}, onCollapse = () => {} }, ref) => {
  const status = getEventStatus(event);
  const { midnight: { provider } } = useDrawer();
  const { isAdmin, isIssuer } = useUserRoles();
  const dispatch = useDrawerDispatch();
  const canMintForEvent = isAdmin || (isIssuer && provider?.address === event.issuerPk);

  const openMintDrawer = () => {
    dispatch({ type: "CREATE_MINT", payload: event });
  };

  const statusBadgeClass = {
    active: "badge bg-success",
    expired: "badge bg-danger",
    full: "badge bg-warning",
    inactive: "badge bg-secondary",
  }[status];

  const available = event.maxSupply > 0 ? Math.max(0, event.maxSupply - event.minted) : undefined;
  const progressPercentage = event.maxSupply > 0 ? Math.min((event.minted / event.maxSupply) * 100, 100) : 0;

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

  // Fetched only once expanded — getAllEvents() (the page's own poll, event.* here) doesn't
  // include liveTokens, only GET /api/events/:id does.
  const [eventDetail, setEventDetail] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);

  useEffect(() => {
    if (!isExpanded) return undefined;
    let cancelled = false;
    setDetailLoading(true);
    getEvent(event.eventId)
      .then((detail) => {
        if (!cancelled) setEventDetail(detail);
      })
      .catch((error) => {
        console.error("Error loading event detail:", error);
      })
      .finally(() => {
        if (!cancelled) setDetailLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [isExpanded, event.eventId]);

  // The by-event token list only covers each token's *first* claim (see indexer.service.ts /
  // GET /api/events/:id/tokens comment) — matches eventDetail.liveTokens (non-burned first
  // claims), not total attendance.
  const [eventTokens, setEventTokens] = useState([]);
  const [tokensLoading, setTokensLoading] = useState(false);

  useEffect(() => {
    if (!isExpanded) return undefined;
    let cancelled = false;
    setTokensLoading(true);
    getTokensByEvent(event.eventId)
      .then((tokens) => {
        if (!cancelled) setEventTokens(tokens);
      })
      .catch((error) => {
        console.error("Error loading event tokens:", error);
      })
      .finally(() => {
        if (!cancelled) setTokensLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [isExpanded, event.eventId]);

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
      {/* .card-hover-group is a plain, padding-free wrapper — see poapCard.jsx's identical
          comment for why position:relative can't just live on the outer Bootstrap column
          (its own gutter padding made the peek wider than the card). Static sibling, not a
          child of the card that moves. */}
      <div className="card-hover-group">
        {!isExpanded && <div className="card-hover-peek" />}
        <motion.div
        layout
        className={`card card-event card-classic card-outline-only${isExpanded ? " card-detail-expanded" : ""}`}
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
              aria-label="Collapse event details"
            >
              <X size={16} />
            </button>
          )}

          {!isExpanded ? (
            // Collapsed grid tile: same square-not-circle, full-height thumbnail treatment as
            // poapCard.jsx's own collapsed tile — see .card-media-row/.card-media-thumb-wrap in
            // theme-dark-glass.css.
            <div className="d-flex align-items-stretch card-media-row">
              <motion.div layout className="card-media-thumb-wrap" style={textStyle}>
                <img className="card-media-thumb-icon" src={eventNormal} alt="" />
              </motion.div>
              <div className="card-media-content" style={textStyle}>
                <div className="d-flex align-items-start justify-content-between mb-1">
                  <h4 className="mb-0" style={{ fontSize: "15px", fontWeight: "600" }}>
                    Event {truncateHex(event.eventId)}
                  </h4>
                  {event.createdBlock && (
                    <small className="text-muted flex-shrink-0 ml-2" style={{ fontSize: "10px" }}>
                      Block: {event.createdBlock}
                    </small>
                  )}
                </div>
                <span
                  className={`${statusBadgeClass} text-capitalize mb-2`}
                  style={{ fontSize: "10px", padding: "2px 8px", alignSelf: "flex-start" }}
                >
                  {status}
                </span>

                <ul className="list-unstyled mb-2 mt-2" style={{ fontSize: "12px" }}>
                  <li className="d-flex align-items-center mb-1">
                    <img className="mr-2" src={eventOwnerIcon} width="14" height="14" alt="" style={{ flexShrink: 0 }} />
                    <span className="text-muted small">
                      Organizer: <span className="text-white">{truncateHex(event.issuerPk)}</span>
                    </span>
                    <span className="mx-2 text-muted">·</span>
                    <Calendar size={14} className="mr-1" />
                    <span className="text-muted small">
                      {event.expiration > 0 ? formatDateToDDMMYYYY(new Date(event.expiration * 1000)) : "No expiry"}
                    </span>
                  </li>
                  <li className="d-flex align-items-center">
                    <Info size={14} className="mr-2" style={{ width: "18px" }} />
                    <span className="text-muted small">{event.isPublicMint ? "Public mint" : "Organizer-minted"}</span>
                  </li>
                </ul>

                <div className="d-flex justify-content-between align-items-center mt-auto">
                  <small className="text-muted" style={{ fontSize: "11px" }}>
                    Minted: <strong className="text-white">{event.minted}/{event.maxSupply || "∞"}</strong>
                    {available !== undefined && (
                      <span className="ml-2">(Available: <strong className="text-white">{available}</strong>)</span>
                    )}
                  </small>
                  {status !== "active" ? (
                    <span className="btn btn-white btn-small disabled" style={{ fontSize: "11px", padding: "3px 10px" }}>
                      {status === "expired" ? "Expired" : status === "full" ? "Sold Out" : "Inactive"}
                    </span>
                  ) : (
                    <Link
                      to={`/my-subscriptions?eventId=${event.eventId}`}
                      className="btn btn-white btn-small"
                      style={{ fontSize: "11px", padding: "3px 10px" }}
                      onClick={(e) => e.stopPropagation()}
                    >
                      View POAPs
                    </Link>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="d-flex justify-content-start align-items-center mb-2">
              <motion.div layout className="card-media-thumb-small-wrap mr-3" style={textStyle}>
                <img src={eventNormal} alt="" />
              </motion.div>
              <div className="event-info flex-grow-1" style={textStyle}>
                <h4 className="mb-1" style={{ fontSize: "15px", fontWeight: "600" }}>
                  Event {truncateHex(event.eventId)}
                </h4>
                <span className={`${statusBadgeClass} text-capitalize`} style={{ fontSize: "10px", padding: "2px 8px" }}>
                  {status}
                </span>
              </div>
              {event.createdBlock && (
                <small className="text-muted flex-shrink-0" style={{ fontSize: "10px", ...textStyle }}>
                  Block: {event.createdBlock}
                </small>
              )}
            </div>
          )}

          {isExpanded && (
            <div className="mt-3" style={textStyle}>
              <p className="m-0 small text-muted mb-1">Event ID</p>
              <p className="m-0 mb-3 text-break small font-weight-semibold">{event.eventId}</p>

              <p className="m-0 small text-muted mb-1">Organizer</p>
              <p className="m-0 mb-3 text-break small font-weight-semibold">{event.issuerPk}</p>

              <hr className="my-4" />
              <h4 className="mb-3" style={{ fontSize: "16px" }}>Created</h4>
              <p className="m-0 mb-1 small">
                Block: <span className="text-white">{event.createdBlock ?? "N/A"}</span>
              </p>
              {event.createdTx && (
                <p className="m-0 mb-3 text-break small">
                  Tx: <code className="small">{event.createdTx}</code>
                </p>
              )}

              {!event.isActive && event.deactivatedBlock && (
                <p className="text-muted small mb-3">
                  Deactivated at block <span className="text-white">{event.deactivatedBlock}</span>.
                </p>
              )}

              <hr className="my-4" />
              <h4 className="mb-3" style={{ fontSize: "16px" }}>POAPs from this event</h4>
              {detailLoading ? (
                <p className="text-muted small mb-0">Loading…</p>
              ) : (
                <p className="m-0 mb-1">
                  <span className="text-white" style={{ fontSize: "20px", fontWeight: 700 }}>
                    {eventDetail?.liveTokens ?? "—"}
                  </span>
                  <span className="text-muted small ml-2">
                    live token{eventDetail?.liveTokens === 1 ? "" : "s"}
                  </span>
                </p>
              )}
              {tokensLoading ? (
                <p className="text-muted small mb-0 mt-2">Loading holders…</p>
              ) : eventTokens.length > 0 ? (
                <div className="event-token-list mt-2" style={{ maxHeight: 220, overflowY: "auto" }}>
                  {eventTokens.map((token) => (
                    <div
                      key={token.tokenId}
                      className="d-flex align-items-center justify-content-between py-1"
                      style={{ borderBottom: "1px solid var(--glass-border)", fontSize: "12px" }}
                    >
                      <span className="text-muted">
                        #{token.tokenId} <span className="text-white">{truncateHex(token.ownerPk)}</span>
                      </span>
                      {token.isBurned && (
                        <span className="badge bg-secondary" style={{ fontSize: "9px" }}>
                          Burned
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted small mb-0 mt-2">No POAPs minted for this event yet.</p>
              )}

              {canMintForEvent && (
                <>
                  <hr className="my-4" />
                  <h4 className="mb-3" style={{ fontSize: "16px" }}>Mint to Recipient</h4>
                  <p className="text-muted small mb-2">
                    Push-mint a POAP directly to a wallet, without them needing to claim it
                    themselves.
                  </p>
                  <button
                    type="button"
                    className="btn btn-sm btn-outline-secondary"
                    onClick={openMintDrawer}
                  >
                    Mint POAP
                  </button>
                </>
              )}
            </div>
          )}
        </div>

        {/* Minted bar — the one element that sits flush against the card's own bottom edge,
            outside card-body's padding, instead of just being "near the bottom" inside it. */}
        {event.maxSupply > 0 && (
          <div className="card-event-minted-bar">
            <div
              className="card-event-minted-bar-fill"
              role="progressbar"
              style={{ width: `${progressPercentage}%` }}
              aria-valuenow={progressPercentage}
              aria-valuemin="0"
              aria-valuemax="100"
            ></div>
          </div>
        )}
        </motion.div>
      </div>
    </motion.div>
  );
});

EventCard.displayName = "EventCard";

export default EventCard;
