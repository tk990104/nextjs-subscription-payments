import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { createGematriaAdminClient } from '@/lib/gematria/server';
import type {
  ResearchEntryRow,
  ResearchShareRow,
  ResearchTableRow
} from '@/types_gematria';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = { title: 'Shared Gematria Research' };

interface PageProps {
  params: Promise<{ token: string }>;
}
interface SharedResult {
  cipherId?: string;
  cipherName?: string;
  total?: number;
}

export default async function SharedResearchPage({ params }: PageProps) {
  const { token } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(token)) notFound();
  const admin = createGematriaAdminClient();
  const { data: shareData } = await admin
    .from('research_shares')
    .select('table_id')
    .eq('token', token)
    .maybeSingle();
  if (!shareData) notFound();
  const share = shareData as unknown as Pick<ResearchShareRow, 'table_id'>;
  const [tableResponse, entriesResponse] = await Promise.all([
    admin
      .from('research_tables')
      .select('name, description, color, created_at')
      .eq('id', share.table_id)
      .maybeSingle(),
    admin
      .from('research_entries')
      .select('id, phrase, results, notes, source_url, created_at')
      .eq('table_id', share.table_id)
      .order('created_at')
  ]);
  if (!tableResponse.data || tableResponse.error || entriesResponse.error)
    notFound();
  const table = tableResponse.data as unknown as Pick<
    ResearchTableRow,
    'name' | 'description' | 'color' | 'created_at'
  >;
  const entries = (entriesResponse.data ?? []) as unknown as Pick<
    ResearchEntryRow,
    'id' | 'phrase' | 'results' | 'notes' | 'source_url' | 'created_at'
  >[];

  return (
    <main className="mx-auto w-full max-w-5xl px-6 py-12">
      <p className="text-sm font-semibold uppercase tracking-[0.2em] text-pink-400">
        Shared research report
      </p>
      <h1 className="mt-2 text-4xl font-bold">{table.name}</h1>
      {table.description && (
        <p className="mt-4 max-w-3xl text-zinc-300">{table.description}</p>
      )}
      <p className="mt-2 text-sm text-zinc-500">
        Published as a read-only snapshot view. Live owner updates appear
        automatically.
      </p>
      <div className="mt-8 space-y-5">
        {entries.map((entry) => {
          const results = Array.isArray(entry.results)
            ? (entry.results as SharedResult[])
            : [];
          return (
            <article
              key={entry.id}
              className="rounded-2xl border border-zinc-800 bg-zinc-950 p-6"
            >
              <h2
                className="text-2xl font-bold"
                style={{ color: table.color ?? '#ec4899' }}
              >
                {entry.phrase}
              </h2>
              <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
                {results.map((result) => (
                  <div
                    key={result.cipherId}
                    className="rounded-lg border border-zinc-800 p-3"
                  >
                    <p className="text-xs text-zinc-500">{result.cipherName}</p>
                    <p className="text-2xl font-bold text-pink-400">
                      {result.total}
                    </p>
                  </div>
                ))}
              </div>
              {entry.notes && (
                <p className="mt-4 whitespace-pre-wrap text-zinc-300">
                  {entry.notes}
                </p>
              )}
              {entry.source_url && (
                <a
                  href={entry.source_url}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-3 inline-block text-sm text-pink-400 hover:text-pink-300"
                >
                  Source ↗
                </a>
              )}
            </article>
          );
        })}
        {!entries.length && (
          <p className="text-zinc-500">This report has no entries yet.</p>
        )}
      </div>
    </main>
  );
}
