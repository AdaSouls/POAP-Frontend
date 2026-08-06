# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this repository is

The AdaSouls POAP portal — a React/CRACO frontend, currently on the `feature/production` branch. This is the frontend half of a Cardano Catalyst-funded project (Fund 11, project #1100234) that is mid-migration from a Milkomeda C1 (Cardano EVM sidechain, now shut down) architecture to **Midnight** (IOG's ZK privacy blockchain). The Compact smart contract and indexer this app talks to live in the sibling repo `../POAP-Midnight`, maintained by a different developer — **all project context (frontend and backend) is tracked from this repo only**; `POAP-Midnight` is kept as a clean, undocumented clone (no `CLAUDE.md`, don't add one there). The "Backend reference" section below is a standing summary of that repo so you don't need to open it for routine frontend work — if it goes stale, refresh it by reading `../POAP-Midnight` directly rather than guessing.

**`README.md` in this repo is stale** — it describes an earlier Ethereum/MetaMask/WalletConnect-only architecture (`cd App`, `ethers.js`, generic EVM wallets). The actual code on this branch has already moved to Midnight + Lace wallet integration (`src/midnight/`, `src/jsx/contexts/drawer/useMidnight.js`, `laceWallet.jsx`). Don't trust the README's described stack or directory layout (there is no `App/` subdirectory — this repo's root *is* the CRA app); trust `package.json` and the actual `src/` tree instead.

This app is a fork of a commercial React admin-dashboard template ("qash" — see `package.json`'s `name` and dependencies like `apexcharts`, `millify`, `sweetalert2`), repurposed as the POAP portal. Expect template-era UI scaffolding (charts, dashboard widgets) unrelated to POAP/Midnight to still be present.

## Commands

```bash
npm install       # or yarn install
npm start         # dev server, http://localhost:3000, via craco (CRA + custom webpack config)
npm run build     # production build -> build/
npm test          # jest via craco test, interactive watch mode
CI=true npm test  # single non-watch run
npm test -- events.test.jsx   # run one test file
npm test -- --coverage
```
Env setup: copy `.env.example` to `.env` (see below for what each var is for).

## Architecture

### Three separate backends, one app

This portal talks to three independent systems, configured via separate env vars (`.env.example`):
1. **Souls/Collections REST API** (`REACT_APP_API_BASE_URL`) — `src/services/collection.service.ts`, `token.service.ts`. Plain fetch-based CRUD for "souls"/collections, unrelated to the blockchain layer.
2. **Midnight** (`REACT_APP_MIDNIGHT_CONTRACT_ADDRESS`, `REACT_APP_MIDNIGHT_INDEXER_API_URL`) — the POAP contract + indexer from `../POAP-Midnight`. This is the active development focus.
3. **Cardano** (`REACT_APP_BLOCKFROST_*`, `REACT_APP_MNEMONIC_DEVNET`) — Blockfrost + `lucid-cardano` (imported directly from a CDN URL in `drawer.provider.jsx`: `https://unpkg.com/lucid-cardano@0.10.7/web/mod.js`) for the legacy/parallel Cardano-native soulbound-token path. `REACT_APP_POAP_CONTRACT_ADDRESS_HARDHAT` is a leftover from the pre-Midnight EVM/Hardhat setup.

### Midnight integration (`src/midnight/`)

- **`providers.ts`** — `connectToLace()` discovers and enables the Midnight Lace wallet via `window.midnight.mnLace` (the `DAppConnectorAPI`), polling for up to 5s and enforcing a compatible connector API version (`1.x`). `buildProviders()` assembles the full Midnight JS provider set (private state via `levelPrivateStateProvider`, ZK config via `FetchZkConfigProvider` pointed at `/midnight/poap`, proof provider, indexer-backed public data provider, and a wallet/midnight provider pair that bridges transaction signing back through the Lace wallet). `getOrCreatePrivateState()` generates a random 32-byte secret key on first connect and persists it via the private state provider from then on.
- **`contract.service.ts`** — `PoapContractService` wraps `findDeployedContract` (mirrors the Midnight `bboard` reference example's pattern) and exposes one typed async method per contract circuit (`claimOrUpdate`, `createEvent`, `mintTo`, `burn`, `pause`/`unpause`, `registerIssuer`/`deactivateIssuer`, `getCallerPk`). `state$` is a combined RxJS observable of public ledger state + this browser's private token state.
- **`contract/managed/poap/`** — compiled contract artifacts, **manually copied** from `../POAP-Midnight/contracts/src/managed/poap/`. There is no sync script; if the backend contract changes and is recompiled, this directory must be refreshed by hand (currently only `contract/index.cjs` + type declarations, not the full `zkir`/`compiler` output).
- **`src/jsx/contexts/drawer/useMidnight.js`** — the React-facing hook. Caches the derived caller public key in `localStorage` (`adasouls:midnight:callerPkHex`) after the first `getCallerPk()` call, specifically to avoid re-deriving it (see the code comment: replicating Compact's `pad()` domain separation client-side to skip the call is explicitly avoided as unverified/risky). Composed into the app-wide `DrawerContext` in `drawer.provider.jsx` alongside `useCardano`.

Several comments in `providers.ts` and `contract.service.ts` flag **unverified-against-a-live-node** assumptions (the ledger↔zswap transaction bridging round-trip, the shape of a value-returning circuit call's result). Treat these as open risk areas, not settled behavior, when working in this area — check whether they've since been verified before relying on them.

### Webpack/CRACO shims (`craco.config.js`, `src/shims/`)

Midnight's JS packages are a mix of WASM-bindgen CJS builds and ESM builds that don't survive CRA's default webpack config unmodified. `craco.config.js` adds:
- WASM support (`asyncWebAssembly`, `.wasm` resolve extension, exclude `.wasm` from the default asset/resource rule)
- `Buffer` polyfill via `ProvidePlugin` (Midnight/crypto libs assume Node's `Buffer` global)
- Four `resolve.alias` overrides forcing specific packages to their CJS build instead of the ESM build webpack would otherwise pick, each with a shim in `src/shims/`: `isomorphic-ws`, `@midnight-ntwrk/midnight-js-network-id`, `@midnight-ntwrk/ledger`, `@midnight-ntwrk/onchain-runtime`. Read the comments at the top of `craco.config.js` and in each shim file before touching any of this — the reasons are subtle (static export analysis on `module.exports` reassignment patterns) and easy to accidentally re-break.
- `@midnight-ntwrk/zswap` is handled differently: `providers.ts` bypasses the resolver entirely with a plain `require()` rather than an aliased import, for the same category of reason.

### Frontend structure

- `src/jsx/pages/` — route-level pages (`router.jsx` wires them up); `src/jsx/drawer/views/` — slide-out drawer forms (create event/issuer/POAP/soul, Lace wallet connect).
- `src/jsx/contexts/drawer/` — the main app state: `drawer.provider.jsx` composes `useCardano` + `useMidnight` into one reducer-backed context (`DrawerContext`/`DrawerDispatchContext`).
- `src/jsx/contexts/user-roles/` — separate context for role-based UI (organizer vs. attendee, etc.).

## Testing conventions

See `src/__tests__/README.md` for the full picture. Key points: tests mirror `pages/`, `components/`, `services/`, `helpers/` under `src/__tests__/`, plus an `integration/` folder for full-flow tests. Services and the drawer context are mocked (`jest.mock()` + `mockDrawerContext`/`renderWithProviders` from a shared test-utils file) rather than hitting real APIs or wallets — don't add tests that depend on a live Midnight devnet or external services.

## Backend reference (`../POAP-Midnight`, maintained separately)

Owned and developed by a teammate working in that repo directly. Read-only context for frontend work — don't edit that repo, and don't reintroduce a `CLAUDE.md` there. Grant history and full rationale: `../POAP-Midnight/docs/CHANGE-REQUEST.md` and `docs/PROOF-OF-PRIOR-WORK.md`.

**Repo layout**: `contracts/` (Compact contract + compiled artifacts + Jest simulator tests), `indexer/` (custom Node/TS indexer), `scripts/deploy.ts` + `scripts/verify-env.sh`, `docker-compose.devnet.yml` (local devnet), `docs/environment.md` (authoritative local setup guide — compactc invocation, proof-server params, devnet ports, Lace wallet), `docs/compact-research.md` (Compact 0.5.0 language notes).

**The contract (`contracts/compact/poap.compact`)**: one Compact contract (Midnight's public/private ledger duality replaced the four old Solidity contract variants — `PoapPublic`/`Poap`/`SoulboundPoap`/`ConsensualSoulboundPoap` — with a single unified one). Public ledger: `totalSupply` (Counter), `tokenOwner`/`tokenFirstEvent`/`tokenIssuer`/`burnedTokens` (keyed by `tokenId`), `events`/`issuers` (keyed by `Bytes<32>` id), `issuerHolderToken` — a `(holderPk, issuerId) → tokenId` index letting an organizer push-mint (`mintTo`) to a wallet that hasn't claimed anything locally yet, `isPaused`, `adminPk`. Identity has no accounts: a caller's identity is `caller_pk()`, derived from a client-held `local_sk()` witness. Witnesses (private, client-side): `local_sk`, `get_my_token_for_issuer`, `store_token`, `store_attendance`, `has_attended` — implemented in `contracts/src/witnesses.ts` and mirrored on the frontend side in `src/midnight/witnesses.ts`, so the two must stay in sync by hand. The single claim entry point is `claimOrUpdate(eventId, isSoulbound)`: mints on first claim, records a new attendance on the existing token on repeat claims (this is the "stateful POAP" behavior — returning wallets update their token instead of getting a duplicate mint), with a public-index reconciliation fallback for tokens the organizer already push-minted.

**The indexer (`indexer/`)**: WS client (`client.ts`) → subscription (`subscriptions.ts`) → `parser.ts` (deserializes the hex `ContractState` via the compiled contract's own `ledger()` function, diffs successive states) → `poap-state.ts` (applies the diff) → `db.ts`/Postgres (`db/migrations/001_init.sql`: `issuers`, `events`, `tokens`, `indexer_cursor` for resume-on-restart) → Express REST API (`api/routes/{events,tokens}.ts`) — this is what the frontend's `REACT_APP_MIDNIGHT_INDEXER_API_URL` points at.

**Local devnet** (`docker-compose.devnet.yml`): Midnight node (`:9944`), proof server (`:6300`), two Postgres instances, Redis, chain/wallet/GraphQL indexer services (GraphQL API on `:8090`). Start with `docker compose -f docker-compose.devnet.yml up -d` from inside `../POAP-Midnight`. `docs/environment.md` has a hard requirement worth knowing even from the frontend side: contract artifacts must be compiled against the exact `public_params.bin` extracted from the `proof-server:2.0.7` image — a mismatched proof-key/params pairing fails proof verification at runtime, not at compile time, which can look like a frontend bug when it's actually a backend build issue.

**Sync point with this repo**: `src/midnight/contract/managed/poap/` here is a manual copy of `../POAP-Midnight/contracts/src/managed/poap/`. If claims/mints start failing with ABI-shaped errors after the other developer changes the contract, this is the first thing to check — recompiled contract artifacts don't propagate automatically.
