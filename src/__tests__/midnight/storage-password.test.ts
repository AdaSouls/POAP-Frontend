import {
  PasswordRequestCancelledError,
  StorageLockedError,
  cancelPasswordRequest,
  clearStoragePassword,
  generateRecoveryCode,
  getStoragePassword,
  getStoredRecoveryCode,
  isRecoveryCodeSaved,
  markRecoveryCodeSaved,
  normalizeRecoveryCode,
  requestPassword,
  setStoragePassword,
  storeRecoveryCode,
  submitPassword,
  subscribePasswordRequest,
  subscribeRecoveryCodeSaved,
  validateStoragePassword,
} from '../../midnight/storage-password';

describe('storage-password', () => {
  afterEach(() => {
    clearStoragePassword();
    window.localStorage.clear();
  });

  describe('recovery codes', () => {
    it('generates distinct, readable codes that pass the SDK storage-password policy', () => {
      const codes = Array.from({ length: 50 }, () => generateRecoveryCode());
      codes.forEach((code) => {
        expect(code).toMatch(/^[0-9A-HJKMNP-TV-Z]{5}(-[0-9A-HJKMNP-TV-Z]{5}){5}$/);
        expect(validateStoragePassword(code)).toBeNull();
      });
      expect(new Set(codes).size).toBe(codes.length);
    });

    it('normalizes what people type back (case, spaces, missing dashes)', () => {
      const code = generateRecoveryCode();
      expect(normalizeRecoveryCode(code.toLowerCase())).toBe(code);
      expect(normalizeRecoveryCode(code.replace(/-/g, ' '))).toBe(code);
      expect(normalizeRecoveryCode(code.replace(/-/g, ''))).toBe(code);
      expect(normalizeRecoveryCode('  not-a-code  ')).toBe('not-a-code');
    });

    it('rejects input that cannot be a recovery code', () => {
      expect(validateStoragePassword('')).toMatch(/enter your recovery code/i);
      expect(validateStoragePassword('ABCDE-12345')).toMatch(/too short/i);
      expect(validateStoragePassword('abcdefghijklmnopqrstuv')).toMatch(/not a valid/i);
    });
  });

  describe('per-wallet key store', () => {
    it('keeps one code per wallet and tracks whether the user saved it', () => {
      const listener = jest.fn();
      const unsubscribe = subscribeRecoveryCodeSaved(listener);

      storeRecoveryCode('wallet-a', 'CODE-A', false);
      expect(getStoredRecoveryCode('wallet-a')).toBe('CODE-A');
      expect(getStoredRecoveryCode('wallet-b')).toBeNull();
      expect(isRecoveryCodeSaved('wallet-a')).toBe(false);

      markRecoveryCodeSaved('wallet-a');
      expect(isRecoveryCodeSaved('wallet-a')).toBe(true);
      expect(listener).toHaveBeenCalledTimes(2);
      unsubscribe();
    });
  });

  describe('session key', () => {
    it('throws StorageLockedError until a key is set, and again after clearing', () => {
      expect(() => getStoragePassword()).toThrow(StorageLockedError);
      setStoragePassword('KEY');
      expect(getStoragePassword()).toBe('KEY');
      clearStoragePassword();
      expect(() => getStoragePassword()).toThrow(StorageLockedError);
    });
  });

  describe('prompt', () => {
    it('publishes the pending request to subscribers and resolves with the submission', async () => {
      const seen: unknown[] = [];
      const unsubscribe = subscribePasswordRequest((request) => seen.push(request));

      const answer = requestPassword('locked', 'Wrong recovery code, or the backup is damaged.');
      expect(seen[seen.length - 1]).toEqual({ mode: 'locked', error: 'Wrong recovery code, or the backup is damaged.' });

      submitPassword({ kind: 'new' });
      await expect(answer).resolves.toEqual({ kind: 'new' });
      expect(seen[seen.length - 1]).toBeNull();
      unsubscribe();
    });

    it('rejects with PasswordRequestCancelledError when cancelled or when the session is cleared', async () => {
      const cancelled = requestPassword('welcome');
      cancelPasswordRequest();
      await expect(cancelled).rejects.toBeInstanceOf(PasswordRequestCancelledError);

      const cleared = requestPassword('welcome');
      clearStoragePassword();
      await expect(cleared).rejects.toBeInstanceOf(PasswordRequestCancelledError);
    });
  });
});
