import {
  addYears,
  canonicalValue,
  describeRule,
  expandRule,
  fieldType,
  MAX_SET_SIZE,
  parseRule,
  ruleAccepts,
  ruleError,
  ruleSize,
} from '../../midnight/attribute-types';

const number = (extra = {}) => ({ fieldId: 'f', label: 'Age', type: 'number' as const, ...extra });

describe('attribute-types', () => {
  it('treats fields without a type as text', () => {
    expect(fieldType({})).toBe('text');
    expect(fieldType({ type: 'bogus' as any })).toBe('text');
    expect(fieldType({ type: 'date' })).toBe('date');
  });

  describe('canonicalValue', () => {
    it('writes whole numbers one way only, within the field limits', () => {
      expect(canonicalValue(number(), ' 018 ')).toEqual({ value: '18' });
      expect(canonicalValue(number(), '+5')).toEqual({ value: '5' });
      expect(canonicalValue(number(), '-3')).toEqual({ value: '-3' });
      expect(canonicalValue(number(), '7.5')).toEqual({ error: 'Must be a whole number.' });
      expect(canonicalValue(number({ min: 0, max: 120 }), '130')).toEqual({ error: 'Must be at most 120.' });
      expect(canonicalValue(number({ min: 0 }), '-1')).toEqual({ error: 'Must be at least 0.' });
    });

    it('accepts only real calendar dates', () => {
      const date = { fieldId: 'f', label: 'Born', type: 'date' as const };
      expect(canonicalValue(date, '2008-02-29')).toEqual({ value: '2008-02-29' });
      expect(canonicalValue(date, '2007-02-29')).toEqual({ error: 'Must be a date (YYYY-MM-DD).' });
      expect(canonicalValue(date, '24/09/2008')).toEqual({ error: 'Must be a date (YYYY-MM-DD).' });
    });

    it('accepts only listed options, and short text', () => {
      const list = { fieldId: 'f', label: 'Sector', type: 'list' as const, options: ['Campo', 'Platea'] };
      expect(canonicalValue(list, 'Campo')).toEqual({ value: 'Campo' });
      expect(canonicalValue(list, 'VIP')).toEqual({ error: 'Pick one of the options.' });
      expect(canonicalValue({ fieldId: 'f', label: 'T' }, 'x'.repeat(33))).toEqual({ error: 'At most 32 bytes.' });
      expect(canonicalValue(number(), '')).toEqual({ value: '' });
    });
  });

  describe('rules', () => {
    it('expands a number range to every integer in it, in order', () => {
      const rule = { op: 'gte' as const, type: 'number' as const, min: 18, max: 21 };
      expect(expandRule(rule)).toEqual(['18', '19', '20', '21']);
      expect(ruleSize(rule)).toBe(4);
      expect(ruleAccepts(rule, '20')).toBe(true);
      expect(ruleAccepts(rule, '17')).toBe(false);
      expect(ruleAccepts(rule, '018')).toBe(false);
    });

    it('expands a date range day by day, across month ends and leap days', () => {
      const rule = { op: 'between' as const, type: 'date' as const, from: '2024-02-28', to: '2024-03-01' };
      expect(expandRule(rule)).toEqual(['2024-02-28', '2024-02-29', '2024-03-01']);
      expect(ruleAccepts(rule, '2024-02-29')).toBe(true);
      expect(ruleAccepts(rule, '2024-03-02')).toBe(false);
    });

    it('refuses empty, reversed or oversized ranges', () => {
      expect(ruleError({ op: 'between', type: 'number', min: 5, max: 4 })).toMatch(/empty/);
      expect(ruleError({ op: 'between', type: 'number', min: 0, max: MAX_SET_SIZE })).toMatch(/limit/);
      expect(ruleError({ op: 'oneOf', values: [] })).toMatch(/at least one/);
      expect(ruleError({ op: 'oneOf', values: ['a', 'a'] })).toMatch(/once/);
      expect(() => expandRule({ op: 'between', type: 'number', min: 5, max: 4 })).toThrow();
    });

    it('describes each question in words', () => {
      expect(describeRule('Age', { op: 'gte', type: 'number', min: 18, max: 120 })).toBe('Age ≥ 18');
      expect(describeRule('Age', { op: 'lte', type: 'number', min: 0, max: 65 })).toBe('Age ≤ 65');
      expect(describeRule('Born', { op: 'onOrBefore', type: 'date', from: '1908-09-24', to: '2008-09-24' })).toBe(
        'Born on or before 24/09/2008',
      );
      expect(describeRule('Sector', { op: 'oneOf', values: ['Campo', 'VIP'] })).toBe('Sector is one of: Campo, VIP');
    });

    it('only trusts well-formed rules read back from the server', () => {
      expect(parseRule({ op: 'gte', type: 'number', min: 18, max: 120 })).toEqual({
        op: 'gte',
        type: 'number',
        min: 18,
        max: 120,
      });
      expect(parseRule({ op: 'gte', type: 'number', min: 18, max: 1e9 })).toBeNull();
      expect(parseRule({ op: 'drop table' })).toBeNull();
      expect(parseRule(null)).toBeNull();
    });
  });

  it('adds years without landing on a day that does not exist', () => {
    expect(addYears('2008-09-24', -18)).toBe('1990-09-24');
    expect(addYears('2024-02-29', 1)).toBe('2025-02-28');
  });
});
