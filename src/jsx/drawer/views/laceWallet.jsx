import { useEffect, useRef, useState } from "react";
import { X, Check, ShieldCheck, ShieldAlert } from "lucide-react";
import {
  useDrawer,
  useDrawerDispatch,
} from "../../contexts/drawer/drawer.provider";
import { discoverCompatibleWallets, getWalletDisplayName, LaceNotFoundError } from "../../../midnight/providers";
import { cancelPasswordRequest, subscribePasswordRequest } from "../../../midnight/storage-password";
import loadingGif from "../../../images/loading.gif";
import IdentityStep from "../../components/IdentityStep";
import { useRecoveryCodeSaved } from "../../hooks/useRecoveryCodeSaved";

// How long the button shows the green-fill "Connected" state before flipping to the actual
// Disconnect button — the card's own reveal (bottom "Connected — 0x…" row + white border) is
// timed to happen at that same flip, not at the moment the fill starts, per explicit design.
const SUCCESS_ANIMATION_MS = 2400;
const UNLOCK_RETRY_INTERVAL_MS = 2000;
const UNLOCK_WAIT_MAX_MS = 180_000;

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

  // Set while the selected wallet is locked: no page can open a wallet extension's own popup (by
  // design), so instead of making the user unlock it and click Connect again, keep retrying in the
  // background until the unlock lands, the user cancels, or UNLOCK_WAIT_MAX_MS runs out.
  const [waitingUnlock, setWaitingUnlock] = useState(false);

  // Set while connect() waits on the identity step (new browser / missing key — private-state-unlock.ts).
  const [passwordRequest, setPasswordRequest] = useState(null);
  useEffect(() => subscribePasswordRequest(setPasswordRequest), []);

  const attemptConnect = async () => {
    const newProviderState = await midnight.connect(selectedWallet);
    dispatch({ type: "UPDATE_MIDNIGHT_WALLET", payload: newProviderState });
    // Drawer stays open on purpose — the success/connected animation below is the point.
  };

  const onConnect = async () => {
    if (!selectedWallet) return;
    setLocalError(null);
    try {
      await attemptConnect();
    } catch (err) {
      if (err?.name === "LaceLockedError") setWaitingUnlock(true);
      else if (err?.name !== "PasswordRequestCancelledError") setLocalError(err);
    }
  };

  useEffect(() => {
    if (!waitingUnlock) return undefined;
    let cancelled = false;
    const started = Date.now();
    (async () => {
      while (!cancelled) {
        await new Promise((resolve) => setTimeout(resolve, UNLOCK_RETRY_INTERVAL_MS));
        if (cancelled) return;
        try {
          await attemptConnect();
          if (!cancelled) setWaitingUnlock(false);
          return;
        } catch (err) {
          if (cancelled) return;
          if (err?.name !== "LaceLockedError" || Date.now() - started > UNLOCK_WAIT_MAX_MS) {
            setWaitingUnlock(false);
            if (err?.name !== "PasswordRequestCancelledError") setLocalError(err);
            return;
          }
        }
      }
    })();
    return () => {
      cancelled = true;
    };
    // Retry loop is keyed only on entering/leaving the waiting state; attemptConnect closes over
    // the wallet that was selected when it started, which is the one the user is unlocking.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [waitingUnlock]);

  const onDisconnect = () => {
    midnight.disconnect();
    dispatch({ type: "UPDATE_MIDNIGHT_WALLET", payload: null });
    closeDrawer();
  };

  const codeSaved = useRecoveryCodeSaved(midnight?.provider?.service?.walletCoinPublicKey);

  const openBackup = () => {
    dispatch({ type: "SHOW_BACKUP" });
  };

  const errorToShow = waitingUnlock || passwordRequest ? null : localError ?? midnight?.error;
  const selectedWalletName = selectedWallet ? getWalletDisplayName(selectedWallet) : "Midnight";
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
          {passwordRequest && !isRevealed ? (
            <IdentityStep request={passwordRequest} />
          ) : isRevealed ? (
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

          {phase === "connected" && (
            codeSaved === false ? (
              <button type="button" className="btn btn-card-detail-action btn-sm mt-3 align-self-start is-attention" onClick={openBackup}>
                <ShieldAlert size={14} className="mr-2" />
                Save your recovery code
              </button>
            ) : (
              <button type="button" className="btn btn-card-detail-action btn-sm mt-3 align-self-start" onClick={openBackup}>
                <ShieldCheck size={14} className="mr-2" />
                Backup &amp; Restore
              </button>
            )
          )}

          {waitingUnlock && (
            <div className="alert alert-info mt-3 d-flex align-items-center" role="status">
              <img src={loadingGif} width="16" height="16" alt="" className="mr-2" />
              <span>
                Your {selectedWalletName} wallet is locked. Click the {selectedWalletName} extension icon in
                your browser toolbar and unlock it — AdaSouls will connect automatically.
              </span>
            </div>
          )}

          {errorToShow && (
            <div className="alert alert-danger mt-3" role="alert">
              {errorToShow.message === "LaceNotFoundError" || errorToShow.name === "LaceNotFoundError"
                ? "No compatible Midnight wallet found. Install Lace or 1am Wallet and reload the page."
                : errorToShow.name === "LaceVersionMismatchError"
                  ? errorToShow.message
                  : errorToShow.name === "LaceNotAuthorizedError"
                    ? `AdaSouls is not authorized by your ${selectedWalletName} wallet. Approve the connection request in the extension.`
                    : errorToShow.name === "LaceLockedError"
                      ? `Your ${selectedWalletName} wallet is still locked (or set to a different network). Unlock it, check it's on the right network, then try connecting again.`
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
        ) : passwordRequest ? (
          <button className="btn btn-outline-light" onClick={cancelPasswordRequest}>
            Cancel
          </button>
        ) : waitingUnlock ? (
          <button className="btn btn-outline-light" onClick={() => setWaitingUnlock(false)}>
            Cancel
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
