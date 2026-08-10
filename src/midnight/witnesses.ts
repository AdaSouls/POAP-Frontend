import type { WitnessContext } from '@midnight-ntwrk/compact-runtime';
import { persistentHash } from '@midnight-ntwrk/compact-runtime';
import type { Ledger, Witnesses } from './contract/managed/poap/contract/index.js';

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

// ── Caller identity ─────────────────────────────────────────────────────────
//
// The contract's `caller_pk()` circuit (poap.compact) is internal-only — not `export`ed, so it
// can't be called as its own transaction. It computes:
//   derive_pk(sk) = persistentHash<Vector<2, Bytes<32>>>([pad(32, "adasouls:pk:v1:"), sk])
// We replicate that here so the client can derive its own identity locally, without a round trip.
// `pad` isn't exposed by compact-runtime, so we implement the zero-pad ourselves — verified
// empirically against a real claimOrUpdate's resulting `tokenOwner` entry, not just by inspection.
const CALLER_PK_DOMAIN = 'adasouls:pk:v1:';

function pad32(text: string): Uint8Array {
  const bytes = new TextEncoder().encode(text);
  if (bytes.length > 32) throw new Error(`pad32: "${text}" is longer than 32 bytes`);
  const padded = new Uint8Array(32);
  padded.set(bytes);
  return padded;
}

export function deriveCallerPk(secretKey: Uint8Array): Uint8Array {
  return persistentHash(pad32(CALLER_PK_DOMAIN), secretKey);
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
