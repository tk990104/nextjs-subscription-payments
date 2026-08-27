import { describe, expect, it } from 'vitest';
import { calculateGematria } from './calculate';
import { customCipherDefinition, customCipherFromStored } from './custom';

describe('custom ciphers', () => {
  it('builds an independently calculated alphabet cipher', () => {
    const cipher = customCipherFromStored({
      id: '123',
      name: 'Doubles',
      description: null,
      definition: {
        values: Array.from({ length: 26 }, (_, index) => (index + 1) * 2),
        numberMode: 'ignore'
      }
    });
    expect(calculateGematria('abc 99', cipher).total).toBe(12);
    expect(cipher.id).toBe('custom:123');
  });

  it('requires exactly 26 values', () => {
    expect(() => customCipherDefinition([1, 2], 'full')).toThrow(
      'exactly 26 values'
    );
  });

  it('rejects unsafe or fractional values', () => {
    const values = Array.from({ length: 26 }, () => 1);
    values[4] = 1.5;
    expect(() => customCipherDefinition(values, 'digits')).toThrow(
      'must be integers'
    );
  });
});
