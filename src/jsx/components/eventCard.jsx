import React, { forwardRef, useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import { Calendar, ImageOff, Info, X } from "lucide-react";
import { useDrawer, useDrawerDispatch } from "../contexts/drawer/drawer.provider";
import { useUserRoles } from "../contexts/user-roles/user-roles.provider";
import Tooltip from "./Tooltip";
import eventOwnerIcon from "../../icons/svg/collection-owner.svg";
import formatDateToDDMMYYYY from "../../utils/formatDateToDDMMYYYY";
import { getEventStatus } from "../../utils/poapHelpers";
import { getEvent, getTokensByEvent } from "../../midnight/indexer.service";
import { getPrivateEventDraft } from "../../midnight/private-event-metadata";
import { getPrivateContentSignedUrl } from "../../services/ipfs.service";
import { errorFunction, loadingFunction, succesfullBlockchainCreation } from "../toasts/sweetAlerts";
import { useEventMetadata } from "../hooks/useEventMetadata";

const truncateHex = (hex) => {
  if (!hex) return "N/A";
  return `${hex.slice(0, 8)}…${hex.slice(-6)}`;
};

// Same collapsed/expanded dual-mode pattern as poapCard.jsx — same component instance either way
// (parent keeps it mounted across expand/collapse), forwardRef for AnimatePresence's
// mode="popLayout", layout on wrapper+card+icon, borderRadius/boxShadow set via style so
// framer-motion's layout FLIP auto-corrects them, and text hidden synchronously on click (fading
// out before the resize starts, back in only once onLayoutAnimationComplete fires).
const EventCard = forwardRef(({
  event,
  isExpanded = false,
  onExpand = () => {},
  onCollapse = () => {},
  variant = "manage",
  onClaim = () => {},
}, ref) => {
  const status = getEventStatus(event);
  const { metadata, loading: metadataLoading } = useEventMetadata(event.metadataURI);
  // Tracks a failed <img> load (bad/expired gateway URL etc.) separately from "still fetching" —
  // both render the same broken-image icon instead of ever falling back to a stale previously-
  // loaded image or the old generic placeholder icon, per explicit request: no old/wrong image,
  // ever, while the real one isn't confirmed available.
  const [imgLoadError, setImgLoadError] = useState(false);
  useEffect(() => {
    setImgLoadError(false);
  }, [metadata?.imageUrl]);
  // Split from metadataLoading on purpose — a still-loading card shows the pulsing skeleton
  // (.skeleton-block below), not this broken-image icon, so a slow IPFS fetch doesn't read as
  // "something failed." showBrokenImage is only the genuine no-image/failed-load case, once
  // loading has actually finished one way or the other.
  const showBrokenImage = !metadataLoading && (!metadata?.imageUrl || imgLoadError);
  const { midnight: { provider } } = useDrawer();
  const { isAdmin } = useUserRoles();
  const dispatch = useDrawerDispatch();
  // Force-hidden under variant="explore" even though it's already naturally excluded there today
  // (Explore Events never lists the viewer's own events) — defense-in-depth against a future
  // change that renders this variant for an event the viewer does organize.
  // Ownership (not the separate isIssuer "verified organizer" badge) is what actually gates
  // minting on-chain — event creation is permissionless now, matching the contract's own mintTo
  // authorization (is_admin() || ev.organizer == caller_pk()).
  // !event.isPublicMint is a frontend-only restriction on top of that: the contract itself doesn't
  // forbid push-minting into a public event, but public events are meant to be self-claimed via
  // claim() (see createPoap.jsx/"Subscribe") — push-minting into one would silently bypass
  // that flow, so the organizer-mint UI only offers this for the organizer's own private
  // (organizer-minted) events.
  const canMintForEvent =
    variant !== "explore" && !event.isPublicMint && (isAdmin || provider?.address === event.issuerPk);

  // Private-event metadata (commit/reveal) — only ever shown to the actual owner (not just any
  // admin: reveal needs the (value, rand) pair only the creating browser ever had, see
  // private-event-metadata.ts) and only if this exact browser is the one that created it —
  // independent of whether the EVENT itself is public or private, since the extra-info field has
  // its own public/private switch in createEvent.jsx now. No local draft (different device,
  // cleared storage, field left public, or no extra info at all) means nothing to show — see
  // private-event-metadata.ts's accepted limitation.
  const isOwner = provider?.address === event.issuerPk;
  const privateDraft = useMemo(
    () => (isOwner ? getPrivateEventDraft(event.eventId) : null),
    [isOwner, event.eventId],
  );
  const [revealStatus, setRevealStatus] = useState("checking"); // "checking" | "not-revealed" | "revealed"
  const [revealedNotes, setRevealedNotes] = useState(null);
  const [revealing, setRevealing] = useState(false);

  useEffect(() => {
    if (!isExpanded || !privateDraft || !provider) return undefined;
    let cancelled = false;
    setRevealStatus("checking");
    provider.service
      .getState()
      .then(({ ledger }) => {
        if (cancelled) return null;
        const eventIdBytes = Uint8Array.from(Buffer.from(event.eventId, "hex"));
        if (!ledger.eventRevealedMetadata.member(eventIdBytes)) {
          setRevealStatus("not-revealed");
          return null;
        }
        setRevealStatus("revealed");
        // Fetched via the signed-URL path (not read back from localStorage) specifically to prove
        // the on-chain value → CID → content round trip actually works, not just that this browser
        // remembers what it typed in.
        return getPrivateContentSignedUrl(privateDraft.valueHex)
          .then((url) => fetch(url))
          .then((response) => response.json())
          .then((json) => {
            if (!cancelled) setRevealedNotes(json?.notes ?? null);
          });
      })
      .catch((error) => {
        console.error("Error checking private-metadata reveal status:", error);
        if (!cancelled) setRevealStatus("not-revealed");
      });
    return () => {
      cancelled = true;
    };
  }, [isExpanded, privateDraft, provider, event.eventId]);

  const handleReveal = async () => {
    if (!privateDraft || !provider) return;
    setRevealing(true);
    try {
      loadingFunction("Revealing Private Info", "Please confirm the transaction in your Lace wallet…", "");
      const eventIdBytes = Uint8Array.from(Buffer.from(event.eventId, "hex"));
      const valueBytes = Uint8Array.from(Buffer.from(privateDraft.valueHex, "hex"));
      const randBytes = Uint8Array.from(Buffer.from(privateDraft.randHex, "hex"));
      const { txHash } = await provider.service.revealPrivateMetadata(eventIdBytes, valueBytes, randBytes);
      setRevealStatus("revealed");
      const url = await getPrivateContentSignedUrl(privateDraft.valueHex);
      const response = await fetch(url);
      const json = await response.json();
      setRevealedNotes(json?.notes ?? null);
      succesfullBlockchainCreation("Private Info Revealed", `Transaction: ${txHash}`, "");
    } catch (error) {
      console.error("Error revealing private metadata:", error);
      errorFunction("Error", error.message || "Failed to reveal private info. Please try again.", "");
    } finally {
      setRevealing(false);
    }
  };

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

          {!isExpanded ? (
            // Collapsed grid tile: same square-not-circle, full-height thumbnail treatment as
            // poapCard.jsx's own collapsed tile — see .card-media-row/.card-media-thumb-wrap in
            // theme-dark-glass.css.
            <div className="d-flex align-items-stretch card-media-row">
              <motion.div layout className="card-media-thumb-wrap" style={textStyle}>
                {metadataLoading ? (
                  <div className="skeleton-block" style={{ width: "100%", height: "100%" }} />
                ) : showBrokenImage ? (
                  <ImageOff size={22} className="card-media-thumb-broken-icon" />
                ) : (
                  <img
                    className="card-media-thumb-photo"
                    src={metadata.imageUrl}
                    alt=""
                    onError={() => setImgLoadError(true)}
                  />
                )}
              </motion.div>
              <div className="card-media-content" style={textStyle}>
                <div className="d-flex align-items-start justify-content-between mb-1">
                  {metadataLoading ? (
                    <div className="skeleton-block" style={{ height: "15px", width: "60%" }} />
                  ) : (
                    <h4 className="mb-0" style={{ fontSize: "15px", fontWeight: "600" }}>
                      {metadata?.name || `Event ${truncateHex(event.eventId)}`}
                    </h4>
                  )}
                  <span
                    className={`${statusBadgeClass} text-capitalize flex-shrink-0 ml-2`}
                    style={{ fontSize: "10px", padding: "2px 8px" }}
                  >
                    {status}
                  </span>
                </div>
                {metadataLoading ? (
                  <div className="skeleton-block mb-2" style={{ height: "11px", width: "85%" }} />
                ) : (
                  metadata?.description && (
                    <p
                      className="text-muted small mb-2"
                      style={{
                        fontSize: "11px",
                        display: "-webkit-box",
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: "vertical",
                        overflow: "hidden",
                      }}
                    >
                      {metadata.description}
                    </p>
                  )
                )}

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
                  ) : variant === "explore" ? (
                    <button
                      type="button"
                      className="btn btn-white btn-small"
                      style={{ fontSize: "11px", padding: "3px 10px" }}
                      onClick={(e) => {
                        e.stopPropagation();
                        onClaim(event);
                      }}
                    >
                      Subscribe
                    </button>
                  ) : canMintForEvent ? (
                    <button
                      type="button"
                      className="btn btn-white btn-small"
                      style={{ fontSize: "11px", padding: "3px 10px" }}
                      onClick={(e) => {
                        e.stopPropagation();
                        openMintDrawer();
                      }}
                    >
                      Mint POAP
                    </button>
                  ) : null}
                </div>
              </div>
            </div>
          ) : (
            <div className="row" style={textStyle}>
              {/* Left column: identity (image + status/name/description stacked beside it), then a
                  divider, then quick facts (organizer/expiration/public-mint/minted-available),
                  then a second divider, then raw blockchain detail — mirrors the collapsed tile's
                  own icon language so the two states read as the same event, just more or less
                  detail. The two dividers use the card body's own top padding (18px) as their
                  vertical gap, so the whole column reads as evenly-spaced blocks. */}
              <div className="col-md-7">
                <div className="d-flex align-items-start">
                  <motion.div layout className="card-media-thumb-wrap mr-3">
                    {metadataLoading ? (
                      <div className="skeleton-block" style={{ width: "100%", height: "100%" }} />
                    ) : showBrokenImage ? (
                      <ImageOff size={22} className="card-media-thumb-broken-icon" />
                    ) : (
                      <img
                        className="card-media-thumb-photo"
                        src={metadata.imageUrl}
                        alt=""
                        onError={() => setImgLoadError(true)}
                      />
                    )}
                  </motion.div>
                  <div>
                    <span
                      className={`${statusBadgeClass} text-capitalize`}
                      style={{ fontSize: "11px", padding: "3px 10px" }}
                    >
                      {status}
                    </span>
                    {metadataLoading ? (
                      <div className="skeleton-block mt-2" style={{ height: "16px", width: "160px" }} />
                    ) : (
                      <h4 className="mt-2 mb-1" style={{ fontSize: "16px", fontWeight: "600" }}>
                        {metadata?.name || `Event ${truncateHex(event.eventId)}`}
                      </h4>
                    )}
                    {metadataLoading ? (
                      <div className="skeleton-block mt-2" style={{ height: "12px", width: "220px" }} />
                    ) : (
                      metadata?.description && (
                        <p className="text-muted small mb-0">{metadata.description}</p>
                      )
                    )}
                    {/* Extra info the organizer opted to make public (see createEvent.jsx's own
                        public/private switch for this field) — same metadataURI JSON as
                        name/description, visible to anyone, no reveal needed. Not to be confused
                        with the owner-only private-info block further down. */}
                    {metadata?.notes && (
                      <p className="text-muted small mb-0 mt-1">{metadata.notes}</p>
                    )}
                  </div>
                </div>

                <hr style={{ marginTop: "18px", marginBottom: "18px" }} />

                <ul className="list-unstyled mb-0" style={{ fontSize: "12px" }}>
                  <li className="d-flex align-items-center mb-2">
                    <img className="mr-2" src={eventOwnerIcon} width="14" height="14" alt="" style={{ flexShrink: 0 }} />
                    <span className="text-muted small">
                      Organizer: <span className="text-white">{truncateHex(event.issuerPk)}</span>
                    </span>
                  </li>
                  <li className="d-flex align-items-center mb-2">
                    <Calendar size={14} className="mr-2" style={{ flexShrink: 0 }} />
                    <span className="text-muted small">
                      {event.expiration > 0 ? formatDateToDDMMYYYY(new Date(event.expiration * 1000)) : "No expiry"}
                    </span>
                  </li>
                  <li className="d-flex align-items-center mb-2">
                    <Info size={14} className="mr-2" style={{ flexShrink: 0, width: "18px" }} />
                    <span className="text-muted small">{event.isPublicMint ? "Public mint" : "Organizer-minted"}</span>
                  </li>
                  <li className="d-flex align-items-center" style={{ paddingLeft: "22px" }}>
                    <span className="text-muted small">
                      Minted: <span className="text-white">{event.minted}/{event.maxSupply || "∞"}</span>
                      {available !== undefined && (
                        <> · Available: <span className="text-white">{available}</span></>
                      )}
                    </span>
                  </li>
                </ul>

                <hr style={{ marginTop: "18px", marginBottom: "18px" }} />

                <div className="mb-3">
                  <p className="m-0 small text-muted mb-1">Event ID</p>
                  <p className="m-0 text-break small font-weight-semibold">{event.eventId}</p>
                </div>

                <div className="mb-3">
                  <p className="m-0 small text-muted mb-1">Organizer</p>
                  <p className="m-0 text-break small font-weight-semibold">{event.issuerPk}</p>
                </div>

                <div className="mb-3">
                  <p className="m-0 small text-muted mb-1">Block</p>
                  <p className="m-0 text-break small font-weight-semibold">{event.createdBlock ?? "N/A"}</p>
                </div>

                {event.createdTx && (
                  <div className="mb-0">
                    <p className="m-0 small text-muted mb-1">Tx</p>
                    <p className="m-0 text-break small font-weight-semibold">{event.createdTx}</p>
                  </div>
                )}

                {privateDraft && (
                  <div className="mt-3">
                    <p className="m-0 small text-muted mb-1">Private Info</p>
                    {revealStatus === "checking" ? (
                      <p className="text-muted small mb-0">Checking reveal status…</p>
                    ) : (
                      <>
                        <p className="m-0 text-break small font-weight-semibold mb-2">
                          {revealStatus === "revealed" ? revealedNotes : privateDraft.notes}
                        </p>
                        {revealStatus === "revealed" ? (
                          <span className="badge bg-success">Revealed</span>
                        ) : (
                          <button
                            type="button"
                            className="btn btn-card-detail-action btn-sm"
                            onClick={handleReveal}
                            disabled={revealing}
                          >
                            {revealing ? "Revealing…" : "Reveal"}
                          </button>
                        )}
                      </>
                    )}
                  </div>
                )}

                {!event.isActive && event.deactivatedBlock && (
                  <p className="text-muted small mt-3 mb-0">
                    Deactivated at block <span className="text-white">{event.deactivatedBlock}</span>.
                  </p>
                )}
              </div>

              {/* Right column: a small inline header (mint/subscribe action on the left, "POAPs"
                  title centered on the column regardless of whether that action button is present,
                  collapse button on the right) followed by the POAPs themselves as a grid of small
                  icons (same treatment as the event image, just at .card-media-thumb-small-wrap's
                  size — every token from this event shares the event's own metadataURI/image,
                  there's no separate per-token image in this data model). */}
              <div className="col-md-5" style={{ borderLeft: "1px solid var(--glass-border)", paddingLeft: "20px" }}>
                <div className="d-flex align-items-center justify-content-between mb-3" style={{ position: "relative", minHeight: "30px" }}>
                  <div>
                    {canMintForEvent && (
                      <button
                        type="button"
                        className="btn btn-card-detail-action btn-sm"
                        onClick={openMintDrawer}
                      >
                        Mint POAP
                      </button>
                    )}

                    {variant === "explore" && (
                      <button
                        type="button"
                        className="btn btn-card-detail-action btn-sm"
                        onClick={() => onClaim(event)}
                        disabled={status !== "active"}
                      >
                        Subscribe
                      </button>
                    )}
                  </div>

                  <h5
                    className="m-0"
                    style={{
                      position: "absolute",
                      left: "50%",
                      transform: "translateX(-50%)",
                      fontSize: "14px",
                      fontWeight: "600",
                    }}
                  >
                    POAPs
                  </h5>

                  <button
                    type="button"
                    className="card-expand-close-btn card-expand-close-btn-inline"
                    onClick={handleCollapse}
                    aria-label="Collapse event details"
                  >
                    <X size={16} />
                  </button>
                </div>

                <p className="small text-muted mb-2">
                  {detailLoading
                    ? "Loading…"
                    : `${eventDetail?.liveTokens ?? "—"} live token${eventDetail?.liveTokens === 1 ? "" : "s"}`}
                </p>

                {tokensLoading ? (
                  <p className="text-muted small">Loading…</p>
                ) : eventTokens.length > 0 ? (
                  <div className="d-flex flex-wrap" style={{ gap: "8px", maxHeight: 220, overflowY: "auto" }}>
                    {eventTokens.map((token) => (
                      <Tooltip key={token.tokenId} label={metadata?.name || `Event ${truncateHex(event.eventId)}`}>
                        <div className="card-media-thumb-small-wrap" style={{ position: "relative" }}>
                          {metadataLoading ? (
                            <div className="skeleton-block" style={{ width: "100%", height: "100%" }} />
                          ) : showBrokenImage ? (
                            <ImageOff size={14} className="card-media-thumb-broken-icon" />
                          ) : (
                            <img className="card-media-thumb-photo" src={metadata.imageUrl} alt="" />
                          )}
                          {token.isBurned && (
                            <span
                              className="badge bg-secondary"
                              style={{ position: "absolute", bottom: -6, right: -6, fontSize: "8px", padding: "1px 4px" }}
                            >
                              Burned
                            </span>
                          )}
                        </div>
                      </Tooltip>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted small text-center mt-4">No POAPs minted for this event yet.</p>
                )}
              </div>
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
