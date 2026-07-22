import type * as __compactRuntime from '@midnight-ntwrk/compact-runtime';

export type Witnesses<T> = {
  local_sk(context: __compactRuntime.WitnessContext<Ledger, T>): [T, Uint8Array];
  get_my_token_for_issuer(context: __compactRuntime.WitnessContext<Ledger, T>,
                          issuerId: Uint8Array): [T, { is_some: boolean,
                                                       value: bigint
                                                     }];
  store_token(context: __compactRuntime.WitnessContext<Ledger, T>,
              tokenId: bigint,
              issuerId: Uint8Array,
              eventId: Uint8Array,
              isSoulbound: boolean): [T, void];
  store_attendance(context: __compactRuntime.WitnessContext<Ledger, T>,
                   tokenId: bigint,
                   issuerId: Uint8Array,
                   eventId: Uint8Array): [T, void];
  has_attended(context: __compactRuntime.WitnessContext<Ledger, T>,
               issuerId: Uint8Array,
               eventId: Uint8Array): [T, boolean];
}

export type ImpureCircuits<T> = {
  pause(context: __compactRuntime.CircuitContext<T>): __compactRuntime.CircuitResults<T, void>;
  unpause(context: __compactRuntime.CircuitContext<T>): __compactRuntime.CircuitResults<T, void>;
  registerIssuer(context: __compactRuntime.CircuitContext<T>,
                 issuerPk: Uint8Array): __compactRuntime.CircuitResults<T, void>;
  deactivateIssuer(context: __compactRuntime.CircuitContext<T>,
                   issuerPk: Uint8Array): __compactRuntime.CircuitResults<T, void>;
  createEvent(context: __compactRuntime.CircuitContext<T>,
              eventId: Uint8Array,
              maxSupply: bigint,
              expiration: bigint,
              isPublicMint: boolean): __compactRuntime.CircuitResults<T, void>;
  deactivateEvent(context: __compactRuntime.CircuitContext<T>,
                  eventId: Uint8Array): __compactRuntime.CircuitResults<T, void>;
  claimOrUpdate(context: __compactRuntime.CircuitContext<T>,
                eventId: Uint8Array,
                isSoulbound: boolean): __compactRuntime.CircuitResults<T, void>;
  mintTo(context: __compactRuntime.CircuitContext<T>,
         eventId: Uint8Array,
         recipientPk: Uint8Array): __compactRuntime.CircuitResults<T, void>;
  burn(context: __compactRuntime.CircuitContext<T>, tokenId: bigint): __compactRuntime.CircuitResults<T, void>;
  getCallerPk(context: __compactRuntime.CircuitContext<T>): __compactRuntime.CircuitResults<T, Uint8Array>;
}

export type PureCircuits = {
}

export type Circuits<T> = {
  pause(context: __compactRuntime.CircuitContext<T>): __compactRuntime.CircuitResults<T, void>;
  unpause(context: __compactRuntime.CircuitContext<T>): __compactRuntime.CircuitResults<T, void>;
  registerIssuer(context: __compactRuntime.CircuitContext<T>,
                 issuerPk: Uint8Array): __compactRuntime.CircuitResults<T, void>;
  deactivateIssuer(context: __compactRuntime.CircuitContext<T>,
                   issuerPk: Uint8Array): __compactRuntime.CircuitResults<T, void>;
  createEvent(context: __compactRuntime.CircuitContext<T>,
              eventId: Uint8Array,
              maxSupply: bigint,
              expiration: bigint,
              isPublicMint: boolean): __compactRuntime.CircuitResults<T, void>;
  deactivateEvent(context: __compactRuntime.CircuitContext<T>,
                  eventId: Uint8Array): __compactRuntime.CircuitResults<T, void>;
  claimOrUpdate(context: __compactRuntime.CircuitContext<T>,
                eventId: Uint8Array,
                isSoulbound: boolean): __compactRuntime.CircuitResults<T, void>;
  mintTo(context: __compactRuntime.CircuitContext<T>,
         eventId: Uint8Array,
         recipientPk: Uint8Array): __compactRuntime.CircuitResults<T, void>;
  burn(context: __compactRuntime.CircuitContext<T>, tokenId: bigint): __compactRuntime.CircuitResults<T, void>;
  getCallerPk(context: __compactRuntime.CircuitContext<T>): __compactRuntime.CircuitResults<T, Uint8Array>;
}

export type Ledger = {
  readonly totalSupply: bigint;
  tokenOwner: {
    isEmpty(): boolean;
    size(): bigint;
    member(key: bigint): boolean;
    lookup(key: bigint): Uint8Array;
    [Symbol.iterator](): Iterator<[bigint, Uint8Array]>
  };
  tokenFirstEvent: {
    isEmpty(): boolean;
    size(): bigint;
    member(key: bigint): boolean;
    lookup(key: bigint): Uint8Array;
    [Symbol.iterator](): Iterator<[bigint, Uint8Array]>
  };
  tokenIssuer: {
    isEmpty(): boolean;
    size(): bigint;
    member(key: bigint): boolean;
    lookup(key: bigint): Uint8Array;
    [Symbol.iterator](): Iterator<[bigint, Uint8Array]>
  };
  issuerHolderToken: {
    isEmpty(): boolean;
    size(): bigint;
    member(key: Uint8Array): boolean;
    lookup(key: Uint8Array): bigint;
    [Symbol.iterator](): Iterator<[Uint8Array, bigint]>
  };
  events: {
    isEmpty(): boolean;
    size(): bigint;
    member(key: Uint8Array): boolean;
    lookup(key: Uint8Array): { maxSupply: bigint,
                               minted: bigint,
                               expiration: bigint,
                               organizer: Uint8Array,
                               isActive: boolean,
                               isPublicMint: boolean
                             };
    [Symbol.iterator](): Iterator<[Uint8Array, { maxSupply: bigint,
  minted: bigint,
  expiration: bigint,
  organizer: Uint8Array,
  isActive: boolean,
  isPublicMint: boolean
}]>
  };
  issuers: {
    isEmpty(): boolean;
    size(): bigint;
    member(key: Uint8Array): boolean;
    lookup(key: Uint8Array): { organizerPk: Uint8Array, isActive: boolean };
    [Symbol.iterator](): Iterator<[Uint8Array, { organizerPk: Uint8Array, isActive: boolean }]>
  };
  burnedTokens: {
    isEmpty(): boolean;
    size(): bigint;
    member(key: bigint): boolean;
    lookup(key: bigint): boolean;
    [Symbol.iterator](): Iterator<[bigint, boolean]>
  };
  readonly isPaused: boolean;
  readonly adminPk: Uint8Array;
}

export declare class Contract<T, W extends Witnesses<T> = Witnesses<T>> {
  witnesses: W;
  circuits: Circuits<T>;
  impureCircuits: ImpureCircuits<T>;
  constructor(witnesses: W);
  initialState(privateState: T): [T, __compactRuntime.ContractState];
}

export declare function ledger(state: __compactRuntime.StateValue): Ledger;
export declare const pureCircuits: PureCircuits;
