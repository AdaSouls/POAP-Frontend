import React, { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import Layout from "../layout/layout";
import { useDrawer, useDrawerDispatch } from "../contexts/drawer/drawer.provider";
import PoapCard from "../components/poapCard";
import poapNormal from "../../images/svg/poap-normal.svg";
import loadingGif from "../../images/loading.gif";
import walletStatus from "../../images/collections/wallet-status.png";
import { getUserPoaps } from "../../services/poap.service";

const PoapManagement = () => { 
  const { eventId } = useParams();
  const [loading, setLoading] = useState(true);
  const [poaps, setPoaps] = useState([]);
  const [myPoaps, setMyPoaps] = useState([]);
  const { poapCollection, ethereum: { provider, address } } = useDrawer();
  const dispatch = useDrawerDispatch();

  const createPoap = () => {
    dispatch({
      type: 'CREATE_POAP'
    });
  };

  useEffect(() => {
    setLoading(true);
    
    async function fetchPoaps() {
      if (!provider || !address) {
        setPoaps([]);
        setMyPoaps([]);
        setLoading(false);
        return;
      }

      try {
        // Get user's POAPs
        const userPoaps = await getUserPoaps(address);
        setMyPoaps(userPoaps);
        
        // Use POAPs from context if available
        if (poapCollection && poapCollection.length > 0) {
          setPoaps(poapCollection);
        } else {
          setPoaps(userPoaps);
        }
      } catch (error) {
        console.error("Error fetching POAPs:", error);
        setPoaps([]);
        setMyPoaps([]);
      }
      
      setLoading(false);
    }

    fetchPoaps();
  }, [provider, address, poapCollection]);

  return (
    <Layout activeMenu={3}>
      <>
        <div className="row">
          {/* HEADER */}
          <div className="col-xxl-12 col-xl-12 col-lg-12 col-md-12">
            <div className="card inner-header">
              <div className="d-flex justify-content-between m-3">
                <div className="inner-header-back">
                  <Link to="/events" className="simple-link">
                    <i className="icofont-rounded-left"></i>   
                  </Link>                            
                </div>
                <div className="inner-header-title">
                  <h4>
                    <span className="text-uppercase"></span>
                    POAP Management
                  </h4>
                </div>
                <div className="inner-header-buttons">
                  {/* Future: Add filter buttons */}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="row">
          {/* CREATE POAP CARD */}
          <div className="col-xxl-3 col-xl-3 col-lg-4 col-md-6 col-sm-12">
            <div className="card card-create bg-poap card-classic">
              <div className="card-body card-classic-max-height" onClick={provider ? createPoap : console.log("alert! wallet connect")}>
                <h4>CREATE <span> POAP</span></h4>               
                <div className={(provider ? "plus-button" : "axis-button")+" align-content-center"} >
                  <div></div><div></div>
                </div>              
              </div>
              <div className="d-flex justify-content-between m-3">
                <div className="align-content-center mt-4">                    
                  <span className="verified">
                    {provider && <i className="icofont-check-alt"></i>}
                    {!provider && <i className="icofont-close-line"></i>}
                  </span>     
                </div>
                <div className="align-content-center mt-4">
                  {/* Wallet connection status */}
                </div> 
              </div>
            </div>
          </div>

          {/* LOADING STATE */}
          {loading ? (
            <div className="col-xxl-3 col-xl-3 col-lg-4 col-md-6 col-sm-6">
              <div className="card card-poap card-classic">
                <div className="card-body card-classic-max-height d-flex justify-content-center">
                  <div className="loading-poap-card">
                    <img                        
                      src={loadingGif}
                      width="35"
                      height="35"
                      alt=""
                    />
                  </div> 
                </div>
                <div className="d-flex justify-content-between m-3">
                  <div className="align-content-center mt-4"></div>
                  <div className="align-content-center mt-5"></div> 
                </div>
              </div>
            </div>
          ) : (
            <>
              {/* MY POAPS (if wallet connected) */}
              {provider && myPoaps.length > 0 && (
                <>
                  {myPoaps.map(poap => (
                    <PoapCard key={`my-${poap.tokenId}`} poap={poap} index={0} />
                  ))}
                </>
              )}

              {/* ALL POAPS */}
              {provider ? (
                poaps.map(poap => (
                  <PoapCard key={poap.tokenId} poap={poap} index={0} />
                ))
              ) : (
                <div className="col-xxl-3 col-xl-4 col-lg-6 col-md-6">
                  <div className="card card-poap card-classic">
                    <div className="wallet-non-connected">
                      <img 
                        className="mt-6"                       
                        src={walletStatus}
                        width="150"
                        height="140"
                        alt=""
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* EMPTY STATE */}
              {provider && poaps.length === 0 && !loading && (
                <div className="col-xxl-12 col-xl-12 col-lg-12 col-md-12">
                  <div className="card card-poap card-classic">
                    <div className="card-body text-center py-5">
                      <img
                        src={poapNormal}
                        width="100"
                        height="100"
                        alt="No POAPs"
                        className="mb-3"
                      />
                      <h4>No POAPs Found</h4>
                      <p className="text-muted">
                        You don't have any POAPs yet. Create your first POAP or attend an event to receive one!
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
