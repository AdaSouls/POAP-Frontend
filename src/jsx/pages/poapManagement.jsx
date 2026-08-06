import React, { useEffect, useState, useCallback, useRef } from "react";
import { AnimatePresence } from "framer-motion";
import { Plus } from "lucide-react";
import Layout from "../layout/layout";
import { useDrawer, useDrawerDispatch } from "../contexts/drawer/drawer.provider";
import PoapCard from "../components/poapCard";
import poapNormal from "../../images/svg/poap-normal.svg";
import walletStatus from "../../images/collections/wallet-status.png";
import loadingGif from "../../images/loading.gif";
import { getEventVisibility, encodeShareableCollection, buildShareUrl } from "../../midnight/collection-share";
import { filterVisibleEvents } from "../../utils/poapHelpers";

const REFRESH_INTERVAL_MS = 5000;

// "My POAPs" reads from this browser's private state (one SPOAP token per issuer, with its own
// attendance list) — see src/midnight/witnesses.ts. This is deliberately NOT sourced from the
// public indexer: attendance history is private witness state and isn't indexed on-chain at all.
const PoapManagement = () => {
  const [loading, setLoading] = useState(true);
  const [myPoaps, setMyPoaps] = useState([]);
  const [shareCopied, setShareCopied] = useState(false);
  const [expandedId, setExpandedId] = useState(null);
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

  const showMidnightWallet = () => {
    dispatch({ type: "SHOW_MIDNIGHT_WALLET" });
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

  const visiblePoaps = expandedId ? myPoaps.filter((p) => p.issuerPkHex === expandedId) : myPoaps;

  return (
    <Layout activeMenu={3}>
      <>
        <div className="inner-header">
          <div className="inner-header-row">
            <div className="inner-header-row-left">
              <h4>My POAPs</h4>
            </div>
            <div className="inner-header-row-right">
              {provider && myPoaps.length > 0 && (
                <button className="btn btn-white btn-small" onClick={copyCollectionShareLink}>
                  {shareCopied ? "Link copied ✓" : "Share my collection"}
                </button>
              )}
              <button
                className={`inner-header-action-btn${!provider ? " is-outline" : ""}`}
                onClick={!provider ? showMidnightWallet : createPoap}
                title={!provider ? "Connect your wallet to claim a POAP" : "Claim a POAP"}
              >
                <span className="inner-header-action-btn-inner">
                  <Plus size={14} /> Claim POAP
                </span>
              </button>
            </div>
          </div>
        </div>

        <div className="row">
          {loading ? (
            <div className="col-xxl-6 col-lg-6 col-md-12">
              <div className="card card-poap card-classic card-outline-only">
                <div className="card-outline-only-body d-flex justify-content-center">
                  <div className="loading-poap-card">
                    <img src={loadingGif} width="35" height="35" alt="Loading POAPs" />
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <>
              {provider && myPoaps.length > 0 && (
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

              {provider && myPoaps.length === 0 && (
                <div className="col-xxl-12 col-xl-12 col-lg-12 col-md-12">
                  <div className="card card-poap card-classic card-outline-only">
                    <div className="card-outline-only-body text-center py-5">
                      <img src={poapNormal} width="100" height="100" alt="No POAPs" className="mb-3" />
                      <h4>No POAPs Found</h4>
                      <p className="text-muted">
                        You don't have any POAPs yet. Claim your first POAP by attending an event!
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {!provider && (
                <div className="col-xxl-6 col-lg-6 col-md-12">
                  <div className="card card-poap card-classic card-outline-only">
                    <div className="wallet-non-connected">
                      <img className="mt-6" src={walletStatus} width="150" height="140" alt="" />
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </>
    </Layout>
  );
};

export default PoapManagement;
