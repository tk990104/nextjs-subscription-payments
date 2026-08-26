import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import ResearchWorkspace from '@/components/gematria/ResearchWorkspace';
import { PLAN_ENTITLEMENTS, planFromProductMetadata } from '@/lib/entitlements';
import type { ResearchEntryRow, ResearchTableRow } from '@/types_gematria';
import { getSubscription, getUser } from '@/utils/supabase/queries';
import { createClient } from '@/utils/supabase/server';

export const metadata: Metadata = {
  title: 'Research Workspace | Gematria Research Platform',
  description: 'Organize gematria findings into saved research tables.'
};

export default async function ResearchPage() {
  const supabase = await createClient();
  const user = await getUser(supabase);
  if (!user) redirect('/signin');

  const [subscription, tablesResponse, entriesResponse] = await Promise.all([
    getSubscription(supabase),
    supabase
      .from('research_tables')
      .select('id, name, description, color, created_at, updated_at')
      .order('updated_at', { ascending: false }),
    supabase.from('research_entries').select('table_id')
  ]);
  const planId = planFromProductMetadata(
    subscription?.prices?.products?.metadata
  );
  const entryCounts = new Map<string, number>();
  const entries = (entriesResponse.data ?? []) as unknown as Pick<
    ResearchEntryRow,
    'table_id'
  >[];
  for (const entry of entries) {
    entryCounts.set(entry.table_id, (entryCounts.get(entry.table_id) ?? 0) + 1);
  }
  const tableRows = (tablesResponse.data ??
    []) as unknown as ResearchTableRow[];
  const tables = tableRows.map((table) => ({
    ...table,
    entry_count: entryCounts.get(table.id) ?? 0
  }));

  return (
    <ResearchWorkspace
      plan={PLAN_ENTITLEMENTS[planId]}
      initialTables={tables}
    />
  );
}
