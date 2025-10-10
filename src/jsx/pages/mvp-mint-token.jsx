import React, { useState, useEffect } from "react";
import Layout from "../layout/layout";
import { useDrawer } from "../contexts/drawer/drawer.provider";
import { mvpSmartContractService } from "../../services/mvp-smart-contract.service";
import { useNavigate } from "react-router-dom";
import { 
  informationFunction, 
  errorFunction, 
  succesfullMessage 
} from "../toasts/sweetAlerts";

const MVPMintToken = () => {
  const { ethereum: { provider } } = useDrawer();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [events, setEvents] = useState([]);
  const [loadingEvents, setLoadingEvents] = useState(false);
  const [debugInfo, setDebugInfo] = useState("");
  const [formData, setFormData] = useState({
    issuerId: "",
    eventId: "",
    to: "",
  });

  useEffect(() => {
    if (provider && provider.address) {
      mvpSmartContractService.testContract().then(console.log);
      loadEvents();
      setFormData(prev => ({
        ...prev,
        to: provider.address
      }));
    }
  }, [provider]);

  const loadEvents = async () => {
    try {
      setLoadingEvents(true);
      setDebugInfo("Loading events...");
      
      // Check if service is initialized
      if (!mvpSmartContractService.contract) {
        setDebugInfo("Initializing smart contract service...");
        await mvpSmartContractService.initialize(window.ethereum);
      }
      
      // Check if events exist
      const eventsExist = await mvpSmartContractService.checkEventsExist();
      setDebugInfo(`Events exist check: ${eventsExist}`);
      
      const eventsData = await mvpSmartContractService.getAllEvents();
      setDebugInfo(`Loaded ${eventsData.length} events from blockchain`);
      
      const filteredEvents = eventsData.filter(event => !event.isExpired && event.available > 0);
      setDebugInfo(`Filtered to ${filteredEvents.length} available events`);
      
      setEvents(eventsData);
    } catch (error) {
      console.error("Failed to load events:", error);
      setDebugInfo(`Error: ${error.message}`);
    } finally {
      setLoadingEvents(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleEventChange = (e) => {
    const eventId = parseInt(e.target.value);
    const selectedEvent = events.find(event => event.eventId === eventId);
    
    setFormData(prev => ({
      ...prev,
      eventId: eventId,
      issuerId: selectedEvent ? selectedEvent.issuerId : ""
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!provider || !provider.address) {
      informationFunction(
        "Wallet Required",
        "Please connect your Ethereum wallet first."
      );
      return;
    }

    if (!formData.eventId || !formData.issuerId) {
      informationFunction(
        "Event Selection Required",
        "Please select an event first."
      );
      return;
    }

    try {
      setLoading(true);
      
      const result = await mvpSmartContractService.mintToken(
        parseInt(formData.issuerId),
        parseInt(formData.eventId),
        formData.to
      );

      if (result.success) {
        succesfullMessage(
          "Token Minted Successfully",
          `Transaction: ${result.txHash}`
        );
        navigate("/mvp");
      }
    } catch (error) {
      console.error("Failed to mint token:", error);
      errorFunction(
        "Mint Failed",
        `Failed to mint token: ${error.message}`
      );
    } finally {
      setLoading(false);
    }
  };

  if (!provider) {
    return (
      <Layout activeMenu={1}>
        <div className="card">
          <div className="card-body text-center">
            <h4>Connect Your Ethereum Wallet</h4>
            <p>Please connect your Ethereum wallet to mint tokens.</p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout activeMenu={1}>
      <div className="row">
        <div className="col-md-8 offset-md-2">
          <div className="card">
            <div className="card-body">
              <h4>Mint POAP Token</h4>
              <p className="text-muted">
                Mint a POAP token for an existing event.
              </p>

              {/* Show loading state */}
              {loadingEvents && (
                <div className="alert alert-info">
                  <div className="spinner-border spinner-border-sm me-2" role="status">
                    <span className="sr-only">Loading...</span>
                  </div>
                  Loading events...
                </div>
              )}

              {/* Show no events message */}
              {!loadingEvents && events.length === 0 && (
                <div className="alert alert-warning">
                  <h5>No events available</h5>
                  <p>You need to create an event first before you can mint tokens.</p>
                  <button 
                    className="btn btn-primary"
                    onClick={() => navigate("/mvp/create-event")}
                  >
                    Create Event
                  </button>
                </div>
              )}

              <form onSubmit={handleSubmit}>
                <div className="form-group mb-3">
                  <label htmlFor="eventId">Select Event</label>
                  <select
                    className="form-control"
                    id="eventId"
                    name="eventId"
                    value={formData.eventId}
                    onChange={handleEventChange}
                    required
                    disabled={loadingEvents || events.length === 0}
                  >
                    <option value="">Select an event...</option>
                    {events.map((event) => (
                      <option key={event.eventId} value={event.eventId}>
                        Event {event.eventId} (Issuer: {event.issuerId}, Available: {event.available})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group mb-3">
                  <label htmlFor="issuerId">Issuer ID (auto-filled from event)</label>
                  <input
                    type="number"
                    className="form-control"
                    id="issuerId"
                    name="issuerId"
                    value={formData.issuerId}
                    onChange={handleInputChange}
                    required
                    readOnly
                  />
                </div>

                <div className="form-group mb-3">
                  <label htmlFor="to">Recipient Address</label>
                  <input
                    type="text"
                    className="form-control"
                    id="to"
                    name="to"
                    value={formData.to}
                    onChange={handleInputChange}
                    required
                  />
                </div>

                <div className="form-group">
                  <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={loading || events.length === 0}
                  >
                    {loading ? "Minting Token..." : "Mint Token"}
                  </button>
                  <button
                    type="button"
                    className="btn btn-secondary ml-2"
                    onClick={() => navigate("/mvp")}
                  >
                    Cancel
                  </button>
                </div>
              </form>
              {events.length === 0 && (
                <div className="alert alert-warning mt-3">
                  No active events with available tokens found.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default MVPMintToken;