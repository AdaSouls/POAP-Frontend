import {
  addProofRecord,
  getProofHistory,
  PROOF_HISTORY_EVENT,
  PROOF_HISTORY_PREFIX,
} from '../../midnight/proof-history';
import { markBackupDirty } from '../../midnight/backup-status';

jest.mock('../../midnight/backup-status', () => ({ markBackupDirty: jest.fn() }));

const HOLDER = 'cc'.repeat(32);
const OTHER_HOLDER = 'dd'.repeat(32);

const record = (n: number) => ({
  kind: 'proveTokenOwnership',
  question: `Owns POAP #${n}`,
  txHash: `${n}`.padStart(64, '0'),
  provenAt: new Date(2026, 8, n).toISOString(),
});

describe('proof-history', () => {
  afterEach(() => {
    window.localStorage.clear();
    jest.clearAllMocks();
  });

  it('is empty for a token with no proofs', () => {
    expect(getProofHistory(HOLDER, 1n)).toEqual([]);
  });

  it('keeps proofs newest first', () => {
    addProofRecord(HOLDER, 1n, record(1));
    addProofRecord(HOLDER, 1n, record(2));
    expect(getProofHistory(HOLDER, 1n).map((r) => r.question)).toEqual(['Owns POAP #2', 'Owns POAP #1']);
  });

  it('scopes the list to the holder and the token', () => {
    addProofRecord(HOLDER, 1n, record(1));
    expect(getProofHistory(HOLDER, 2n)).toEqual([]);
    expect(getProofHistory(OTHER_HOLDER, 1n)).toEqual([]);
    // bigint and number ids name the same token.
    expect(getProofHistory(HOLDER, 1)).toHaveLength(1);
  });

  it('stores under the backed-up prefix and marks the backup dirty', () => {
    addProofRecord(HOLDER, 7n, record(3));
    expect(window.localStorage.getItem(`${PROOF_HISTORY_PREFIX}${HOLDER}:7`)).toContain('Owns POAP #3');
    expect(markBackupDirty).toHaveBeenCalledTimes(1);
  });

  it('tells open cards to refresh', () => {
    const listener = jest.fn();
    window.addEventListener(PROOF_HISTORY_EVENT, listener);
    addProofRecord(HOLDER, 1n, record(1));
    window.removeEventListener(PROOF_HISTORY_EVENT, listener);
    expect(listener).toHaveBeenCalledTimes(1);
  });

  it('ignores a corrupted entry instead of throwing', () => {
    window.localStorage.setItem(`${PROOF_HISTORY_PREFIX}${HOLDER}:1`, '{not json');
    expect(getProofHistory(HOLDER, 1n)).toEqual([]);
  });
});
