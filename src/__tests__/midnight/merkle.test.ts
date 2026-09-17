// @midnight-ntwrk/compact-runtime's transientHash/degradeToTransient/upgradeFromTransient are
// backed by a WASM-bindgen build (@midnight-ntwrk/onchain-runtime-v3) that only ships a
// package.json "exports" map with no "main" field. Jest 27 (react-scripts 5's bundled version)
// doesn't resolve "exports" at all, and its Node/fs-loading fallback build uses `import.meta.url`
// (no CJS equivalent, breaks under Jest's babel-CJS transform even with an import.meta plugin —
// tried and hit a separate hoisting bug in the transformed output). Getting the REAL WASM Poseidon
// hash executing under this project's current Jest/Babel setup is a toolchain project of its own,
// out of scope here — see project memory for the WASM/CJS fragility this whole dependency chain is
// known for (craco.config.js's webpack shims exist for the exact same category of problem).
//
// So this file mocks only the three WASM-backed primitives with simple deterministic stand-ins
// (order-sensitive, leaf-count-sensitive, but NOT cryptographically secure) to verify
// buildMerkleTree's own tree-construction logic — indexing, padding, and pathForIndex/pathForLeaf
// correctness — independent of what the underlying hash function actually is. The leaf-hashing
// step (crypto.subtle SHA-256) is real, unmocked Web Crypto, needing no WASM at all. Real
// cryptographic correctness against the actual on-chain Poseidon hash is verified separately by the
// live end-to-end pass against the local devnet deploy (see docs/selective-disclosure-ui-design.md's
// verification section) — publishing a request and proving membership against a real deployed
// contract is what actually exercises the genuine WASM primitives.
function mockDegradeToTransient(bytes: Uint8Array): bigint {
  let v = 0n;
  for (const b of bytes) v = (v << 8n) | BigInt(b);
  return v;
}

function mockUpgradeFromTransient(field: bigint): Uint8Array {
  const out = new Uint8Array(32);
  let v = field;
  for (let i = 31; i >= 0; i--) {
    out[i] = Number(v & 0xffn);
    v >>= 8n;
  }
  return out;
}

function mockTransientHash(_type: unknown, [a, b]: [bigint, bigint]): bigint {
  // Order-sensitive (a and b are not interchangeable) and leaf-count-sensitive (padding changes
  // the input set), which is all these structural tests need — not a real Poseidon hash.
  return (a * 1000003n + b * 998244353n + 1n) % 2n ** 256n;
}

jest.mock('@midnight-ntwrk/compact-runtime', () => ({
  transientHash: (type: unknown, pair: [bigint, bigint]) => mockTransientHash(type, pair),
  degradeToTransient: (bytes: Uint8Array) => mockDegradeToTransient(bytes),
  upgradeFromTransient: (field: bigint) => mockUpgradeFromTransient(field),
  CompactTypeField: {},
  CompactTypeVector: class MockCompactTypeVector {
    n: number;
    type: unknown;
    constructor(n: number, type: unknown) {
      this.n = n;
      this.type = type;
    }
  },
}));

import { buildMerkleTree, buildMerklePath, type MerkleTreePathEntryArg } from '../../midnight/merkle';

const LEAF_DOMAIN_SEP = new TextEncoder().encode('mdn:lh');

function concatBytes(a: Uint8Array, b: Uint8Array): Uint8Array {
  const out = new Uint8Array(a.length + b.length);
  out.set(a, 0);
  out.set(b, a.length);
  return out;
}

async function leafDigestField(leafBytes32: Uint8Array): Promise<bigint> {
  const digest = await crypto.subtle.digest('SHA-256', concatBytes(LEAF_DOMAIN_SEP, leafBytes32));
  return mockDegradeToTransient(new Uint8Array(digest));
}

