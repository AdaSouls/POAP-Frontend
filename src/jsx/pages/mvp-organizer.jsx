import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import Layout from "../layout/layout";
import { useDrawer } from "../contexts/drawer/drawer.provider";
import { mvpSmartContractService } from "../../services/mvp-smart-contract.service";

const MVPOrganizer = () => {
  const { ethereum: { provider } } = useDrawer();
  const [isInitialized, setIsInitialized] = useState(false);
  const [isIssuer, setIsIssuer] = useState(false);
  const [issuerId, setIssuerId] = useState(null);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (provider && provider.address) {
      initializeService();
    }
  }, [provider]);

  const initializeService = async () => {
    try {
      setLoading(true);
      await mvpSmartContractService.initialize(provider);
      setIsInitialized(true);
      
      // Check if user is an issuer
      const issuerInfo = await mvpSmartContractService.isIssuer(provider.address);
      setIsIssuer(issuerInfo.isIssuer);
      setIssuerId(issuerInfo.issuerId);
      
      if (issuerInfo.isIssuer) {
        await loadEvents();
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

  if (!provider) {
    return (
      <Layout activeMenu={1}>
        <div className="card">
          <div className="card-body text-center">
            <h4>Connect Your Ethereum Wallet</h4>
            <p>Please connect your Ethereum wallet to access organizer features.</p>
          </div>
        </div>
      </Layout>
    );
  }

  if (loading) {
    return (
      <Layout activeMenu={1}>
        <div className="card">
          <div className="card-body text-center">
            <div className="spinner-border" role="status">
              <span className="sr-only">Loading...</span>
            </div>
            <p className="mt-2">Initializing Organizer Dashboard...</p>
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
            <p>You are not an event organizer. Only organizers can access this dashboard.</p>
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
              <h2>Organizer Dashboard</h2>
              <p className="text-muted">
                Manage your events, minters, and token distributions.
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

        {/* Quick Stats */}
        <div className="col-md-3">
          <div className="card">
            <div className="card-body text-center">
              <h3>{events.length}</h3>
              <p>Total Events</p>
            </div>
          </div>
        </div>
        <div className="col-md-3">
          <div className="card">
            <div className="card-body text-center">
              <h3>{events.filter(e => !e.isExpired).length}</h3>
              <p>Active Events</p>
            </div>
          </div>
        </div>
        <div className="col-md-3">
          <div className="card">
            <div className="card-body text-center">
              <h3>{events.reduce((sum, e) => sum + e.totalSupply, 0)}</h3>
              <p>Tokens Minted</p>
            </div>
          </div>
        </div>
        <div className="col-md-3">
          <div className="card">
            <div className="card-body text-center">
              <h3>{events.reduce((sum, e) => sum + e.available, 0)}</h3>
              <p>Available Tokens</p>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="col-12">
          <div className="card">
            <div className="card-body">
              <h4>Quick Actions</h4>
              <div className="row g-2 justify-content-around">
                <div className="col-12 col-sm-6 col-md-4 col-lg-3 col-xl-2">
                  <Link to="/mvp/create-event" className="btn btn-success btn-block">
                    Create New Event
                  </Link>
                </div>
                <div className="col-12 col-sm-6 col-md-4 col-lg-3 col-xl-2">
                  <Link to="/mvp/manage-minters" className="btn btn-warning btn-block">
                    Manage Minters
                  </Link>
                </div>
                {/* <div className="col-12 col-sm-6 col-md-4 col-lg-3 col-xl-2">
                  <Link to="/mvp/bulk-distribute" className="btn btn-secondary btn-block">
                    Bulk Distribute Tokens
                  </Link>
                </div> */}
                <div className="col-12 col-sm-6 col-md-4 col-lg-3 col-xl-2">
                  <Link to="/mvp/mint-token" className="btn btn-warning w-100">
                    Mint Token
                  </Link>
                </div>
                <div className="col-12 col-sm-6 col-md-4 col-lg-3 col-xl-2">
                  <button 
                    className="btn btn-primary btn-block"
                    onClick={loadEvents}
                    disabled={loading}
                  >
                    {loading ? "Loading..." : "Refresh Events"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* My Events */}
        <div className="col-12">
          <div className="card">
            <div className="card-body">
              <h4>My Events</h4>
              {events.length === 0 ? (
                <div className="text-center">
                  <p>You haven't created any events yet.</p>
                  <Link to="/mvp/create-event" className="btn btn-success">
                    Create Your First Event
                  </Link>
                </div>
              ) : (
                <div className="table-responsive">
                  <table className="table">
                    <thead>
                      <tr>
                        <th>Event ID</th>
                        <th>Max Supply</th>
                        <th>Total Supply</th>
                        <th>Available</th>
                        <th>Mint Expiration</th>
                        <th>Status</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {events.map((event) => (
                        <tr key={event.eventId}>
                          <td>{event.eventId}</td>
                          <td>{event.maxSupply}</td>
                          <td>{event.totalSupply}</td>
                          <td>{event.available}</td>
                          <td>
                            {event.mintExpiration > 0 
                              ? new Date(event.mintExpiration * 1000).toLocaleDateString()
                              : 'No expiration'
                            }
                          </td>
                          <td>
                            <span className={`badge ${event.isExpired ? 'btn-danger' : 'btn-success'}`}>
                              {event.isExpired ? 'Expired' : 'Active'}
                            </span>
                          </td>
                          <td>
                            <div className="btn-group" role="group">
                              <Link 
                                to={`/mvp/manage-minters?eventId=${event.eventId}`}
                                className="btn btn-sm btn-warning"
                              >
                                Minters
                              </Link>
                              {/* <Link 
                                to={`/mvp/bulk-distribute?eventId=${event.eventId}`}
                                className="btn btn-sm btn-secondary"
                              >
                                Distribute
                              </Link> */}
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
    </Layout>
  );
};

export default MVPOrganizer;

