import React, { useState, useEffect } from "react";
import { useSearchParams, Link } from "react-router-dom";
import Layout from "../layout/layout";
import { useDrawer } from "../contexts/drawer/drawer.provider";
import { useUserRoles } from "../contexts/user-roles/user-roles.provider";
import { mvpSmartContractService } from "../../services/mvp-smart-contract.service";
import { 
  informationFunction, 
  errorFunction, 
  succesfullBlockchainCreation
} from "../toasts/sweetAlerts";

const MVPBulkDistribute = () => {
  const { ethereum: { provider } } = useDrawer();
  const { isIssuer, issuerId, isInitialized, isLoading } = useUserRoles();
  const [searchParams] = useSearchParams();
  const [events, setEvents] = useState([]);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [recipients, setRecipients] = useState([]);
  const [newRecipient, setNewRecipient] = useState('');
  const [loading, setLoading] = useState(false);
  const [distributing, setDistributing] = useState(false);
  const [progress, setProgress] = useState(0);

  const eventIdFromUrl = searchParams.get('eventId');

  useEffect(() => {
    if (provider && provider.address) {
      initializeService();
    }
  }, [provider]);

  const initializeService = async () => {
    try {
      setLoading(true);
      if (isIssuer) {
        await loadEvents();
        
        // If eventId is provided in URL, select that event
        if (eventIdFromUrl) {
          const eventId = parseInt(eventIdFromUrl);
          const event = events.find(e => e.eventId === eventId);
          if (event) {
            setSelectedEvent(event);
          }
        }
      }
    } catch (error) {
      console.error("Failed to initialize service:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadEvents = async () => {
    try {
      const eventsData = await mvpSmartContractService.getOrganizerEvents(provider.address);
      setEvents(eventsData);
    } catch (error) {
      console.error("Failed to load events:", error);
    }
  };

  const handleEventChange = (e) => {
    const eventId = parseInt(e.target.value);
    const event = events.find(e => e.eventId === eventId);
    setSelectedEvent(event);
  };

  const handleAddRecipient = () => {
    if (newRecipient.trim() && !recipients.includes(newRecipient.trim())) {
      setRecipients([...recipients, newRecipient.trim()]);
      setNewRecipient('');
    }
  };

  const handleRemoveRecipient = (index) => {
    setRecipients(recipients.filter((_, i) => i !== index));
  };

  const handleAddMultipleRecipients = () => {
    const addresses = newRecipient
      .split('\n')
      .map(addr => addr.trim())
      .filter(addr => addr && !recipients.includes(addr));
    
    setRecipients([...recipients, ...addresses]);
    setNewRecipient('');
  };

  const handleDistribute = async () => {
    if (!selectedEvent || recipients.length === 0) {
      informationFunction(
        "Missing Information",
        "Please select an event and add at least one recipient."
      );
      return;
    }

    if (recipients.length > selectedEvent.available) {
      informationFunction(
        "Insufficient Supply",
        `You can only distribute ${selectedEvent.available} tokens, but you have ${recipients.length} recipients.`
      );
      return;
    }

    try {
      setDistributing(true);
      setProgress(0);
      
      const result = await mvpSmartContractService.bulkMintTokens(
        issuerId,
        selectedEvent.eventId,
        recipients
      );
      if (result.success) {
        const explorerUrl = `${process.env.REACT_APP_POLYGON_AMOY_BLOCK_EXPLORER_URL}/tx/${result.txHash}`;
        
        succesfullBlockchainCreation(
          "Tokens Distributed Successfully",
          `Distributed ${recipients.length} tokens for Event ${selectedEvent.eventId}`,
          explorerUrl
        );
        
        setRecipients([]);
        await loadEvents(); // Refresh events to update supply
      }
    } catch (error) {
      console.error("Failed to distribute tokens:", error);
      errorFunction(
        "Distribution Failed",
        `Failed to distribute tokens: ${error.message}`
      );
    } finally {
      setDistributing(false);
      setProgress(0);
    }
  };

  if (!provider) {
    return (
      <Layout activeMenu={1}>
        <div className="card">
          <div className="card-body text-center">
            <h4>Connect Your Ethereum Wallet</h4>
            <p>Please connect your Ethereum wallet to distribute tokens.</p>
          </div>
        </div>
      </Layout>
    );
  }

  if (isLoading || loading) {
    return (
      <Layout activeMenu={1}>
        <div className="card">
          <div className="card-body text-center">
            <div className="spinner-border" role="status">
              <span className="sr-only">Loading...</span>
            </div>
            <p className="mt-2">Loading bulk distribution...</p>
          </div>
        </div>
      </Layout>
    );
  }

  if (!isIssuer) {
    return (
      <Layout activeMenu={1}>
        <div className="card">
          <div className="card-body text-center">
            <h4>Access Denied</h4>
            <p>You are not an event organizer. Only organizers can distribute tokens.</p>
            <Link to="/mvp" className="btn btn-primary">
              Back to Dashboard
            </Link>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout activeMenu={1}>
      <div className="row">
        {/* Header */}
        <div className="col-12">
          <div className="card">
            <div className="card-body">
              <h2>Bulk Token Distribution</h2>
              <p className="text-muted">
                Distribute POAP tokens to multiple addresses at once.
              </p>
              <div className="row">
                <div className="col-md-4">
                  <p><strong>Connected Wallet:</strong> {provider.address}</p>
                </div>
                <div className="col-md-4">
                  <p><strong>Issuer ID:</strong> {issuerId}</p>
                </div>
                <div className="col-md-4">
                  <p><strong>Total Events:</strong> {events.length}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Event Selection */}
        <div className="col-12">
          <div className="card">
            <div className="card-body">
              <h4>Select Event</h4>
              <div className="form-group">
                <label htmlFor="eventSelect">Choose an event to distribute tokens for:</label>
                <select
                  className="form-control"
                  id="eventSelect"
                  value={selectedEvent ? selectedEvent.eventId : ''}
                  onChange={handleEventChange}
                >
                  <option value="">Select an event...</option>
                  {events.map((event) => (
                    <option key={event.eventId} value={event.eventId}>
                      Event {event.eventId} (Max: {event.maxSupply}, Minted: {event.totalSupply}, Available: {event.available})
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </div>

        {selectedEvent && (
          <>
            {/* Add Recipients */}
            <div className="col-md-6">
              <div className="card">
                <div className="card-body">
                  <h4>Add Recipients</h4>
                  <div className="form-group">
                    <label htmlFor="recipientAddress">Single Address:</label>
                    <div className="input-group">
                      <input
                        type="text"
                        className="form-control"
                        id="recipientAddress"
                        value={newRecipient}
                        onChange={(e) => setNewRecipient(e.target.value)}
                        placeholder="0x..."
                      />
                      <div className="input-group-append">
                        <button
                          className="btn btn-outline-primary"
                          onClick={handleAddRecipient}
                          disabled={!newRecipient.trim()}
                        >
                          Add
                        </button>
                      </div>
                    </div>
                  </div>
                  
                  <div className="form-group">
                    <label htmlFor="multipleAddresses">Multiple Addresses (one per line):</label>
                    <textarea
                      className="form-control"
                      id="multipleAddresses"
                      rows="4"
                      value={newRecipient}
                      onChange={(e) => setNewRecipient(e.target.value)}
                      placeholder="0x...&#10;0x...&#10;0x..."
                    />
                    <button
                      className="btn btn-outline-secondary mt-2"
                      onClick={handleAddMultipleRecipients}
                      disabled={!newRecipient.trim()}
                    >
                      Add All
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Recipients List */}
            <div className="col-md-6">
              <div className="card">
                <div className="card-body">
                  <h4>Recipients ({recipients.length})</h4>
                  {recipients.length === 0 ? (
                    <p className="text-muted">No recipients added yet.</p>
                  ) : (
                    <div className="list-group" style={{ maxHeight: '300px', overflowY: 'auto' }}>
                      {recipients.map((recipient, index) => (
                        <div key={index} className="list-group-item d-flex justify-content-between align-items-center">
                          <span className="font-monospace small">{recipient}</span>
                          <button
                            className="btn btn-sm btn-danger"
                            onClick={() => handleRemoveRecipient(index)}
                          >
                            Remove
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                  {recipients.length > 0 && (
                    <button
                      className="btn btn-outline-danger btn-sm mt-2"
                      onClick={() => setRecipients([])}
                    >
                      Clear All
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Event Info */}
            <div className="col-12">
              <div className="card">
                <div className="card-body">
                  <h4>Event Information</h4>
                  <div className="row">
                    <div className="col-md-3">
                      <p><strong>Event ID:</strong> {selectedEvent.eventId}</p>
                    </div>
                    <div className="col-md-3">
                      <p><strong>Max Supply:</strong> {selectedEvent.maxSupply}</p>
                    </div>
                    <div className="col-md-3">
                      <p><strong>Total Supply:</strong> {selectedEvent.totalSupply}</p>
                    </div>
                    <div className="col-md-3">
                      <p><strong>Available:</strong> {selectedEvent.available}</p>
                    </div>
                  </div>
                  <div className="row">
                    <div className="col-md-6">
                      <p><strong>Mint Expiration:</strong> 
                        {selectedEvent.mintExpiration > 0 
                          ? new Date(selectedEvent.mintExpiration * 1000).toLocaleDateString()
                          : 'No expiration'
                        }
                      </p>
                    </div>
                    <div className="col-md-6">
                      <p><strong>Status:</strong> 
                        <span className={`badge ${selectedEvent.isExpired ? 'btn-danger' : 'btn-success'}`}>
                          {selectedEvent.isExpired ? 'Expired' : 'Active'}
                        </span>
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Distribution Summary */}
            <div className="col-12">
              <div className="card">
                <div className="card-body">
                  <h4>Distribution Summary</h4>
                  <div className="row">
                    <div className="col-md-4">
                      <p><strong>Recipients:</strong> {recipients.length}</p>
                    </div>
                    <div className="col-md-4">
                      <p><strong>Available Tokens:</strong> {selectedEvent.available}</p>
                    </div>
                    <div className="col-md-4">
                      <p><strong>Can Distribute:</strong> 
                        <span className={recipients.length <= selectedEvent.available ? 'text-success' : 'text-danger'}>
                          {recipients.length <= selectedEvent.available ? 'Yes' : 'No'}
                        </span>
                      </p>
                    </div>
                  </div>
                  
                  {recipients.length > 0 && (
                    <div className="mt-3">
                      <button
                        className="btn btn-success btn-lg"
                        onClick={handleDistribute}
                        disabled={distributing || recipients.length > selectedEvent.available || selectedEvent.isExpired}
                      >
                        {distributing ? "Distributing..." : `Distribute ${recipients.length} Tokens`}
                      </button>
                      
                      {distributing && (
                        <div className="mt-3">
                          <div className="progress">
                            <div 
                              className="progress-bar" 
                              role="progressbar" 
                              style={{ width: `${progress}%` }}
                            >
                              {progress}%
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </>
        )}

        {/* Actions */}
        <div className="col-12">
          <div className="card">
            <div className="card-body">
              <div className="d-flex justify-content-between">
                <Link to="/mvp/organizer" className="btn btn-secondary">
                  Back to Organizer Dashboard
                </Link>
                <Link to="/mvp/manage-minters" className="btn btn-warning">
                  Manage Minters
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default MVPBulkDistribute;

