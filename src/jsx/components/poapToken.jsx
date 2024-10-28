// import { useDrawerDispatch } from "../contexts/drawer/drawer.provider";
import { Link } from "react-router-dom";
import poapNormal from "../../images/svg/poap-normal.svg";
import circleArrow from "../../icons/svg/circle-arrow.svg";

const PoapToken = ({poap, index}) => {
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
          <img src={circleArrow} width="30" height="30" alt="" />
        </Link>
      </td>
    </tr>
  );
};

export default PoapToken;
