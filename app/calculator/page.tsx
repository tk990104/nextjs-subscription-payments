import type { Metadata } from 'next';
import Calculator from '@/components/gematria/Calculator';

export const metadata: Metadata = {
  title: 'Calculator | Gematria Research Platform',
  description: 'Compare phrases across foundational English gematria ciphers.'
};

export default function CalculatorPage() {
  return <Calculator />;
}
