import {
  getEventVisibility,
  setEventVisibility,
  encodeShareableCollection,
  decodeShareableCollection,
  buildShareUrl,
} from '../../midnight/collection-share';

describe('collection-share visibility', () => {
  const issuerPkHex = 'bb'.repeat(32);
  const eventIdHex = 'aa'.repeat(32);

  beforeEach(() => {
    window.localStorage.clear();
  });

  it('defaults to visible when nothing has been stored', () => {
    expect(getEventVisibility(issuerPkHex, eventIdHex)).toBe(true);
  });

  it('persists an explicit hide', () => {
    setEventVisibility(issuerPkHex, eventIdHex, false);
    expect(getEventVisibility(issuerPkHex, eventIdHex)).toBe(false);
  });

  it('persists an explicit show after a previous hide', () => {
    setEventVisibility(issuerPkHex, eventIdHex, false);
    setEventVisibility(issuerPkHex, eventIdHex, true);
    expect(getEventVisibility(issuerPkHex, eventIdHex)).toBe(true);
  });

  it('scopes visibility per issuer+event pair', () => {
    setEventVisibility(issuerPkHex, eventIdHex, false);
    expect(getEventVisibility('cc'.repeat(32), eventIdHex)).toBe(true);
  });
});

describe('collection-share encode/decode', () => {
  const entries = [
    { issuerPkHex: 'bb'.repeat(32), tokenId: 42n, visibleEventIds: ['aa'.repeat(32), 'cc'.repeat(32)] },
    { issuerPkHex: 'dd'.repeat(32), tokenId: 7n, visibleEventIds: ['ee'.repeat(32)] },
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
