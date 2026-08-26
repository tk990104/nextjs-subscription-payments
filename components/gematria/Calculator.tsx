'use client';

import { useMemo, useState } from 'react';
import { calculateWithCiphers, CORE_CIPHERS } from '@/lib/gematria';

export default function Calculator() {
  const [phrase, setPhrase] = useState('Gematria');
  const results = useMemo(
    () => calculateWithCiphers(phrase, CORE_CIPHERS),
    [phrase]
  );

  return (
    <section className="mx-auto w-full max-w-6xl px-6 py-12">
      <div className="mb-8 max-w-3xl">
        <p className="mb-2 text-sm font-semibold uppercase tracking-[0.2em] text-pink-400">
          Foundation calculator
        </p>
        <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
          Compare a phrase across ciphers
        </h1>
        <p className="mt-4 text-lg text-zinc-300">
          This first milestone establishes the independent calculation engine.
          Saved histories, custom ciphers, database matching, and research
          tables will connect to the account system next.
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

      <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {results.map((result) => (
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
                CORE_CIPHERS.find((cipher) => cipher.id === result.cipherId)
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
          </article>
        ))}
      </div>
    </section>
  );
}