async function replayToRoot(leafBytes32: Uint8Array, path: MerkleTreePathEntryArg[]): Promise<Uint8Array> {
  let acc = await leafDigestField(leafBytes32);
  for (const entry of path) {
    const sibling = entry.sibling.field;
    const left = entry.goes_left ? acc : sibling;
    const right = entry.goes_left ? sibling : acc;
    acc = mockTransientHash(null, [left, right]);
  }
  return mockUpgradeFromTransient(acc);
}

function leaf(byte: number): Uint8Array {
  const bytes = new Uint8Array(32);
  bytes[0] = byte;
  return bytes;
}

describe('buildMerkleTree', () => {
  it('produces a single-leaf tree whose path replays to the same root', async () => {
    const l0 = leaf(1);
    const tree = await buildMerkleTree([l0], 8);
    expect(tree.leafCount).toBe(1);
    const replayed = await replayToRoot(l0, tree.pathForIndex(0).path);
    expect(replayed).toEqual(tree.rootBytes);
  });

  it('every leaf of a multi-leaf tree replays to the same root via its own path', async () => {
    const leaves = [leaf(1), leaf(2), leaf(3)];
    const tree = await buildMerkleTree(leaves, 8);
    expect(tree.leafCount).toBe(3);
    for (let i = 0; i < leaves.length; i++) {
      const replayed = await replayToRoot(leaves[i], tree.pathForIndex(i).path);
      expect(replayed).toEqual(tree.rootBytes);
    }
  });

  it('pathForLeaf finds the correct index by exact leaf bytes', async () => {
    const leaves = [leaf(1), leaf(2), leaf(3)];
    const tree = await buildMerkleTree(leaves, 8);
    const byIndex = tree.pathForIndex(1);
    const byLeaf = tree.pathForLeaf(leaf(2));
    expect(byLeaf.path).toEqual(byIndex.path);
    expect(byLeaf.rootBytes).toEqual(tree.rootBytes);
  });

  it('pathForLeaf throws for a leaf that was never committed', async () => {
    const tree = await buildMerkleTree([leaf(1), leaf(2)], 8);
    expect(() => tree.pathForLeaf(leaf(99))).toThrow('leaf not found');
  });

  it('pathForIndex throws for an out-of-range index', async () => {
    const tree = await buildMerkleTree([leaf(1), leaf(2)], 8);
    expect(() => tree.pathForIndex(2)).toThrow('out of range');
    expect(() => tree.pathForIndex(-1)).toThrow('out of range');
  });

  it('a genuinely different second leaf changes the root from the single-leaf (implicitly zero-padded) case', async () => {
    const single = await buildMerkleTree([leaf(1)], 8);
    const withSecondLeaf = await buildMerkleTree([leaf(1), leaf(2)], 8);
    expect(withSecondLeaf.rootBytes).not.toEqual(single.rootBytes);
  });

  it('an explicit all-zero-byte leaf is indistinguishable from padding at the same slot (by design — padding uses the real all-zero leaf digest, not a sentinel)', async () => {
    const zeroLeaf = new Uint8Array(32);
    const single = await buildMerkleTree([leaf(1)], 8);
    const withExplicitZero = await buildMerkleTree([leaf(1), zeroLeaf], 8);
    expect(withExplicitZero.rootBytes).toEqual(single.rootBytes);
    // leafCount still reflects what was actually passed in, even though the root collides.
    expect(single.leafCount).toBe(1);
    expect(withExplicitZero.leafCount).toBe(2);
  });

  it('rejects more leaves than the tree depth can hold', async () => {
    const tooMany = [leaf(1), leaf(2), leaf(3)];
    await expect(buildMerkleTree(tooMany, 1)).rejects.toThrow('expected 1-2 leaves');
  });

  it('rejects an empty leaf list', async () => {
    await expect(buildMerkleTree([], 8)).rejects.toThrow('expected 1-256 leaves');
  });

  it('is not interchangeable with buildMerklePath\'s default single-leaf padding', async () => {
    const l0 = leaf(1);
    const tree = await buildMerkleTree([l0], 8);
    const viaPath = await buildMerklePath(l0, 8);
    expect(tree.rootBytes).not.toEqual(viaPath.rootBytes);
  });
});
