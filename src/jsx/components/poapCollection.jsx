import { useEffect, useState } from "react";
import {
  useDrawer,
  useDrawerDispatch,
} from "../contexts/drawer/drawer.provider";
import { Link } from "react-router-dom";
import poapNormal from "../../images/svg/poap-normal.svg";
import circleArrow from "../../icons/svg/circle-arrow.svg";
import circlePlus from "../../icons/svg/circle-plus.svg";
import PoapToken from "./poapToken";
import walletStatus from "../../images/collections/wallet-status.png";
import {
  getOwnerPoapsService,
  getOwnerByAddressService,
} from "../../services/paima.service";

const PoapCollection = () => {
  const {
    ethereum: { provider },
    poapEvents,
    poapOwner,
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
  const updateOwner = (owner) => {
    dispatch({
      type: "UPDATE_OWNER",
      payload: owner,
    });
  };

  useEffect(() => {
    async function fetchData() {
      if (provider && provider.address) {
        setLoading(true);
        const poaps = await getOwnerPoapsService(
          provider.address.toLowerCase()
        );
        console.log("🚀 ~ fetchData ~ poaps:", poaps);
        const owner = await getOwnerByAddressService(
          provider.address.toLowerCase()
        );
        updatePoaps(poaps);
        updateOwner(owner);
        setLoading(false);
      }
    }
    fetchData();
  }, [provider]);

  return (
    <div>
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
            {provider ? (
              <table className="table table-striped table-small responsive-table">
                {loading && poapCollection.length === 0 && (
                  <tbody>
                    <tr key={0}>
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
                          <img src={circlePlus} width="30" height="30" alt="" />
                        </div>
                      </td>
                    </tr>
                    {/* <tr key={1}>
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
                          <img src={circlePlus} width="30" height="30" alt="" />
                        </div>
                      </td>
                    </tr>
                    <tr key={2}>
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
                          <img src={circlePlus} width="30" height="30" alt="" />
                        </div>
                      </td>
                    </tr>
                    <tr key={3}>
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
                          <img src={circlePlus} width="30" height="30" alt="" />
                        </div>
                      </td>
                    </tr> */}
                  </tbody>
                )}
                {poapCollection.length > 0 &&
                  poapCollection.map((poap, index) => {
                    return (
                      <tbody key={index}>
                        <PoapToken poap={poap} index={index} />
                      </tbody>
                    );
                  })}
                {poapCollection.length === 0 && !loading && (
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
                  </tbody>
                )}
              </table>
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

export default PoapCollection;
