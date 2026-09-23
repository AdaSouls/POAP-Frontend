// One progress popup per user action (TxStatusPopup.jsx), from the first "Uploading image to
// IPFS…" message through every transaction stage to the final success/error — the text inside the
// same card changes per stage instead of opening and closing a new alert for each message.
//
// Fed from two places: the sweetalert helpers (sweetAlerts.jsx's loadingFunction pushes a step,
// succesfullBlockchainCreation/errorFunction deliver the result when this is open) and the
// provider wrappers in providers.ts (setTxPhase, one step per prove -> balance -> submit -> watch
// stage). Deliberately SDK-free and React-free so both sides can import it cheaply.
//
// Steps play strictly one at a time: spinner while running, green check once the NEXT thing
// arrives (another step, or the success result), then it slides up into a dimmed "previous" slot
// while the next one enters below it, and the step that was already dimmed there slides out of
// view. Every step gets that beat even when the real work behind it was near-instant.

export type TxPhase = 'idle' | 'proving' | 'approving' | 'submitting' | 'confirming' | 'confirmed';

export type ProgressResult = { kind: 'success' | 'error'; title: string; message: string };

// role: 'current' (the live one), 'previous' (just finished, dimmed above it), 'exiting' (was
// 'previous', sliding out — kept only for its exit animation). `id` is a stable React key so the
// same element transitions between roles instead of being re-created.
export type ProgressStep = {
  id: number;
  label: string;
  status: 'running' | 'done';
  role: 'current' | 'previous' | 'exiting';
};

export type ProgressSnapshot = {
  open: boolean;
  title: string;
  steps: ProgressStep[];
  result: ProgressResult | null;
};

const TX_PHASE_LABELS: Partial<Record<TxPhase, string>> = {
  proving: 'Generating zero-knowledge proof',
  approving: 'Approve the transaction in your wallet',
  submitting: 'Submitting transaction',
  confirming: 'Waiting for on-chain confirmation',
};

export const MIN_RUNNING_MS = 500; // spinner is always visible at least this long
export const DONE_MS = 700; // how long the green check shows in the live slot before shifting up
export const SHIFT_MS = 400; // must match .tx-status-step's transition in theme-dark-glass.css
export const RESULT_MS = 5_000; // same as the sweetalerts' own timer
// A failed transaction whose caller never reports an error (or a flow that simply ends without a
// result) still closes on its own instead of leaving a spinner up forever.
const ORPHAN_CLOSE_MS = 3_000;

const CLOSED: ProgressSnapshot = { open: false, title: '', steps: [], result: null };

let snapshot: ProgressSnapshot = CLOSED;
let queue: string[] = [];
let pendingResult: ProgressResult | null = null;
let runningSince = 0;
let nextStepId = 0;
let timer: ReturnType<typeof setTimeout> | undefined;
let orphanTimer: ReturnType<typeof setTimeout> | undefined;
const listeners = new Set<(snapshot: ProgressSnapshot) => void>();

function emit(next: ProgressSnapshot): void {
  snapshot = next;
  listeners.forEach((listener) => listener(snapshot));
}

function clearTimers(): void {
  clearTimeout(timer);
  clearTimeout(orphanTimer);
  timer = undefined;
  orphanTimer = undefined;
}

function schedule(ms: number, fn: () => void): void {
  clearTimeout(timer);
  timer = setTimeout(fn, ms);
}

function currentStep(): ProgressStep | undefined {
  return snapshot.steps.find((step) => step.role === 'current');
}

