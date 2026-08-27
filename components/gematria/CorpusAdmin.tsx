'use client';

import { FormEvent, useState } from 'react';

export default function CorpusAdmin() {
  const [status, setStatus] = useState<{
    loading?: boolean;
    message?: string;
    error?: boolean;
  }>({});

  async function importCsv(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const file = form.get('corpus');
    if (!(file instanceof File) || !file.size) {
      setStatus({ error: true, message: 'Choose a CSV file first.' });
      return;
    }
    setStatus({ loading: true, message: 'Importing and calculating values…' });
    try {
      const response = await fetch('/api/gematria/corpus', {
        method: 'POST',
        headers: { 'content-type': 'text/csv' },
        body: await file.text()
      });
      const body = (await response.json()) as {
        error?: string;
        imported?: number;
        values?: number;
      };
      if (!response.ok) throw new Error(body.error ?? 'Import failed.');
      setStatus({
        message: `Imported ${body.imported} phrases and ${body.values} cipher values.`
      });
      event.currentTarget.reset();
    } catch (error) {
      setStatus({
        error: true,
        message: error instanceof Error ? error.message : 'Import failed.'
      });
    }
  }

  return (
    <section className="mx-auto w-full max-w-4xl px-6 py-12">
      <p className="text-sm font-semibold uppercase tracking-[0.2em] text-pink-400">
        Administration
      </p>
      <h1 className="mt-2 text-4xl font-bold">Corpus import and export</h1>
      <p className="mt-4 text-zinc-300">
        Upload up to 1,000 phrases per CSV. All built-in cipher values are
        recalculated on the server.
      </p>

      <div className="mt-8 grid gap-6 md:grid-cols-2">
        <form
          onSubmit={importCsv}
          className="rounded-2xl border border-zinc-800 bg-zinc-950 p-6"
        >
          <h2 className="text-xl font-bold">Import CSV</h2>
          <p className="mt-2 text-sm text-zinc-400">
            Required header: phrase. Optional headers: category and source.
          </p>
          <input
            name="corpus"
            type="file"
            accept=".csv,text/csv"
            className="mt-5 block w-full text-sm"
          />
          <button
            type="submit"
            disabled={status.loading}
            className="mt-5 rounded-lg bg-pink-500 px-5 py-3 font-semibold hover:bg-pink-400 disabled:opacity-50"
          >
            {status.loading ? 'Importing…' : 'Import corpus'}
          </button>
        </form>
        <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-6">
          <h2 className="text-xl font-bold">Export CSV</h2>
          <p className="mt-2 text-sm text-zinc-400">
            Download the current active and inactive corpus records for backup
            or editing.
          </p>
          <a
            href="/api/gematria/corpus"
            className="mt-5 inline-block rounded-lg border border-pink-500 px-5 py-3 font-semibold text-pink-300 hover:bg-pink-500/10"
          >
            Download corpus
          </a>
        </div>
      </div>
      {status.message && (
        <p
          role="status"
          className={`mt-5 ${status.error ? 'text-red-300' : 'text-emerald-300'}`}
        >
          {status.message}
        </p>
      )}
    </section>
  );
}
