import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

type Range = 'today' | 'week' | 'month' | 'all';

function getDateLowerBound(range: Range): Date | undefined {
  const now = new Date();
  switch (range) {
    case 'today': {
      const d = new Date(now);
      d.setHours(0, 0, 0, 0);
      return d;
    }
    case 'week': {
      const d = new Date(now);
      d.setDate(d.getDate() - 7);
      return d;
    }
    case 'month': {
      const d = new Date(now);
      d.setMonth(d.getMonth() - 1);
      return d;
    }
    default:
      return undefined;
  }
}

function getUserIdFromRequest(req: Request): string {
  // Expect an auth layer to inject user; fallback to header for demos
  const headerUser = req.headers.get('x-user-id');
  return headerUser || 'demo-user';
}

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const rangeParam = (url.searchParams.get('range') as Range) || 'all';
    const gte = getDateLowerBound(rangeParam);
    const userId = getUserIdFromRequest(req);

    // Personal usage (not through pools)
    const personal = await db.usageEvent.aggregate({
      where: { userId, poolId: null, status: 'success', createdAt: gte ? { gte } : undefined },
      _sum: { promptTokens: true, completionTokens: true, costUSD: true },
      _count: true,
    });

    // Pool memberships (show summary per pool)
    const poolMemberships = await db.poolMember.findMany({
      where: { userId, active: true },
      include: { pool: true },
    });

    const pools = await Promise.all(
      poolMemberships.map(async pm => {
        const poolAgg = await db.usageEvent.aggregate({
          where: { poolId: pm.poolId, status: 'success', createdAt: gte ? { gte } : undefined },
          _sum: { promptTokens: true, completionTokens: true, costUSD: true },
          _count: true,
        });

        const memberAgg = await db.usageEvent.aggregate({
          where: { poolId: pm.poolId, userId, status: 'success', createdAt: gte ? { gte } : undefined },
          _sum: { promptTokens: true, completionTokens: true, costUSD: true },
          _count: true,
        });

        return {
          poolId: pm.poolId,
          poolName: pm.pool.name,
          role: pm.role,
          memberUsage: {
            calls: memberAgg._count,
            tokens: (memberAgg._sum.promptTokens || 0) + (memberAgg._sum.completionTokens || 0),
            costUSD: memberAgg._sum.costUSD || 0,
          },
          poolUsage: {
            calls: poolAgg._count,
            tokens: (poolAgg._sum.promptTokens || 0) + (poolAgg._sum.completionTokens || 0),
            costUSD: poolAgg._sum.costUSD || 0,
          },
        };
      })
    );

    return NextResponse.json({
      personal: {
        calls: personal._count,
        tokens: (personal._sum.promptTokens || 0) + (personal._sum.completionTokens || 0),
        costUSD: personal._sum.costUSD || 0,
      },
      pools,
    });
  } catch (err: any) {
    // eslint-disable-next-line no-console
    console.error(err);
    return NextResponse.json({ error: err?.message || 'Internal Server Error' }, { status: 500 });
  }
}

