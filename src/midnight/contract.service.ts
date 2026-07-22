import { encodeCoinPublicKey } from '@midnight-ntwrk/compact-runtime';
import type { ContractAddress } from '@midnight-ntwrk/ledger';
import { findDeployedContract, withZswapWitnesses, type StateWithZswap } from '@midnight-ntwrk/midnight-js-contracts';
import { combineLatest, firstValueFrom, from, map, type Observable } from 'rxjs';
// Named ESM imports from this compiled CJS module don't reliably resolve under webpack's static
// export analysis (`exports.Contract = Contract` isn't always picked up) — import the module
// namespace instead and destructure at runtime.
import * as PoapContractModule from './contract/managed/poap/contract/index.cjs';
import type { Ledger } from './contract/managed/poap/contract/index.cjs';
import {
  POAP_PRIVATE_STATE_KEY,
  buildProviders,
  connectToLace,
  createWitnesses,
  getOrCreatePrivateState,
} from './providers';
import type { PoapPrivateState, TokenRecord } from './witnesses';

const { Contract, ledger: ledgerOf } = PoapContractModule;

export type PoapProviders = Awaited<ReturnType<typeof buildProviders>>;

export type PoapState = {
  ledger: Ledger;
  privateState: PoapPrivateState;
};

function createPoapContract(coinPublicKey: string) {
  const zswapWitnesses = withZswapWitnesses(createWitnesses())(encodeCoinPublicKey(coinPublicKey));
  return new Contract<StateWithZswap<PoapPrivateState>>(zswapWitnesses);
}

// Mirrors the verified `BBoardAPI` pattern from the Midnight `bboard` reference example:
// findDeployedContract(providers, contractAddress, contractInstance, { privateStateKey, initialPrivateState }),
// then call circuits via `deployedContract.contractCircuitsInterface.<circuit>(...)`.
export class PoapContractService {
  private constructor(
    private readonly deployedContract: Awaited<ReturnType<typeof findDeployedContract>>,
    private readonly providers: PoapProviders,
    readonly contractAddress: ContractAddress,
  ) {}

  static async connect(contractAddress: ContractAddress): Promise<PoapContractService> {
    const connection = await connectToLace();
    const providers = await buildProviders(connection);
    const { privateState, isNew } = await getOrCreatePrivateState(providers);

    // findDeployedContract's initialPrivateState must only be passed the first time (it requires
    // there be NO pre-existing private state at this key); on subsequent connects it loads the
    // existing state from the provider itself, so we omit it.
    const deployedContract = await findDeployedContract(
      providers,
      contractAddress,
      createPoapContract(connection.coinPublicKey),
      isNew
        ? { privateStateKey: POAP_PRIVATE_STATE_KEY, initialPrivateState: privateState }
        : { privateStateKey: POAP_PRIVATE_STATE_KEY },
    );

    return new PoapContractService(deployedContract, providers, contractAddress);
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

  // NOTE: unlike claimOrUpdate/createEvent/etc. (Void circuits returning {txHash, blockHeight}),
  // getCallerPk returns a real value (Uint8Array). The exact shape of a value-returning circuit
  // call's resolved object isn't verified yet from the bboard reference (which only exercises
  // Void circuits) — confirm the `result` field name at runtime in Phase 3 before relying on this.
  async getCallerPk(): Promise<Uint8Array> {
    const callResult = await this.deployedContract.contractCircuitsInterface.getCallerPk();
    return (callResult as unknown as { result: Uint8Array }).result;
  }

  async claimOrUpdate(eventId: Uint8Array, isSoulbound: boolean) {
    return this.deployedContract.contractCircuitsInterface.claimOrUpdate(eventId, isSoulbound);
  }

  async createEvent(eventId: Uint8Array, maxSupply: bigint, expiration: bigint, isPublicMint: boolean) {
    return this.deployedContract.contractCircuitsInterface.createEvent(eventId, maxSupply, expiration, isPublicMint);
  }

  async deactivateEvent(eventId: Uint8Array) {
    return this.deployedContract.contractCircuitsInterface.deactivateEvent(eventId);
  }

  async mintTo(eventId: Uint8Array, recipientPk: Uint8Array) {
    return this.deployedContract.contractCircuitsInterface.mintTo(eventId, recipientPk);
  }

  async burn(tokenId: bigint) {
    return this.deployedContract.contractCircuitsInterface.burn(tokenId);
  }

  async pause() {
    return this.deployedContract.contractCircuitsInterface.pause();
  }

  async unpause() {
    return this.deployedContract.contractCircuitsInterface.unpause();
  }

  async registerIssuer(issuerPk: Uint8Array) {
    return this.deployedContract.contractCircuitsInterface.registerIssuer(issuerPk);
  }

  async deactivateIssuer(issuerPk: Uint8Array) {
    return this.deployedContract.contractCircuitsInterface.deactivateIssuer(issuerPk);
  }
}

export type { TokenRecord };
