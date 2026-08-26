import type { CipherDefinition } from './types';

const ENGLISH_ALPHABET = 'abcdefghijklmnopqrstuvwxyz'.split('');

function alphabetMappings(values: readonly number[]) {
  if (values.length !== ENGLISH_ALPHABET.length) {
    throw new Error(
      'An English alphabet cipher must define exactly 26 values.'
    );
  }

  return Object.freeze(
    Object.fromEntries(
      ENGLISH_ALPHABET.map((character, index) => [character, values[index]])
    )
  );
}

function englishCipher(
  id: string,
  name: string,
  description: string,
  values: readonly number[]
): CipherDefinition {
  return Object.freeze({
    id,
    name,
    category: 'English',
    description,
    mappings: alphabetMappings(values),
    stripDiacritics: true,
    numberMode: 'full'
  });
}

const ordinalValues = Array.from({ length: 26 }, (_, index) => index + 1);
const reverseOrdinalValues = [...ordinalValues].reverse();

export const ENGLISH_ORDINAL = englishCipher(
  'english-ordinal',
  'English Ordinal',
  'A=1 through Z=26.',
  ordinalValues
);

export const FULL_REDUCTION = englishCipher(
  'full-reduction',
  'Full Reduction',
  'English ordinal values reduced to a repeating 1–9 sequence.',
  ordinalValues.map((value) => ((value - 1) % 9) + 1)
);

export const REVERSE_ORDINAL = englishCipher(
  'reverse-ordinal',
  'Reverse Ordinal',
  'Z=1 through A=26.',
  reverseOrdinalValues
);

export const REVERSE_REDUCTION = englishCipher(
  'reverse-reduction',
  'Reverse Full Reduction',
  'Reverse ordinal values reduced to a repeating 1–9 sequence.',
  reverseOrdinalValues.map((value) => ((value - 1) % 9) + 1)
);

export const CORE_CIPHERS = Object.freeze([
  ENGLISH_ORDINAL,
  FULL_REDUCTION,
  REVERSE_ORDINAL,
  REVERSE_REDUCTION
]);

export function defineCipher(
  definition: CipherDefinition
): Readonly<CipherDefinition> {
  if (!definition.id.trim() || !definition.name.trim()) {
    throw new Error('A cipher requires a stable id and a display name.');
  }

  const mappings = Object.entries(definition.mappings);
  if (mappings.length === 0) {
    throw new Error('A cipher requires at least one character mapping.');
  }

  for (const [token, value] of mappings) {
    if (!token.length || !Number.isFinite(value)) {
      throw new Error(
        'Cipher mappings require non-empty tokens and finite values.'
      );
    }
  }

  return Object.freeze({
    ...definition,
    mappings: Object.freeze({ ...definition.mappings })
  });
}
