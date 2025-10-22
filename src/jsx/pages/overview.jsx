import React from "react";
import { Link } from "react-router-dom";
import Layout from "../layout/layout";
import { useDrawer } from "../contexts/drawer/drawer.provider";

const Overview = () => {
  const { ethereum: { provider } } = useDrawer();

  const integratedPages = [
    {
      title: "Events (Integrated)",
      description: "Backend + Smart Contracts integration with real-time data synchronization",
      path: "/events",
      features: [
        "Issuer creation via backend",
        "Event creation: Backend → Smart Contract",
        "POAP minting: Smart Contract → Backend sync",
        "Real-time data polling",
        "Comprehensive error handling"
      ],
      status: "✅ Fully Integrated"
    }
  ];

  const smartContractPages = [
    {
      title: "POAP Main",
      description: "Smart contract only approach - direct blockchain interaction",
      path: "/mvp",
      features: [
        "Direct smart contract calls",
        "No backend dependency",
        "Real-time blockchain data",
        "Role-based access control"
      ],
      status: "✅ Smart Contract Only"
    },
    {
      title: "Events (Smart Contract)",
      description: "View and manage events directly from smart contracts",
      path: "/mvp/events",
      features: [
        "All events view",
        "Organizer events",
        "Attendee participation",
        "Event details modal"
      ],
      status: "✅ Smart Contract Only"
    },
    {
      title: "My Tokens",
      description: "View your POAP tokens from smart contracts",
      path: "/mvp/tokens",
      features: [
        "User token collection",
        "Token details modal",
        "Direct blockchain queries"
      ],
      status: "✅ Smart Contract Only"
    },
    {
      title: "Create Event",
      description: "Create events directly on smart contracts",
      path: "/mvp/create-event",
      features: [
        "Direct smart contract interaction",
        "Event creation form",
        "Real-time validation"
      ],
      status: "✅ Smart Contract Only"
    },
    {
      title: "Mint Token",
      description: "Mint POAP tokens directly from smart contracts",
      path: "/mvp/mint-token",
      features: [
        "Direct token minting",
        "Event selection",
        "Transaction handling"
      ],
      status: "✅ Smart Contract Only"
    },
    {
      title: "Organizer Dashboard",
      description: "Manage events as an organizer",
      path: "/mvp/organizer",
      features: [
        "Organizer-specific events",
        "Event management",
        "Statistics dashboard"
      ],
      status: "✅ Smart Contract Only"
    },
    {
      title: "Attendee Dashboard",
      description: "View participation as an attendee",
      path: "/mvp/attendee",
      features: [
        "Participation history",
        "Token collection",
        "Event participation"
      ],
      status: "✅ Smart Contract Only"
    },
    {
      title: "Manage Minters",
      description: "Manage minter permissions for events",
      path: "/mvp/manage-minters",
      features: [
        "Minter management",
        "Permission control",
        "Event-specific settings"
      ],
      status: "✅ Smart Contract Only"
    },
    {
      title: "Bulk Distribute",
      description: "Bulk distribution of POAP tokens",
      path: "/mvp/bulk-distribute",
      features: [
        "Bulk token distribution",
        "Batch operations",
        "Efficiency tools"
      ],
      status: "✅ Smart Contract Only"
    }
  ];

  const otherPages = [
    {
      title: "Home",
      description: "Main dashboard with wallet connection status",
      path: "/",
      status: "✅ Available"
    },
    {
      title: "Wallet",
      description: "Connect and manage your wallets",
      path: "/wallet",
      status: "✅ Available"
    },
    {
      title: "Search",
      description: "Search functionality",
      path: "/search",
      status: "✅ Available"
    },
    {
      title: "Souls",
      description: "Cardano soulbound tokens",
      path: "/souls",
      status: "✅ Available"
    }
  ];

  return (
    <Layout activeMenu={1}>
      <div className="row">
        <div className="col-12">
          <div className="card">
            <div className="card-body">
              <h2>POAP System Overview</h2>
              <p className="text-muted">
                This system provides two approaches for POAP management: 
                <strong> Integrated (Backend + Smart Contracts)</strong> and 
                <strong> Smart Contract Only</strong>.
              </p>
              {provider && (
                <div className="alert alert-success">
                  <strong>Wallet Connected:</strong> {provider.address}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Integrated Pages */}
        <div className="col-12">
          <div className="card">
            <div className="card-header">
              <h4>🔗 Integrated Pages (Backend + Smart Contracts)</h4>
              <p className="text-muted mb-0">
                Pages that use both backend APIs and smart contracts for optimal functionality
              </p>
            </div>
            <div className="card-body">
              <div className="row">
                {integratedPages.map((page, index) => (
                  <div key={index} className="col-md-6 mb-3">
                    <div className="card border-primary">
                      <div className="card-body">
                        <h5 className="card-title">{page.title}</h5>
                        <p className="card-text">{page.description}</p>
                        <div className="mb-2">
                          <span className="badge badge-success">{page.status}</span>
                        </div>
                        <ul className="list-unstyled">
                          {page.features.map((feature, idx) => (
                            <li key={idx} className="text-muted small">
                              <i className="icofont-check-circled text-success"></i> {feature}
                            </li>
                          ))}
                        </ul>
                        <Link to={page.path} className="btn btn-primary">
                          Go to {page.title}
                        </Link>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Smart Contract Only Pages */}
        <div className="col-12">
          <div className="card">
            <div className="card-header">
              <h4>⚡ Smart Contract Only Pages</h4>
              <p className="text-muted mb-0">
                Pages that interact directly with smart contracts without backend dependency
              </p>
            </div>
            <div className="card-body">
              <div className="row">
                {smartContractPages.map((page, index) => (
                  <div key={index} className="col-md-4 mb-3">
                    <div className="card border-secondary">
                      <div className="card-body">
                        <h6 className="card-title">{page.title}</h6>
                        <p className="card-text small">{page.description}</p>
                        <div className="mb-2">
                          <span className="badge badge-secondary">{page.status}</span>
                        </div>
                        <ul className="list-unstyled small">
                          {page.features.slice(0, 3).map((feature, idx) => (
                            <li key={idx} className="text-muted">
                              <i className="icofont-check-circled text-success"></i> {feature}
                            </li>
                          ))}
                          {page.features.length > 3 && (
                            <li className="text-muted">
                              <i className="icofont-plus"></i> +{page.features.length - 3} more features
                            </li>
                          )}
                        </ul>
                        <Link to={page.path} className="btn btn-outline-secondary btn-sm">
                          Go to {page.title}
                        </Link>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Other Pages */}
        <div className="col-12">
          <div className="card">
            <div className="card-header">
              <h4>📄 Other Pages</h4>
              <p className="text-muted mb-0">
                Additional system pages and utilities
              </p>
            </div>
            <div className="card-body">
              <div className="row">
                {otherPages.map((page, index) => (
                  <div key={index} className="col-md-3 mb-2">
                    <div className="card">
                      <div className="card-body text-center">
                        <h6 className="card-title">{page.title}</h6>
                        <p className="card-text small">{page.description}</p>
                        <span className="badge badge-info">{page.status}</span>
                        <br />
                        <Link to={page.path} className="btn btn-outline-primary btn-sm mt-2">
                          Go to {page.title}
                        </Link>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Architecture Summary */}
        <div className="col-12">
          <div className="card">
            <div className="card-header">
              <h4>🏗️ Architecture Summary</h4>
            </div>
            <div className="card-body">
              <div className="row">
                <div className="col-md-6">
                  <h5>Integrated Approach</h5>
                  <ul>
                    <li><strong>Data Operations:</strong> Backend APIs</li>
                    <li><strong>Blockchain Operations:</strong> Smart Contracts</li>
                    <li><strong>Data Sync:</strong> Real-time polling</li>
                    <li><strong>Benefits:</strong> Fast queries, rich metadata, real-time updates</li>
                  </ul>
                </div>
                <div className="col-md-6">
                  <h5>Smart Contract Only</h5>
                  <ul>
                    <li><strong>All Operations:</strong> Direct smart contract calls</li>
                    <li><strong>Data Source:</strong> Blockchain only</li>
                    <li><strong>Benefits:</strong> No backend dependency, fully decentralized</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Overview;

