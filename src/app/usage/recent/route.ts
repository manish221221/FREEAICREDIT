import { NextResponse } from 'next/server';
import { getRecentUsageEvents } from '@/lib/db';

function getUserIdFromRequest(req: Request): string {
  const headerUser = req.headers.get('x-user-id');
  return headerUser || 'demo-user';
}

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const limit = Number(url.searchParams.get('limit') || '10');
    const userId = getUserIdFromRequest(req);
    const events = await getRecentUsageEvents({ userId, limit: Math.min(Math.max(limit, 1), 50) });
    return NextResponse.json({ events });
  } catch (err: any) {
    // eslint-disable-next-line no-console
    console.error(err);
    return NextResponse.json({ error: err?.message || 'Internal Server Error' }, { status: 500 });
  }
}

