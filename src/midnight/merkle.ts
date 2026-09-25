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

export type MerkleTreeResult = {
  rootBytes: Uint8Array;
  leafCount: number; // real leaves only, excludes padding
  pathForIndex(index: number): MerklePathResult;
  pathForLeaf(leafBytes32: Uint8Array): MerklePathResult;
};

function bytesEqual(a: Uint8Array, b: Uint8Array): boolean {
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) {
    if (a[i] !== b[i]) return false;
  }
  return true;
}

const ZERO_LEAF = new Uint8Array(32);
let zeroLeafDigestPromise: Promise<bigint> | null = null;
function zeroLeafDigest(): Promise<bigint> {
  if (!zeroLeafDigestPromise) zeroLeafDigestPromise = leafDigestField(ZERO_LEAF);
  return zeroLeafDigestPromise;
}

/**
 * Builds a real Merkle tree over N leaves (padded with a shared zero-leaf digest up to 2**depth),
 * unlike buildMerklePath above which only ever handles a single real leaf with caller-supplied
 * (or default all-zero-field) siblings. Needed once an event commits more than one private
 * attribute, or a disclosure request's candidate set has more than one member — see
 * docs/selective-disclosure-ui-design.md.
 *
 * NOT interchangeable with buildMerklePath's default padding for the single-leaf case: that
 * function pads with a raw field value of 0n, this one pads with the real digest of an all-zero
 * Bytes<32> leaf. Both are internally self-consistent (a path this function returns always
 * verifies against this function's own root), they just don't produce the same root for the same
 * single leaf — don't assume the two are swappable.
 *
 * depth must be 8 for an attribute tree or 16 for a set-membership tree (see poap.compact's
 * proveAttributeMembership). leaves.length must be between 1 and 2**depth.
 */
// transientHash is synchronous WASM, ~0.25 ms per call: a range question's set (tens of thousands of
// values, see attribute-types.ts) would block the page for seconds. Hand control back to the
// browser every YIELD_EVERY hashes so the progress popup keeps animating.
const YIELD_EVERY = 1000;
const yieldToBrowser = () => new Promise<void>((resolve) => setTimeout(resolve, 0));

export async function buildMerkleTree(leaves: Uint8Array[], depth: number): Promise<MerkleTreeResult> {
  const capacity = 2 ** depth;
  if (leaves.length < 1 || leaves.length > capacity) {
    throw new Error(`buildMerkleTree: expected 1-${capacity} leaves for depth ${depth}, got ${leaves.length}`);
  }

  const realDigests = await Promise.all(leaves.map(leafDigestField));
  const padding = capacity - leaves.length;

  // Every padding leaf has the same digest, so a subtree made only of padding hashes to the same
  // value at each level: compute it once per level (paddingAt) and only hash the nodes that have a
  // real leaf under them. Same root and paths as hashing all 2**depth leaves, but a depth-16 set of
  // a few values takes ~depth hashes instead of 65,535 — which froze the page on the main thread.
  const paddingAt: bigint[] = new Array(depth + 1);
  if (padding > 0) {
    paddingAt[0] = await zeroLeafDigest();
    for (let level = 1; level <= depth; level++) {
      paddingAt[level] = transientHash(FIELD_PAIR, [paddingAt[level - 1], paddingAt[level - 1]]);
    }
  }

  // levels[level] holds only the nodes with at least one real leaf below; the rest are paddingAt.
  const levels: bigint[][] = new Array(depth + 1);
  levels[0] = realDigests;
  const nodeAt = (level: number, index: number): bigint =>
    index < levels[level].length ? levels[level][index] : paddingAt[level];
  let hashed = 0;
  for (let level = 1; level <= depth; level++) {
    const next: bigint[] = new Array(Math.ceil(levels[level - 1].length / 2));
    for (let k = 0; k < next.length; k++) {
      next[k] = transientHash(FIELD_PAIR, [nodeAt(level - 1, 2 * k), nodeAt(level - 1, 2 * k + 1)]);
      if (++hashed % YIELD_EVERY === 0) await yieldToBrowser();
    }
    levels[level] = next;
  }
  const rootBytes = upgradeFromTransient(levels[depth][0]);

  function pathForIndex(index: number): MerklePathResult {
    if (index < 0 || index >= leaves.length) {
      throw new Error(`buildMerkleTree: index ${index} out of range for ${leaves.length} leaves`);
    }
    const path: MerkleTreePathEntryArg[] = [];
    let i = index;
    for (let level = 0; level < depth; level++) {
      const sibling = nodeAt(level, i ^ 1);
      const goesLeft = i % 2 === 0;
      path.push({ sibling: { field: sibling }, goes_left: goesLeft });
      i = i >> 1;
    }
    return { leaf: leaves[index], path, rootBytes };
  }

  function pathForLeaf(leafBytes32: Uint8Array): MerklePathResult {
    const index = leaves.findIndex((leaf) => bytesEqual(leaf, leafBytes32));
    if (index === -1) {
      throw new Error('buildMerkleTree: leaf not found among the tree\'s original leaves');
    }
    return pathForIndex(index);
  }

  return { rootBytes, leafCount: leaves.length, pathForIndex, pathForLeaf };
}

/**
 * Recomputes the root digest (as a Field, the form MerkleTree.checkRoot takes) of a path the
 * LEDGER handed back — e.g. ledger.credentials.pathForLeaf(tokenId, leaf). Same algorithm as
 * merkleTreePathRoot in the contract, so `credentials.checkRoot({ field })` tells whether that leaf
 * really sits at that index in a known version of the on-chain tree.
 */
export async function merklePathRootField(path: MerkleTreePathArg): Promise<bigint> {
  let acc = await leafDigestField(path.leaf);
  for (const entry of path.path) {
    const sibling = entry.sibling.field;
    acc = transientHash(FIELD_PAIR, entry.goes_left ? [acc, sibling] : [sibling, acc]);
  }
  return acc;
}
