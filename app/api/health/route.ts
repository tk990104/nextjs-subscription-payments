import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export function GET() {
  return NextResponse.json(
    {
      status: 'ok',
      service: 'gematria-research-platform',
      revision:
        process.env.VERCEL_GIT_COMMIT_SHA ?? process.env.GITHUB_SHA ?? 'local',
      timestamp: new Date().toISOString()
    },
    {
      headers: {
        'cache-control': 'no-store'
      }
    }
  );
}
