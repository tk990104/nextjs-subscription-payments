import { NextResponse } from 'next/server';
import { calculateWithCiphers } from '@/lib/gematria';
import {
  createGematriaAdminClient,
  getGematriaSession,
  getUserCalculationCiphers,
  toJson
} from '@/lib/gematria/server';
import {
  GematriaValidationError,
  parsePhraseInput
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
    .from('calculation_history')
    .select('id, phrase, created_at')
    .order('created_at', { ascending: false })
    .limit(50);

  if (error) {
    return NextResponse.json(
      { error: 'Unable to load history.' },
      { status: 500 }
    );
  }
  return NextResponse.json({ history: data });
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

    const { phrase } = parsePhraseInput(await request.json());
    const ciphers = await getUserCalculationCiphers(
      session.supabase,
      session.plan.features.customCiphers
    );
    const results = calculateWithCiphers(phrase, ciphers);
    const admin = createGematriaAdminClient();
    const { data, error } = await admin.rpc('save_calculation_with_limit', {
      p_user_id: session.user.id,
      p_phrase: phrase,
      p_results: toJson(results),
      p_limit: session.plan.limits.historyEntries
    });

    if (error) throw error;
    const saved = data?.[0];
    if (!saved?.allowed || !saved.id || !saved.created_at) {
      return NextResponse.json(
        {
          error: `Your ${session.plan.label} plan history limit has been reached.`,
          limit: session.plan.limits.historyEntries
        },
        { status: 409 }
      );
    }

    return NextResponse.json(
      {
        history: {
          id: saved.id,
          phrase,
          created_at: saved.created_at
        },
        count: saved.entry_count,
        limit: session.plan.limits.historyEntries
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
    console.error('Unable to save calculation.', error);
    return NextResponse.json(
      { error: 'Unable to save calculation.' },
      { status: 500 }
    );
  }
}
