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
// Local devnet only — see docs/environment.md in ../POAP-Midnight and deploy.ts's envConfig.
const NETWORK_ID = 'undeployed';
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

// Lace registers itself under a freshly generated UUID key on `window.midnight` (CAIP-372-style
// multi-wallet discovery), not a fixed `mnLace` key — so we scan every entry's shape rather than
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

async function waitForLaceApi(): Promise<InitialAPI> {
  const started = Date.now();
  while (Date.now() - started < WALLET_DISCOVERY_TIMEOUT_MS) {
    const lace = findInitialAPIs().find((api) => api.rdns === 'io.lace.wallet');
    if (lace) return lace;
    await new Promise((resolve) => setTimeout(resolve, WALLET_POLL_INTERVAL_MS));
  }
  throw new LaceNotFoundError();
}

export type WalletConnection = {
  connectedApi: ConnectedAPI;
  shieldedAddress: { shieldedAddress: string; shieldedCoinPublicKey: string; shieldedEncryptionPublicKey: string };
};

export async function connectToLace(): Promise<WalletConnection> {
  // midnight-js-contracts reads this global on every circuit call (createUnprovenCallTx etc.) —
  // must be set before any wallet/contract operation, not just before connecting.
  setNetworkId(NETWORK_ID);
  const api = await waitForLaceApi();

  let connectedApi: ConnectedAPI;
  try {
    const connectPromise = api.connect(NETWORK_ID);
    const timeout = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error('timed out waiting for wallet authorization')), WALLET_ENABLE_TIMEOUT_MS),
    );
    connectedApi = await Promise.race([connectPromise, timeout]);
  } catch (error) {
    throw new LaceNotAuthorizedError();
  }

  const shieldedAddress = await connectedApi.getShieldedAddresses();
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

  const config = await connectedApi.getConfiguration();

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
    proofProvider: httpClientProofProvider(config.proverServerUri!, zkConfigProvider),
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
