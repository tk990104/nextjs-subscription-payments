import { describe, expect, it } from 'vitest';
import {
  GematriaValidationError,
  parseCipherPreferencesInput,
  parseCustomCipherInput,
  parseMatchInput,
  parsePhraseInput,
  parseResearchEntryInput,
  parseResearchTableInput
} from './validation';

describe('gematria request validation', () => {
  it('trims and accepts a phrase', () => {
    expect(parsePhraseInput({ phrase: '  Gematria  ' })).toEqual({
      phrase: 'Gematria'
    });
  });

  it('validates and deduplicates cipher preferences', () => {
    expect(
      parseCipherPreferencesInput(
        { cipherIds: ['english-ordinal', 'english-ordinal', 'primes'] },
        new Set(['english-ordinal', 'primes'])
      )
    ).toEqual({ cipherIds: ['english-ordinal', 'primes'] });
  });

  it('rejects unavailable cipher preferences', () => {
    expect(() =>
      parseCipherPreferencesInput(
        { cipherIds: ['custom:not-mine'] },
        new Set(['english-ordinal'])
      )
    ).toThrow('Select between 1 and 64 available ciphers.');
  });

  it('rejects empty phrases', () => {
    expect(() => parsePhraseInput({ phrase: '   ' })).toThrow(
      GematriaValidationError
    );
  });

  it('normalizes optional research table fields', () => {
    expect(
      parseResearchTableInput({ name: ' Dates ', description: '', color: '' })
    ).toEqual({ name: 'Dates', description: null, color: null });
  });

  it('rejects unsafe source URL protocols', () => {
    expect(() =>
      parseResearchEntryInput({ phrase: 'test', sourceUrl: 'javascript:x' })
    ).toThrow('Source URL must be a valid HTTP or HTTPS URL.');
  });

  it('accepts a supported cipher match request', () => {
    expect(parseMatchInput({ cipherId: 'english-ordinal', value: 74 })).toEqual(
      { cipherId: 'english-ordinal', value: 74 }
    );
  });

  it('rejects an unknown cipher', () => {
    expect(() => parseMatchInput({ cipherId: 'unknown', value: 1 })).toThrow(
      'Cipher is not supported.'
    );
  });

  it('parses a safe custom cipher definition', () => {
    const parsed = parseCustomCipherInput({
      name: ' Ordinal copy ',
      values: Array.from({ length: 26 }, (_, index) => index + 1),
      numberMode: 'full'
    });
    expect(parsed.name).toBe('Ordinal copy');
    expect(parsed.definition.values).toHaveLength(26);
  });
});
