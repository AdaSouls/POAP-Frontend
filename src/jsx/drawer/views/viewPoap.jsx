import { useState } from "react";
import {
  useDrawer,
  useDrawerDispatch,
} from "../../contexts/drawer/drawer.provider";
import formatDateToDDMMYYYY from "../../../utils/formatDateToDDMMYYYY";
import EventBody from "../../components/eventBody";
import circlePlus from "../../../icons/svg/circle-plus.svg";
import poapNormal from "../../../images/svg/poap-normal.svg";

export default function ViewPoap() {
  const {
    poap,
  } = useDrawer();
  const dispatch = useDrawerDispatch();
  const [expandedEvents, setExpandedEvents] = useState([]);

  const closeDrawer = () => {
    dispatch({
      type: "CLOSE_DRAWER",
    });
  };

  const event = poap?.events?.[0] || null;

  // Calculate status based on eventStartDate and expiration (like EventCard)
  const calculateStatus = () => {
    if (!event) return 'active';
    
    const now = Date.now();
    
    // Check if expired first
    if (event.expiration && event.expiration > 0) {
      const expirationTime = event.expiration * 1000;
      if (expirationTime <= now) {
        return 'expired';
      }
    }
    
    // Check event start date
    if (event.eventStartDate) {
      const startTime = event.eventStartDate * 1000;
      if (startTime > now) {
        return 'pending';
      } else {
        return 'active';
      }
    }
    
    // Default to active if no dates available
    return 'active';
  };

  const getStatusBadgeClass = (status) => {
    switch (status?.toLowerCase()) {
      case 'pending':
        return 'badge bg-warning';
      case 'active':
        return 'badge bg-success';
      case 'completed':
        return 'badge bg-info';
      case 'expired':
        return 'badge bg-danger';
      default:
        return 'badge bg-secondary';
    }
  };
  
  // Toggle event expansion
  const toggleEvent = (index) => {
    setExpandedEvents((prev) =>
      prev.includes(index) ? prev.filter((i) => i !== index) : [...prev, index]
    );
  };

  // Check if an event is expanded
  const isEventExpanded = (index) => {
    return expandedEvents.includes(index);
  };

  const eventStatus = calculateStatus();
  const eventTitle = event?.title || `Event ${poap?.eventId || 'N/A'}`;
  const eventImageUrl = event?.imageUrl || event?.image || poapNormal;

  return (
    <div className="container absolute top-0 start-0 w-100 h-100 p-3 overflow-auto">
      <div className="drawer-header">
        <div className="d-flex justify-content-start">
          <button
            className="btn btn-close align-content-center px-1 mt-2 position-absolute"
            onClick={closeDrawer}
            aria-label="close"
          ></button>
          <h4 className="align-content-center text-center w-100 m-0 py-3 font-weight-semibold capitalize">
            POAP Token Details
          </h4>
        </div>
      </div>

      <div className="drawer-body">
        {/* POAP Token Section */}
        <div className="mb-4">
          <h3 className="mb-3" style={{ fontSize: '20px', fontWeight: '600' }}>
            Token Information
          </h3>
          
          <div className="row g-3">
            {/* Token ID - Prominent Display */}
            <div className="col-12">
              <div className="card bg-light p-3 mb-3">
                <p className="m-0 small text-muted mb-1">Token ID</p>
                <h3 className="m-0" style={{ fontSize: '24px', fontWeight: '700' }}>
                  {poap?.tokenId || 'N/A'}
                </h3>
              </div>
            </div>

            {/* Event ID and Issuer ID */}
            <div className="col-6">
              <p className="m-0 small text-muted mb-1">Event ID</p>
              <p className="m-0 mb-3 font-weight-semibold">{poap?.eventId || 'N/A'}</p>
            </div>
            
            <div className="col-6">
              <p className="m-0 small text-muted mb-1">Issuer ID</p>
              <p className="m-0 mb-3 font-weight-semibold">{poap?.issuerId || 'N/A'}</p>
            </div>

            {/* Minted Date */}
            <div className="col-12">
              <p className="m-0 small text-muted mb-1">Minted Date</p>
              <p className="m-0 mb-3">
                {poap?.createdAt ? formatDateToDDMMYYYY(new Date(poap.createdAt)) : 'N/A'}
              </p>
            </div>

            {/* Owner Address */}
            <div className="col-12">
              <p className="m-0 small text-muted mb-1">Owner Address</p>
              <p className="m-0 mb-3 text-break small font-weight-semibold">
                {poap?.ownerAddress || 'N/A'}
              </p>
            </div>

            {/* Blockchain Metadata */}
            {(poap?.block_number || poap?.transaction_hash) && (
              <>
                
                {poap?.block_number && (
                  <div className="col-6">
                    <p className="m-0 small text-muted mb-1">Block Number</p>
                    <p className="m-0 mb-3">{poap.block_number}</p>
                  </div>
                )}

                {poap?.transaction_hash && (
                  <div className="col-12">
                    <p className="m-0 small text-muted mb-1">Transaction Hash</p>
                    <p className="m-0 mb-3 text-break small">
                      {poap.transaction_hash}
                    </p>
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        {/* Event Information Section */}
        {event && (
          <div className="mb-4">
            <hr className="my-4" />
            <div
              className="mb-3"
              style={{
                border: "1px solid rgba(255,255,255,0.2)",
                padding: "15px 20px",
                borderRadius: "8px",
                boxSizing: "border-box",
                backgroundColor: "rgba(255,255,255,0.05)",
              }}
            >
              <div
                className="d-flex align-items-center justify-content-between cursor-pointer"
                onClick={() => toggleEvent(0)}
                style={{ cursor: "pointer" }}
              >
                <div className="d-flex align-items-center">
                  {eventImageUrl && (
                    <img
                      src={eventImageUrl}
                      alt={eventTitle}
                      className="rounded-circle mr-3"
                      width="40"
                      height="40"
                      style={{
                        objectFit: "cover",
                        border: "2px solid rgba(255,255,255,0.3)",
                      }}
                      onError={(e) => {
                        e.target.src = poapNormal;
                      }}
                    />
                  )}
                  <div>
                    <h4 className="m-0 mb-1" style={{ opacity: `${isEventExpanded(0) ? "0%" : "100%"}` }}>
                      {eventTitle}
                    </h4>
                    <div className="d-flex align-items-center">
                      <span className={`${getStatusBadgeClass(eventStatus)} mr-2`} style={{ fontSize: '10px', padding: '2px 8px', textTransform: 'capitalize' }}>
                        {eventStatus}
                      </span>
                      {event.createdAt && (
                        <span className="text-muted small">
                          Created: {formatDateToDDMMYYYY(new Date(event.createdAt))}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <div
                  style={{
                    transform: isEventExpanded(0) ? "rotate(45deg)" : "",
                    transition: "transform 0.3s",
                  }}
                >
                  <img src={circlePlus} width="20" height="20" alt="" />
                </div>
              </div>

              {isEventExpanded(0) && (
                <div className="mt-4">
                  <EventBody event={event} />
                </div>
              )}
            </div>
          </div>
        )}

        {/* No Event Information */}
        {!event && poap?.eventId && (
          <div className="mb-4">
            <hr className="my-4" />
            <div className="alert alert-info" role="alert">
              <p className="m-0">
                Event information is not available for Event ID: {poap.eventId}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
