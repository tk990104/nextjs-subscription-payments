import { NextResponse } from 'next/server';
import { getGematriaSession } from '@/lib/gematria/server';

interface RouteContext {
  params: Promise<{ cipherId: string }>;
}

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export async function DELETE(_request: Request, context: RouteContext) {
  const session = await getGematriaSession();
  if (!session) {
    return NextResponse.json(
      { error: 'Authentication required.' },
      { status: 401 }
    );
  }

  const { cipherId } = await context.params;
  if (!UUID_PATTERN.test(cipherId)) {
    return NextResponse.json(
      { error: 'Custom cipher ID is invalid.' },
      { status: 400 }
    );
  }

  const { error, count } = await session.supabase
    .from('custom_ciphers')
    .delete({ count: 'exact' })
    .eq('id', cipherId)
    .eq('user_id', session.user.id);
  if (error) {
    return NextResponse.json(
      { error: 'Unable to delete custom cipher.' },
      { status: 500 }
    );
  }
  if (!count) {
    return NextResponse.json(
      { error: 'Custom cipher not found.' },
      { status: 404 }
    );
  }
  return new NextResponse(null, { status: 204 });
}
