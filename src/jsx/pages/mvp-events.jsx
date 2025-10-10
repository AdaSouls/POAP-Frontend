import React, { useState, useEffect } from "react";
import Layout from "../layout/layout";
import { useDrawer } from "../contexts/drawer/drawer.provider";
import { mvpSmartContractService } from "../../services/mvp-smart-contract.service";
import EventDetailsModal from "../components/EventDetailsModal";

const MVPEvents = () => {
  const { ethereum: { provider } } = useDrawer();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    if (provider && provider.address) {
      loadEvents();
    }
  }, [provider]);

  const loadEvents = async () => {
    try {
      setLoading(true);
      const eventsData = await mvpSmartContractService.getAllEvents();
      setEvents(eventsData);
    } catch (error) {
      console.error("Failed to load events:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetails = (event) => {
    setSelectedEvent(event);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedEvent(null);
  };

  if (!provider) {
    return (
      <Layout activeMenu={1}>
        <div className="card">
          <div className="card-body text-center">
            <h4>Connect Your Ethereum Wallet</h4>
            <p>Please connect your Ethereum wallet to view events.</p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout activeMenu={1}>
      <div className="row">
        <div className="col-12">
          <div className="card">
            <div className="card-body">
              <div className="d-flex justify-content-between align-items-center mb-3">
                <h4>All Events</h4>
                <button 
                  className="btn btn-primary" 
                  onClick={loadEvents}
                  disabled={loading}
                >
                  {loading ? "Loading..." : "Refresh"}
                </button>
              </div>

              {loading ? (
                <div className="text-center">
                  <div className="spinner-border" role="status">
                    <span className="sr-only">Loading...</span>
                  </div>
                </div>
              ) : events.length === 0 ? (
                <p>No events found.</p>
              ) : (
                <div className="table-responsive">
                  <table className="table">
                    <thead>
                      <tr>
                        <th>Event ID</th>
                        <th>Issuer ID</th>
                        <th>Max Supply</th>
                        <th>Total Supply</th>
                        <th>Available</th>
                        <th>Mint Expiration</th>
                        <th>Organizer</th>
                        <th>Status</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {events.map((event) => (
                        <tr key={event.eventId}>
                          <td>{event.eventId}</td>
                          <td>{event.issuerId}</td>
                          <td>{event.maxSupply}</td>
                          <td>{event.totalSupply}</td>
                          <td>{event.available}</td>
                          <td>
                            {event.mintExpiration > 0 
                              ? new Date(event.mintExpiration * 1000).toLocaleDateString()
                              : 'No expiration'
                            }
                          </td>
                          <td>{event.eventOrganizer}</td>
                          <td>
                            <span className={`badge ${event.isExpired ? 'btn-danger' : 'btn-success'}`}>
                              {event.isExpired ? 'Expired' : 'Active'}
                            </span>
                          </td>
                          <td>
                            <button 
                              className="btn btn-sm btn-info"
                              onClick={() => handleViewDetails(event)}
                            >
                              View Details
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <EventDetailsModal 
        event={selectedEvent}
        isOpen={isModalOpen}
        onClose={handleCloseModal}
      />
    </Layout>
  );
};

export default MVPEvents;