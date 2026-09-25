// Shared Bytes<32> encoding for a private-attribute value (selective disclosure). Used by every
// place that needs to produce the exact same leaf bytes for a given human value with zero
// coordination beyond the text itself: the organizer issuing a credential's values (credential-delivery.ts),
// a verifier building a candidate-set tree to publish a disclosure request against
// (publishDisclosureRequest.jsx), and the holder proving their value is in that set
// (holder-proofs.ts) — the circuit asserts `setMembershipPath.leaf == value` verbatim.
//
// Scheme: trimmed UTF-8, right-padded with zero bytes to exactly 32 bytes. No hashing — this caps
// attribute values at 32 raw UTF-8 bytes, but keeps the encoding simple, symmetric, and legible in
// hex, which fits the "short categorical fact" use case poap.compact's own comments describe (e.g.
// "this event's region is in the EU") rather than free text. Confirmed with the user 2026-09-17: a
// hash-based scheme would remove the length cap but make any normalization mismatch between the two
// independent callers (organizer vs. verifier) a silent, undiagnosable proof failure — not worth it
// for a first version.
export function encodeAttributeValue(raw: string): Uint8Array {
  const trimmed = raw.trim();
  const utf8 = new TextEncoder().encode(trimmed);
  if (utf8.length > 32) {
    throw new Error(
      `Attribute value is ${utf8.length} bytes as UTF-8, exceeds the 32-byte limit: "${trimmed}"`,
    );
  }
  const out = new Uint8Array(32);
  out.set(utf8, 0);
  return out;
}
