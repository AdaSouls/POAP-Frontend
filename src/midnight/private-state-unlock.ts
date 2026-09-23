import {
  applyBackup,
  computeBackupLookupId,
  fetchCloudBackup,
  parseBackupEnvelope,
  type BackupPrivateStateProvider,
} from './backup';
import {
  clearStoragePassword,
  generateRecoveryCode,
  getStoredRecoveryCode,
  normalizeRecoveryCode,
  requestPassword,
  setStoragePassword,
  storeRecoveryCode,
  validateStoragePassword,
  type PasswordMode,
  type RestoreSource,
} from './storage-password';

// The fixed password every browser's private state was encrypted with before each wallet got its
// own key. Only used here, to migrate those stores — never to write anything new.
export const LEGACY_STORAGE_PASSWORD = 'AdaSouls-Local-Dev-2026!';

// Everything here goes through get/set/remove of our single private-state key, which only ever
// touches that one entry. The SDK store is shared by every contract address this wallet has used in
// this browser, and other entries may be under another key (older deployments, or the legacy
// password) — so the SDK's changePassword, which rotates and must decrypt the WHOLE store, is never
// used: migrating is read-with-legacy, write-with-new, for our entry only.
export type UnlockablePrivateStateProvider = BackupPrivateStateProvider & {
  remove(privateStateId: string): Promise<void>;
};

export type UnlockContext = {
  privateStateKey: string;
  coinPublicKey: string;
  contractAddress: string;
};

// 'existing': opened with this browser's stored key. 'migrated': moved off the legacy password.
// 'new': fresh key for a wallet new to this browser. 'restored': recovered from a backup.
export type UnlockOutcome = 'existing' | 'migrated' | 'new' | 'restored';

// Reads our entry with `key` as the session key. ok = decrypted (or nothing stored).
async function readsWith(provider: UnlockablePrivateStateProvider, entryKey: string, key: string) {
  setStoragePassword(key);
  try {
    return { ok: true as const, state: await provider.get(entryKey) };
  } catch {
    return { ok: false as const, state: undefined };
  } finally {
    clearStoragePassword();
  }
}

async function restore(provider: UnlockablePrivateStateProvider, ctx: UnlockContext, code: string, source: RestoreSource) {
  const envelope =
    source.kind === 'file'
      ? parseBackupEnvelope(source.text)
      : await fetchCloudBackup(await computeBackupLookupId(code, ctx.coinPublicKey));
  // set() overwrites our entry without reading it, so this works even when the entry is under a
  // key this browser no longer has.
  setStoragePassword(code);
  try {
    await applyBackup(provider, ctx.privateStateKey, envelope, code, ctx.contractAddress);
  } catch (error) {
    clearStoragePassword();
    throw error;
  }
}

// Asks the wallet popup (storage-password.ts's prompt) until the user continues as new or restores.
async function promptUntilResolved(
  provider: UnlockablePrivateStateProvider,
  ctx: UnlockContext,
  mode: PasswordMode,
): Promise<UnlockOutcome> {
  let error: string | null = null;
  for (;;) {
    const submission = await requestPassword(mode, error);
    try {
      if (submission.kind === 'new') {
        // 'locked' + new = the user gave up on the identity they can't open (no recovery code):
        // drop that entry so a fresh one can be created in its place.
        if (mode === 'locked') await provider.remove(ctx.privateStateKey);
        const code = generateRecoveryCode();
        setStoragePassword(code);
        storeRecoveryCode(ctx.coinPublicKey, code, false);
        return 'new';
      }
      const code = normalizeRecoveryCode(submission.password);
      const invalid = validateStoragePassword(code);
      if (invalid) {
        error = invalid;
        continue;
      }
      await restore(provider, ctx, code, submission.source);
      storeRecoveryCode(ctx.coinPublicKey, code, true);
      return 'restored';
    } catch (failure) {
      error = failure instanceof Error ? failure.message : String(failure);
    }
  }
}

// Runs between building the providers and the first private-state read of a connect. Silent in
// every normal case; only prompts (inside the wallet popup) when this browser has no key for the
// wallet. Rejects with PasswordRequestCancelledError if the user cancels that prompt.
export async function unlockPrivateState(
  provider: UnlockablePrivateStateProvider,
  ctx: UnlockContext,
): Promise<UnlockOutcome> {
  const stored = getStoredRecoveryCode(ctx.coinPublicKey);
  if (stored && (await readsWith(provider, ctx.privateStateKey, stored)).ok) {
    setStoragePassword(stored);
    return 'existing';
  }

  // Still under the legacy dev password (never connected since per-wallet keys, or the key was
  // generated elsewhere first — e.g. the admin deploy page): re-encrypt just this entry.
  const legacy = await readsWith(provider, ctx.privateStateKey, LEGACY_STORAGE_PASSWORD);
  if (legacy.ok && legacy.state) {
    const code = stored ?? generateRecoveryCode();
    setStoragePassword(code);
    await provider.set(ctx.privateStateKey, legacy.state);
    if (!stored) storeRecoveryCode(ctx.coinPublicKey, code, false);
    return 'migrated';
  }

  // (A stored key that reads nothing just returned 'existing' above — e.g. a new deployment.)
  // Nothing stored and no key: first time for this wallet here. Stored but unreadable with every key
  // this browser has: it's under a lost key — only the recovery code opens it.
  return promptUntilResolved(provider, ctx, legacy.ok ? 'welcome' : 'locked');
}
