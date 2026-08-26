import { NextResponse } from 'next/server';
import { calculateWithCiphers, CORE_CIPHERS } from '@/lib/gematria';
import {
  createGematriaAdminClient,
  getGematriaSession,
  toJson
} from '@/lib/gematria/server';
import {
  GematriaValidationError,
  parseResearchEntryInput
} from '@/lib/gematria/validation';

interface RouteContext {
  params: Promise<{ tableId: string }>;
}

export async function POST(request: Request, context: RouteContext) {
  try {
    const session = await getGematriaSession();
    if (!session) {
      return NextResponse.json(
        { error: 'Authentication required.' },
        { status: 401 }
      );
    }
    if (!session.plan.features.customTables) {
      return NextResponse.json(
        { error: 'Research tables require a Researcher plan or higher.' },
        { status: 403 }
      );
    }

    const { tableId } = await context.params;
    if (
      !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
        tableId
      )
    ) {
      return NextResponse.json(
        { error: 'Research table ID is invalid.' },
        { status: 400 }
      );
    }
    const input = parseResearchEntryInput(await request.json());
    const results = calculateWithCiphers(input.phrase, CORE_CIPHERS);
    const admin = createGematriaAdminClient();
    const { data, error } = await admin.rpc('add_research_entry', {
      p_user_id: session.user.id,
      p_table_id: tableId,
      p_phrase: input.phrase,
      p_results: toJson(results),
      p_notes: input.notes,
      p_source_url: input.sourceUrl
    });
    if (error) {
      if (error.message.includes('Research table not found')) {
        return NextResponse.json(
          { error: 'Research table not found.' },
          { status: 404 }
        );
      }
      throw error;
    }

    return NextResponse.json(
      {
        entry: {
          id: data?.[0]?.id,
          table_id: tableId,
          phrase: input.phrase,
          notes: input.notes,
          source_url: input.sourceUrl,
          results,
          created_at: data?.[0]?.created_at
        }
      },
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof SyntaxError) {
      return NextResponse.json(
        { error: 'Malformed JSON body.' },
        { status: 400 }
      );
    }
    if (error instanceof GematriaValidationError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    console.error('Unable to add research entry.', error);
    return NextResponse.json(
      { error: 'Unable to add research entry.' },
      { status: 500 }
    );
  }
}
