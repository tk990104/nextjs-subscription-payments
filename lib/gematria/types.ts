export type NumberMode = 'full' | 'digits' | 'ignore';

export interface CipherDefinition {
  id: string;
  name: string;
  category: string;
  description: string;
  mappings: Readonly<Record<string, number>>;
  caseSensitive?: boolean;
  stripDiacritics?: boolean;
  numberMode?: NumberMode;
}

export interface GematriaPart {
  source: string;
  normalized: string;
  value: number;
  kind: 'cipher' | 'number';
}

export interface GematriaResult {
  cipherId: string;
  cipherName: string;
  input: string;
  normalizedInput: string;
  total: number;
  mappedTokens: number;
  numericTokens: number;
  parts: GematriaPart[];
}
