// The key that encrypts this browser's private state (where local_sk lives) and the wallet's
// encrypted backups (backup.ts). One per wallet account, generated automatically and kept in this
// browser, so connecting never asks for a password. The same string is the user's RECOVERY CODE:
// shown once to save, and the only thing needed to restore the cloud backup in another browser.
//
// Trade-off accepted on purpose (2026-09-23): anyone with access to this browser profile can read
// the key — the same exposure the old fixed dev password had, but now unique per wallet and with a
// recoverable backup. A wallet-signature-derived key was ruled out: 1am's signData isn't
// deterministic, so it can't re-derive the same key in another browser.
//
// Same shape as tx-status.ts: plain module state + subscribe APIs, SDK- and React-free, so
// providers.ts can read the key synchronously and the wallet popup can render the prompt.

// 'welcome': nothing stored for this wallet in this browser — continue as new, or restore.
// 'locked': something is stored but its key is missing here — only a restore can open it.
export type PasswordMode = 'welcome' | 'locked';

export type RestoreSource = { kind: 'cloud' } | { kind: 'file'; text: string };

export type PasswordSubmission =
  | { kind: 'new' }
  // `password` is the recovery code the backup was made with; it becomes this browser's key.
  | { kind: 'restore'; password: string; source: RestoreSource };

export type PasswordRequest = { mode: PasswordMode; error: string | null };

export class PasswordRequestCancelledError extends Error {
  constructor() {
    super('Cancelled.');
    this.name = 'PasswordRequestCancelledError';
  }
}

export class StorageLockedError extends Error {
  constructor() {
    super('Your private state is locked. Reconnect your wallet.');
    this.name = 'StorageLockedError';
  }
}

let current: string | null = null;
let pending: (PasswordRequest & {
  resolve: (submission: PasswordSubmission) => void;
  reject: (error: Error) => void;
}) | null = null;
const requestListeners = new Set<(request: PasswordRequest | null) => void>();

function emitRequest(): void {
  const request = pending ? { mode: pending.mode, error: pending.error } : null;
  requestListeners.forEach((listener) => listener(request));
}

// ── Session key ───────────────────────────────────────────────────────────────

export function getStoragePassword(): string {
  if (current === null) throw new StorageLockedError();
  return current;
}

export function hasStoragePassword(): boolean {
  return current !== null;
}

export function setStoragePassword(password: string): void {
  current = password;
}

// Called on disconnect: forgets the session key and drops any prompt still waiting for input.
export function clearStoragePassword(): void {
  current = null;
  if (pending) {
    const { reject } = pending;
    pending = null;
    reject(new PasswordRequestCancelledError());
    emitRequest();
  }
}

// ── Prompt (resolved by the wallet popup) ─────────────────────────────────────

export function requestPassword(mode: PasswordMode, error: string | null = null): Promise<PasswordSubmission> {
  if (pending) pending.reject(new PasswordRequestCancelledError());
  return new Promise((resolve, reject) => {
    pending = { mode, error, resolve, reject };
    emitRequest();
  });
}

export function submitPassword(submission: PasswordSubmission): void {
  if (!pending) return;
  const { resolve } = pending;
  pending = null;
  emitRequest();
  resolve(submission);
}

export function cancelPasswordRequest(): void {
  if (!pending) return;
  const { reject } = pending;
  pending = null;
  emitRequest();
  reject(new PasswordRequestCancelledError());
}

export function subscribePasswordRequest(listener: (request: PasswordRequest | null) => void): () => void {
  requestListeners.add(listener);
  listener(pending ? { mode: pending.mode, error: pending.error } : null);
  return () => {
    requestListeners.delete(listener);
  };
}

// ── Password policy ───────────────────────────────────────────────────────────
//
// The SDK rejects storage passwords that fail this policy on every private-state read/write, so
// generated codes are checked against it (and a restore is too, before touching anything).
// Mirrored from @midnight-ntwrk/midnight-js-utils@4.1.1's validatePassword rather than imported:
// that package's CJS build pulls in an ESM-only dependency Jest can't load. Returns null when valid.
const MIN_PASSWORD_LENGTH = 16;
const MIN_CHARACTER_CLASSES = 3;
const MAX_CONSECUTIVE_REPEATED = 3;
const MIN_SEQUENTIAL_LENGTH = 4;

function countCharacterClasses(password: string): number {
  return [/[a-z]/, /[A-Z]/, /[0-9]/, /[^a-zA-Z0-9]/].filter((pattern) => pattern.test(password)).length;
}

