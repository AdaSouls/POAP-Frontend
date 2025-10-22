import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import Layout from "../layout/layout";
import { useDrawer } from "../contexts/drawer/drawer.provider";
import { useUserRoles } from "../contexts/user-roles/user-roles.provider";
import { mvpSmartContractService } from "../../services/mvp-smart-contract.service";

const MVP = () => {
  const { ethereum: { provider } } = useDrawer();
  const { userRoles, isAdmin, isIssuer, issuerId, isInitialized, isLoading } = useUserRoles();
  const [organizerEvents, setOrganizerEvents] = useState([]);
  const [attendeeEvents, setAttendeeEvents] = useState([]);
  const [userTokens, setUserTokens] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (provider && provider.address) {
      initializeService();
    }
  }, [provider]);

  const initializeService = async () => {
    try {
      setLoading(true);
      // Load role-specific data
      await loadData();
    } catch (error) {
      console.error("Failed to initialize service:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadData = async () => {
    try {
      const promises = [];
      
      // Always load user tokens
      promises.push(mvpSmartContractService.getUserTokens(provider.address));
      
      // Load organizer data if user is organizer
      if (userRoles.includes('organizer')) {
        promises.push(mvpSmartContractService.getOrganizerEvents(provider.address));
      } else {
        promises.push(Promise.resolve([]));
      }
      
      // Load attendee data if user is attendee
      if (userRoles.includes('attendee')) {
        promises.push(mvpSmartContractService.getAttendeeEvents(provider.address));
      } else {
        promises.push(Promise.resolve([]));
      }
      
      const [tokensData, organizerEventsData, attendeeEventsData] = await Promise.all(promises);
      
      setUserTokens(tokensData);
      setOrganizerEvents(organizerEventsData);
      setAttendeeEvents(attendeeEventsData);
    } catch (error) {
      console.error("Failed to load data:", error);
    }
  };

  if (!provider) {
    return (
      <Layout activeMenu={9}>
        <div className="row">
          <div className="col-12">
            <div className="card">
              <div className="card-body text-center">
                <h4>Connect Your Ethereum Wallet</h4>
                <p>Please connect your Ethereum wallet to use the MVP features.</p>
                <Link to="/wallet" className="btn btn-primary">
                  Go to Wallet
                </Link>
              </div>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  if (isLoading || loading) {
    return (
      <Layout activeMenu={9}>
        <div className="row">
          <div className="col-12">
            <div className="card">
              <div className="card-body text-center">
                <div className="spinner-border" role="status">
                  <span className="sr-only">Loading...</span>
                </div>
                <p className="mt-2">Initializing Smart Contract Service...</p>
              </div>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout activeMenu={9}>
      <div className="row">
        {/* Header */}
        <div className="col-12">
          <div className="card">
            <div className="card-body">
              <h2>POAP - Smart Contract Only</h2>
              <p className="text-muted">
                This version uses only smart contracts, bypassing the backend API completely.
                For the integrated version (Backend + Smart Contracts), visit the Events page.
              </p>
              <div className="row">
                <div className="col-md-4">
                  <p><strong>Connected Wallet:</strong> {provider.address}</p>
                </div>
                <div className="col-md-4">
                  <p><strong>Role(s):</strong> 
                    {userRoles.map((role, index) => (
                      <span key={role} className={`badge ${role === 'admin' ? 'btn-danger' : role === 'organizer' ? 'btn-success' : 'btn-info'} ml-1`}>
                        {role.charAt(0).toUpperCase() + role.slice(1)}
                      </span>
                    ))}
                  </p>
                </div>
                <div className="col-md-4">
                  {isIssuer && (
                    <p><strong>Issuer ID:</strong> {issuerId}</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="col-md-3">
          <div className="card">
            <div className="card-body text-center">
              <h3>{userTokens.length}</h3>
              <p>Your Tokens</p>
            </div>
          </div>
        </div>
        {userRoles.includes('organizer') && (
          <>
            <div className="col-md-3">
              <div className="card">
                <div className="card-body text-center">
                  <h3>{organizerEvents.length}</h3>
                  <p>My Events</p>
                </div>
              </div>
            </div>
            <div className="col-md-3">
              <div className="card">
                <div className="card-body text-center">
                  <h3>{organizerEvents.filter(e => !e.isExpired).length}</h3>
                  <p>Active Events</p>
                </div>
              </div>
            </div>
            <div className="col-md-3">
              <div className="card">
                <div className="card-body text-center">
                  <h3>{organizerEvents.reduce((sum, e) => sum + e.totalSupply, 0)}</h3>
                  <p>Tokens Minted</p>
                </div>
              </div>
            </div>
          </>
        )}
        {userRoles.includes('attendee') && (
          <>
            <div className="col-md-3">
              <div className="card">
                <div className="card-body text-center">
                  <h3>{attendeeEvents.length}</h3>
                  <p>Events Participated</p>
                </div>
              </div>
            </div>
            <div className="col-md-3">
              <div className="card">
                <div className="card-body text-center">
                  <h3>{attendeeEvents.filter(e => !e.isExpired).length}</h3>
                  <p>Active Events</p>
                </div>
              </div>
            </div>
            <div className="col-md-3">
              <div className="card">
                <div className="card-body text-center">
                  <h3>{attendeeEvents.length > 0 ? (attendeeEvents.reduce((sum, e) => sum + e.totalSupply, 0) / attendeeEvents.length).toFixed(1) : 0}</h3>
                  <p>Avg. Participation</p>
                </div>
              </div>
            </div>
          </>
        )}

        {/* Version Selection */}
        <div className="col-12">
          <div className="card">
            <div className="card-body">
              <h4>Choose Your Version</h4>
              <div className="row g-2">
                <div className="col-12 col-md-6">
                  <div className="card border-primary">
                    <div className="card-body text-center">
                      <h5 className="card-title">Integrated Version</h5>
                      <p className="card-text">
                        Backend + Smart Contracts integration with real-time data synchronization
                      </p>
                      <Link to="/events" className="btn btn-primary">
                        Go to Events (Integrated)
                      </Link>
                    </div>
                  </div>
                </div>
                <div className="col-12 col-md-6">
                  <div className="card border-secondary">
                    <div className="card-body text-center">
                      <h5 className="card-title">Smart Contract Only</h5>
                      <p className="card-text">
                        Direct smart contract interaction without backend dependency
                      </p>
                      <span className="btn btn-secondary disabled">
                        You are here
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="col-12">
          <div className="card">
            <div className="card-body">
              <h4>Smart Contract Actions</h4>
              <div className="row g-2 justify-content-around">
                <div className="col-12 col-sm-6 col-md-4 col-lg-3 col-xl-2">
                  <Link to="/mvp/events" className="btn btn-primary w-100">
                    View Events
                  </Link>
                </div>
                <div className="col-12 col-sm-6 col-md-4 col-lg-3 col-xl-2">
                  <Link to="/mvp/tokens" className="btn btn-info w-100">
                    View My Tokens
                  </Link>
                </div>
                <div className="col-12 col-sm-6 col-md-4 col-lg-3 col-xl-2">
                  <Link to="/mvp/create-event" className="btn btn-success w-100">
                    Create Event
                  </Link>
                </div>
                {userRoles.includes('organizer') && (
                  <div className="col-12 col-sm-6 col-md-4 col-lg-3 col-xl-2">
                    <Link to="/mvp/manage-minters" className="btn btn-warning w-100">
                      Manage Minters
                    </Link>
                  </div>
                )}
                <div className="col-12 col-sm-6 col-md-4 col-lg-3 col-xl-2">
                  <Link to="/mvp/mint-token" className="btn btn-warning w-100">
                    Mint Token
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Events */}
        <div className="col-12">
          <div className="card">
            <div className="card-body">
              <h4>
                {userRoles.includes('organizer') ? 'My Events' : 
                 userRoles.includes('attendee') ? 'Events I Participated In' : 
                 'Recent Events'}
              </h4>
              {(() => {
                const eventsToShow = userRoles.includes('organizer') ? organizerEvents : 
                                   userRoles.includes('attendee') ? attendeeEvents : [];
                
                if (eventsToShow.length === 0) {
                  return <p>No events found.</p>;
                }
                
                return (
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
                        </tr>
                      </thead>
                      <tbody>
                        {eventsToShow.slice(0, 5).map((event) => (
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
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                );
              })()}
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default MVP;