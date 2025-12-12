import {
  useDrawer,
  useDrawerDispatch,
} from "../../contexts/drawer/drawer.provider";
import { useState } from "react";
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
  
  // Check if form is valid
  const isFormValid = () => {
    // Always need Event ID, Maximum Supply, Title, Description, and Image URL
    return eventId && maxSupply && title.trim() && description.trim() && imageUrl.trim();
  };
  const [loading, setLoading] = useState(false);

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
      // Create event directly on blockchain
      // loadingFunction("Creating Event", "Creating event on blockchain...", "");
      const result = await mvpSmartContractService.createEvent(
        parseInt(poapIssuer.issuerId),
        parseInt(eventId),
        parseInt(maxSupply),
        timestamp,
        provider.address
      );

      if (result.success) {
        const explorerUrl = `${process.env.REACT_APP_POLYGON_AMOY_BLOCK_EXPLORER_URL}/tx/${result.txHash}`;
        
        // Store off-chain data in database
        try {
          // Convert date format to ISO string
          // date input returns "YYYY-MM-DD" which needs to be converted to ISO
          const convertToISO = (dateString) => {
            if (!dateString || dateString.trim() === "") return null;
            // dateString is in YYYY-MM-DD format, convert to ISO with timezone
            const date = new Date(dateString);
            return isNaN(date.getTime()) ? null : date.toISOString();
          };

          // Build offChainData object, only including optional fields if they have values
          const offChainData = {
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
          console.log("✅ Off-chain data:", offChainData);
          
          await createEvent(offChainData);
          console.log("✅ Off-chain data stored successfully");
        } catch (apiError) {
          console.error("⚠️ Failed to store off-chain data:", apiError);
          // Don't fail the entire operation if off-chain storage fails
          // The blockchain event was created successfully
        }
        
        closeDrawer();
        succesfullBlockchainCreation(
          "Event Created Successfully",
          `Transaction: ${result.txHash}`,
          explorerUrl
        );
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
          <div className="col-12">
            <label className="form-label">Event ID *</label>
            <input
              type="number"
              className="form-control"
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
            <label className="form-label">Maximum Supply *</label>
            <input
              type="number"
              className="form-control"
              placeholder="Maximum number of POAPs to mint"
              name="maxSupply"
              onChange={(event) => setMaxSupply(Number.parseInt(event.target.value))}
              required
              min="1"
            />
            <small className="form-text text-muted">
              Maximum number of POAPs that can be minted for this event
            </small>
          </div>

          <hr className="col-12 my-3"></hr>
          <div className="col-10">
            <h6 className="py-2">
              Do you want to add event dates?
            </h6>
            <small className="form-text text-muted">
              If checked, you can specify the event start and end dates. The mint expiration will be automatically calculated from the event end date.
            </small>
          </div>
          <div className="col-2">
            <div className="form-check form-switch">
              <input
                className="form-check-input"
                type="checkbox"
                id="eventDatesToggle"
                checked={showEventDates}
                onChange={toggleEventDates}
              />
            </div>
          </div>
          {showEventDates && (
            <>
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
                />
                <small className="form-text text-muted">
                  When the actual event ends. Mint expiration will be automatically calculated from this date. Leave empty for indefinite minting.
                </small>
              </div>
            </>
          )}

          <hr className="col-12 my-3"></hr>
          <div className="col-12">
            <h6 className="py-2">Event Details *</h6>
            <small className="form-text text-muted">
              Provide information about your event. These details are stored off-chain and help users understand what the event is about.
            </small>
          </div>

          <div className="col-12">
            <label className="form-label">Event Title *</label>
            <input
              type="text"
              className="form-control"
              placeholder="e.g., Web3 Conference 2024"
              name="title"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              required
            />
            <small className="form-text text-muted">
              A descriptive title for your event
            </small>
          </div>

          <div className="col-12">
            <label className="form-label">Description *</label>
            <textarea
              className="form-control"
              rows="3"
              placeholder="Describe your event, what attendees can expect, etc."
              name="description"
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              required
            />
            <small className="form-text text-muted">
              Detailed description of the event
            </small>
          </div>

          <div className="col-12">
            <label className="form-label">Image URL *</label>
            <input
              type="url"
              className="form-control"
              placeholder="https://example.com/event-image.jpg"
              name="imageUrl"
              value={imageUrl}
              onChange={(event) => setImageUrl(event.target.value)}
              required
            />
            <small className="form-text text-muted">
              URL to an image representing your event (banner, logo, etc.)
            </small>
          </div>

        </form>
      </div>
      <div className="drawer-footer">
        {!isFormValid() && (
          <div className="alert alert-warning mb-2" role="alert">
            <small>
              {!eventId && "Please enter an Event ID. "}
              {!maxSupply && "Please enter Maximum Supply. "}
              {!title.trim() && "Please enter an Event Title. "}
              {!description.trim() && "Please enter a Description. "}
              {!imageUrl.trim() && "Please enter an Image URL. "}
            </small>
          </div>
        )}
        <Button
          type="submit"
          className="btn btn-gradient btn-block"
          onClick={handleSubmit}
          disabled={loading || !isFormValid()}
        >
          {loading ? "Creating..." : "Create Event"}
        </Button>
      </div>
    </div>
  );
}
