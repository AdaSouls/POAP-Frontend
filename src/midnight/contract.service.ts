import { CompiledContract } from '@midnight-ntwrk/midnight-js-protocol/compact-js';
import type { ContractAddress } from '@midnight-ntwrk/ledger-v8';
import { findDeployedContract, type FoundContract } from '@midnight-ntwrk/midnight-js-contracts';
import type { InitialAPI } from '@midnight-ntwrk/dapp-connector-api';
import { combineLatest, firstValueFrom, from, map, type Observable } from 'rxjs';
import { Contract, ledger as ledgerOf, pureCircuits } from './contract/managed/poap/contract/index.js';
import type { Ledger } from './contract/managed/poap/contract/index.js';
import {
  POAP_PRIVATE_STATE_KEY,
  buildProviders,
  connectToWallet,
  createWitnesses,
  getOrCreatePrivateState,
} from './providers';
import { deriveCallerPk, deriveHolderPk, type PoapPrivateState, type TokenRecord } from './witnesses';

export type PoapProviders = Awaited<ReturnType<typeof buildProviders>>;

// Pure — no ledger/witness access, no proof, no transaction (confirmed in the compiled contract:
// exported as a standalone pureCircuits function, not part of provableCircuits/callTx at all).
// This *is* the compiled contract's own persistentCommit computation, not a hand-reimplementation,
// so there's no drift risk the way there was for deriveCallerPk/deriveHolderPk. Not a
// PoapContractService method since it needs no connection — organizers compute this locally before
// createEvent, from a value/rand pair that never touches the network until the transaction itself.
export function computePrivateMetadataCommit(value: Uint8Array, rand: Uint8Array): Uint8Array {
  return pureCircuits.computePrivateMetadataCommit(value, rand);
}

export type PoapState = {
  ledger: Ledger;
  privateState: PoapPrivateState;
};

// Exported for admin-deploy.service.ts's deployContract() call — same compiled contract, no
// witness-binding difference between connecting to an existing deployment and deploying a new one
// (createWitnesses() reads secretKey from the private-state context either way, not a closure).
export const compiledPoapContract = CompiledContract.make<Contract<PoapPrivateState>>('PoapContract', Contract).pipe(
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

  // Same provableCircuits exclusion as getCallerPk above — see deriveHolderPk's comment in
  // witnesses.ts. This is the value a subscriber hands an organizer so that organizer can
  // mintTo(eventId, thisValue) them — NOT their caller pk / wallet address, which is a different,
  // globally-correlatable value and would result in an unrecoverable mint if used here by mistake.
  async getHolderPkHex(issuerId: Uint8Array): Promise<string> {
    return Buffer.from(deriveHolderPk(this.privateState.secretKey, issuerId)).toString('hex');
  }

  async claim(eventId: Uint8Array, isSoulbound: boolean) {
    return this.deployedContract.callTx.claim(eventId, isSoulbound);
  }

  // privateMetadataCommit: Bytes<32> — commit/reveal hook for an event's optional extra-info field
  // (see computePrivateMetadataCommit above and revealPrivateMetadata below). Independent of
  // isPublicMint — createEvent.jsx's own step 4 has a separate public/private switch for this
  // specific field. Defaults to the all-zero "no private part" commit for callers that don't set
  // one (including when the field is left public, or empty).
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

  // Publishes `value` into the public eventRevealedMetadata ledger map, once it's verified to
  // match the event's own privateMetadataCommit (computePrivateMetadataCommit(value, rand)). No
  // identity check on-chain — knowing (value, rand) is itself the authorization, so this is safe
  // to call with whatever the organizer locally stored at createEvent time.
  async revealPrivateMetadata(eventId: Uint8Array, value: Uint8Array, rand: Uint8Array) {
    return this.deployedContract.callTx.revealPrivateMetadata(eventId, value, rand);
  }

  // Same commit/reveal mechanism as revealPrivateMetadata above, but for one specific token's
  // private field (tokenPrivateMetadataCommit) instead of the event-level one.
  async revealPrivateTokenMetadata(tokenId: bigint, value: Uint8Array, rand: Uint8Array) {
    return this.deployedContract.callTx.revealPrivateTokenMetadata(tokenId, value, rand);
  }

  // tokenMetadataURI/tokenPrivateMetadataCommit let the organizer personalize this specific
  // recipient's token. The contract stores exactly what's passed here — there's no on-chain
  // fallback to the event's own metadataURI/privateMetadataCommit, so callers that want to mirror
  // the event (the common case) must pass ev.metadataURI/ev.privateMetadataCommit explicitly. The
  // defaults below (empty URI, all-zero commit) mean "this token has no metadata", not "inherit".
  async mintTo(
    eventId: Uint8Array,
    recipientPk: Uint8Array,
    tokenMetadataURI: string = '',
    tokenPrivateMetadataCommit: Uint8Array = new Uint8Array(32),
  ) {
    return this.deployedContract.callTx.mintTo(eventId, recipientPk, tokenMetadataURI, tokenPrivateMetadataCommit);
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
