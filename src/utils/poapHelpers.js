// Pure POAP data helpers with no blockchain-specific dependency — kept chain-agnostic so they
// survive contract/wallet migrations. Moved out of the (now-deleted) EVM-only
// poapContractInteractions.js.
//
// On Midnight, claim() mints a brand-new token scoped to exactly one event (see poap.compact and
// src/midnight/my-tokens.ts), so "did I mint this event" means: does any of my tokens have this
// event as its firstEventId.
export const checkEventsMintedByAddress = (events, myTokens) => {
  return events.map((event) => {
    const isMinted = myTokens.some(
      (token) => token.issuerPkHex === event.issuerPk && token.firstEventId === event.eventId
    );
    return { ...event, isMinted };
  });
};

// Single source of truth for event status, previously duplicated between eventCard.jsx and
// myEvents.jsx's applyFilters.
export function getEventStatus(event) {
  const isExpired = Boolean(event.expiration && event.expiration > 0 && event.expiration * 1000 <= Date.now());
  const isFull = Boolean(event.maxSupply && event.maxSupply > 0 && event.minted >= event.maxSupply);
  if (!event.isActive) return "inactive";
  if (isExpired) return "expired";
  if (isFull) return "full";
  return "active";
}
