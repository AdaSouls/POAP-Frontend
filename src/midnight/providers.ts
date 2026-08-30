import type { UnboundTransaction } from '@midnight-ntwrk/midnight-js-types';
import { Cause } from 'effect';
import { setNetworkId } from '@midnight-ntwrk/midnight-js-network-id';
import { levelPrivateStateProvider } from '@midnight-ntwrk/midnight-js-level-private-state-provider';
import { FetchZkConfigProvider } from '@midnight-ntwrk/midnight-js-fetch-zk-config-provider';
import { httpClientProofProvider } from '@midnight-ntwrk/midnight-js-http-client-proof-provider';
import { indexerPublicDataProvider } from '@midnight-ntwrk/midnight-js-indexer-public-data-provider';
import type { ConnectedAPI, InitialAPI } from '@midnight-ntwrk/dapp-connector-api';
import { Transaction, type FinalizedTransaction, type TransactionId } from '@midnight-ntwrk/ledger-v8';
import { createPoapPrivateState, createWitnesses, type PoapPrivateState } from './witnesses';
import type { ImpureCircuits } from './contract/managed/poap/contract/index.js';

export type PoapCircuitId = keyof ImpureCircuits<unknown>;

export const POAP_PRIVATE_STATE_KEY = 'poapPrivateState';
export const POAP_ZK_CONFIG_BASE_PATH = '/midnight/poap';
// 'undeployed' (local devnet, default) or 'preprod' — must match both the wallet extension's own
// configured network and REACT_APP_MIDNIGHT_CONTRACT_ADDRESS (a contract address only resolves on
// the network it was actually deployed to). See docs/environment.md in ../POAP-Midnight and
// deploy.ts's envConfig/TARGET_NETWORK for the backend-side counterpart of this same switch.
const NETWORK_ID = process.env.REACT_APP_MIDNIGHT_NETWORK_ID || 'undeployed';
// The proof server is local for every network, always — confirmed 2026-08-29/30 two ways:
// (1) docs.midnight.network/guides/networks-and-environments states it explicitly ("stays local
// for every network... it handles your private data"), and (2) empirically: Lace's
// getConfiguration().proverServerUri and its non-deprecated replacement getProvingProvider() BOTH
// still end up calling the REMOTE https://proof-server.preprod.midnight.network/prove from this
// page's own JS context (confirmed via the browser network tab), which that endpoint rejects with
// a CORS 403 — it isn't meant to be hit directly from an arbitrary DApp's browser tab. The local
// one (docker compose -f devnet.yml up -d proof-server from ../POAP-Midnight) does allow CORS
// (verified: OPTIONS /prove reflects Access-Control-Allow-Origin for this dev server's origin).
const PROOF_SERVER_URL = process.env.REACT_APP_MIDNIGHT_PROOF_SERVER_URL || 'http://localhost:6300';
const WALLET_POLL_INTERVAL_MS = 100;
const WALLET_DISCOVERY_TIMEOUT_MS = 5_000;
const WALLET_ENABLE_TIMEOUT_MS = 30_000;

export class LaceNotFoundError extends Error {
  constructor() {
    super('Could not find the Midnight Lace wallet. Is the extension installed?');
    this.name = 'LaceNotFoundError';
  }
}

export class LaceNotAuthorizedError extends Error {
  constructor() {
    super('Application is not authorized by the Midnight Lace wallet.');
    this.name = 'LaceNotAuthorizedError';
  }
}

// Lace's own connect() can succeed while the wallet is still locked (it doesn't itself prompt for
// the password) — the "locked" failure only surfaces on the first call that actually needs wallet
// data, like getShieldedAddresses() below. There's no dapp-connector-api method to force Lace's
// unlock popup open from here (by design — a page forcing a wallet's popup open on demand would be
// a phishing vector), so the best we can do is recognize this case and tell the user to unlock it
// themselves via the extension icon, instead of surfacing Lace's raw error string.
export class LaceLockedError extends Error {
  constructor() {
    super('Your Lace wallet is locked. Open the Lace extension and unlock it, then try connecting again.');
    this.name = 'LaceLockedError';
  }
}

