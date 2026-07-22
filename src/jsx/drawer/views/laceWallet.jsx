import { useState } from "react";
import {
  useDrawer,
  useDrawerDispatch,
} from "../../contexts/drawer/drawer.provider";
import { connectedToWalletFunction, errorFunction } from "../../toasts/sweetAlerts";

export default function LaceWallet() {
  const { midnight } = useDrawer();
  const dispatch = useDrawerDispatch();
  const [localError, setLocalError] = useState(null);

  const closeDrawer = () => {
    dispatch({
      type: "CLOSE_DRAWER",
    });
  };

  const onConnect = async () => {
    setLocalError(null);
    try {
      const newProviderState = await midnight.connect();
      dispatch({ type: "UPDATE_MIDNIGHT_WALLET", payload: newProviderState });
      connectedToWalletFunction(newProviderState.address);
      closeDrawer();
    } catch (err) {
      setLocalError(err);
      errorFunction("Wallet connection failed", err?.message ?? "Could not connect to Lace.", "");
    }
  };

  const onDisconnect = () => {
    midnight.disconnect();
    dispatch({ type: "UPDATE_MIDNIGHT_WALLET", payload: null });
    closeDrawer();
  };

  const isConnected = Boolean(midnight?.provider);
  const errorToShow = localError ?? midnight?.error;

  return (
    <div className="d-flex flex-column w-100 h-100 p-3">
      <div className="drawer-header">
        <div className="d-flex justify-content-start">
          <button
            className="btn btn-close align-content-center px-1 mt-2 position-absolute"
            onClick={closeDrawer}
            aria-label="close"
          ></button>
          <h4 className="align-content-center text-center w-100 m-0 py-3 font-weight-semibold">
            Connect Wallet
          </h4>
        </div>
      </div>
      <div className="drawer-body">
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div className={"card card-button" + (isConnected ? " connected" : "")}>
            <div className="card-body top-area d-flex">
              <div className="d-flex align-items-center">
                <div className="media-body">
                  <h4 className="mb-0">Lace</h4>
                  <p className="mb-0 text-muted">Midnight Network wallet</p>
                </div>
              </div>
            </div>
            <div className="bottom-area border-top align-content-center">
              <div className="card-body d-flex justify-content-between">
                <div className="align-content-center wallet-status">
                  {isConnected && (
                    <>
                      <span className="verified">
                        <i className="icofont-check-alt"></i>
                      </span>
                      Connected — {midnight.provider.address.slice(0, 10)}…
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>

          {errorToShow && (
            <div className="alert alert-danger mt-3" role="alert">
              {errorToShow.message === "LaceNotFoundError" || errorToShow.name === "LaceNotFoundError"
                ? "Lace wallet extension not found. Install it and reload the page."
                : errorToShow.name === "LaceVersionMismatchError"
                  ? errorToShow.message
                  : errorToShow.name === "LaceNotAuthorizedError"
                    ? "AdaSouls is not authorized by your Lace wallet. Approve the connection request in the extension."
                    : errorToShow.message ?? "Something went wrong connecting to Lace."}
            </div>
          )}
        </div>
      </div>
      <div className="drawer-footer d-flex flex-column">
        {isConnected ? (
          <button className="btn btn-danger" onClick={onDisconnect}>
            Disconnect
          </button>
        ) : (
          <button className="btn btn-gradient" onClick={onConnect} disabled={midnight?.connecting}>
            {midnight?.connecting ? "Connecting…" : "Connect Lace"}
          </button>
        )}
      </div>
    </div>
  );
}
