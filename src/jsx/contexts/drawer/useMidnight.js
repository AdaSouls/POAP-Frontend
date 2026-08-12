import { useState, useMemo, useCallback } from "react";
import { PoapContractService } from "../../../midnight/contract.service";

const CONTRACT_ADDRESS = process.env.REACT_APP_MIDNIGHT_CONTRACT_ADDRESS;
const CALLER_PK_CACHE_KEY = "adasouls:midnight:callerPkHex";
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

// getCallerPkHex() calls the contract's exported getCallerPk circuit as its own transaction.
// Cached across page loads so reconnecting doesn't submit a fresh tx just to re-derive the same pk.
async function resolveCallerPkHex(service) {
  const cached = window.localStorage.getItem(CALLER_PK_CACHE_KEY);
  if (cached) return cached;

  const hex = await service.getCallerPkHex();
  window.localStorage.setItem(CALLER_PK_CACHE_KEY, hex);
  return hex;
}

function useMidnight() {
  const [provider, setProvider] = useState(null);
  const [connecting, setConnecting] = useState(false);
  const [error, setError] = useState(null);

  const connect = useCallback(async () => {
    if (!CONTRACT_ADDRESS) {
      const err = new Error(
        "REACT_APP_MIDNIGHT_CONTRACT_ADDRESS is not set — see .env.example."
      );
      setError(err);
      throw err;
    }

    setConnecting(true);
    setError(null);
    try {
      const service = await withTimeout(
        PoapContractService.connect(CONTRACT_ADDRESS),
        CONNECT_TIMEOUT_MS,
        () => new ConnectTimeoutError()
      );
      const addressHex = await withTimeout(
        resolveCallerPkHex(service),
        CONNECT_TIMEOUT_MS,
        () => new ConnectTimeoutError()
      );

      const newProviderState = {
        service,
        address: addressHex,
        contractAddress: CONTRACT_ADDRESS,
        wallet: "lace",
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
