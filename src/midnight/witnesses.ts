import { persistentHash, CompactTypeVector, Bytes32Descriptor, type WitnessContext } from '@midnight-ntwrk/compact-runtime';
import type { Ledger, Witnesses } from './contract/managed/poap/contract/index.js';

// derive_pk(sk) = persistentHash<Vector<2, Bytes<32>>>([pad(32, "adasouls:pk:v1:"), sk]) — see
// poap.compact lines 95-96. Computed locally instead of via the getCallerPk circuit because the
// compiler excludes it from provableCircuits (it discloses nothing to the ledger, so there's
// nothing to prove) — meaning midnight-js-contracts' callTx, which is built strictly from
// provableCircuits, genuinely has no getCallerPk entry (confirmed 2026-08-14 by reading
// midnight-js-contracts' own source, not a copy/deploy mistake). The 32-byte domain separator
// below is copied byte-for-byte from the compiled contract's own _derive_pk_0 (contract/index.js),
// not hand re-encoded, specifically to avoid the padding/encoding drift risk this approach was
// previously flagged for — re-copy this constant if the contract module is ever refreshed and the
// admin has changed the domain separator string.
const CALLER_PK_DOMAIN_SEPARATOR = new Uint8Array([
  97, 100, 97, 115, 111, 117, 108, 115, 58, 112, 107, 58, 118, 49, 58,
  0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
]);
const derivePkHashType = new CompactTypeVector(2, Bytes32Descriptor);

export function deriveCallerPk(secretKey: Uint8Array): Uint8Array {
  return persistentHash(derivePkHashType, [CALLER_PK_DOMAIN_SEPARATOR, secretKey]);
}

// holder_pk(issuerId) = persistentHash<Vector<3, Bytes<32>>>([pad(32, "adasouls:holder-pk:v1:"),
// local_sk(), issuerId]) — see poap.compact's holder_pk circuit. Same exclusion-from-
// provableCircuits situation as getCallerPk/deriveCallerPk above (getHolderPk discloses nothing on
// its own, so callTx.getHolderPk doesn't exist either) — computed locally for the same reason,
// domain separator copied byte-for-byte from the compiled contract's own _holder_pk_0
// (contract/index.js), not hand re-encoded.
//
// This is what a subscriber needs to hand an organizer before that organizer can mintTo() them: a
// per-issuer pseudonym, deliberately DIFFERENT from callerPk/deriveCallerPk above (that one is the
// same value across every issuer — sharing it would let a chain observer correlate a wallet's POAPs
// across unrelated organizers). Giving the wrong one (callerPk) to an organizer results in a token
// minted to a pubkey this wallet's own claimOrUpdate can never reconcile against (see
// holder_token_key in poap.compact) — effectively an unrecoverable mint.
const HOLDER_PK_DOMAIN_SEPARATOR = new Uint8Array([
  97, 100, 97, 115, 111, 117, 108, 115, 58, 104, 111, 108, 100, 101, 114, 45,
  112, 107, 58, 118, 49, 58, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
]);
const deriveHolderPkHashType = new CompactTypeVector(3, Bytes32Descriptor);

export function deriveHolderPk(secretKey: Uint8Array, issuerId: Uint8Array): Uint8Array {
  return persistentHash(deriveHolderPkHashType, [HOLDER_PK_DOMAIN_SEPARATOR, secretKey, issuerId]);
}

// ── Private State ─────────────────────────────────────────────────────────────
// Ported from poap-midnight/contracts/src/witnesses.ts. The only behavioral
// difference from that reference is where secretKey comes from: here it's a
// random value generated once per browser profile (see getOrCreatePrivateState
// in providers.ts), not a fixed devnet seed.

export type AttendanceRecord = {
  eventIds: Uint8Array[];
  isSoulbound: boolean;
};

export type TokenRecord = {
  tokenId: bigint;
  attendance: AttendanceRecord;
};

export type PoapPrivateState = {
  secretKey: Uint8Array;
  // issuerId (hex) → token for that issuer; one token per (wallet, issuer)
  tokens: Record<string, TokenRecord>;
};

function issuerKey(issuerId: Uint8Array): string {
  return Buffer.from(issuerId).toString('hex');
}

export function createPoapPrivateState(secretKey: Uint8Array): PoapPrivateState {
  return { secretKey, tokens: {} };
}

// ── Witness Factory ───────────────────────────────────────────────────────────

export function createWitnesses(): Witnesses<PoapPrivateState> {
  return {
    local_sk(context: WitnessContext<Ledger, PoapPrivateState>): [PoapPrivateState, Uint8Array] {
      return [context.privateState, context.privateState.secretKey];
    },

    get_my_token_for_issuer(
      context: WitnessContext<Ledger, PoapPrivateState>,
      issuerId: Uint8Array,
    ): [PoapPrivateState, { is_some: boolean; value: bigint }] {
      const token = context.privateState.tokens[issuerKey(issuerId)];
      if (token !== undefined) {
        return [context.privateState, { is_some: true, value: token.tokenId }];
      }
      return [context.privateState, { is_some: false, value: 0n }];
    },

    store_token(
      context: WitnessContext<Ledger, PoapPrivateState>,
      tokenId: bigint,
      issuerId: Uint8Array,
      eventId: Uint8Array,
      isSoulbound: boolean,
    ): [PoapPrivateState, []] {
      const newState: PoapPrivateState = {
        ...context.privateState,
        tokens: {
          ...context.privateState.tokens,
          [issuerKey(issuerId)]: {
            tokenId,
            attendance: { eventIds: [eventId], isSoulbound },
          },
        },
      };
      return [newState, []];
    },

    store_attendance(
      context: WitnessContext<Ledger, PoapPrivateState>,
      _tokenId: bigint,
      issuerId: Uint8Array,
      eventId: Uint8Array,
    ): [PoapPrivateState, []] {
      const key = issuerKey(issuerId);
      const existing = context.privateState.tokens[key];
      if (existing === undefined) return [context.privateState, []];
      const newState: PoapPrivateState = {
        ...context.privateState,
        tokens: {
          ...context.privateState.tokens,
          [key]: {
            ...existing,
            attendance: {
              ...existing.attendance,
              eventIds: [...existing.attendance.eventIds, eventId],
            },
          },
        },
      };
      return [newState, []];
    },

    has_attended(
      context: WitnessContext<Ledger, PoapPrivateState>,
      issuerId: Uint8Array,
      eventId: Uint8Array,
    ): [PoapPrivateState, boolean] {
      const token = context.privateState.tokens[issuerKey(issuerId)];
      if (token === undefined) return [context.privateState, false];
      const attended = token.attendance.eventIds.some(
        (id) => id.length === eventId.length && id.every((b, i) => b === eventId[i]),
      );
      return [context.privateState, attended];
    },
  };
}
