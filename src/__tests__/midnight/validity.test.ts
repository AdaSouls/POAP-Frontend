import {
  addValidity,
  describeValidity,
  parseValidity,
  validityStatus,
  validUntilIso,
} from '../../midnight/validity';

const at = (iso: string) => Date.parse(iso);

describe('validity', () => {
  it('only accepts a positive whole amount and a known unit', () => {
    expect(parseValidity({ amount: '2', unit: 'years' })).toEqual({ amount: 2, unit: 'years' });
    expect(parseValidity({ amount: 0, unit: 'days' })).toBeNull();
    expect(parseValidity({ amount: 1.5, unit: 'days' })).toBeNull();
    expect(parseValidity({ amount: 1, unit: 'weeks' })).toBeNull();
    expect(parseValidity(undefined)).toBeNull();
  });

  it('adds hours and days exactly, months and years by the calendar', () => {
    expect(addValidity(at('2026-09-24T10:00:00Z'), { amount: 6, unit: 'hours' })).toBe(at('2026-09-24T16:00:00Z'));
    expect(addValidity(at('2026-09-24T10:00:00Z'), { amount: 30, unit: 'days' })).toBe(at('2026-10-24T10:00:00Z'));
    expect(addValidity(at('2026-01-31T00:00:00Z'), { amount: 1, unit: 'months' })).toBe(at('2026-02-28T00:00:00Z'));
    expect(addValidity(at('2024-02-29T00:00:00Z'), { amount: 1, unit: 'years' })).toBe(at('2025-02-28T00:00:00Z'));
    expect(addValidity(at('2026-09-24T00:00:00Z'), { amount: 5, unit: 'years' })).toBe(at('2031-09-24T00:00:00Z'));
  });

  it('gives the date a credential is valid until', () => {
    expect(validUntilIso(at('2026-09-24T12:00:00Z'), { amount: 5, unit: 'years' })).toBe('2031-09-24');
  });

  it('says whether it is active, expired, or still waiting for a first proof', () => {
    const month = { amount: 1, unit: 'months' as const };
    const now = at('2026-09-24T00:00:00Z');
    expect(validityStatus(null, now, now)).toEqual({ state: 'none' });
    expect(validityStatus(month, null, now)).toEqual({ state: 'pending' });
    expect(validityStatus(month, undefined, now)).toEqual({ state: 'unknown' });
    expect(validityStatus(month, at('2026-09-01T00:00:00Z'), now)).toEqual({
      state: 'active',
      untilMs: at('2026-10-01T00:00:00Z'),
    });
    expect(validityStatus(month, at('2026-08-01T00:00:00Z'), now)).toEqual({
      state: 'expired',
      untilMs: at('2026-09-01T00:00:00Z'),
    });
  });

  it('reads well', () => {
    expect(describeValidity({ amount: 1, unit: 'years' })).toBe('1 year');
    expect(describeValidity({ amount: 30, unit: 'days' })).toBe('30 days');
  });
});
