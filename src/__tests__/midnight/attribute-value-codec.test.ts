import { encodeAttributeValue } from '../../midnight/attribute-value-codec';

describe('encodeAttributeValue', () => {
  it('is deterministic for the same input', () => {
    expect(encodeAttributeValue('France')).toEqual(encodeAttributeValue('France'));
  });

  it('right-pads short UTF-8 values to exactly 32 bytes', () => {
    const encoded = encodeAttributeValue('France');
    expect(encoded.length).toBe(32);
    expect(Buffer.from(encoded.slice(0, 6)).toString('utf8')).toBe('France');
    expect(Array.from(encoded.slice(6)).every((b) => b === 0)).toBe(true);
  });

  it('trims leading/trailing whitespace before encoding', () => {
    expect(encodeAttributeValue('  France  ')).toEqual(encodeAttributeValue('France'));
  });

  it('accepts a value that is exactly 32 UTF-8 bytes', () => {
    const exactly32 = 'a'.repeat(32);
    expect(() => encodeAttributeValue(exactly32)).not.toThrow();
    const encoded = encodeAttributeValue(exactly32);
    expect(encoded.length).toBe(32);
    expect(Buffer.from(encoded).toString('utf8')).toBe(exactly32);
  });

  it('throws for a value longer than 32 UTF-8 bytes', () => {
    expect(() => encodeAttributeValue('a'.repeat(33))).toThrow('exceeds the 32-byte limit');
  });

  it('counts multi-byte UTF-8 characters by their encoded byte length, not character count', () => {
    // '€' is 3 bytes in UTF-8 — 11 of them is 33 bytes, over the limit despite being 11 characters.
    expect(() => encodeAttributeValue('€'.repeat(11))).toThrow('exceeds the 32-byte limit');
    expect(() => encodeAttributeValue('€'.repeat(10))).not.toThrow();
  });
});
