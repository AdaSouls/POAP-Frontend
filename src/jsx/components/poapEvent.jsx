import eventNormal from "../../images/svg/event-normal.svg";
import circleArrow from "../../icons/svg/circle-arrow.svg";
import mintTokenButton from "../../icons/svg/mint-token-button.svg";
import formatDateToDDMMYYYY from "../../utils/formatDateToDDMMYYYY";
import {
  useDrawerDispatch,
  useDrawer,
} from "../contexts/drawer/drawer.provider";

const PoapEvent = ({ event, index, mintable, owned }) => {
  const dispatch = useDrawerDispatch();
  const {
    ethereum: { provider },
  } = useDrawer();

  const viewEvent = () => {
    dispatch({
      type: "VIEW_EVENT",
      payload: { event, mintable },
    });
  };

  // const isExpired = () => {
  //   return event.mintExpiration * 1000 <= Date.now();
  // };

  return (
    <tr key={index}>
      <td className="table-image col-1">
        <img
          className="rounded-circle"
          src={eventNormal}
          width="47"
          height="47"
          alt="Poap Event"
        />
      </td>
      <td className="col-2">Event ID: {event.eventIdInContract}</td>
      <td className="col-2">Issuer ID: {event.issuerIdInContract}</td>
      <td className="col-3">
        {/* Expiration: {formatDateToDDMMYYYY(event.mintExpiration * 1000)} */}
        Expiration: {formatDateToDDMMYYYY(event.expiryDate)}
        {event.isExpired && (
          <span
            alt="Expired"
            style={{
              border: "1px solid rgb(232, 75, 75)",
              borderRadius: "10px",
              margin: "2px",
              marginLeft: "10px",
              padding: "2px 5px",
              color: "rgb(232, 75, 75)",
              fontSize: "10px",
            }}
          >
            Expired
          </span>
        )}
      </td>
      <td className="col-3">
        Minted: {event.mintedPoaps} of {event.poapsToBeMinted}
        {owned && (
          <span
            alt="Already minted"
            style={{
              border: "1px solid rgb(232, 75, 75)",
              borderRadius: "10px",
              margin: "2px",
              marginLeft: "10px",
              padding: "2px 5px",
              color: "rgb(232, 75, 75)",
              fontSize: "10px",
            }}
          >
            Already minted
          </span>
        )}
      </td>
      <td className="col-1">
        <button
          className="btn btn-white btn-small"
          onClick={() => viewEvent()}
          style={{
            border: "none",
            backgroundColor: "rgba(0, 0, 0, 0)",
            color: "rgba(0, 0, 0, 0)",
          }}
        >
          <img
            src={
              !provider
                ? circleArrow
                : event.isExpired
                ? circleArrow
                : owned
                ? circleArrow
                : mintable
                ? mintTokenButton
                : circleArrow
            }
            alt="View Event"
          />
        </button>
      </td>
    </tr>
  );
};

export default PoapEvent;