function isLaceLockedError(error: unknown): boolean {
  return error instanceof Error && /locked/i.test(error.message);
}

// Every Midnight-compatible wallet we've tried, by its dapp-connector-api `rdns` — used both to
// filter window.midnight's discovery scan and to drive the wallet-connect popup's picker UI (see
// discoverCompatibleWallets/getWalletDisplayName below and laceWallet.jsx).
const COMPATIBLE_WALLET_RDNS = ['io.lace.wallet', 'com.midnight.1am'];

// Wallets register themselves under a freshly generated UUID key on `window.midnight` (CAIP-372-style
// multi-wallet discovery), not a fixed key — so we scan every entry's shape rather than
// reading one hardcoded property. See @midnight-ntwrk/dapp-connector-api's InitialAPI type and the
// official reference dapp's src/hooks/useWalletDetection.ts (github.com/midnightntwrk/midnight-wallet-dapp).
function findInitialAPIs(): InitialAPI[] {
  const midnight = window.midnight;
  if (!midnight) return [];
  return Object.values(midnight).filter(
    (candidate): candidate is InitialAPI =>
      Boolean(candidate) &&
      typeof candidate === 'object' &&
      typeof (candidate as InitialAPI).name === 'string' &&
      typeof (candidate as InitialAPI).apiVersion === 'string' &&
      typeof (candidate as InitialAPI).connect === 'function',
  );
}

function scanCompatibleWallets(): InitialAPI[] {
  return findInitialAPIs().filter((api) => COMPATIBLE_WALLET_RDNS.includes(api.rdns));
}

// Falls back to the connector's own self-reported `name` for anything not in this list, so a
// third wallet showing up later still renders something reasonable without a frontend change.
const WALLET_DISPLAY_NAMES: Record<string, string> = {
  'io.lace.wallet': 'Lace',
  'com.midnight.1am': '1am Wallet',
};

export function getWalletDisplayName(api: InitialAPI): string {
  return WALLET_DISPLAY_NAMES[api.rdns] ?? api.name;
}

// Lets the wallet-connect popup offer a choice when more than one Midnight-compatible extension
// is installed, instead of always silently connecting to whichever happened to be first in
// COMPATIBLE_WALLET_RDNS (the old waitForLaceApi() behavior). Extensions inject themselves into
// window.midnight essentially synchronously on page load, so this doesn't need the full
// WALLET_DISCOVERY_TIMEOUT_MS in the common case: once at least one wallet has been seen, it only
// waits a short settle window for a second one to show up before returning, falling back to the
// full timeout only when nothing appears at all.
const WALLET_DISCOVERY_SETTLE_MS = 300;

export async function discoverCompatibleWallets(): Promise<InitialAPI[]> {
  const started = Date.now();
  let firstFoundAt: number | null = null;
  let found: InitialAPI[] = [];
  while (Date.now() - started < WALLET_DISCOVERY_TIMEOUT_MS) {
    found = scanCompatibleWallets();
    if (found.length > 0) {
      if (firstFoundAt === null) firstFoundAt = Date.now();
      if (Date.now() - firstFoundAt >= WALLET_DISCOVERY_SETTLE_MS) break;
    }
    await new Promise((resolve) => setTimeout(resolve, WALLET_POLL_INTERVAL_MS));
  }
  return found;
}

export type WalletConnection = {
  connectedApi: ConnectedAPI;
  shieldedAddress: { shieldedAddress: string; shieldedCoinPublicKey: string; shieldedEncryptionPublicKey: string };
};

// Connects to a specific wallet the user already picked (from discoverCompatibleWallets()'s
// results) rather than auto-selecting one — see laceWallet.jsx's wallet-picker UI. The error
// classes below predate multi-wallet support and are named after Lace, but the failure modes
// they represent (connector rejects the authorization request, wallet is locked) are generic to
// any dapp-connector-api-compliant wallet, so they're reused as-is for 1am too.
export async function connectToWallet(api: InitialAPI): Promise<WalletConnection> {
  return connectToWalletForNetwork(api, NETWORK_ID);
}

