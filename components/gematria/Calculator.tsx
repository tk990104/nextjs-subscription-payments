'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import type { PlanEntitlements } from '@/lib/entitlements';
import { calculateWithCiphers, CORE_CIPHERS } from '@/lib/gematria';
import type { CipherDefinition } from '@/lib/gematria';

export interface CalculatorHistoryItem {
  id: string;
  phrase: string;
  created_at: string;
}

interface CorpusMatch {
  id: number;
  phrase: string;
  category: string | null;
  source: string | null;
}

interface MatchState {
  loading: boolean;
  error?: string;
  matches?: CorpusMatch[];
  remaining?: number | null;
}

interface CalculatorProps {
  isAuthenticated: boolean;
  plan: PlanEntitlements;
  initialHistory: CalculatorHistoryItem[];
  customCiphers: Readonly<CipherDefinition>[];
}

async function responseBody(response: Response) {
  return (await response.json()) as Record<string, unknown>;
}

export default function Calculator({
  isAuthenticated,
  plan,
  initialHistory,
  customCiphers
}: CalculatorProps) {
  const [phrase, setPhrase] = useState('Gematria');
  const [history, setHistory] = useState(initialHistory);
  const [saveStatus, setSaveStatus] = useState<{
    loading?: boolean;
    message?: string;
    error?: boolean;
  }>({});
  const [matchStates, setMatchStates] = useState<Record<string, MatchState>>(
    {}
  );
  const ciphers = useMemo(
    () => [...CORE_CIPHERS, ...customCiphers],
    [customCiphers]
  );
  const results = useMemo(
    () => calculateWithCiphers(phrase, ciphers),
    [ciphers, phrase]
  );

  async function saveCalculation() {
    setSaveStatus({ loading: true, message: 'Saving…' });
    try {
      const response = await fetch('/api/gematria/history', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ phrase })
      });
      const body = await responseBody(response);
      if (!response.ok) throw new Error(String(body.error ?? 'Save failed.'));
      const item = body.history as unknown as CalculatorHistoryItem;
      setHistory((current) => [item, ...current].slice(0, 50));
      setSaveStatus({ message: 'Saved to your calculation history.' });
    } catch (error) {
      setSaveStatus({
        error: true,
        message: error instanceof Error ? error.message : 'Save failed.'
      });
    }
  }

  async function findMatches(cipherId: string, value: number) {
    setMatchStates((current) => ({
      ...current,
      [cipherId]: { loading: true }
    }));
    try {
      const response = await fetch('/api/gematria/matches', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ cipherId, value })
      });
      const body = await responseBody(response);
      if (!response.ok) throw new Error(String(body.error ?? 'Search failed.'));
      const usage = body.usage as { remaining: number | null };
      setMatchStates((current) => ({
        ...current,
        [cipherId]: {
          loading: false,
          matches: body.matches as unknown as CorpusMatch[],
          remaining: usage.remaining
        }
      }));
    } catch (error) {
      setMatchStates((current) => ({
        ...current,
        [cipherId]: {
          loading: false,
          error: error instanceof Error ? error.message : 'Search failed.'
        }
      }));
    }
  }

  return (
    <section className="mx-auto w-full max-w-6xl px-6 py-12">
      <div className="mb-8 max-w-3xl">
        <div className="mb-2 flex flex-wrap items-center gap-3">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-pink-400">
            Research calculator
          </p>
          <span className="rounded-full border border-zinc-700 px-3 py-1 text-xs text-zinc-300">
            {plan.label} plan
          </span>
        </div>
        <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
          Compare a phrase across ciphers
        </h1>
        <p className="mt-4 text-lg text-zinc-300">
          Calculate locally, save authenticated history, and search the shared
          phrase corpus with limits enforced by your subscription.
        </p>
      </div>

      <label
        htmlFor="gematria-phrase"
        className="mb-2 block text-sm font-medium"
      >
        Word, phrase, or number
      </label>
      <input
        id="gematria-phrase"
        value={phrase}
        maxLength={500}
        onChange={(event) => setPhrase(event.target.value)}
        placeholder="Enter a phrase"
        className="w-full rounded-xl border border-zinc-700 bg-zinc-950 px-5 py-4 text-xl text-white shadow-inner placeholder:text-zinc-600"
      />

      <div className="mt-4 flex flex-wrap items-center gap-4">
        {isAuthenticated ? (
          <button
            type="button"
            onClick={saveCalculation}
            disabled={!phrase.trim() || saveStatus.loading}
            className="rounded-lg bg-pink-500 px-5 py-3 font-semibold text-white hover:bg-pink-400 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {saveStatus.loading ? 'Saving…' : 'Save calculation'}
          </button>
        ) : (
          <Link
            href="/signin"
            className="rounded-lg bg-pink-500 px-5 py-3 font-semibold text-white hover:bg-pink-400"
          >
            Sign in to save and match
          </Link>
        )}
        {saveStatus.message && (
          <p
            className={saveStatus.error ? 'text-red-300' : 'text-emerald-300'}
            role="status"
          >
            {saveStatus.message}
          </p>
        )}
      </div>

      <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {results.map((result) => {
          const matchState = matchStates[result.cipherId];
          return (
            <article
              key={result.cipherId}
              className="rounded-2xl border border-zinc-700 bg-zinc-900 p-5 shadow-lg"
            >
              <p className="text-sm font-medium text-zinc-400">
                {result.cipherName}
              </p>
              <p className="my-3 text-5xl font-bold text-pink-400">
                {result.total}
              </p>
              <p className="min-h-10 text-sm text-zinc-400">
                {
                  ciphers.find((cipher) => cipher.id === result.cipherId)
                    ?.description
                }
              </p>
              <div className="mt-4 border-t border-zinc-800 pt-4 text-sm leading-7 text-zinc-300">
                {result.parts.length ? (
                  result.parts.map((part, index) => (
                    <span
                      key={`${part.source}-${index}`}
                      className="mr-2 inline-block"
                    >
                      {part.source || part.normalized}
                      <span className="text-zinc-500">({part.value})</span>
                    </span>
                  ))
                ) : (
                  <span className="text-zinc-500">No mapped characters</span>
                )}
              </div>
              {isAuthenticated &&
                CORE_CIPHERS.some(
                  (cipher) => cipher.id === result.cipherId
                ) && (
                  <button
                    type="button"
                    onClick={() => findMatches(result.cipherId, result.total)}
                    disabled={matchState?.loading}
                    className="mt-4 w-full rounded-lg border border-zinc-600 px-3 py-2 text-sm font-medium hover:border-pink-400 disabled:opacity-50"
                  >
                    {matchState?.loading ? 'Searching…' : 'Find equal values'}
                  </button>
                )}
              {matchState?.error && (
                <p className="mt-3 text-sm text-red-300" role="status">
                  {matchState.error}
                </p>
              )}
              {matchState?.matches && (
                <div className="mt-3 text-sm text-zinc-300">
                  {matchState.matches.length ? (
                    <ul className="space-y-1">
                      {matchState.matches.slice(0, 8).map((match) => (
                        <li key={match.id}>{match.phrase}</li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-zinc-500">No corpus matches yet.</p>
                  )}
                  {matchState.remaining !== null && (
                    <p className="mt-2 text-xs text-zinc-500">
                      {matchState.remaining} searches remaining today
                    </p>
                  )}
                </div>
              )}
            </article>
          );
        })}
      </div>

      {isAuthenticated && (
        <div className="mt-12 rounded-2xl border border-zinc-800 bg-zinc-950 p-6">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <h2 className="text-2xl font-bold">Recent history</h2>
              <p className="mt-1 text-sm text-zinc-400">
                Your plan stores up to{' '}
                {plan.limits.historyEntries.toLocaleString()} calculations.
              </p>
            </div>
            <Link
              href="/research"
              className="text-sm text-pink-400 hover:text-pink-300"
            >
              Open research workspace →
            </Link>
          </div>
          {history.length ? (
            <div className="mt-5 overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="text-zinc-500">
                  <tr>
                    <th className="pb-3 font-medium">Phrase</th>
                    <th className="pb-3 font-medium">Saved</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800">
                  {history.slice(0, 20).map((item) => (
                    <tr key={item.id}>
                      <td className="py-3 pr-5 text-zinc-200">{item.phrase}</td>
                      <td className="py-3 text-zinc-500">
                        {new Date(item.created_at).toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="mt-5 text-zinc-500">No saved calculations yet.</p>
          )}
        </div>
      )}
    </section>
  );
}
