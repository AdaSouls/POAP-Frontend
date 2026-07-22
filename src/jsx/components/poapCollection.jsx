import { useEffect, useState, useCallback, useRef } from "react";
import { useDrawer } from "../contexts/drawer/drawer.provider";
import { Link } from "react-router-dom";
import poapNormal from "../../images/svg/poap-normal.svg";
import circleArrow from "../../icons/svg/circle-arrow.svg";
import circlePlus from "../../icons/svg/circle-plus.svg";
import PoapToken from "./poapToken";
import walletStatus from "../../images/collections/wallet-status.png";

const REFRESH_INTERVAL_MS = 5000;

// Reads SPOAP tokens from this browser's private state — see poapManagement.jsx for the same
// pattern and why it's not sourced from the (Paima-era) backend anymore.
const PoapCollection = () => {
  const { midnight: { provider } } = useDrawer();
  const [poaps, setPoaps] = useState([]);
  const [loading, setLoading] = useState(false);
  const pollRef = useRef(null);

  const loadPoaps = useCallback(async () => {
    if (!provider) {
      setPoaps([]);
      return;
    }
    setLoading(true);
    try {
      const { privateState } = await provider.service.getState();
      const tokens = Object.entries(privateState.tokens || {}).map(([issuerPkHex, token]) => ({
        issuerPkHex,
        tokenId: token.tokenId,
        isSoulbound: token.attendance.isSoulbound,
        attendedEventIds: token.attendance.eventIds.map((id) => Buffer.from(id).toString("hex")),
      }));
      setPoaps(tokens);
    } catch (error) {
      console.error("Error loading POAP collection:", error);
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
                {loading && poaps.length === 0 && (
                  <tbody>
                    <tr key={0}>
                      <td className="table-image">
                        <img className="rounded-circle" src={poapNormal} width="47" height="47" alt="" />
                      </td>
                      <td>Loading...</td>
                      <td className="table-press-icon">
                        <div className="table-link">
                          <img src={circlePlus} width="30" height="30" alt="" />
                        </div>
                      </td>
                    </tr>
                  </tbody>
                )}
                {poaps.length > 0 &&
                  poaps.map((poap, index) => (
                    <tbody key={poap.issuerPkHex}>
                      <PoapToken poap={poap} index={index} />
                    </tbody>
                  ))}
                {poaps.length === 0 && !loading && (
                  <tbody>
                    <tr>
                      <td className="table-image">
                        <img className="rounded-circle" src={poapNormal} width="47" height="47" alt="" />
                      </td>
                      <td>No minted poaps yet</td>
                      <td className="table-press-icon">
                        <Link to={"#"} className="table-link">
                          <img src={circleArrow} width="30" height="30" alt="" />
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
