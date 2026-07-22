import {
  type BalancedTransaction,
  type UnbalancedTransaction,
  createBalancedTx,
} from '@midnight-ntwrk/midnight-js-types';
import { Transaction as LedgerTransaction, type CoinInfo as LedgerCoinInfo, type TransactionId } from '@midnight-ntwrk/ledger';
import type { CoinInfo as ZswapCoinInfo, Transaction as ZswapTransactionType } from '@midnight-ntwrk/zswap';
import { getNetworkId, toZswapNetworkId } from '@midnight-ntwrk/midnight-js-network-id';
import { levelPrivateStateProvider } from '@midnight-ntwrk/midnight-js-level-private-state-provider';
import { FetchZkConfigProvider } from '@midnight-ntwrk/midnight-js-fetch-zk-config-provider';
import { httpClientProofProvider } from '@midnight-ntwrk/midnight-js-http-client-proof-provider';
import { indexerPublicDataProvider } from '@midnight-ntwrk/midnight-js-indexer-public-data-provider';
import type { DAppConnectorAPI, DAppConnectorWalletAPI, ServiceUriConfig } from '@midnight-ntwrk/dapp-connector-api';
import semver from 'semver';
import { createPoapPrivateState, createWitnesses, type PoapPrivateState } from './witnesses';
import type { ImpureCircuits } from './contract/managed/poap/contract/index.cjs';

// @midnight-ntwrk/zswap only ships a wasm-bindgen CJS build (no "module"/ESM entry) that
// reassigns `module.exports` as a WASM import placeholder before defining its exports — this
// breaks webpack's static CommonJS named-export analysis (even `import * as` gets treated as
// "default export only"). require() bypasses that analysis entirely.
// eslint-disable-next-line @typescript-eslint/no-var-requires
const zswap: typeof import('@midnight-ntwrk/zswap') = require('@midnight-ntwrk/zswap');
const ZswapTransaction: typeof ZswapTransactionType = zswap.Transaction;

export type PoapCircuitId = keyof ImpureCircuits<unknown>;

export const POAP_PRIVATE_STATE_KEY = 'poapPrivateState';
export const POAP_ZK_CONFIG_BASE_PATH = '/midnight/poap';
const COMPATIBLE_CONNECTOR_API_VERSION = '1.x';
const WALLET_POLL_INTERVAL_MS = 100;
const WALLET_DISCOVERY_TIMEOUT_MS = 5_000;
const WALLET_ENABLE_TIMEOUT_MS = 30_000;

// `window.midnight` itself is already declared by @midnight-ntwrk/dapp-connector-api's own
// ambient types (dist/globals.d.ts) as `{ [key: string]: DAppConnectorAPI }` — do not redeclare it
// here, a second incompatible `declare global` for the same property is a compile error.

export class LaceNotFoundError extends Error {
  constructor() {
    super('Could not find the Midnight Lace wallet. Is the extension installed?');
    this.name = 'LaceNotFoundError';
  }
}

export class LaceVersionMismatchError extends Error {
  constructor(actual: string) {
    super(`Incompatible Midnight Lace wallet version. Require '${COMPATIBLE_CONNECTOR_API_VERSION}', got '${actual}'.`);
    this.name = 'LaceVersionMismatchError';
  }
}

export class LaceNotAuthorizedError extends Error {
  constructor() {
    super('Application is not authorized by the Midnight Lace wallet.');
    this.name = 'LaceNotAuthorizedError';
  }
}

async function waitForConnectorApi(): Promise<DAppConnectorAPI> {
  const started = Date.now();
  while (Date.now() - started < WALLET_DISCOVERY_TIMEOUT_MS) {
    const api = window.midnight?.mnLace;
    if (api) return api;
    await new Promise((resolve) => setTimeout(resolve, WALLET_POLL_INTERVAL_MS));
  }
  throw new LaceNotFoundError();
}

export type WalletConnection = {
  wallet: DAppConnectorWalletAPI;
  uris: ServiceUriConfig;
  coinPublicKey: string;
};

