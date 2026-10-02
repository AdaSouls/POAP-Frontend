import { useEffect, useState } from "react";
import { useDrawer } from "../contexts/drawer/drawer.provider";

const REFRESH_INTERVAL_MS = 30000;
const EMPTY = { blocked: new Set(), verified: new Set() };

// The contract's `issuers` map, split in two:
//  - verified: organizer keys the admin registered (registerIssuer) and that are still active. The
//    only thing tying a key to a checked real-world identity, so cards show a "Verified" badge.
//  - blocked: keys the admin deactivated (deactivateIssuer). The contract then rejects createEvent
//    from that key and every claim/push-mint under its events ("Issuer is deactivated"), but the
//    events themselves stay active on-chain, so this is the only way to tell them apart. Any key
//    can be blocked, registered or not: a blocked unregistered key is just an inactive entry.
// The indexer API has no issuers endpoint, so this reads the live ledger. Needs a connected wallet;
// both sets stay empty until it has one.
export function useIssuerRegistry() {
  const { midnight: { provider } } = useDrawer();
  const [registry, setRegistry] = useState(EMPTY);

  useEffect(() => {
    const service = provider?.service;
    if (typeof service?.getState !== "function") {
      setRegistry(EMPTY);
      return undefined;
    }
    let cancelled = false;
    const load = async () => {
      try {
        const { ledger } = await service.getState();
        const blocked = new Set();
        const verified = new Set();
        for (const [pk, issuer] of ledger.issuers) {
          (issuer.isActive ? verified : blocked).add(Buffer.from(pk).toString("hex"));
        }
        if (!cancelled) setRegistry({ blocked, verified });
      } catch (error) {
        console.error("Error loading the issuer registry:", error);
      }
    };
    load();
    const timer = setInterval(load, REFRESH_INTERVAL_MS);
    return () => {
      cancelled = true;
      clearInterval(timer);
    };
  }, [provider]);

  return registry;
}

export function useBlockedIssuers() {
  return useIssuerRegistry().blocked;
}
