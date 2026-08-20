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

// Display text for a getEventStatus() value — the underlying status value (used for filtering/
// sorting/badge color) never changes by role, only how it reads. "active"/"full" are the only
// two that differ: an organizer thinks in terms of the event's own lifecycle ("Active", "Full"),
// while a subscriber cares about whether they can act on it right now ("Claimable", "Sold out").
// expired/inactive already read the same to either audience.
const STATUS_LABELS = {
  organizer: { active: "Active", full: "Full", expired: "Expired", inactive: "Inactive" },
  subscriber: { active: "Claimable", full: "Sold out", expired: "Expired", inactive: "Inactive" },
};

export function getEventStatusLabel(status, role) {
  return (STATUS_LABELS[role] || STATUS_LABELS.organizer)[status] || status;
}
