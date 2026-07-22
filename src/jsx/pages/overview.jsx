import React from "react";
import { Link } from "react-router-dom";
import Layout from "../layout/layout";
import { useDrawer } from "../contexts/drawer/drawer.provider";

const pages = [
  { title: "Events", description: "Browse and create POAP events", path: "/events" },
  { title: "My POAPs", description: "Claim SPOAPs and view your token collection", path: "/poap-management" },
  { title: "Wallet", description: "Connect your Lace wallet", path: "/wallet" },
];

const Overview = () => {
  const { midnight: { provider } } = useDrawer();

  return (
    <Layout activeMenu={1}>
      <div className="row">
        <div className="col-12">
          <div className="card">
            <div className="card-body">
              <h2>AdaSouls on Midnight</h2>
              <p className="text-muted">
                AdaSouls issues privacy-preserving POAPs (SPOAPs) on the Midnight network. A single
                Compact smart contract tracks event attendance: the public ledger records that a
                valid SPOAP exists, while each wallet's attendance history stays in its own private
                state.
              </p>
              {provider ? (
                <div className="alert alert-success">
                  <strong>Wallet Connected:</strong> {provider.address}
                </div>
              ) : (
                <div className="alert alert-warning">
                  Connect your Lace wallet from the Wallet page to get started.
                </div>
              )}
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
