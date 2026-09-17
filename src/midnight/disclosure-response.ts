// Shared "respond to a disclosure request" logic — used by both entry points (myEvents.jsx's own
// "pending requests on my events" section, and disclosureRespond.jsx's direct-link page) so the
// proof-building steps aren't duplicated. Only the organizer who committed the attribute can
// respond (see docs/selective-disclosure-ui-design.md's key finding: proveAttributeMembership has
// no identity check — whoever holds the (value, rand) opening IS the authorized prover, and that's
// this browser's own private-attribute-drafts.ts cache, by design).
import type { PoapContractService } from './contract.service';
import { computeAttributeLeaf } from './contract.service';
import { buildMerkleTree, type MerklePathResult } from './merkle';
import { encodeAttributeValue } from './attribute-value-codec';
import { getPrivateAttributeDraft } from './private-attribute-drafts';
import { getEvent } from './indexer.service';
import { fetchMetadata } from '../jsx/hooks/useEventMetadata';

export type BuildAndSubmitDisclosureProofParams = {
  service: PoapContractService;
  requestId: Uint8Array;
  eventId: Uint8Array;
  fieldId: Uint8Array;
  members: string[];
  once: boolean;
};

function hex(bytes: Uint8Array): string {
  return Buffer.from(bytes).toString('hex');
}
function bytesFromHex(value: string): Uint8Array {
  return Uint8Array.from(Buffer.from(value, 'hex'));
}

export async function buildAndSubmitDisclosureProof(
  params: BuildAndSubmitDisclosureProofParams,
): Promise<{ txHash: string }> {
  const { service, requestId, eventId, fieldId, members, once } = params;
  const eventIdHex = hex(eventId);
  const fieldIdHex = hex(fieldId);

  const draft = getPrivateAttributeDraft(eventIdHex, fieldIdHex);
  if (!draft) {
    throw new Error("You don't hold this attribute — no local draft found for this event/field.");
  }
  const valueBytes = bytesFromHex(draft.valueHex);
  const randBytes = bytesFromHex(draft.randHex);

  // Rebuild the SAME attribute tree committed at createEvent time, in the SAME leaf order — the
  // canonical order is the event's own metadataURI (immutable, order-preserving JSON), not
  // private-attribute-drafts.ts's listPrivateAttributeFieldIds (a localStorage key scan with no
  // documented iteration-order guarantee). Every field needs its own draft present to rebuild a
  // leaf for it — expected here, since this browser only ever has drafts for attributes IT
  // committed, and it's the same browser that committed all of this event's fields (see the
  // module comment above).
  const indexedEvent = await getEvent(eventIdHex);
  const metadata = await fetchMetadata(indexedEvent.metadataURI);
  const orderedFields: Array<{ fieldId: string; label: string }> = metadata?.privateAttributeFields || [];
  if (orderedFields.length === 0) {
    throw new Error('This event has no private attribute fields listed in its metadata.');
  }

  const leaves = orderedFields.map((field) => {
    const fieldDraft = getPrivateAttributeDraft(eventIdHex, field.fieldId);
    if (!fieldDraft) {
      throw new Error(`Missing local draft for attribute "${field.label}" — can't rebuild the committed tree.`);
    }
    return computeAttributeLeaf(
      eventId,
      bytesFromHex(field.fieldId),
      bytesFromHex(fieldDraft.valueHex),
      bytesFromHex(fieldDraft.randHex),
    );
  });
  const attributeTree = await buildMerkleTree(leaves, 8);
  const attributeLeaf = computeAttributeLeaf(eventId, fieldId, valueBytes, randBytes);
  const attributePath: MerklePathResult = attributeTree.pathForLeaf(attributeLeaf);

  // The set-membership tree the verifier's request pinned — rebuilt from the candidate values
  // carried in the share link (never stored on-chain, only setRoot is). Our own value must be
  // byte-identical to one of these for pathForLeaf to find it — same encodeAttributeValue
  // convention on both sides (see that module's comment).
  const encodedMembers = members.map(encodeAttributeValue);
  const setTree = await buildMerkleTree(encodedMembers, 16);
  const setPath: MerklePathResult = setTree.pathForLeaf(valueBytes);

  if (once) {
    return service.proveAttributeMembershipOnce(requestId, valueBytes, randBytes, attributePath, setPath);
  }
  return service.proveAttributeMembership(requestId, valueBytes, randBytes, attributePath, setPath);
}
