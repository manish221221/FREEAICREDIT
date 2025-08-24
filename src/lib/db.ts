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
};

type AggregateResult = {
  _sum: { promptTokens: number | null; completionTokens: number | null; costUSD: number | null };
  _count: number;
};

// In-memory stores (empty by default). Swap out for real DB queries.
const usageEvents: UsageEvent[] = [];
const poolMembers: PoolMember[] = [];

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
      const rows = usageEvents.filter(ev => matchesWhere(ev as any, args.where));
      const sumPrompt = rows.reduce((a, b) => a + (b.promptTokens || 0), 0);
      const sumCompletion = rows.reduce((a, b) => a + (b.completionTokens || 0), 0);
      const sumCost = rows.reduce((a, b) => a + (b.costUSD || 0), 0);
      return {
        _sum: {
          promptTokens: args._sum?.promptTokens ? sumPrompt : null,
          completionTokens: args._sum?.completionTokens ? sumCompletion : null,
          costUSD: args._sum?.costUSD ? sumCost : null,
        },
        _count: args._count ? rows.length : 0,
      };
    },
  },
  poolMember: {
    async findMany({ where, include }: { where: { userId?: string; active?: boolean }; include?: { pool?: boolean } }): Promise<PoolMember[]> {
      const rows = poolMembers.filter(pm => {
        if (where.userId !== undefined && pm.userId !== where.userId) return false;
        if (where.active !== undefined && pm.active !== where.active) return false;
        return true;
      });
      // include.pool is always true in our usage; our store already nests pool
      return rows.map(r => ({ ...r }));
    },
  },
};

export type { AggregateArgs, AggregateResult };

