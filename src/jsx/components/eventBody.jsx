import React from "react";
import collectionMultisigImage from "../../images/svg/collection-multisig.svg";
import tokenSoulMultisig from "../../images/svg/soul-multisig.svg";
import formatDateToDDMMYYYY from "../../utils/formatDateToDDMMYYYY";

const EventBody = ({ event }) => {
  // Helper function to check if a value should be displayed
  const hasValue = (value) => {
    return value !== null && value !== undefined && value !== "";
  };

  return (
    <div className="row g-3">
      {/* <div className="card card-button">
        <div className="card-body top-area d-flex cursor-default">
          <div className="d-flex align-items-center">
            <img
              className="mr-3 rounded-circle wallet-circle mr-0 mr-sm-3"
              src={
                // hasValue(event.image) && event.image.length > 12
                //   ? event.image
                //   : collectionMultisigImage
                collectionMultisigImage
              }
              width="60"
              height="60"
              alt=""
            />
            <div className="media-body">
              <p className="m-0 small gray">Event Title</p>
              <h4 className="mb-0">{event.title}</h4>
            </div>
          </div>
        </div>
      </div>

      <div className="card card-button">
        <div className="card-body top-area d-flex cursor-default">
          <div className="d-flex align-items-center">
            <img
              className="mr-3 mr-0 mr-sm-3"
              src={tokenSoulMultisig || "/placeholder.svg"}
              width="60"
              height="60"
              alt=""
            />
            <div className="media-body">
              <p className="m-0 small gray">Poap Token</p>
              <h4 className="mb-0">{event.poapType}</h4>
            </div>
          </div>
        </div>
      </div> */}

      {/* <div className="text-break p-4"> */}
      <h4 className="pb-3 max-width">Details</h4>

      <div className="col-6">
        <p className="m-0 small gray">Event ID</p>
        <p className="m-0 mb-3">{event.eventId}</p>
      </div>
      <div className="col-6">
        <p className="m-0 small gray">Issuer ID</p>
        <p className="m-0 mb-3">{event.issuerId}</p>
      </div>
      {/* {hasValue(event.email) && (
        <>
          <p className="m-0 small gray">Email</p>
          <p className="m-0 mb-3">{event.email}</p>
        </>
      )}

      {hasValue(event.eventType) && (
        <>
          <p className="m-0 small gray">Event Type</p>
          <p className="m-0 mb-3">{event.eventType}</p>
        </>
      )} */}

      {/* {hasValue(event.description) && (
        <>
          <p className="m-0 small gray">Description</p>
          <p className="m-0 mb-3">{event.description}</p>
        </>
      )} */}
      {/* The items in the div have to be centered both vertically and horizontally with flex */}
      {/* <div className="col-4 ">
        <p className="m-0 small gray">Start Date</p>
        <p className="m-0 mb-3">{formatDateToDDMMYYYY(event.startDate)}</p>
      </div>
      <div className="col-4 ">
        <p className="m-0 small gray">End Date</p>
        <p className="m-0 mb-3">{formatDateToDDMMYYYY(event.endDate)}</p>
      </div> */}
      <div className="col-12 ">
        <p className="m-0 small gray">Expiration</p>
        <p className="m-0 mb-3">{formatDateToDDMMYYYY(new Date(event.expiration))}</p>
      </div>

      {/* {hasValue(event.city) && (
        <>
          <p className="m-0 small gray">City</p>
          <p className="m-0 mb-3">{event.city}</p>
        </>
      )}

      {hasValue(event.country) && (
        <>
          <p className="m-0 small gray">Country</p>
          <p className="m-0 mb-3">{event.country}</p>
        </>
      )}

      {hasValue(event.eventUrl) && (
        <>
          <p className="m-0 small gray">Event URL</p>
          <a href={event.eventUrl} target="_blank" rel="noopener noreferrer">
            <p className="m-0 mb-3">{event.eventUrl}</p>
          </a>
        </>
      )}

      {hasValue(event.amountOfAttendees) && (
        <div className="col-4 ">
          <p className="m-0 small gray">Amount of Attendees</p>
          <p className="m-0 mb-3">{event.amountOfAttendees}</p>
        </div>
      )} */}
      <div
        className={`${hasValue(event.amountOfAttendees) ? "col-4" : "col-6"} `}
      >
        <p className="m-0 small gray">POAPs to be Minted</p>
        <p className="m-0 mb-3">{event.poapsToBeMinted}</p>
      </div>
      <div
        className={`${hasValue(event.amountOfAttendees) ? "col-4" : "col-6"} `}
      >
        <p className="m-0 small gray">Requested Codes</p>
        <p className="m-0 mb-3">{event.requestedCodes}</p>
      </div>

      {/* <div className="col-6">
        <p className="m-0 small gray">Private Event</p>
        <p className="m-0 mb-3">{event.privateEvent ? "Yes" : "No"}</p>
      </div>
      <div className="col-6">
        <p className="m-0 small gray">Virtual Event</p>
        <p className="m-0 mb-3">{event.virtualEvent ? "Yes" : "No"}</p>
      </div> */}
      {hasValue(event.platform) && (
        <>
          <p className="m-0 small gray">Platform</p>
          <p className="m-0 mb-3">{event.platform}</p>
        </>
      )}

      {hasValue(event.purpose) && (
        <>
          <p className="m-0 small gray">Purpose</p>
          <p className="m-0 mb-3">{event.purpose}</p>
        </>
      )}

      {hasValue(event.account) && (
        <>
          <p className="m-0 small gray">Account</p>
          <p className="m-0 mb-3">{event.account}</p>
        </>
      )}
    </div>
  );
};

export default EventBody;
