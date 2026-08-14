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
