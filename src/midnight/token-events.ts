// Same-page notice that a token was just burned (burnToken.jsx), so the cards showing it can update
// right away instead of waiting for their next indexer poll. Carries the ids as strings.
export const TOKEN_BURNED_EVENT = 'adasouls:token-burned';

export type TokenBurnedDetail = { eventId: string; tokenId: string };

export function notifyTokenBurned(eventId: string, tokenId: bigint | number | string): void {
  window.dispatchEvent(
    new CustomEvent<TokenBurnedDetail>(TOKEN_BURNED_EVENT, { detail: { eventId, tokenId: String(tokenId) } }),
  );
}
