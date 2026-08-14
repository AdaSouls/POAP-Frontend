import { useEffect, useRef, useState } from "react";
import { X, Check } from "lucide-react";
import {
  useDrawer,
  useDrawerDispatch,
} from "../../contexts/drawer/drawer.provider";
import { discoverCompatibleWallets, getWalletDisplayName, LaceNotFoundError } from "../../../midnight/providers";
import loadingGif from "../../../images/loading.gif";

// How long the button shows the green-fill "Connected" state before flipping to the actual
// Disconnect button — the card's own reveal (bottom "Connected — 0x…" row + white border) is
// timed to happen at that same flip, not at the moment the fill starts, per explicit design.
const SUCCESS_ANIMATION_MS = 2400;

export default function LaceWallet() {
  const { midnight } = useDrawer();
  const dispatch = useDrawerDispatch();
  const [localError, setLocalError] = useState(null);

  // 'idle' -> 'connecting' -> 'success' (green fill, button still says Connected) -> 'connected'
  // (real Disconnect button + card reveal, synchronized). Initialized from the live provider so
  // reopening the drawer while already connected lands straight on 'connected', no replay.
  const [phase, setPhase] = useState(() => (midnight?.provider ? "connected" : "idle"));
  const wasConnectedRef = useRef(Boolean(midnight?.provider));

  // Wallet discovery — scans window.midnight for every installed Midnight-compatible wallet
  // (currently Lace and 1am) so the user can pick which one to connect to, instead of always
  // silently connecting to whichever happened to be first in a fixed list. Skipped entirely if
  // this drawer opens while already connected — nothing to pick at that point.
  const [detecting, setDetecting] = useState(() => !wasConnectedRef.current);
  const [wallets, setWallets] = useState([]);
  const [selectedRdns, setSelectedRdns] = useState(null);

  useEffect(() => {
    if (wasConnectedRef.current) return undefined;
    let cancelled = false;
    discoverCompatibleWallets().then((found) => {
      if (cancelled) return;
      setWallets(found);
      setSelectedRdns(found[0]?.rdns ?? null);
      if (found.length === 0) setLocalError(new LaceNotFoundError());
      setDetecting(false);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const nowConnected = Boolean(midnight?.provider);
    if (nowConnected && !wasConnectedRef.current) {
      wasConnectedRef.current = true;
      setPhase("success");
      const timer = setTimeout(() => setPhase("connected"), SUCCESS_ANIMATION_MS);
      return () => clearTimeout(timer);
    }
    if (!nowConnected && wasConnectedRef.current) {
      wasConnectedRef.current = false;
      setPhase("idle");
    }
  }, [midnight?.provider]);

  const closeDrawer = () => {
    dispatch({
      type: "CLOSE_DRAWER",
    });
  };

  const selectedWallet = wallets.find((wallet) => wallet.rdns === selectedRdns) ?? null;

  const onConnect = async () => {
    if (!selectedWallet) return;
    setLocalError(null);
    try {
      const newProviderState = await midnight.connect(selectedWallet);
      dispatch({ type: "UPDATE_MIDNIGHT_WALLET", payload: newProviderState });
      // Drawer stays open on purpose — the success/connected animation below is the point.
    } catch (err) {
      setLocalError(err);
    }
  };

  const onDisconnect = () => {
    midnight.disconnect();
    dispatch({ type: "UPDATE_MIDNIGHT_WALLET", payload: null });
    closeDrawer();
  };

  const errorToShow = localError ?? midnight?.error;
  // Card reveal (bottom "Connected — 0x…" row, white border, matching divider line) fires the
  // moment the button first says "Connected" (phase "success"), not delayed until it later flips
  // to the actual Disconnect button (phase "connected") — both phases share this same look, only
  // the button itself differs between them.
  const isRevealed = phase === "success" || phase === "connected";

  return (
    <div className="d-flex flex-column w-100 drawer-modal-inner">
      <div className="drawer-header">
        <button
          className="btn wallet-modal-close"
          onClick={closeDrawer}
          aria-label="close"
        >
          <X size={15} />
        </button>
        <h4 className="text-center w-100 m-0 font-weight-semibold">
          Connect Wallet
        </h4>
      </div>
      <div className="drawer-body">
        <div style={{ display: "flex", flexDirection: "column" }}>
          {isRevealed ? (
            <div
              className={
                "card card-button" +
                (midnight?.connecting ? " connecting" : "") +
                " connected"
              }
            >
              <div className="card-body top-area d-flex align-items-center justify-content-between">
                <div className="d-flex align-items-center">
                  <div className="media-body">
                    <h4 className="mb-0">{midnight?.provider?.wallet || "Wallet"}</h4>
                    <p className="mb-0 text-muted">Midnight Network wallet</p>
                  </div>
                </div>
                {midnight?.connecting && <img src={loadingGif} width="18" height="18" alt="" />}
              </div>
              <div className="bottom-area border-top align-content-center">
                <div className="card-body d-flex justify-content-between">
                  <div className="align-content-center wallet-status">
                    {midnight?.provider && (
                      <>
                        <span className="verified">
                          <Check size={14} />
                        </span>
                        Connected — {midnight.provider.address.slice(0, 10)}…
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ) : detecting ? (
            <div className="wallet-picker-detecting d-flex align-items-center justify-content-center">
              <img src={loadingGif} width="16" height="16" alt="" className="mr-2" />
              Detecting wallets…
            </div>
          ) : (
            wallets.length > 0 && (
              <div className="wallet-picker-list">
                {wallets.map((wallet) => (
                  <button
                    key={wallet.rdns}
                    type="button"
                    className={
                      "card card-button wallet-picker-option" +
                      (wallet.rdns === selectedRdns ? " is-selected" : "")
                    }
                    onClick={() => setSelectedRdns(wallet.rdns)}
                    aria-pressed={wallet.rdns === selectedRdns}
                  >
                    <div className="card-body top-area d-flex align-items-center justify-content-between">
                      <div className="d-flex align-items-center">
                        <div className="media-body">
                          <h4 className="mb-0">{getWalletDisplayName(wallet)}</h4>
                          <p className="mb-0 text-muted">Midnight Network wallet</p>
                        </div>
                      </div>
                      <span className="wallet-picker-radio" aria-hidden="true" />
                    </div>
                  </button>
                ))}
              </div>
            )
          )}

          {errorToShow && (
            <div className="alert alert-danger mt-3" role="alert">
              {errorToShow.message === "LaceNotFoundError" || errorToShow.name === "LaceNotFoundError"
                ? "No compatible Midnight wallet found. Install Lace or 1am Wallet and reload the page."
                : errorToShow.name === "LaceVersionMismatchError"
                  ? errorToShow.message
                  : errorToShow.name === "LaceNotAuthorizedError"
                    ? `AdaSouls is not authorized by your ${selectedWallet ? getWalletDisplayName(selectedWallet) : "Midnight"} wallet. Approve the connection request in the extension.`
                    : errorToShow.name === "LaceLockedError"
                      ? `Your ${selectedWallet ? getWalletDisplayName(selectedWallet) : "Midnight"} wallet is locked. Open the extension icon, unlock it with your password, then try connecting again.`
                      : errorToShow.name === "ConnectTimeoutError"
                        ? errorToShow.message
                        : errorToShow.message ?? "Something went wrong connecting to your wallet."}
            </div>
          )}
        </div>
      </div>
      <div className="drawer-footer d-flex flex-column">
        {isRevealed ? (
          // One continuous button across "success" -> "connected" (not two swapped elements) so
          // the green-to-red handoff is an actual color transition instead of an instant swap.
          <button
            className={
              "btn wallet-connect-btn wallet-connect-btn-success" +
              (phase === "connected" ? " wallet-connect-btn-disconnect" : "")
            }
            onClick={phase === "connected" ? onDisconnect : undefined}
            disabled={phase === "success"}
          >
            <span className="wallet-connect-btn-fill" aria-hidden="true" />
            <span className="wallet-connect-btn-label">{phase === "connected" ? "Disconnect" : "Connected"}</span>
          </button>
        ) : (
          <button
            className="btn btn-gradient"
            onClick={onConnect}
            disabled={midnight?.connecting || detecting || !selectedWallet}
          >
            {midnight?.connecting ? (
              <span className="d-flex align-items-center justify-content-center">
                <img src={loadingGif} width="16" height="16" alt="" className="mr-2" />
                Connecting
              </span>
            ) : selectedWallet ? (
              `Connect ${getWalletDisplayName(selectedWallet)}`
            ) : (
              "Connect"
            )}
          </button>
        )}
      </div>
    </div>
  );
}
