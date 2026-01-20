import { useEffect, useState, useCallback } from "react";
import {
  useDrawer,
  useDrawerDispatch,
} from "../contexts/drawer/drawer.provider";
import poapNormal from "../../images/svg/poap-normal.svg";
import circlePlus from "../../icons/svg/circle-plus.svg";
import walletStatus from "../../images/collections/wallet-status.png";
import { getIssuerByAddressService } from "../../services/paima.service";

const PoapIssuerDetails = () => {
  const {
    ethereum: { provider },
    poapIssuer,
  } = useDrawer();
  const dispatch = useDrawerDispatch();
  const [loading] = useState(false);

  const updateIssuer = useCallback((issuer) => {
    dispatch({
      type: "UPDATE_ISSUER",
      payload: issuer,
    });
  }, [dispatch]);

  useEffect(() => {
    console.log("🚀 ~ PoapIssuerDetails ~ provider changed");
    async function fetchData() {
      console.log("🚀 ~ fetchData");
      if (provider && !poapIssuer) {
        console.log("🚀 ~ fetchData ~ !poapIssuer");
        const issuer = await getIssuerByAddressService(
          provider.address.toLowerCase()
        );
        console.log("🚀 ~ fetchData ~ issuer:", issuer);
        if (!issuer) {
          return;
        }
        updateIssuer(issuer);
      }
    }
    fetchData();
  }, [provider, poapIssuer, updateIssuer]);

  return (
    <div className="row">
      <div className="card card-classic">
        <div className="card-header">
          <h4 className="card-title">Issuer Profile</h4>
          <span></span>
        </div>
        <div
          className="card-body card-classic-max-height-title"
          style={{ overflow: "hidden", overflowY: "auto" }}
        >
          <div className="table-responsive">
            {provider ? (
              <>
                {loading && (
                  <table className="table table-striped table-small responsive-table">
                    <tbody>
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
                    </tbody>
                  </table>
                )}
                {poapIssuer && (
                  <div>
                    <p>
                      <span className=" font-weight-bolder">UUID: </span>
                      {poapIssuer?.issuerUuid}
                    </p>
                    <p>
                      <span className=" font-weight-bolder">
                        ID in Contract:{" "}
                      </span>
                      {poapIssuer?.issuerIdInContract}
                    </p>
                    <p>
                      <span className=" font-weight-bolder">Name: </span>
                      {poapIssuer?.name}
                    </p>
                    <p>
                      <span className=" font-weight-bolder">Email: </span>
                      {poapIssuer?.email}
                    </p>
                    <p>
                      <span className=" font-weight-bolder">
                        Organization:{" "}
                      </span>
                      {poapIssuer?.organization}
                    </p>
                  </div>
                )}
              </>
            ) : (
              <div className="wallet-non-connected">
                <img src={walletStatus} width="150" height="140" alt="" />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PoapIssuerDetails;
