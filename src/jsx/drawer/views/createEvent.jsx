import {
  useDrawer,
  useDrawerDispatch,
} from "../../contexts/drawer/drawer.provider";
import { useState, useEffect } from "react";
import { Button } from "react-bootstrap";
import { createEventId } from "../../../utils/poapContractInteractions";
import { mvpSmartContractService } from "../../../services/mvp-smart-contract.service";
import { createEvent } from "../../../services/event.service";
import { 
  succesfullMessage, 
  errorFunction, 
  loadingFunction ,
  succesfullBlockchainCreation
} from "../../toasts/sweetAlerts";

export default function CreateEvent() {
  const {
    poapIssuer,
    ethereum: { provider },
  } = useDrawer();
  const dispatch = useDrawerDispatch();

  // Smart contract required fields only
  const [eventId, setEventId] = useState("");
  const [maxSupply, setMaxSupply] = useState(0);
  const [showEventDates, setShowEventDates] = useState(false);
  
  // Off-chain data fields (required: title, description, imageUrl)
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [eventStartDate, setEventStartDate] = useState("");
  const [eventEndDate, setEventEndDate] = useState("");
  
  // Image preview state
  const [imagePreview, setImagePreview] = useState(null);
  const [imageError, setImageError] = useState(false);
  const [imageLoading, setImageLoading] = useState(false);
  
  // Check if form is valid
  const isFormValid = () => {
    // Always need Event ID, Maximum Supply, Title, Description, and Image URL
    return eventId && maxSupply && title.trim() && description.trim() && imageUrl.trim();
  };
  const [loading, setLoading] = useState(false);

  // Handle image URL change and preview
  useEffect(() => {
    if (imageUrl.trim()) {
      setImageLoading(true);
      setImageError(false);
      const img = new Image();
      img.onload = () => {
        setImagePreview(imageUrl);
        setImageLoading(false);
        setImageError(false);
      };
      img.onerror = () => {
        setImagePreview(null);
        setImageLoading(false);
        setImageError(true);
      };
      img.src = imageUrl;
    } else {
      setImagePreview(null);
      setImageError(false);
      setImageLoading(false);
    }
  }, [imageUrl]);

  const toggleEventDates = () => {
    setShowEventDates(!showEventDates);
    // Optionally clear dates when toggle is turned off
    if (showEventDates) {
      setEventStartDate("");
      setEventEndDate("");
    }
  };

  const closeDrawer = () => {
    dispatch({
      type: "CLOSE_DRAWER",
    });
  };

  // const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate required fields
    if (!isFormValid()) {
      errorFunction(
        "Validation Error",
        "Please fill in all required fields: Event ID, Maximum Supply, Title, Description, and Image URL.",
        ""
      );
      return;
    }
    
    setLoading(true);

    try {
      // If eventStartDate is blank, set it to today
      let finalEventStartDate = eventStartDate;
      if (!eventStartDate || eventStartDate.trim() === "") {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        finalEventStartDate = today.toISOString().split('T')[0]; // Format as YYYY-MM-DD
      }

      // Calculate mintExpiration from eventEndDate
      let timestamp = 0;
      if (eventEndDate && eventEndDate.trim() !== "") {
        // Convert date to timestamp (in seconds)
        // eventEndDate is in YYYY-MM-DD format
        const endDate = new Date(eventEndDate);
        // Set to end of day to allow minting throughout the event end date
        endDate.setHours(23, 59, 59, 999);
        timestamp = Math.floor(endDate.getTime() / 1000);
      }

      console.log("✅ Timestamp:", timestamp);
      console.log("✅ Event End Date:", eventEndDate);
      console.log("✅ Event Start Date:", finalEventStartDate);

      // STEP 1: Store both offchain and onchain data in backend FIRST
      // Convert date format to ISO string
      // date input returns "YYYY-MM-DD" which needs to be converted to ISO
      const convertToISO = (dateString) => {
        if (!dateString || dateString.trim() === "") return null;
        // dateString is in YYYY-MM-DD format, convert to ISO with timezone
        const date = new Date(dateString);
        return isNaN(date.getTime()) ? null : date.toISOString();
      };

      // Build event data object with both onchain and offchain data
      const eventData = {
        issuerId: parseInt(poapIssuer.issuerId),
        eventId: parseInt(eventId),
        eventMaxSupply: parseInt(maxSupply),
        eventMintExpiration: timestamp,
        eventOrganizer: provider.address,
        title: title.trim(),
        description: description.trim(),
        imageUrl: imageUrl.trim(),
        eventStartDate: convertToISO(finalEventStartDate),
        eventEndDate: convertToISO(eventEndDate) || '',
      };

      console.log("✅ Storing event data in backend (offchain + onchain):", eventData);
      loadingFunction("Storing Event Data", "Saving event information...", "");
      
      // Store in backend first - this stores both offchain and onchain data
      const storedEvent = await createEvent(eventData);
      console.log("✅ Event stored in backend:", storedEvent);

      // Check if backend returned an error
      if (!storedEvent || storedEvent.error) {
        throw new Error(storedEvent?.error || storedEvent?.details || "Failed to store event data in backend");
      }

      // STEP 2: Generate blockchain transaction (user will confirm in wallet)
      console.log("✅ Generating blockchain transaction...");
      loadingFunction("Preparing Transaction", "Please confirm the transaction in your wallet...", "");
      
      // Generate and send transaction to blockchain
      const result = await mvpSmartContractService.createEvent(
        parseInt(poapIssuer.issuerId),
        parseInt(eventId),
        parseInt(maxSupply),
        timestamp,
        provider.address
      );

      if (result.success) {
        const explorerUrl = `${process.env.REACT_APP_POLYGON_AMOY_BLOCK_EXPLORER_URL}/tx/${result.txHash}`;
        
        // STEP 3: Indexer will automatically update the event with tx hash and block number
        // The indexer (blockchainSync.service.ts) detects the blockchain event
        // and updates the existing database record with transaction_hash and block_number
        // No manual update needed here - the indexer handles it automatically
        
        console.log("✅ Blockchain transaction successful. Indexer will update event metadata automatically.");
        
        closeDrawer();
        succesfullBlockchainCreation(
          "Event Created Successfully",
          `Transaction: ${result.txHash}`,
          explorerUrl
        );
      } else {
        throw new Error("Blockchain transaction failed");
      }
      
    } catch (error) {
      console.error("Error creating event:", error);
      
      // Check for rate limit errors
      const isRateLimit = 
        error.name === "RateLimitError" ||
        error.message?.includes("rate limit") ||
        error.message?.includes("Rate limit") ||
        error.code === -32005 ||
        error.data?.httpStatus === 429;
      
      if (isRateLimit) {
        errorFunction(
          "Rate Limit Error",
          "The network is currently busy. Please wait a few seconds and try again.",
          ""
        );
      } else {
        errorFunction(
          "Error",
          error.message || "An error occurred while creating the event. Please try again.",
          ""
        );
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container absolute top-0 start-0 w-100 h-100 p-3 overflow-auto">
      <div className="drawer-header">
        <div className="d-flex justify-content-start">
          <button
            className="btn btn-close align-content-center px-1 mt-2 position-absolute"
            onClick={closeDrawer}
            aria-label="close"
          ></button>
          <h4 className="align-content-center text-center w-100 m-0 py-3 font-weight-semibold">
            Create POAP EVENT
          </h4>
        </div>
      </div>
      <div className="drawer-body">
        <form className="row g-3" onSubmit={handleSubmit}>
          {/* Basic Information Section */}
          <div className="col-12 mb-3">
            <h6 className="mb-3 text-primary font-weight-semibold">Basic Information</h6>
          </div>

          <div className="col-12">
            <label className="form-label">
              Event ID <span className="text-danger">*</span>
            </label>
            <input
              type="number"
              className={`form-control ${!eventId && !isFormValid() ? 'border-warning' : ''}`}
              placeholder="Enter unique event ID"
              name="eventId"
              value={eventId}
              onChange={(event) => setEventId(event.target.value)}
              required
              min="1"
            />
            <small className="form-text text-muted">
              Enter a unique number to identify this event
            </small>
          </div>

          <div className="col-12">
            <label className="form-label">
              Maximum Supply <span className="text-danger">*</span>
            </label>
            <input
              type="number"
              className={`form-control ${!maxSupply && !isFormValid() ? 'border-warning' : ''}`}
              placeholder="Maximum number of POAPs to mint"
              name="maxSupply"
              value={maxSupply || ''}
              onChange={(event) => setMaxSupply(Number.parseInt(event.target.value) || 0)}
              required
              min="1"
            />
            <small className="form-text text-muted">
              Maximum number of POAPs that can be minted for this event
            </small>
          </div>

          {/* Event Dates Section */}
          <div className="col-12">
            <hr className="my-4" style={{ borderColor: '#f1f1f1' }} />
          </div>
          
          <div className="col-12 mb-2">
            <div className="d-flex align-items-center justify-content-between">
              <div className="flex-grow-1">
                <h6 className="mb-1 text-primary font-weight-semibold">Event Dates</h6>
                <small className="form-text text-muted d-block">
                  Optional: Set start and end dates for your event
                </small>
              </div>
              <div className="form-check form-switch ms-3">
                <input
                  className="form-check-input"
                  type="checkbox"
                  id="eventDatesToggle"
                  checked={showEventDates}
                  onChange={toggleEventDates}
                  style={{ cursor: 'pointer' }}
                />
              </div>
            </div>
          </div>

          {showEventDates && (
            <div className="col-12" style={{ animation: 'fadeIn 0.3s ease-in' }}>
              <div className="row g-3">
                <div className="col-12">
                  <label className="form-label">Event Start Date</label>
                  <input
                    type="date"
                    className="form-control"
                    name="eventStartDate"
                    value={eventStartDate}
                    onChange={(event) => setEventStartDate(event.target.value)}
                  />
                  <small className="form-text text-muted">
                    When the actual event starts. If left blank, it will default to today's date.
                  </small>
                </div>

                <div className="col-12">
                  <label className="form-label">Event End Date</label>
                  <input
                    type="date"
                    className="form-control"
                    name="eventEndDate"
                    value={eventEndDate}
                    onChange={(event) => setEventEndDate(event.target.value)}
                    min={eventStartDate || undefined}
                  />
                  <small className="form-text text-muted">
                    When the actual event ends. Mint expiration will be automatically calculated from this date. Leave empty for indefinite minting.
                  </small>
                </div>
              </div>
            </div>
          )}

          {/* Event Details Section */}
          <div className="col-12">
            <hr className="my-4" style={{ borderColor: '#f1f1f1' }} />
          </div>

          <div className="col-12 mb-3">
            <h6 className="mb-1 text-primary font-weight-semibold">
              Event Details <span className="text-danger">*</span>
            </h6>
            <small className="form-text text-muted">
              Provide information about your event. These details are stored off-chain and help users understand what the event is about.
            </small>
          </div>

          <div className="col-12">
            <label className="form-label">
              Event Title <span className="text-danger">*</span>
            </label>
            <input
              type="text"
              className={`form-control ${!title.trim() && !isFormValid() ? 'border-warning' : ''}`}
              placeholder="e.g., Web3 Conference 2024"
              name="title"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              required
              maxLength={255}
            />
            <div className="d-flex justify-content-between">
              <small className="form-text text-muted">
                A descriptive title for your event
              </small>
              <small className="form-text text-muted">
                {title.length}/255
              </small>
            </div>
          </div>

          <div className="col-12">
            <label className="form-label">
              Description <span className="text-danger">*</span>
            </label>
            <textarea
              className={`form-control ${!description.trim() && !isFormValid() ? 'border-warning' : ''}`}
              rows="4"
              placeholder="Describe your event, what attendees can expect, etc."
              name="description"
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              required
              maxLength={1000}
              style={{ resize: 'vertical', minHeight: '100px', paddingTop: '10px'}}
            />
            <div className="d-flex justify-content-between">
              <small className="form-text text-muted">
                Detailed description of the event
              </small>
              <small className="form-text text-muted">
                {description.length}/1000
              </small>
            </div>
          </div>

          <div className="col-12">
            <label className="form-label">
              Image URL <span className="text-danger">*</span>
            </label>
            <input
              type="url"
              className={`form-control ${!imageUrl.trim() && !isFormValid() ? 'border-warning' : imageError ? 'border-danger' : ''}`}
              placeholder="https://example.com/event-image.jpg"
              name="imageUrl"
              value={imageUrl}
              onChange={(event) => setImageUrl(event.target.value)}
              required
            />
            <small className="form-text text-muted">
              URL to an image representing your event (banner, logo, etc.)
            </small>
            
            {/* Image Preview */}
            {imageUrl.trim() && (
              <div className="mt-3">
                {imageLoading && (
                  <div className="d-flex align-items-center justify-content-center p-4 border rounded" style={{ minHeight: '150px', backgroundColor: '#f8f9fa' }}>
                    <div className="spinner-border text-primary" role="status">
                      <span className="visually-hidden">Loading...</span>
                    </div>
                  </div>
                )}
                {imageError && (
                  <div className="alert alert-danger py-2 mb-0" role="alert">
                    <small>
                      <i className="icofont-warning"></i> Unable to load image. Please check the URL.
                    </small>
                  </div>
                )}
                {imagePreview && !imageLoading && !imageError && (
                  <div className="border rounded overflow-hidden" style={{ maxHeight: '200px' }}>
                    <img
                      src={imagePreview}
                      alt="Event preview"
                      className="img-fluid w-100"
                      style={{ objectFit: 'cover', maxHeight: '200px' }}
                      onError={() => setImageError(true)}
                    />
                  </div>
                )}
              </div>
            )}
          </div>

        </form>
        {!isFormValid() && (
          <div className="alert alert-warning mb-2 py-2" role="alert" style={{ fontSize: '0.875rem', margin: '8px 0' }}>
            <div className="d-flex align-items-start">
              <i className="icofont-warning me-2 mt-1 flex-shrink-0"></i>
              <div className="flex-grow-1">
                <strong className="d-block mb-1">Please complete all required fields:</strong>
                <div className="d-flex flex-wrap gap-2">
                  {!eventId && <span className="badge bg-warning text-dark">Event ID</span>}
                  {!maxSupply && <span className="badge bg-warning text-dark">Maximum Supply</span>}
                  {!title.trim() && <span className="badge bg-warning text-dark">Event Title</span>}
                  {!description.trim() && <span className="badge bg-warning text-dark">Description</span>}
                  {!imageUrl.trim() && <span className="badge bg-warning text-dark">Image URL</span>}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
      <div className="drawer-footer">
        <Button
          type="submit"
          className="btn btn-gradient btn-block w-100"
          onClick={handleSubmit}
          disabled={loading || !isFormValid()}
          style={{ 
            minHeight: '45px',
            fontWeight: '500',
            transition: 'all 0.3s ease'
          }}
        >
          {loading ? (
            <>
              <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
              Creating Event...
            </>
          ) : (
            'Create Event'
          )}
        </Button>
      </div>
    </div>
  );
}
