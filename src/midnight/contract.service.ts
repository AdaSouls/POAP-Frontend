import { CompiledContract } from '@midnight-ntwrk/midnight-js-protocol/compact-js';
import type { ContractAddress } from '@midnight-ntwrk/ledger-v8';
import { findDeployedContract, type FoundContract } from '@midnight-ntwrk/midnight-js-contracts';
import { combineLatest, firstValueFrom, from, map, type Observable } from 'rxjs';
import { Contract, ledger as ledgerOf } from './contract/managed/poap/contract/index.js';
import type { Ledger } from './contract/managed/poap/contract/index.js';
import {
  POAP_PRIVATE_STATE_KEY,
  buildProviders,
  connectToLace,
  createWitnesses,
  getOrCreatePrivateState,
} from './providers';
import type { PoapPrivateState, TokenRecord } from './witnesses';

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
  ) {}

  static async connect(contractAddress: ContractAddress): Promise<PoapContractService> {
    const connection = await connectToLace();
    const providers = await buildProviders(connection);
    // Required before any private-state get/set — scopes storage to this contract address
    // (namespace isolation between different contracts sharing the same browser profile).
    providers.privateStateProvider.setContractAddress(contractAddress);
    const { privateState, isNew } = await getOrCreatePrivateState(providers);

    // findDeployedContract's initialPrivateState must only be passed the first time (it requires
    // there be NO pre-existing private state at this key); on subsequent connects it loads the
    // existing state from the provider itself, so we omit it.
    const deployedContract = await findDeployedContract(providers, {
      compiledContract: compiledPoapContract,
      contractAddress,
      privateStateId: POAP_PRIVATE_STATE_KEY,
      ...(isNew ? { initialPrivateState: privateState } : {}),
    });

    return new PoapContractService(deployedContract, providers, privateState, contractAddress);
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

  // getCallerPk is an exported circuit (confirmed against poap.compact directly, 2026-08-11) —
  // call it rather than re-deriving the pk client-side, so this can't drift if the contract's
  // domain separator ever changes.
  async getCallerPkHex(): Promise<string> {
    const { private: callResult } = await this.deployedContract.callTx.getCallerPk();
    return Buffer.from(callResult.result).toString('hex');
  }

  async claimOrUpdate(eventId: Uint8Array, isSoulbound: boolean) {
    return this.deployedContract.callTx.claimOrUpdate(eventId, isSoulbound);
  }

  async createEvent(eventId: Uint8Array, maxSupply: bigint, expiration: bigint, isPublicMint: boolean) {
    return this.deployedContract.callTx.createEvent(eventId, maxSupply, expiration, isPublicMint);
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
