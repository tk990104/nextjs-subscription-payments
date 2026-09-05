import { describe, expect, it } from 'vitest';
import { BUILT_IN_CIPHERS, calculateWithCiphers } from '../lib/gematria/index';
import { buildSeedSql, calculateBuiltInValues } from './build-corpus-seed.mjs';

describe('corpus seed builder', () => {
  it('matches the production core values for Gematria', () => {
    expect(calculateBuiltInValues('Gematria')).toMatchObject({
      'english-ordinal': 74,
      'full-reduction': 38,
      'reverse-ordinal': 142,
      'reverse-reduction': 52
    });
  });

  it('escapes phrases and emits all core cipher rows', () => {
    const sql = buildSeedSql([
      { phrase: "Researcher's Number", category: 'test' }
    ]);
    expect(sql).toContain("Researcher''s Number");
    expect(sql.match(/phrase_cipher_values/g)).toHaveLength(
      BUILT_IN_CIPHERS.length
    );
    expect(sql).toContain('begin;');
    expect(sql).toContain('commit;');
  });

  it('uses the production full-number behavior', () => {
    expect(calculateBuiltInValues('A12')).toMatchObject({
      'english-ordinal': 13,
      'full-reduction': 13,
      'reverse-ordinal': 38,
      'reverse-reduction': 20
    });
  });

  it('stays in sync with the production calculator', () => {
    for (const phrase of ['Gematria', 'A12', 'Café', 'Mars 2026']) {
      const production = Object.fromEntries(
        calculateWithCiphers(phrase, BUILT_IN_CIPHERS).map((result) => [
          result.cipherId,
          result.total
        ])
      );
      expect(calculateBuiltInValues(phrase)).toEqual(production);
    }
  });

  it('rejects case-insensitive duplicate phrases', () => {
    expect(() =>
      buildSeedSql([{ phrase: 'Mars' }, { phrase: 'mars' }])
    ).toThrow('Duplicate corpus phrase');
  });
});
