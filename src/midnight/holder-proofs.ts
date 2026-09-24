// Anonymous proofs a holder answers from their own POAP (holderProofs.jsx):
//   - proveEventAttendance: "I hold a live credential of this event" — reveals neither the token
//     nor the wallet. Works for any token (claim() and mintTo() both add the credential leaf; the
//     attribute root is all-zero when there are no private attributes).
//   - proveCredentialAttribute: same, plus "my <field> is one of the values this request accepts".
// Both answer a DisclosureRequest someone else published (normally the organizer), so the holder
// never publishes anything under their own caller_pk.
import { getAllDisclosureRequests, type IndexedDisclosureRequest } from './indexer.service';
import { buildMerkleTree } from './merkle';
import { encodeAttributeValue } from './attribute-value-codec';
import { computeCredentialAttrLeaf } from './contract.service';
import { credentialAttributeTree, credentialPathOnChain, fetchDeliveredPackage } from './credential-delivery';
import { getCredentialPackage, type CredentialPackage } from './credential-store';
import { isOwnershipRequest } from './ownership-proof';
import { txHashOf } from './tx-result';
import { fetchRequestSetCandidates } from './disclosure-sets';

const ZERO_HEX = '0'.repeat(64);

const fromHex = (value: string) => Uint8Array.from(Buffer.from(value, 'hex'));
const hex = (bytes: Uint8Array) => Buffer.from(bytes).toString('hex');

export type HolderToken = {
  tokenId: number;
  eventId: string; // hex
  issuerPk: string; // hex, organizer
  holderPk: string; // hex, this wallet's holder_pk(issuerPk) — the token's ownerPk
};

type Service = {
  getEncryptionKeyPair(issuerId: Uint8Array): Promise<any>;
  getState(): Promise<{ ledger: { credentials: any } }>;
  proveEventAttendance(requestId: Uint8Array, credAttrRoot: Uint8Array, credPath: any): Promise<any>;
  proveCredentialAttribute(
    requestId: Uint8Array,
    value: Uint8Array,
    rand: Uint8Array,
    attributePath: any,
    setMembershipPath: any,
    credPath: any,
  ): Promise<any>;
};

// ── The holder's private details ──────────────────────────────────────────────

export async function loadCredentialPackage(service: Service, token: HolderToken): Promise<CredentialPackage | null> {
  const local = getCredentialPackage(token.eventId, token.holderPk);
  if (local) return local;
  const keys = await service.getEncryptionKeyPair(fromHex(token.issuerPk));
  return fetchDeliveredPackage(token.eventId, token.holderPk, keys);
}

// ── Requests the holder can answer ────────────────────────────────────────────

export type AnswerableRequest =
  | { kind: 'attendance'; request: IndexedDisclosureRequest }
  | { kind: 'attribute'; request: IndexedDisclosureRequest; label: string; members: string[] | null };

// Plain requests (attendance / ownership) and requests about one of this event's credential
// fields. Requests about event-level attributes are the organizer's to answer, not the holder's.
export async function listAnswerableRequests(
  eventIdHex: string,
  credentialFields: Array<{ fieldId: string; label: string }>,
): Promise<AnswerableRequest[]> {
  const requests = (await getAllDisclosureRequests()).filter((r) => r.eventId === eventIdHex);
  const labels = new Map(credentialFields.map((f) => [f.fieldId, f.label]));
  const answerable: AnswerableRequest[] = [];
  for (const request of requests) {
    if (isOwnershipRequest(request)) {
      answerable.push({ kind: 'attendance', request });
    } else if (labels.has(request.fieldId)) {
      answerable.push({
        kind: 'attribute',
        request,
        label: labels.get(request.fieldId) as string,
        members: await fetchRequestSet(request.requestId, request.setRoot).catch(() => null),
      });
    }
  }
  return answerable;
}

export async function setRootOf(members: string[]): Promise<string> {
  const tree = await buildMerkleTree(members.map(encodeAttributeValue), 16);
  return hex(tree.rootBytes);
}

// The accepted values behind a request's setRoot (published by publishDisclosureRequest.jsx).
// Only a list that rebuilds the on-chain root counts — anyone can post under a requestId.
export async function fetchRequestSet(requestIdHex: string, setRootHex: string): Promise<string[] | null> {
  for (const members of await fetchRequestSetCandidates(requestIdHex)) {
    try {
      if ((await setRootOf(members)) === setRootHex.toLowerCase()) return members;
    } catch {
      // Malformed list — skip.
    }
  }
  return null;
}

// Does this holder's value for the request's field fall in its accepted set? Local only.
export function valueQualifies(pkg: CredentialPackage | null, fieldIdHex: string, members: string[] | null): boolean {
  const field = pkg?.fields.find((f) => f.fieldId === fieldIdHex);
  if (!field || !members) return false;
  return members.some((m) => {
    try {
      return hex(encodeAttributeValue(m)) === field.valueHex;
    } catch {
      return false;
    }
  });
}

// ── Proving ───────────────────────────────────────────────────────────────────

async function credentialPath(service: Service, token: HolderToken, credAttrRootHex: string) {
  const { ledger } = await service.getState();
  const path = await credentialPathOnChain(ledger.credentials, token.tokenId, token.eventId, token.holderPk, credAttrRootHex);
  if (!path) {
    throw new Error(
      "This POAP's details don't match its record on-chain (it may have been revoked, or the private details are for a different credential).",
    );
  }
  return path;
}

export async function proveAttendance(
  service: Service,
  token: HolderToken,
  requestIdHex: string,
  pkg: CredentialPackage | null,
): Promise<{ txHash: string | null }> {
  const credAttrRootHex = pkg?.credAttrRoot ?? ZERO_HEX;
  const path = await credentialPath(service, token, credAttrRootHex);
  const result = await service.proveEventAttendance(fromHex(requestIdHex), fromHex(credAttrRootHex), path);
  return { txHash: txHashOf(result) };
}

export async function proveAttribute(
  service: Service,
  token: HolderToken,
  request: IndexedDisclosureRequest,
  members: string[],
  pkg: CredentialPackage,
): Promise<{ txHash: string | null }> {
  const field = pkg.fields.find((f) => f.fieldId === request.fieldId);
  if (!field) throw new Error("This credential has no value for the field this request asks about.");
  const value = fromHex(field.valueHex);
  const rand = fromHex(field.randHex);

  const attributeTree = await credentialAttributeTree(pkg.fields);
  const attributePath = attributeTree.pathForLeaf(computeCredentialAttrLeaf(fromHex(field.fieldId), value, rand));

  const setTree = await buildMerkleTree(members.map(encodeAttributeValue), 16);
  let setPath;
  try {
    setPath = setTree.pathForLeaf(value);
  } catch {
    throw new Error("Your value isn't one of the values this request accepts, so the proof would fail.");
  }

  const credPath = await credentialPath(service, token, pkg.credAttrRoot);
  const result = await service.proveCredentialAttribute(fromHex(request.requestId), value, rand, attributePath, setPath, credPath);
  return { txHash: txHashOf(result) };
}
