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

  const mockData = {
    title: "Tech Innovations Conference",
    description:
      "The Tech Innovations Conference is a gathering of the brightest minds in the tech industry.",
    city: "San Francisco",
    country: "USA",
    startDate: "2024-06-15T09:00:00Z",
    endDate: "2024-08-13T17:00:00Z",
    year: 2024,
    eventUrl: "https://www.techinnovationsconf.com",
    virtualEvent: false,
    image: "https://www.example.com/event-image.jpg",
    secretCode: 12345,
    eventTemplateId: 101,
    email: "info@techinnovationsconf.com",
    requestedCodes: 500,
    privateEvent: true,
    purpose: "Networking and knowledge sharing",
    platform: "Eventbrite",
    amountOfAttendees: 300,
    account: "TechCon2024",
    eventType: "Virtual",
    poapType: "Poap",
    poapsToBeMinted: 50,
    mintedPoaps: 0,
  };

  const viewEvent = () => {
    dispatch({
      type: "VIEW_EVENT",
      payload: { event, mockData, mintable },
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
      <td className="col-2">Event ID: {event.eventId}</td>
      <td className="col-2">Issuer ID: {event.issuerId}</td>
      <td className="col-3">
        Expiration: {formatDateToDDMMYYYY(event.mintExpiration * 1000)}
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
        Minted: {event.totalSupply} of {event.maxSupply}
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
            // width: "auto",
            // height: "auto",
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
            alt=""
          />
        </button>
      </td>
    </tr>
  );
};

export default PoapEvent;
