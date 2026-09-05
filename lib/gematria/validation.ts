import { BUILT_IN_CIPHERS } from './ciphers';
import { customCipherDefinition } from './custom';
import type { NumberMode } from './types';

export class GematriaValidationError extends Error {}

function objectInput(input: unknown) {
  if (!input || typeof input !== 'object' || Array.isArray(input)) {
    throw new GematriaValidationError('A JSON object is required.');
  }
  return input as Record<string, unknown>;
}

function cleanString(
  value: unknown,
  field: string,
  maximum: number,
  required = true
) {
  if (typeof value !== 'string') {
    if (!required && (value === undefined || value === null)) return null;
    throw new GematriaValidationError(`${field} must be text.`);
  }
  const cleaned = value.trim();
  if (required && !cleaned) {
    throw new GematriaValidationError(`${field} is required.`);
  }
  if (cleaned.length > maximum) {
    throw new GematriaValidationError(
      `${field} must be ${maximum} characters or fewer.`
    );
  }
  return cleaned || null;
}

export function parsePhraseInput(input: unknown) {
  const body = objectInput(input);
  return { phrase: cleanString(body.phrase, 'Phrase', 500) as string };
}

export function parseResearchTableInput(input: unknown) {
  const body = objectInput(input);
  const color = cleanString(body.color, 'Color', 20, false);
  if (color && !/^#[0-9a-f]{6}$/i.test(color)) {
    throw new GematriaValidationError('Color must be a six-digit hex value.');
  }
  return {
    name: cleanString(body.name, 'Name', 100) as string,
    description: cleanString(body.description, 'Description', 500, false),
    color
  };
}

export function parseResearchEntryInput(input: unknown) {
  const body = objectInput(input);
  const sourceUrl = cleanString(body.sourceUrl, 'Source URL', 2048, false);
  if (sourceUrl) {
    try {
      const url = new URL(sourceUrl);
      if (!['http:', 'https:'].includes(url.protocol)) throw new Error();
    } catch {
      throw new GematriaValidationError(
        'Source URL must be a valid HTTP or HTTPS URL.'
      );
    }
  }
  return {
    phrase: cleanString(body.phrase, 'Phrase', 500) as string,
    notes: cleanString(body.notes, 'Notes', 5000, false),
    sourceUrl
  };
}

export function parseMatchInput(input: unknown) {
  const body = objectInput(input);
  const cipherId = cleanString(body.cipherId, 'Cipher', 80) as string;
  if (!BUILT_IN_CIPHERS.some((cipher) => cipher.id === cipherId)) {
    throw new GematriaValidationError('Cipher is not supported.');
  }
  if (
    typeof body.value !== 'number' ||
    !Number.isSafeInteger(body.value) ||
    body.value < 0
  ) {
    throw new GematriaValidationError('Value must be a non-negative integer.');
  }
  return { cipherId, value: body.value };
}

export function parseCipherPreferencesInput(
  input: unknown,
  allowedCipherIds: ReadonlySet<string>
) {
  const body = objectInput(input);
  if (!Array.isArray(body.cipherIds)) {
    throw new GematriaValidationError('Cipher selection must be an array.');
  }
  const cipherIds = [...new Set(body.cipherIds)];
  if (
    cipherIds.length === 0 ||
    cipherIds.length > 64 ||
    cipherIds.some((id) => typeof id !== 'string' || !allowedCipherIds.has(id))
  ) {
    throw new GematriaValidationError(
      'Select between 1 and 64 available ciphers.'
    );
  }
  return { cipherIds: cipherIds as string[] };
}

export function parseCustomCipherInput(input: unknown) {
  const body = objectInput(input);
  const values = Array.isArray(body.values) ? body.values : [];
  const numberMode = body.numberMode as NumberMode;
  let definition;
  try {
    definition = customCipherDefinition(values as number[], numberMode);
  } catch (error) {
    throw new GematriaValidationError(
      error instanceof Error ? error.message : 'Cipher definition is invalid.'
    );
  }
  return {
    name: cleanString(body.name, 'Name', 80) as string,
    description: cleanString(body.description, 'Description', 500, false),
    definition
  };
}
