// Lightweight DB facade with minimal types to allow aggregation calls used by usage summary.
// Replace with a real client (e.g., Prisma) by matching the method signatures below.

export type UsageEvent = {
  id: string;
  userId: string;
  poolId: string | null;
  status: 'success' | 'error';
  promptTokens: number;
  completionTokens: number;
  costUSD: number;
  latencyMs?: number;
  createdAt: Date;
};

export type Pool = {
  id: string;
  name: string;
};

export type PoolMember = {
  id: string;
  userId: string;
  poolId: string;
  role: 'member' | 'admin';
  active: boolean;
  pool: Pool;
};

type AggregateWhere = {
  userId?: string;
  poolId?: string | null;
  status?: 'success' | 'error';
  createdAt?: { gte?: Date; lte?: Date };
};

type AggregateArgs = {
  where?: AggregateWhere;
  _sum?: { promptTokens?: true; completionTokens?: true; costUSD?: true };
  _count?: true;
  _avg?: { latencyMs?: true };
};

type AggregateResult = {
  _sum: { promptTokens: number | null; completionTokens: number | null; costUSD: number | null };
  _count: number;
  _avg: { latencyMs: number | null };
};

// In-memory stores (empty by default). Swap out for real DB queries.
const usageEvents: UsageEvent[] = [];
const poolMembers: PoolMember[] = [];

let prismaSingleton: any | null = null;
async function getPrisma(): Promise<any | null> {
  if (prismaSingleton !== null) return prismaSingleton;
  try {
    // Dynamic import to avoid hard dependency when not installed
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const mod: any = await import('@prisma/client');
    prismaSingleton = new mod.PrismaClient();
    return prismaSingleton;
  } catch {
    prismaSingleton = null;
    return null;
  }
}

function matchesWhere<T extends { [k: string]: any }>(item: T, where?: AggregateWhere): boolean {
  if (!where) return true;
  if (where.userId !== undefined && item.userId !== where.userId) return false;
  if (where.poolId !== undefined && item.poolId !== where.poolId) return false;
  if (where.status !== undefined && item.status !== where.status) return false;
  if (where.createdAt) {
    if (where.createdAt.gte && !(item.createdAt >= where.createdAt.gte)) return false;
    if (where.createdAt.lte && !(item.createdAt <= where.createdAt.lte)) return false;
  }
  return true;
}

export const db = {
  usageEvent: {
    async aggregate(args: AggregateArgs): Promise<AggregateResult> {
      const prisma = await getPrisma();
      if (prisma) {
        const where: any = {};
        if (args.where?.userId !== undefined) where.userId = args.where.userId;
        if (args.where?.poolId !== undefined) where.poolId = args.where.poolId;
        if (args.where?.status !== undefined) where.status = args.where.status;
        if (args.where?.createdAt) where.createdAt = args.where.createdAt;
        const result = await prisma.usageEvent.aggregate({
          where,
          _sum: args._sum,
          _count: args._count ? { _all: true } : undefined,
          _avg: args._avg,
        });
        return {
          _sum: {
            promptTokens: args._sum?.promptTokens ? result._sum?.promptTokens ?? 0 : null,
            completionTokens: args._sum?.completionTokens ? result._sum?.completionTokens ?? 0 : null,
            costUSD: args._sum?.costUSD ? result._sum?.costUSD ?? 0 : null,
          },
          _count: args._count ? (result._count?._all ?? 0) : 0,
          _avg: { latencyMs: args._avg?.latencyMs ? (result._avg?.latencyMs ?? 0) : null },
        };
      }
      // In-memory fallback
      const rows = usageEvents.filter(ev => matchesWhere(ev as any, args.where));
      const sumPrompt = rows.reduce((a, b) => a + (b.promptTokens || 0), 0);
      const sumCompletion = rows.reduce((a, b) => a + (b.completionTokens || 0), 0);
      const sumCost = rows.reduce((a, b) => a + (b.costUSD || 0), 0);
      const latencies = rows.map(r => r.latencyMs).filter(v => typeof v === 'number') as number[];
      const avgLatency = latencies.length ? latencies.reduce((a, b) => a + b, 0) / latencies.length : 0;
      return {
        _sum: {
          promptTokens: args._sum?.promptTokens ? sumPrompt : null,
          completionTokens: args._sum?.completionTokens ? sumCompletion : null,
          costUSD: args._sum?.costUSD ? sumCost : null,
        },
        _count: args._count ? rows.length : 0,
        _avg: { latencyMs: args._avg?.latencyMs ? avgLatency : null },
      };
    },
  },
  poolMember: {
    async findMany({ where, include }: { where: { userId?: string; active?: boolean }; include?: { pool?: boolean } }): Promise<PoolMember[]> {
      const prisma = await getPrisma();
      if (prisma) {
        const rows = await prisma.poolMember.findMany({
          where: {
            userId: where.userId,
            active: where.active,
          },
          include: { pool: !!include?.pool },
        });
        return rows as any;
      }
      const rows = poolMembers.filter(pm => {
        if (where.userId !== undefined && pm.userId !== where.userId) return false;
        if (where.active !== undefined && pm.active !== where.active) return false;
        return true;
      });
      return rows.map(r => ({ ...r }));
    },
  },
};

