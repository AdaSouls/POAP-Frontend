import { CompiledContract } from '@midnight-ntwrk/midnight-js-protocol/compact-js';
import type { ContractAddress } from '@midnight-ntwrk/ledger-v8';
import { findDeployedContract, type FoundContract } from '@midnight-ntwrk/midnight-js-contracts';
import type { InitialAPI } from '@midnight-ntwrk/dapp-connector-api';
import { combineLatest, firstValueFrom, from, map, type Observable } from 'rxjs';
import { Contract, ledger as ledgerOf } from './contract/managed/poap/contract/index.js';
import type { Ledger } from './contract/managed/poap/contract/index.js';
import {
  POAP_PRIVATE_STATE_KEY,
  buildProviders,
  connectToWallet,
  createWitnesses,
  getOrCreatePrivateState,
} from './providers';
import { deriveCallerPk, type PoapPrivateState, type TokenRecord } from './witnesses';

export type PoapProviders = Awaited<ReturnType<typeof buildProviders>>;

export type PoapState = {
  ledger: Ledger;
  privateState: PoapPrivateState;
};

const compiledPoapContract = CompiledContract.make<Contract<PoapPrivateState>>('PoapContract', Contract).pipe(
  CompiledContract.withWitnesses(createWitnesses()),
);

// Mirrors the pattern verified against a live devnet in ../POAP-Midnight/scripts/deploy.ts:
// CompiledContract.make(tag, ctor).pipe(withWitnesses(...)), then findDeployedContract(providers,
// options), then call circuits via `foundContract.callTx.<circuit>(...)`.
export class PoapContractService {
  private constructor(
    private readonly deployedContract: FoundContract<Contract<PoapPrivateState>>,
    private readonly providers: PoapProviders,
    private readonly privateState: PoapPrivateState,
    readonly contractAddress: ContractAddress,
    // Cheap, wallet-unique identifier available immediately on connect (no extra tx) — used to
    // scope useMidnight.js's caller-pk cache per wallet, so switching wallets in the same browser
    // profile can't serve a stale pk derived from a different wallet.
    readonly walletCoinPublicKey: string,
  ) {}

  static async connect(contractAddress: ContractAddress, wallet: InitialAPI): Promise<PoapContractService> {
    console.log('[PoapContractService.connect] connectToWallet()…');
    const connection = await connectToWallet(wallet);
    console.log('[PoapContractService.connect] connectToWallet() resolved');
    const providers = await buildProviders(connection);
    console.log('[PoapContractService.connect] buildProviders() resolved');
    // Required before any private-state get/set — scopes storage to this contract address
    // (namespace isolation between different contracts sharing the same browser profile).
    providers.privateStateProvider.setContractAddress(contractAddress);
    const { privateState, isNew } = await getOrCreatePrivateState(providers);
    console.log('[PoapContractService.connect] getOrCreatePrivateState() resolved, isNew:', isNew);

    // findDeployedContract's initialPrivateState must only be passed the first time (it requires
    // there be NO pre-existing private state at this key); on subsequent connects it loads the
    // existing state from the provider itself, so we omit it.
    console.log('[PoapContractService.connect] findDeployedContract()…');
    const deployedContract = await findDeployedContract(providers, {
      compiledContract: compiledPoapContract,
      contractAddress,
      privateStateId: POAP_PRIVATE_STATE_KEY,
      ...(isNew ? { initialPrivateState: privateState } : {}),
    });
    console.log('[PoapContractService.connect] findDeployedContract() resolved');

    return new PoapContractService(
      deployedContract,
      providers,
      privateState,
      contractAddress,
      connection.shieldedAddress.shieldedCoinPublicKey,
    );
  }

  /** Reactive stream combining public ledger state with this browser's private token state. */
  get state$(): Observable<PoapState> {
    return combineLatest([
      this.providers.publicDataProvider
        .contractStateObservable(this.contractAddress, { type: 'latest' })
        .pipe(map((contractState) => ledgerOf(contractState.data))),
      from(this.providers.privateStateProvider.get(POAP_PRIVATE_STATE_KEY) as Promise<PoapPrivateState>),
    ]).pipe(map(([ledger, privateState]) => ({ ledger, privateState })));
  }

  /** One-shot snapshot of state$, for callers that just need a single read (e.g. role checks). */
  async getState(): Promise<PoapState> {
    return firstValueFrom(this.state$);
  }

  // getCallerPk *is* an exported circuit, but the compiler leaves it out of provableCircuits
  // (it discloses nothing, so nothing to prove) — midnight-js-contracts' callTx is built strictly
  // from provableCircuits, so `callTx.getCallerPk` doesn't exist (confirmed 2026-08-14: "is not a
  // function" at runtime, and via midnight-js-contracts' own source). Derived locally instead —
  // see deriveCallerPk's comment in witnesses.ts for why this is safe against drift.
  async getCallerPkHex(): Promise<string> {
    return Buffer.from(deriveCallerPk(this.privateState.secretKey)).toString('hex');
  }

  async claimOrUpdate(eventId: Uint8Array, isSoulbound: boolean) {
    return this.deployedContract.callTx.claimOrUpdate(eventId, isSoulbound);
  }

  // privateMetadataCommit: Bytes<32> — commit/reveal hook for private event metadata (see
  // POAP-Midnight's revealPrivateMetadata circuit). No frontend UI collects this yet, so callers
  // pass an all-zero commit (matches deploy.ts's demo event), meaning "no private part".
  async createEvent(
    eventId: Uint8Array,
    maxSupply: bigint,
    expiration: bigint,
    isPublicMint: boolean,
    metadataURI: string,
    privateMetadataCommit: Uint8Array = new Uint8Array(32),
  ) {
    return this.deployedContract.callTx.createEvent(
      eventId,
      maxSupply,
      expiration,
      isPublicMint,
      metadataURI,
      privateMetadataCommit,
    );
  }

  async deactivateEvent(eventId: Uint8Array) {
    return this.deployedContract.callTx.deactivateEvent(eventId);
  }

  async mintTo(eventId: Uint8Array, recipientPk: Uint8Array) {
    return this.deployedContract.callTx.mintTo(eventId, recipientPk);
  }

  async burn(tokenId: bigint) {
    return this.deployedContract.callTx.burn(tokenId);
  }

  async pause() {
    return this.deployedContract.callTx.pause();
  }

  async unpause() {
    return this.deployedContract.callTx.unpause();
  }

  async registerIssuer(issuerPk: Uint8Array) {
    return this.deployedContract.callTx.registerIssuer(issuerPk);
  }

  async deactivateIssuer(issuerPk: Uint8Array) {
    return this.deployedContract.callTx.deactivateIssuer(issuerPk);
  }
}

export type { TokenRecord };
