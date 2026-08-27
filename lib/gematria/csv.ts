export interface CorpusCsvRow {
  phrase: string;
  category: string | null;
  source: string | null;
}

function csvCells(input: string) {
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = '';
  let quoted = false;

  for (let index = 0; index < input.length; index += 1) {
    const character = input[index];
    if (quoted) {
      if (character === '"' && input[index + 1] === '"') {
        cell += '"';
        index += 1;
      } else if (character === '"') {
        quoted = false;
      } else {
        cell += character;
      }
    } else if (character === '"') {
      quoted = true;
    } else if (character === ',') {
      row.push(cell);
      cell = '';
    } else if (character === '\n') {
      row.push(cell.replace(/\r$/, ''));
      rows.push(row);
      row = [];
      cell = '';
    } else {
      cell += character;
    }
  }

  if (quoted) throw new Error('CSV contains an unclosed quoted field.');
  if (cell.length || row.length) {
    row.push(cell.replace(/\r$/, ''));
    rows.push(row);
  }
  return rows;
}

export function parseCorpusCsv(input: string, maximumRows = 1000) {
  if (input.length > 2_000_000) throw new Error('CSV file is too large.');
  const rows = csvCells(input.replace(/^\uFEFF/, ''));
  const headers = rows.shift()?.map((header) => header.trim().toLowerCase());
  if (!headers || headers[0] !== 'phrase') {
    throw new Error('CSV must begin with a phrase column.');
  }
  const phraseIndex = headers.indexOf('phrase');
  const categoryIndex = headers.indexOf('category');
  const sourceIndex = headers.indexOf('source');
  const seen = new Set<string>();
  const parsed = rows
    .filter((row) => row.some((cell) => cell.trim()))
    .map((row, index): CorpusCsvRow => {
      const phrase = row[phraseIndex]?.trim() ?? '';
      if (!phrase || phrase.length > 500) {
        throw new Error(`CSV row ${index + 2} has an invalid phrase.`);
      }
      const key = phrase.toLocaleLowerCase('en');
      if (seen.has(key)) throw new Error(`Duplicate corpus phrase: ${phrase}`);
      seen.add(key);
      const category =
        categoryIndex >= 0 ? row[categoryIndex]?.trim() || null : null;
      const source = sourceIndex >= 0 ? row[sourceIndex]?.trim() || null : null;
      if ((category?.length ?? 0) > 200 || (source?.length ?? 0) > 500) {
        throw new Error(`CSV row ${index + 2} has an oversized field.`);
      }
      return { phrase, category, source };
    });
  if (!parsed.length) throw new Error('CSV contains no corpus rows.');
  if (parsed.length > maximumRows) {
    throw new Error(`CSV may contain at most ${maximumRows} rows.`);
  }
  return parsed;
}

function escapeCsv(value: unknown) {
  const text = value == null ? '' : String(value);
  return /[",\r\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
}

export function corpusRowsToCsv(rows: readonly CorpusCsvRow[]) {
  return [
    'phrase,category,source',
    ...rows.map((row) =>
      [row.phrase, row.category, row.source].map(escapeCsv).join(',')
    )
  ].join('\r\n');
}

export function researchRowsToCsv(
  rows: readonly {
    phrase: string;
    notes: string | null;
    source_url: string | null;
    created_at: string;
    results: unknown;
  }[]
) {
  return [
    'phrase,notes,source_url,created_at,results_json',
    ...rows.map((row) =>
      [
        row.phrase,
        row.notes,
        row.source_url,
        row.created_at,
        JSON.stringify(row.results)
      ]
        .map(escapeCsv)
        .join(',')
    )
  ].join('\r\n');
}
