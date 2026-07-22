import React from "react";
import { Link } from "react-router-dom";
import { useDrawerDispatch } from "../contexts/drawer/drawer.provider";
import eventNormal from "../../images/svg/event-normal.svg";
import eventOwnerIcon from "../../icons/svg/collection-owner.svg";
import formatDateToDDMMYYYY from "../../utils/formatDateToDDMMYYYY";

// Event data now comes entirely from the on-chain-only Midnight indexer (see
// src/midnight/indexer.service.ts) — there is no title/description/image metadata to show, only
// what the contract's ledger actually tracks: event id, organizer pk, supply, expiration, and
// active/public-mint flags.
const truncateHex = (hex) => {
  if (!hex) return "N/A";
  return `${hex.slice(0, 8)}…${hex.slice(-6)}`;
};

const EventCard = ({ event }) => {
  const dispatch = useDrawerDispatch();

  const viewEvent = () => {
    dispatch({
      type: "VIEW_EVENT",
      payload: { event, mintable: canMint() },
    });
  };

  const isExpired = Boolean(event.expiration && event.expiration > 0 && event.expiration * 1000 <= Date.now());
  const isFull = Boolean(event.maxSupply && event.maxSupply > 0 && event.minted >= event.maxSupply);
  const status = !event.isActive ? "inactive" : isExpired ? "expired" : isFull ? "full" : "active";

  const canMint = () => status === "active";

  const statusBadgeClass = {
    active: "badge bg-success",
    expired: "badge bg-danger",
    full: "badge bg-warning",
    inactive: "badge bg-secondary",
  }[status];

  const available = event.maxSupply > 0 ? Math.max(0, event.maxSupply - event.minted) : undefined;
  const progressPercentage = event.maxSupply > 0 ? Math.min((event.minted / event.maxSupply) * 100, 100) : 0;

  return (
    <div className="col-xxl-3 col-xl-3 col-lg-4 col-md-6 col-sm-6 mb-3">
      <div
        className={`card card-event card-classic ${isExpired ? "bg-event-expired" : "bg-event-normal"}`}
        style={{
          transition: "transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out",
          cursor: "pointer",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = "translateY(-4px)";
          e.currentTarget.style.boxShadow = "0 8px 16px rgba(0,0,0,0.2)";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = "translateY(0)";
          e.currentTarget.style.boxShadow = "";
        }}
        onClick={viewEvent}
      >
        <div className="card-body card-classic-max-height">
          <div className="d-flex justify-content-start mb-3">
            <img
              className="mr-3 rounded-circle"
              src={eventNormal}
              width="60"
              height="60"
              alt=""
              style={{ border: "2px solid rgba(255,255,255,0.3)", flexShrink: 0 }}
            />
            <div className="event-info flex-grow-1">
              <h4 className="mb-2" style={{ fontSize: "16px", fontWeight: "600" }}>
                Event {truncateHex(event.eventId)}
              </h4>
              <span className={`${statusBadgeClass} text-capitalize`} style={{ fontSize: "10px", padding: "2px 8px" }}>
                {status}
              </span>
            </div>
          </div>

          <ul className="list-unstyled mb-3" style={{ fontSize: "13px" }}>
            <li className="d-flex align-items-center mb-2">
              <img className="mr-2" src={eventOwnerIcon} width="16" height="16" alt="" style={{ flexShrink: 0 }} />
              <span className="text-muted small">
                Organizer: <span className="text-white">{truncateHex(event.issuerPk)}</span>
              </span>
            </li>
            <li className="d-flex align-items-center mb-2">
              <i className="icofont-calendar mr-2" style={{ fontSize: "16px", width: "20px" }}></i>
              <span className="text-muted">
                {event.expiration > 0
                  ? `Expires: ${formatDateToDDMMYYYY(new Date(event.expiration * 1000))}`
                  : "No expiry"}
              </span>
            </li>
            <li className="d-flex align-items-center mb-2">
              <i className="icofont-info-circle mr-2" style={{ fontSize: "16px", width: "20px" }}></i>
              <span className="text-muted">{event.isPublicMint ? "Public mint" : "Organizer-minted"}</span>
            </li>
          </ul>

          <div className="mb-3">
            <div className="d-flex justify-content-between align-items-center mb-1">
              <small className="text-muted" style={{ fontSize: "11px" }}>
                Minted: <strong className="text-white">{event.minted}/{event.maxSupply || "∞"}</strong>
                {available !== undefined && (
                  <span className="ml-2">(Available: <strong className="text-white">{available}</strong>)</span>
                )}
              </small>
              {event.maxSupply > 0 && (
                <small className="text-muted" style={{ fontSize: "11px" }}>{Math.round(progressPercentage)}%</small>
              )}
            </div>
            {event.maxSupply > 0 && (
              <div className="progress" style={{ height: "6px", backgroundColor: "rgba(255,255,255,0.2)", borderRadius: "3px" }}>
                <div
                  className="progress-bar bg-white"
                  role="progressbar"
                  style={{ width: `${progressPercentage}%`, transition: "width 0.3s ease" }}
                  aria-valuenow={progressPercentage}
                  aria-valuemin="0"
                  aria-valuemax="100"
                ></div>
              </div>
            )}
          </div>
        </div>

        <div className="card-footer border-0 bg-transparent p-3 pt-0">
          <div className="d-flex justify-content-between align-items-center">
            <div>
              {event.createdBlock && (
                <small className="text-muted" style={{ fontSize: "10px" }}>Block: {event.createdBlock}</small>
              )}
            </div>
            <div>
              {status !== "active" ? (
                <span className="btn btn-white btn-small disabled" style={{ fontSize: "12px", padding: "4px 12px" }}>
                  {status === "expired" ? "Expired" : status === "full" ? "Sold Out" : "Inactive"}
                </span>
              ) : (
                <Link
                  to={`/poap-management?eventId=${event.eventId}`}
                  className="btn btn-white btn-small"
                  style={{ fontSize: "12px", padding: "4px 12px" }}
                  onClick={(e) => e.stopPropagation()}
                >
                  View POAPs
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EventCard;
