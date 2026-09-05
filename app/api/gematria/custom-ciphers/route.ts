import { NextResponse } from 'next/server';
import {
  createGematriaAdminClient,
  getGematriaSession,
  toJson
} from '@/lib/gematria/server';
import {
  GematriaValidationError,
  parseCustomCipherInput
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
    .from('custom_ciphers')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) {
    return NextResponse.json(
      { error: 'Unable to load custom ciphers.' },
      { status: 500 }
    );
  }
  return NextResponse.json({ ciphers: data });
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
    if (!session.plan.features.customCiphers) {
      return NextResponse.json(
        { error: 'Custom ciphers require a Researcher plan or higher.' },
        { status: 403 }
      );
    }

    const input = parseCustomCipherInput(await request.json());
    const admin = createGematriaAdminClient();
    const { data, error } = await admin.rpc('create_custom_cipher_with_limit', {
      p_user_id: session.user.id,
      p_name: input.name,
      p_description: input.description,
      p_definition: toJson(input.definition),
      p_limit: session.plan.limits.customCiphers
    });
    if (error) {
      if (error.code === '23505') {
        return NextResponse.json(
          { error: 'A custom cipher with that name already exists.' },
          { status: 409 }
        );
      }
      throw error;
    }

    const created = data?.[0];
    if (!created?.allowed || !created.id || !created.created_at) {
      return NextResponse.json(
        {
          error: `Your ${session.plan.label} plan custom-cipher limit has been reached.`,
          limit: session.plan.limits.customCiphers
        },
        { status: 409 }
      );
    }

    return NextResponse.json(
      {
        cipher: {
          id: created.id,
          name: input.name,
          description: input.description,
          definition: input.definition,
          is_enabled: true,
          created_at: created.created_at,
          updated_at: created.created_at
        },
        count: created.cipher_count,
        limit: session.plan.limits.customCiphers
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
    console.error('Unable to create custom cipher.', error);
    return NextResponse.json(
      { error: 'Unable to create custom cipher.' },
      { status: 500 }
    );
  }
}
