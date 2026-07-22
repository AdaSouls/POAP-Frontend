import React, { useState } from "react";
import eventNormal from "../../images/svg/event-normal.svg";
import circleArrow from "../../icons/svg/circle-arrow.svg";
import mintTokenButton from "../../icons/svg/mint-token-button.svg";
import formatDateToDDMMYYYY from "../../utils/formatDateToDDMMYYYY";
import { isEventExpired } from "../../utils/mitableChecks";
import {
  useDrawerDispatch,
  useDrawer,
} from "../contexts/drawer/drawer.provider";

const EventItem = ({ event, index, mintable, owned }) => {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);
  const dispatch = useDrawerDispatch();
  const {
    midnight: { provider },
  } = useDrawer();

  // Helper function to check if imageUrl exists
  const hasImageUrl = (url) => {
    return url !== null && url !== undefined && url !== "";
  };

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
        <div
          style={{
            width: "47px",
            height: "47px",
            minWidth: "47px",
            minHeight: "47px",
            position: "relative",
          }}
        >
          {hasImageUrl(event.imageUrl) && !imageError ? (
            <>
              {!imageLoaded && (
                <img
                  className="rounded-circle position-absolute"
                  src={eventNormal}
                  width="47"
                  height="47"
                  alt="Loading..."
                  style={{
                    top: 0,
                    left: 0,
                    opacity: 0.5,
                  }}
                />
              )}
              <img
                className="rounded-circle"
                src={event.imageUrl}
                width="47"
                height="47"
                alt={event.title || "Poap Event"}
                style={{
                  display: imageLoaded ? "block" : "none",
                  objectFit: "cover",
                }}
                onLoad={() => setImageLoaded(true)}
                onError={() => {
                  setImageError(true);
                  setImageLoaded(false);
                }}
              />
            </>
          ) : (
            <img
              className="rounded-circle"
              src={eventNormal}
              width="47"
              height="47"
              alt="Poap Event"
            />
          )}
        </div>
      </td>
      <td className="col-2">Event ID: {event.eventId?.slice(0, 10)}…</td>
      <td className="col-2">Organizer: {event.issuerPk?.slice(0, 10)}…</td>
      <td className="col-3">
        {/* Expiration: {formatDateToDDMMYYYY(event.mintExpiration * 1000)} */}
        Expiration: 
        {event.expiration === 0 ?
          'No expiry' :
          isEventExpired(event.expiration) ?
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
            </span>:
            formatDateToDDMMYYYY(new Date(event.expiration * 1000))}
        
      </td>
      <td className="col-3">
        Minted: {event.minted} of {event.maxSupply || '∞'}
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

export default EventItem;
