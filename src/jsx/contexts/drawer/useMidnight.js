import { useState, useMemo, useCallback } from "react";
import { PoapContractService } from "../../../midnight/contract.service";
import { getWalletDisplayName } from "../../../midnight/providers";

const CONTRACT_ADDRESS = process.env.REACT_APP_MIDNIGHT_CONTRACT_ADDRESS;
const CALLER_PK_CACHE_PREFIX = "adasouls:midnight:callerPkHex:";
// Generous enough to survive real ZK proving + balancing (observed ~55s for a real funding tx),
// but bounded so the UI can't spin forever — Lace's own balanceUnsealedTransaction is known to hang
// indefinitely (never resolve, never reject) rather than error out when DUST isn't registered/accrued.
const CONNECT_TIMEOUT_MS = 90_000;

export class ConnectTimeoutError extends Error {
  constructor() {
    super(
      "Connecting timed out. This usually means your Lace wallet doesn't have DUST registered/accrued yet — delegate your NIGHT for DUST generation in Lace, wait for it to accrue, then try again."
    );
    this.name = "ConnectTimeoutError";
  }
}

function withTimeout(promise, ms, onTimeout) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(onTimeout()), ms);
    promise.then(
      (value) => {
        clearTimeout(timer);
        resolve(value);
      },
      (err) => {
        clearTimeout(timer);
        reject(err);
      }
    );
  });
}

// getCallerPkHex() derives the caller's pk locally (see witnesses.ts#deriveCallerPk — no tx, no
// chain interaction). Still cached across page loads to avoid recomputing on every reconnect —
// keyed by the wallet's own coinPublicKey AND the contract address, so switching wallets in the
// same browser profile can't serve a stale pk cached from a *different* wallet (found 2026-08-14),
// and — just as important — redeploying the contract can't serve a stale pk cached from the
// *previous* deployment either (found 2026-08-19: getOrCreatePrivateState generates a fresh
// local_sk() per contract address, so caller_pk() genuinely differs across deployments even for
// the same wallet; without the contract address in the key, a post-redeploy "My Events" silently
// shows nothing because the cached address no longer matches any event's on-chain organizer).
async function resolveCallerPkHex(service) {
  const cacheKey = CALLER_PK_CACHE_PREFIX + service.walletCoinPublicKey + ':' + service.contractAddress;
  const cached = window.localStorage.getItem(cacheKey);
  if (cached) return cached;

  const hex = await service.getCallerPkHex();
  window.localStorage.setItem(cacheKey, hex);
  return hex;
}

function useMidnight() {
  const [provider, setProvider] = useState(null);
  const [connecting, setConnecting] = useState(false);
  const [error, setError] = useState(null);

  // `wallet` is one of discoverCompatibleWallets()'s results (the InitialAPI the user picked in
  // the wallet-connect popup) — required, since there's no more "just pick whichever's first"
  // fallback now that more than one Midnight-compatible wallet can be installed at once.
  const connect = useCallback(async (wallet) => {
    if (!CONTRACT_ADDRESS) {
      const err = new Error(
        "REACT_APP_MIDNIGHT_CONTRACT_ADDRESS is not set — see .env.example."
      );
      setError(err);
      throw err;
    }
    if (!wallet) {
      const err = new Error("No wallet selected.");
      setError(err);
      throw err;
    }

    setConnecting(true);
    setError(null);
    try {
      // TEMPORARY (2026-08-13): timeout wrapper removed so a hang surfaces whatever real
      // error/rejection Lace eventually produces (or truly hangs, observable via devtools)
      // instead of being masked by ConnectTimeoutError after 90s — restore withTimeout() around
      // both calls below once the actual DUST/connect error is diagnosed.
      console.log('[useMidnight.connect] PoapContractService.connect()…');
      const service = await PoapContractService.connect(CONTRACT_ADDRESS, wallet);
      console.log('[useMidnight.connect] PoapContractService.connect() resolved, resolving caller pk…');
      const addressHex = await resolveCallerPkHex(service);
      console.log('[useMidnight.connect] resolveCallerPkHex() resolved:', addressHex);

      const newProviderState = {
        service,
        address: addressHex,
        contractAddress: CONTRACT_ADDRESS,
        wallet: getWalletDisplayName(wallet),
      };
      setProvider(newProviderState);
      return newProviderState;
    } catch (err) {
      setError(err);
      setProvider(null);
      throw err;
    } finally {
      setConnecting(false);
    }
  }, []);

  const disconnect = useCallback(() => {
    setProvider(null);
    setError(null);
  }, []);

  const value = useMemo(
    () => ({ provider, connecting, error, connect, disconnect }),
    [provider, connecting, error, connect, disconnect]
  );
  return value;
}

export default useMidnight;
