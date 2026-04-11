import React, { useState } from "react";
import formatDateToDDMMYYYY from "../../utils/formatDateToDDMMYYYY";

const EventBody = ({ event }) => {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);

  // Helper function to check if a value should be displayed
  const hasValue = (value) => {
    return value !== null && value !== undefined && value !== "";
  };

  // Get transaction hash from event (supports both snake_case and camelCase)
  const txHash = event.transaction_hash || event.txHash;
  const explorerUrl = txHash && process.env.REACT_APP_POLYGON_AMOY_BLOCK_EXPLORER_URL
    ? `${process.env.REACT_APP_POLYGON_AMOY_BLOCK_EXPLORER_URL}/tx/${txHash}`
    : null;

  return (
    <div className="row g-3">
      {/* Event Image */}
      {hasValue(event.imageUrl) && (
        <div className="col-12 mb-3">
          <div
            className="position-relative"
            style={{
              width: "100%",
              aspectRatio: "16 / 9",
            }}
          >
            {!imageLoaded && !imageError && (
              <div
                className="position-absolute w-100 h-100 d-flex align-items-center justify-content-center"
              >
                <div className="spinner-border text-secondary" role="status">
                  <span className="visually-hidden">Loading...</span>
                </div>
              </div>
            )}
            {imageError && (
              <div
                className="position-absolute w-100 h-100 d-flex align-items-center justify-content-center rounded-pill"
              >
                <span>Image not available</span>
              </div>
            )}
            <img
              src={event.imageUrl}
              alt={event.title || "Event image"}
              className="img-fluid rounded-pill"
              style={{
                width: "100%",
                height: "100%",
                objectFit: "cover",
                display: imageLoaded ? "block" : "none",
              }}
              onLoad={() => setImageLoaded(true)}
              onError={() => {
                setImageError(true);
                setImageLoaded(false);
              }}
            />
          </div>
        </div>
      )}

      {/* Event Title */}
      {hasValue(event.title) && (
        <div className="col-12">
          <p className="m-0 small gray">Event Title</p>
          <h4 className="mb-3">{event.title}</h4>
        </div>
      )}

      {/* Description */}
      {hasValue(event.description) && (
        <div className="col-12">
          <p className="m-0 small gray">Description</p>
          <p className="m-0 mb-3">{event.description}</p>
        </div>
      )}

      <h4 className="pb-3 max-width col-12">Details</h4>

      {/* Event ID */}
      {hasValue(event.eventId) && (
        <div className="col-6">
          <p className="m-0 small gray">Event ID</p>
          <p className="m-0 mb-3">{event.eventId}</p>
        </div>
      )}

      {/* Event UUID */}
      {/* {hasValue(event.eventUuid) && (
        <div className="col-6">
          <p className="m-0 small gray">Event UUID</p>
          <p className="m-0 mb-3 text-break small">{event.eventUuid}</p>
        </div>
      )} */}

      {/* Issuer ID */}
      {hasValue(event.issuerId) && (
        <div className="col-6">
          <p className="m-0 small gray">Issuer ID</p>
          <p className="m-0 mb-3">{event.issuerId}</p>
        </div>
      )}

      {/* Status */}
      {/* {hasValue(event.status) && (
        <div className="col-6">
          <p className="m-0 small gray">Status</p>
          <p className="m-0 mb-3">{event.status}</p>
        </div>
      )} */}

      {/* Max Supply */}
      {hasValue(event.maxSupply) && (
        <div className="col-6">
          <p className="m-0 small gray">Max Supply</p>
          <p className="m-0 mb-3">{event.maxSupply}</p>
        </div>
      )}

      {/* Total Supply */}
      {hasValue(event.totalSupply) && (
        <div className="col-6">
          <p className="m-0 small gray">Available Supply</p>
          <p className="m-0 mb-3">{event.maxSupply - event.totalSupply}</p>
        </div>
      )}

      {/* Expiration */}
      {/* <div className="col-6">
        <p className="m-0 small gray">Expiration</p>
        <p className="m-0 mb-3">
          {event.expiration === 0
            ? "No expiry"
            : formatDateToDDMMYYYY(new Date(event.expiration * 1000))}
        </p>
      </div> */}

      {/* Event Start Date */}
      {hasValue(event.eventStartDate) && (
        <div className="col-6">
          <p className="m-0 small gray">Event Start Date</p>
          <p className="m-0 mb-3">
            {formatDateToDDMMYYYY(new Date(event.eventStartDate * 1000))}
          </p>
        </div>
      )}

      {/* Event End Date */}
      {/* {hasValue(event.eventEndDate) && (
        <div className="col-6">
          <p className="m-0 small gray">Event End Date</p>
          <p className="m-0 mb-3">
            {formatDateToDDMMYYYY(new Date(event.eventEndDate))}
          </p>
        </div>
      )} */}
      <div className="col-6">
        <p className="m-0 small gray">Event End Date</p>
        <p className="m-0 mb-3">
          {event.expiration === 0
            ? "No expiry"
            : formatDateToDDMMYYYY(new Date(event.expiration * 1000))}
        </p>
      </div>

      {/* Organiser Address */}
      {hasValue(event.organiserAddress) && (
        <div className="col-12">
          <p className="m-0 small gray">Organiser Address</p>
          <p className="m-0 mb-3 text-break small">{event.organiserAddress}</p>
        </div>
      )}

      {/* Transaction Hash */}
      {hasValue(txHash) && (
        <div className="col-12">
          <p className="m-0 small gray">Transaction Hash</p>
          <p className="m-0 mb-3">
            {explorerUrl ? (
              <a 
                href={explorerUrl} 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-break small text-decoration-none"
              >
                <code>{txHash}</code>
              </a>
            ) : (
              <code className="text-break small">{txHash}</code>
            )}
          </p>
        </div>
      )}

      {/* Additional fields that might exist */}
      {hasValue(event.platform) && (
        <div className="col-6">
          <p className="m-0 small gray">Platform</p>
          <p className="m-0 mb-3">{event.platform}</p>
        </div>
      )}

      {hasValue(event.purpose) && (
        <div className="col-6">
          <p className="m-0 small gray">Purpose</p>
          <p className="m-0 mb-3">{event.purpose}</p>
        </div>
      )}

      {hasValue(event.account) && (
        <div className="col-6">
          <p className="m-0 small gray">Account</p>
          <p className="m-0 mb-3">{event.account}</p>
        </div>
      )}
    </div>
  );
};

export default EventBody;
