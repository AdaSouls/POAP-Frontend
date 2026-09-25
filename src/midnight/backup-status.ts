// Per-wallet, per-contract bookkeeping for encrypted backups (backup.ts): when the last backup was
// made, whether anything worth backing up changed since, and whether auto cloud backup is on.
// SDK-free and dependency-free on purpose — providers.ts, credential-store.ts and proof-history.ts
// mark changes through here, and backup.ts itself imports those modules.

type StoredBackupStatus = {
  lastBackupAt: string | null;
  dirty: boolean;
  autoBackup: boolean;
};

// `syncing` (an upload is scheduled or running) and `syncFailed` (the last one failed) only
// describe this page's session, so they're kept in memory and never persisted.
export type BackupStatus = StoredBackupStatus & {
  syncing: boolean;
  syncFailed: boolean;
};

type BackupContext = { coinPublicKey: string; contractAddress: string };

const STATUS_PREFIX = 'adasouls:backup:';
// Auto cloud backup is on unless the user turned it off: the key lives in this browser, so
// there's nothing to ask for and no reason to wait for a manual first backup.
const EMPTY: StoredBackupStatus = { lastBackupAt: null, dirty: false, autoBackup: true };

let context: BackupContext | null = null;
let sync = { syncing: false, syncFailed: false };
const statusListeners = new Set<(status: BackupStatus | null) => void>();
const dirtyListeners = new Set<() => void>();

function storageKey(ctx: BackupContext): string {
  return `${STATUS_PREFIX}${ctx.coinPublicKey}:${ctx.contractAddress}`;
}

function readStored(ctx: BackupContext): StoredBackupStatus {
  try {
    const raw = window.localStorage.getItem(storageKey(ctx));
    if (!raw) return EMPTY;
    const { lastBackupAt, dirty, autoBackup } = { ...EMPTY, ...(JSON.parse(raw) as Partial<StoredBackupStatus>) };
    return { lastBackupAt, dirty, autoBackup };
  } catch {
    return EMPTY;
  }
}

function read(ctx: BackupContext): BackupStatus {
  return { ...readStored(ctx), ...sync };
}

function emit(): void {
  const status = getBackupStatus();
  statusListeners.forEach((listener) => listener(status));
}

function write(patch: Partial<StoredBackupStatus>): void {
  if (!context) return;
  const next = { ...readStored(context), ...patch };
  try {
    window.localStorage.setItem(storageKey(context), JSON.stringify(next));
  } catch {
    // Storage full/blocked: the status is a convenience, the backup itself doesn't depend on it.
  }
  emit();
}

// Set once a wallet finishes connecting, cleared on disconnect. Nothing is tracked without one.
export function setBackupContext(next: BackupContext | null): void {
  context = next;
  sync = { syncing: false, syncFailed: false };
  emit();
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

// backup.ts reports its cloud uploads here so the header can show "saving" instead of a warning.
export function setBackupSync(next: { syncing: boolean; syncFailed?: boolean }): void {
  sync = { syncing: next.syncing, syncFailed: next.syncFailed ?? false };
  emit();
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
