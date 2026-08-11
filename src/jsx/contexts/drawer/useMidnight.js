import { useState, useMemo, useCallback } from "react";
import { PoapContractService } from "../../../midnight/contract.service";

const CONTRACT_ADDRESS = process.env.REACT_APP_MIDNIGHT_CONTRACT_ADDRESS;
const CALLER_PK_CACHE_KEY = "adasouls:midnight:callerPkHex";

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
      const service = await PoapContractService.connect(CONTRACT_ADDRESS);
      const addressHex = await resolveCallerPkHex(service);

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
