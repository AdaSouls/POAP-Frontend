// Local cache of an organizer's own private-ATTRIBUTE drafts (Channel B — selective disclosure
// via proveAttributeMembership), separate from private-event-metadata.ts's Channel A drafts
// (revealPrivateMetadata — one blob, reveal-all-or-nothing). Stored in localStorage, not private
// state: the contract only ever sees the Merkle leaf/root, never these raw values. Scoped per
// (eventId, fieldId), same one-key-per-item pattern as private-event-metadata.ts.
//
// Known limitation, accepted by design (same as private-event-metadata.ts): if this browser's
// localStorage is cleared before the organizer builds a proof or reveals, the field's opening is
// unrecoverable — value/rand were never sent anywhere else. Losing it means that one attribute can
// never be proven or revealed again (the committed root itself is unaffected — other fields stay
// fine); it does not affect the event itself.
//
// IMPORTANT: never reuse `rand` across attribute leaves for the same event (see
// contract.service.ts#computeAttributeLeaf's warning) — generate a fresh random value per field.
const PRIVATE_ATTRIBUTE_DRAFT_PREFIX = "adasouls:midnight:privateAttributeDraft:";

export type PrivateAttributeDraft = {
  fieldName: string; // human-readable label, shown back to the organizer (not on-chain)
  valueHex: string;
  randHex: string;
};

function draftKey(eventIdHex: string, fieldIdHex: string): string {
  return `${PRIVATE_ATTRIBUTE_DRAFT_PREFIX}${eventIdHex}:${fieldIdHex}`;
}

export function savePrivateAttributeDraft(
  eventIdHex: string,
  fieldIdHex: string,
  draft: PrivateAttributeDraft,
): void {
  window.localStorage.setItem(draftKey(eventIdHex, fieldIdHex), JSON.stringify(draft));
}

export function getPrivateAttributeDraft(
  eventIdHex: string,
  fieldIdHex: string,
): PrivateAttributeDraft | null {
  const raw = window.localStorage.getItem(draftKey(eventIdHex, fieldIdHex));
  if (!raw) return null;
  try {
    return JSON.parse(raw) as PrivateAttributeDraft;
  } catch {
    return null;
  }
}

// Every fieldId this browser has a draft for, under a given event — needed since fieldId itself
// (a Bytes<32>, e.g. a hash of the field's name) isn't otherwise discoverable client-side. Scans
// localStorage rather than keeping a separate index: this only ever runs for the organizer's own
// small set of attributes on their own events, not a hot path.
export function listPrivateAttributeFieldIds(eventIdHex: string): string[] {
  const prefix = `${PRIVATE_ATTRIBUTE_DRAFT_PREFIX}${eventIdHex}:`;
  const fieldIds: string[] = [];
  for (let i = 0; i < window.localStorage.length; i++) {
    const key = window.localStorage.key(i);
    if (key && key.startsWith(prefix)) {
      fieldIds.push(key.slice(prefix.length));
    }
  }
  return fieldIds;
}
