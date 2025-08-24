"use client";

import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip } from "recharts";

type Summary = {
  personal: { calls: number; tokens: number; costUSD: number; avgLatencyMs?: number };
  pools: { poolId: string; poolName: string; role: string; memberUsage: { calls: number; tokens: number; costUSD: number; avgLatencyMs?: number }; poolUsage: { calls: number; tokens: number; costUSD: number; avgLatencyMs?: number } }[];
};

const ranges = [
  { value: "today", label: "Today" },
  { value: "week", label: "Last 7 days" },
  { value: "month", label: "Last 30 days" },
  { value: "all", label: "All time" },
] as const;

export default function UsagePage() {
  const [range, setRange] = useState<string>("week");
  const [data, setData] = useState<Summary | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  useEffect(() => {
    setLoading(true);
    fetch(`/usage/summary?range=${range}`)
      .then(r => r.json())
      .then(json => setData(json))
      .finally(() => setLoading(false));
  }, [range]);

  const poolChartData = useMemo(() => {
    if (!data) return [] as any[];
    return data.pools.map(p => ({
      name: p.poolName,
      totalTokens: p.poolUsage.tokens,
      myTokens: p.memberUsage.tokens,
      totalCostUSD: p.poolUsage.costUSD,
      myCostUSD: p.memberUsage.costUSD,
    }));
  }, [data]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-headline font-bold tracking-tight">Usage</h1>
          <p className="text-muted-foreground">Tokens, cost and latency across your account and pools.</p>
        </div>
        <div className="w-48">
          <Select value={range} onValueChange={setRange}>
            <SelectTrigger>
              <SelectValue placeholder="Range" />
            </SelectTrigger>
            <SelectContent>
              {ranges.map(r => (
                <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="font-headline">My Usage</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-sm text-muted-foreground">Loading…</div>
            ) : (
              <div className="text-sm grid grid-cols-2 gap-3">
                <div>
                  <div className="text-muted-foreground">Calls</div>
                  <div className="text-lg font-medium">{data?.personal.calls ?? 0}</div>
                </div>
                <div>
                  <div className="text-muted-foreground">Tokens</div>
                  <div className="text-lg font-medium">{data?.personal.tokens ?? 0}</div>
                </div>
                <div>
                  <div className="text-muted-foreground">Cost (USD)</div>
                  <div className="text-lg font-medium">${(data?.personal.costUSD ?? 0).toFixed(3)}</div>
                </div>
                <div>
                  <div className="text-muted-foreground">Avg Latency</div>
                  <div className="text-lg font-medium">{Math.round(data?.personal.avgLatencyMs ?? 0)} ms</div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="font-headline">Pools (Tokens)</CardTitle>
          </CardHeader>
          <CardContent className="h-64">
            {loading ? (
              <div className="text-sm text-muted-foreground">Loading…</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={poolChartData}>
                  <XAxis dataKey="name" tickLine={false} axisLine={false} />
                  <YAxis tickLine={false} axisLine={false} />
                  <Tooltip />
                  <Bar dataKey="totalTokens" fill="#94a3b8" name="Pool tokens" />
                  <Bar dataKey="myTokens" fill="#0ea5e9" name="My tokens" />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="font-headline">Pools (Cost USD)</CardTitle>
        </CardHeader>
        <CardContent className="h-64">
          {loading ? (
            <div className="text-sm text-muted-foreground">Loading…</div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={poolChartData}>
                <XAxis dataKey="name" tickLine={false} axisLine={false} />
                <YAxis tickLine={false} axisLine={false} />
                <Tooltip />
                <Bar dataKey="totalCostUSD" fill="#94a3b8" name="Pool cost" />
                <Bar dataKey="myCostUSD" fill="#22c55e" name="My cost" />
              </BarChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

