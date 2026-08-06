// Same localStorage convention as attendance-proof.ts / useMidnight.js's callerPk cache: a plain
// key-prefix constant plus get/set functions, no wrapper/class.
//
// This is the client-side half of the "share my collection" feature (see
// docs/collection-sharing-design.md): the holder decides, per attended event, whether it's
// included in a link they generate. Nothing here touches the contract or any backend — visibility
// choices live only in this browser, and the encoded payload lives only in the URL the holder
// copies. Default is VISIBLE (opt-out), confirmed with the user — absence of a stored key means
// visible, matching how a holder who never opens the toggle still gets a usable share link.
const VISIBILITY_PREFIX = "adasouls:midnight:shareVisibility:";

function visibilityKey(issuerPkHex: string, eventIdHex: string): string {
  return `${VISIBILITY_PREFIX}${issuerPkHex}:${eventIdHex}`;
}

export function getEventVisibility(issuerPkHex: string, eventIdHex: string): boolean {
  const stored = window.localStorage.getItem(visibilityKey(issuerPkHex, eventIdHex));
  return stored !== "0";
}

export function setEventVisibility(issuerPkHex: string, eventIdHex: string, visible: boolean): void {
  window.localStorage.setItem(visibilityKey(issuerPkHex, eventIdHex), visible ? "1" : "0");
}

// ── Share payload encode/decode ─────────────────────────────────────────────────
//
// Single-letter keys to keep the URL short — this can carry one entry per attended event across
// every token being shared. tokenId is a bigint (see src/midnight/witnesses.ts's TokenRecord) and
// JSON can't serialize those directly, so it round-trips as a string.

export type ShareEntry = {
  issuerPkHex: string;
  tokenId: bigint;
  visibleEventIds: string[];
};

type EncodedShareEntry = { i: string; id: string; e: string[] };
type EncodedSharePayload = { v: 1; t: EncodedShareEntry[] };

function base64UrlEncode(input: string): string {
  return window.btoa(input).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function base64UrlDecode(input: string): string {
  const padded = input.replace(/-/g, "+").replace(/_/g, "/");
  const padding = padded.length % 4 === 0 ? "" : "=".repeat(4 - (padded.length % 4));
  return window.atob(padded + padding);
}

// Omits issuerPkHex/tokenId when sharing a single token — the destination page can resolve those
// from its own indexer lookup for the pk in the URL path, so the common "share one token" case
// doesn't pay for repeating identifiers the recipient can already get elsewhere.
export function encodeShareableCollection(entries: ShareEntry[]): string {
  const payload: EncodedSharePayload = {
    v: 1,
    t: entries.map((entry) => ({
      i: entry.issuerPkHex,
      id: entry.tokenId.toString(),
      e: entry.visibleEventIds,
    })),
  };
  return base64UrlEncode(JSON.stringify(payload));
}

export function decodeShareableCollection(encoded: string): ShareEntry[] | null {
  try {
    const payload = JSON.parse(base64UrlDecode(encoded)) as EncodedSharePayload;
    if (payload.v !== 1 || !Array.isArray(payload.t)) return null;
    return payload.t.map((entry) => ({
      issuerPkHex: entry.i,
      tokenId: BigInt(entry.id),
      visibleEventIds: entry.e,
    }));
  } catch {
    return null;
  }
}

export function buildShareUrl(pkHex: string, encodedPayload?: string): string {
  const base = `${window.location.origin}/share/${pkHex}`;
  return encodedPayload ? `${base}?d=${encodedPayload}` : base;
}
