import { useEffect, useState } from "react";
import {
  useDrawer,
  useDrawerDispatch,
} from "../contexts/drawer/drawer.provider";
import { Link } from "react-router-dom";
import poapNormal from "../../images/svg/poap-normal.svg";
// import eventNormal from "../../images/svg/event-normal.svg";
import circleArrow from "../../icons/svg/circle-arrow.svg";
import circlePlus from "../../icons/svg/circle-plus.svg";
import PoapToken from "./poapToken";
import { getMintedTokensByAddress } from "../../utils/poapContractInteractions";
import walletStatus from "../../images/collections/wallet-status.png";

const PoapCollection = () => {
  const {
    ethereum: { provider },
    poapEvents,
    poapCollection,
  } = useDrawer();
  const dispatch = useDrawerDispatch();
  const [loading, setLoading] = useState(false);

  const updatePoaps = (poaps) => {
    dispatch({
      type: "UPDATE_POAPS",
      payload: poaps,
    });
  };

  [].map((e, i) => console.log(e, i));

  useEffect(() => {
    async function fetchData() {
      if (provider && poapCollection.length === 0) {
        setLoading(true);
        const mintedPoaps = await getMintedTokensByAddress(
          provider.address,
          provider.signer,
          poapEvents
        );
        updatePoaps(mintedPoaps);
        setLoading(false);
      }
    }
    fetchData();
  }, [provider]);

  return (
    <div className="row">
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
                      {loading && poapCollection.length === 0 && (
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
                      {poapCollection.length > 0 &&
                        poapCollection.map((poap, index) => {
                          return (
                            <PoapToken poap={poap} index={index} key={index} />
                          );
                        })}

                      {poapCollection.length === 0 && !loading && (
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
                      <img src={walletStatus} width="150" height="140" alt="" />
                    </div>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PoapCollection;