function hasRepeatedCharacters(password: string): boolean {
  let run = 1;
  for (let i = 1; i < password.length; i++) {
    run = password[i] === password[i - 1] ? run + 1 : 1;
    if (run > MAX_CONSECUTIVE_REPEATED) return true;
  }
  return false;
}

function hasSequentialPattern(password: string): boolean {
  const lower = password.toLowerCase();
  for (let i = 0; i <= lower.length - MIN_SEQUENTIAL_LENGTH; i++) {
    let ascending = 1;
    let descending = 1;
    for (let j = 1; j < MIN_SEQUENTIAL_LENGTH; j++) {
      const code = lower.charCodeAt(i + j);
      const previous = lower.charCodeAt(i + j - 1);
      ascending = code === previous + 1 ? ascending + 1 : 1;
      descending = code === previous - 1 ? descending + 1 : 1;
      if (ascending >= MIN_SEQUENTIAL_LENGTH || descending >= MIN_SEQUENTIAL_LENGTH) return true;
    }
  }
  return false;
}

export function validateStoragePassword(password: string): string | null {
  if (!password) return 'Enter your recovery code.';
  if (password.length < MIN_PASSWORD_LENGTH) return `That's too short to be a recovery code.`;
  if (hasRepeatedCharacters(password)) return 'That is not a valid recovery code.';
  if (countCharacterClasses(password) < MIN_CHARACTER_CLASSES) return 'That is not a valid recovery code.';
  if (hasSequentialPattern(password)) return 'That is not a valid recovery code.';
  return null;
}

// ── Recovery code ─────────────────────────────────────────────────────────────

// Crockford-style alphabet (no I, L, O, U) — readable, and upper + digits + '-' gives the policy's
// three character classes. 6 groups of 5 ≈ 150 bits.
const CODE_ALPHABET = '0123456789ABCDEFGHJKMNPQRSTVWXYZ';
const CODE_GROUPS = 6;
const CODE_GROUP_LENGTH = 5;

export function generateRecoveryCode(): string {
  for (;;) {
    const bytes = crypto.getRandomValues(new Uint8Array(CODE_GROUPS * CODE_GROUP_LENGTH));
    const chars = Array.from(bytes, (byte) => CODE_ALPHABET[byte % CODE_ALPHABET.length]);
    const groups = Array.from({ length: CODE_GROUPS }, (_, i) =>
      chars.slice(i * CODE_GROUP_LENGTH, (i + 1) * CODE_GROUP_LENGTH).join(''),
    );
    const code = groups.join('-');
    // Must have a digit AND a letter to reach 3 classes; the rare miss just rolls again.
    if (validateStoragePassword(code) === null) return code;
  }
}

// What people type back: case-insensitive, spaces or missing dashes tolerated.
export function normalizeRecoveryCode(input: string): string {
  const compact = input.toUpperCase().replace(/[^0-9A-Z]/g, '');
  if (compact.length !== CODE_GROUPS * CODE_GROUP_LENGTH) return input.trim();
  return compact.match(new RegExp(`.{${CODE_GROUP_LENGTH}}`, 'g'))!.join('-');
}

// ── Per-wallet key store ──────────────────────────────────────────────────────

const KEY_PREFIX = 'adasouls:storageKey:';
type StoredKey = { code: string; saved: boolean };
const savedListeners = new Set<() => void>();

function readKey(coinPublicKey: string): StoredKey | null {
  try {
    const raw = window.localStorage.getItem(KEY_PREFIX + coinPublicKey);
    return raw ? (JSON.parse(raw) as StoredKey) : null;
  } catch {
    return null;
  }
}

function writeKey(coinPublicKey: string, value: StoredKey): void {
  window.localStorage.setItem(KEY_PREFIX + coinPublicKey, JSON.stringify(value));
  savedListeners.forEach((listener) => listener());
}

export function getStoredRecoveryCode(coinPublicKey: string): string | null {
  return readKey(coinPublicKey)?.code ?? null;
}

// `saved`: whether the user already confirmed they saved this code somewhere (a restored code
// obviously was — they just typed it in).
export function storeRecoveryCode(coinPublicKey: string, code: string, saved: boolean): void {
  writeKey(coinPublicKey, { code, saved });
}

export function isRecoveryCodeSaved(coinPublicKey: string): boolean {
  return readKey(coinPublicKey)?.saved ?? false;
}

export function markRecoveryCodeSaved(coinPublicKey: string): void {
  const stored = readKey(coinPublicKey);
  if (stored && !stored.saved) writeKey(coinPublicKey, { ...stored, saved: true });
}

export function subscribeRecoveryCodeSaved(listener: () => void): () => void {
  savedListeners.add(listener);
  return () => {
    savedListeners.delete(listener);
  };
}
