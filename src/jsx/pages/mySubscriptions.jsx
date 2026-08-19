import React, { useEffect, useState, useCallback, useMemo, useRef } from "react";
import { AnimatePresence } from "framer-motion";
import { Award } from "lucide-react";
import Layout from "../layout/layout";
import { useDrawer, useDrawerDispatch } from "../contexts/drawer/drawer.provider";
import PoapCard from "../components/poapCard";
import PoapFilters from "../components/PoapFilters";
import walletStatus from "../../images/collections/wallet-status.png";
import loadingGif from "../../images/loading.gif";
import { getTokenVisibility, encodeShareableCollection, buildShareUrl } from "../../midnight/collection-share";
import { getMyTokens } from "../../midnight/my-tokens";

const REFRESH_INTERVAL_MS = 5000;

function applyPoapFilters(poaps, filters) {
  let result = [...poaps];

  if (filters.issuerSearch) {
    result = result.filter((p) => p.issuerPkHex.toLowerCase().includes(filters.issuerSearch.toLowerCase()));
  }
  if (filters.soulbound === "soulbound") {
    result = result.filter((p) => p.isSoulbound);
  } else if (filters.soulbound === "transferable") {
    result = result.filter((p) => !p.isSoulbound);
  }

  const sortBy = filters.sortBy || "tokenId";
  const order = filters.order || "desc";
  result.sort((a, b) => {
    const av = sortBy === "mintedBlock" ? (a.mintedBlock ?? 0) : Number(a.tokenId);
    const bv = sortBy === "mintedBlock" ? (b.mintedBlock ?? 0) : Number(b.tokenId);
    return order === "asc" ? av - bv : bv - av;
  });

  return result;
}

// "My Subscriptions" is sourced live from the indexer, by this wallet's per-issuer holder pk (see
// src/midnight/my-tokens.ts) — NOT from local private state. That's what makes an organizer's
// push-mint (mintTo) show up here automatically on reconnect, with no separate "claim it" step:
// claim() has no reconciliation path anymore (see poap.compact), so the indexer-by-holder-pk read
// is the only source of truth for "what do I own" that works regardless of which browser claimed
// (or was pushed) a given token.
const MySubscriptions = () => {
  const [loading, setLoading] = useState(true);
  const [myPoaps, setMyPoaps] = useState([]);
  const [shareCopied, setShareCopied] = useState(false);
  const [expandedId, setExpandedId] = useState(null);
  const [filters, setFilters] = useState({});
  const { poapEvents, midnight: { provider } } = useDrawer();
  const dispatch = useDrawerDispatch();
  const pollRef = useRef(null);

  const openGetHolderKey = () => {
    dispatch({ type: "GET_HOLDER_KEY" });
  };

  const openRevealPrivateInfo = () => {
    dispatch({ type: "REVEAL_PRIVATE_INFO" });
  };

  const copyCollectionShareLink = () => {
    if (!provider || myPoaps.length === 0) return;
    const entries = myPoaps
      .filter((poap) => getTokenVisibility(poap.issuerPkHex, poap.tokenId))
      .map((poap) => ({ issuerPkHex: poap.issuerPkHex, tokenId: poap.tokenId }));
    const encoded = encodeShareableCollection(entries);
    navigator.clipboard?.writeText(buildShareUrl(provider.address, encoded));
    setShareCopied(true);
    setTimeout(() => setShareCopied(false), 2000);
  };

  const loadPoaps = useCallback(async () => {
    if (!provider) {
      setMyPoaps([]);
      setLoading(false);
      return;
    }

    try {
      const { privateState } = await provider.service.getState();
      const tokens = await getMyTokens(provider.service, poapEvents, privateState.tokens || {});
      setMyPoaps(tokens);
    } catch (error) {
      console.error("Error fetching POAPs:", error);
      setMyPoaps([]);
    } finally {
      setLoading(false);
    }
  }, [provider, poapEvents]);

  useEffect(() => {
    loadPoaps();
    pollRef.current = setInterval(loadPoaps, REFRESH_INTERVAL_MS);
    return () => clearInterval(pollRef.current);
  }, [loadPoaps]);

  // If the expanded token drops out of myPoaps mid-poll, don't leave the grid stuck showing zero
  // cards — fall back to the full grid instead.
  useEffect(() => {
    if (expandedId && !myPoaps.some((p) => String(p.tokenId) === expandedId)) {
      setExpandedId(null);
    }
  }, [myPoaps, expandedId]);

  const filteredPoaps = useMemo(() => applyPoapFilters(myPoaps, filters), [myPoaps, filters]);

  // While one card is expanded, every other card is left out of the grid entirely instead of just
  // reflowing around it — each card already carries its own initial/exit animation props, so
  // AnimatePresence fades/scales them away and back in on its own; no separate dimming/hiding
  // logic needed. Matches eventCard.jsx's own grids (myEvents.jsx/exploreEvents.jsx).
  const visiblePoaps = useMemo(
    () => (expandedId ? filteredPoaps.filter((p) => String(p.tokenId) === expandedId) : filteredPoaps),
    [filteredPoaps, expandedId],
  );

  return (
    <Layout activeMenu={3}>
      <div className="role-subscriber">
        <div className="inner-header">
          <div className="inner-header-row">
            <div className="inner-header-row-left">
              {provider && (
                <span className="badge badge-count-outline">
                  {filteredPoaps.length} {filteredPoaps.length === 1 ? "POAP" : "POAPs"}
                </span>
              )}
            </div>
            <div className="inner-header-row-right">
              {provider && (
                <button className="btn btn-white btn-small" onClick={openGetHolderKey}>
                  Get My Key
                </button>
              )}
              {provider && (
                <button className="btn btn-white btn-small" onClick={openRevealPrivateInfo}>
                  Reveal Private Info
                </button>
              )}
              {provider && myPoaps.length > 0 && (
                <button className="btn btn-white btn-small" onClick={copyCollectionShareLink}>
                  {shareCopied ? "Link copied ✓" : "Share my collection"}
                </button>
              )}
              <PoapFilters filters={filters} onFilterChange={setFilters} onReset={() => setFilters({})} />
            </div>
          </div>
        </div>

        <div className="row">
          {loading ? (
            <div className="wallet-non-connected-page">
              <img src={loadingGif} width="35" height="35" alt="Loading POAPs" />
            </div>
          ) : (
            <>
              {provider && filteredPoaps.length > 0 && (
                <AnimatePresence mode="popLayout">
                  {visiblePoaps.map((poap) => (
                    <PoapCard
                      key={poap.tokenId}
                      poap={poap}
                      isExpanded={String(poap.tokenId) === expandedId}
                      onExpand={() => setExpandedId(String(poap.tokenId))}
                      onCollapse={() => setExpandedId(null)}
                    />
                  ))}
                </AnimatePresence>
              )}

              {provider && filteredPoaps.length === 0 && (
                <div className="wallet-non-connected-page">
                  <div className="text-center">
                    <div className="role-hero-icon mx-auto mb-3">
                      <Award size={64} />
                    </div>
                    <h4>No POAPs Found</h4>
                    <p className="text-muted">
                      You don't have any POAPs yet. Claim your first POAP by attending an event!
                    </p>
                  </div>
                </div>
              )}

              {!provider && (
                <div className="wallet-non-connected-page">
                  <img src={walletStatus} width="150" height="140" alt="" />
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default MySubscriptions;
