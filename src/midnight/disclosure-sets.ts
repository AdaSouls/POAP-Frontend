// The question behind a disclosure request's setRoot — its rule (attribute-types.ts): a short list
// of accepted values, or a number/date range every browser expands itself. Published through
// server/ (/api/disclosure-sets) so holders can answer from their POAP card. Plain fetch, no SDK —
// the root check that makes a rule trustworthy lives in holder-proofs.ts#fetchRequestRule.
import { parseRule, type Rule } from './attribute-types';

const IPFS_API_URL = process.env.REACT_APP_IPFS_API_URL || 'http://localhost:4000';

export async function publishRequestRule(requestIdHex: string, rule: Rule): Promise<void> {
  const response = await fetch(`${IPFS_API_URL}/api/disclosure-sets`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ requestId: requestIdHex, rule }),
  });
  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw new Error(body.error || `Could not publish the request's accepted values (${response.status})`);
  }
}

// Every well-formed rule posted for this request, newest first — unverified.
export async function fetchRequestRuleCandidates(requestIdHex: string): Promise<Rule[]> {
  const response = await fetch(`${IPFS_API_URL}/api/disclosure-sets/${requestIdHex}`);
  if (!response.ok) return [];
  const { rules } = (await response.json()) as { rules?: unknown[] };
  return (rules || []).map(parseRule).filter((rule): rule is Rule => rule !== null);
}
