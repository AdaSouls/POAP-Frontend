import { cidFromDigest, sha256 } from '../../utils/cid';

// This exact content/digest/CID triple was verified against the real Pinata v3 API (2026-08-14,
// see server/index.js's cidFromDigestHex comment) — not fabricated. Uploading this JSON returned
// this CID; decoding the CID's own base32 multibase gave back exactly this digest.
const REAL_CONTENT = '{"probe":"cid-digest-test","n":1}';
const REAL_DIGEST_HEX = 'e8463e6d62366427a28fe7aa077619fca4499c189a70ff3c29bb22d9c38537cd';
const REAL_CID = 'bafkreihiiy7g2yrwmqt2fd7hvidxmgp4urezyge2od7tykn3elm4hbjxzu';

function hexToBytes(hex: string): Uint8Array {
  return Uint8Array.from(Buffer.from(hex, 'hex'));
}

describe('cid utils', () => {
  it('sha256 matches the digest Pinata\'s own CID embeds for the same real content', async () => {
    const digest = await sha256(REAL_CONTENT);
    expect(Buffer.from(digest).toString('hex')).toBe(REAL_DIGEST_HEX);
  });

  it('cidFromDigest reconstructs the exact CID Pinata returned for that same digest', () => {
    expect(cidFromDigest(hexToBytes(REAL_DIGEST_HEX))).toBe(REAL_CID);
  });

  it('rejects a digest that is not exactly 32 bytes', () => {
    expect(() => cidFromDigest(new Uint8Array(31))).toThrow('Expected a 32-byte digest');
    expect(() => cidFromDigest(new Uint8Array(33))).toThrow('Expected a 32-byte digest');
  });
});
