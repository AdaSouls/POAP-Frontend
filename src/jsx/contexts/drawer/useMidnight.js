import { useState, useMemo, useCallback } from "react";
import { PoapContractService } from "../../../midnight/contract.service";

const CONTRACT_ADDRESS = process.env.REACT_APP_MIDNIGHT_CONTRACT_ADDRESS;
const CALLER_PK_CACHE_KEY = "adasouls:midnight:callerPkHex";

function toHex(bytes) {
  return Buffer.from(bytes).toString("hex");
}

// getCallerPk() is a real circuit call (a submitted, proved transaction) even though the value it
// returns (derive_pk(secretKey)) is deterministic given our own locally-known secretKey. We don't
// replicate that hash client-side to skip the transaction — Compact's `pad()` domain-separation
// semantics aren't verified against this SDK version, and getting that subtly wrong would silently
// produce the wrong address. So: call it once per browser, cache the resulting hex string, and
// only call it again if the cache is empty.
async function resolveCallerPkHex(service) {
  const cached = window.localStorage.getItem(CALLER_PK_CACHE_KEY);
  if (cached) return cached;

  const pk = await service.getCallerPk();
  const hex = toHex(pk);
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
