import { useState, useMemo, useCallback, useEffect, useRef } from "react";
import { PoapContractService } from "../../../midnight/contract.service";
import { MockPoapContractService } from "../../../midnight/mock-contract.service";

const CONTRACT_ADDRESS = process.env.REACT_APP_MIDNIGHT_CONTRACT_ADDRESS;
const CALLER_PK_CACHE_KEY = "adasouls:midnight:callerPkHex";
// Dev-only bypass of Lace/the real deployed contract — see mock-contract.service.ts and
// mock-server/indexer-server.js. Never true outside a local .env override.
const MOCK_MODE = process.env.REACT_APP_MOCK_MIDNIGHT === "true";

// getCallerPkHex() is a local, synchronous derivation (see witnesses.ts's deriveCallerPk) — the
// contract's own caller_pk() circuit is internal-only, not callable as its own transaction. Still
// cached across page loads purely as a micro-optimization now, not to dodge a paid call.
function resolveCallerPkHex(service) {
  const cached = window.localStorage.getItem(CALLER_PK_CACHE_KEY);
  if (cached) return cached;

  const hex = service.getCallerPkHex();
  window.localStorage.setItem(CALLER_PK_CACHE_KEY, hex);
  return hex;
}

function useMidnight() {
  const [provider, setProvider] = useState(null);
  const [connecting, setConnecting] = useState(false);
  const [error, setError] = useState(null);

  const connect = useCallback(async () => {
    if (!MOCK_MODE && !CONTRACT_ADDRESS) {
      const err = new Error(
        "REACT_APP_MIDNIGHT_CONTRACT_ADDRESS is not set — see .env.example."
      );
      setError(err);
      throw err;
    }

    setConnecting(true);
    setError(null);
    try {
      const service = MOCK_MODE
        ? await MockPoapContractService.connect()
        : await PoapContractService.connect(CONTRACT_ADDRESS);
      const addressHex = resolveCallerPkHex(service);

      const newProviderState = {
        service,
        address: addressHex,
        contractAddress: MOCK_MODE ? service.contractAddress : CONTRACT_ADDRESS,
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

  // Mock mode only: auto-connect once on mount so every wallet-gated page has data to show
  // without requiring a manual "Connect Lace" click first. Guarded by a ref (not state) since
  // this must fire exactly once regardless of render/effect re-runs.
  const autoConnectedRef = useRef(false);
  useEffect(() => {
    if (!MOCK_MODE || autoConnectedRef.current) return;
    autoConnectedRef.current = true;
    connect().catch(() => {});
  }, [connect]);

  const value = useMemo(
    () => ({ provider, connecting, error, connect, disconnect }),
    [provider, connecting, error, connect, disconnect]
  );
  return value;
}

export default useMidnight;
