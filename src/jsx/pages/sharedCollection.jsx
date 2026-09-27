import React, { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Award, CircleAlert, ExternalLink, Layers } from "lucide-react";
import Layout from "../layout/layout";
import { getEvent, getToken } from "../../midnight/indexer.service";
import { decodeShareableCollection } from "../../midnight/collection-share";
import { fetchMetadata } from "../hooks/useEventMetadata";
import { blockTimestamp } from "../../midnight/proof-verification";
import { formatUntil, parseValidity, validityStatus } from "../../midnight/validity";
import formatDateToDDMMYYYY from "../../utils/formatDateToDDMMYYYY";
import { explorerTxUrl } from "../../utils/midnightExplorer";

// One shared POAP, checked against the chain. "missing" covers a token that doesn't exist or whose
// issuer doesn't match the link — a hand-edited or stale link, never shown as a real POAP.
async function loadEntry({ issuerPkHex, tokenId }) {
  const token = await getToken(tokenId).catch(() => null);
  if (!token || token.issuerPk?.toLowerCase() !== issuerPkHex?.toLowerCase()) {
    return { tokenId: String(tokenId), status: "missing" };
  }
  const event = token.firstEventId ? await getEvent(token.firstEventId).catch(() => null) : null;
  const eventMetadataURI = event?.metadataURI || token.metadataURI;
  const [eventMetadata, tokenMetadata, mintedMs] = await Promise.all([
    eventMetadataURI ? fetchMetadata(eventMetadataURI) : null,
    token.tokenMetadataURI && token.tokenMetadataURI !== eventMetadataURI ? fetchMetadata(token.tokenMetadataURI) : null,
    token.mintedBlock != null ? blockTimestamp(token.mintedBlock) : null,
  ]);

  // Validity (validity.ts) runs from the mint for Events and Credentials. A Subscription's runs from
  // the holder's last ownership proof, which a shared link can't know — so it isn't judged here.
  const validity = parseValidity(eventMetadata?.validity);
  const now = validity && eventMetadata?.category !== "subscription" ? validityStatus(validity, mintedMs ?? undefined) : null;

  let status = "active";
  if (token.isBurned) status = "revoked";
  else if (now?.state === "expired") status = "expired";

  return {
    tokenId: String(token.tokenId),
    status,
    name: tokenMetadata?.name || eventMetadata?.name || null,
    eventName: eventMetadata?.name || null,
    organization: eventMetadata?.organization?.name || null,
    imageUrl: tokenMetadata?.poapImageUrl || tokenMetadata?.imageUrl || eventMetadata?.poapImageUrl || eventMetadata?.imageUrl || null,
    issuedMs: mintedMs,
    untilMs: now?.untilMs ?? null,
    validity,
    mintedTx: token.mintedTx,
  };
}

const STATUS_LABELS = {
  active: "Valid",
  expired: "Expired",
  revoked: "Revoked",
  missing: "Not found",
};

function SharedPoapRow({ entry }) {
  if (entry.status === "missing") {
    return (
      <li className="shared-collection-item is-missing">
        <div className="verify-proof-event-thumb">
          <CircleAlert size={24} className="text-warning" />
        </div>
        <div className="shared-collection-item-body">
          <p className="m-0 font-weight-semibold">POAP #{entry.tokenId}</p>
          <p className="m-0 small text-muted">Doesn't exist on the Midnight network as described in this link.</p>
        </div>
        <span className="badge shared-collection-status is-missing">{STATUS_LABELS.missing}</span>
      </li>
    );
  }

  return (
    <li className={`shared-collection-item is-${entry.status}`}>
      <div className="verify-proof-event-thumb">
        {entry.imageUrl ? <img src={entry.imageUrl} alt="" /> : <Award size={24} className="text-muted" />}
      </div>
      <div className="shared-collection-item-body">
        <p className="m-0 font-weight-semibold text-truncate">{entry.name || `POAP #${entry.tokenId}`}</p>
        {entry.eventName && entry.eventName !== entry.name && (
          <p className="m-0 small text-muted text-truncate">{entry.eventName}</p>
        )}
        {entry.organization && <p className="m-0 small text-muted text-truncate">by {entry.organization}</p>}
        <p className="m-0 small text-muted">
          POAP #{entry.tokenId}
          {entry.issuedMs && <> · Issued {formatDateToDDMMYYYY(new Date(entry.issuedMs))}</>}
          {entry.untilMs && entry.status !== "revoked" && (
            <>
              {" · "}
              {entry.status === "expired" ? "Expired on" : "Valid until"} {formatUntil(entry.untilMs, entry.validity)}
            </>
          )}
          {entry.mintedTx && (
            <>
              {" · "}
              <a href={explorerTxUrl(entry.mintedTx)} target="_blank" rel="noopener noreferrer" className="text-white">
                Tx <ExternalLink size={11} />
              </a>
            </>
          )}
        </p>
      </div>
      <span className={`badge shared-collection-status is-${entry.status}`}>{STATUS_LABELS[entry.status]}</span>
    </li>
  );
}

// Public, walletless destination of a "Share my collection" / "Copy share link" link
// (mySubscriptions.jsx, poapCard.jsx). The list in ?d= is the holder's own choice: every POAP in it
// is checked on-chain (exists, same issuer, not revoked, not expired), but the link can't prove the
// person sharing it owns them — anyone can list public token ids. The page says so; an ownership
// proof (/app/verify) is what proves ownership.
const SharedCollection = () => {
  const [searchParams] = useSearchParams();
  const encoded = searchParams.get("d");
  const [entries, setEntries] = useState(null);
  const declared = encoded ? decodeShareableCollection(encoded) : null;
  const invalidLink = !declared || declared.length === 0;

  useEffect(() => {
    if (!encoded) return undefined;
    const list = decodeShareableCollection(encoded);
    if (!list || list.length === 0) return undefined;
    let cancelled = false;
    setEntries(null);
    Promise.all(list.map(loadEntry)).then((loaded) => {
      if (!cancelled) setEntries(loaded);
    });
    return () => {
      cancelled = true;
    };
  }, [encoded]);

  const found = (entries || []).filter((entry) => entry.status !== "missing");

  return (
    <Layout>
      <div className="verify-proof-page">
        <div className="drawer-modal-preview-card verify-proof-card">
          <div className="verify-proof-heading">
            <Layers size={96} strokeWidth={1.25} className="text-muted" />
            <p className="m-0 verify-proof-title">POAP Collection</p>
            {!invalidLink && <span className="badge shared-collection-declared-badge">Shared by its holder</span>}
            <p className="m-0 text-muted">
              {invalidLink
                ? "This link doesn't contain a collection. Ask the holder to copy it again."
                : "Each POAP below is checked on the Midnight network: that it exists, who issued it, and whether it's still valid."}
            </p>
          </div>

          {!invalidLink && entries === null && (
            <p className="text-muted small m-0 text-center">Checking on the Midnight network…</p>
          )}

          {entries && (
            <>
              <ul className="shared-collection-list list-unstyled m-0">
                {entries.map((entry) => (
                  <SharedPoapRow key={entry.tokenId} entry={entry} />
                ))}
              </ul>
              {found.length > 0 && (
                <p className="text-muted small m-0 text-center">
                  The holder chose which POAPs to include, and the link itself doesn't prove they own them. To check
                  that, ask them for an ownership proof.
                </p>
              )}
            </>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default SharedCollection;
