import React, { useState } from "react";
import { Link } from "react-router-dom";
import { useDrawerDispatch } from "../contexts/drawer/drawer.provider";
import eventNormal from "../../images/svg/event-normal.svg";
import eventOwnerIcon from "../../icons/svg/collection-owner.svg";
import formatDateToDDMMYYYY from "../../utils/formatDateToDDMMYYYY";

const EventCard = ({ event, index }) => {
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

  const viewEvent = () => {
    const mintable = canMintTokens();
    dispatch({
      type: "VIEW_EVENT",
      payload: { event, mintable },
    });
  };

  // Calculate status based on eventStartDate and expiration
  const calculateStatus = () => {
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

  const getMintProgress = () => {
    // Use totalSupply from database (preferred) or fallback to legacy fields
    const currentSupply = event.totalSupply !== undefined ? event.totalSupply : 
                         (event.mintedPoaps !== undefined ? event.mintedPoaps : 0);
    const maxSupply = event.maxSupply || event.poapsToBeMinted || 0;
    
    return { 
      current: currentSupply, 
      total: maxSupply,
      available: Math.max(0, maxSupply - currentSupply)
    };
  };

  // Check if minting is possible
  const canMintTokens = () => {
    const progress = getMintProgress();
    const eventStatus = calculateStatus();
    
    // Can't mint if expired
    if (eventStatus === 'expired') return false;
    
    // Can't mint if no supply available
    if (progress.available <= 0) return false;
    
    // Can't mint if event hasn't started yet
    if (eventStatus === 'pending') return false;
    
    return true;
  };

  const getProgressPercentage = () => {
    const progress = getMintProgress();
    if (progress.total === 0) return 0;
    return Math.min((progress.current / progress.total) * 100, 100);
  };

  const formatEventDate = (timestamp) => {
    if (!timestamp || timestamp === 0) return null;
    return formatDateToDDMMYYYY(new Date(timestamp * 1000));
  };

  const progress = getMintProgress();
  const progressPercentage = getProgressPercentage();
  const eventStatus = calculateStatus();

  return (
    <div key={event.eventId || event.eventUuid} className="col-xxl-3 col-xl-3 col-lg-4 col-md-6 col-sm-6 mb-3">
      <div 
        className={`card card-event card-classic ${isExpired() ? 'bg-event-expired' : 'bg-event-normal'}`}
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
        onClick={viewEvent}
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
              {hasImageUrl(event.imageUrl) && !imageError ? (
                <>
                  {!imageLoaded && (
                    <img
                      className="rounded-circle position-absolute"
                      src={eventNormal}
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
                    src={event.imageUrl}
                    width="60"
                    height="60"
                    alt={event.title || "Event"}
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
                  src={eventNormal}
                  width="60"
                  height="60"
                  alt="Event"
                  style={{
                    border: "2px solid rgba(255,255,255,0.3)",
                  }}
                />
              )}
            </div>
            <div className="event-info flex-grow-1">
              <h4 className="text-capitalize mb-2" style={{ fontSize: '18px', fontWeight: '600' }}>
                {event.title || `Event ${event.eventId}`}
              </h4>
              
              <div className="d-flex align-items-center">
                <span className={`${getStatusBadgeClass(eventStatus)} mr-2`} style={{ fontSize: '10px', padding: '2px 8px', textTransform: 'capitalize' }}>
                  {eventStatus}
                </span>
                <span className="text-muted small">ID: {event.eventId}</span>
              </div>
            </div>
          </div>
          {event.description && (
            <p 
              className="text-muted small mb-2" 
              style={{ 
                fontSize: '12px', 
                lineHeight: '1.4',
                display: '-webkit-box',
                WebkitLineClamp: 4,
                WebkitBoxOrient: 'vertical',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                height: '4em', // Approximately 3 lines (1.2em line-height * 3)
              }}
            >
              {event.description}
            </p>
          )}
          {/* Event Details Section */}
          <div className="mb-3">
            <ul className="list-unstyled mb-0" style={{ fontSize: '13px' }}>
              {/* Event Start Date */}
              {event.eventStartDate && (
                <li className="d-flex align-items-center mb-2">
                  <i className="icofont-calendar mr-2" style={{ fontSize: '16px', width: '20px' }}></i>
                  <span className="text-muted">
                    Starts: <strong className="text-white">{formatEventDate(event.eventStartDate) || 'N/A'}</strong>
                  </span>
                </li>
              )}
              
              {/* Event End Date */}
              {event.eventEndDate && (
                <li className="d-flex align-items-center mb-2">
                  <i className="icofont-calendar mr-2" style={{ fontSize: '16px', width: '20px' }}></i>
                  <span className="text-muted">
                    Ends: <strong className="text-white">{formatEventDate(event.eventEndDate)}</strong>
                  </span>
                </li>
              )}

              {/* Expiration */}
              {event.expiration !== undefined && (
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

              {/* Organizer Address */}
              {event.organiserAddress && (
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
                    <span className="text-white">{truncateAddress(event.organiserAddress)}</span>
                  </span>
                </li>
              )}
            </ul>
          </div>

          {/* Progress Section */}
          {event.maxSupply && event.maxSupply > 0 && (
            <div className="mb-3">
              <div className="d-flex justify-content-between align-items-center mb-1">
                <small className="text-muted" style={{ fontSize: '11px' }}>
                  Minted: <strong className="text-white">{progress.current}/{progress.total}</strong>
                  {progress.available !== undefined && (
                    <span className="ml-2">
                      (Available: <strong className="text-white">{progress.available}</strong>)
                    </span>
                  )}
                </small>
                <small className="text-muted" style={{ fontSize: '11px' }}>
                  {Math.round(progressPercentage)}%
                </small>
              </div>
              <div className="progress" style={{ height: '6px', backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: '3px' }}>
                <div
                  className="progress-bar bg-white"
                  role="progressbar"
                  style={{
                    width: `${progressPercentage}%`,
                    transition: 'width 0.3s ease',
                  }}
                  aria-valuenow={progressPercentage}
                  aria-valuemin="0"
                  aria-valuemax="100"
                ></div>
              </div>
              {progress.available !== undefined && progress.available <= 0 && (
                <small className="text-danger" style={{ fontSize: '10px', display: 'block', marginTop: '4px' }}>
                  No tokens available for minting
                </small>
              )}
            </div>
          )}
        </div>

        {/* Footer Section */}
        <div className="card-footer border-0 bg-transparent p-3 pt-0">
          <div className="d-flex justify-content-between align-items-center">
            <div className="d-flex align-items-center">
              {event.block_number && (
                <small className="text-muted mr-3" style={{ fontSize: '10px' }}>
                  Block: {event.block_number}
                </small>
              )}
            </div>
            <div>
              {isExpired() ? (
                <span className="btn btn-white btn-small disabled" style={{ fontSize: '12px', padding: '4px 12px' }}>
                  Expired
                </span>
              ) : !canMintTokens() ? (
                <span className="btn btn-white btn-small disabled" style={{ fontSize: '12px', padding: '4px 12px' }}>
                  {progress.available <= 0 ? 'Sold Out' : 'Not Available'}
                </span>
              ) : (
                <Link
                  to={`/poap-management?eventId=${event.eventId}`}
                  className="btn btn-white btn-small"
                  style={{ fontSize: '12px', padding: '4px 12px' }}
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
