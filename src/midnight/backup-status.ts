// Per-wallet, per-contract bookkeeping for encrypted backups (backup.ts): when the last backup was
// made, whether anything worth backing up changed since, and whether auto cloud backup is on.
// SDK-free and dependency-free on purpose — private-attribute-drafts.ts and providers.ts both mark
// changes through here, and backup.ts itself imports those modules.

export type BackupStatus = {
  lastBackupAt: string | null;
  dirty: boolean;
  autoBackup: boolean;
};

type BackupContext = { coinPublicKey: string; contractAddress: string };

const STATUS_PREFIX = 'adasouls:backup:';
// Auto cloud backup is on unless the user turned it off: the key lives in this browser, so
// there's nothing to ask for and no reason to wait for a manual first backup.
const EMPTY: BackupStatus = { lastBackupAt: null, dirty: false, autoBackup: true };

let context: BackupContext | null = null;
const statusListeners = new Set<(status: BackupStatus | null) => void>();
const dirtyListeners = new Set<() => void>();

function storageKey(ctx: BackupContext): string {
  return `${STATUS_PREFIX}${ctx.coinPublicKey}:${ctx.contractAddress}`;
}

function read(ctx: BackupContext): BackupStatus {
  try {
    const raw = window.localStorage.getItem(storageKey(ctx));
    return raw ? { ...EMPTY, ...(JSON.parse(raw) as Partial<BackupStatus>) } : EMPTY;
  } catch {
    return EMPTY;
  }
}

function write(patch: Partial<BackupStatus>): void {
  if (!context) return;
  const next = { ...read(context), ...patch };
  try {
    window.localStorage.setItem(storageKey(context), JSON.stringify(next));
  } catch {
    // Storage full/blocked: the status is a convenience, the backup itself doesn't depend on it.
  }
  statusListeners.forEach((listener) => listener(next));
}

// Set once a wallet finishes connecting, cleared on disconnect. Nothing is tracked without one.
export function setBackupContext(next: BackupContext | null): void {
  context = next;
  const status = getBackupStatus();
  statusListeners.forEach((listener) => listener(status));
}

export function getBackupContext(): BackupContext | null {
  return context;
}

export function getBackupStatus(): BackupStatus | null {
  return context ? read(context) : null;
}

// Something that belongs in a backup changed (private state written, attribute draft saved).
export function markBackupDirty(): void {
  if (!context) return;
  write({ dirty: true });
  dirtyListeners.forEach((listener) => listener());
}

export function markBackedUp(): void {
  write({ lastBackupAt: new Date().toISOString(), dirty: false });
}

export function setAutoBackup(enabled: boolean): void {
  write({ autoBackup: enabled });
}

export function subscribeBackupStatus(listener: (status: BackupStatus | null) => void): () => void {
  statusListeners.add(listener);
  listener(getBackupStatus());
  return () => {
    statusListeners.delete(listener);
  };
}

export function onBackupDirty(listener: () => void): () => void {
  dirtyListeners.add(listener);
  return () => {
    dirtyListeners.delete(listener);
  };
}
