import { describe, expect, it } from 'vitest';
import { corpusRowsToCsv, parseCorpusCsv, researchRowsToCsv } from './csv';

describe('gematria CSV tools', () => {
  it('parses quoted corpus fields and optional columns', () => {
    expect(
      parseCorpusCsv(
        'phrase,category,source\r\n"Mars, Inc.",planet,"Book ""A"""'
      )
    ).toEqual([
      { phrase: 'Mars, Inc.', category: 'planet', source: 'Book "A"' }
    ]);
  });

  it('rejects duplicate phrases case-insensitively', () => {
    expect(() => parseCorpusCsv('phrase\nMars\nmars')).toThrow(
      'Duplicate corpus phrase'
    );
  });

  it('round-trips corpus rows', () => {
    const rows = [{ phrase: 'A, B', category: 'test', source: null }];
    expect(parseCorpusCsv(corpusRowsToCsv(rows))).toEqual(rows);
  });

  it('serializes research results as JSON', () => {
    const csv = researchRowsToCsv([
      {
        phrase: 'Gematria',
        notes: 'baseline',
        source_url: null,
        created_at: '2026-08-27T00:00:00Z',
        results: [{ cipherId: 'english-ordinal', total: 74 }]
      }
    ]);
    expect(csv).toContain('results_json');
    expect(csv).toContain('english-ordinal');
  });
});
