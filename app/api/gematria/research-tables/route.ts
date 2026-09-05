import { NextResponse } from 'next/server';
import {
  createGematriaAdminClient,
  getGematriaSession
} from '@/lib/gematria/server';
import {
  GematriaValidationError,
  parseResearchTableInput
} from '@/lib/gematria/validation';

export async function GET() {
  const session = await getGematriaSession();
  if (!session) {
    return NextResponse.json(
      { error: 'Authentication required.' },
      { status: 401 }
    );
  }

  const { data, error } = await session.supabase
    .from('research_tables')
    .select('*')
    .order('updated_at', { ascending: false });
  if (error) {
    return NextResponse.json(
      { error: 'Unable to load research tables.' },
      { status: 500 }
    );
  }
  return NextResponse.json({ tables: data });
}

export async function POST(request: Request) {
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

    const input = parseResearchTableInput(await request.json());
    const admin = createGematriaAdminClient();
    const { data, error } = await admin.rpc(
      'create_research_table_with_limit',
      {
        p_user_id: session.user.id,
        p_name: input.name,
        p_description: input.description,
        p_color: input.color,
        p_limit: session.plan.limits.customTables
      }
    );
    if (error) {
      if (error.code === '23505') {
        return NextResponse.json(
          { error: 'A research table with that name already exists.' },
          { status: 409 }
        );
      }
      throw error;
    }

    const created = data?.[0];
    if (!created?.allowed || !created.id || !created.created_at) {
      return NextResponse.json(
        {
          error: `Your ${session.plan.label} plan research-table limit has been reached.`,
          limit: session.plan.limits.customTables
        },
        { status: 409 }
      );
    }

    return NextResponse.json(
      {
        table: {
          id: created.id,
          name: input.name,
          description: input.description,
          color: input.color,
          created_at: created.created_at,
          updated_at: created.created_at,
          entry_count: 0
        },
        count: created.table_count,
        limit: session.plan.limits.customTables
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
    console.error('Unable to create research table.', error);
    return NextResponse.json(
      { error: 'Unable to create research table.' },
      { status: 500 }
    );
  }
}
