// Real merkle.ts tree-construction/ordering logic is exercised here (only the WASM-backed
// primitives are mocked, same reasoning as src/__tests__/midnight/merkle.test.ts's header comment)
// — this is what actually proves the leaf-ordering approach (metadataURI's privateAttributeFields
// as the canonical order, not localStorage scan order) reconstructs a root that matches what was
// committed, across more than one field.
function mockDegradeToTransient(bytes: Uint8Array): bigint {
  let v = 0n;
  for (const b of bytes) v = (v << 8n) | BigInt(b);
  return v;
}
function mockUpgradeFromTransient(field: bigint): Uint8Array {
  const out = new Uint8Array(32);
  let v = field;
  for (let i = 31; i >= 0; i--) {
    out[i] = Number(v & 0xffn);
    v >>= 8n;
  }
  return out;
}
function mockTransientHash(_type: unknown, [a, b]: [bigint, bigint]): bigint {
  return (a * 1000003n + b * 998244353n + 1n) % 2n ** 256n;
}
jest.mock('@midnight-ntwrk/compact-runtime', () => ({
  transientHash: (type: unknown, pair: [bigint, bigint]) => mockTransientHash(type, pair),
  degradeToTransient: (bytes: Uint8Array) => mockDegradeToTransient(bytes),
  upgradeFromTransient: (field: bigint) => mockUpgradeFromTransient(field),
  CompactTypeField: {},
  CompactTypeVector: class MockCompactTypeVector {
    n: number;
    type: unknown;
    constructor(n: number, type: unknown) {
      this.n = n;
      this.type = type;
    }
  },
}));

// computeAttributeLeaf's real implementation is a contract-side pure circuit call — mocked here to
// a simple deterministic stand-in (the fieldId itself) so different fields produce different,
// stable leaves without needing the real circuit. What's under test is the SHAPE of the
// reconstruction (order, lookup), not this specific hash.
jest.mock('../../midnight/contract.service', () => ({
  computeAttributeLeaf: jest.fn((eventId: Uint8Array, fieldId: Uint8Array) => fieldId),
}));
jest.mock('../../midnight/indexer.service', () => ({ getEvent: jest.fn() }));
jest.mock('../../jsx/hooks/useEventMetadata', () => ({ fetchMetadata: jest.fn() }));

import { buildAndSubmitDisclosureProof } from '../../midnight/disclosure-response';
import { savePrivateAttributeDraft } from '../../midnight/private-attribute-drafts';
import { encodeAttributeValue } from '../../midnight/attribute-value-codec';
import { getEvent } from '../../midnight/indexer.service';
import { fetchMetadata } from '../../jsx/hooks/useEventMetadata';
import { computeAttributeLeaf } from '../../midnight/contract.service';

const EVENT_ID_HEX = 'aa'.repeat(32);
const FIELD_REGION_HEX = 'bb'.repeat(32);
const FIELD_CATEGORY_HEX = 'cc'.repeat(32);
const REQUEST_ID_HEX = 'ee'.repeat(32);

function bytesFromHex(value: string): Uint8Array {
  return Uint8Array.from(Buffer.from(value, 'hex'));
}
function hex(bytes: Uint8Array): string {
  return Buffer.from(bytes).toString('hex');
}

function buildService() {
  return {
    proveAttributeMembership: jest.fn().mockResolvedValue({ txHash: '0x1' }),
    proveAttributeMembershipOnce: jest.fn().mockResolvedValue({ txHash: '0x2' }),
  } as any;
}

