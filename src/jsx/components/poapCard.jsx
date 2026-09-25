import React, { forwardRef, useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { Award, BadgeCheck, Calendar, Database, ExternalLink, Eye, EyeOff, Flame, ImageOff, Info, Lock, ShieldCheck, Ticket, X } from "lucide-react";
import { useDrawer, useDrawerDispatch } from "../contexts/drawer/drawer.provider";
import eventOwnerIcon from "../../icons/svg/collection-owner.svg";
import { useEventMetadata } from "../hooks/useEventMetadata";
import CategoryBadge from "./CategoryBadge";
import Tooltip from "./Tooltip";
import { getClaimActionLabel } from "../constants/eventCategories";
import { getEvent } from "../../midnight/indexer.service";
import formatDateToDDMMYYYY from "../../utils/formatDateToDDMMYYYY";
import { explorerBlockUrl, explorerContractUrl, explorerTxUrl } from "../../utils/midnightExplorer";
import {
  getTokenVisibility,
  setTokenVisibility,
  encodeShareableCollection,
  buildShareUrl,
} from "../../midnight/collection-share";
import { loadCredentialPackage } from "../../midnight/holder-proofs";
import { decodeValueHex } from "../../midnight/credential-store";
import { getProofHistory, PROOF_HISTORY_EVENT } from "../../midnight/proof-history";
import { blockTimestamp, PROOF_KINDS, verifyUrl } from "../../midnight/proof-verification";
import { describeValidity, formatUntil, parseValidity, validityStatus } from "../../midnight/validity";
import { TOKEN_BURNED_EVENT } from "../../midnight/token-events";

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
  const dispatch = useDrawerDispatch();

  const [visible, setVisible] = useState(() => getTokenVisibility(poap.issuerPkHex, poap.tokenId));
  const [shareCopied, setShareCopied] = useState(false);
  // Burned from this card (burnToken.jsx) — shown right away instead of waiting for the page's next
  // indexer poll to bring poap.isBurned.
  const [burnedHere, setBurnedHere] = useState(false);
  useEffect(() => {
    const onBurned = ({ detail }) => {
      if (detail?.eventId === poap.firstEventId && detail?.tokenId === String(poap.tokenId)) setBurnedHere(true);
    };
    window.addEventListener(TOKEN_BURNED_EVENT, onBurned);
    return () => window.removeEventListener(TOKEN_BURNED_EVENT, onBurned);
  }, [poap.firstEventId, poap.tokenId]);
  const isBurned = poap.isBurned || burnedHere;
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

  // Raw blockchain data (Token ID / Owner / Issuer / Event ID / Block / Tx / Burned Block / Burned
  // Tx) lives behind this popup now, not inline — see BlockchainInfoModal.jsx. Burned fields only
  // apply once poap.isBurned; contractAddress is the same constant for every token. Block/Tx/
  // Contract rows deep-link into midnightexplorer.com. The Issuer row is plain text here on
  // purpose: the organizer-key copy badge is organizer-only (credential events, eventCard.jsx) —
  // a holder never needs to hand this key to anyone.
  const openBlockchainInfoDrawer = () => {
    const contractAddress = process.env.REACT_APP_MIDNIGHT_CONTRACT_ADDRESS;
    const fields = [
      { key: "tokenId", label: "Token ID", value: String(poap.tokenId) },
      { key: "owner", label: "Owner", value: poap.ownerPk, copyable: true },
      { key: "issuer", label: "Issuer", value: poap.issuerPkHex },
      { key: "eventId", label: "Event ID", value: poap.firstEventId },
      { key: "block", label: "Block", value: poap.mintedBlock ?? "N/A", href: explorerBlockUrl(poap.mintedBlock) },
      { key: "tx", label: "Tx", value: poap.mintedTx, href: explorerTxUrl(poap.mintedTx), copyable: true },
    ];
    if (poap.isBurned) {
      fields.push({
        key: "burnedBlock",
        label: "Burned At Block",
        value: poap.burnedBlock ?? "N/A",
        href: explorerBlockUrl(poap.burnedBlock),
      });
      fields.push({
        key: "burnedTx",
        label: "Burned Tx",
        value: poap.burnedTx,
        href: explorerTxUrl(poap.burnedTx),
        copyable: true,
      });
    }
    fields.push({
      key: "contractAddress",
      label: "Contract Address",
      value: contractAddress,
      href: explorerContractUrl(contractAddress),
      copyable: true,
    });
    dispatch({ type: "SHOW_BLOCKCHAIN_INFO", payload: { title: "Blockchain Info", fields } });
  };

  // Private details of this credential (B7) — only for credentials whose event defines private
  // fields. Local copy first, else the encrypted delivery from the organizer (holder-proofs.ts).
  // Values stay hidden until the holder asks to see them (the card may be on a shared screen).
  const service = midnight?.provider?.service;
  const credentialFields = eventMetadata?.credentialAttributeFields || [];
  const holderToken = { tokenId: poap.tokenId, eventId: poap.firstEventId, issuerPk: poap.issuerPkHex, holderPk: poap.ownerPk };
  const [credentialPkg, setCredentialPkg] = useState(null);
  const [credentialStatus, setCredentialStatus] = useState("idle"); // idle | loading | ready | missing | error
  const [showPrivate, setShowPrivate] = useState(false);
  useEffect(() => {
    if (!isExpanded || !service || credentialFields.length === 0 || isBurned) return undefined;
    let cancelled = false;
    setCredentialStatus("loading");
    loadCredentialPackage(service, holderToken)
      .then((pkg) => {
        if (cancelled) return;
        setCredentialPkg(pkg);
        setCredentialStatus(pkg ? "ready" : "missing");
      })
      .catch((error) => {
        console.error("Error loading credential details:", error);
        if (!cancelled) setCredentialStatus("error");
      });
    return () => {
      cancelled = true;
    };
    // holderToken is rebuilt each render from these same poap fields.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isExpanded, service, credentialFields.length, poap.tokenId, isBurned]);

  // mode: "ownership" (Prove Ownership Anonymously) or "detail" (Prove a Private Detail).
  const openHolderProofs = (mode) => {
    dispatch({
      type: "SHOW_HOLDER_PROOFS",
      payload: {
        mode,
        token: holderToken,
        eventName: eventMetadata?.name || null,
        credentialFields,
        pkg: credentialPkg,
      },
    });
  };

  // Permanent: burnToken.jsx asks for confirmation first.
  const openBurn = () => {
    dispatch({
      type: "SHOW_BURN_TOKEN",
      payload: { mode: "burn", tokenId: poap.tokenId, eventId: poap.firstEventId, eventName: eventMetadata?.name || null },
    });
  };

  // B6 — see proveOwnership.jsx / src/midnight/ownership-proof.ts.
  const openProveOwnership = () => {
    dispatch({
      type: "SHOW_PROVE_OWNERSHIP",
      payload: {
        tokenId: poap.tokenId,
        eventId: poap.firstEventId,
        issuerPkHex: poap.issuerPkHex,
        holderPk: poap.ownerPk,
        isBurned,
        eventName: eventMetadata?.name || null,
      },
    });
  };

  // Proofs made from this POAP in this browser (proof-history.ts) — newest first. Refreshed when a
  // proof popup records a new one.
  const [proofHistory, setProofHistory] = useState(() => getProofHistory(poap.ownerPk, poap.tokenId));
  useEffect(() => {
    const refresh = () => setProofHistory(getProofHistory(poap.ownerPk, poap.tokenId));
    refresh();
    window.addEventListener(PROOF_HISTORY_EVENT, refresh);
    return () => window.removeEventListener(PROOF_HISTORY_EVENT, refresh);
  }, [poap.ownerPk, poap.tokenId]);
  const lastProof = proofHistory[0] || null;
  const lastOwnershipProof = proofHistory.find((record) => record.kind === "proveTokenOwnership") || null;
  const lastAnonymousProof = proofHistory.find((record) => record.kind === "proveEventAttendance") || null;
  const proofBadge = lastProof && (
    <Tooltip
      multiline
      label={`Last proof: ${PROOF_KINDS[lastProof.kind]?.title || "Proof"} · ${new Date(lastProof.provenAt).toLocaleString()}. Only you see this.`}
    >
      <span className="badge poap-proven-badge" style={{ fontSize: "10px", padding: "2px 8px" }}>
        <ShieldCheck size={10} className="mr-1" />
        Proven · {formatDateToDDMMYYYY(lastProof.provenAt)}
      </span>
    </Tooltip>
  );

  // Validity (validity.ts), if the event sets one. Subscription: counted from the last ownership
  // proof made here (anonymous or not). Event/Credential: from the mint block's time — or, for a
  // credential, its own private "Valid until" date once its details are loaded (that's the value
  // the holder can prove).
  const validity = parseValidity(eventMetadata?.validity);
  const isSubscription = eventMetadata?.category === "subscription";
  const [mintedMs, setMintedMs] = useState(undefined);
  useEffect(() => {
    if (!validity || isSubscription) return undefined;
    if (poap.mintedBlock === null || poap.mintedBlock === undefined) {
      setMintedMs(NaN);
      return undefined;
    }
    let cancelled = false;
    blockTimestamp(poap.mintedBlock).then((ms) => {
      if (!cancelled) setMintedMs(ms ?? NaN);
    });
    return () => {
      cancelled = true;
    };
    // validity is re-parsed each render; what matters is whether the event has one.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [Boolean(validity), isSubscription, poap.mintedBlock]);
  const lastHoldingProof =
    proofHistory.find((record) => record.kind === "proveTokenOwnership" || record.kind === "proveEventAttendance") || null;
  const validUntilFieldId = credentialFields.find((field) => field.auto === "validUntil")?.fieldId;
  const credentialValidUntil = credentialPkg?.fields.find((field) => field.fieldId === validUntilFieldId);
  let validityState = validityStatus(
    validity,
    isSubscription ? (lastHoldingProof ? Date.parse(lastHoldingProof.provenAt) : null) : mintedMs,
  );
  if (validity && credentialValidUntil) {
    const untilMs = Date.parse(`${decodeValueHex(credentialValidUntil.valueHex)}T23:59:59.999Z`);
    if (!Number.isNaN(untilMs)) validityState = { state: untilMs > Date.now() ? "active" : "expired", untilMs };
  }
  const validityBadge = !isBurned && validity && validityState.state !== "none" && validityState.state !== "unknown" && (
    <Tooltip
      multiline
      label={
        isSubscription
          ? `Stays active for ${describeValidity(validity)} after each proof of ownership. Prove it again to renew.`
          : eventMetadata?.category === "credential"
            ? "Set by the issuer. Only they can renew it, by issuing a new one."
            : `Valid for ${describeValidity(validity)} from when you got it.`
      }
    >
      {validityState.state === "pending" ? (
        <span className="badge poap-validity-badge is-pending" style={{ fontSize: "10px", padding: "2px 8px" }}>
          Not proven yet
        </span>
      ) : validityState.state === "active" ? (
        <span className="badge poap-validity-badge" style={{ fontSize: "10px", padding: "2px 8px" }}>
          {isSubscription ? "Active" : "Valid"} until {formatUntil(validityState.untilMs, validity)}
        </span>
      ) : (
        <span className="badge poap-validity-badge is-expired" style={{ fontSize: "10px", padding: "2px 8px" }}>
          Expired · {formatUntil(validityState.untilMs, validity)}
        </span>
      )}
    </Tooltip>
  );

  // No "pending"/claim state exists for a POAP — mintTo() (organizer push-mint) and claim()
  // (self-mint) both leave the token already owned by the recipient the instant the transaction
  // lands, with no separate claim/approval step (see mySubscriptions.jsx reading straight from the
  // indexer by holder pk). So the only real states here are "still owned" vs. "burned" — same
  // top-right badge slot/style as eventCard.jsx's own status badge, instead of Burned living down
  // in the row with Soulbound.
  // "Active" said nothing about how you got this POAP — same category-aware verb the explore-events
  // grid uses once claimed (Followed/Attended/Subscribed, see getClaimActionLabel), since every card
  // on this page is by definition already-held (no "Claimable" state exists here).
  const poapStatusBadgeClass = isBurned ? "badge bg-secondary" : "badge status-badge-held";
  const poapStatusLabel = isBurned ? "Burned" : claimLabel.done;

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
          {/* The thumb — and its whole ancestor chain up to here — is rendered unconditionally
              below, never inside an `isExpanded ? A : B` branch. Only className/style toggle per
              state; the actual elements (including the motion.div thumb itself) stay mounted
              continuously across expand/collapse. That's what framer-motion's `layout` FLIP
              actually needs: a real before/after measurement of the SAME node. The previous
              version rendered two entirely different subtrees for collapsed vs. expanded (so the
              thumb unmounted and a fresh one mounted in the other branch every time) — a freshly
              mounted node has no "before" to interpolate from, so it just snapped straight to its
              final CSS position instead of animating there, and since the collapsed → expanded
              move is diagonal (both axis change at once), that snap looked like an L-shaped hop —
              one axis resolving via instant layout reflow, the other via the card's own resize —
              with the image effectively disappearing from view for a moment in between. */}
          <div className={isExpanded ? "row" : undefined}>
            <div className={isExpanded ? "col-md-8" : undefined} style={isExpanded ? { position: "relative" } : undefined}>
              {isExpanded && (
                /* Pinned to the column's own top-right corner (not just the header row) — a
                    corner ribbon, independent of the thumb's height, rather than a flex sibling
                    vertically centered against the 140px thumb. */
                <div className="poap-detail-category-badge-corner" style={textStyle}>
                  <CategoryBadge category={metadata?.category} />
                </div>
              )}
              {/* align-items-stretch (not center) so .card-media-content below actually stretches
                  to the thumb's full 140px height once expanded. The status badge is positioned
                  absolute (top/left of that stretched box) so it keeps its natural pill size
                  instead of being flex-stretched to the row's full width, and so it doesn't eat
                  into the flow height the name below centers itself against. */}
              <div
                className={isExpanded ? "d-flex align-items-stretch mb-2" : "d-flex align-items-stretch card-media-row"}
                style={isExpanded ? { paddingRight: 160 } : undefined}
              >
                {/* Explicit layout transition, slightly slower than the card's own (0.3s) —
                    without this the thumb used framer-motion's default spring, which finished
                    before the card's own resize tween did, so the image briefly overshot the
                    card's still-mid-resize bounds and poked out past its edge. */}
                <motion.div
                  layout
                  transition={{ layout: { duration: 0.45, ease: "easeInOut" } }}
                  className={isExpanded ? "card-media-thumb-wrap mr-3" : "card-media-thumb-wrap"}
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

                {!isExpanded ? (
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
                    {(poap.isSoulbound || proofBadge || validityBadge) && (
                      <div className="d-flex align-items-center flex-wrap mb-2" style={{ gap: "6px" }}>
                        {poap.isSoulbound && (
                          <Tooltip multiline label="Marked non-transferable by you at claim time — the contract does not enforce this restriction on-chain yet.">
                            <span className="badge bg-info" style={{ fontSize: "10px", padding: "2px 8px", cursor: "help" }}>
                              Soulbound
                            </span>
                          </Tooltip>
                        )}
                        {proofBadge}
                        {validityBadge}
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
                ) : (
                  <div className="card-media-content" style={{ position: "relative", ...textStyle }}>
                    <span
                      className={`${poapStatusBadgeClass} text-capitalize poap-detail-status-badge-top`}
                      style={{ fontSize: "10px", padding: "2px 8px" }}
                    >
                      {poapStatusLabel}
                    </span>
                    <div className="d-flex align-items-center h-100" style={{ minWidth: 0 }}>
                      <h4 className="mb-0 text-truncate" style={{ fontSize: "16px", fontWeight: "600", minWidth: 0 }}>
                        {metadata?.name || `POAP #${String(poap.tokenId)}`}
                      </h4>
                    </div>
                  </div>
                )}
              </div>

              {isExpanded && (
                <div style={textStyle}>
                  {poap.isSoulbound && (
                    <div className="mb-2">
                      <Tooltip multiline label="Marked non-transferable by you at claim time — the contract does not enforce this restriction on-chain yet.">
                        <span className="badge bg-info" style={{ fontSize: "10px", padding: "2px 8px", cursor: "help" }}>
                          Soulbound
                        </span>
                      </Tooltip>
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

                  {credentialFields.length > 0 && !isBurned && (
                    <>
                      <div className="credential-private-details">
                        <div className="d-flex align-items-center justify-content-between mb-2">
                          <span className="d-flex align-items-center small font-weight-semibold">
                            <Lock size={14} className="mr-2" />
                            Private details
                          </span>
                          {credentialStatus === "ready" && (
                            <button
                              type="button"
                              className="btn btn-card-detail-action btn-sm"
                              onClick={() => setShowPrivate((v) => !v)}
                              aria-label={showPrivate ? "Hide private details" : "Show private details"}
                            >
                              {showPrivate ? <EyeOff size={14} /> : <Eye size={14} />}
                              <span className="ml-2">{showPrivate ? "Hide" : "Show"}</span>
                            </button>
                          )}
                        </div>
                        {!service ? (
                          <p className="m-0 small text-muted">Connect your wallet to see them.</p>
                        ) : credentialStatus === "loading" ? (
                          <p className="m-0 small text-muted">Looking for your private details…</p>
                        ) : credentialStatus === "missing" ? (
                          <p className="m-0 small text-muted">
                            The organizer hasn't sent this credential's private details, or they were sent to a
                            different key. If they gave you a private link, open it while connected.
                          </p>
                        ) : credentialStatus === "error" ? (
                          <p className="m-0 small text-warning">Could not load the private details. Try again in a moment.</p>
                        ) : credentialStatus === "ready" ? (
                          <dl className="credential-private-list m-0">
                            {credentialPkg.fields.map((field) => (
                              <div key={field.fieldId}>
                                <dt>{field.label}</dt>
                                <dd>{showPrivate ? decodeValueHex(field.valueHex) : "••••••"}</dd>
                              </div>
                            ))}
                          </dl>
                        ) : null}
                        <p className="m-0 mt-2 small text-muted">
                          Only you can see these. Prove a Private Detail lets you prove one without revealing it.
                        </p>
                      </div>
                      <hr style={{ marginTop: "18px", marginBottom: "18px" }} />
                    </>
                  )}

                  {proofHistory.length > 0 && (
                    <>
                      <div className="proof-history">
                        <div className="d-flex align-items-center justify-content-between mb-2">
                          <span className="d-flex align-items-center small font-weight-semibold">
                            <ShieldCheck size={14} className="mr-2" />
                            Proof history
                          </span>
                          {proofBadge}
                        </div>
                        <ul className="list-unstyled m-0 d-flex flex-column" style={{ gap: "8px" }}>
                          {proofHistory.map((record) => (
                            <li key={`${record.provenAt}-${record.txHash}`} className="proof-history-item">
                              <div style={{ minWidth: 0 }}>
                                <p className="m-0 small font-weight-semibold">
                                  {PROOF_KINDS[record.kind]?.title || "Proof"}
                                </p>
                                <p className="m-0 small text-muted text-truncate">{record.question}</p>
                                <p className="m-0 small text-muted">
                                  {new Date(record.provenAt).toLocaleString()}
                                  {isSubscription &&
                                    validity &&
                                    (record.kind === "proveTokenOwnership" || record.kind === "proveEventAttendance") &&
                                    ` · valid until ${formatUntil(
                                      validityStatus(validity, Date.parse(record.provenAt)).untilMs,
                                      validity,
                                    )}`}
                                </p>
                              </div>
                              {record.txHash && (
                                <a
                                  href={verifyUrl(record.txHash)}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="btn btn-card-detail-action btn-sm flex-shrink-0"
                                >
                                  <ExternalLink size={14} className="mr-2" />
                                  Verify
                                </a>
                              )}
                            </li>
                          ))}
                        </ul>
                        <p className="m-0 mt-2 small text-muted">
                          Only you see this list — it's kept in this browser and in your backup. Each proof
                          stays on-chain; anyone can check it with its Verify link. It shows you held this
                          POAP at that moment; prove again to show you still do.
                        </p>
                      </div>
                      <hr style={{ marginTop: "18px", marginBottom: "18px" }} />
                    </>
                  )}

                  <div className="d-flex flex-wrap" style={{ gap: "8px" }}>
                    <button
                      type="button"
                      className="btn btn-card-detail-action btn-sm"
                      onClick={openBlockchainInfoDrawer}
                    >
                      <Database size={14} className="mr-2" />
                      View Blockchain Info
                    </button>
                    {!isBurned && (
                      <button
                        type="button"
                        className="btn btn-card-detail-action btn-sm"
                        onClick={openProveOwnership}
                        disabled={!midnight?.provider}
                      >
                        <ShieldCheck size={14} className="mr-2" />
                        Prove Ownership
                      </button>
                    )}
                    {!isBurned && (
                      <Tooltip multiline label="Proves you hold a POAP of this event without revealing which one.">
                        <button
                          type="button"
                          className="btn btn-card-detail-action btn-sm"
                          onClick={() => openHolderProofs("ownership")}
                          // A credential's leaf includes its private-details root, so wait for them.
                          disabled={!midnight?.provider || credentialStatus === "loading"}
                        >
                          <EyeOff size={14} className="mr-2" />
                          Prove Ownership Anonymously
                        </button>
                      </Tooltip>
                    )}
                    {!isBurned && credentialFields.length > 0 && (
                      <Tooltip multiline label="Proves one of your private details matches a question, without revealing it.">
                        <button
                          type="button"
                          className="btn btn-card-detail-action btn-sm"
                          onClick={() => openHolderProofs("detail")}
                          disabled={!midnight?.provider || credentialStatus === "loading"}
                        >
                          <Lock size={14} className="mr-2" />
                          Prove a Private Detail
                        </button>
                      </Tooltip>
                    )}
                    {!isBurned && (
                      <button
                        type="button"
                        className="btn btn-card-detail-action btn-sm"
                        onClick={openBurn}
                        disabled={!midnight?.provider}
                      >
                        <Flame size={14} className="mr-2" />
                        Burn
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>

            {isExpanded && (
              /* Right column (1/3): a stack of three "cards" — a verification seal, a preview of
                 the parent event (styled like that event's own collapsed tile), and the share
                 controls. The LEFT column (2/3, above) is the inverse of eventCard.jsx's own
                 proportions — for a POAP/credential, the image itself (especially a push-minted
                 credential's actual document) IS the content, so it keeps identity (thumb + name)
                 up top, then the document image, then the raw blockchain data. */
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

                {/* One seal per kind of ownership proof the holder has made (proof-history.ts),
                    newest date. Same shield for both; blurred for the anonymous one. Owner-only. */}
                {[
                  { record: lastOwnershipProof, title: "Ownership proven", blurred: false },
                  { record: lastAnonymousProof, title: "Ownership proven anonymously", blurred: true },
                ]
                  .filter(({ record }) => record)
                  .map(({ record, title, blurred }) => (
                    <div key={title} className="poap-verified-seal-card mt-2">
                      <ShieldCheck
                        size={36}
                        className={`poap-verified-seal-icon flex-shrink-0${blurred ? " poap-seal-icon-anonymous" : ""}`}
                      />
                      <div style={{ minWidth: 0 }}>
                        <p className="m-0 font-weight-semibold">{title}</p>
                        <p className="m-0 text-muted small">
                          Last proof {new Date(record.provenAt).toLocaleString()}
                          {record.txHash && (
                            <>
                              {" · "}
                              <a href={verifyUrl(record.txHash)} target="_blank" rel="noopener noreferrer" className="text-white">
                                Verify <ExternalLink size={11} />
                              </a>
                            </>
                          )}
                        </p>
                      </div>
                    </div>
                  ))}

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
                      <div className="mb-1">
                        {eventMetadataLoading ? (
                          <div className="skeleton-block" style={{ height: "13px", width: "60%" }} />
                        ) : (
                          <h4 className="mb-0 text-truncate" style={{ fontSize: "13px", fontWeight: "600" }}>
                            {eventMetadata?.name || `Event ${truncateHex(poap.firstEventId)}`}
                          </h4>
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
                      {/* No status/category badge here on purpose — both already live in the left
                          column's own header (this is just a preview of the parent event, not a
                          second place to repeat the same two badges). Ticket icon matches the same
                          "Minted:" quick-fact row in eventCard.jsx's own expanded overlay. */}
                      {eventDetail && (
                        <div className="d-flex align-items-center">
                          <Ticket size={12} className="mr-2" style={{ flexShrink: 0 }} />
                          <small className="text-muted" style={{ fontSize: "10px" }}>
                            Minted: <strong className="text-white">{eventDetail.minted}/{eventDetail.maxSupply || "∞"}</strong>
                          </small>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <hr style={{ marginTop: "18px", marginBottom: "18px" }} />

                <div className="form-check form-switch share-toggle-row mb-3">
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
                <button
                  className="btn btn-card-detail-action btn-sm d-block w-100"
                  onClick={copyShareLink}
                  disabled={!midnight?.provider}
                >
                  {shareCopied ? "Link copied ✓" : "Copy share link"}
                </button>
                <div className="info-hint-card mt-2">
                  <Info size={16} />
                  <p>
                    Builds a link from data available right now: the token/issuer info is looked up
                    live from the public indexer — not something the link can prove on its own,
                    unlike the ZK-verified tx hash above.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
        </motion.div>
      </div>
    </motion.div>
  );
});

PoapCard.displayName = "PoapCard";

export default PoapCard;
