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
