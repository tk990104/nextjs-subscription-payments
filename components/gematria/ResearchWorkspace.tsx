'use client';

import Link from 'next/link';
import { FormEvent, useState } from 'react';
import type { PlanEntitlements } from '@/lib/entitlements';

export interface ResearchTableSummary {
  id: string;
  name: string;
  description: string | null;
  color: string | null;
  created_at: string;
  updated_at: string;
  entry_count: number;
}

interface ResearchWorkspaceProps {
  plan: PlanEntitlements;
  initialTables: ResearchTableSummary[];
}

interface FormStatus {
  loading?: boolean;
  message?: string;
  error?: boolean;
}

async function responseBody(response: Response) {
  return (await response.json()) as Record<string, unknown>;
}

export default function ResearchWorkspace({
  plan,
  initialTables
}: ResearchWorkspaceProps) {
  const [tables, setTables] = useState(initialTables);
  const [selectedTableId, setSelectedTableId] = useState(
    initialTables[0]?.id ?? ''
  );
  const [tableStatus, setTableStatus] = useState<FormStatus>({});
  const [entryStatus, setEntryStatus] = useState<FormStatus>({});
  const canUseTables = plan.features.customTables;

  async function createTable(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formElement = event.currentTarget;
    setTableStatus({ loading: true, message: 'Creating…' });
    const form = new FormData(formElement);
    try {
      const response = await fetch('/api/gematria/research-tables', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          name: form.get('name'),
          description: form.get('description'),
          color: form.get('color')
        })
      });
      const body = await responseBody(response);
      if (!response.ok) throw new Error(String(body.error ?? 'Create failed.'));
      const created = body.table as unknown as ResearchTableSummary;
      setTables((current) => [created, ...current]);
      setSelectedTableId(created.id);
      formElement.reset();
      setTableStatus({ message: 'Research table created.' });
    } catch (error) {
      setTableStatus({
        error: true,
        message: error instanceof Error ? error.message : 'Create failed.'
      });
    }
  }

  async function addEntry(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formElement = event.currentTarget;
    setEntryStatus({ loading: true, message: 'Adding…' });
    const form = new FormData(formElement);
    try {
      const response = await fetch(
        `/api/gematria/research-tables/${selectedTableId}/entries`,
        {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({
            phrase: form.get('phrase'),
            notes: form.get('notes'),
            sourceUrl: form.get('sourceUrl')
          })
        }
      );
      const body = await responseBody(response);
      if (!response.ok) throw new Error(String(body.error ?? 'Add failed.'));
      setTables((current) =>
        current.map((table) =>
          table.id === selectedTableId
            ? { ...table, entry_count: table.entry_count + 1 }
            : table
        )
      );
      formElement.reset();
      setEntryStatus({ message: 'Phrase calculated and added.' });
    } catch (error) {
      setEntryStatus({
        error: true,
        message: error instanceof Error ? error.message : 'Add failed.'
      });
    }
  }

  return (
    <section className="mx-auto w-full max-w-6xl px-6 py-12">
      <div className="max-w-3xl">
        <div className="mb-2 flex flex-wrap items-center gap-3">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-pink-400">
            Research workspace
          </p>
          <span className="rounded-full border border-zinc-700 px-3 py-1 text-xs text-zinc-300">
            {plan.label} plan
          </span>
        </div>
        <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
          Organize findings into tables
        </h1>
        <p className="mt-4 text-lg text-zinc-300">
          Build focused collections of phrases, calculated values, notes, and
          source links for repeatable research.
        </p>
      </div>

      {!canUseTables ? (
        <div className="mt-8 rounded-2xl border border-amber-700/60 bg-amber-950/30 p-6">
          <h2 className="text-xl font-bold text-amber-200">
            Researcher plan required
          </h2>
          <p className="mt-2 max-w-2xl text-amber-100/80">
            The Free plan includes calculation history and corpus matching.
            Upgrade to create research tables and attach notes and sources.
          </p>
          <Link
            href="/"
            className="mt-4 inline-block rounded-lg bg-pink-500 px-5 py-3 font-semibold text-white"
          >
            View plans
          </Link>
        </div>
      ) : (
        <div className="mt-8 grid gap-6 lg:grid-cols-2">
          <form
            onSubmit={createTable}
            className="rounded-2xl border border-zinc-800 bg-zinc-950 p-6"
          >
            <h2 className="text-2xl font-bold">Create a table</h2>
            <p className="mt-1 text-sm text-zinc-400">
              {tables.length} of {plan.limits.customTables} tables used
            </p>
            <label
              className="mt-5 block text-sm font-medium"
              htmlFor="table-name"
            >
              Name
            </label>
            <input
              id="table-name"
              name="name"
              required
              maxLength={100}
              className="mt-2 w-full rounded-lg border border-zinc-700 bg-black px-4 py-3"
              placeholder="Dates and events"
            />
            <label
              className="mt-4 block text-sm font-medium"
              htmlFor="table-description"
            >
              Description
            </label>
            <textarea
              id="table-description"
              name="description"
              maxLength={500}
              className="mt-2 min-h-24 w-full rounded-lg border border-zinc-700 bg-black px-4 py-3"
              placeholder="What this collection investigates"
            />
            <label
              className="mt-4 block text-sm font-medium"
              htmlFor="table-color"
            >
              Accent color
            </label>
            <input
              id="table-color"
              name="color"
              type="color"
              defaultValue="#ec4899"
              className="mt-2 h-11 w-20 rounded border border-zinc-700 bg-black p-1"
            />
            <button
              type="submit"
              disabled={tableStatus.loading}
              className="mt-5 rounded-lg bg-pink-500 px-5 py-3 font-semibold hover:bg-pink-400 disabled:opacity-50"
            >
              {tableStatus.loading ? 'Creating…' : 'Create table'}
            </button>
            {tableStatus.message && (
              <p
                className={`mt-3 text-sm ${tableStatus.error ? 'text-red-300' : 'text-emerald-300'}`}
                role="status"
              >
                {tableStatus.message}
              </p>
            )}
          </form>

          <form
            onSubmit={addEntry}
            className="rounded-2xl border border-zinc-800 bg-zinc-950 p-6"
          >
            <h2 className="text-2xl font-bold">Add a finding</h2>
            <label
              className="mt-5 block text-sm font-medium"
              htmlFor="entry-table"
            >
              Research table
            </label>
            <select
              id="entry-table"
              value={selectedTableId}
              onChange={(event) => setSelectedTableId(event.target.value)}
              disabled={!tables.length}
              className="mt-2 w-full rounded-lg border border-zinc-700 bg-black px-4 py-3"
            >
              {!tables.length && <option>Create a table first</option>}
              {tables.map((table) => (
                <option key={table.id} value={table.id}>
                  {table.name}
                </option>
              ))}
            </select>
            <label
              className="mt-4 block text-sm font-medium"
              htmlFor="entry-phrase"
            >
              Phrase
            </label>
            <input
              id="entry-phrase"
              name="phrase"
              required
              maxLength={500}
              className="mt-2 w-full rounded-lg border border-zinc-700 bg-black px-4 py-3"
            />
            <label
              className="mt-4 block text-sm font-medium"
              htmlFor="entry-notes"
            >
              Notes
            </label>
            <textarea
              id="entry-notes"
              name="notes"
              maxLength={5000}
              className="mt-2 min-h-24 w-full rounded-lg border border-zinc-700 bg-black px-4 py-3"
            />
            <label
              className="mt-4 block text-sm font-medium"
              htmlFor="entry-source"
            >
              Source URL
            </label>
            <input
              id="entry-source"
              name="sourceUrl"
              type="url"
              maxLength={2048}
              className="mt-2 w-full rounded-lg border border-zinc-700 bg-black px-4 py-3"
              placeholder="https://"
            />
            <button
              type="submit"
              disabled={!tables.length || entryStatus.loading}
              className="mt-5 rounded-lg bg-pink-500 px-5 py-3 font-semibold hover:bg-pink-400 disabled:opacity-50"
            >
              {entryStatus.loading ? 'Adding…' : 'Calculate and add'}
            </button>
            {entryStatus.message && (
              <p
                className={`mt-3 text-sm ${entryStatus.error ? 'text-red-300' : 'text-emerald-300'}`}
                role="status"
              >
                {entryStatus.message}
              </p>
            )}
          </form>
        </div>
      )}

      <div className="mt-8 rounded-2xl border border-zinc-800 bg-zinc-950 p-6">
        <h2 className="text-2xl font-bold">Your research tables</h2>
        {tables.length ? (
          <div className="mt-5 overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="text-zinc-500">
                <tr>
                  <th className="pb-3 font-medium">Table</th>
                  <th className="pb-3 font-medium">Description</th>
                  <th className="pb-3 font-medium">Entries</th>
                  <th className="pb-3 font-medium">Created</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800">
                {tables.map((table) => (
                  <tr key={table.id}>
                    <td className="py-4 pr-5 font-medium text-zinc-100">
                      <span
                        className="mr-2 inline-block h-2.5 w-2.5 rounded-full"
                        style={{ backgroundColor: table.color ?? '#ec4899' }}
                      />
                      {table.name}
                    </td>
                    <td className="py-4 pr-5 text-zinc-400">
                      {table.description || '—'}
                    </td>
                    <td className="py-4 pr-5 text-zinc-300">
                      {table.entry_count}
                    </td>
                    <td className="py-4 text-zinc-500">
                      {new Date(table.created_at).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="mt-4 text-zinc-500">No research tables yet.</p>
        )}
      </div>
    </section>
  );
}
