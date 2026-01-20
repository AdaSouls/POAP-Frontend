import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useDrawer, useDrawerDispatch } from '../../contexts/drawer/drawer.provider';
import { getAllEventsService } from '../../../services/paima.service';
import { mvpSmartContractService } from '../../../services/mvp-smart-contract.service';
import { loadingFunction, errorFunction, succesfullBlockchainCreation } from '../../toasts/sweetAlerts';
import formatDateToDDMMYYYY from '../../../utils/formatDateToDDMMYYYY';
import eventNormal from '../../../images/svg/event-normal.svg';
import eventOwnerIcon from '../../../icons/svg/collection-owner.svg';

export default function CreatePoap() {
  const [events, setEvents] = useState([]);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    eventId: '',
    issuerId: '',
    to: ''
  });
  const [addressError, setAddressError] = useState('');
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);

  const { event, ethereum: { provider } } = useDrawer();
  const dispatch = useDrawerDispatch();
  const [searchParams] = useSearchParams();

  const closeDrawer = () => {
    dispatch({
      type: 'CLOSE_DRAWER'
    });
  };

  const navigate = useNavigate();

  useEffect(() => {
    // If we have an event from context (clicked from event card), use it
    if (event && event.event) {
      setSelectedEvent(event.event);
      setFormData({
        eventId: event.event.eventId,
        issuerId: event.event.issuerId,
        to: provider?.address || ''
      });
    }
    
    // Load all events for selection
    loadEvents();
  }, [event, provider]);

  const handleEventSelect = useCallback((selectedEvent) => {
    console.log("🚀 ~ handleEventSelect ~ selectedEvent:", selectedEvent);
    setSelectedEvent(selectedEvent);
    setFormData({
      eventId: selectedEvent.eventId,
      issuerId: selectedEvent.issuerId,
      to: provider?.address || ''
    });
  }, [provider]);

  // New useEffect to handle URL parameters after events are loaded
  useEffect(() => {
    if (events.length > 0) {
      const eventIdFromUrl = searchParams.get('eventId');
      
      if (eventIdFromUrl && !selectedEvent) {
        const eventFromUrl = events.find(evt => evt.eventId === eventIdFromUrl);
        if (eventFromUrl) {
          console.log("🚀 ~ URL Event Selection ~ eventFromUrl:", eventFromUrl);
          handleEventSelect(eventFromUrl);
        }
      }
    }
  }, [events, selectedEvent, searchParams, handleEventSelect]);

  // Reset image loading state when event changes
  useEffect(() => {
    if (selectedEvent) {
      setImageLoaded(false);
      setImageError(false);
    }
  }, [selectedEvent]);

  const loadEvents = async () => {
    try {
      const allEvents = await getAllEventsService();
      console.log("🚀 ~ loadEvents ~ allEvents:", allEvents);
      setEvents(allEvents);
    } catch (error) {
      console.error("Error loading events:", error);
    }
  };

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

  // Calculate status based on eventStartDate and expiration (like EventCard)
  const calculateStatus = (event) => {
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

  const getMintProgress = (event) => {
    if (!event) return { current: 0, total: 0, available: 0 };
    
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

  const getProgressPercentage = (event) => {
    const progress = getMintProgress(event);
    if (progress.total === 0) return 0;
    return Math.min((progress.current / progress.total) * 100, 100);
  };

  // Check if minting is possible
  const canMintTokens = (event) => {
    if (!event) return false;
    
    const progress = getMintProgress(event);
    const eventStatus = calculateStatus(event);
    
    // Can't mint if expired
    if (eventStatus === 'expired') return false;
    
    // Can't mint if no supply available
    if (progress.available <= 0) return false;
    
    // Can't mint if event hasn't started yet
    if (eventStatus === 'pending') return false;
    
    return true;
  };

  const formatEventDate = (timestamp) => {
    if (!timestamp || timestamp === 0) return null;
    return formatDateToDDMMYYYY(new Date(timestamp * 1000));
  };

  // Validate contract requirements for minting
  const validateMintRequirements = async () => {
    const errors = [];
    
    // Validate recipient address
    const recipientAddress = formData.to || provider?.address;
    if (!recipientAddress || recipientAddress === "0x0000000000000000000000000000000000000000") {
      errors.push("Valid recipient address is required");
      return errors;
    }
    
    // Validate address format (basic Ethereum address validation)
    if (!/^0x[a-fA-F0-9]{40}$/.test(recipientAddress)) {
      errors.push("Invalid recipient address format");
      return errors;
    }
    
    // Validate event is selected
    if (!selectedEvent || !formData.eventId || !formData.issuerId) {
      errors.push("Please select an event first");
      return errors;
    }
    
    // Check calculated status
    const eventStatus = calculateStatus(selectedEvent);
    if (eventStatus === 'expired') {
      errors.push("This event has expired and minting is no longer available");
      return errors;
    }
    
    if (eventStatus === 'pending') {
      const startDate = selectedEvent.eventStartDate ? formatEventDate(selectedEvent.eventStartDate) : 'N/A';
      errors.push(`Event has not started yet. Start date: ${startDate}`);
      return errors;
    }
    
    // Check minting availability
    const progress = getMintProgress(selectedEvent);
    if (progress.available <= 0) {
      errors.push(`Event has reached its maximum supply (${progress.current}/${progress.total} tokens minted)`);
      return errors;
    }
    
    try {
      // Get event details from blockchain to validate current state
      const eventDetails = await mvpSmartContractService.getEventDetails(parseInt(formData.eventId));
      
      // Validate event has started (if start date is set)
      if (eventDetails.eventStartDate > 0) {
        const currentTimestamp = Math.floor(Date.now() / 1000);
        if (currentTimestamp < eventDetails.eventStartDate) {
          const startDate = new Date(eventDetails.eventStartDate * 1000);
          errors.push(`Event has not started yet. Start date: ${formatDateToDDMMYYYY(startDate)}`);
        }
      }
      
      // Validate event hasn't expired (if expiration is set)
      if (eventDetails.mintExpiration > 0) {
        const currentTimestamp = Math.floor(Date.now() / 1000);
        if (currentTimestamp >= eventDetails.mintExpiration) {
          const expirationDate = new Date(eventDetails.mintExpiration * 1000);
          errors.push(`Event minting has expired. Expiration date: ${formatDateToDDMMYYYY(expirationDate)}`);
        }
      }
      
      // Validate event hasn't reached max supply
      if (eventDetails.available <= 0) {
        errors.push(`Event has reached its maximum supply (${eventDetails.maxSupply} tokens minted)`);
      }
      
      // Validate user hasn't already minted for this event
      // Use the contract instance if available, otherwise skip this check
      if (mvpSmartContractService.contract) {
        try {
          const isEventHolder = await mvpSmartContractService.contract.isMinterEventHolder(
            recipientAddress,
            parseInt(formData.eventId)
          );
          if (isEventHolder) {
            errors.push("You have already minted a POAP token for this event");
          }
        } catch (checkError) {
          console.warn("Could not check if user is event holder:", checkError);
          // Continue without this check - contract will handle it
        }
      }
      
    } catch (error) {
      console.error("Error validating mint requirements:", error);
      // If we can't validate, show a warning but don't block
      // The contract will handle the final validation
      if (error.message && !error.message.includes("rate limit")) {
        errors.push("Could not validate all requirements. The transaction may still fail if requirements are not met.");
      }
    }
    
    return errors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!provider || !provider.address) {
      errorFunction(
        "Wallet Required",
        "Please connect your Ethereum wallet first.",
        ""
      );
      return;
    }

    if (!formData.eventId || !formData.issuerId) {
      errorFunction(
        "Event Selection Required",
        "Please select an event first.",
        ""
      );
      return;
    }

    // Validate contract requirements
    loadingFunction("Validating", "Checking mint requirements...", "");
    const validationErrors = await validateMintRequirements();
    
    if (validationErrors.length > 0) {
      errorFunction(
        "Mint Validation Error",
        validationErrors.join("\n"),
        ""
      );
      return;
    }

    try {
      setLoading(true);

      // Step 2: Mint POAP token on blockchain
      loadingFunction("Minting POAP", "Minting your POAP token...", "");
      const result = await mvpSmartContractService.mintToken(
        parseInt(selectedEvent.issuerId),
        parseInt(selectedEvent.eventId),
        provider.address
      );

      if (result.success) {
        const explorerUrl = `${process.env.REACT_APP_POLYGON_AMOY_BLOCK_EXPLORER_URL}/tx/${result.txHash}`;
        
        succesfullBlockchainCreation(
          "Token Minted Successfully",
          `Transaction: ${result.txHash}`,
          explorerUrl
        );
      } else {
        errorFunction(
          "Mint Failed",
          `Failed to mint token: ${result.error}`
        );
      }

      closeDrawer();
      navigate("/poap-management");
      
    } catch (error) {
      console.error("Error minting POAP:", error);
      errorFunction(
        "Error",
        "Failed to mint POAP token. Please try again.",
        ""
      );
    } finally {
      setLoading(false);
    }
  };

  const eventStatus = selectedEvent ? calculateStatus(selectedEvent) : null;
  const progress = selectedEvent ? getMintProgress(selectedEvent) : null;
  const progressPercentage = selectedEvent ? getProgressPercentage(selectedEvent) : 0;
  const mintable = selectedEvent ? canMintTokens(selectedEvent) : false;
  const eventImageUrl = selectedEvent?.imageUrl || selectedEvent?.image || eventNormal;
  const hasEventImage = selectedEvent && hasImageUrl(eventImageUrl) && eventImageUrl !== eventNormal;
  
  return (
    <div className="d-flex flex-column w-100 h-100 p-3 overflow-auto">      
      <div className="drawer-header">
        <div className="d-flex justify-content-start">                  
          <button
            className="btn btn-close align-content-center px-1 mt-2 position-absolute"
            onClick={closeDrawer}
            aria-label="close"
          >                        
          </button>
          <h4            
            className="align-content-center text-center w-100 m-0 py-3 font-weight-semibold"
          >
            Create POAP Token
          </h4>
        </div>          
      </div>      
      
      <div className="drawer-body">
        <form
          name="createPoapForm"
          className="signin_validate row g-3"
          onSubmit={handleSubmit}
        >
          {/* Event Selection */}
          <div className="col-12">
            <label className="form-label mb-2" style={{ fontWeight: '600' }}>
              Select Event
            </label>
            <select 
              className="form-select"
              value={formData.eventId}
              onChange={(e) => {
                const eventId = e.target.value;
                const selectedEvent = events.find(evt => evt.eventId === eventId);
                handleEventSelect(selectedEvent);
              }}
              required
              style={{ fontSize: '14px' }}
            >
              <option value="" disabled>Choose an event...</option>
              {events.map(event => {
                const evtStatus = calculateStatus(event);
                const evtProgress = getMintProgress(event);
                return (
                  <option key={event.eventUuid} value={event.eventId}>
                    {event.title || `Event ${event.eventId}`} - {evtStatus.toUpperCase()} ({evtProgress.current}/{evtProgress.total} minted)
                  </option>
                );
              })}
            </select>
          </div>

          {/* Selected Event Display */}
          {selectedEvent && (
            <>
              <div className="col-12 mt-3">
                <div 
                  className="card"
                  style={{
                    border: `2px solid ${eventStatus === 'expired' ? 'rgba(220, 53, 69, 0.5)' : eventStatus === 'pending' ? 'rgba(255, 193, 7, 0.5)' : 'rgba(40, 167, 69, 0.5)'}`,
                    borderRadius: '12px',
                    backgroundColor: 'rgba(255, 255, 255, 0.05)',
                    transition: 'all 0.3s ease',
                  }}
                >
                  <div className="card-body p-4">
                    {/* Event Header */}
                    <div className="d-flex justify-content-start mb-3">
                      <div
                        className="mr-3"
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
                              src={eventImageUrl}
                              width="60"
                              height="60"
                              alt={selectedEvent.title || "Event"}
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
                      <div className="flex-grow-1">
                        <h5
                          className="mb-2"
                          style={{ fontSize: '18px', fontWeight: '600', color: '#111827' }}
                        >
                          {selectedEvent.title || `Event ${selectedEvent.eventId}`}
                        </h5>
                        <div className="d-flex align-items-center">
                          <span
                            className={`${getStatusBadgeClass(eventStatus)} mr-2`}
                            style={{ fontSize: '10px', padding: '2px 8px', textTransform: 'capitalize' }}
                          >
                            {eventStatus}
                          </span>
                          <span
                            className="small"
                            style={{ color: '#4B5563' }}
                          >
                            ID: {selectedEvent.eventId}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Event Description */}
                    {selectedEvent.description && (
                      <p 
                        className="small mb-3" 
                        style={{ 
                          fontSize: '13px', 
                          lineHeight: '1.5',
                          display: '-webkit-box',
                          WebkitLineClamp: 3,
                          WebkitBoxOrient: 'vertical',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          color: '#4B5563',
                        }}
                      >
                        {selectedEvent.description}
                      </p>
                    )}

                    {/* Event Details */}
                    <div className="mb-3">
                      <ul className="list-unstyled mb-0" style={{ fontSize: '13px' }}>
                        {/* Event Start Date */}
                        {selectedEvent.eventStartDate && (
                          <li className="d-flex align-items-center mb-2">
                            <i className="icofont-calendar mr-2" style={{ fontSize: '16px', width: '20px' }}></i>
                            <span
                              className="small"
                              style={{ color: '#4B5563' }}
                            >
                              Starts: <strong>{formatEventDate(selectedEvent.eventStartDate) || 'N/A'}</strong>
                            </span>
                          </li>
                        )}
                        
                        {/* Expiration */}
                        {selectedEvent.expiration !== undefined && (
                          <li className="d-flex align-items-center mb-2">
                            <i className={`icofont ${getStatusIcon(eventStatus)} mr-2`} style={{ fontSize: '16px', width: '20px' }}></i>
                            <span
                              className="small"
                              style={{ color: '#4B5563' }}
                            >
                              {selectedEvent.expiration === 0 || selectedEvent.expiration === null 
                                ? 'No expiry' 
                                : `Expires: ${formatDateToDDMMYYYY(new Date(selectedEvent.expiration * 1000))}`
                              }
                            </span>
                          </li>
                        )}

                        {/* Organizer Address */}
                        {selectedEvent.organiserAddress && (
                          <li className="d-flex align-items-center mb-2">
                            <img
                              className="mr-2"
                              src={eventOwnerIcon}
                              width="16"
                              height="16"
                              alt="Organizer"
                              style={{ flexShrink: 0 }}
                            />
                            <span className="small" style={{ color: '#4B5563' }}>
                              Organizer: <span style={{ color: '#111827' }}>{truncateAddress(selectedEvent.organiserAddress)}</span>
                            </span>
                          </li>
                        )}

                        {/* Issuer ID */}
                        <li className="d-flex align-items-center mb-2">
                          <i className="icofont-id-card mr-2" style={{ fontSize: '16px', width: '20px' }}></i>
                          <span
                            className="small"
                            style={{ color: '#4B5563' }}
                          >
                            Issuer ID: <strong style={{ color: '#111827' }}>{selectedEvent.issuerId}</strong>
                          </span>
                        </li>
                      </ul>
                    </div>

                    {/* Progress Section */}
                    {selectedEvent.maxSupply && selectedEvent.maxSupply > 0 && (
                      <div className="mb-3">
                        <div className="d-flex justify-content-between align-items-center mb-1">
                          <small
                            style={{ fontSize: '11px', color: '#4B5563' }}
                          >
                            Minted: <strong style={{ color: '#111827' }}>{progress.current}/{progress.total}</strong>
                            {progress.available !== undefined && (
                              <span className="ml-2">
                                (Available: <strong style={{ color: '#111827' }}>{progress.available}</strong>)
                              </span>
                            )}
                          </small>
                          <small
                            style={{ fontSize: '11px', color: '#6B7280' }}
                          >
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
                        {!mintable && eventStatus === 'active' && progress.available > 0 && (
                          <small className="text-warning" style={{ fontSize: '10px', display: 'block', marginTop: '4px' }}>
                            Minting may not be available at this time
                          </small>
                        )}
                      </div>
                    )}

                    {/* Transaction Hash */}
                    {selectedEvent.transaction_hash && (
                      <div className="mt-3 pt-3 border-top border-secondary">
                        <small className="text-muted d-block mb-1">Transaction Hash</small>
                        <a 
                          href={`${process.env.REACT_APP_POLYGON_AMOY_BLOCK_EXPLORER_URL}/tx/${selectedEvent.transaction_hash}`} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-break small"
                          style={{ wordBreak: 'break-all' }}
                        >
                          {selectedEvent.transaction_hash}
                        </a>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Recipient Address Input */}
              <div className="col-12 mt-3">
                <label className="form-label mb-2" style={{ fontWeight: '600' }}>
                  Recipient Address
                </label>
                <input
                  type="text"
                  className={`form-control ${addressError ? 'border-danger' : ''}`}
                  placeholder={provider?.address || "Enter recipient address"}
                  value={formData.to}
                  onChange={(e) => {
                    const address = e.target.value;
                    setFormData({...formData, to: address});
                    
                    // Validate address format in real-time
                    if (address && address.trim() !== '') {
                      if (address === "0x0000000000000000000000000000000000000000") {
                        setAddressError("Zero address is not allowed");
                      } else if (!/^0x[a-fA-F0-9]{40}$/.test(address)) {
                        setAddressError("Invalid Ethereum address format");
                      } else {
                        setAddressError('');
                      }
                    } else {
                      setAddressError('');
                    }
                  }}
                  style={{ fontSize: '14px' }}
                />
                {addressError && (
                        <small className="text-danger d-block mt-1">
                    <i className="icofont-warning"></i> {addressError}
                  </small>
                )}
                <small
                  className="d-block mt-1"
                  style={{ color: '#4B5563', fontSize: '12px' }}
                >
                  {formData.to ? (
                    <>Recipient: <strong>{truncateAddress(formData.to)}</strong></>
                  ) : (
                    <>Will mint to your address: <strong>{truncateAddress(provider?.address || '')}</strong></>
                  )}
                </small>
              </div>

              {/* Minting Status Warning */}
              {!mintable && (
                <div className="col-12 mt-2">
                  <div className={`alert ${eventStatus === 'expired' ? 'alert-danger' : eventStatus === 'pending' ? 'alert-warning' : 'alert-info'}`} role="alert" style={{ fontSize: '13px', padding: '10px 15px' }}>
                    <i className={`icofont ${getStatusIcon(eventStatus)} mr-2`}></i>
                    {eventStatus === 'expired' && 'This event has expired and minting is no longer available.'}
                    {eventStatus === 'pending' && 'This event has not started yet. Minting will be available once the event starts.'}
                    {eventStatus === 'active' && progress.available <= 0 && 'This event has reached its maximum supply. No tokens available for minting.'}
                    {eventStatus === 'active' && progress.available > 0 && 'Minting may not be available at this time. Please check the event status.'}
                  </div>
                </div>
              )}
            </>
          )}
        </form>
      </div>
      
      <div className='drawer-footer'>
        <button 
          type="submit"
          className="btn btn-gradient btn-block"
          onClick={handleSubmit}
          disabled={loading || !formData.eventId || (formData.to && addressError) || !mintable}
          style={{ fontSize: '14px', padding: '10px' }}
        >
          {loading ? (
            <>
              <span className="spinner-border spinner-border-sm mr-2" role="status" aria-hidden="true"></span>
              Minting...
            </>
          ) : (
            'Mint POAP'
          )}
        </button>
        {!mintable && selectedEvent && (
          <small className="text-muted d-block text-center mt-2" style={{ fontSize: '11px' }}>
            Minting is not available for this event
          </small>
        )}
      </div>
    </div>
  );
}
