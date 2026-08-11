import type { WitnessContext } from '@midnight-ntwrk/compact-runtime';
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
