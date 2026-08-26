import type { CipherDefinition, GematriaPart, GematriaResult } from './types';

const COMBINING_MARKS = /[\u0300-\u036f]/g;
const DIGIT_RUN = /^\d+/;

function normalize(value: string, cipher: CipherDefinition) {
  let normalized = value.normalize('NFKD');
  if (cipher.stripDiacritics !== false) {
    normalized = normalized.replace(COMBINING_MARKS, '');
  }
  return cipher.caseSensitive ? normalized : normalized.toLocaleLowerCase('en');
}

function normalizedMappings(cipher: CipherDefinition) {
  const mappings = new Map<string, { source: string; value: number }>();

  for (const [source, value] of Object.entries(cipher.mappings)) {
    const token = normalize(source, cipher);
    const existing = mappings.get(token);
    if (existing && existing.value !== value) {
      throw new Error(
        `Cipher ${cipher.id} has conflicting mappings for ${source}.`
      );
    }
    mappings.set(token, { source, value });
  }

  return [...mappings.entries()].sort(
    ([left], [right]) => right.length - left.length
  );
}

function numberPart(source: string, mode: CipherDefinition['numberMode']) {
  if (mode === 'ignore') return null;
  const value =
    mode === 'digits'
      ? [...source].reduce((sum, digit) => sum + Number(digit), 0)
      : Number(source);

  return {
    source,
    normalized: source,
    value,
    kind: 'number' as const
  };
}

export function calculateGematria(
  input: string,
  cipher: CipherDefinition
): GematriaResult {
  const normalizedInput = normalize(input, cipher);
  const mappings = normalizedMappings(cipher);
  const parts: GematriaPart[] = [];
  let cursor = 0;

  while (cursor < normalizedInput.length) {
    let matched = false;

    for (const [token, mapping] of mappings) {
      if (normalizedInput.startsWith(token, cursor)) {
        parts.push({
          source: input.slice(cursor, cursor + token.length),
          normalized: token,
          value: mapping.value,
          kind: 'cipher'
        });
        cursor += token.length;
        matched = true;
        break;
      }
    }

    if (matched) continue;

    const digits = normalizedInput.slice(cursor).match(DIGIT_RUN)?.[0];
    if (digits) {
      const part = numberPart(digits, cipher.numberMode ?? 'full');
      if (part) parts.push(part);
      cursor += digits.length;
      continue;
    }

    const codePoint = normalizedInput.codePointAt(cursor);
    cursor += codePoint && codePoint > 0xffff ? 2 : 1;
  }

  return {
    cipherId: cipher.id,
    cipherName: cipher.name,
    input,
    normalizedInput,
    total: parts.reduce((sum, part) => sum + part.value, 0),
    mappedTokens: parts.filter((part) => part.kind === 'cipher').length,
    numericTokens: parts.filter((part) => part.kind === 'number').length,
    parts
  };
}

export function calculateWithCiphers(
  input: string,
  ciphers: readonly CipherDefinition[]
) {
  return ciphers.map((cipher) => calculateGematria(input, cipher));
}
