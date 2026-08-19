import { useEffect, useState } from "react";
import { getPublicGatewayDomain } from "../../services/ipfs.service";

// ipfs.io's gateway doesn't send CORS headers reliably (ERR_FAILED, no
// Access-Control-Allow-Origin), and the shared gateway.pinata.cloud one 404s on recently-pinned
// content (propagation lag) and rate-limits (429) under normal use. This account's own dedicated
// gateway (fetched once via getPublicGatewayDomain, see server/index.js) serves its own pins
// immediately and isn't shared with other Pinata users — used whenever it's reachable, falling
// back to the shared gateway only if the local server itself can't be reached.
const FALLBACK_GATEWAY = "https://gateway.pinata.cloud/ipfs/";

let gatewayDomainPromise = null;
function resolveGatewayBase() {
  if (!gatewayDomainPromise) {
    gatewayDomainPromise = getPublicGatewayDomain()
      .then((domain) => `https://${domain}.mypinata.cloud/ipfs/`)
      .catch(() => {
        // Don't cache a failure forever (unlike a successful resolution, cached below via the
        // module-level variable staying set) — a momentarily-unreachable local server shouldn't
        // permanently downgrade every metadata fetch for the rest of the tab's life; retry on the
        // next call instead, only falling back for this one.
        gatewayDomainPromise = null;
        return FALLBACK_GATEWAY;
      });
  }
  return gatewayDomainPromise;
}

async function resolveIpfs(uri) {
  if (typeof uri === "string" && uri.startsWith("ipfs://")) {
    const base = await resolveGatewayBase();
    return base + uri.slice("ipfs://".length);
  }
  return uri;
}

// Keyed by the raw metadataURI string, cached for the tab's lifetime — safe to never evict since
// metadataURI is immutable per event once set at createEvent (see poap.compact). Not just the
// resolved value: caches the *promise*, so concurrent callers for the same URI (e.g. the same
// event rendered on both the collapsed grid tile and the Explore Events page) share one fetch.
const metadataCache = new Map();

async function fetchMetadata(metadataURI) {
  try {
    const response = await fetch(await resolveIpfs(metadataURI));
    if (!response.ok) return null;
    const json = await response.json();
    return {
      ...json,
      imageUrl: json.image ? await resolveIpfs(json.image) : undefined,
      // Optional, organizer-set at createEvent time (see createEvent.jsx's usePoapImage switch) —
      // the image the *claimed token itself* displays, separate from the event's own listing image
      // above. Undefined when the organizer left the switch off, so callers should fall back to
      // imageUrl (poapImageUrl || imageUrl) rather than assume this is always present.
      poapImageUrl: json.poapImage ? await resolveIpfs(json.poapImage) : undefined,
      // Only set on individually push-minted Credential tokens (see mintPoap.jsx) — the actual
      // ticket/diploma/document content, shown full-size when the holder opens that specific
      // token (poapCard.jsx's expanded view). Never present on event-level metadataURI or on
      // self-claimed tokens, which have no per-token metadata of their own.
      documentImageUrl: json.documentImage ? await resolveIpfs(json.documentImage) : undefined,
    };
  } catch {
    return null;
  }
}

// Fetches the off-chain JSON (name/description/image) an event's metadataURI points to. Never
// throws into the render path — a missing URI, network failure, non-OK response, or malformed
// JSON all resolve to `metadata: null`, so callers can fall back to their existing placeholder.
export function useEventMetadata(metadataURI) {
  const [metadata, setMetadata] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!metadataURI) {
      setMetadata(null);
      setLoading(false);
      return undefined;
    }

    let cancelled = false;
    setLoading(true);

    if (!metadataCache.has(metadataURI)) {
      // A failed fetch (network hiccup, gateway momentarily down) is evicted from the cache right
      // after resolving instead of staying cached as a permanent null — otherwise one bad request
      // right after createEvent (before IPFS/gateway propagation catches up) would keep showing the
      // fallback name/no-image for the rest of the tab's lifetime, even once the content is really
      // available. A successful result still stays cached forever, same as before.
      metadataCache.set(
        metadataURI,
        fetchMetadata(metadataURI).then((result) => {
          if (result === null) metadataCache.delete(metadataURI);
          return result;
        })
      );
    }

    metadataCache.get(metadataURI).then((result) => {
      if (!cancelled) {
        setMetadata(result);
        setLoading(false);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [metadataURI]);

  return { metadata, loading };
}
