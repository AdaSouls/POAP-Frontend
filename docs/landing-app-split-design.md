# Landing / App split — design decisions

Confirmed 2026-09-04. Goal: reduce onboarding friction — new visitors land on marketing content
that explains the two roles before ever seeing a wallet-connect button or role picker.

## Scope

Same repo, same CRA build (no separate deploy yet). Route-based split now, so a future move to
real subdomains (`adasouls.io` / `app.adasouls.io`) is a deploy-config change, not a rewrite.

## Routing

- `/` is reserved exclusively for the landing page (current `pages/index.jsx`, reworked).
- Every current app route moves under an `/app` prefix: `/app`, `/app/explore-events`,
  `/app/my-events`, `/app/my-subscriptions`, etc. (exact list = whatever `router.jsx` has today,
  minus `/`, `/organizer`, `/subscriber` which stay top-level — see below).
- `/organizer` and `/subscriber` (existing `organizerInfo.jsx`/`subscriberInfo.jsx`) stay as
  top-level informational routes, reachable from the landing nav's "Roles" dropdown. They are NOT
  moved under `/app` — they're landing-side content, not app functionality.
- "Get Started" (landing hero CTA, replaces "Connect Wallet") routes to `/app`. When real subdomains
  exist later, swap this for an absolute link to `https://app.adasouls.io`.

## Landing page (`pages/index.jsx`)

- New lightweight nav (separate component from the app's `header.jsx`): logo, "Documentación"
  (placeholder — no doc site exists yet, render disabled/"próximamente" or link to an empty
  internal page), "Roles" (dropdown: Organizer → `/organizer`, Subscriber → `/subscriber`),
  "Get Started" button on the right (replaces the wallet icon entirely — no wallet-connect UI on
  the landing at all).
- Section order changes: Hero → **"Choose your role" block moves up here, right after the hero**
  → the 7 use-case rows (shortened to one short line each, down from the current 2-3 lines) →
  footer. Today the role block sits after the use-case rows, at the bottom — the reorder is
  specifically because that placement was buried where most visitors never scroll to.
- "Choose your role" cards keep their existing "Learn more" buttons → `/organizer` / `/subscriber`
  (unchanged destinations, just moved up in page order). They no longer need to also call
  `setRole()` on click — see below, role selection is now purely an app-side concern.

## App nav (`header.jsx`, moves as-is to everything under `/app`)

- Remove the navigation side-effect in `handleRoleSelect` — switching role in the dropdown updates
  `useSiteRole` (unchanged hook, still `localStorage`-persisted) and re-renders `ROLE_NAV_ITEMS`
  only. It no longer routes to `/organizer` or `/subscriber` — that informational content is
  landing-side now, not something the in-app role switch should jump to.
- No link back to the landing's informational content from inside the app nav (implementation
  should double check `header.jsx` for anything else pointing at `/organizer`/`/subscriber` beyond
  the role-select side effect already identified, and remove it too).

## Explicitly out of scope / deferred

- No real second domain/deploy yet — purely route-based within the existing build.
- No documentation site — "Documentación" is a placeholder link.
- No third landing-nav link beyond Documentación/Roles — revisit later if needed.
- No contract/witness changes — this is pure frontend routing + page content, doesn't touch
  `../POAP-Midnight`.

## How to apply

Next step is implementation planning (Plan mode or a task breakdown) covering: `router.jsx` route
restructuring, new landing nav component, `index.jsx` reorder + copy shortening, `header.jsx`
`handleRoleSelect` cleanup, and updating any internal links (`Link to="/..."` for app routes) that
assumed the old unprefixed paths.
