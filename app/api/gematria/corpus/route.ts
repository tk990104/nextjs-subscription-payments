import { NextResponse } from 'next/server';
import { BUILT_IN_CIPHERS, calculateWithCiphers } from '@/lib/gematria';
import { corpusRowsToCsv, parseCorpusCsv } from '@/lib/gematria/csv';
import {
  createGematriaAdminClient,
  getGematriaSession,
  isGematriaAdmin
} from '@/lib/gematria/server';

function forbidden() {
  return NextResponse.json(
    { error: 'Corpus administrator access required.' },
    { status: 403 }
  );
}

export async function GET() {
  const session = await getGematriaSession();
  if (!session) {
    return NextResponse.json(
      { error: 'Authentication required.' },
      { status: 401 }
    );
  }
  if (!isGematriaAdmin(session.user.id)) return forbidden();

  const admin = createGematriaAdminClient();
  const { data, error } = await admin
    .from('phrase_corpus')
    .select('phrase, category, source')
    .order('phrase')
    .limit(50_000);
  if (error) {
    return NextResponse.json(
      { error: 'Unable to export corpus.' },
      { status: 500 }
    );
  }
  return new Response(corpusRowsToCsv(data), {
    headers: {
      'content-type': 'text/csv; charset=utf-8',
      'content-disposition': 'attachment; filename="gematria-corpus.csv"'
    }
  });
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
    if (!isGematriaAdmin(session.user.id)) return forbidden();

    const rows = parseCorpusCsv(await request.text());
    const admin = createGematriaAdminClient();
    const { data: phrases, error: phraseError } = await admin
      .from('phrase_corpus')
      .upsert(
        rows.map((row) => ({
          ...row,
          is_active: true
        })),
        { onConflict: 'phrase' }
      )
      .select('id, phrase');
    if (phraseError) throw phraseError;

    const phraseIds = new Map(phrases.map((row) => [row.phrase, row.id]));
    const values = rows.flatMap((row) => {
      const phraseId = phraseIds.get(row.phrase);
      if (phraseId === undefined) return [];
      return calculateWithCiphers(row.phrase, BUILT_IN_CIPHERS).map(
        (result) => ({
          phrase_id: phraseId,
          cipher_id: result.cipherId,
          value: result.total
        })
      );
    });
    const { error: valueError } = await admin
      .from('phrase_cipher_values')
      .upsert(values, { onConflict: 'phrase_id,cipher_id' });
    if (valueError) throw valueError;

    return NextResponse.json({ imported: rows.length, values: values.length });
  } catch (error) {
    if (error instanceof Error && error.message.startsWith('CSV')) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    if (
      error instanceof Error &&
      error.message.startsWith('Duplicate corpus')
    ) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    console.error('Unable to import corpus.', error);
    return NextResponse.json(
      { error: 'Unable to import corpus.' },
      { status: 500 }
    );
  }
}