describe('buildAndSubmitDisclosureProof', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    window.localStorage.clear();
    (getEvent as jest.Mock).mockResolvedValue({ metadataURI: 'ipfs://event-metadata' });
    // Re-applied every test — this project's jest config resets mock implementations between
    // tests despite only calling jest.clearAllMocks() (see createEvent.test.jsx's same fix).
    (computeAttributeLeaf as jest.Mock).mockImplementation((eventId: Uint8Array, fieldId: Uint8Array) => fieldId);
  });

  it('throws when this browser has no local draft for the requested field', async () => {
    (fetchMetadata as jest.Mock).mockResolvedValue({
      privateAttributeFields: [{ fieldId: FIELD_REGION_HEX, label: 'Region' }],
    });
    const service = buildService();

    await expect(
      buildAndSubmitDisclosureProof({
        service,
        requestId: bytesFromHex(REQUEST_ID_HEX),
        eventId: bytesFromHex(EVENT_ID_HEX),
        fieldId: bytesFromHex(FIELD_REGION_HEX),
        members: ['EU'],
        once: false,
      }),
    ).rejects.toThrow("don't hold this attribute");
    expect(service.proveAttributeMembership).not.toHaveBeenCalled();
  });

  it('throws when the event metadata lists no private attribute fields', async () => {
    savePrivateAttributeDraft(EVENT_ID_HEX, FIELD_REGION_HEX, {
      fieldName: 'Region',
      valueHex: hex(encodeAttributeValue('EU')),
      randHex: '11'.repeat(32),
    });
    (fetchMetadata as jest.Mock).mockResolvedValue({ privateAttributeFields: [] });
    const service = buildService();

    await expect(
      buildAndSubmitDisclosureProof({
        service,
        requestId: bytesFromHex(REQUEST_ID_HEX),
        eventId: bytesFromHex(EVENT_ID_HEX),
        fieldId: bytesFromHex(FIELD_REGION_HEX),
        members: ['EU'],
        once: false,
      }),
    ).rejects.toThrow('no private attribute fields');
  });

  it('throws when a sibling field (needed to rebuild the tree) has no local draft', async () => {
    // Only Region is drafted locally, but metadata lists Category too — this browser can't
    // reconstruct the full committed tree without every field's opening.
    savePrivateAttributeDraft(EVENT_ID_HEX, FIELD_REGION_HEX, {
      fieldName: 'Region',
      valueHex: hex(encodeAttributeValue('EU')),
      randHex: '11'.repeat(32),
    });
    (fetchMetadata as jest.Mock).mockResolvedValue({
      privateAttributeFields: [
        { fieldId: FIELD_REGION_HEX, label: 'Region' },
        { fieldId: FIELD_CATEGORY_HEX, label: 'Category' },
      ],
    });
    const service = buildService();

    await expect(
      buildAndSubmitDisclosureProof({
        service,
        requestId: bytesFromHex(REQUEST_ID_HEX),
        eventId: bytesFromHex(EVENT_ID_HEX),
        fieldId: bytesFromHex(FIELD_REGION_HEX),
        members: ['EU'],
        once: false,
      }),
    ).rejects.toThrow('Missing local draft for attribute "Category"');
  });

  it('reconstructs the multi-field attribute tree in metadata order and submits a valid-shaped proof (proveAttributeMembership)', async () => {
    savePrivateAttributeDraft(EVENT_ID_HEX, FIELD_REGION_HEX, {
      fieldName: 'Region',
      valueHex: hex(encodeAttributeValue('EU')),
      randHex: '11'.repeat(32),
    });
    savePrivateAttributeDraft(EVENT_ID_HEX, FIELD_CATEGORY_HEX, {
      fieldName: 'Category',
      valueHex: hex(encodeAttributeValue('Tech')),
      randHex: '22'.repeat(32),
    });
    (fetchMetadata as jest.Mock).mockResolvedValue({
      privateAttributeFields: [
        { fieldId: FIELD_REGION_HEX, label: 'Region' },
        { fieldId: FIELD_CATEGORY_HEX, label: 'Category' },
      ],
    });
    const service = buildService();

    const result = await buildAndSubmitDisclosureProof({
      service,
      requestId: bytesFromHex(REQUEST_ID_HEX),
      eventId: bytesFromHex(EVENT_ID_HEX),
      fieldId: bytesFromHex(FIELD_REGION_HEX),
      members: ['EU', 'APAC', 'NA'],
      once: false,
    });

    expect(result).toEqual({ txHash: '0x1' });
    expect(service.proveAttributeMembershipOnce).not.toHaveBeenCalled();
    expect(service.proveAttributeMembership).toHaveBeenCalledTimes(1);
    const [requestIdArg, valueArg, randArg, attributePathArg, setPathArg] =
      service.proveAttributeMembership.mock.calls[0];
    expect(requestIdArg).toEqual(bytesFromHex(REQUEST_ID_HEX));
    expect(valueArg).toEqual(encodeAttributeValue('EU'));
    expect(randArg).toEqual(bytesFromHex('11'.repeat(32)));
    // computeAttributeLeaf is mocked to return fieldId itself — so the attribute leaf is Region's
    // fieldId, and the path's own `leaf` field should match it.
    expect(attributePathArg.leaf).toEqual(bytesFromHex(FIELD_REGION_HEX));
    expect(attributePathArg.path).toHaveLength(8); // depth 8
    expect(setPathArg.leaf).toEqual(encodeAttributeValue('EU'));
    expect(setPathArg.path).toHaveLength(16); // depth 16
  });

  it('calls proveAttributeMembershipOnce instead when once=true', async () => {
    savePrivateAttributeDraft(EVENT_ID_HEX, FIELD_REGION_HEX, {
      fieldName: 'Region',
      valueHex: hex(encodeAttributeValue('EU')),
      randHex: '11'.repeat(32),
    });
    (fetchMetadata as jest.Mock).mockResolvedValue({
      privateAttributeFields: [{ fieldId: FIELD_REGION_HEX, label: 'Region' }],
    });
    const service = buildService();

    const result = await buildAndSubmitDisclosureProof({
      service,
      requestId: bytesFromHex(REQUEST_ID_HEX),
      eventId: bytesFromHex(EVENT_ID_HEX),
      fieldId: bytesFromHex(FIELD_REGION_HEX),
      members: ['EU', 'APAC'],
      once: true,
    });

    expect(result).toEqual({ txHash: '0x2' });
    expect(service.proveAttributeMembership).not.toHaveBeenCalled();
    expect(service.proveAttributeMembershipOnce).toHaveBeenCalledTimes(1);
  });
});
