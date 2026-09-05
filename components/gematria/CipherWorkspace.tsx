'use client';

import Link from 'next/link';
import { FormEvent, useMemo, useState } from 'react';
import type { PlanEntitlements } from '@/lib/entitlements';
import {
  alphabetLetters,
  calculateGematria,
  customCipherFromStored
} from '@/lib/gematria';
import type { NumberMode } from '@/lib/gematria';
import type { CustomCipherRow } from '@/types_gematria';

interface CipherWorkspaceProps {
  plan: PlanEntitlements;
  initialCiphers: CustomCipherRow[];
}

interface FormStatus {
  loading?: boolean;
  message?: string;
  error?: boolean;
}

async function responseBody(response: Response) {
  return (await response.json()) as Record<string, unknown>;
}

function definitionValues(cipher: CustomCipherRow) {
  if (!cipher.definition || typeof cipher.definition !== 'object') return [];
  const values = (cipher.definition as Record<string, unknown>).values;
  return Array.isArray(values) ? values.map(Number) : [];
}

function definitionNumberMode(cipher: CustomCipherRow) {
  if (!cipher.definition || typeof cipher.definition !== 'object') {
    return 'invalid';
  }
  const mode = (cipher.definition as Record<string, unknown>).numberMode;
  return typeof mode === 'string' ? mode : 'invalid';
}

