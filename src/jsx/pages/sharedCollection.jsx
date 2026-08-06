import React, { useEffect, useState } from "react";
import { useParams, useSearchParams, Link } from "react-router-dom";
import { Calendar } from "lucide-react";
import { getTokensByOwner } from "../../midnight/indexer.service";
import { decodeShareableCollection } from "../../midnight/collection-share";
import poapNormal from "../../images/svg/poap-normal.svg";

const truncateHex = (hex) => {
  if (!hex) return "N/A";
  return `${hex.slice(0, 8)}…${hex.slice(-6)}`;
};

// Public, walletless destination for a "share my collection" link (see viewPoap.jsx /
// poapManagement.jsx, and docs/collection-sharing-design.md). Deliberately not wrapped in
// <Layout> — a visitor here has no wallet and no reason to see the authenticated app chrome.
//
// Two data sources, kept visually distinct per the design doc's hard requirement:
//   - "Verified on-chain": fetched live from the indexer for this pk — a fact, not a claim.
//   - "Declared by holder": decoded from the ?d= URL param the sharer generated client-side —
//     this is NOT tamper-proof (anyone who knows public event ids could hand-craft one), so it's
//     cross-checked only against "does this issuer/token pair actually exist on-chain for this
//     pk" (not against the attendance claim itself, which no one but the holder's own browser
//     ever knew) and labeled accordingly.
const SharedCollection = () => {
  const { pkHex } = useParams();
  const [searchParams] = useSearchParams();
  const [verifiedTokens, setVerifiedTokens] = useState(null);
  const [loadError, setLoadError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    getTokensByOwner(pkHex)
      .then((tokens) => {
        if (!cancelled) setVerifiedTokens(tokens);
      })
      .catch((error) => {
        if (!cancelled) {
          setVerifiedTokens([]);
          setLoadError(error);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [pkHex]);

  const declared = searchParams.get("d") ? decodeShareableCollection(searchParams.get("d")) : null;

  const isVerifiedPair = (issuerPkHex, tokenId) =>
    (verifiedTokens || []).some(
      (t) => t.issuerPk === issuerPkHex && String(t.tokenId) === String(tokenId)
    );

  return (
    <div className="container py-5" style={{ maxWidth: "720px" }}>
      <div className="d-flex align-items-center mb-4">
        <img src={poapNormal} width="48" height="48" alt="" className="mr-3" />
        <div>
          <h3 className="m-0">POAP Collection</h3>
          <p className="m-0 text-muted small text-break">{pkHex}</p>
        </div>
      </div>

      <div className="mb-4">
        <h5 className="mb-3">
          <span className="badge bg-success mr-2">Verified ✓</span>
          On-chain
        </h5>
        {verifiedTokens === null ? (
          <p className="text-muted small">Loading…</p>
        ) : loadError ? (
          <p className="text-muted small">Could not reach the indexer right now.</p>
        ) : verifiedTokens.length === 0 ? (
          <p className="text-muted small">No tokens found on-chain for this address.</p>
        ) : (
          <ul className="list-unstyled">
            {verifiedTokens.map((token) => (
              <li key={`${token.issuerPk}-${token.tokenId}`} className="card card-outline-only mb-2">
                <div className="card-body card-outline-only-body">
                  <div className="d-flex justify-content-between align-items-center">
                    <span>POAP #{String(token.tokenId)}</span>
                    {token.isBurned && <span className="badge bg-secondary">Burned</span>}
                  </div>
                  <p className="m-0 small text-muted">
                    Issuer: {truncateHex(token.issuerPk)} · First event: {truncateHex(token.firstEventId)}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {declared && (
        <div className="mb-4">
          <h5 className="mb-3">
            <span className="badge bg-warning mr-2">Declared</span>
            By the holder
          </h5>
          <p className="text-muted small">
            Reported by the collection owner — not verified on-chain, do not treat as proof.
          </p>
          <ul className="list-unstyled">
            {declared
              .filter((entry) => isVerifiedPair(entry.issuerPkHex, entry.tokenId))
              .map((entry) => (
                <li key={`${entry.issuerPkHex}-${entry.tokenId}`} className="card card-outline-only shared-collection-item--declared mb-2">
                  <div className="card-body card-outline-only-body">
                    <p className="m-0 small text-muted mb-2">
                      POAP #{String(entry.tokenId)} · Issuer: {truncateHex(entry.issuerPkHex)}
                    </p>
                    <ul className="list-unstyled mb-0">
                      {entry.visibleEventIds.map((eventId) => (
                        <li key={eventId} className="d-flex align-items-center mb-1">
                          <Calendar size={14} className="mr-2" />
                          <span className="text-break small">{truncateHex(eventId)}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </li>
              ))}
          </ul>
        </div>
      )}

      <Link to="/" className="shared-collection-back-link small">
        &larr; AdaSouls
      </Link>
    </div>
  );
};

export default SharedCollection;
