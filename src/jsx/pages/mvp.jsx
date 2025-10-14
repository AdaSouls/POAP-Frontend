import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import Layout from "../layout/layout";
import { useDrawer } from "../contexts/drawer/drawer.provider";
import { mvpSmartContractService } from "../../services/mvp-smart-contract.service";

const MVP = () => {
  const { ethereum: { provider } } = useDrawer();
  const [isInitialized, setIsInitialized] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isIssuer, setIsIssuer] = useState(false);
  const [issuerId, setIssuerId] = useState(null);
  const [userRole, setUserRole] = useState('attendee'); // 'organizer', 'attendee', 'admin'
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
      await mvpSmartContractService.initialize(provider);
      setIsInitialized(true);
      
      // Check user roles
      const [adminStatus, issuerInfo] = await Promise.all([
        mvpSmartContractService.isAdmin(provider.address),
        mvpSmartContractService.isIssuer(provider.address)
      ]);
      
      setIsAdmin(adminStatus);
      setIsIssuer(issuerInfo.isIssuer);
      setIssuerId(issuerInfo.issuerId);
      
      // Determine user role
      if (adminStatus) {
        setUserRole('admin');
      } else if (issuerInfo.isIssuer) {
        setUserRole('organizer');
      } else {
        setUserRole('attendee');
      }
      
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
      const [tokensData, organizerEventsData, attendeeEventsData] = await Promise.all([
        mvpSmartContractService.getUserTokens(provider.address),
        userRole === 'organizer' ? mvpSmartContractService.getOrganizerEvents(provider.address) : Promise.resolve([]),
        mvpSmartContractService.getAttendeeEvents(provider.address)
      ]);
      
      setUserTokens(tokensData);
      setOrganizerEvents(organizerEventsData);
      setAttendeeEvents(attendeeEventsData);
    } catch (error) {
      console.error("Failed to load data:", error);
    }
  };

  if (!provider) {
    return (
      <Layout activeMenu={1}>
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

  if (loading) {
    return (
      <Layout activeMenu={1}>
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
    <Layout activeMenu={1}>
      <div className="row">
        {/* Header */}
        <div className="col-12">
          <div className="card">
            <div className="card-body">
              <h2>POAP MVP - Smart Contract Only</h2>
              <p className="text-muted">
                This is a minimal viable product that uses only smart contracts, 
                bypassing the backend API completely.
              </p>
              <div className="row">
                <div className="col-md-4">
                  <p><strong>Connected Wallet:</strong> {provider.address}</p>
                </div>
                <div className="col-md-4">
                  <p><strong>Role:</strong> 
                    <span className={`badge ${userRole === 'admin' ? 'btn-danger' : userRole === 'organizer' ? 'btn-success' : 'btn-info'} ml-2`}>
                      {userRole.charAt(0).toUpperCase() + userRole.slice(1)}
                    </span>
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
        {userRole === 'organizer' && (
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
        {userRole === 'attendee' && (
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

        {/* Actions */}
        <div className="col-12">
          <div className="card">
            <div className="card-body">
              <h4>Actions</h4>
              <div className="row row-gap">
                <div className="col-md-3">
                  <Link to="/mvp/events" className="btn btn-primary btn-block">
                    View Events
                  </Link>
                </div>
                <div className="col-md-3">
                  <Link to="/mvp/tokens" className="btn btn-info btn-block">
                    View My Tokens
                  </Link>
                </div>
                
                {userRole === 'organizer' && (
                  <>
                    <div className="col-md-3">
                      <Link to="/mvp/manage-minters" className="btn btn-warning btn-block">
                        Manage Minters
                      </Link>
                    </div>
                    <div className="col-md-3">
                      <Link to="/mvp/create-event" className="btn btn-success btn-block">
                        Create Event
                      </Link>
                    </div>
                    {/* <div className="col-md-3">
                      <Link to="/mvp/bulk-distribute" className="btn btn-secondary btn-block">
                        Bulk Distribute
                      </Link>
                    </div> */}
                  </>
                )}
                
                {userRole === 'attendee' && (
                  <div className="col-md-3">
                    <Link to="/mvp/mint-token" className="btn btn-warning btn-block">
                      Mint Token
                    </Link>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Recent Events */}
        <div className="col-12">
          <div className="card">
            <div className="card-body">
              <h4>
                {userRole === 'organizer' ? 'My Events' : 
                 userRole === 'attendee' ? 'Events I Participated In' : 
                 'Recent Events'}
              </h4>
              {(() => {
                const eventsToShow = userRole === 'organizer' ? organizerEvents : 
                                   userRole === 'attendee' ? attendeeEvents : [];
                
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