// Same as connectToWallet, but with the network hint passed in instead of read from the app-wide
// REACT_APP_MIDNIGHT_NETWORK_ID build-time env var — for admin-deploy.service.ts, where the admin
// picks the target network on the page itself (it must match whatever network Lace is actually
// configured for right then, which need not be this app's own configured network at all — e.g.
// deploying a fresh contract to preprod from a build whose REACT_APP_MIDNIGHT_NETWORK_ID is still
// 'undeployed'). Lace rejects connect() outright with LaceNotAuthorizedError if the hinted network
// doesn't match its own current one — confirmed 2026-08-29 — so getting this value right matters.
export async function connectToWalletForNetwork(api: InitialAPI, networkId: string): Promise<WalletConnection> {
  // midnight-js-contracts reads this global on every circuit call (createUnprovenCallTx etc.) —
  // must be set before any wallet/contract operation, not just before connecting.
  setNetworkId(networkId);
  console.log('[connectToWallet] connecting to', api.name, api.rdns, 'on', networkId);

  let connectedApi: ConnectedAPI;
  try {
    console.log('[connectToWallet] calling api.connect()…');
    const connectPromise = api.connect(networkId);
    const timeout = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error('timed out waiting for wallet authorization')), WALLET_ENABLE_TIMEOUT_MS),
    );
    connectedApi = await Promise.race([connectPromise, timeout]);
    console.log('[connectToWallet] api.connect() resolved');
  } catch (error) {
    console.log('[connectToWallet] api.connect() failed:', error);
    throw new LaceNotAuthorizedError();
  }

  let shieldedAddress: WalletConnection['shieldedAddress'];
  try {
    console.log('[connectToWallet] calling getShieldedAddresses()…');
    shieldedAddress = await connectedApi.getShieldedAddresses();
    console.log('[connectToWallet] getShieldedAddresses() resolved:', shieldedAddress);
  } catch (error) {
    console.log('[connectToWallet] getShieldedAddresses() failed:', error);
    if (isLaceLockedError(error)) throw new LaceLockedError();
    throw error;
  }
  return { connectedApi, shieldedAddress };
}

// ── Transaction bridging ────────────────────────────────────────────────────
//
// The wallet's ConnectedAPI works with hex-encoded serialized transactions, not the ledger's own
// Transaction objects — bridge by serializing/deserializing on each side. Mirrors the official
// reference dapp's src/lib/walletAdapter.ts (dapp-connector-api@4.0.1 + ledger-v8@8.1.0, the exact
// generation our installed packages and the user's Lace both report).

function uint8ArrayToHex(bytes: Uint8Array): string {
  return Array.from(bytes)
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('');
}

// compact-js's Effect-based internals wrap failures as FiberFailure, whose `.message` is always
// empty and whose real content lives in an opaque `effect` Cause object — plain console.error/
// JSON.stringify shows neither. Cause.pretty renders the actual nested error/defect.
function logFiberFailure(label: string, error: unknown): void {
  console.error(`[${label}] raw error:`, error);
  const cause = (error as { cause?: unknown })?.cause;
  if (cause && typeof cause === 'object' && '_id' in cause && (cause as { _id: unknown })._id === 'Cause') {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    console.error(`[${label}] Cause.pretty:`, Cause.pretty(cause as any));
    const failure = (cause as { failure?: unknown }).failure;
    console.error(`[${label}] cause.failure (raw):`, failure);
    if (failure && typeof failure === 'object') {
      console.error(`[${label}] cause.failure keys:`, Object.keys(failure as object));
      console.error(
        `[${label}] cause.failure JSON:`,
        JSON.stringify(failure, Object.getOwnPropertyNames(failure)),
      );
    }
  }
}

function hexToUint8Array(hex: string): Uint8Array {
  const matches = hex.match(/.{1,2}/g);
  return new Uint8Array((matches ?? []).map((byte) => parseInt(byte, 16)));
}

