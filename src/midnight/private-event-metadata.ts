// Local cache of an organizer's own private-event drafts — the (value, rand) pair needed to call
// revealPrivateMetadata later, plus the original notes text so it can be shown pre-reveal without
// any network fetch. Stored in localStorage, not private state: the contract only ever sees the
// commit (a hash), never this. Scoped per event, same one-key-per-item pattern as
// collection-share.ts's visibility flags, rather than one big JSON blob (simpler, no
// read-modify-write races between tabs).
//
// Known limitation, accepted by design (see project memory): if this browser's localStorage is
// cleared before the organizer reveals, the draft is unrecoverable — value/rand were never sent
// anywhere else. Not a bug to work around here.
const PRIVATE_EVENT_DRAFT_PREFIX = "adasouls:midnight:privateEventDraft:";

export type PrivateEventDraft = {
  notes: string;
  valueHex: string;
  randHex: string;
};

export function savePrivateEventDraft(eventIdHex: string, draft: PrivateEventDraft): void {
  window.localStorage.setItem(`${PRIVATE_EVENT_DRAFT_PREFIX}${eventIdHex}`, JSON.stringify(draft));
}

export function getPrivateEventDraft(eventIdHex: string): PrivateEventDraft | null {
  const raw = window.localStorage.getItem(`${PRIVATE_EVENT_DRAFT_PREFIX}${eventIdHex}`);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as PrivateEventDraft;
  } catch {
    return null;
  }
}
