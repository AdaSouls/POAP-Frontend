import { getEventStatus, filterVisibleEvents } from '../../utils/poapHelpers';

describe('getEventStatus', () => {
  it('returns inactive when isActive is false, regardless of other fields', () => {
    expect(getEventStatus({ isActive: false, expiration: 0, maxSupply: 0, minted: 0 })).toBe('inactive');
  });

  it('returns expired for a past expiration', () => {
    const past = Math.floor(Date.now() / 1000) - 3600;
    expect(getEventStatus({ isActive: true, expiration: past, maxSupply: 0, minted: 0 })).toBe('expired');
  });

  it('returns active for no expiration and unlimited supply', () => {
    expect(getEventStatus({ isActive: true, expiration: 0, maxSupply: 0, minted: 5 })).toBe('active');
  });

  it('returns full when minted reaches maxSupply', () => {
    expect(getEventStatus({ isActive: true, expiration: 0, maxSupply: 10, minted: 10 })).toBe('full');
  });

  it('returns active when minted is below maxSupply and not expired', () => {
    const future = Math.floor(Date.now() / 1000) + 3600;
    expect(getEventStatus({ isActive: true, expiration: future, maxSupply: 10, minted: 3 })).toBe('active');
  });
});

describe('filterVisibleEvents', () => {
  const poap = { issuerPkHex: 'bb'.repeat(32), attendedEventIds: ['aa'.repeat(32), 'cc'.repeat(32)] };

  it('keeps only events the visibility lookup marks visible', () => {
    const isVisible = (issuerPkHex, eventId) => eventId === 'aa'.repeat(32);
    expect(filterVisibleEvents(poap, isVisible)).toEqual(['aa'.repeat(32)]);
  });

  it('returns an empty array when the poap has no attended events', () => {
    expect(filterVisibleEvents({ issuerPkHex: 'bb'.repeat(32) }, () => true)).toEqual([]);
  });
});