function startStep(label: string): void {
  runningSince = Date.now();
  const shifted = snapshot.steps
    .filter((step) => step.role !== 'exiting')
    .map((step): ProgressStep => ({ ...step, role: step.role === 'current' ? 'previous' : 'exiting' }));
  const entering: ProgressStep = { id: nextStepId++, label, status: 'running', role: 'current' };
  emit({ ...snapshot, steps: [...shifted, entering] });
  // Drop the step that just slid out once its exit transition is over. Own timer, not `timer`
  // (that one is already driving the new step's own running -> done beat).
  const exitingIds = shifted.filter((step) => step.role === 'exiting').map((step) => step.id);
  if (exitingIds.length) {
    setTimeout(() => {
      emit({ ...snapshot, steps: snapshot.steps.filter((step) => !exitingIds.includes(step.id)) });
    }, SHIFT_MS);
  }
  advance();
}

function showResult(result: ProgressResult): void {
  pendingResult = null;
  emit({ ...snapshot, steps: [], result });
  schedule(RESULT_MS, closeProgress);
}

// Moves the current step along only once there's something to move on to.
function advance(): void {
  const step = currentStep();
  if (!step || step.status !== 'running') return;
  if (queue.length === 0 && !pendingResult) return;
  const wait = MIN_RUNNING_MS - (Date.now() - runningSince);
  schedule(Math.max(wait, 0), () => {
    emit({ ...snapshot, steps: snapshot.steps.map((s) => (s.id === step.id ? { ...s, status: 'done' } : s)) });
    schedule(DONE_MS, () => {
      const next = queue.shift();
      if (next !== undefined) startStep(next);
      else if (pendingResult) showResult(pendingResult);
    });
  });
}

export function pushProgressStep(title: string, label: string): void {
  clearTimeout(orphanTimer);
  if (!snapshot.open || snapshot.result) {
    clearTimers();
    queue = [];
    pendingResult = null;
    emit({ open: true, title, steps: [], result: null });
  } else if (title && title !== snapshot.title) {
    emit({ ...snapshot, title });
  }
  const last = queue.length ? queue[queue.length - 1] : currentStep()?.label;
  if (label === last) return;
  if (!currentStep()) startStep(label);
  else {
    queue.push(label);
    advance();
  }
}

// Returns false when no progress popup is open, so the caller falls back to a plain alert.
export function finishProgress(result: ProgressResult): boolean {
  if (!snapshot.open || snapshot.result) return false;
  clearTimeout(orphanTimer);
  if (result.kind === 'error' || !currentStep()) {
    // An error cuts straight to the result — no success check on a step that didn't succeed.
    clearTimers();
    queue = [];
    showResult(result);
  } else {
    pendingResult = result;
    advance();
  }
  return true;
}

export function closeProgress(): void {
  clearTimers();
  queue = [];
  pendingResult = null;
  emit(CLOSED);
}

function closeIfOrphaned(): void {
  clearTimeout(orphanTimer);
  orphanTimer = setTimeout(() => {
    if (!snapshot.open || snapshot.result || pendingResult) return;
    // Earlier steps can still be queued up playing their check/fade beat — only count as
    // orphaned once the last step is actually the one on screen.
    if (queue.length > 0 || currentStep()?.status !== 'running') closeIfOrphaned();
    else closeProgress();
  }, ORPHAN_CLOSE_MS);
}

export function setTxPhase(phase: TxPhase): void {
  const label = TX_PHASE_LABELS[phase];
  if (label) pushProgressStep(snapshot.title || 'Transaction in progress', label);
  else if (snapshot.open) closeIfOrphaned(); // 'confirmed' or 'idle' (failure): wait for the caller's result
}

export function subscribeProgress(listener: (snapshot: ProgressSnapshot) => void): () => void {
  listeners.add(listener);
  listener(snapshot);
  return () => {
    listeners.delete(listener);
  };
}

// Enters `phase` for the duration of `call`; a failure reports 'idle' so the popup waits for the
// caller's own errorFunction (or closes itself if none comes).
export async function trackTxPhase<T>(phase: TxPhase, call: () => Promise<T>): Promise<T> {
  setTxPhase(phase);
  try {
    return await call();
  } catch (error) {
    setTxPhase('idle');
    throw error;
  }
}
