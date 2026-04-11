import { useDrawerDispatch } from "../contexts/drawer/drawer.provider";
import poapNormal from "../../images/svg/poap-normal.svg";
import circleArrow from "../../icons/svg/circle-arrow.svg";
import formatDateToDDMMYYYY from "../../utils/formatDateToDDMMYYYY";

const PoapToken = ({ poap, index }) => {
  const dispatch = useDrawerDispatch();

  const viewPoap = () => {
    dispatch({
      type: "VIEW_POAP_TOKEN",
      payload: poap,
    });
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
      <td>Issuer ID: {poap.events[0].issuerIdInContract}</td>
      <td>Instance: {poap.instance}</td>
      <td>Minted: {formatDateToDDMMYYYY(poap.createdAt)}</td>
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
