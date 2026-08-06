import { useNavigate } from "react-router-dom";
import poapNormal from "../../images/svg/poap-normal.svg";
import circleArrow from "../../icons/svg/circle-arrow.svg";

// Detail viewing for POAP tokens now lives entirely on /poap-management's card grid (see
// poapCard.jsx's in-place expansion) — this legacy table just routes there instead of opening its
// own detail view.
const PoapToken = ({ poap, index }) => {
  const navigate = useNavigate();

  const viewPoap = () => {
    navigate("/poap-management");
  };

  return (
    <tr key={index}>
      <td className="table-image">
        <img
          className="rounded-circle"
          src={poapNormal}
          width="47"
          height="47"
          alt="Poap"
        />
      </td>
      <td>Issuer: {poap.issuerPkHex?.slice(0, 10)}…</td>
      <td>Token ID: {String(poap.tokenId)}</td>
      <td>Events attended: {poap.attendedEventIds?.length ?? 0}</td>
      <td className="table-press-icon">
        <button
          className="btn btn-white btn-small"
          onClick={() => viewPoap()}
          style={{
            border: "none",
            backgroundColor: "rgba(0, 0, 0, 0)",
            color: "rgba(0, 0, 0, 0)",
          }}
        >
          <img src={circleArrow} width="30" height="30" alt="" />
        </button>
      </td>
    </tr>
  );
};

export default PoapToken;
