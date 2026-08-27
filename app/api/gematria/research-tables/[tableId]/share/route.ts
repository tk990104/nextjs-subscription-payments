import { NextResponse } from 'next/server';
import {
  createGematriaAdminClient,
  getGematriaSession
} from '@/lib/gematria/server';

interface RouteContext {
  params: Promise<{ tableId: string }>;
}

function validUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value
  );
}

export async function POST(request: Request, context: RouteContext) {
  const session = await getGematriaSession();
  if (!session)
    return NextResponse.json(
      { error: 'Authentication required.' },
      { status: 401 }
    );
  if (!session.plan.features.shareReports) {
    return NextResponse.json(
      { error: 'Shareable reports are not included in your plan.' },
      { status: 403 }
    );
  }
  const { tableId } = await context.params;
  if (!validUuid(tableId))
    return NextResponse.json(
      { error: 'Research table ID is invalid.' },
      { status: 400 }
    );
  const admin = createGematriaAdminClient();
  const { data, error } = await admin.rpc('create_research_share', {
    p_user_id: session.user.id,
    p_table_id: tableId
  });
  if (error) {
    if (error.message.includes('Research table not found')) {
      return NextResponse.json(
        { error: 'Research table not found.' },
        { status: 404 }
      );
    }
    return NextResponse.json(
      { error: 'Unable to create share link.' },
      { status: 500 }
    );
  }
  const token = data?.[0]?.token;
  return NextResponse.json({
    url: `${new URL(request.url).origin}/share/${token}`,
    token
  });
}

export async function DELETE(_request: Request, context: RouteContext) {
  const session = await getGematriaSession();
  if (!session)
    return NextResponse.json(
      { error: 'Authentication required.' },
      { status: 401 }
    );
  const { tableId } = await context.params;
  if (!validUuid(tableId))
    return NextResponse.json(
      { error: 'Research table ID is invalid.' },
      { status: 400 }
    );
  const admin = createGematriaAdminClient();
  const { data, error } = await admin.rpc('delete_research_share', {
    p_user_id: session.user.id,
    p_table_id: tableId
  });
  if (error)
    return NextResponse.json(
      { error: 'Unable to revoke share link.' },
      { status: 500 }
    );
  return NextResponse.json({ revoked: data });
}
