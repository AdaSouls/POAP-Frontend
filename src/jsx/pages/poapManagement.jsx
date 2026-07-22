import React, { useEffect, useState, useCallback, useRef } from "react";
import { Link } from "react-router-dom";
import Layout from "../layout/layout";
import { useDrawer, useDrawerDispatch } from "../contexts/drawer/drawer.provider";
import PoapCard from "../components/poapCard";
import poapNormal from "../../images/svg/poap-normal.svg";
import loadingGif from "../../images/loading.gif";

const REFRESH_INTERVAL_MS = 5000;

// "My POAPs" reads from this browser's private state (one SPOAP token per issuer, with its own
// attendance list) — see src/midnight/witnesses.ts. This is deliberately NOT sourced from the
// public indexer: attendance history is private witness state and isn't indexed on-chain at all.
const PoapManagement = () => {
  const [loading, setLoading] = useState(true);
  const [myPoaps, setMyPoaps] = useState([]);
  const { midnight: { provider } } = useDrawer();
  const dispatch = useDrawerDispatch();
  const pollRef = useRef(null);

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

  return (
    <Layout activeMenu={3}>
      <>
        <div className="row">
          <div className="col-xxl-12 col-xl-12 col-lg-12 col-md-12">
            <div className="card inner-header">
              <div className="d-flex justify-content-between m-3">
                <div className="inner-header-back">
                  <Link to="/events" className="simple-link">
                    <i className="icofont-rounded-left"></i>
                  </Link>
                </div>
                <div className="inner-header-title">
                  <h4>My POAPs</h4>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="row">
          <div className="col-xxl-3 col-xl-3 col-lg-4 col-md-6 col-sm-12">
            <div className="card card-create bg-poap card-classic">
              <div className="card-body card-classic-max-height" onClick={provider ? createPoap : undefined}>
                <h4>CLAIM <span> SPOAP</span></h4>
                <div className={(provider ? "plus-button" : "axis-button") + " align-content-center"}>
                  <div></div><div></div>
                </div>
              </div>
              <div className="d-flex justify-content-between m-3">
                <div className="align-content-center mt-4">
                  <span className="verified">
                    {provider ? <i className="icofont-check-alt"></i> : <i className="icofont-close-line"></i>}
                  </span>
                </div>
                <div className="align-content-center mt-4">
                  {!provider && (
                    <button className="btn btn-white btn-small" onClick={showMidnightWallet}>
                      Connect
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>

          {loading ? (
            <div className="col-xxl-3 col-xl-3 col-lg-4 col-md-6 col-sm-6">
              <div className="card card-poap card-classic">
                <div className="card-body card-classic-max-height d-flex justify-content-center">
                  <div className="loading-poap-card">
                    <img src={loadingGif} width="35" height="35" alt="Loading POAPs" />
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <>
              {provider && myPoaps.length > 0 && (
                <>
                  {myPoaps.map((poap) => (
                    <PoapCard key={poap.issuerPkHex} poap={poap} />
                  ))}
                </>
              )}

              {provider && myPoaps.length === 0 && (
                <div className="col-xxl-12 col-xl-12 col-lg-12 col-md-12">
                  <div className="card card-poap card-classic">
                    <div className="card-body text-center py-5">
                      <img src={poapNormal} width="100" height="100" alt="No POAPs" className="mb-3" />
                      <h4>No POAPs Found</h4>
                      <p className="text-muted">
                        You don't have any POAPs yet. Claim your first SPOAP by attending an event!
                      </p>
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
