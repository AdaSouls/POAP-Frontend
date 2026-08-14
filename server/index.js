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

if (!PINATA_JWT) {
  console.error('[ipfs-server] Missing PINATA_JWT env var — copy .env.example to .env and fill it in.');
  process.exit(1);
}

const app = express();
app.use(cors({ origin: CORS_ALLOWED_ORIGIN }));
app.use(express.json());

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });

async function pinToIpfs(blob, filename) {
  const form = new FormData();
  form.append('file', blob, filename);
  form.append('network', 'public');

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
    const uri = await pinToIpfs(blob, req.file.originalname || 'image');
    res.json({ uri });
  } catch (error) {
    console.error('[ipfs-server] upload-image failed:', error);
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/ipfs/upload-json', async (req, res) => {
  try {
    const blob = new Blob([JSON.stringify(req.body)], { type: 'application/json' });
    const uri = await pinToIpfs(blob, 'metadata.json');
    res.json({ uri });
  } catch (error) {
    console.error('[ipfs-server] upload-json failed:', error);
    res.status(500).json({ error: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`[ipfs-server] listening on http://localhost:${PORT}`);
});
