// Same localStorage convention as useMidnight.js's callerPk cache: a plain key-prefix constant
// plus get/set functions, no wrapper/class.
//
// This is the client-side half of the "share my collection" feature (see
// docs/collection-sharing-design.md): the holder decides, per token, whether it's included in a
// link they generate. Nothing here touches the contract or any backend — visibility choices live
// only in this browser, and the encoded payload lives only in the URL the holder copies. Default
// is VISIBLE (opt-out), confirmed with the user — absence of a stored key means visible, matching
// how a holder who never opens the toggle still gets a usable share link.
//
// One entry per (issuerPkHex, tokenId) now, not per (issuerPkHex, eventId): since claim() mints a
// brand-new token per event (poap.compact), a token maps to exactly one event already — there's
// no separate "which of this token's events" granularity left to toggle.
const VISIBILITY_PREFIX = "adasouls:midnight:shareVisibility:";

function visibilityKey(issuerPkHex: string, tokenId: string | number | bigint): string {
  return `${VISIBILITY_PREFIX}${issuerPkHex}:${tokenId}`;
}

export function getTokenVisibility(issuerPkHex: string, tokenId: string | number | bigint): boolean {
  const stored = window.localStorage.getItem(visibilityKey(issuerPkHex, tokenId));
  return stored !== "0";
}

export function setTokenVisibility(issuerPkHex: string, tokenId: string | number | bigint, visible: boolean): void {
  window.localStorage.setItem(visibilityKey(issuerPkHex, tokenId), visible ? "1" : "0");
}

// ── Share payload encode/decode ─────────────────────────────────────────────────
//
// Single-letter keys to keep the URL short — this can carry one entry per shared token. tokenId
// is a bigint (see src/midnight/indexer.service.ts) and JSON can't serialize those directly, so
// it round-trips as a string.

export type ShareEntry = {
  issuerPkHex: string;
  tokenId: bigint | number;
};

type EncodedShareEntry = { i: string; id: string };
type EncodedSharePayload = { v: 2; t: EncodedShareEntry[] };

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
    v: 2,
    t: entries.map((entry) => ({ i: entry.issuerPkHex, id: entry.tokenId.toString() })),
  };
  return base64UrlEncode(JSON.stringify(payload));
}

export function decodeShareableCollection(encoded: string): ShareEntry[] | null {
  try {
    const payload = JSON.parse(base64UrlDecode(encoded)) as EncodedSharePayload;
    if (payload.v !== 2 || !Array.isArray(payload.t)) return null;
    return payload.t.map((entry) => ({ issuerPkHex: entry.i, tokenId: BigInt(entry.id) }));
  } catch {
    return null;
  }
}

export function buildShareUrl(pkHex: string, encodedPayload?: string): string {
  const base = `${window.location.origin}/share/${pkHex}`;
  return encodedPayload ? `${base}?d=${encodedPayload}` : base;
}
