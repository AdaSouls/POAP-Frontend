import React from "react";
import { Link } from "react-router-dom";
import { useDrawerDispatch } from "../contexts/drawer/drawer.provider";
import eventNormal from "../../icons/svg/event.svg";
import eventOwnerIcon from "../../icons/svg/event.svg";
import eventStatusIcon from "../../icons/svg/event.svg";
import formatDateToDDMMYYYY from "../../utils/formatDateToDDMMYYYY";

const EventCard = ({ event, index }) => {
  const dispatch = useDrawerDispatch();

  const viewEvent = () => {
    dispatch({
      type: "VIEW_EVENT",
      payload: { event, mintable: true },
    });
  };

  const viewPoaps = () => {
    // Navigate to POAP management page for this event
    window.location.href = `/poap-management?eventId=${event.eventId}`;
  };

  const getStatusColor = (status) => {
    switch (status.toLowerCase()) {
      case 'pending':
        return 'text-warning';
      case 'active':
        return 'text-success';
      case 'completed':
        return 'text-info';
      case 'expired':
        return 'text-danger';
      default:
        return 'text-secondary';
    }
  };

  const getStatusIcon = (status) => {
    switch (status.toLowerCase()) {
      case 'pending':
        return 'icofont-clock-time';
      case 'active':
        return 'icofont-check-circled';
      case 'completed':
        return 'icofont-check-alt';
      case 'expired':
        return 'icofont-close-circled';
      default:
        return 'icofont-info-circle';
    }
  };

  const isExpired = () => {
    if (event.expiryDate) {
      return new Date(event.expiryDate) <= new Date();
    }
    if (event.expiration) {
      return event.expiration * 1000 <= Date.now();
    }
    return false;
  };

  const getMintProgress = () => {
    if (event.poapsToBeMinted && event.mintedPoaps !== undefined) {
      return `${event.mintedPoaps}/${event.poapsToBeMinted}`;
    }
    if (event.maxSupply) {
      return `0/${event.maxSupply}`;
    }
    return "0/0";
  };

  return (
    <div key={event.eventId || event.eventUuid} className="col-xxl-3 col-xl-3 col-lg-4 col-md-6 col-sm-6">
      <div className={`card card-event card-classic ${isExpired() ? 'bg-event-expired' : 'bg-event-normal'}`}>
        <div className="card-body card-classic-max-height d-flex justify-content-start">
          {/* <img
            className="mr-3 rounded-circle mr-0 mr-sm-3"
            src={event.image || eventNormal}
            width="50"
            height="50"
            alt="Event"
          /> */}
          <div className="event-info">
            <h4 className="text-capitalize mb-1">
              {event.title || `Event ${event.eventId}`}
            </h4>
            <p className="text-muted small mb-0">
              ID: {event.eventId}
            </p>
          </div>
        </div>
        <div className="d-flex justify-content-between m-3">
          <div className="align-content-center mt-4">
            <ul>
              <li className="d-flex justify-content-start">
                <img
                  className="mr-2"
                  src={eventStatusIcon}
                  width="25"
                  height="25"
                  alt=""
                />
                <p className={`pt-1 ${getStatusColor(event.status)}`}>
                  {event.status}
                </p>
              </li>
              <li className="d-flex justify-content-start">
                <img
                  className="mr-2"
                  src={eventOwnerIcon}
                  width="25"
                  height="25"
                  alt=""
                />
                <p className="pt-1">Organizer</p>
              </li>
              <li className="d-flex justify-content-start">
                <i className={`icofont ${getStatusIcon(event.status)} mr-2 mt-1`}></i>
                <p className="pt-1 small">
                  {event.expiryDate 
                    ? formatDateToDDMMYYYY(new Date(event.expiryDate))
                    : event.expiration 
                    ? formatDateToDDMMYYYY(event.expiration * 1000)
                    : 'No expiry'
                  }
                </p>
              </li>
            </ul>
          </div>
          <div className="align-content-center mt-5">
            <div className="mb-2">
              <small className="text-muted">
                Minted: {getMintProgress()}
              </small>
            </div>
            {isExpired() ? (
                <span className="btn btn-white btn-small disabled">Expired</span>
                ) : (
                <Link
                    to={`/poap-management?eventId=${event.eventId}`}
                    className="btn btn-white btn-small"
                >
                    View POAPs
                </Link>
                )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default EventCard;
