import React from "react";
import { Link } from "react-router-dom";
import Layout from "../layout/layout";
import { useDrawer, useDrawerDispatch } from "../contexts/drawer/drawer.provider";

const pages = [
  { title: "My Events", description: "Browse and create POAP events", path: "/my-events" },
  { title: "My Subscriptions", description: "Claim POAPs and view your token collection", path: "/my-subscriptions" },
];

const Overview = () => {
  const { midnight: { provider } } = useDrawer();
  const dispatch = useDrawerDispatch();

  const showMidnightWallet = () => {
    dispatch({ type: "SHOW_MIDNIGHT_WALLET" });
  };

  return (
    <Layout activeMenu={1}>
      <div className="row">
        <div className="col-12">
          <div className="card">
            <div className="card-body">
              <h2>AdaSouls on Midnight</h2>
              <p className="text-muted">
                AdaSouls issues privacy-preserving POAPs on the Midnight network. A single Compact
                smart contract mints a token per event you claim: the public ledger records that a
                valid POAP exists, while your wallet identity is derived locally and never shared
                directly with an organizer.
              </p>
              {provider ? (
                <div className="alert alert-success">
                  <strong>Wallet Connected:</strong> {provider.address}
                </div>
              ) : (
                <div className="alert alert-warning d-flex justify-content-between align-items-center">
                  <span>Connect your Lace wallet to get started.</span>
                  <button type="button" className="btn btn-gradient btn-sm" onClick={showMidnightWallet}>
                    Connect Wallet
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="col-12">
          <div className="card">
            <div className="card-body">
              <h4 className="mb-4">How it works</h4>
              <div className="row">
                <div className="col-md-4 mb-3 how-it-works-step">
                  <div className="step-number">1</div>
                  <h5>Connect your wallet</h5>
                  <p className="text-muted small">
                    Link your Lace wallet — your identity on Midnight, derived locally, never
                    shared.
                  </p>
                </div>
                <div className="col-md-4 mb-3 how-it-works-step">
                  <div className="step-number">2</div>
                  <h5>Browse events</h5>
                  <p className="text-muted small">
                    Explore events published on-chain by registered organizers.
                  </p>
                </div>
                <div className="col-md-4 mb-3 how-it-works-step">
                  <div className="step-number">3</div>
                  <h5>Claim your POAP</h5>
                  <p className="text-muted small">
                    Mint a fresh token for that event — one claim per event, and any token an
                    organizer sends you directly shows up here too, automatically.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="col-12">
          <div className="card">
            <div className="card-header">
              <h4>Pages</h4>
            </div>
            <div className="card-body">
              <div className="row">
                {pages.map((page) => (
                  <div key={page.path} className="col-md-4 mb-3">
                    <div className="card">
                      <div className="card-body">
                        <h5 className="card-title">{page.title}</h5>
                        <p className="card-text small">{page.description}</p>
                        <Link to={page.path} className="btn btn-outline-primary btn-sm">
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
      </div>
    </Layout>
  );
};

export default Overview;
