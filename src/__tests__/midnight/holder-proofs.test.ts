import { listAnswerableRequests, proveAttendance, proveAttribute, valueQualifies } from '../../midnight/holder-proofs';
import { getAllDisclosureRequests } from '../../midnight/indexer.service';
import { fetchRequestSetCandidates } from '../../midnight/disclosure-sets';
import { credentialPathOnChain } from '../../midnight/credential-delivery';
import { buildMerkleTree } from '../../midnight/merkle';

// WASM-backed modules (compiled contract, transientHash) are mocked — see merkle.test.ts.
jest.mock('../../midnight/indexer.service', () => ({ getAllDisclosureRequests: jest.fn() }));
jest.mock('../../midnight/disclosure-sets', () => ({ fetchRequestSetCandidates: jest.fn() }));
jest.mock('../../midnight/contract.service', () => ({ computeCredentialAttrLeaf: jest.fn((fieldId) => fieldId) }));
jest.mock('../../midnight/merkle', () => ({ buildMerkleTree: jest.fn() }));
jest.mock('../../midnight/credential-delivery', () => ({
  credentialAttributeTree: jest.fn(async () => ({ pathForLeaf: jest.fn(() => ({ attr: true })) })),
  credentialPathOnChain: jest.fn(),
  fetchDeliveredPackage: jest.fn(),
}));

const ZERO = '0'.repeat(64);
const EVENT = 'aa'.repeat(32);
const ORGANIZER = 'bb'.repeat(32);
const SECTOR = '01'.repeat(32);
const encode = (value: string) => {
  const out = Buffer.alloc(32);
  Buffer.from(value, 'utf8').copy(out);
  return out.toString('hex');
};
const PKG = {
  version: 1 as const,
  eventId: EVENT,
  issuerPk: ORGANIZER,
  holderPk: 'cc'.repeat(32),
  credAttrRoot: 'dd'.repeat(32),
  fields: [{ fieldId: SECTOR, label: 'Sector', valueHex: encode('Campo'), randHex: '11'.repeat(32) }],
};
const TOKEN = { tokenId: 4, eventId: EVENT, issuerPk: ORGANIZER, holderPk: PKG.holderPk };
const request = (overrides: Record<string, unknown>) => ({
  requestId: '22'.repeat(32),
  verifierPk: ORGANIZER,
  eventId: EVENT,
  fieldId: ZERO,
  setRoot: ZERO,
  publishedBlock: 1,
  publishedTx: null,
  ...overrides,
});

// A "root" that is just the members joined — lets fetchRequestSet's root check be exercised.
beforeEach(() => {
  (buildMerkleTree as jest.Mock).mockImplementation(async (leaves: Uint8Array[]) => ({
    rootBytes: Buffer.from(Buffer.from(leaves.map((l) => Buffer.from(l).toString('hex')).join('|')).subarray(0, 32)),
    pathForLeaf: (leaf: Uint8Array) => {
      if (!leaves.some((l) => Buffer.from(l).equals(Buffer.from(leaf)))) throw new Error('not found');
      return { set: true };
    },
  }));
});

describe('listAnswerableRequests', () => {
  it('keeps plain and credential-field requests for this event, drops the rest', async () => {
    const setRoot = Buffer.from(
      Buffer.from([encode('Campo'), encode('Platea')].join('|')).subarray(0, 32),
    ).toString('hex');
    (getAllDisclosureRequests as jest.Mock).mockResolvedValue([
      request({ requestId: 'plain' }),
      request({ requestId: 'sector', fieldId: SECTOR, setRoot }),
      request({ requestId: 'event-level', fieldId: '03'.repeat(32), setRoot: '44'.repeat(32) }),
      request({ requestId: 'other-event', eventId: 'ff'.repeat(32) }),
    ]);
    (fetchRequestSetCandidates as jest.Mock).mockResolvedValue([['Bogus'], ['Campo', 'Platea']]);

    const items = await listAnswerableRequests(EVENT, [{ fieldId: SECTOR, label: 'Sector' }]);
    expect(items.map((i) => [i.kind, i.request.requestId])).toEqual([
      ['attendance', 'plain'],
      ['attribute', 'sector'],
    ]);
    expect(items[1]).toMatchObject({ label: 'Sector', members: ['Campo', 'Platea'] });
  });
});

describe('valueQualifies', () => {
  it('compares the holder value against the accepted set locally', () => {
    expect(valueQualifies(PKG, SECTOR, ['Platea', 'Campo'])).toBe(true);
    expect(valueQualifies(PKG, SECTOR, ['Platea'])).toBe(false);
    expect(valueQualifies(null, SECTOR, ['Campo'])).toBe(false);
  });
});

describe('proving', () => {
  // Built per test: CRA's jest config resets mock implementations between tests.
  let service: any;
  beforeEach(() => {
    const { computeCredentialAttrLeaf } = jest.requireMock('../../midnight/contract.service');
    const { credentialAttributeTree } = jest.requireMock('../../midnight/credential-delivery');
    computeCredentialAttrLeaf.mockImplementation((fieldId: Uint8Array) => fieldId);
    credentialAttributeTree.mockImplementation(async () => ({ pathForLeaf: jest.fn(() => ({ attr: true })) }));
    service = {
      getEncryptionKeyPair: jest.fn(),
      getState: jest.fn(async () => ({ ledger: { credentials: {} } })),
      proveEventAttendance: jest.fn(async () => ({ public: { txHash: '0xatt' } })),
      proveCredentialAttribute: jest.fn(async () => ({ public: { txHash: '0xattr' } })),
    };
  });

  it('proves attendance with the all-zero root when the token has no private details', async () => {
    (credentialPathOnChain as jest.Mock).mockResolvedValue({ cred: true });
    const result = await proveAttendance(service, TOKEN, '22'.repeat(32), null);
    expect(credentialPathOnChain).toHaveBeenCalledWith({}, 4, EVENT, PKG.holderPk, ZERO);
    expect(service.proveEventAttendance).toHaveBeenCalledWith(expect.any(Uint8Array), new Uint8Array(32), { cred: true });
    expect(result).toEqual({ txHash: '0xatt' });
  });

  it('refuses to prove when the credential does not match the chain', async () => {
    (credentialPathOnChain as jest.Mock).mockResolvedValue(null);
    await expect(proveAttendance(service, TOKEN, '22'.repeat(32), PKG)).rejects.toThrow(/don't match its record/);
  });

  it('proves a credential attribute with attribute, set and credential paths', async () => {
    (credentialPathOnChain as jest.Mock).mockResolvedValue({ cred: true });
    const result = await proveAttribute(service, TOKEN, request({ fieldId: SECTOR }), ['Platea', 'Campo'], PKG);
    expect(service.proveCredentialAttribute).toHaveBeenCalledWith(
      expect.any(Uint8Array),
      Uint8Array.from(Buffer.from(encode('Campo'), 'hex')),
      Uint8Array.from(Buffer.from('11'.repeat(32), 'hex')),
      { attr: true },
      { set: true },
      { cred: true },
    );
    expect(result).toEqual({ txHash: '0xattr' });
  });

  it('stops before proving when the value is not in the accepted set', async () => {
    await expect(proveAttribute(service, TOKEN, request({ fieldId: SECTOR }), ['Platea'], PKG)).rejects.toThrow(
      /isn't one of the values/,
    );
    expect(service.proveCredentialAttribute).not.toHaveBeenCalled();
  });
});
