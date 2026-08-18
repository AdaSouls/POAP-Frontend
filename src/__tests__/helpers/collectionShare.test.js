import {
  getTokenVisibility,
  setTokenVisibility,
  encodeShareableCollection,
  decodeShareableCollection,
  buildShareUrl,
} from '../../midnight/collection-share';

describe('collection-share visibility', () => {
  const issuerPkHex = 'bb'.repeat(32);
  const tokenId = 1;

  beforeEach(() => {
    window.localStorage.clear();
  });

  it('defaults to visible when nothing has been stored', () => {
    expect(getTokenVisibility(issuerPkHex, tokenId)).toBe(true);
  });

  it('persists an explicit hide', () => {
    setTokenVisibility(issuerPkHex, tokenId, false);
    expect(getTokenVisibility(issuerPkHex, tokenId)).toBe(false);
  });

  it('persists an explicit show after a previous hide', () => {
    setTokenVisibility(issuerPkHex, tokenId, false);
    setTokenVisibility(issuerPkHex, tokenId, true);
    expect(getTokenVisibility(issuerPkHex, tokenId)).toBe(true);
  });

  it('scopes visibility per issuer+token pair', () => {
    setTokenVisibility(issuerPkHex, tokenId, false);
    expect(getTokenVisibility('cc'.repeat(32), tokenId)).toBe(true);
  });
});

describe('collection-share encode/decode', () => {
  const entries = [
    { issuerPkHex: 'bb'.repeat(32), tokenId: 42n },
    { issuerPkHex: 'dd'.repeat(32), tokenId: 7n },
  ];

  it('round-trips entries, including bigint tokenIds', () => {
    const encoded = encodeShareableCollection(entries);
    const decoded = decodeShareableCollection(encoded);
    expect(decoded).toEqual(entries);
  });

  it('produces a URL-safe string (no +, /, or = padding)', () => {
    const encoded = encodeShareableCollection(entries);
    expect(encoded).not.toMatch(/[+/=]/);
  });

  it('returns null for garbage input instead of throwing', () => {
    expect(decodeShareableCollection('not-valid-base64!!')).toBeNull();
  });

  it('returns null for a well-formed but wrong-shaped payload', () => {
    const encoded = window.btoa(JSON.stringify({ v: 2, nope: true }));
    expect(decodeShareableCollection(encoded)).toBeNull();
  });
});

describe('buildShareUrl', () => {
  const pkHex = 'ff'.repeat(32);

  it('builds a link with no query when no payload is given', () => {
    expect(buildShareUrl(pkHex)).toBe(`${window.location.origin}/share/${pkHex}`);
  });

  it('builds a link with the encoded payload as ?d=', () => {
    expect(buildShareUrl(pkHex, 'abc123')).toBe(`${window.location.origin}/share/${pkHex}?d=abc123`);
  });
});
