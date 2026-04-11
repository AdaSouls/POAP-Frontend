import React, { useState, useEffect, useCallback } from "react";
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

const MVPMangeMinters = () => {
  const { ethereum: { provider } } = useDrawer();
  const { isIssuer, issuerId, isLoading } = useUserRoles();
  const [searchParams] = useSearchParams();
  const [events, setEvents] = useState([]);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [minters, setMinters] = useState([]);
  const [newMinterAddress, setNewMinterAddress] = useState('');
  const [loading, setLoading] = useState(false);
  const [addingMinter, setAddingMinter] = useState(false);
  const [removingMinter, setRemovingMinter] = useState(false);

  const eventIdFromUrl = searchParams.get('eventId');

  const loadMinters = useCallback(async (eventId) => {
    try {
      // Note: This would need to be implemented in the smart contract service
      // For now, we'll show a placeholder
      setMinters([]);
    } catch (error) {
      console.error("Failed to load minters:", error);
    }
  }, []);

  const loadEvents = useCallback(async () => {
    try {
      const eventsData = await mvpSmartContractService.getOrganizerEvents(provider.address);
      setEvents(eventsData);
      return eventsData;
    } catch (error) {
      console.error("Failed to load events:", error);
      return [];
    }
  }, [provider?.address]);

  const initializeService = useCallback(async () => {
    try {
      setLoading(true);
      if (isIssuer) {
        const eventsData = await loadEvents();
        
        // If eventId is provided in URL, select that event
        if (eventIdFromUrl) {
          const eventId = parseInt(eventIdFromUrl);
          const event = eventsData.find(e => e.eventId === eventId);
          if (event) {
            setSelectedEvent(event);
            await loadMinters(eventId);
          }
        }
      }
    } catch (error) {
      console.error("Failed to initialize service:", error);
    } finally {
      setLoading(false);
    }
  }, [isIssuer, loadEvents, eventIdFromUrl, loadMinters]);

  useEffect(() => {
    if (provider && provider.address) {
      initializeService();
    }
  }, [provider, initializeService]);

  const handleEventChange = (e) => {
    const eventId = parseInt(e.target.value);
    const event = events.find(e => e.eventId === eventId);
    setSelectedEvent(event);
    if (event) {
      loadMinters(eventId);
    }
  };

  const handleAddMinter = async () => {
    if (!selectedEvent || !newMinterAddress.trim()) {
      informationFunction(
        "Missing Information",
        "Please select an event and enter a valid address."
      );
      return;
    }

    try {
      setAddingMinter(true);
      
      const result = await mvpSmartContractService.addEventMinter(
        selectedEvent.eventId,
        newMinterAddress.trim()
      );

      if (result.success) {
        const explorerUrl = `${process.env.REACT_APP_POLYGON_AMOY_BLOCK_EXPLORER_URL}/tx/${result.txHash}`;
        
        succesfullBlockchainCreation(
          "Minter Added Successfully",
          `Address ${newMinterAddress} can now mint tokens for Event ${selectedEvent.eventId}`,
          explorerUrl
        );
        
        setNewMinterAddress('');
        await loadMinters(selectedEvent.eventId);
      }
    } catch (error) {
      console.error("Failed to add minter:", error);
      errorFunction(
        "Add Minter Failed",
        `Failed to add minter: ${error.message}`
      );
    } finally {
      setAddingMinter(false);
    }
  };

  const handleRemoveMinter = async (address) => {
    if (!selectedEvent) {
      informationFunction(
        "No Event Selected",
        "Please select an event first."
      );
      return;
    }

    try {
      setRemovingMinter(true);
      
      const result = await mvpSmartContractService.removeEventMinter(
        selectedEvent.eventId,
        address
      );

      if (result.success) {
        const explorerUrl = `${process.env.REACT_APP_POLYGON_AMOY_BLOCK_EXPLORER_URL}/tx/${result.txHash}`;
        
        succesfullBlockchainCreation(
          "Minter Removed Successfully",
          `Address ${address} can no longer mint tokens for Event ${selectedEvent.eventId}`,
          explorerUrl
        );
        
        await loadMinters(selectedEvent.eventId);
      }
    } catch (error) {
      console.error("Failed to remove minter:", error);
      errorFunction(
        "Remove Minter Failed",
        `Failed to remove minter: ${error.message}`
      );
    } finally {
      setRemovingMinter(false);
    }
  };

  if (!provider) {
    return (
      <Layout activeMenu={11}>
        <div className="card">
          <div className="card-body text-center">
            <h4>Connect Your Ethereum Wallet</h4>
            <p>Please connect your Ethereum wallet to manage minters.</p>
          </div>
        </div>
      </Layout>
    );
  }

  if (isLoading || loading) {
    return (
      <Layout activeMenu={11}>
        <div className="card">
          <div className="card-body text-center">
            <div className="spinner-border" role="status">
              <span className="sr-only">Loading...</span>
            </div>
            <p className="mt-2">Loading minter management...</p>
          </div>
        </div>
      </Layout>
    );
  }

  if (!isIssuer) {
    return (
      <Layout activeMenu={11}>
        <div className="card">
          <div className="card-body text-center">
            <h4>Access Denied</h4>
            <p>You are not an event organizer. Only organizers can manage minters.</p>
            <Link to="/mvp" className="btn btn-primary">
              Back to Dashboard
            </Link>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout activeMenu={11}>
      <div className="row">
        {/* Header */}
        <div className="col-12">
          <div className="card">
            <div className="card-body">
              <h2>Manage Event Minters</h2>
              <p className="text-muted">
                Add or remove addresses that can mint tokens for your events.
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
                <label htmlFor="eventSelect">Choose an event to manage minters for:</label>
                <select
                  className="form-control"
                  id="eventSelect"
                  value={selectedEvent ? selectedEvent.eventId : ''}
                  onChange={handleEventChange}
                >
                  <option value="">Select an event...</option>
                  {events.map((event) => (
                    <option key={event.eventId} value={event.eventId}>
                      Event {event.eventId} (Max: {event.maxSupply}, Minted: {event.totalSupply})
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </div>

        {selectedEvent && (
          <>
            {/* Add New Minter */}
            <div className="col-md-6">
              <div className="card">
                <div className="card-body">
                  <h4>Add New Minter</h4>
                  <div className="form-group">
                    <label htmlFor="minterAddress">Ethereum Address:</label>
                    <input
                      type="text"
                      className="form-control"
                      id="minterAddress"
                      value={newMinterAddress}
                      onChange={(e) => setNewMinterAddress(e.target.value)}
                      placeholder="0x..."
                    />
                  </div>
                  <button
                    className="btn btn-success"
                    onClick={handleAddMinter}
                    disabled={addingMinter || !newMinterAddress.trim()}
                  >
                    {addingMinter ? "Adding..." : "Add Minter"}
                  </button>
                </div>
              </div>
            </div>

            {/* Current Minters */}
            <div className="col-md-6">
              <div className="card">
                <div className="card-body">
                  <h4>Current Minters for Event {selectedEvent.eventId}</h4>
                  {minters.length === 0 ? (
                    <p className="text-muted">No minters added yet.</p>
                  ) : (
                    <div className="list-group">
                      {minters.map((minter, index) => (
                        <div key={index} className="list-group-item d-flex justify-content-between align-items-center">
                          <span className="font-monospace">{minter}</span>
                          <button
                            className="btn btn-sm btn-danger"
                            onClick={() => handleRemoveMinter(minter)}
                            disabled={removingMinter}
                          >
                            {removingMinter ? "Removing..." : "Remove"}
                          </button>
                        </div>
                      ))}
                    </div>
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
                {/* <Link to="/mvp/bulk-distribute" className="btn btn-primary">
                  Bulk Distribute Tokens
                </Link> */}
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default MVPMangeMinters;

