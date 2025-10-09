import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import Layout from "../layout/layout";
import { useDrawer } from "../contexts/drawer/drawer.provider";
import { mvpSmartContractService } from "../../services/mvp-smart-contract.service";

const MVP = () => {
  const { ethereum: { provider } } = useDrawer();
  const [isInitialized, setIsInitialized] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [events, setEvents] = useState([]);
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
      
      // Check if user is admin
      const adminStatus = await mvpSmartContractService.isAdmin(provider.address);
      setIsAdmin(adminStatus);
      
      // Load data
      await loadData();
    } catch (error) {
      console.error("Failed to initialize service:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadData = async () => {
    try {
      const [eventsData, tokensData] = await Promise.all([
        mvpSmartContractService.getAllEvents(),
        mvpSmartContractService.getUserTokens(provider.address),
      ]);
      
      setEvents(eventsData);
      setUserTokens(tokensData);
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
                <div className="col-md-6">
                  <p><strong>Connected Wallet:</strong> {provider.address}</p>
                </div>
                <div className="col-md-6">
                  <p><strong>Admin Status:</strong> {isAdmin ? "Yes" : "No"}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="col-md-4">
          <div className="card">
            <div className="card-body text-center">
              <h3>{events.length}</h3>
              <p>Total Events</p>
            </div>
          </div>
        </div>
        <div className="col-md-4">
          <div className="card">
            <div className="card-body text-center">
              <h3>{userTokens.length}</h3>
              <p>Your Tokens</p>
            </div>
          </div>
        </div>
        <div className="col-md-4">
          <div className="card">
            <div className="card-body text-center">
              <h3>{events.filter(e => !e.isExpired).length}</h3>
              <p>Active Events</p>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="col-12">
          <div className="card">
            <div className="card-body">
              <h4>Actions</h4>
              <div className="row">
                <div className="col-md-3">
                  <Link to="/mvp/events" className="btn btn-primary btn-block">
                    View All Events
                  </Link>
                </div>
                <div className="col-md-3">
                  <Link to="/mvp/tokens" className="btn btn-info btn-block">
                    View My Tokens
                  </Link>
                </div>
                {!isAdmin && (
                  <>
                    <div className="col-md-3">
                      <Link to="/mvp/create-event" className="btn btn-success btn-block">
                        Create Event
                      </Link>
                    </div>
                    <div className="col-md-3">
                      <Link to="/mvp/mint-token" className="btn btn-warning btn-block">
                        Mint Token
                      </Link>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Recent Events */}
        <div className="col-12">
          <div className="card">
            <div className="card-body">
              <h4>Recent Events</h4>
              {events.length === 0 ? (
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
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {events.slice(0, 5).map((event) => (
                        <tr key={event.eventId}>
                          <td>{event.eventId}</td>
                          <td>{event.issuerId}</td>
                          <td>{event.maxSupply}</td>
                          <td>{event.totalSupply}</td>
                          <td>{event.available}</td>
                          <td>
                            <span className={`badge ${event.isExpired ? 'badge-danger' : 'badge-success'}`}>
                              {event.isExpired ? 'Expired' : 'Active'}
                            </span>
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

export default MVP;