export default function CipherWorkspace({
  plan,
  initialCiphers
}: CipherWorkspaceProps) {
  const letters = useMemo(() => alphabetLetters(), []);
  const [ciphers, setCiphers] = useState(initialCiphers);
  const [values, setValues] = useState(letters.map((_, index) => index + 1));
  const [numberMode, setNumberMode] = useState<NumberMode>('full');
  const [previewPhrase, setPreviewPhrase] = useState('Gematria');
  const [status, setStatus] = useState<FormStatus>({});
  const canUseCustomCiphers = plan.features.customCiphers;
  const preview = useMemo(() => {
    try {
      const cipher = customCipherFromStored({
        id: 'preview',
        name: 'Preview',
        description: null,
        definition: { values, numberMode }
      });
      return calculateGematria(previewPhrase, cipher);
    } catch {
      return null;
    }
  }, [numberMode, previewPhrase, values]);

  async function createCipher(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formElement = event.currentTarget;
    const form = new FormData(formElement);
    setStatus({ loading: true, message: 'Creating…' });
    try {
      const response = await fetch('/api/gematria/custom-ciphers', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          name: form.get('name'),
          description: form.get('description'),
          values,
          numberMode
        })
      });
      const body = await responseBody(response);
      if (!response.ok) throw new Error(String(body.error ?? 'Create failed.'));
      const created = body.cipher as unknown as CustomCipherRow;
      setCiphers((current) => [created, ...current]);
      formElement.reset();
      setStatus({
        message: 'Custom cipher created and added to the calculator.'
      });
    } catch (error) {
      setStatus({
        error: true,
        message: error instanceof Error ? error.message : 'Create failed.'
      });
    }
  }

  async function deleteCipher(cipherId: string) {
    setStatus({ loading: true, message: 'Deleting…' });
    try {
      const response = await fetch(`/api/gematria/custom-ciphers/${cipherId}`, {
        method: 'DELETE'
      });
      if (!response.ok) {
        const body = await responseBody(response);
        throw new Error(String(body.error ?? 'Delete failed.'));
      }
      setCiphers((current) =>
        current.filter((cipher) => cipher.id !== cipherId)
      );
      setStatus({ message: 'Custom cipher deleted.' });
    } catch (error) {
      setStatus({
        error: true,
        message: error instanceof Error ? error.message : 'Delete failed.'
      });
    }
  }

  return (
    <section className="mx-auto w-full max-w-6xl px-6 py-12">
      <div className="max-w-3xl">
        <div className="mb-2 flex flex-wrap items-center gap-3">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-pink-400">
            Cipher studio
          </p>
          <span className="rounded-full border border-zinc-700 px-3 py-1 text-xs text-zinc-300">
            {plan.label} plan
          </span>
        </div>
        <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
          Design custom English ciphers
        </h1>
        <p className="mt-4 text-lg text-zinc-300">
          Assign an integer to each letter, choose how numbers are handled, and
          preview the cipher before adding it to your calculator.
        </p>
      </div>

      {!canUseCustomCiphers ? (
        <div className="mt-8 rounded-2xl border border-amber-700/60 bg-amber-950/30 p-6">
          <h2 className="text-xl font-bold text-amber-200">
            Researcher plan required
          </h2>
          <p className="mt-2 text-amber-100/80">
            Upgrade to build, save, and calculate with custom ciphers.
          </p>
          <Link
            href="/"
            className="mt-4 inline-block rounded-lg bg-pink-500 px-5 py-3 font-semibold text-white"
          >
            View plans
          </Link>
        </div>
      ) : (
        <form
          onSubmit={createCipher}
          className="mt-8 rounded-2xl border border-zinc-800 bg-zinc-950 p-6"
        >
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <h2 className="text-2xl font-bold">New cipher</h2>
              <p className="mt-1 text-sm text-zinc-400">
                {ciphers.length} of {plan.limits.customCiphers} ciphers used
              </p>
            </div>
            <div className="rounded-lg border border-pink-500/50 bg-pink-950/30 px-5 py-3 text-right">
              <p className="text-xs uppercase tracking-wider text-pink-300">
                Preview total
              </p>
              <p className="text-3xl font-bold text-pink-400">
                {preview?.total ?? '—'}
              </p>
            </div>
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-2">
            <div>
              <label
                className="block text-sm font-medium"
                htmlFor="cipher-name"
              >
                Name
              </label>
              <input
                id="cipher-name"
                name="name"
                required
                maxLength={80}
                className="mt-2 w-full rounded-lg border border-zinc-700 bg-black px-4 py-3"
                placeholder="My cipher"
              />
            </div>
            <div>
              <label
                className="block text-sm font-medium"
                htmlFor="number-mode"
              >
                Number handling
              </label>
              <select
                id="number-mode"
                value={numberMode}
                onChange={(event) =>
                  setNumberMode(event.target.value as NumberMode)
                }
                className="mt-2 w-full rounded-lg border border-zinc-700 bg-black px-4 py-3"
              >
                <option value="full">
                  Treat 123 as one hundred twenty-three
                </option>
                <option value="digits">Add individual digits: 1 + 2 + 3</option>
                <option value="ignore">Ignore numbers</option>
              </select>
            </div>
          </div>
          <label
            className="mt-4 block text-sm font-medium"
            htmlFor="cipher-description"
          >
            Description
          </label>
          <input
            id="cipher-description"
            name="description"
            maxLength={500}
            className="mt-2 w-full rounded-lg border border-zinc-700 bg-black px-4 py-3"
            placeholder="What this cipher represents"
          />

          <fieldset className="mt-6">
            <legend className="text-sm font-medium">Letter values</legend>
            <div className="mt-3 grid grid-cols-4 gap-3 sm:grid-cols-7 md:grid-cols-9 lg:grid-cols-13">
              {letters.map((letter, index) => (
                <label
                  key={letter}
                  className="text-center text-xs uppercase text-zinc-400"
                >
                  {letter}
                  <input
                    type="number"
                    required
                    min={-9999}
                    max={9999}
                    step={1}
                    value={values[index]}
                    onChange={(event) => {
                      const nextValues = [...values];
                      nextValues[index] = Number(event.target.value);
                      setValues(nextValues);
                    }}
                    className="mt-1 w-full rounded border border-zinc-700 bg-black px-2 py-2 text-center text-sm text-white"
                  />
                </label>
              ))}
            </div>
          </fieldset>

          <label
            className="mt-6 block text-sm font-medium"
            htmlFor="preview-phrase"
          >
            Preview phrase
          </label>
          <input
            id="preview-phrase"
            value={previewPhrase}
            onChange={(event) => setPreviewPhrase(event.target.value)}
            maxLength={500}
            className="mt-2 w-full rounded-lg border border-zinc-700 bg-black px-4 py-3"
          />

          <button
            type="submit"
            disabled={status.loading}
            className="mt-6 rounded-lg bg-pink-500 px-5 py-3 font-semibold hover:bg-pink-400 disabled:opacity-50"
          >
            {status.loading ? 'Working…' : 'Create custom cipher'}
          </button>
          {status.message && (
            <p
              className={`mt-3 text-sm ${status.error ? 'text-red-300' : 'text-emerald-300'}`}
              role="status"
            >
              {status.message}
            </p>
          )}
        </form>
      )}

      <div className="mt-8 rounded-2xl border border-zinc-800 bg-zinc-950 p-6">
        <h2 className="text-2xl font-bold">Your custom ciphers</h2>
        {ciphers.length ? (
          <div className="mt-5 overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="text-zinc-500">
                <tr>
                  <th className="pb-3 font-medium">Name</th>
                  <th className="pb-3 font-medium">First values</th>
                  <th className="pb-3 font-medium">Mode</th>
                  <th className="pb-3 font-medium">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800">
                {ciphers.map((cipher) => {
                  return (
                    <tr key={cipher.id}>
                      <td className="py-4 pr-5">
                        <p className="font-medium text-zinc-100">
                          {cipher.name}
                        </p>
                        <p className="text-zinc-500">
                          {cipher.description || 'Custom alphabet cipher'}
                        </p>
                      </td>
                      <td className="py-4 pr-5 text-zinc-300">
                        {definitionValues(cipher).slice(0, 6).join(', ')}…
                      </td>
                      <td className="py-4 pr-5 text-zinc-300">
                        {definitionNumberMode(cipher)}
                      </td>
                      <td className="py-4">
                        <button
                          type="button"
                          onClick={() => deleteCipher(cipher.id)}
                          disabled={status.loading}
                          className="text-red-300 hover:text-red-200 disabled:opacity-50"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="mt-4 text-zinc-500">No custom ciphers yet.</p>
        )}
      </div>
    </section>
  );
}
