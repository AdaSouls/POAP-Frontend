// Pure POAP data helpers with no blockchain-specific dependency — kept chain-agnostic so they
// survive contract/wallet migrations. Moved out of the (now-deleted) EVM-only
// poapContractInteractions.js.
//
// On Midnight, one SPOAP token per issuer accumulates every event claimed for that issuer (see
// src/midnight/witnesses.ts), so "did I mint this event" means: do I have a token for this event's
// issuer, and does that token's private attendance list include this event id.
export const checkEventsMintedByAddress = (events, myTokens) => {
  return events.map((event) => {
    const token = myTokens.find((t) => t.issuerPkHex === event.issuerPk);
    const isMinted = Boolean(token?.attendedEventIds?.includes(event.eventId));
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

// Shared by viewPoap.jsx and mySubscriptions.jsx so both read share-visibility toggles the same
// way instead of each re-implementing the filter. `isVisible` is typically
// src/midnight/collection-share.ts's getEventVisibility, injected rather than imported directly
// so this file stays free of any blockchain-specific dependency (see the file-level comment).
export function filterVisibleEvents(poap, isVisible) {
  return (poap.attendedEventIds || []).filter((eventId) => isVisible(poap.issuerPkHex, eventId));
}
