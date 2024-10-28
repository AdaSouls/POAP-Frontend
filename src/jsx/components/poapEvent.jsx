import eventNormal from "../../images/svg/event-normal.svg";
import circleArrow from "../../icons/svg/circle-arrow.svg";
import formatDateToDDMMYYYY from "../../utils/formatDateToDDMMYYYY";
import { useDrawerDispatch } from "../contexts/drawer/drawer.provider";

const PoapEvent = ({ event, index }) => {
  const dispatch = useDrawerDispatch();

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
      payload: { event, mockData },
    });
  };

  return (
    <tr key={index}>
      <td className="table-image">
        <img
          className="rounded-circle"
          src={eventNormal}
          width="47"
          height="47"
          alt="Poap Event"
        />
      </td>
      <td>Event ID: {event.eventId}</td>
      <td>Issuer ID: {event.issuerId}</td>
      <td>Expiration: {formatDateToDDMMYYYY(event.mintExpiration * 1000)}</td>
      <td>Minted: {event.totalSupply} of {event.maxSupply}</td>
      <td className="table-press-icon">
        <button
          onClick={() => viewEvent()}
          style={{
            border: "none",
            backgroundColor: "rgba(0, 0, 0, 0)",
            color: "rgba(0, 0, 0, 0)",
            width: "auto",
            height: "auto",
          }}
        >
          <img src={circleArrow} width="30" height="30" alt="" />
        </button>
      </td>
    </tr>
  );
};

export default PoapEvent;
