import React, { useState, useEffect, useCallback } from "react";
import Layout from "../layout/layout";
import { useDrawer } from "../contexts/drawer/drawer.provider";
import { useUserRoles } from "../contexts/user-roles/user-roles.provider";
import { mvpSmartContractService } from "../../services/mvp-smart-contract.service";
import EventDetailsModal from "../components/EventDetailsModal";

const MVPEvents = () => {
  const { ethereum: { provider } } = useDrawer();
  const { userRoles } = useUserRoles();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [viewMode, setViewMode] = useState('all'); // 'all', 'organizer', 'attendee'

  const loadEvents = useCallback(async () => {
    try {
      setLoading(true);
      let eventsData = [];
      
      switch(viewMode) {
        case 'organizer':
          eventsData = await mvpSmartContractService.getOrganizerEvents(provider.address);
          break;
        case 'attendee':
          eventsData = await mvpSmartContractService.getAttendeeEvents(provider.address);
          break;
        default:
          eventsData = await mvpSmartContractService.getAllEvents();
      }
      
      setEvents(eventsData);
    } catch (error) {
      console.error("Failed to load events:", error);
    } finally {
      setLoading(false);
    }
  }, [viewMode, provider?.address]);

  useEffect(() => {
    if (provider && provider.address) {
      loadEvents();
    }
  }, [viewMode, provider, loadEvents]);

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
                <h4>
                  {viewMode === 'organizer' ? 'My Events' : 
                   viewMode === 'attendee' ? 'Events I Participated In' : 
                   'All Events'}
                </h4>
                <div className="d-flex align-items-center">
                  <div className="btn-group mr-3" role="group">
                    <button
                      type="button"
                      className={`btn ${viewMode === 'all' ? 'btn-primary' : 'btn-outline-primary'}`}
                      onClick={() => setViewMode('all')}
                    >
                      All Events
                    </button>
                    {userRoles.includes('organizer') && (
                      <button
                        type="button"
                        className={`btn ${viewMode === 'organizer' ? 'btn-primary' : 'btn-outline-primary'}`}
                        onClick={() => setViewMode('organizer')}
                      >
                        My Events
                      </button>
                    )}
                    {userRoles.includes('attendee') && (
                      <button
                        type="button"
                        className={`btn ${viewMode === 'attendee' ? 'btn-primary' : 'btn-outline-primary'}`}
                        onClick={() => setViewMode('attendee')}
                      >
                        My Participation
                      </button>
                    )}
                  </div>
                  <button 
                    className="btn btn-secondary" 
                    onClick={loadEvents}
                    disabled={loading}
                  >
                    {loading ? "Loading..." : "Refresh"}
                  </button>
                </div>
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
                        {viewMode === 'all' && <th>Issuer ID</th>}
                        <th>Max Supply</th>
                        <th>Total Supply</th>
                        <th>Available</th>
                        <th>Mint Expiration</th>
                        {viewMode === 'all' && <th>Organizer</th>}
                        <th>Status</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {events.map((event) => (
                        <tr key={event.eventId}>
                          <td>{event.eventId}</td>
                          {viewMode === 'all' && <td>{event.issuerId}</td>}
                          <td>{event.maxSupply}</td>
                          <td>{event.totalSupply}</td>
                          <td>{event.available}</td>
                          <td>
                            {event.mintExpiration > 0 
                              ? new Date(event.mintExpiration * 1000).toLocaleDateString()
                              : 'No expiration'
                            }
                          </td>
                          {viewMode === 'all' && <td>{event.eventOrganizer}</td>}
                          <td>
                            <span className={`badge ${event.isExpired ? 'btn-danger' : 'btn-success'}`}>
                              {event.isExpired ? 'Expired' : 'Active'}
                            </span>
                          </td>
                          <td>
                            <div className="btn-group" role="group">
                              <button 
                                className="btn btn-sm btn-info"
                                onClick={() => handleViewDetails(event)}
                              >
                                View Details
                              </button>
                              {viewMode === 'organizer' && (
                                <>
                                  <button 
                                    className="btn btn-sm btn-warning"
                                    onClick={() => window.location.href = `/mvp/manage-minters?eventId=${event.eventId}`}
                                  >
                                    Minters
                                  </button>
                                  {/* <button 
                                    className="btn btn-sm btn-secondary"
                                    onClick={() => window.location.href = `/mvp/bulk-distribute?eventId=${event.eventId}`}
                                  >
                                    Distribute
                                  </button> */}
                                </>
                              )}
                            </div>
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