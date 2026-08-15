// Reconstructs/derives the ipfs:// CID for a private-event-metadata blob purely from its 32-byte
// digest — no URI ever needs to be stored anywhere, since the digest alone is enough to rebuild
// it. Verified empirically against the real Pinata API (2026-08-14): a single-file JSON upload via
// Pinata's v3 Files API always comes back as CIDv1 + raw codec + sha2-256, with the CID's own
// digest bytes equal to sha256(exact uploaded bytes) — no UnixFS/dag-pb wrapping that would change
// the hash. See server/index.js's cidFromDigestHex for the server-side twin of this function (a
// separate JS runtime/package, can't literally share code — keep the header bytes below in sync by
// hand if this ever changes).
const CID_HEADER = [0x01, 0x55, 0x12, 0x20] as const; // CIDv1, codec=raw, hash-fn=sha2-256, len=32

// RFC4648 base32 (lowercase, no padding) — the alphabet multibase's "b" prefix uses.
const BASE32_ALPHABET = 'abcdefghijklmnopqrstuvwxyz234567';

function base32Encode(bytes: number[]): string {
  let bits = '';
  for (const byte of bytes) bits += byte.toString(2).padStart(8, '0');
  let out = '';
  for (let i = 0; i < bits.length; i += 5) {
    const chunk = bits.slice(i, i + 5).padEnd(5, '0');
    out += BASE32_ALPHABET[parseInt(chunk, 2)];
  }
  return out;
}

export function cidFromDigest(digestBytes: Uint8Array): string {
  if (digestBytes.length !== 32) throw new Error('Expected a 32-byte digest');
  return 'b' + base32Encode([...CID_HEADER, ...Array.from(digestBytes)]);
}

// SHA-256 of a UTF-8 string via the browser's Web Crypto API — this is `value` in
// computePrivateMetadataCommit(value, rand), the thing actually committed on-chain. Async because
// crypto.subtle.digest is; every caller (createEvent.jsx) is already inside an async submit
// handler.
export async function sha256(text: string): Promise<Uint8Array> {
  const encoded = new TextEncoder().encode(text);
  const digest = await crypto.subtle.digest('SHA-256', encoded);
  return new Uint8Array(digest);
}
