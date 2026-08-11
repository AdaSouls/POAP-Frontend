import React, { useEffect, useState, useCallback, useRef } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Award } from "lucide-react";
import Layout from "../layout/layout";
import { useDrawer, useDrawerDispatch } from "../contexts/drawer/drawer.provider";
import loadingGif from "../../images/loading.gif";
import walletStatus from "../../images/collections/wallet-status.png";
import poapNormal from "../../images/svg/poap-normal.svg";
import eventOwnerIcon from "../../icons/svg/collection-owner.svg";
import { getTokensByOwner, getAllEvents } from "../../midnight/indexer.service";

const REFRESH_INTERVAL_MS = 5000;

const truncateHex = (hex) => {
  if (!hex) return "N/A";
  return `${hex.slice(0, 10)}…${hex.slice(-6)}`;
};

// A "pending approval" is a token this wallet already owns on-chain (tokenOwner, via the indexer)
// that an organizer push-minted with mintTo() before this browser ever claimed anything for that
// issuer — see poap.compact's mintTo/reconcileToken comments. The token has no "accept" step on
// the ledger; the holder just calls claimOrUpdate once for that issuer (same call as any other
// claim) and the contract's reconciliation branch backfills this browser's private state. So
// "pending" here means: present in getTokensByOwner(myPk), but this issuer isn't yet a key in
// privateState.tokens.
const MyPendingApprovals = () => {
  const [loading, setLoading] = useState(true);
  const [pending, setPending] = useState([]);
  const { midnight: { provider } } = useDrawer();
  const dispatch = useDrawerDispatch();
  const navigate = useNavigate();
  const pollRef = useRef(null);

  const loadPending = useCallback(async () => {
    if (!provider) {
      setPending([]);
      setLoading(false);
      return;
    }

    try {
      const [ownedTokens, allEvents, { privateState }] = await Promise.all([
        getTokensByOwner(provider.address),
        getAllEvents(),
        provider.service.getState(),
      ]);
      const reconciledIssuers = new Set(Object.keys(privateState.tokens || {}));
      const eventsById = new Map(allEvents.map((event) => [event.eventId, event]));
      const unclaimed = ownedTokens
        .filter((token) => !token.isBurned && !reconciledIssuers.has(token.issuerPk))
        .map((token) => ({ ...token, event: eventsById.get(token.firstEventId) || null }));
      setPending(unclaimed);
    } catch (error) {
      console.error("Error loading pending approvals:", error);
      setPending([]);
    } finally {
      setLoading(false);
    }
  }, [provider]);

  useEffect(() => {
    loadPending();
    pollRef.current = setInterval(loadPending, REFRESH_INTERVAL_MS);
    return () => clearInterval(pollRef.current);
  }, [loadPending]);

  // Reuses the existing "Claim POAP" drawer (createPoap.jsx) rather than a bespoke reconciliation
  // flow — claimOrUpdate is the same call either way, the contract branches internally based on
  // whether issuerHolderToken already has an entry for this wallet+issuer. The drawer pre-selects
  // whichever event is in the URL's ?eventId= (see createPoap.jsx), so setting it here is enough.
  const claimPending = (token) => {
    navigate(`/my-pending-approvals?eventId=${token.firstEventId}`);
    dispatch({ type: "CREATE_POAP" });
  };

  return (
    <Layout activeMenu={3}>
      <div className="role-subscriber">
        <div className="inner-header">
          <div className="inner-header-row">
            <div className="inner-header-row-left">
              <span className="badge badge-count-outline">
                {pending.length} Pending
              </span>
            </div>
            <div className="inner-header-row-right" />
          </div>
        </div>

        <div className="row">
          {loading ? (
            <div className="wallet-non-connected-page">
              <img src={loadingGif} width="35" height="35" alt="Loading pending approvals" />
            </div>
          ) : !provider ? (
            <div className="wallet-non-connected-page">
              <img src={walletStatus} width="150" height="140" alt="" />
            </div>
          ) : pending.length > 0 ? (
            <AnimatePresence mode="popLayout">
              {pending.map((token) => (
                <motion.div
                  key={token.tokenId}
                  layout
                  className="col-xxl-6 col-lg-6 col-md-12 mb-3"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ duration: 0.2, ease: "easeInOut" }}
                >
                  <div className="card-hover-group">
                  <div className="card-hover-peek" />
                  <div className="card card-poap card-classic card-outline-only card-hover-lift">
                    <div className="card-outline-only-body card-media-body">
                      <div className="d-flex align-items-stretch card-media-row">
                        <div className="card-media-thumb-wrap">
                          <img className="card-media-thumb-icon" src={poapNormal} alt="" />
                        </div>
                        <div className="card-media-content">
                          <h4 className="mb-1" style={{ fontSize: "15px", fontWeight: "600" }}>
                            Token #{String(token.tokenId)}
                          </h4>
                          <span
                            className="badge bg-warning mb-2"
                            style={{ fontSize: "10px", padding: "2px 8px", alignSelf: "flex-start" }}
                          >
                            Pending your claim
                          </span>

                          <ul className="list-unstyled mb-2 mt-2" style={{ fontSize: "12px" }}>
                            <li className="d-flex align-items-center mb-1">
                              <img className="mr-2" src={eventOwnerIcon} width="14" height="14" alt="" style={{ flexShrink: 0 }} />
                              <span className="text-muted small">
                                Issuer: <span className="text-white">{truncateHex(token.issuerPk)}</span>
                              </span>
                            </li>
                            <li className="d-flex align-items-center">
                              <span className="text-muted small">
                                Event: <span className="text-white">{truncateHex(token.firstEventId)}</span>
                              </span>
                            </li>
                          </ul>

                          <p className="text-muted small mb-2">
                            An organizer already minted this token to your wallet. Claim it to bring it
                            into this browser and start recording attendance on it.
                          </p>

                          <div className="d-flex justify-content-end mt-auto">
                            <button
                              type="button"
                              className="btn btn-gradient btn-small"
                              onClick={() => claimPending(token)}
                            >
                              Claim
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          ) : (
            <div className="wallet-non-connected-page">
              <div className="text-center">
                <div className="role-hero-icon mx-auto mb-3">
                  <Award size={64} />
                </div>
                <h4>No Pending Approvals</h4>
                <p className="text-muted">
                  Nothing waiting for you right now — organizer push-mints will show up here until
                  you claim them.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default MyPendingApprovals;
