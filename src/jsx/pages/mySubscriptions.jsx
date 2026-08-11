import React, { useEffect, useState, useCallback, useMemo, useRef } from "react";
import { AnimatePresence } from "framer-motion";
import { Plus, Award } from "lucide-react";
import Layout from "../layout/layout";
import { useDrawer, useDrawerDispatch } from "../contexts/drawer/drawer.provider";
import PoapCard from "../components/poapCard";
import PoapFilters from "../components/PoapFilters";
import Tooltip from "../components/Tooltip";
import walletStatus from "../../images/collections/wallet-status.png";
import loadingGif from "../../images/loading.gif";
import { getEventVisibility, encodeShareableCollection, buildShareUrl } from "../../midnight/collection-share";
import { filterVisibleEvents } from "../../utils/poapHelpers";

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
    const av = sortBy === "attendanceCount" ? a.attendedEventIds.length : Number(a.tokenId);
    const bv = sortBy === "attendanceCount" ? b.attendedEventIds.length : Number(b.tokenId);
    return order === "asc" ? av - bv : bv - av;
  });

  return result;
}

// "My Subscriptions" reads from this browser's private state (one SPOAP token per issuer, with
// its own attendance list) — see src/midnight/witnesses.ts. This is deliberately NOT sourced from
// the public indexer: attendance history is private witness state and isn't indexed on-chain at
// all.
const MySubscriptions = () => {
  const [loading, setLoading] = useState(true);
  const [myPoaps, setMyPoaps] = useState([]);
  const [shareCopied, setShareCopied] = useState(false);
  const [expandedId, setExpandedId] = useState(null);
  const [filters, setFilters] = useState({});
  const { midnight: { provider } } = useDrawer();
  const dispatch = useDrawerDispatch();
  const pollRef = useRef(null);

  const copyCollectionShareLink = () => {
    if (!provider || myPoaps.length === 0) return;
    const entries = myPoaps.map((poap) => ({
      issuerPkHex: poap.issuerPkHex,
      tokenId: poap.tokenId,
      visibleEventIds: filterVisibleEvents(poap, getEventVisibility),
    }));
    const encoded = encodeShareableCollection(entries);
    navigator.clipboard?.writeText(buildShareUrl(provider.address, encoded));
    setShareCopied(true);
    setTimeout(() => setShareCopied(false), 2000);
  };

  const createPoap = () => {
    dispatch({ type: "CREATE_POAP" });
  };

  const loadPoaps = useCallback(async () => {
    if (!provider) {
      setMyPoaps([]);
      setLoading(false);
      return;
    }

    try {
      const { privateState } = await provider.service.getState();
      const poaps = Object.entries(privateState.tokens || {}).map(([issuerPkHex, token]) => ({
        issuerPkHex,
        tokenId: token.tokenId,
        isSoulbound: token.attendance.isSoulbound,
        attendedEventIds: token.attendance.eventIds.map((id) => Buffer.from(id).toString("hex")),
      }));
      setMyPoaps(poaps);
    } catch (error) {
      console.error("Error fetching POAPs:", error);
      setMyPoaps([]);
    } finally {
      setLoading(false);
    }
  }, [provider]);

  useEffect(() => {
    loadPoaps();
    pollRef.current = setInterval(loadPoaps, REFRESH_INTERVAL_MS);
    return () => clearInterval(pollRef.current);
  }, [loadPoaps]);

  // If the expanded token drops out of myPoaps mid-poll (e.g. private state changed), don't leave
  // the grid stuck showing zero cards — fall back to the full grid instead.
  useEffect(() => {
    if (expandedId && !myPoaps.some((p) => p.issuerPkHex === expandedId)) {
      setExpandedId(null);
    }
  }, [myPoaps, expandedId]);

  const filteredPoaps = useMemo(() => applyPoapFilters(myPoaps, filters), [myPoaps, filters]);
  const visiblePoaps = expandedId ? filteredPoaps.filter((p) => p.issuerPkHex === expandedId) : filteredPoaps;

  return (
    <Layout activeMenu={3}>
      <div className="role-subscriber">
        <div className="inner-header">
          <div className="inner-header-row">
            <div className="inner-header-row-left">
              {provider && (
                // One SPOAP token per issuer (see claimOrUpdate/issuerHolderToken in poap.compact)
                // — this count is exactly "how many issuers you're subscribed to", matching the
                // page's own name, not a separate/different number from the POAP count.
                <span className="badge badge-count-outline">
                  {filteredPoaps.length} {filteredPoaps.length === 1 ? "Subscription" : "Subscriptions"}
                </span>
              )}
            </div>
            <div className="inner-header-row-right">
              {provider && myPoaps.length > 0 && (
                <button className="btn btn-white btn-small" onClick={copyCollectionShareLink}>
                  {shareCopied ? "Link copied ✓" : "Share my collection"}
                </button>
              )}
              {provider ? (
                <button className="inner-header-action-btn" onClick={createPoap}>
                  <span className="inner-header-action-btn-inner">
                    <Plus size={14} /> Claim POAP
                  </span>
                </button>
              ) : (
                // Tooltip-wrapped only here — the button is fully usable once connected, so there's
                // nothing to explain and no tooltip should appear in that case.
                <Tooltip label="Connect your wallet to claim a POAP">
                  <button className="inner-header-action-btn is-outline is-inert">
                    <span className="inner-header-action-btn-inner">
                      <Plus size={14} /> Claim POAP
                    </span>
                  </button>
                </Tooltip>
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
                      key={poap.issuerPkHex}
                      poap={poap}
                      isExpanded={poap.issuerPkHex === expandedId}
                      onExpand={() => setExpandedId(poap.issuerPkHex)}
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
