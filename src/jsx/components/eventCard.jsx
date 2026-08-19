import { forwardRef, useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import Chart from "react-apexcharts";
import { Calendar, Check, Copy, Hash, ImageOff, Info, X } from "lucide-react";
import { useDrawer, useDrawerDispatch } from "../contexts/drawer/drawer.provider";
import { useUserRoles } from "../contexts/user-roles/user-roles.provider";
import Tooltip from "./Tooltip";
import eventOwnerIcon from "../../icons/svg/collection-owner.svg";
import formatDateToDDMMYYYY from "../../utils/formatDateToDDMMYYYY";
import { getEventStatus } from "../../utils/poapHelpers";
import { getEvent, getTokensByEvent, getTokensByOwner } from "../../midnight/indexer.service";
import { getPrivateEventDraft } from "../../midnight/private-event-metadata";
import { getPrivateContentSignedUrl } from "../../services/ipfs.service";
import { errorFunction, loadingFunction, succesfullBlockchainCreation } from "../toasts/sweetAlerts";
import { useEventMetadata } from "../hooks/useEventMetadata";
import CategoryBadge from "./CategoryBadge";
import { getCategoryConfig } from "../constants/eventCategories";

// Breaks the category's taxonomy fields (e.g. "event" → orgType/modality/purpose/eventType) back
// into label+display-value pairs for the expanded card's quick-facts block — the flattened form
// serializeTaxonomyValues (eventCategories.js) wrote into metadata at creation time. "Other" values
// show the organizer's own free text instead of the literal "other" option label. Legacy events
// without a category, or without a category recognized by the current EVENT_CATEGORIES config,
// simply have nothing to show — same "tolerate absence" approach as the rest of this file.
function getTaxonomyEntries(categoryKey, metadata) {
  const category = getCategoryConfig(categoryKey);
  if (!category || !metadata) return [];
  return Object.entries(category.taxonomy)
    .map(([field, def]) => {
      const value = metadata[field];
      if (!value) return null;
      const displayValue =
        value === "other"
          ? metadata[`${field}Other`] || "Other"
          : def.options.find((option) => option.value === value)?.label || value;
      return { field, label: def.label, value: displayValue };
    })
    .filter(Boolean);
}

const truncateHex = (hex) => {
  if (!hex) return "N/A";
  return `${hex.slice(0, 8)}…${hex.slice(-6)}`;
};

// This card renders both the collapsed grid tile and the expanded detail view — same component
// instance either way (parent keeps it mounted, keyed by eventId, across expand/collapse), so
// framer-motion's `layout` prop FLIP-animates the resize in place, exactly like poapCard.jsx (see
// that file's own comment for the forwardRef/AnimatePresence-popLayout rationale — identical here).
// This used to be a separate floating position:fixed overlay, handed off from a "ghost" placeholder
// left in the grid via a shared layoutId between two mounted instances. That kept every other
// (still individually blurred-glass) card in the grid visible and painted throughout the whole
// resize animation, which was the main source of jank — switching to in-place expansion, plus the
// calling pages (myEvents.jsx/exploreEvents.jsx/mySubscriptions.jsx) now omitting non-expanded
// siblings from the grid entirely while one card is open, fixes both that and the expanded card's
// width no longer matching the grid (it's col-12 now, same as poapCard.jsx's own expanded width).
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
  const taxonomyEntries = useMemo(
    () => getTaxonomyEntries(metadata?.category, metadata),
    [metadata],
  );
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
  // Generalized copy-button state for the expanded card's blockchain-data block (Event ID /
  // Organizer / Block / Tx) — keyed by field name rather than one bool per field, so adding a copy
  // button to any of them doesn't need its own piece of state. The Organizer one is the field a
  // subscriber actually needs, to generate their own holder key (see getHolderKey.jsx).
  const [copiedField, setCopiedField] = useState(null);
  const copyField = (field, value) => {
    navigator.clipboard?.writeText(value);
    setCopiedField(field);
    setTimeout(() => setCopiedField((current) => (current === field ? null : current)), 2000);
  };
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
      loadingFunction("Revealing Private Info", `Please confirm the transaction in your ${provider.wallet} wallet…`, "");
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
    active: "badge status-badge-active",
    expired: "badge bg-danger",
    full: "badge bg-warning",
    inactive: "badge bg-secondary",
  }[status];

  const available = event.maxSupply > 0 ? Math.max(0, event.maxSupply - event.minted) : undefined;
  const progressPercentage = event.maxSupply > 0 ? Math.min((event.minted / event.maxSupply) * 100, 100) : 0;

  // Fetched only while expanded — getAllEvents() (the page's own poll, event.* here) doesn't
  // include liveTokens, only GET /api/events/:id does, and the collapsed tile never shows this
  // content so has no reason to fetch it too.
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

  // Token breakdown donut for the organizer's own view (variant !== "explore") — what "counts" as
  // a segment depends on the event: unlimited-supply events (maxSupply === 0) have no "Available"
  // slice, and an event nobody has burned from has no "Burned" slice, so segments are built up
  // conditionally and zero-value ones dropped, rather than always rendering a fixed 3-slice chart.
  // liveTokens (from GET /api/events/:id, non-burned first claims) vs. event.minted (all-time
  // first claims, burned or not) is what makes "Burned" derivable without its own indexer field.
  const liveTokens = eventDetail?.liveTokens;
  const burnedTokens = liveTokens !== undefined ? Math.max(0, event.minted - liveTokens) : undefined;
  const statsSegments = useMemo(() => {
    if (detailLoading || liveTokens === undefined) return [];
    const segments = [{ label: "Subscribed", value: liveTokens, color: "#34c38f" }];
    if (burnedTokens > 0) segments.push({ label: "Burned", value: burnedTokens, color: "#74788d" });
    if (event.maxSupply > 0) segments.push({ label: "Available", value: available ?? 0, color: "rgba(196,205,246,0.4)" });
    return segments.filter((segment) => segment.value > 0);
  }, [detailLoading, liveTokens, burnedTokens, event.maxSupply, available]);
  const statsChartOptions = {
    labels: statsSegments.map((segment) => segment.label),
    colors: statsSegments.map((segment) => segment.color),
    legend: { position: "bottom", labels: { colors: "#c4cdf6" } },
    dataLabels: { enabled: true },
    stroke: { colors: ["#10206e"] },
    chart: { foreColor: "#c4cdf6" },
    tooltip: { theme: "dark" },
  };
  const statsChartSeries = statsSegments.map((segment) => segment.value);

  // The by-event token list only covers each token's *first* claim (see indexer.service.ts /
  // GET /api/events/:id/tokens comment) — matches eventDetail.liveTokens (non-burned first
  // claims), not total attendance. Only rendered for variant="manage" (the icon grid) — a
  // subscriber viewing variant="explore" gets a single preview card instead (every self-claimed
  // token shares the event's own image anyway), so skip the fetch there entirely.
  const [eventTokens, setEventTokens] = useState([]);
  const [tokensLoading, setTokensLoading] = useState(false);

  useEffect(() => {
    if (!isExpanded || variant === "explore") return undefined;
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
  }, [isExpanded, variant, event.eventId]);

  // Whether the connected wallet already holds a (non-burned) token for this event — same
  // holder-pk derivation my-tokens.ts uses for "My Subscriptions", just scoped to one event/issuer
  // instead of the whole list, so the subscriber-facing preview card can say "Subscribed" and the
  // Subscribe action can be disabled instead of reverting on-chain ("Wallet already claimed this
  // event") on a second attempt.
  const [subscriptionCheck, setSubscriptionCheck] = useState({ loading: false, subscribed: false });

  useEffect(() => {
    if (!isExpanded || variant !== "explore" || !provider) {
      setSubscriptionCheck({ loading: false, subscribed: false });
      return undefined;
    }
    let cancelled = false;
    setSubscriptionCheck({ loading: true, subscribed: false });
    const issuerIdBytes = Uint8Array.from(Buffer.from(event.issuerPk, "hex"));
    provider.service
      .getHolderPkHex(issuerIdBytes)
      .then((holderPkHex) => getTokensByOwner(holderPkHex))
      .then((tokens) => {
        if (cancelled) return;
        const subscribed = tokens.some((token) => token.firstEventId === event.eventId && !token.isBurned);
        setSubscriptionCheck({ loading: false, subscribed });
      })
      .catch((error) => {
        console.error("Error checking existing subscription:", error);
        if (!cancelled) setSubscriptionCheck({ loading: false, subscribed: false });
      });
    return () => {
      cancelled = true;
    };
  }, [isExpanded, variant, provider, event.issuerPk, event.eventId]);

  // Text reflows (wrapping, line-count changes) as the card's width/height FLIP-animates, which
  // looks janky since framer-motion only interpolates the box, not text layout — same problem and
  // same fix as poapCard.jsx: fade the content out first, THEN trigger the actual expand/collapse
  // once the fade has finished (the resize starts only after that, via the delayed onExpand/
  // onCollapse below), and fade back in only once `onLayoutAnimationComplete` confirms the resize
  // itself is done.
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
              /* Collapsed grid tile: same square-not-circle, full-height thumbnail treatment as
                 poapCard.jsx's own collapsed tile — see .card-media-row/.card-media-thumb-wrap in
                 theme-dark-glass.css. */
              <div className="d-flex align-items-stretch card-media-row">
                {/* The image is never part of textStyle's fade — only text fades out before the
                    resize and back in after; the image stays visible throughout. */}
                <motion.div layout className="card-media-thumb-wrap">
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
                  <ul
                    className="list-unstyled mb-2 mt-2 d-flex flex-column justify-content-center flex-grow-1"
                    style={{ fontSize: "12px" }}
                  >
                    <li className="d-flex align-items-center mb-1">
                      <img className="mr-2" src={eventOwnerIcon} width="14" height="14" alt="" style={{ flexShrink: 0 }} />
                      <span className="text-muted small">
                        Organizer: <span className="text-white">{metadata?.organization?.name || truncateHex(event.issuerPk)}</span>
                      </span>
                    </li>
                    <li className="d-flex align-items-center mb-1">
                      <Calendar size={14} className="mr-2" style={{ flexShrink: 0, width: "14px" }} />
                      <span className="text-muted small">
                        {event.expiration > 0 ? formatDateToDDMMYYYY(new Date(event.expiration * 1000)) : "No expiry"}
                      </span>
                    </li>
                    <li className="d-flex align-items-center">
                      <Info size={14} className="mr-2" style={{ flexShrink: 0, width: "14px" }} />
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
                    {/* Actions (Subscribe/Mint POAP) live only in the expanded card now — the
                        collapsed tile is click-to-expand, not a place to act from. This slot,
                        previously the action button, instead shows the category badge. */}
                    <CategoryBadge category={metadata?.category} />
                  </div>
                </div>
              </div>
            ) : (
              /* Expanded detail: left column is identity (image + status/category/name/description
                 stacked beside it), then a divider, then quick facts (organizer/expiration/public-
                 mint/minted-available) beside a taxonomy breakdown column, then optional channels/
                 organization block, then raw blockchain detail. Right column is a small inline
                 header (mint/subscribe action, collapse button) followed by the POAP preview/stats.
                 textStyle fades the TEXT out before the resize and back in after (TEXT_FADE_MS
                 above) — applied to each text container individually, deliberately never to the
                 thumbnail itself or its wrapping row, so the image stays visible throughout. */
              <div className="row">
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
                    <div style={{ flex: 1, minWidth: 0, ...textStyle }}>
                      <div className="d-flex align-items-center justify-content-between">
                        <span
                          className={`${statusBadgeClass} text-capitalize`}
                          style={{ fontSize: "11px", padding: "3px 10px" }}
                        >
                          {status}
                        </span>
                        <CategoryBadge category={metadata?.category} />
                      </div>
                      {metadataLoading ? (
                        <div className="skeleton-block mt-2" style={{ height: "16px", width: "160px" }} />
                      ) : (
                        <h4 className="mt-2 mb-2" style={{ fontSize: "16px", fontWeight: "600" }}>
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

                  <div style={textStyle}>
                  <hr style={{ marginTop: "18px", marginBottom: "18px" }} />

                  <div className="row no-gutters">
                    <div className={taxonomyEntries.length > 0 ? "col-6" : "col-12"}>
                      <ul className="list-unstyled mb-0" style={{ fontSize: "12px" }}>
                        <li className="d-flex align-items-center mb-2">
                          <span className="quick-fact-icon">
                            <img src={eventOwnerIcon} width="14" height="14" alt="" />
                          </span>
                          <span className="text-muted small">
                            Organizer:{" "}<span className="text-white">{metadata?.organization?.name || truncateHex(event.issuerPk)}</span>
                          </span>
                        </li>
                        <li className="d-flex align-items-center mb-2">
                          <span className="quick-fact-icon">
                            <Calendar size={14} />
                          </span>
                          <span className="text-muted small">
                            {event.expiration > 0 ? formatDateToDDMMYYYY(new Date(event.expiration * 1000)) : "No expiry"}
                          </span>
                        </li>
                        <li className="d-flex align-items-center mb-2">
                          <span className="quick-fact-icon">
                            <Info size={14} />
                          </span>
                          <span className="text-muted small">{event.isPublicMint ? "Public mint" : "Organizer-minted"}</span>
                        </li>
                        <li className="d-flex align-items-center">
                          <span className="quick-fact-icon">
                            <Hash size={14} />
                          </span>
                          <span className="text-muted small">
                            Minted:{" "}<span className="text-white">{event.minted}/{event.maxSupply || "∞"}</span>
                            {available !== undefined && (
                              <> · Available:{" "}<span className="text-white">{available}</span></>
                            )}
                          </span>
                        </li>
                      </ul>
                    </div>

                    {/* Second column: the taxonomy answers collected at creation time (organizer
                        type, format, purpose, event/credential type — whichever fields this event's
                        category has, see eventCategories.js) — broken out individually rather than
                        left buried in the raw metadata JSON. Rows use the same d-flex/mb-2 rhythm as
                        the first column (even without an icon of their own) so each row's height
                        matches its counterpart across the two columns line for line. */}
                    {taxonomyEntries.length > 0 && (
                      <div className="col-6">
                        <ul className="list-unstyled mb-0" style={{ fontSize: "12px" }}>
                          {taxonomyEntries.map((entry) => (
                            <li className="d-flex align-items-center mb-2" key={entry.field}>
                              <span className="text-muted small">{entry.label}:{" "}</span>
                              <span className="text-white small">{entry.value}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>

                  {(metadata?.channels?.length > 0 || metadata?.organization) && (
                    <>
                      <hr style={{ marginTop: "18px", marginBottom: "18px" }} />
                      <ul className="list-unstyled mb-0" style={{ fontSize: "12px" }}>
                        {metadata.channels?.map((channel, index) => (
                          <li className="mb-1" key={index}>
                            <span className="text-muted small text-capitalize">{channel.type}:{" "}</span>
                            <span className="text-white small">{channel.value}</span>
                          </li>
                        ))}
                        {metadata.organization && (
                          <li className="mt-1">
                            <span className="text-muted small">
                              {[
                                metadata.organization.addressLine,
                                metadata.organization.locality,
                                metadata.organization.region,
                                metadata.organization.country,
                                metadata.organization.postalCode,
                              ]
                                .filter(Boolean)
                                .join(", ")}
                            </span>
                          </li>
                        )}
                      </ul>
                    </>
                  )}

                  <hr style={{ marginTop: "18px", marginBottom: "18px" }} />

                  <BlockchainField label="Event ID" value={event.eventId} />
                  <BlockchainField
                    label="Organizer"
                    value={event.issuerPk}
                    copied={copiedField === "organizer"}
                    onCopy={() => copyField("organizer", event.issuerPk)}
                    copyAriaLabel="Copy organizer key"
                    hint="Share this with a subscriber so they can generate their own key for you (My Subscriptions → Get My Key)."
                  />
                  <BlockchainField label="Block" value={event.createdBlock ?? "N/A"} />
                  <BlockchainField label="Tx" value={event.createdTx} />

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
                </div>

                <div
                  className="col-md-5"
                  style={{ borderLeft: "1px solid var(--glass-border)", paddingLeft: "20px", ...textStyle }}
                >
                  <div className="d-flex align-items-center justify-content-between mb-3">
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
                          disabled={status !== "active" || subscriptionCheck.subscribed || subscriptionCheck.loading}
                        >
                          {subscriptionCheck.subscribed ? "Subscribed" : "Subscribe"}
                        </button>
                      )}
                    </div>

                    <button
                      type="button"
                      className="card-expand-close-btn card-expand-close-btn-inline"
                      onClick={handleCollapse}
                      aria-label="Collapse event details"
                    >
                      <X size={16} />
                    </button>
                  </div>

                  {variant === "explore" ? (
                    <>
                      {/* Every self-claimed token inherits the event's own image, so there's no point
                          showing a grid of identical icons here — a subscriber cares about "what will
                          I get", not "how many are there". One preview card answers that, and doubles
                          as the already-subscribed indicator (see subscriptionCheck above). */}
                      <PoapPreviewCard
                        loading={metadataLoading}
                        broken={showBrokenImage}
                        imageUrl={metadata?.poapImageUrl || metadata?.imageUrl}
                        title={subscriptionCheck.subscribed ? "Subscribed" : metadata?.name || "This event's POAP"}
                        subtitle={
                          subscriptionCheck.subscribed
                            ? "You already hold this POAP."
                            : "This is the POAP you'll receive if you subscribe."
                        }
                      />

                      <div className="d-flex justify-content-end mt-3">
                        <span className="badge badge-count-outline">
                          {detailLoading ? "…" : eventDetail?.liveTokens ?? 0} minted
                        </span>
                      </div>
                    </>
                  ) : (
                    <>
                      {/* The organizer gets the same "what a subscriber receives" preview the
                          subscriber-facing view shows, plus a breakdown chart — the icon grid below
                          answers "how many/which tokens", this answers "what does it look like" and
                          "what's the current split". */}
                      <PoapPreviewCard
                        loading={metadataLoading}
                        broken={showBrokenImage}
                        imageUrl={metadata?.poapImageUrl || metadata?.imageUrl}
                        title={metadata?.name || "This event's POAP"}
                        subtitle="What subscribers receive by claiming this event."
                      />

                      <div className="d-flex justify-content-end mt-3">
                        <span className="badge badge-count-outline">
                          {detailLoading ? "…" : eventDetail?.liveTokens ?? 0} minted
                        </span>
                      </div>

                      {statsSegments.length > 0 && (
                        <div className="mt-3">
                          <p className="small text-muted mb-2">Token breakdown</p>
                          <Chart options={statsChartOptions} series={statsChartSeries} type="donut" height={180} />
                        </div>
                      )}

                      {tokensLoading ? (
                        <p className="text-muted small mt-3">Loading…</p>
                      ) : (
                        eventTokens.length > 0 && (
                          <div className="d-flex flex-wrap mt-3" style={{ gap: "8px", maxHeight: 220, overflowY: "auto" }}>
                            {eventTokens.map((token) => (
                              <PoapGridThumb
                                key={token.tokenId}
                                token={token}
                                eventMetadata={metadata}
                                eventMetadataLoading={metadataLoading}
                                label={metadata?.name || `Event ${truncateHex(event.eventId)}`}
                              />
                            ))}
                          </div>
                        )
                      )}
                    </>
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

// The "what will/does a subscriber receive" preview shown in the expanded card's POAPs column —
// same markup for both variant="explore" (subscriber, with subscribed-state title/subtitle) and
// variant="manage" (organizer, with a static caption), so the two never visually drift apart.
function PoapPreviewCard({ loading, broken, imageUrl, title, subtitle }) {
  return (
    <div className="poap-preview-card">
      <div className="poap-preview-card-thumb">
        {loading ? (
          <div className="skeleton-block" style={{ width: "100%", height: "100%" }} />
        ) : broken ? (
          <ImageOff size={20} className="card-media-thumb-broken-icon" />
        ) : (
          <img className="card-media-thumb-photo" src={imageUrl} alt="" />
        )}
      </div>
      <div>
        <p className="m-0 small font-weight-semibold">{title}</p>
        {subtitle && <p className="m-0 text-muted small">{subtitle}</p>}
      </div>
    </div>
  );
}

// One label+value row in the expanded card's raw blockchain-data block (Event ID / Organizer /
// Block / Tx). Renders nothing for a missing value so callers don't need their own conditional
// (see the Tx field, which isn't always present). The label carries the visual weight (bold,
// uppercase, small) so it reads as the primary cue and the hex value as supporting detail —
// previously reversed. The copy button (when supplied) sits directly in the row next to the value
// instead of pinned to the far edge of a flex-grow paragraph, so it stays visually attached to
// what it copies even once the hex wraps across multiple lines.
function BlockchainField({ label, value, onCopy, copied, hint, copyAriaLabel }) {
  if (!value) return null;
  return (
    <div className="blockchain-field">
      <div className="blockchain-field-row">
        <p className="blockchain-field-value">
          <span className="blockchain-field-label">{label}:</span> {value}
        </p>
        {onCopy && (
          <button
            type="button"
            className="btn btn-card-detail-action btn-sm blockchain-field-copy"
            onClick={(e) => {
              e.stopPropagation();
              onCopy();
            }}
            aria-label={copied ? "Copied" : copyAriaLabel || `Copy ${label}`}
          >
            {copied ? <Check size={14} /> : <Copy size={14} />}
          </button>
        )}
      </div>
      {hint && (
        <div className="info-hint-card">
          <Info size={18} />
          <p>{hint}</p>
        </div>
      )}
    </div>
  );
}

// One grid icon in the expanded card's POAP list. Self-claimed tokens inherit the event's own
// metadataURI verbatim (claim() hardcodes this — see poap.compact), so their tokenMetadataURI
// resolves to the exact same JSON as `eventMetadata` and this just re-hits useEventMetadata's own
// cache (no extra network cost). Individually push-minted Credential tokens (mintPoap.jsx) carry a
// genuinely different tokenMetadataURI per recipient — this is what makes their icons diverge from
// the event's own image, which the single shared `metadata` in the parent could never show.
function PoapGridThumb({ token, eventMetadata, eventMetadataLoading, label }) {
  const hasOwnMetadata = Boolean(token.tokenMetadataURI);
  const { metadata: tokenMetadata, loading: tokenLoading } = useEventMetadata(
    hasOwnMetadata ? token.tokenMetadataURI : undefined
  );
  const loading = hasOwnMetadata ? tokenLoading : eventMetadataLoading;
  const imageUrl = hasOwnMetadata
    ? tokenMetadata?.poapImageUrl || tokenMetadata?.imageUrl || tokenMetadata?.documentImageUrl
    : eventMetadata?.poapImageUrl || eventMetadata?.imageUrl;
  const showBroken = !loading && !imageUrl;

  return (
    <Tooltip label={label}>
      <div className="card-media-thumb-small-wrap" style={{ position: "relative" }}>
        {loading ? (
          <div className="skeleton-block" style={{ width: "100%", height: "100%" }} />
        ) : showBroken ? (
          <ImageOff size={14} className="card-media-thumb-broken-icon" />
        ) : (
          <img className="card-media-thumb-photo" src={imageUrl} alt="" />
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
  );
}

export default EventCard;
