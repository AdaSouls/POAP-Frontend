import { LEGACY_STORAGE_PASSWORD, unlockPrivateState } from '../../midnight/private-state-unlock';
import {
  PasswordRequestCancelledError,
  cancelPasswordRequest,
  clearStoragePassword,
  generateRecoveryCode,
  getStoragePassword,
  getStoredRecoveryCode,
  isRecoveryCodeSaved,
  storeRecoveryCode,
  submitPassword,
  subscribePasswordRequest,
  type PasswordRequest,
  type PasswordSubmission,
} from '../../midnight/storage-password';
import { encryptBackupPayload, serializeState } from '../../midnight/backup';

jest.setTimeout(60000); // PBKDF2 at 600k iterations

const KEY = 'poapPrivateState';
const COIN_PK = 'coin-pk';
const CONTRACT = 'cc'.repeat(32);
const CTX = { privateStateKey: KEY, coinPublicKey: COIN_PK, contractAddress: CONTRACT };

// Behaves like the SDK store for what the unlock flow relies on: each entry is readable only with
// the key it was written under (the current session key); set/remove don't read the old entry.
function fakeStore(entries: Record<string, { password: string; value: unknown }> = {}) {
  const store = new Map(Object.entries(entries));
  return {
    store,
    get: jest.fn(async (key: string) => {
      const entry = store.get(key);
      if (!entry) return null;
      if (entry.password !== getStoragePassword()) throw new Error('decryption failed');
      return entry.value;
    }),
    set: jest.fn(async (key: string, value: unknown) => {
      store.set(key, { password: getStoragePassword(), value });
    }),
    remove: jest.fn(async (key: string) => {
      store.delete(key);
    }),
  };
}

// Resolves with the next prompt the flow shows (what the wallet popup would render).
function nextRequest(): Promise<PasswordRequest> {
  return new Promise((resolve) => {
    let done = false;
    const unsubscribe = subscribePasswordRequest((request) => {
      if (!request || done) return;
      done = true;
      setTimeout(() => unsubscribe());
      resolve(request);
    });
  });
}

async function answer(submission: PasswordSubmission): Promise<PasswordRequest> {
  const request = await nextRequest();
  submitPassword(submission);
  return request;
}

async function backupFile(code: string, contractAddress = CONTRACT) {
  const envelope = await encryptBackupPayload(
    { privateState: serializeState({ secretKey: Uint8Array.from([9, 9, 9]), tokens: {} }), localStorage: {} },
    code,
    { networkId: 'undeployed', contractAddress },
  );
  return JSON.stringify(envelope);
}

