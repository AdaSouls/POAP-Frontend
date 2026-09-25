import {
  BackupContractMismatchError,
  BackupFormatError,
  BackupPasswordError,
  applyBackup,
  computeBackupLookupId,
  createBackup,
  decryptBackupPayload,
  deserializeState,
  encryptBackupPayload,
  parseBackupEnvelope,
  serializeState,
} from '../../midnight/backup';
import { PROOF_HISTORY_PREFIX } from '../../midnight/proof-history';

jest.setTimeout(30000); // PBKDF2 at 600k iterations

const PASSWORD = 'Correct-Horse-Battery-9';
const CONTRACT = 'cc'.repeat(32);
const KEY = 'poapPrivateState';
const META = { networkId: 'undeployed', contractAddress: CONTRACT };

// Stand-in for the SDK private-state provider: the backup only uses get/set of one key.
function fakeProvider(initial?: unknown) {
  const store = new Map<string, unknown>();
  if (initial !== undefined) store.set(KEY, initial);
  return {
    store,
    get: jest.fn(async (key: string) => store.get(key) ?? null),
    set: jest.fn(async (key: string, value: unknown) => {
      store.set(key, value);
    }),
  };
}

const samplePrivateState = () => ({
  secretKey: Uint8Array.from({ length: 32 }, (_, i) => i),
  tokens: { ['ab'.repeat(32)]: { tokenId: 7n, isSoulbound: true } },
});

describe('backup', () => {
  afterEach(() => window.localStorage.clear());

  it('serializes the private state keeping Uint8Array, Buffer and bigint types', () => {
    const state = { ...samplePrivateState(), extra: Buffer.from([1, 2, 3]) };
    const restored = deserializeState(serializeState(state)) as typeof state;
    expect(restored.secretKey).toBeInstanceOf(Uint8Array);
    expect(Array.from(restored.secretKey)).toEqual(Array.from(state.secretKey));
    expect(Array.from(restored.extra as unknown as Uint8Array)).toEqual([1, 2, 3]);
    expect(restored.tokens['ab'.repeat(32)].tokenId).toBe(7n);
  });

  it('round-trips an encrypted payload and never stores it in plaintext', async () => {
    const payload = { privateState: serializeState(samplePrivateState()), localStorage: { a: 'secret-draft' } };
    const envelope = await encryptBackupPayload(payload, PASSWORD, META);

    expect(envelope).toMatchObject({ format: 'adasouls-backup', version: 1, contractAddress: CONTRACT });
    expect(JSON.stringify(envelope)).not.toContain('secret-draft');
    await expect(decryptBackupPayload(envelope, PASSWORD)).resolves.toEqual(payload);
  });

  it('rejects a wrong password', async () => {
    const envelope = await encryptBackupPayload({ privateState: null, localStorage: {} }, PASSWORD, META);
    await expect(decryptBackupPayload(envelope, 'Wrong-Horse-Battery-9')).rejects.toBeInstanceOf(BackupPasswordError);
  });

  it('parses only AdaSouls backup files', async () => {
    const envelope = await encryptBackupPayload({ privateState: null, localStorage: {} }, PASSWORD, META);
    expect(parseBackupEnvelope(JSON.stringify(envelope))).toEqual(envelope);
    expect(() => parseBackupEnvelope('not json')).toThrow(BackupFormatError);
    expect(() => parseBackupEnvelope(JSON.stringify({ format: 'other' }))).toThrow(BackupFormatError);
    expect(() => parseBackupEnvelope(JSON.stringify({ ...envelope, version: 99 }))).toThrow(/unsupported/i);
  });

  it('backs up the private state and proof history, and restores both into another browser', async () => {
    const historyKey = `${PROOF_HISTORY_PREFIX}ee:ff`;
    window.localStorage.setItem(historyKey, JSON.stringify([{ kind: 'ownership', txHash: 'Region' }]));
    window.localStorage.setItem('unrelated:key', 'not backed up');
    const source = fakeProvider(samplePrivateState());

    const envelope = await createBackup(source, KEY, PASSWORD, META);

    window.localStorage.clear();
    const target = fakeProvider();
    await applyBackup(target, KEY, envelope, PASSWORD, CONTRACT);

    const restored = target.store.get(KEY) as ReturnType<typeof samplePrivateState>;
    expect(Array.from(restored.secretKey)).toEqual(Array.from(samplePrivateState().secretKey));
    expect(restored.tokens['ab'.repeat(32)].tokenId).toBe(7n);
    expect(window.localStorage.getItem(historyKey)).toContain('Region');
    expect(window.localStorage.getItem('unrelated:key')).toBeNull();
  });

  it('refuses to restore a backup from another contract deployment without touching the store', async () => {
    const envelope = await createBackup(fakeProvider(samplePrivateState()), KEY, PASSWORD, META);
    const target = fakeProvider();
    await expect(applyBackup(target, KEY, envelope, PASSWORD, 'dd'.repeat(32))).rejects.toBeInstanceOf(
      BackupContractMismatchError,
    );
    expect(target.set).not.toHaveBeenCalled();
  });

  it('derives a lookup id that depends on both the password and the wallet', async () => {
    const a = await computeBackupLookupId(PASSWORD, 'wallet-a');
    expect(a).toMatch(/^[0-9a-f]{64}$/);
    expect(await computeBackupLookupId(PASSWORD, 'wallet-a')).toBe(a);
    expect(await computeBackupLookupId(PASSWORD, 'wallet-b')).not.toBe(a);
    expect(await computeBackupLookupId('Other-Horse-Battery-9', 'wallet-a')).not.toBe(a);
  });
});
