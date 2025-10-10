import React, { useState, useEffect } from "react";
import Layout from "../layout/layout";
import { useDrawer } from "../contexts/drawer/drawer.provider";
import { mvpSmartContractService } from "../../services/mvp-smart-contract.service";

const MVPTokens = () => {
  const { ethereum: { provider } } = useDrawer();
  const [tokens, setTokens] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (provider && provider.address) {
      loadTokens();
    }
  }, [provider]);

  const loadTokens = async () => {
    try {
      setLoading(true);
      const tokensData = await mvpSmartContractService.getUserTokens(provider.address);
      setTokens(tokensData);
    } catch (error) {
      console.error("Failed to load tokens:", error);
    } finally {
      setLoading(false);
    }
  };

  if (!provider) {
    return (
      <Layout activeMenu={1}>
        <div className="card">
          <div className="card-body text-center">
            <h4>Connect Your Ethereum Wallet</h4>
            <p>Please connect your Ethereum wallet to view your tokens.</p>
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
                <h4>My POAP Tokens</h4>
                <button 
                  className="btn btn-primary" 
                  onClick={loadTokens}
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
              ) : tokens.length === 0 ? (
                <div className="text-center">
                  <p>You don't have any POAP tokens yet.</p>
                  <p>Participate in events to receive tokens!</p>
                </div>
              ) : (
                <div className="row">
                  {tokens.map((token) => (
                    <div key={token.tokenId} className="col-md-4 mb-3">
                      <div className="card">
                        <div className="card-body text-center">
                          <h5>Token #{token.tokenId}</h5>
                          <p className="text-muted">Event ID: {token.eventId}</p>
                          <button 
                            className="btn btn-sm btn-info"
                            onClick={() => {
                              // View token details
                              console.log("View token details:", token.tokenId);
                            }}
                          >
                            View Details
                          </button>
                        </div>
                      </div>
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

export default MVPTokens;