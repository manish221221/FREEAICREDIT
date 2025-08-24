import { NextResponse } from 'next/server';
import { getUsageEventsByDay } from '@/lib/db';

type Range = 'today' | 'week' | 'month' | 'all';

function getRangeBounds(range: Range): { from?: Date; to?: Date } {
  const now = new Date();
  switch (range) {
    case 'today': {
      const from = new Date(now);
      from.setHours(0, 0, 0, 0);
      return { from };
    }
    case 'week': {
      const from = new Date(now);
      from.setDate(from.getDate() - 7);
      return { from };
    }
    case 'month': {
      const from = new Date(now);
      from.setMonth(from.getMonth() - 1);
      return { from };
    }
    default:
      return {};
  }
}

function getUserIdFromRequest(req: Request): string {
  const headerUser = req.headers.get('x-user-id');
  return headerUser || 'demo-user';
}

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const range = (url.searchParams.get('range') as Range) || 'week';
    const scope = url.searchParams.get('scope') || 'personal'; // 'personal' | 'pool'
    const poolId = url.searchParams.get('poolId') || undefined;
    const userId = getUserIdFromRequest(req);
    const { from, to } = getRangeBounds(range);

    const params = scope === 'pool' ? { poolId: poolId ?? undefined, from, to } : { userId, from, to };
    const series = await getUsageEventsByDay(params);

    return NextResponse.json({ series });
  } catch (err: any) {
    // eslint-disable-next-line no-console
    console.error(err);
    return NextResponse.json({ error: err?.message || 'Internal Server Error' }, { status: 500 });
  }
}