export async function getUsageEventsByDay(params: { userId?: string; poolId?: string; from?: Date; to?: Date }): Promise<{ date: string; tokens: number; costUSD: number }[]> {
  const prisma = await getPrisma();
  const from = params.from;
  const to = params.to;
  const where: any = { status: 'success' };
  if (params.userId) where.userId = params.userId;
  if (params.poolId !== undefined) where.poolId = params.poolId;
  if (from || to) where.createdAt = { ...(from ? { gte: from } : {}), ...(to ? { lte: to } : {}) };

  if (prisma) {
    const rows = await prisma.usageEvent.findMany({ where, select: { createdAt: true, promptTokens: true, completionTokens: true, costUSD: true } });
    const map = new Map<string, { tokens: number; costUSD: number }>();
    for (const r of rows) {
      const key = r.createdAt.toISOString().slice(0, 10);
      const tokens = (r.promptTokens || 0) + (r.completionTokens || 0);
      const agg = map.get(key) || { tokens: 0, costUSD: 0 };
      agg.tokens += tokens;
      agg.costUSD += r.costUSD || 0;
      map.set(key, agg);
    }
    return Array.from(map.entries()).sort(([a], [b]) => (a < b ? -1 : 1)).map(([date, v]) => ({ date, ...v }));
  }
  // Fallback
  const rows = usageEvents.filter(ev => matchesWhere(ev as any, { userId: params.userId, poolId: params.poolId, status: 'success', createdAt: from || to ? { gte: from, lte: to } : undefined }));
  const map = new Map<string, { tokens: number; costUSD: number }>();
  for (const r of rows) {
    const key = r.createdAt.toISOString().slice(0, 10);
    const tokens = (r.promptTokens || 0) + (r.completionTokens || 0);
    const agg = map.get(key) || { tokens: 0, costUSD: 0 };
    agg.tokens += tokens;
    agg.costUSD += r.costUSD || 0;
    map.set(key, agg);
  }
  return Array.from(map.entries()).sort(([a], [b]) => (a < b ? -1 : 1)).map(([date, v]) => ({ date, ...v }));
}

export async function getRecentUsageEvents(params: { userId: string; limit?: number }): Promise<{
  id: string;
  createdAt: string;
  poolId: string | null;
  tokens: number;
  costUSD: number;
  status: 'success' | 'error' | string;
}[]> {
  const prisma = await getPrisma();
  const limit = params.limit ?? 10;
  if (prisma) {
    const rows = await prisma.usageEvent.findMany({
      where: { userId: params.userId },
      orderBy: { createdAt: 'desc' },
      take: limit,
      select: { id: true, createdAt: true, poolId: true, promptTokens: true, completionTokens: true, costUSD: true, status: true },
    });
    return rows.map((r: { id: string; createdAt: Date; poolId: string | null; promptTokens: number; completionTokens: number; costUSD: number; status: string }) => ({
      id: r.id,
      createdAt: r.createdAt.toISOString(),
      poolId: r.poolId ?? null,
      tokens: (r.promptTokens || 0) + (r.completionTokens || 0),
      costUSD: r.costUSD || 0,
      status: r.status as any,
    }));
  }
  // Fallback to in-memory
  const rows = usageEvents
    .filter(ev => ev.userId === params.userId)
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
    .slice(0, limit);
  return rows.map(r => ({
    id: r.id,
    createdAt: r.createdAt.toISOString(),
    poolId: r.poolId ?? null,
    tokens: (r.promptTokens || 0) + (r.completionTokens || 0),
    costUSD: r.costUSD || 0,
    status: r.status,
  }));
}

export type { AggregateArgs, AggregateResult };

