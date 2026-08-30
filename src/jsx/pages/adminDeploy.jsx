import React, { useEffect, useState } from "react";
import Layout from "../layout/layout";
import loadingGif from "../../images/loading.gif";
import {
  discoverCompatibleWallets,
  connectToWalletForNetwork,
  getWalletDisplayName,
} from "../../midnight/providers";
import { isAdminWallet, deployPoapContract } from "../../midnight/admin-deploy.service";

const truncate = (value, head = 10, tail = 6) =>
  value ? `${value.slice(0, head)}…${value.slice(-tail)}` : "";

// Known Midnight network names as of 2026-08-29 (docs.midnight.network/guides/networks-and-environments).
// Free-text too, since this list can go stale as networks are added/retired — the value only has to
// match whatever network Lace itself is actually configured for right now.
const KNOWN_NETWORKS = ["undeployed", "preview", "preprod", "mainnet"];

// Admin-only contract deployment. Not linked from any nav menu — reachable only by typing the URL
// (same convention as /organizer-dashboard in router.jsx). Gated on REACT_APP_ADMIN_WALLET_ADDRESSES
// via isAdminWallet(), not on the app's normal isAdmin (that one reads a contract's own adminPk,
// which doesn't exist yet for a brand-new deployment). Uses its own independent wallet connection
// rather than the app-wide DrawerContext one, since that one requires an existing
// REACT_APP_MIDNIGHT_CONTRACT_ADDRESS to already be set.
const AdminDeploy = () => {
  const [detecting, setDetecting] = useState(true);
  const [wallets, setWallets] = useState([]);
  const [selectedRdns, setSelectedRdns] = useState(null);
  // Must match whatever network Lace is actually set to right now — Lace's connect() rejects the
  // request outright (LaceNotAuthorizedError) on a mismatch, it doesn't just warn. Defaults to this
  // build's own configured network as a starting guess, but the admin can change it — deploying to
  // preprod from a build whose REACT_APP_MIDNIGHT_NETWORK_ID is still 'undeployed' is exactly what
  // this page is for.
  const [targetNetwork, setTargetNetwork] = useState(
    process.env.REACT_APP_MIDNIGHT_NETWORK_ID || "undeployed"
  );
  const [connecting, setConnecting] = useState(false);
  const [connection, setConnection] = useState(null);
  const [error, setError] = useState(null);
  const [deploying, setDeploying] = useState(false);
  const [confirmArmed, setConfirmArmed] = useState(false);
  const [result, setResult] = useState(null);

  useEffect(() => {
    let cancelled = false;
    discoverCompatibleWallets().then((found) => {
      if (cancelled) return;
      setWallets(found);
      setSelectedRdns(found[0]?.rdns ?? null);
      setDetecting(false);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const selectedWallet = wallets.find((wallet) => wallet.rdns === selectedRdns) ?? null;

  const onConnect = async () => {
    if (!selectedWallet) return;
    setError(null);
    setConnecting(true);
    try {
      const conn = await connectToWalletForNetwork(selectedWallet, targetNetwork);
      const config = await conn.connectedApi.getConfiguration();
      setConnection({
        api: selectedWallet,
        shieldedAddress: conn.shieldedAddress.shieldedAddress,
        networkId: config.networkId,
      });
    } catch (err) {
      setError(err);
    } finally {
      setConnecting(false);
    }
  };

  const onDisconnect = () => {
    setConnection(null);
    setResult(null);
    setConfirmArmed(false);
    setError(null);
  };

  const authorized = connection ? isAdminWallet(connection.shieldedAddress) : false;

  const onDeployClick = async () => {
    if (!confirmArmed) {
      setConfirmArmed(true);
      return;
    }
    setError(null);
    setDeploying(true);
    try {
      const deployResult = await deployPoapContract(connection.api, connection.networkId);
      setResult(deployResult);
    } catch (err) {
      setError(err);
    } finally {
      setDeploying(false);
      setConfirmArmed(false);
    }
  };

  return (
    <Layout>
      <div className="row">
        <div className="col-12">
          <h3 className="mb-3">Deploy POAP contract</h3>
          <p className="text-muted">
            Admin-only. Deploys a brand-new contract to whichever network your connected wallet is
            on right now, using that wallet to pay the fee and sign the transaction.
          </p>

          {!connection && (
            <div className="card">
              <div className="card-body">
                {detecting ? (
                  <div className="d-flex align-items-center">
                    <img src={loadingGif} width="16" height="16" alt="" className="mr-2" />
                    Detecting wallets…
                  </div>
                ) : wallets.length === 0 ? (
                  <div className="alert alert-warning mb-0">
                    No compatible Midnight wallet found. Install Lace or 1am Wallet and reload.
                  </div>
                ) : (
                  <>
                    <div className="mb-3">
                      {wallets.map((wallet) => (
                        <button
                          key={wallet.rdns}
                          type="button"
                          className={
                            "btn btn-outline-primary mr-2" +
                            (wallet.rdns === selectedRdns ? " active" : "")
                          }
                          onClick={() => setSelectedRdns(wallet.rdns)}
                        >
                          {getWalletDisplayName(wallet)}
                        </button>
                      ))}
                    </div>
                    <div className="form-group mb-3" style={{ maxWidth: 320 }}>
                      <label htmlFor="admin-deploy-network" className="mb-1">
                        Network (must match what your wallet is set to)
                      </label>
                      <input
                        id="admin-deploy-network"
                        className="form-control"
                        list="admin-deploy-known-networks"
                        value={targetNetwork}
                        onChange={(event) => setTargetNetwork(event.target.value)}
                        placeholder="e.g. preprod"
                      />
                      <datalist id="admin-deploy-known-networks">
                        {KNOWN_NETWORKS.map((network) => (
                          <option key={network} value={network} />
                        ))}
                      </datalist>
                    </div>
                    <button
                      className="btn btn-gradient"
                      onClick={onConnect}
                      disabled={connecting || !selectedWallet || !targetNetwork}
                    >
                      {connecting
                        ? "Connecting…"
                        : `Connect ${selectedWallet ? getWalletDisplayName(selectedWallet) : ""} on ${targetNetwork}`}
                    </button>
                  </>
                )}
              </div>
            </div>
          )}

          {connection && !authorized && (
            <div className="alert alert-danger">
              <strong>Not authorized.</strong> The connected wallet is not in{" "}
              <code>REACT_APP_ADMIN_WALLET_ADDRESSES</code>. Add its full address below to grant
              access, then rebuild/restart the app.
              <div className="mt-2">
                <code style={{ wordBreak: "break-all" }}>{connection.shieldedAddress}</code>
              </div>
              <button className="btn btn-link p-0 mt-2" onClick={onDisconnect}>
                Disconnect
              </button>
            </div>
          )}

          {connection && authorized && (
            <div className="card">
              <div className="card-body">
                <p className="mb-1">
                  <strong>Connected:</strong> {getWalletDisplayName(connection.api)} —{" "}
                  {truncate(connection.shieldedAddress)}
                </p>
                <p className="mb-3">
                  <strong>Network:</strong> {connection.networkId}
                </p>

                {!result ? (
                  <>
                    <button
                      className={"btn " + (confirmArmed ? "btn-danger" : "btn-gradient")}
                      onClick={onDeployClick}
                      disabled={deploying}
                    >
                      {deploying
                        ? "Deploying…"
                        : confirmArmed
                          ? `Confirm: deploy to ${connection.networkId}`
                          : "Deploy contract"}
                    </button>
                    {confirmArmed && !deploying && (
                      <button className="btn btn-link" onClick={() => setConfirmArmed(false)}>
                        Cancel
                      </button>
                    )}
                  </>
                ) : (
                  <div className="alert alert-success mb-0">
                    <p className="mb-1">
                      <strong>Deployed.</strong>
                    </p>
                    <p className="mb-1">
                      Contract address:{" "}
                      <code style={{ wordBreak: "break-all" }}>{result.contractAddress}</code>
                    </p>
                    <p className="mb-1">
                      Deploy tx:{" "}
                      <code style={{ wordBreak: "break-all" }}>{result.deployTxHash}</code>
                    </p>
                    <p className="mb-0">Network: {result.networkId}</p>
                    <p className="mt-2 mb-0 text-muted">
                      Set REACT_APP_MIDNIGHT_CONTRACT_ADDRESS to this address and
                      REACT_APP_MIDNIGHT_NETWORK_ID to "{result.networkId}" in .env, then
                      rebuild/restart the app.
                    </p>
                  </div>
                )}

                <div>
                  <button className="btn btn-link mt-2 p-0" onClick={onDisconnect}>
                    Disconnect
                  </button>
                </div>
              </div>
            </div>
          )}

          {error && (
            <div className="alert alert-danger mt-3">
              {error.message || "Something went wrong."}
              {error.name === "LaceNotAuthorizedError" && (
                <div className="mt-1">
                  This usually means the network above ("{targetNetwork}") doesn't match what your
                  wallet extension is currently set to. Switch the wallet to that network (or change
                  the field above to match the wallet) and try again.
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default AdminDeploy;
