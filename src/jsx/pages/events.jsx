import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import poapNormal from "../../images/svg/poap-normal.svg";
import eventNormal from "../../images/svg/event-normal.svg";
import circleArrow from "../../icons/svg/circle-arrow.svg";
import circlePlus from "../../icons/svg/circle-plus.svg";
import collectionMenu from "../../icons/svg/collection-menu.svg";
import loadingIcon from "../../icons/svg/loading-icon.svg";
import Layout from "../layout/layout";
import {
  useDrawer,
  useDrawerDispatch,
} from "../contexts/drawer/drawer.provider";
import walletStatus from "../../images/collections/wallet-status.png";
import {
  getEvents,
  mintToken,
  getPoaps,
  getMintedTokensByAddress,
} from "../../utils/poapContractInteractions";

const Events = () => {
  const [loading, setLoading] = useState(true);
  const {
    ethereum: { provider },
    poapCollection: { events, poaps },
  } = useDrawer();
  const dispatch = useDrawerDispatch();

  const createEvent = () => {
    dispatch({
      type: "CREATE_EVENT",
    });
  };

  const showEthereumWallet = () => {
    dispatch({
      type: "SHOW_ETHEREUM_WALLET",
    });
  };

  const updateEvents = (events) => {
    dispatch({
      type: "UPDATE_EVENTS",
      payload: events,
    });
  };

  const updatePoaps = (poaps) => {
    dispatch({
      type: "UPDATE_POAPS",
      payload: poaps,
    });
  };

  useEffect(() => {
    async function fetchData() {
      if (provider && events.length === 0) {
        const events = await getEvents(provider.signer);
        const mintedPoaps = await getMintedTokensByAddress(
          provider.address,
          provider.signer,
          events
        );
        updateEvents(events);
        updatePoaps(mintedPoaps);
        setLoading(false);
      }
    }
    fetchData();
  }, [provider]);

  const mintPoap = async (issuerId, eventId) => {
    const minting = await mintToken(
      issuerId,
      eventId,
      provider.address,
      provider.signer
    );
    const poaps = await getMintedTokensByAddress(
      provider.address,
      provider.signer,
      events
    );
    updatePoaps(poaps);
  };

  return (
    <Layout activeMenu={7}>
      <div className="row">
        <div className="col-xxl-3 col-xl-3 col-lg-4 col-md-5 col-sm-12">
          <div className="card card-create bg-poap card-classic">
            <div
              className="card-body card-classic-max-height"
              onClick={provider ? createEvent : console.log("nada")}
            >
              <h4>
                CREATE <span> POAP EVENT</span>
              </h4>
              <div
                className={
                  (provider ? "plus-button" : "axis-button") +
                  " align-content-center"
                }
              >
                <div></div>
                <div></div>
              </div>
            </div>
            <div className="d-flex justify-content-between m-3">
              <div className="align-content-center mt-4">
                <span className="not-verified">
                  <i className="icofont-close-line"></i>
                </span>
              </div>
              <div className="align-content-center mt-4">
                {!provider && (
                  <button
                    className="btn btn-white btn-small"
                    onClick={showEthereumWallet}
                  >
                    Connect
                  </button>
                )}
                {provider && (
                  <button
                    className="btn btn-danger btn-small"
                    onClick={showEthereumWallet}
                  >
                    Change Wallet
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="col-xxl-5 col-xl-5 col-lg-4 col-md-7 col-sm-12">
          <div className="card card-classic">
            <div className="card-header">
              <h4 className="card-title">Poap Collection</h4>
              <span></span>
            </div>
            <div
              className="card-body card-classic-max-height-title"
              style={{ overflow: "hidden", overflowY: "auto" }}
            >
              <div className="table-responsive">
                <table className="table table-striped table-small responsive-table">
                  <tbody>
                    {provider ? (
                      <>
                        {loading && poaps.length === 0 && (
                          <>
                            <tr>
                              <td className="table-image">
                                <img
                                  className="rounded-circle"
                                  src={poapNormal}
                                  width="47"
                                  height="47"
                                  alt=""
                                />
                              </td>
                              <td>Loading...</td>
                              <td className="table-press-icon">
                                <div className="table-link">
                                  <img
                                    src={circlePlus}
                                    width="30"
                                    height="30"
                                    alt=""
                                  />
                                </div>
                              </td>
                            </tr>
                            <tr>
                              <td className="table-image">
                                <img
                                  className="rounded-circle"
                                  src={poapNormal}
                                  width="47"
                                  height="47"
                                  alt=""
                                />
                              </td>
                              <td>Loading...</td>
                              <td className="table-press-icon">
                                <div className="table-link">
                                  <img
                                    src={circlePlus}
                                    width="30"
                                    height="30"
                                    alt=""
                                  />
                                </div>
                              </td>
                            </tr>
                            <tr>
                              <td className="table-image">
                                <img
                                  className="rounded-circle"
                                  src={poapNormal}
                                  width="47"
                                  height="47"
                                  alt=""
                                />
                              </td>
                              <td>Loading...</td>
                              <td className="table-press-icon">
                                <div className="table-link">
                                  <img
                                    src={circlePlus}
                                    width="30"
                                    height="30"
                                    alt=""
                                  />
                                </div>
                              </td>
                            </tr>
                            <tr>
                              <td className="table-image">
                                <img
                                  className="rounded-circle"
                                  src={poapNormal}
                                  width="47"
                                  height="47"
                                  alt=""
                                />
                              </td>
                              <td>Loading...</td>
                              <td className="table-press-icon">
                                <div className="table-link">
                                  <img
                                    src={circlePlus}
                                    width="30"
                                    height="30"
                                    alt=""
                                  />
                                </div>
                              </td>
                            </tr>
                          </>
                        )}
                        {poaps.length > 0 &&
                          poaps.map((poap, index) => {
                            return (
                              <tr key={index}>
                                <td className="table-image">
                                  <img
                                    className="rounded-circle"
                                    src={poapNormal}
                                    width="47"
                                    height="47"
                                    alt=""
                                  />
                                </td>
                                <td>Event ID: {poap.eventId}</td>
                                <td>Issuer ID: {poap.issuerId}</td>
                                <td>Instance: {poap.tokenId}</td>
                                <td className="table-press-icon">
                                  <Link to={"#"} className="table-link">
                                    <img
                                      src={circleArrow}
                                      width="30"
                                      height="30"
                                      alt=""
                                    />
                                  </Link>
                                </td>
                              </tr>
                            );
                          })}

                        {poaps.length === 0 && !loading && (
                          <tr>
                            <td className="table-image">
                              <img
                                className="rounded-circle"
                                src={poapNormal}
                                width="47"
                                height="47"
                                alt=""
                              />
                            </td>
                            <td>No minted poaps yet</td>
                            <td className="table-press-icon">
                              <Link to={"#"} className="table-link">
                                <img
                                  src={circleArrow}
                                  width="30"
                                  height="30"
                                  alt=""
                                />
                              </Link>
                            </td>
                          </tr>
                        )}
                      </>
                    ) : (
                      <div className="wallet-non-connected">
                        <img
                          src={walletStatus}
                          width="150"
                          height="140"
                          alt=""
                        />
                      </div>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>

        <div className="col-xxl-4 col-xl-4 col-lg-4 col-md-12">
          <div className="card card-classic">
            <div className="card-header">
              <h4 className="card-title">Events</h4>
              {provider && (
                <span>
                  <Link
                    to={"#"}
                    className="btn btn-gradient-purple btn-icon rounded-lg"
                  >
                    <img
                      className="p-1"
                      src={collectionMenu}
                      width="35"
                      height="35"
                      alt=""
                    />
                  </Link>
                </span>
              )}
            </div>
            <div
              className="card-body card-classic-max-height-title"
              style={{ overflow: "hidden", overflowY: "auto" }}
            >
              <div className="table-responsive">
                <table className="table table-striped table-small responsive-table">
                  <tbody>
                    {provider ? (
                      <>
                        {events.length > 0 ? (
                          events.map((event, index) => {
                            return (
                              <tr key={index}>
                                <td className="table-image">
                                  <img
                                    className="rounded-circle"
                                    src={eventNormal}
                                    width="47"
                                    height="47"
                                    alt=""
                                  />
                                </td>
                                <td>Event ID: {event.eventId}</td>
                                <td>Max supply: {event.maxSupply}</td>
                                <td className="table-press-icon">
                                  <button
                                    onClick={() =>
                                      mintPoap(event.issuerId, event.eventId)
                                    }
                                    style={{
                                      border: "none",
                                      backgroundColor: "rgba(0, 0, 0, 0)",
                                      color: "rgba(0, 0, 0, 0)",
                                      width: "auto",
                                      height: "auto",
                                    }}
                                  >
                                    <img
                                      src={circlePlus}
                                      width="30"
                                      height="30"
                                      alt=""
                                    />
                                  </button>
                                </td>
                              </tr>
                            );
                          })
                        ) : (
                          <>
                            <tr>
                              <td className="table-image">
                                <img
                                  className="rounded-circle"
                                  src={eventNormal}
                                  width="47"
                                  height="47"
                                  alt=""
                                />
                              </td>
                              <td>Loading...</td>
                              <td className="table-press-icon">
                                <div className="table-link">
                                  <img
                                    src={circlePlus}
                                    width="30"
                                    height="30"
                                    alt=""
                                  />
                                </div>
                              </td>
                            </tr>
                            <tr>
                              <td className="table-image">
                                <img
                                  className="rounded-circle"
                                  src={eventNormal}
                                  width="47"
                                  height="47"
                                  alt=""
                                />
                              </td>
                              <td>Loading...</td>
                              <td className="table-press-icon">
                                <div className="table-link">
                                  <img
                                    src={circlePlus}
                                    width="30"
                                    height="30"
                                    alt=""
                                  />
                                </div>
                              </td>
                            </tr>
                            <tr>
                              <td className="table-image">
                                <img
                                  className="rounded-circle"
                                  src={eventNormal}
                                  width="47"
                                  height="47"
                                  alt=""
                                />
                              </td>
                              <td>Loading...</td>
                              <td className="table-press-icon">
                                <div className="table-link">
                                  <img
                                    src={circlePlus}
                                    width="30"
                                    height="30"
                                    alt=""
                                  />
                                </div>
                              </td>
                            </tr>
                            <tr>
                              <td className="table-image">
                                <img
                                  className="rounded-circle"
                                  src={eventNormal}
                                  width="47"
                                  height="47"
                                  alt=""
                                />
                              </td>
                              <td>Loading...</td>
                              <td className="table-press-icon">
                                <div className="table-link">
                                  <img
                                    src={circlePlus}
                                    width="30"
                                    height="30"
                                    alt=""
                                  />
                                </div>
                              </td>
                            </tr>
                          </>
                        )}
                      </>
                    ) : (
                      <div className="wallet-non-connected">
                        <img
                          src={walletStatus}
                          width="150"
                          height="140"
                          alt=""
                        />
                      </div>
                    )}
                  </tbody>
                </table>
                {events.length > 4 && (
                  <Link
                    to={"/collections/all"}
                    className="btn btn-white btn-small btn-block mt-3"
                  >
                    See More
                  </Link>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Events;
