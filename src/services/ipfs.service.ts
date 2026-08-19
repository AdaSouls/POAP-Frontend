// Talks to the local IPFS proxy server (../../server) instead of Pinata directly — the Pinata
// secret lives server-side only, see server/index.js and the "structured event metadata" plan.
const IPFS_API_URL = process.env.REACT_APP_IPFS_API_URL || 'http://localhost:4000';

async function parseUri(response: Response): Promise<string> {
    if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        throw new Error(body.error || `IPFS upload failed: ${response.statusText}`);
    }
    const { uri } = await response.json();
    return uri;
}

export async function uploadImageToIPFS(file: File | Blob, filename = 'image'): Promise<string> {
    const formData = new FormData();
    formData.append('image', file, filename);

    const response = await fetch(`${IPFS_API_URL}/api/ipfs/upload-image`, {
        method: 'POST',
        body: formData,
    });
    return parseUri(response);
}

export async function uploadJSONToIPFS(metadata: Record<string, unknown>): Promise<string> {
    const response = await fetch(`${IPFS_API_URL}/api/ipfs/upload-json`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(metadata),
    });
    return parseUri(response);
}

// Private-event metadata (poap.compact's privateMetadataCommit) — same shape as uploadJSONToIPFS,
// but pinned to Pinata's private network via the server's separate route, so the content is
// unreachable from any public IPFS gateway until getPrivateContentSignedUrl is used.
export async function uploadPrivateJSONToIPFS(metadata: Record<string, unknown>): Promise<string> {
    const response = await fetch(`${IPFS_API_URL}/api/ipfs/upload-json-private`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(metadata),
    });
    return parseUri(response);
}

// This Pinata account's own dedicated gateway domain (e.g. "abc123.mypinata.cloud") — reads for
// content pinned to this account go through it instead of the shared gateway.pinata.cloud, which
// 404s on freshly-pinned content (propagation lag) and rate-limits (429) under normal use. See
// useEventMetadata.js, the only current caller.
export async function getPublicGatewayDomain(): Promise<string> {
    const response = await fetch(`${IPFS_API_URL}/api/ipfs/gateway-domain`);
    if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        throw new Error(body.error || `Failed to get gateway domain: ${response.statusText}`);
    }
    const { domain } = await response.json();
    return domain;
}

// valueHex is the same 32-byte "value" committed via computePrivateMetadataCommit — either freshly
// computed by the organizer at creation time, or read back off the public ledger's
// eventRevealedMetadata after a reveal. Knowing it is the only authorization needed; the server
// derives the CID from it and asks Pinata for a short-lived signed URL.
export async function getPrivateContentSignedUrl(valueHex: string): Promise<string> {
    const response = await fetch(`${IPFS_API_URL}/api/ipfs/private-signed-url`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ value: valueHex }),
    });
    if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        throw new Error(body.error || `Failed to get signed URL: ${response.statusText}`);
    }
    const { url } = await response.json();
    return url;
}
