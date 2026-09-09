// Builds MerkleTreePath fixtures for proveAttributeMembership / proveAttributeMembershipOnce,
// reimplementing merkleTreePathRoot's exact algorithm — ported from
// poap-midnight/contracts/src/test/poap-simulator.ts's buildMerklePath, which was verified there
// against a real compiled contract (60+ passing tests exercising both valid and deliberately
// invalid proofs). Confirmed via direct source inspection of midnightntwrk/midnight-ledger
// (`ledger-8`, commit a94bd39a) and LFDT-Minokawa/compact (`main`, commit 2acb58e):
//   leaf digest = degradeToTransient(SHA256("mdn:lh" ++ leafBytes))
//   combine(acc, sibling, goesLeft) = transientHash<Vector<2,Field>>(
//     goesLeft ? [acc, sibling] : [sibling, acc])
//
// The leaf-hash step is plain SHA-256 — done here via Web Crypto (crypto.subtle), since this runs
// in the browser, not Node (poap-midnight's version used node:crypto — same algorithm, different
// API surface). The per-level combine step calls the REAL exported transientHash from
// @midnight-ntwrk/compact-runtime rather than hand-rolling Poseidon: its exact parameterization
// lives in an external crate (midnight_circuits) that source inspection couldn't reach, so this is
// the only reliable way to reproduce it — and it's literally the same function the compiled
// contract calls internally, not a lookalike.
import {
  transientHash,
  degradeToTransient,
  upgradeFromTransient,
  CompactTypeField,
  CompactTypeVector,
} from '@midnight-ntwrk/compact-runtime';

export type MerkleTreePathEntryArg = { sibling: { field: bigint }; goes_left: boolean };
export type MerkleTreePathArg = { leaf: Uint8Array; path: MerkleTreePathEntryArg[] };

const LEAF_DOMAIN_SEP = new TextEncoder().encode('mdn:lh'); // 6 raw ASCII bytes, prepended verbatim
const FIELD_PAIR = new CompactTypeVector<bigint>(2, CompactTypeField);

function concatBytes(a: Uint8Array, b: Uint8Array): Uint8Array {
  const out = new Uint8Array(a.length + b.length);
  out.set(a, 0);
  out.set(b, a.length);
  return out;
}

async function leafDigestField(leafBytes32: Uint8Array): Promise<bigint> {
  const preimage = concatBytes(LEAF_DOMAIN_SEP, leafBytes32);
  const digest = await crypto.subtle.digest('SHA-256', preimage);
  return degradeToTransient(new Uint8Array(digest));
}

export type MerklePathResult = { leaf: Uint8Array; path: MerkleTreePathEntryArg[]; rootBytes: Uint8Array };

/**
 * Builds a self-consistent MerkleTreePath<depth, Bytes<32>> for a single leaf from caller-supplied
 * (or default all-zero/all-left) siblings — enough to produce a genuinely valid root/path pair
 * without needing a populated multi-leaf tree, since these attribute/set trees are computed
 * off-ledger by the organizer/verifier rather than tracked as an on-chain MerkleTree ledger.
 *
 * depth must be 8 for an attribute path (MerkleTreePath<8, Bytes<32>>) or 16 for a set-membership
 * path (MerkleTreePath<16, Bytes<32>>) — see poap.compact's proveAttributeMembership.
 */
export async function buildMerklePath(
  leafBytes32: Uint8Array,
  depth: number,
  siblings: bigint[] = new Array(depth).fill(0n),
  goesLeft: boolean[] = new Array(depth).fill(true),
): Promise<MerklePathResult> {
  if (siblings.length !== depth || goesLeft.length !== depth) {
    throw new Error(`siblings/goesLeft must have length ${depth}`);
  }
  let acc = await leafDigestField(leafBytes32);
  const path: MerkleTreePathEntryArg[] = [];
  for (let i = 0; i < depth; i++) {
    const sibling = siblings[i];
    const left = goesLeft[i] ? acc : sibling;
    const right = goesLeft[i] ? sibling : acc;
    acc = transientHash(FIELD_PAIR, [left, right]);
    path.push({ sibling: { field: sibling }, goes_left: goesLeft[i] });
  }
  return { leaf: leafBytes32, path, rootBytes: upgradeFromTransient(acc) };
}
