import {
  useDrawer,
  useDrawerDispatch,
} from "../../contexts/drawer/drawer.provider";
import { useState } from "react";
import { Button } from "react-bootstrap";
import { createEventId } from "../../../utils/poapContractInteractions";
import useValidateEventDate from "../../helpers/useValidateEventDate";
import { mvpSmartContractService } from "../../../services/mvp-smart-contract.service";
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
  const [date, setDate] = useState(false);
  const [expiryDate, setExpiryDate] = useState("");
  const { isDateValid } = useValidateEventDate({ date: expiryDate });
  
  // Check if form is valid
  const isFormValid = () => {
    // Always need Event ID and Maximum Supply
    if (!eventId || !maxSupply) return false;
    
    // If toggle is on, we need a non-empty date and it must be valid and in the future
    if (date) {
      return expiryDate && expiryDate.trim() !== "" && !isNaN(new Date(expiryDate).getTime()) && isDateValid;
    }
    
    // If toggle is off, form is valid (indefinite minting)
    return true;
  };
  const [loading, setLoading] = useState(false);

  const toggleDate = () => {
    if (!date) {
      setDate(true);
      // Set a default future date when toggle is turned on
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 7); // 7 days from now
      setExpiryDate(futureDate.toISOString().split('T')[0]); // Format as YYYY-MM-DD
    } else {
      setDate(false);
      setExpiryDate(""); // Clear date when toggle is turned off
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
    setLoading(true);

    try {
      let timestamp=0;
      if (!date) {
        // Set to 0 for indefinite (no expiration)
        timestamp = 0;
      } else {
        const miliseconds = new Date(expiryDate);
        timestamp = Math.floor(miliseconds.getTime() / 1000);
      }

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
        
        closeDrawer();
        succesfullBlockchainCreation(
          "Event Created Successfully",
          `Transaction: ${result.txHash}`,
          explorerUrl
        );
      }
      
    } catch (error) {
      console.error("Error creating event:", error);
      errorFunction(
        "Error",
        "An error occurred while creating the event. Please try again.",
        ""
      );
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
              Do you want an expiry date for the minting?
            </h6>
            <small className="form-text text-muted">
              If unchecked, minting will be indefinite (no expiration). If checked, you must select a valid future date to enable event creation.
            </small>
          </div>
          <div className="col-2">
            <div className="form-check form-switch">
              <input
                className="form-check-input"
                type="checkbox"
                id="flexSwitchCheckDefault"
                onClick={toggleDate}
              />
            </div>
          </div>
          {date && (
            <div className="col-12">
              <label className="form-label">Mint Expiration Date</label>
              <input
                type="date"
                className="form-control"
                placeholder="Expiry Date"
                name="expiryDate"
                value={expiryDate}
                onChange={(event) => setExpiryDate(event.target.value)}
                required
              />
              <small className="form-text text-muted">
                After this date, no more POAPs can be minted for this event. Leave unchecked for indefinite minting.
              </small>
            </div>
          )}
        </form>
      </div>
      <div className="drawer-footer">
        {!isFormValid() && (
          <div className="alert alert-warning mb-2" role="alert">
            <small>
              {!eventId && "Please enter an Event ID. "}
              {!maxSupply && "Please enter Maximum Supply. "}
              {date && (!expiryDate || expiryDate.trim() === "") && "Please select a date to enable event creation. "}
              {date && expiryDate && expiryDate.trim() !== "" && isNaN(new Date(expiryDate).getTime()) && "Please select a valid date format. "}
              {date && expiryDate && expiryDate.trim() !== "" && !isNaN(new Date(expiryDate).getTime()) && !isDateValid && "Please select a future date to enable event creation. "}
            </small>
          </div>
        )}
        <Button
          type="submit"
          className="btn btn-gradient btn-block"
          onClick={handleSubmit}
          disabled={loading || !eventId || !maxSupply || (date ? (!expiryDate || expiryDate.trim() === "" || !isDateValid) : false)}
        >
          {loading ? "Creating..." : "Create Event"}
        </Button>
      </div>
    </div>
  );
}
