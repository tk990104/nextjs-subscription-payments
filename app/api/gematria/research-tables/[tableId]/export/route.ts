import { NextResponse } from 'next/server';
import { researchRowsToCsv } from '@/lib/gematria/csv';
import { getGematriaSession } from '@/lib/gematria/server';
import type { ResearchEntryRow, ResearchTableRow } from '@/types_gematria';

interface RouteContext {
  params: Promise<{ tableId: string }>;
}

export async function GET(_request: Request, context: RouteContext) {
  const session = await getGematriaSession();
  if (!session)
    return NextResponse.json(
      { error: 'Authentication required.' },
      { status: 401 }
    );
  if (!session.plan.features.researchExport) {
    return NextResponse.json(
      { error: 'Research export is not included in your plan.' },
      { status: 403 }
    );
  }
  const { tableId } = await context.params;
  const [tableResponse, entriesResponse] = await Promise.all([
    session.supabase
      .from('research_tables')
      .select('name')
      .eq('id', tableId)
      .maybeSingle(),
    session.supabase
      .from('research_entries')
      .select('phrase, notes, source_url, created_at, results')
      .eq('table_id', tableId)
      .order('created_at')
  ]);
  if (tableResponse.error || !tableResponse.data) {
    return NextResponse.json(
      { error: 'Research table not found.' },
      { status: 404 }
    );
  }
  if (entriesResponse.error) {
    return NextResponse.json(
      { error: 'Unable to export research table.' },
      { status: 500 }
    );
  }
  const table = tableResponse.data as unknown as Pick<ResearchTableRow, 'name'>;
  const entries = (entriesResponse.data ?? []) as unknown as Pick<
    ResearchEntryRow,
    'phrase' | 'notes' | 'source_url' | 'created_at' | 'results'
  >[];
  const filename =
    table.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '') || 'research';
  return new Response(researchRowsToCsv(entries), {
    headers: {
      'content-type': 'text/csv; charset=utf-8',
      'content-disposition': `attachment; filename="${filename}.csv"`
    }
  });
}
