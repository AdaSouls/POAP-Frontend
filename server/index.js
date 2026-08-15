// Local-only proxy: holds the Pinata secret server-side so it never ends up in the frontend's
// public JS bundle. The frontend's src/services/ipfs.service.ts calls these two routes instead of
// Pinata directly. See the "structured event metadata via IPFS" plan for the full architecture
// note (server/ is a stand-in for wherever this ends up hosted for real later — same API shape).
require('dotenv/config');
const express = require('express');
const cors = require('cors');
const multer = require('multer');

const PORT = process.env.PORT || 4000;
const PINATA_JWT = process.env.PINATA_JWT;
const CORS_ALLOWED_ORIGIN = process.env.CORS_ALLOWED_ORIGIN || 'http://localhost:3000';
const PINATA_UPLOAD_URL = 'https://uploads.pinata.cloud/v3/files';
const PINATA_GATEWAYS_URL = 'https://api.pinata.cloud/v3/gateways';
const PINATA_SIGNED_URL_URL = 'https://api.pinata.cloud/v3/files/private/download_link';
// How long a signed URL stays valid — just long enough for the frontend to fetch it once right
// after asking, not meant to be cached/reused by the client.
const SIGNED_URL_EXPIRES_SECONDS = 300;

if (!PINATA_JWT) {
  console.error('[ipfs-server] Missing PINATA_JWT env var — copy .env.example to .env and fill it in.');
  process.exit(1);
}

const app = express();
app.use(cors({ origin: CORS_ALLOWED_ORIGIN }));
app.use(express.json());

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });

async function pinToIpfs(blob, filename, network) {
  const form = new FormData();
  form.append('file', blob, filename);
  form.append('network', network);

  const response = await fetch(PINATA_UPLOAD_URL, {
    method: 'POST',
    headers: { Authorization: `Bearer ${PINATA_JWT}` },
    body: form,
  });

  if (!response.ok) {
    const text = await response.text().catch(() => '');
    throw new Error(`Pinata upload failed (${response.status}): ${text || response.statusText}`);
  }

  const { data } = await response.json();
  return `ipfs://${data.cid}`;
}

