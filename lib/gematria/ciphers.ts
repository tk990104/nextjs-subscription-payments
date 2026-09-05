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
const extendedValues = ordinalValues.map((value) => {
  if (value <= 9) return value;
  if (value <= 18) return (value - 9) * 10;
  return (value - 18) * 100;
});
const primeValues = [
  2, 3, 5, 7, 11, 13, 17, 19, 23, 29, 31, 37, 41, 43, 47, 53, 59, 61, 67, 71,
  73, 79, 83, 89, 97, 101
];

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

export const ENGLISH_EXTENDED = englishCipher(
  'english-extended',
  'English Extended',
  'A–I use 1–9, J–R use 10–90, and S–Z use 100–800.',
  extendedValues
);

export const REVERSE_EXTENDED = englishCipher(
  'reverse-extended',
  'Reverse English Extended',
  'English Extended values assigned from Z back to A.',
  [...extendedValues].reverse()
);

export const PRIMES = englishCipher(
  'primes',
  'Primes',
  'A–Z map to the first 26 prime numbers.',
  primeValues
);

export const REVERSE_PRIMES = englishCipher(
  'reverse-primes',
  'Reverse Primes',
  'The first 26 prime numbers assigned from Z back to A.',
  [...primeValues].reverse()
);

export const SQUARES = englishCipher(
  'squares',
  'Squares',
  'Each ordinal position is squared: A=1, B=4, through Z=676.',
  ordinalValues.map((value) => value ** 2)
);

export const REVERSE_SQUARES = englishCipher(
  'reverse-squares',
  'Reverse Squares',
  'Squared ordinal values assigned from Z back to A.',
  reverseOrdinalValues.map((value) => value ** 2)
);

export const TRIGONAL = englishCipher(
  'trigonal',
  'Trigonal',
  'A–Z map to triangular numbers n(n+1)/2.',
  ordinalValues.map((value) => (value * (value + 1)) / 2)
);

export const REVERSE_TRIGONAL = englishCipher(
  'reverse-trigonal',
  'Reverse Trigonal',
  'Triangular values assigned from Z back to A.',
  reverseOrdinalValues.map((value) => (value * (value + 1)) / 2)
);

export const SATANIC = englishCipher(
  'satanic',
  'Satanic',
  'Ordinal values offset by 35: A=36 through Z=61.',
  ordinalValues.map((value) => value + 35)
);

export const REVERSE_SATANIC = englishCipher(
  'reverse-satanic',
  'Reverse Satanic',
  'The 36–61 sequence assigned from Z back to A.',
  reverseOrdinalValues.map((value) => value + 35)
);

export const SEPTENARY = englishCipher(
  'septenary',
  'Septenary',
  'A mirrored 1–7 sequence across the English alphabet.',
  [1, 2, 3, 4, 5, 6, 7, 6, 5, 4, 3, 2, 1, 1, 2, 3, 4, 5, 6, 7, 6, 5, 4, 3, 2, 1]
);

export const CORE_CIPHERS = Object.freeze([
  ENGLISH_ORDINAL,
  FULL_REDUCTION,
  REVERSE_ORDINAL,
  REVERSE_REDUCTION
]);

export const BUILT_IN_CIPHERS = Object.freeze([
  ...CORE_CIPHERS,
  ENGLISH_EXTENDED,
  REVERSE_EXTENDED,
  PRIMES,
  REVERSE_PRIMES,
  SQUARES,
  REVERSE_SQUARES,
  TRIGONAL,
  REVERSE_TRIGONAL,
  SATANIC,
  REVERSE_SATANIC,
  SEPTENARY
]);

export const DEFAULT_CIPHER_IDS = Object.freeze(
  CORE_CIPHERS.map((cipher) => cipher.id)
);

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
