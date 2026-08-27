import { defineCipher } from './ciphers';
import type { CipherDefinition, NumberMode } from './types';

const ENGLISH_ALPHABET = 'abcdefghijklmnopqrstuvwxyz'.split('');
const NUMBER_MODES: readonly NumberMode[] = ['full', 'digits', 'ignore'];

export interface StoredCustomCipher {
  id: string;
  name: string;
  description: string | null;
  definition: unknown;
}

export interface CustomCipherDefinition {
  values: number[];
  numberMode: NumberMode;
}

export function customCipherDefinition(
  values: readonly number[],
  numberMode: NumberMode
): CustomCipherDefinition {
  if (values.length !== ENGLISH_ALPHABET.length) {
    throw new Error('A custom English cipher requires exactly 26 values.');
  }
  if (!NUMBER_MODES.includes(numberMode)) {
    throw new Error('Custom cipher number mode is invalid.');
  }
  for (const value of values) {
    if (!Number.isSafeInteger(value) || value < -9999 || value > 9999) {
      throw new Error(
        'Custom cipher values must be integers between -9999 and 9999.'
      );
    }
  }
  return { values: [...values], numberMode };
}

export function customCipherFromStored(
  stored: StoredCustomCipher
): Readonly<CipherDefinition> {
  if (
    !stored.definition ||
    typeof stored.definition !== 'object' ||
    Array.isArray(stored.definition)
  ) {
    throw new Error('Stored custom cipher definition is invalid.');
  }
  const raw = stored.definition as Record<string, unknown>;
  const definition = customCipherDefinition(
    Array.isArray(raw.values) ? raw.values : [],
    raw.numberMode as NumberMode
  );

  return defineCipher({
    id: `custom:${stored.id}`,
    name: stored.name,
    category: 'Custom',
    description: stored.description ?? 'Custom English alphabet cipher.',
    mappings: Object.fromEntries(
      ENGLISH_ALPHABET.map((letter, index) => [
        letter,
        definition.values[index]
      ])
    ),
    stripDiacritics: true,
    numberMode: definition.numberMode
  });
}

export function alphabetLetters() {
  return [...ENGLISH_ALPHABET];
}