export async function connectToLace(): Promise<WalletConnection> {
  const connectorApi = await waitForConnectorApi();

  if (!semver.satisfies(connectorApi.apiVersion, COMPATIBLE_CONNECTOR_API_VERSION)) {
    throw new LaceVersionMismatchError(connectorApi.apiVersion);
  }

  let wallet: DAppConnectorWalletAPI;
  try {
    const enablePromise = connectorApi.enable();
    const timeout = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error('timed out waiting for wallet authorization')), WALLET_ENABLE_TIMEOUT_MS),
    );
    wallet = await Promise.race([enablePromise, timeout]);
  } catch (error) {
    throw new LaceNotAuthorizedError();
  }

  const uris = await connectorApi.serviceUriConfig();
  const walletState = await wallet.state();

  return { wallet, uris, coinPublicKey: walletState.coinPublicKey };
}

// ── Ledger <-> Zswap transaction/coin bridging ────────────────────────────────
//
// midnight-js-types' UnbalancedTransaction/BalancedTransaction (used by the generic providers,
// and by the compiled contract's circuit calls) wrap @midnight-ntwrk/ledger's Transaction.
// The Lace wallet's DAppConnectorWalletAPI (from @midnight-ntwrk/dapp-connector-api, whose own
// registry-declared dependency is zswap ^0.3.8 but which resolves zswap ^3.0.2 transitively via
// @midnight-ntwrk/wallet-api in this install) operates on @midnight-ntwrk/zswap's Transaction/
// CoinInfo instead. These are different generations of the same wire format; both expose
// serialize()/deserialize() so we round-trip through bytes to bridge them. CoinInfo has an
// identical structural shape ({ type: string, nonce: string, value: bigint }) in both packages,
// so it's safe to pass through directly without conversion.
//
// NOT YET VERIFIED AGAINST A LIVE NODE — confirm this round-trip actually produces a transaction
// the node accepts once the devnet is reachable (Phase 2 verification).

function currentZswapNetworkId() {
  const id = getNetworkId();
  if (!id) {
    throw new Error('Midnight network id not set — call setNetworkId() during app startup before connecting a wallet.');
  }
  return toZswapNetworkId(id);
}

function ledgerToZswapTx(tx: LedgerTransaction): ZswapTransaction {
  return ZswapTransaction.deserialize(tx.serialize(), currentZswapNetworkId());
}

function zswapToLedgerTx(tx: ZswapTransaction): LedgerTransaction {
  return LedgerTransaction.deserialize(tx.serialize(currentZswapNetworkId()));
}

export async function buildProviders(connection: WalletConnection) {
  const { wallet, uris } = connection;

  return {
    privateStateProvider: levelPrivateStateProvider<{ [POAP_PRIVATE_STATE_KEY]: PoapPrivateState }>({
      privateStateStoreName: 'adasouls-poap-private-state',
    }),
    zkConfigProvider: new FetchZkConfigProvider<PoapCircuitId>(
      `${window.location.origin}${POAP_ZK_CONFIG_BASE_PATH}`,
      fetch.bind(window),
    ),
    proofProvider: httpClientProofProvider(uris.proverServerUri),
    publicDataProvider: indexerPublicDataProvider(uris.indexerUri, uris.indexerWsUri),
    walletProvider: {
      coinPublicKey: connection.coinPublicKey,
      async balanceTx(tx: UnbalancedTransaction, newCoins: LedgerCoinInfo[]): Promise<BalancedTransaction> {
        const provenZswapTx = await wallet.balanceAndProveTransaction(
          ledgerToZswapTx(tx.tx),
          newCoins as unknown as ZswapCoinInfo[],
        );
        return createBalancedTx(zswapToLedgerTx(provenZswapTx));
      },
    },
    midnightProvider: {
      submitTx(tx: BalancedTransaction): Promise<TransactionId> {
        return wallet.submitTransaction(ledgerToZswapTx(tx.tx) as unknown as Parameters<typeof wallet.submitTransaction>[0]);
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
