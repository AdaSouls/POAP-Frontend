import React, { useState } from "react";
import { useDrawerDispatch } from "../contexts/drawer/drawer.provider";
import poapNormal from "../../images/svg/poap-normal.svg";
import eventOwnerIcon from "../../icons/svg/collection-owner.svg";
import formatDateToDDMMYYYY from "../../utils/formatDateToDDMMYYYY";

const PoapCard = ({ poap, index }) => {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);
  const dispatch = useDrawerDispatch();

  // Helper function to check if imageUrl exists
  const hasImageUrl = (url) => {
    return url !== null && url !== undefined && url !== "";
  };

  // Helper function to truncate address
  const truncateAddress = (address) => {
    if (!address) return "N/A";
    if (address.length <= 10) return address;
    return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
  };

  const viewPoap = () => {
    dispatch({
      type: "VIEW_POAP_TOKEN",
      payload: poap,
    });
  };

  // Get event data (first event in array if available)
  const getEvent = () => {
    if (poap.events && poap.events.length > 0) {
      return poap.events[0];
    }
    return null;
  };

  const event = getEvent();

  const getEventTitle = () => {
    if (event) {
      return event.title || `Event ${event.eventId || poap.eventId}`;
    }
    return `Event ${poap.eventId}`;
  };

  const getEventImage = () => {
    if (event) {
      return event.imageUrl || event.image || poapNormal;
    }
    return poapNormal;
  };

  const getEventDescription = () => {
    if (event && event.description) {
      return event.description;
    }
    return null;
  };

  const getIssuerId = () => {
    if (event) {
      return event.issuerId || poap.issuerId;
    }
    return poap.issuerId;
  };

  // Calculate status based on eventStartDate and expiration (like EventCard)
  const calculateStatus = () => {
    const now = Date.now();
    
    // Check if expired first
    if (event && event.expiration && event.expiration > 0) {
      const expirationTime = event.expiration * 1000;
      if (expirationTime <= now) {
        return 'expired';
      }
    }
    
    // Check event start date
    if (event && event.eventStartDate) {
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

  const getStatusIcon = (status) => {
    switch (status?.toLowerCase()) {
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
    const status = calculateStatus();
    return status === 'expired';
  };

  const formatEventDate = (timestamp) => {
    if (!timestamp || timestamp === 0) return null;
    return formatDateToDDMMYYYY(new Date(timestamp * 1000));
  };

  const eventStatus = calculateStatus();
  const eventImageUrl = getEventImage();
  const hasEventImage = hasImageUrl(eventImageUrl) && eventImageUrl !== poapNormal;

  return (
    <div key={poap.poapUuid} className="col-xxl-3 col-xl-3 col-lg-4 col-md-6 col-sm-6 mb-3">
      <div 
        className={`card card-poap card-classic ${isExpired() ? 'bg-poap-expired' : 'bg-poap-normal'}`}
        style={{
          transition: 'transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out',
          cursor: 'pointer',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = 'translateY(-4px)';
          e.currentTarget.style.boxShadow = '0 8px 16px rgba(0,0,0,0.2)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = 'translateY(0)';
          e.currentTarget.style.boxShadow = '';
        }}
        onClick={viewPoap}
      >
        <div className="card-body card-classic-max-height">
          {/* Header Section */}
          <div className="d-flex justify-content-start mb-3">
            <div
              className="mr-3 mr-0 mr-sm-3"
              style={{
                width: "60px",
                height: "60px",
                minWidth: "60px",
                minHeight: "60px",
                position: "relative",
                flexShrink: 0,
              }}
            >
              {hasEventImage && !imageError ? (
                <>
                  {!imageLoaded && (
                    <img
                      className="rounded-circle position-absolute"
                      src={poapNormal}
                      width="60"
                      height="60"
                      alt="Loading..."
                      style={{
                        top: 0,
                        left: 0,
                        opacity: 0.5,
                        zIndex: 1,
                      }}
                    />
                  )}
                  <img
                    className="rounded-circle"
                    src={eventImageUrl}
                    width="60"
                    height="60"
                    alt={getEventTitle()}
                    style={{
                      display: imageLoaded ? "block" : "none",
                      objectFit: "cover",
                      border: "2px solid rgba(255,255,255,0.3)",
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
                  src={poapNormal}
                  width="60"
                  height="60"
                  alt="POAP"
                  style={{
                    border: "2px solid rgba(255,255,255,0.3)",
                  }}
                />
              )}
            </div>
            <div className="poap-info flex-grow-1">
              <h4 className="text-capitalize mb-2" style={{ fontSize: '18px', fontWeight: '600' }}>
                {getEventTitle()}
              </h4>
              
              <div className="d-flex align-items-center">
                <span className={`${getStatusBadgeClass(eventStatus)} mr-2`} style={{ fontSize: '10px', padding: '2px 8px', textTransform: 'capitalize' }}>
                  {eventStatus}
                </span>
                <span className="text-muted small">Token: {poap.tokenId}</span>
              </div>
            </div>
          </div>

          {/* Description */}
          {getEventDescription() && (
            <p 
              className="text-muted small mb-2" 
              style={{ 
                fontSize: '12px', 
                lineHeight: '1.4',
                display: '-webkit-box',
                WebkitLineClamp: 3,
                WebkitBoxOrient: 'vertical',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                height: '3.6em',
              }}
            >
              {getEventDescription()}
            </p>
          )}

          {/* POAP Details Section */}
          <div className="mb-3">
            <ul className="list-unstyled mb-0" style={{ fontSize: '13px' }}>
              {/* Minted Date */}
              <li className="d-flex align-items-center mb-2">
                <i className="icofont-calendar mr-2" style={{ fontSize: '16px', width: '20px' }}></i>
                <span className="text-muted">
                  Minted: <strong className="text-white">{formatDateToDDMMYYYY(new Date(poap.createdAt))}</strong>
                </span>
              </li>

              {/* Event Start Date */}
              {event && event.eventStartDate && (
                <li className="d-flex align-items-center mb-2">
                  <i className="icofont-clock-time mr-2" style={{ fontSize: '16px', width: '20px' }}></i>
                  <span className="text-muted">
                    Event: <strong className="text-white">{formatEventDate(event.eventStartDate) || 'N/A'}</strong>
                  </span>
                </li>
              )}

              {/* Expiration */}
              {event && event.expiration !== undefined && (
                <li className="d-flex align-items-center mb-2">
                  <i className={`icofont ${getStatusIcon(eventStatus)} mr-2`} style={{ fontSize: '16px', width: '20px' }}></i>
                  <span className="text-muted">
                    {event.expiration === 0 || event.expiration === null 
                      ? 'No expiry' 
                      : `Expires: ${formatDateToDDMMYYYY(new Date(event.expiration * 1000))}`
                    }
                  </span>
                </li>
              )}

              {/* Minting Progress */}
              {event && event.totalSupply !== null && event.maxSupply !== null && event.maxSupply > 0 && (
                <li className="d-flex align-items-center mb-2">
                  <i className="icofont-users mr-2" style={{ fontSize: '16px', width: '20px' }}></i>
                  <span className="text-muted">
                    Minted: <strong className="text-white">{event.totalSupply}/{event.maxSupply}</strong>
                  </span>
                </li>
              )}

              {/* Owner Address */}
              <li className="d-flex align-items-center mb-2">
                <img
                  className="mr-2"
                  src={eventOwnerIcon}
                  width="16"
                  height="16"
                  alt="Owner"
                  style={{ flexShrink: 0 }}
                />
                <span className="text-muted small">
                  Owner: <span className="text-white">{truncateAddress(poap.ownerAddress)}</span>
                </span>
              </li>

              {/* Organizer Address */}
              {event && event.organiserAddress && (
                <li className="d-flex align-items-center mb-2">
                  <img
                    className="mr-2"
                    src={eventOwnerIcon}
                    width="16"
                    height="16"
                    alt="Organizer"
                    style={{ flexShrink: 0 }}
                  />
                  <span className="text-muted small">
                    Organizer: <span className="text-white">{truncateAddress(event.organiserAddress)}</span>
                  </span>
                </li>
              )}
            </ul>
          </div>
        </div>

        {/* Footer Section */}
        <div className="card-footer border-0 bg-transparent p-3 pt-0">
          <div className="d-flex justify-content-between align-items-center">
            <div className="d-flex align-items-center">
              <small className="text-muted" style={{ fontSize: '10px' }}>
                Issuer: {getIssuerId()}
              </small>
            </div>
            <div>
              <button
                type="button"
                className="btn btn-white btn-small"
                style={{ fontSize: '12px', padding: '4px 12px' }}
                onClick={(e) => {
                  e.stopPropagation();
                  viewPoap();
                }}
              >
                View Details
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PoapCard;
