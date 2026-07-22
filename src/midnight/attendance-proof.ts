// Basic "Prove Attendance" support (roadmap TASK-029: "basic" scope — proving the caller holds a
// token at all, not richer selective-disclosure claims). Every claimOrUpdate call is already a
// ZK-proved, on-chain-verified transaction; the "proof" here is exposing that fact clearly in the
// UI via the last claim's transaction hash, not new cryptography.
//
// Richer proofs ("attended >= N events without revealing which") would need new circuits added to
// poap.compact in the poap-midnight repo — out of scope for this frontend-only pass.
//
// Stored in localStorage, not private state: this is a UI convenience pointer to the most recent
// claim tx for a given issuer, scoped to this browser. The contract never reads it.
const LAST_CLAIM_TX_PREFIX = "adasouls:midnight:lastClaimTx:";

export function recordLastClaimTx(issuerPkHex: string, txHash: string): void {
  window.localStorage.setItem(`${LAST_CLAIM_TX_PREFIX}${issuerPkHex}`, txHash);
}

export function getLastClaimTx(issuerPkHex: string): string | null {
  return window.localStorage.getItem(`${LAST_CLAIM_TX_PREFIX}${issuerPkHex}`);
}
