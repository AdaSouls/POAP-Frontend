# Organizer profile and one identity per wallet — design (2026-10-01)

Decided in a brainstorm on 2026-10-01 and implemented the same day. Frontend only: no contract or
indexer change.

**Implemented in:** `src/midnight/organizer-profile.ts` (storage, in `BACKED_UP_PREFIXES`),
`src/jsx/components/IdentityStep.jsx` (welcome question + warning), `createEvent.jsx` (prefill +
"Save as my organizer profile"), `src/jsx/drawer/views/organizerProfile.jsx` (Organizer profile popup,
opened from the wallet popup), `src/jsx/components/OrganizerLabel.jsx` + `useIssuerRegistry` in
`src/jsx/hooks/useBlockedIssuers.js` (short key id + Verified badge on cards).

## Problem

1. **Split identities.** A Velum identity is `local_sk`, generated at random per browser the first
   time a wallet connects (`getOrCreatePrivateState`), not the wallet itself. Importing the same seed
   on another computer and choosing "new" in the welcome step creates a second identity. Seen on
   preprod: Matías created an event, the same wallet on another computer couldn't manage it, and it
   could claim it. The contract's "Organizer cannot claim their own event" check compares
   `caller_pk()`, which differs between the two identities, so it does not catch this case (to
   confirm with Matías).
2. **Organizer data typed by hand on every event.** The wizard's "Organization profile" step
   (`OrganizationProfileFields.jsx`) starts empty each time.

Subscribers are hit by (1) too: their credentials are minted to holder keys derived from
`local_sk`, so a new identity shows an empty My Subscriptions.

## Decisions

| # | Decision | Chosen |
| --- | --- | --- |
| 1 | Detecting an existing identity on a new browser | No automatic detection. The welcome step asks "Have you used Velum with this wallet before?" and warns before creating a new identity. Rejected: a wallet-derived marker on Pinata, since anyone knowing the address could check whether it uses Velum. |
| 2 | Saving the organizer profile when creating an event | "Save as my organizer profile" checkbox, checked by default. |
| 3 | Where the profile is edited outside the wizard | An "Organizer profile" popup opened from the wallet popup (first planned as a page on `/app/Settings-profile`; changed to a popup on request, the route stays the old placeholder). |
| 4 | Editing the profile | Allowed. Locking it in the frontend would be bypassable (metadata is free text the contract stores as is; a new identity or a direct contract call gets around it). |
| 5 | What identifies an organizer | The organizer key (`issuerPk`), shown as a short stable id next to the name on event and credential cards. The name is a self-declared label. |
| 6 | Trust signal | A "Verified" badge for organizers active in the contract's `issuers` registry (admin-registered after off-chain verification). |

## Data

- The profile (name + optional address) lives in localStorage, scoped per wallet and contract like
  the other per-identity keys, and its prefix is added to `BACKED_UP_PREFIXES` in `backup.ts`, so
  the automatic encrypted Pinata backup carries it and a restore brings it back.
- Private while unused. Creating an event copies it into the event's public metadata JSON on IPFS,
  as today. The form says so: "These details are shown publicly on your events."
- Asked the first time someone creates an event, not at identity creation (subscribers create
  identities too).

## Frontend

- `IdentityStep.jsx`: welcome mode asks the question first; "No" creates the identity after a
  warning that past events and credentials won't show; "Yes" goes to restore.
- `createEvent.jsx`: prefill the Organization profile step from the saved profile; checkbox to save.
- `organizerProfile.jsx`: Organizer profile popup (edit name/address, note that it's public on
  events and backed up encrypted), opened from the wallet popup.
- `eventCard.jsx` / `poapCard.jsx`: short organizer-key id next to the name; "Verified" badge when
  the key is an active issuer (read from the ledger `issuers` map, same source as
  `useBlockedIssuers`).

## Limits

- The recovery code is still the only way back to an identity; nothing here replaces it.
- A second identity created on purpose can't be prevented, with or without this design.
- Identities created before this change have no saved profile; the first event fills it.
