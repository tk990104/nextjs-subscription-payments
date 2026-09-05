import { NextResponse } from 'next/server';
import {
  createGematriaAdminClient,
  getGematriaSession
} from '@/lib/gematria/server';
import {
  GematriaValidationError,
  parseMatchInput
} from '@/lib/gematria/validation';

export async function POST(request: Request) {
  try {
    const session = await getGematriaSession();
    if (!session) {
      return NextResponse.json(
        { error: 'Sign in to search the phrase corpus.' },
        { status: 401 }
      );
    }
    if (!session.plan.features.databaseMatch) {
      return NextResponse.json(
        { error: 'Database matching is not included in your plan.' },
        { status: 403 }
      );
    }

    const { cipherId, value } = parseMatchInput(await request.json());
    const admin = createGematriaAdminClient();
    const dailyLimit = session.plan.limits.databaseMatchesPerDay;
    const { data: usageCount, error: usageError } = await admin.rpc(
      'consume_daily_usage',
      {
        p_user_id: session.user.id,
        p_usage_kind: 'database_match',
        p_limit: dailyLimit
      }
    );

    if (usageError) throw usageError;
    if (usageCount === -1) {
      return NextResponse.json(
        {
          error: `Your ${session.plan.label} plan daily match limit has been reached.`,
          limit: dailyLimit
        },
        { status: 429 }
      );
    }

    const { data: values, error: valueError } = await admin
      .from('phrase_cipher_values')
      .select('phrase_id')
      .eq('cipher_id', cipherId)
      .eq('value', value)
      .limit(50);
    if (valueError) throw valueError;

    const phraseIds = values.map((item) => item.phrase_id);
    const { data: phrases, error: phraseError } = phraseIds.length
      ? await admin
          .from('phrase_corpus')
          .select('id, phrase, category, source')
          .in('id', phraseIds)
          .eq('is_active', true)
      : { data: [], error: null };
    if (phraseError) throw phraseError;

    return NextResponse.json({
      matches: phrases,
      usage: {
        count: usageCount,
        limit: dailyLimit,
        remaining:
          dailyLimit === null ? null : Math.max(0, dailyLimit - usageCount)
      }
    });
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
    console.error('Unable to search phrase corpus.', error);
    return NextResponse.json(
      { error: 'Unable to search the phrase corpus.' },
      { status: 500 }
    );
  }
}