describe('unlockPrivateState', () => {
  afterEach(() => {
    clearStoragePassword();
    window.localStorage.clear();
  });

  it('opens silently with the key this browser already has for the wallet', async () => {
    storeRecoveryCode(COIN_PK, 'STORED-KEY', true);
    const provider = fakeStore({ [KEY]: { password: 'STORED-KEY', value: { secretKey: 'sk' } } });
    const onRequest = jest.fn();
    const unsubscribe = subscribePasswordRequest(onRequest);

    await expect(unlockPrivateState(provider, CTX)).resolves.toBe('existing');
    expect(getStoragePassword()).toBe('STORED-KEY');
    expect(onRequest).not.toHaveBeenCalledWith(expect.objectContaining({ mode: expect.anything() }));
    unsubscribe();
  });

  it('keeps using the wallet key, silently, for a contract it has nothing stored for yet', async () => {
    storeRecoveryCode(COIN_PK, 'STORED-KEY', true);
    await expect(unlockPrivateState(fakeStore(), CTX)).resolves.toBe('existing');
    expect(getStoragePassword()).toBe('STORED-KEY');
  });

  it('silently migrates an identity stored under the legacy dev password to a new per-wallet key', async () => {
    const provider = fakeStore({ [KEY]: { password: LEGACY_STORAGE_PASSWORD, value: { secretKey: 'sk' } } });

    await expect(unlockPrivateState(provider, CTX)).resolves.toBe('migrated');

    const code = getStoredRecoveryCode(COIN_PK);
    expect(code).toBeTruthy();
    expect(isRecoveryCodeSaved(COIN_PK)).toBe(false);
    expect(provider.store.get(KEY)).toEqual({ password: code, value: { secretKey: 'sk' } });
  });

  it('migrates a legacy entry under the wallet key that already exists (e.g. created by the deploy page)', async () => {
    storeRecoveryCode(COIN_PK, 'STORED-KEY', false);
    const provider = fakeStore({ [KEY]: { password: LEGACY_STORAGE_PASSWORD, value: { secretKey: 'sk' } } });

    await expect(unlockPrivateState(provider, CTX)).resolves.toBe('migrated');
    expect(provider.store.get(KEY)).toEqual({ password: 'STORED-KEY', value: { secretKey: 'sk' } });
  });

  it('welcomes a wallet new to this browser and creates its key on Continue', async () => {
    const provider = fakeStore();
    const result = unlockPrivateState(provider, CTX);

    expect(await answer({ kind: 'new' })).toEqual({ mode: 'welcome', error: null });
    await expect(result).resolves.toBe('new');
    expect(getStoragePassword()).toBe(getStoredRecoveryCode(COIN_PK));
    expect(isRecoveryCodeSaved(COIN_PK)).toBe(false);
  });

  it('restores from a backup file with the recovery code, adopting it as this browser\'s key', async () => {
    const code = generateRecoveryCode();
    const provider = fakeStore();
    const result = unlockPrivateState(provider, CTX);

    await answer({
      kind: 'restore',
      password: code.toLowerCase().replace(/-/g, ' '),
      source: { kind: 'file', text: await backupFile(code) },
    });
    await expect(result).resolves.toBe('restored');

    const entry = provider.store.get(KEY) as { password: string; value: { secretKey: Uint8Array } };
    expect(entry.password).toBe(code);
    expect(Array.from(entry.value.secretKey)).toEqual([9, 9, 9]);
    expect(getStoredRecoveryCode(COIN_PK)).toBe(code);
    expect(isRecoveryCodeSaved(COIN_PK)).toBe(true);
  });

  it('asks for the recovery code when the stored identity is under a key this browser lost', async () => {
    const code = generateRecoveryCode();
    const provider = fakeStore({ [KEY]: { password: code, value: { secretKey: 'old' } } });
    const result = unlockPrivateState(provider, CTX);

    const wrong = generateRecoveryCode();
    expect(
      await answer({ kind: 'restore', password: wrong, source: { kind: 'file', text: await backupFile(code) } }),
    ).toEqual({ mode: 'locked', error: null });
    const retry = await answer({ kind: 'restore', password: code, source: { kind: 'file', text: await backupFile(code) } });
    expect(retry).toEqual({ mode: 'locked', error: expect.stringMatching(/wrong recovery code/i) });

    await expect(result).resolves.toBe('restored');
  });

  it('lets a locked wallet start over, dropping the identity it cannot open', async () => {
    const provider = fakeStore({ [KEY]: { password: 'LOST-KEY', value: { secretKey: 'old' } } });
    const result = unlockPrivateState(provider, CTX);

    await answer({ kind: 'new' });
    await expect(result).resolves.toBe('new');
    expect(provider.remove).toHaveBeenCalledWith(KEY);
    expect(provider.store.has(KEY)).toBe(false);
  });

  it('keeps asking, with the reason, when a restore fails — and can be cancelled', async () => {
    const code = generateRecoveryCode();
    const provider = fakeStore();
    const result = unlockPrivateState(provider, CTX);

    await answer({
      kind: 'restore',
      password: code,
      source: { kind: 'file', text: await backupFile(code, 'dd'.repeat(32)) },
    });
    const retry = await nextRequest();
    expect(retry.error).toMatch(/different deployment/i);
    expect(provider.set).not.toHaveBeenCalled();

    cancelPasswordRequest();
    await expect(result).rejects.toBeInstanceOf(PasswordRequestCancelledError);
  });
});
