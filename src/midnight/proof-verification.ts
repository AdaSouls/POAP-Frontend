// B8 — lets anyone check a proof receipt without a wallet: looks the transaction up on the Midnight
// indexer (GraphQL) and reports whether it's a confirmed call to OUR contract and which circuit it
// ran. Proofs never write the ledger (except publishing a request), so our own POAP indexer never
// sees them — the chain's indexer is the only source. A successful transaction IS the proof: every
// failure path in these circuits is an assert, so a failed proof never lands on-chain.
//
// Limitation: the circuit's arguments (which request, which token) aren't decoded here. The
// receipt states them; the verifier matches the time and the question they asked.

const GRAPHQL_URL = process.env.REACT_APP_MIDNIGHT_INDEXER_GRAPHQL_URL || 'http://localhost:8088/api/v4/graphql';

export const PROOF_KINDS: Record<string, { title: string; description: string; isProof: boolean }> = {
  proveTokenOwnership: {
    title: 'Proof of ownership',
    description: 'The holder of a specific POAP proved they own it. The token is revealed; the wallet is not.',
    isProof: true,
  },
  proveEventAttendance: {
    title: 'Anonymous proof of attendance',
    description: 'Someone proved they hold a valid POAP of the event, without revealing which one or their wallet.',
    isProof: true,
  },
  proveCredentialAttribute: {
    title: 'Anonymous proof about a private detail',
    description:
      "Someone proved a private detail of their credential is one of the accepted values, without revealing the value, the credential or their wallet.",
    isProof: true,
  },
  proveAttributeMembership: {
    title: 'Proof about an event attribute',
    description: "A private attribute of the event was proven to be one of the accepted values, without revealing it.",
    isProof: true,
  },
  proveAttributeMembershipOnce: {
    title: 'Single-use proof about an event attribute',
    description: "Same as a proof about an event attribute, recorded so the same wallet can't answer twice.",
    isProof: true,
  },
};

export type ProofLookup =
  | { status: 'not-found' }
  | {
      status: 'found';
      hash: string;
      blockHeight: number | null;
      timestamp: number | null; // ms
      entryPoint: string | null;
      isOurContract: boolean;
    };

export async function lookupProofTransaction(txHash: string, contractAddress: string): Promise<ProofLookup> {
  if (!/^[0-9a-fA-F]{64}$/.test(txHash)) throw new Error('That is not a transaction hash (64 hex characters).');
  const query = `query ($hash: HexEncoded!) {
    transactions(offset: { hash: $hash }) {
      hash
      block { height timestamp }
      contractActions { address __typename ... on ContractCall { entryPoint } }
    }
  }`;
  const response = await fetch(GRAPHQL_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query, variables: { hash: txHash.toLowerCase() } }),
  });
  if (!response.ok) throw new Error(`The Midnight indexer did not answer (${response.status}).`);
  const { data, errors } = await response.json();
  if (errors?.length) throw new Error(errors[0].message || 'The Midnight indexer returned an error.');
  const tx = data?.transactions?.[0];
  if (!tx) return { status: 'not-found' };
  const call = (tx.contractActions || []).find((action: any) => action.__typename === 'ContractCall');
  return {
    status: 'found',
    hash: tx.hash,
    blockHeight: tx.block?.height ?? null,
    timestamp: tx.block?.timestamp ?? null,
    entryPoint: call?.entryPoint ?? null,
    isOurContract: Boolean(call && call.address?.toLowerCase() === contractAddress?.toLowerCase()),
  };
}

export function verifyUrl(txHash: string): string {
  return `${window.location.origin}/app/verify?tx=${txHash}`;
}
