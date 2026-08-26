import { describe, expect, it } from 'vitest';
import {
  calculateGematria,
  defineCipher,
  ENGLISH_ORDINAL,
  FULL_REDUCTION,
  REVERSE_ORDINAL,
  REVERSE_REDUCTION
} from './index';

describe('calculateGematria', () => {
  it('calculates the four foundational English ciphers', () => {
    expect(calculateGematria('Gematria', ENGLISH_ORDINAL).total).toBe(74);
    expect(calculateGematria('Gematria', FULL_REDUCTION).total).toBe(38);
    expect(calculateGematria('Gematria', REVERSE_ORDINAL).total).toBe(142);
    expect(calculateGematria('Gematria', REVERSE_REDUCTION).total).toBe(52);
  });

  it('normalizes case and diacritics', () => {
    expect(calculateGematria('CAFÉ', ENGLISH_ORDINAL).total).toBe(15);
  });

  it('treats consecutive digits as one full number by default', () => {
    const result = calculateGematria('AI 2026', ENGLISH_ORDINAL);
    expect(result.total).toBe(2036);
    expect(result.numericTokens).toBe(1);
  });

  it('supports user-defined multi-character tokens', () => {
    const cipher = defineCipher({
      id: 'example-multicharacter',
      name: 'Example Multicharacter',
      category: 'Custom',
      description: 'Test cipher',
      mappings: { th: 9, a: 1, t: 2 }
    });

    expect(calculateGematria('THAT', cipher).total).toBe(12);
  });
});
