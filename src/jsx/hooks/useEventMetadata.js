import { useEffect, useState } from "react";

const IPFS_GATEWAY = "https://ipfs.io/ipfs/";

function resolveIpfs(uri) {
  if (typeof uri === "string" && uri.startsWith("ipfs://")) {
    return IPFS_GATEWAY + uri.slice("ipfs://".length);
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
    const response = await fetch(resolveIpfs(metadataURI));
    if (!response.ok) return null;
    const json = await response.json();
    return { ...json, imageUrl: json.image ? resolveIpfs(json.image) : undefined };
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
      metadataCache.set(metadataURI, fetchMetadata(metadataURI));
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
