import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import Layout from "../layout/layout";
import { useDrawer } from "../contexts/drawer/drawer.provider";
import { mvpSmartContractService } from "../../services/mvp-smart-contract.service";

const MVPAttendee = () => {
  const { ethereum: { provider } } = useDrawer();
  const [isInitialized, setIsInitialized] = useState(false);
  const [events, setEvents] = useState([]);
  const [tokens, setTokens] = useState([]);
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
        mvpSmartContractService.getAttendeeEvents(provider.address),
        mvpSmartContractService.getUserTokensDetailed(provider.address)
      ]);
      
      setEvents(eventsData);
      setTokens(tokensData);
    } catch (error) {
      console.error("Failed to load data:", error);
    }
  };

  if (!provider) {
    return (
      <Layout activeMenu={1}>
        <div className="card">
          <div className="card-body text-center">
            <h4>Connect Your Ethereum Wallet</h4>
            <p>Please connect your Ethereum wallet to view your participation.</p>
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
            <p className="mt-2">Loading your participation data...</p>
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
              <h2>Attendee Dashboard</h2>
              <p className="text-muted">
                View your POAP tokens and event participation history.
              </p>
              <div className="row">
                <div className="col-md-4">
                  <p><strong>Connected Wallet:</strong> {provider.address}</p>
                </div>
                <div className="col-md-4">
                  <p><strong>Total Tokens:</strong> {tokens.length}</p>
                </div>
                <div className="col-md-4">
                  <p><strong>Events Participated:</strong> {events.length}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="col-md-3">
          <div className="card">
            <div className="card-body text-center">
              <h3>{tokens.length}</h3>
              <p>Total Tokens</p>
            </div>
          </div>
        </div>
        <div className="col-md-3">
          <div className="card">
            <div className="card-body text-center">
              <h3>{events.length}</h3>
              <p>Events Participated</p>
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
              <h3>{events.length > 0 ? (tokens.length / events.length).toFixed(1) : 0}</h3>
              <p>Avg. Tokens/Event</p>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="col-12">
          <div className="card">
            <div className="card-body">
              <h4>Quick Actions</h4>
              <div className="row">
                <div className="col-md-3">
                  <Link to="/mvp/events" className="btn btn-primary btn-block">
                    Browse All Events
                  </Link>
                </div>
                <div className="col-md-3">
                  <Link to="/mvp/mint-token" className="btn btn-warning btn-block">
                    Mint Token
                  </Link>
                </div>
                <div className="col-md-3">
                  <Link to="/mvp/tokens" className="btn btn-info btn-block">
                    View My Tokens
                  </Link>
                </div>
                <div className="col-md-3">
                  <button 
                    className="btn btn-secondary btn-block"
                    onClick={loadData}
                    disabled={loading}
                  >
                    {loading ? "Loading..." : "Refresh Data"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* My Tokens */}
        <div className="col-md-6">
          <div className="card">
            <div className="card-body">
              <h4>My POAP Tokens</h4>
              {tokens.length === 0 ? (
                <div className="text-center">
                  <p>You don't have any POAP tokens yet.</p>
                  <Link to="/mvp/events" className="btn btn-primary">
                    Browse Events
                  </Link>
                </div>
              ) : (
                <div className="table-responsive">
                  <table className="table table-sm">
                    <thead>
                      <tr>
                        <th>Token ID</th>
                        <th>Event ID</th>
                        <th>Max Supply</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {tokens.slice(0, 5).map((token) => (
                        <tr key={token.tokenId}>
                          <td>#{token.tokenId}</td>
                          <td>{token.eventId}</td>
                          <td>{token.maxSupply}</td>
                          <td>
                            <span className={`badge ${token.isExpired ? 'btn-danger' : 'btn-success'}`}>
                              {token.isExpired ? 'Expired' : 'Active'}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {tokens.length > 5 && (
                    <div className="text-center">
                      <Link to="/mvp/tokens" className="btn btn-sm btn-outline-primary">
                        View All Tokens ({tokens.length})
                      </Link>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Events I Participated In */}
        <div className="col-md-6">
          <div className="card">
            <div className="card-body">
              <h4>Events I Participated In</h4>
              {events.length === 0 ? (
                <div className="text-center">
                  <p>You haven't participated in any events yet.</p>
                  <Link to="/mvp/events" className="btn btn-primary">
                    Browse Events
                  </Link>
                </div>
              ) : (
                <div className="table-responsive">
                  <table className="table table-sm">
                    <thead>
                      <tr>
                        <th>Event ID</th>
                        <th>Max Supply</th>
                        <th>Total Supply</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {events.slice(0, 5).map((event) => (
                        <tr key={event.eventId}>
                          <td>{event.eventId}</td>
                          <td>{event.maxSupply}</td>
                          <td>{event.totalSupply}</td>
                          <td>
                            <span className={`badge ${event.isExpired ? 'btn-danger' : 'btn-success'}`}>
                              {event.isExpired ? 'Expired' : 'Active'}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {events.length > 5 && (
                    <div className="text-center">
                      <Link to="/mvp/events" className="btn btn-sm btn-outline-primary">
                        View All Events ({events.length})
                      </Link>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="col-12">
          <div className="card">
            <div className="card-body">
              <h4>Recent Activity</h4>
              {tokens.length === 0 ? (
                <p>No recent activity.</p>
              ) : (
                <div className="list-group">
                  {tokens.slice(0, 3).map((token) => (
                    <div key={token.tokenId} className="list-group-item">
                      <div className="d-flex w-100 justify-content-between">
                        <h6 className="mb-1">Token #{token.tokenId}</h6>
                        <small>Event {token.eventId}</small>
                      </div>
                      <p className="mb-1">
                        You received a POAP token for Event {token.eventId}
                      </p>
                      <small>
                        Max Supply: {token.maxSupply} | 
                        Status: <span className={token.isExpired ? 'text-danger' : 'text-success'}>
                          {token.isExpired ? 'Expired' : 'Active'}
                        </span>
                      </small>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default MVPAttendee;

