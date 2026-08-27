import { NextResponse } from 'next/server';
import {
  createGematriaAdminClient,
  getGematriaSession,
  getUserCalculationCiphers
} from '@/lib/gematria/server';
import {
  GematriaValidationError,
  parseCipherPreferencesInput
} from '@/lib/gematria/validation';

export async function PUT(request: Request) {
  try {
    const session = await getGematriaSession();
    if (!session) {
      return NextResponse.json(
        { error: 'Authentication required.' },
        { status: 401 }
      );
    }
    if (!session.plan.features.savedPreferences) {
      return NextResponse.json(
        { error: 'Saved preferences are not included in your plan.' },
        { status: 403 }
      );
    }

    const ciphers = await getUserCalculationCiphers(
      session.supabase,
      session.plan.features.customCiphers
    );
    const allowedIds = new Set(ciphers.map((cipher) => cipher.id));
    const { cipherIds } = parseCipherPreferencesInput(
      await request.json(),
      allowedIds
    );
    const admin = createGematriaAdminClient();
    const { data, error } = await admin.rpc('save_cipher_preferences', {
      p_user_id: session.user.id,
      p_cipher_ids: cipherIds
    });
    if (error) throw error;
    return NextResponse.json({ cipherIds: data });
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
    console.error('Unable to save cipher preferences.', error);
    return NextResponse.json(
      { error: 'Unable to save cipher preferences.' },
      { status: 500 }
    );
  }
}