export async function buildProviders(connection: WalletConnection) {
  const { connectedApi, shieldedAddress } = connection;

  const zkConfigProvider = new FetchZkConfigProvider<PoapCircuitId>(
    `${window.location.origin}${POAP_ZK_CONFIG_BASE_PATH}`,
    fetch.bind(window),
  );

  console.log('[buildProviders] calling getConfiguration()…');
  const config = await connectedApi.getConfiguration();
  console.log('[buildProviders] getConfiguration() resolved:', config);

  const rawPrivateStateProvider = levelPrivateStateProvider<{ [POAP_PRIVATE_STATE_KEY]: PoapPrivateState }>({
    // Local dev only: private state is encrypted at rest and now requires a password. There's no
    // real secret to protect beyond what's already in this browser profile's private state, so a
    // fixed password is fine here — do not reuse this pattern for anything storing real value.
    // Must satisfy midnight-js-utils' validatePassword policy: 16+ chars, at least 3 of
    // {upper, lower, digit, special}, no 4+ repeated/sequential chars.
    privateStoragePasswordProvider: () => 'AdaSouls-Local-Dev-2026!',
    accountId: shieldedAddress.shieldedAddress,
  });
  const rawPublicDataProvider = indexerPublicDataProvider(config.indexerUri, config.indexerWsUri);

  return {
    privateStateProvider: {
      ...rawPrivateStateProvider,
      async set(id: typeof POAP_PRIVATE_STATE_KEY, state: PoapPrivateState) {
        try {
          return await rawPrivateStateProvider.set(id, state);
        } catch (error) {
          logFiberFailure('privateStateProvider.set', error);
          throw error;
        }
      },
    },
    zkConfigProvider,
    proofProvider: httpClientProofProvider(PROOF_SERVER_URL, zkConfigProvider),
    publicDataProvider: {
      ...rawPublicDataProvider,
      async watchForTxData(...args: Parameters<typeof rawPublicDataProvider.watchForTxData>) {
        try {
          return await rawPublicDataProvider.watchForTxData(...args);
        } catch (error) {
          logFiberFailure('publicDataProvider.watchForTxData', error);
          throw error;
        }
      },
    },
    walletProvider: {
      getCoinPublicKey: () => shieldedAddress.shieldedCoinPublicKey,
      getEncryptionPublicKey: () => shieldedAddress.shieldedEncryptionPublicKey,
      async balanceTx(tx: UnboundTransaction): Promise<FinalizedTransaction> {
        const serializedStr = uint8ArrayToHex(tx.serialize());
        let result: { tx: string };
        try {
          result = await connectedApi.balanceUnsealedTransaction(serializedStr);
        } catch (error) {
          logFiberFailure('walletProvider.balanceTx', error);
          throw error;
        }
        const resultBytes = hexToUint8Array(result.tx);
        return Transaction.deserialize('signature', 'proof', 'binding', resultBytes) as FinalizedTransaction;
      },
    },
    midnightProvider: {
      async submitTx(tx: FinalizedTransaction): Promise<TransactionId> {
        const serializedStr = uint8ArrayToHex(tx.serialize());
        // submitTransaction returns void in this API generation — the wallet no longer hands back
        // a transaction id, so we derive it locally from the transaction we already have.
        try {
          await connectedApi.submitTransaction(serializedStr);
        } catch (error) {
          logFiberFailure('midnightProvider.submitTx', error);
          throw error;
        }
        return tx.identifiers()[0];
      },
    },
  };
}

export async function getOrCreatePrivateState(
  providers: Awaited<ReturnType<typeof buildProviders>>,
): Promise<{ privateState: PoapPrivateState; isNew: boolean }> {
  const existing = await providers.privateStateProvider.get(POAP_PRIVATE_STATE_KEY);
  if (existing) return { privateState: existing, isNew: false };

  const secretKey = new Uint8Array(32);
  crypto.getRandomValues(secretKey);
  return { privateState: createPoapPrivateState(secretKey), isNew: true };
}

export { createWitnesses };
