// The accepted values behind a disclosure request's setRoot, published through server/
// (/api/disclosure-sets) so holders can answer from their POAP card. Plain fetch, no SDK — the
// root check that makes a list trustworthy lives in holder-proofs.ts#fetchRequestSet.
const IPFS_API_URL = process.env.REACT_APP_IPFS_API_URL || 'http://localhost:4000';

export async function publishRequestSet(requestIdHex: string, members: string[]): Promise<void> {
  const response = await fetch(`${IPFS_API_URL}/api/disclosure-sets`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ requestId: requestIdHex, members }),
  });
  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw new Error(body.error || `Could not publish the request's values (${response.status})`);
  }
}

// Every list posted for this request, newest first — unverified.
export async function fetchRequestSetCandidates(requestIdHex: string): Promise<string[][]> {
  const response = await fetch(`${IPFS_API_URL}/api/disclosure-sets/${requestIdHex}`);
  if (!response.ok) return [];
  const { sets } = (await response.json()) as { sets: string[][] };
  return sets || [];
}
