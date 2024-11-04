import {
  useDrawer,
  useDrawerDispatch,
} from "../../contexts/drawer/drawer.provider";
import collectionMultisigImage from "../../../images/svg/collection-multisig.svg";
import tokenSoulMultisig from "../../../images/svg/soul-multisig.svg";
import formatDateToDDMMYYYY from "../../../utils/formatDateToDDMMYYYY";
import { mintToken, getMintedTokensByAddress } from "../../../utils/poapContractInteractions";

export default function ViewEvent() {
  const {
    event,
    ethereum: { provider },
    poapEvents,
  } = useDrawer();
  // console.log("🚀 ~ ViewEvent ~ event:", event);
  const dispatch = useDrawerDispatch();
  // event: {
  //     title,
  //     description,
  //     city: "San Francisco",
  //     country: "USA",
  //     startDate: "2024-06-15T09:00:00Z",
  //     endDate: "2024-08-13T17:00:00Z",
  //     expiryDate: date ? expiryDate : undefined,
  //     year: 2024,
  //     eventUrl: "https://www.techinnovationsconf.com",
  //     virtualEvent: false,
  //     image: "https://www.example.com/event-image.jpg",
  //     secretCode: 12345,
  //     eventTemplateId: 101,
  //     email: "info@techinnovationsconf.com",
  //     requestedCodes: 500,
  //     privateEvent: true,
  //     purpose: "Networking and knowledge sharing",
  //     platform: "Eventbrite",
  //     amountOfAttendees: 300,
  //     account: "TechCon2024",
  //     eventType: "Virtual",
  //     poapType: "Poap",
  //     poapsToBeMinted: 50,
  //     mintedPoaps: 0,
  //   }

  const closeDrawer = () => {
    dispatch({
      type: "CLOSE_DRAWER",
    });
  };

  const updatePoaps = (poaps) => {
    dispatch({
      type: "UPDATE_POAPS",
      payload: poaps,
    });
  };

  const mintPoap = async (issuerId, eventId) => {
    const minting = await mintToken(
      issuerId,
      eventId,
      provider.address,
      provider.signer
    );
    const poaps = await getMintedTokensByAddress(
      provider.address,
      provider.signer,
      poapEvents
    );
    updatePoaps(poaps);
  };

  return (
    <div className="d-flex flex-column w-100 h-100 p-3">
      <div className="drawer-header">
        <div className="d-flex justify-content-start ">
          <button
            className="btn btn-close align-content-center px-1 mt-2 position-absolute"
            onClick={closeDrawer}
            aria-label="close"
          ></button>
          <h4 className="align-content-center text-center w-100 m-0 py-3 font-weight-semibold capitalize">
            Poap Event
          </h4>
        </div>
      </div>
      <div className="drawer-body">
        <div className="card card-button">
          <div className="card-body top-area d-flex cursor-default">
            <div className="d-flex align-items-center">
              {/* Modificar la img */}
              <img
                className="mr-3 rounded-circle wallet-circle mr-0 mr-sm-3"
                src={collectionMultisigImage}
                width="60"
                height="60"
                alt=""
              />
              <div className="media-body">
                <p className="m-0 small gray">Event Title</p>
                <h4 className="mb-0">{event.mockData.title}</h4>
              </div>
            </div>
          </div>
        </div>
        <div className="card card-button">
          <div className="card-body top-area d-flex cursor-default">
            <div className="d-flex align-items-center">
              {/* Modificar la img */}
              <img
                className="mr-3 mr-0 mr-sm-3"
                src={tokenSoulMultisig}
                width="60"
                height="60"
                alt=""
              />
              <div className="media-body">
                <p className="m-0 small gray">Poap Token</p>
                <h4 className="mb-0">"Something to see"</h4>
                {/* <h4 className="mb-0">{event.mockData.description}</h4> */}
              </div>
            </div>
          </div>
        </div>
        <div className="text-break p-4">
          <h4 className="pb-3 max-width">Details</h4>
          <p className="m-0 small gray">Event ID</p>
          <p className="m-0 mb-3">{event.event.eventId}</p>
          <p className="m-0 small gray">Event Organizer</p>
          <p className="m-0 mb-3">{event.event.eventOrganizer}</p>
          {event.event.txHash && (
            <>
              <p className="m-0 small gray">Creation Hash</p>
              <a
                href={`https://amoy.polygonscan.com/tx/${event.event.txHash}`}
                target="_blank"
              >
                <p className="m-0 mb-3">Link to Amoy Polygon Scan</p>
              </a>
            </>
          )}
          <p className="m-0 small gray">Expiration</p>
          <p className="m-0 mb-3">
            {formatDateToDDMMYYYY(event.event.mintExpiration * 1000)}
          </p>
          <p className="m-0 small gray">Start Date</p>
          <p className="m-0 mb-3">
            {formatDateToDDMMYYYY(event.mockData.startDate)}
          </p>
          <p className="m-0 small gray">End Date</p>
          <p className="m-0 mb-3">
            {formatDateToDDMMYYYY(event.mockData.endDate)}
          </p>
        </div>
      </div>
      {event.mintable && (
        <div className="drawer-footer">
          <div className="d-flex justify-content-center">
            <button
              className="btn btn-primary w-100"
              onClick={() => {
                mintPoap(event.event.issuerId, event.event.eventId);
              }}
            >
              Mint Poap
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