app.post('/api/ipfs/upload-image', upload.single('image'), async (req, res) => {
  if (!req.file) {
    res.status(400).json({ error: 'No image file provided (expected multipart field "image")' });
    return;
  }
  try {
    const blob = new Blob([req.file.buffer], { type: req.file.mimetype });
    const uri = await pinToIpfs(blob, req.file.originalname || 'image', 'public');
    res.json({ uri });
  } catch (error) {
    console.error('[ipfs-server] upload-image failed:', error);
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/ipfs/upload-json', async (req, res) => {
  try {
    const blob = new Blob([JSON.stringify(req.body)], { type: 'application/json' });
    const uri = await pinToIpfs(blob, 'metadata.json', 'public');
    res.json({ uri });
  } catch (error) {
    console.error('[ipfs-server] upload-json failed:', error);
    res.status(500).json({ error: error.message });
  }
});

// Private-event free-text metadata (see poap.compact's privateMetadataCommit/
// computePrivateMetadataCommit/revealPrivateMetadata) — same shape as /upload-json, but pinned to
// Pinata's private network so the content is genuinely unreachable from any public IPFS gateway
// until the frontend explicitly asks this server for a signed URL (see /private-signed-url below).
// Verified directly against the real Pinata API: private-network uploads still produce a CID whose
// digest equals sha256(the exact uploaded bytes) — same as public network — which is what lets the
// frontend compute `value` (the on-chain commit input) locally and reconstruct this same CID later
// from nothing but those 32 bytes.
app.post('/api/ipfs/upload-json-private', async (req, res) => {
  try {
    const blob = new Blob([JSON.stringify(req.body)], { type: 'application/json' });
    const uri = await pinToIpfs(blob, 'private-metadata.json', 'private');
    res.json({ uri });
  } catch (error) {
    console.error('[ipfs-server] upload-json-private failed:', error);
    res.status(500).json({ error: error.message });
  }
});

// RFC4648 base32 (lowercase, no padding) — the alphabet multibase's "b" prefix uses.
const BASE32_ALPHABET = 'abcdefghijklmnopqrstuvwxyz234567';
function base32Encode(bytes) {
  let bits = '';
  for (const byte of bytes) bits += byte.toString(2).padStart(8, '0');
  // Pad the bit string out to a multiple of 5 so the final group encodes cleanly; multibase's
  // base32 variant is unpadded (no trailing '='), so we just stop once we've consumed every bit.
  let out = '';
  for (let i = 0; i < bits.length; i += 5) {
    const chunk = bits.slice(i, i + 5).padEnd(5, '0');
    out += BASE32_ALPHABET[parseInt(chunk, 2)];
  }
  return out;
}

// Reconstructs the ipfs:// CID for a private-metadata blob purely from its committed digest — no
// URI is ever stored anywhere. Fixed header matches exactly what Pinata's v3 API returns for a
// single JSON upload (confirmed empirically this session, not assumed): CIDv1 (0x01), codec=raw
// (0x55), hash-fn=sha2-256 (0x12), digest length=32 (0x20). See src/utils/cid.ts on the frontend
// side for the matching encoder — kept as two independent implementations (this is a separate JS
// runtime/package from the frontend) but must stay byte-for-byte identical if either ever changes.
const CID_HEADER = [0x01, 0x55, 0x12, 0x20];
function cidFromDigestHex(digestHex) {
  const digest = Buffer.from(digestHex, 'hex');
  if (digest.length !== 32) throw new Error('Expected a 32-byte (64 hex char) digest');
  return 'b' + base32Encode([...CID_HEADER, ...digest]);
}

// Cached for the process lifetime — this account has exactly one gateway, and it doesn't change
// between requests. Re-fetched lazily rather than hardcoded so a gateway change on Pinata's side
// doesn't silently start producing dead signed URLs.
let cachedGatewayDomain = null;
async function getGatewayDomain() {
  if (cachedGatewayDomain) return cachedGatewayDomain;
  const response = await fetch(PINATA_GATEWAYS_URL, { headers: { Authorization: `Bearer ${PINATA_JWT}` } });
  if (!response.ok) {
    const text = await response.text().catch(() => '');
    throw new Error(`Pinata gateway lookup failed (${response.status}): ${text || response.statusText}`);
  }
  const { data } = await response.json();
  const domain = data?.rows?.[0]?.domain;
  if (!domain) throw new Error('No Pinata gateway configured for this account');
  cachedGatewayDomain = domain;
  return domain;
}

// Given the 32-byte `value` a client already has (either because it's the organizer who computed
// it at createEvent time, or because it read it off the public ledger's eventRevealedMetadata
// after a reveal — see contract.service.ts), mints a short-lived signed URL for the matching
// private-network file. No on-chain/reveal check happens here on purpose: possessing `value` is
// already the authorization (same "knowing the commit opening IS the authorization" model the
// contract itself uses for revealPrivateMetadata) — value is a persistentCommit-strength 256-bit
// value, not brute-forceable, so this endpoint needs no additional gate.
app.post('/api/ipfs/private-signed-url', async (req, res) => {
  try {
    const { value } = req.body;
    if (typeof value !== 'string' || !/^[0-9a-fA-F]{64}$/.test(value)) {
      res.status(400).json({ error: 'Expected a 32-byte hex "value" (64 hex characters)' });
      return;
    }
    const cid = cidFromDigestHex(value);
    const gatewayDomain = await getGatewayDomain();
    const response = await fetch(PINATA_SIGNED_URL_URL, {
      method: 'POST',
      headers: { Authorization: `Bearer ${PINATA_JWT}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        url: `https://${gatewayDomain}.mypinata.cloud/files/${cid}`,
        expires: SIGNED_URL_EXPIRES_SECONDS,
        date: Math.floor(Date.now() / 1000),
        method: 'GET',
      }),
    });
    if (!response.ok) {
      const text = await response.text().catch(() => '');
      throw new Error(`Pinata signed-URL request failed (${response.status}): ${text || response.statusText}`);
    }
    const { data: url } = await response.json();
    res.json({ url });
  } catch (error) {
    console.error('[ipfs-server] private-signed-url failed:', error);
    res.status(500).json({ error: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`[ipfs-server] listening on http://localhost:${PORT}`);
});
