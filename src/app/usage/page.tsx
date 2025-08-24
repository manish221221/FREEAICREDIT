"use client";

import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Download } from "lucide-react";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, LineChart, Line, Legend } from "recharts";

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
  const [series, setSeries] = useState<{ date: string; tokens: number; costUSD: number }[]>([]);
  const [scope, setScope] = useState<string>("personal");

  const poolsForSelect = useMemo(() => {
    if (!data?.pools?.length) return [] as { value: string; label: string }[];
    return data.pools.map(p => ({ value: p.poolId, label: p.poolName }));
  }, [data]);

  useEffect(() => {
    setLoading(true);
    fetch(`/usage/summary?range=${range}`)
      .then(r => r.json())
      .then(json => setData(json))
      .finally(() => setLoading(false));
  }, [range]);

  useEffect(() => {
    const url = new URL(`/usage/timeseries`, window.location.origin);
    url.searchParams.set('range', range);
    if (scope === 'personal') {
      url.searchParams.set('scope', 'personal');
    } else {
      url.searchParams.set('scope', 'pool');
      url.searchParams.set('poolId', scope);
    }
    fetch(url.toString())
      .then(r => r.json())
      .then(json => setSeries(json.series || []))
      .catch(() => setSeries([]));
  }, [range, scope]);

  const onDownloadCsv = () => {
    const rows = [
      ['date', 'tokens', 'costUSD'],
      ...series.map(r => [r.date, String(r.tokens), String(r.costUSD)])
    ];
    const csv = rows.map(r => r.map(f => /[",\n]/.test(String(f)) ? `"${String(f).replace(/"/g, '""')}"` : String(f)).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.href = url;
    link.setAttribute('download', `usage_${scope}_${range}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

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
        <div className="flex gap-3 w-full md:w-auto">
          <div className="w-40">
            <Select value={range} onValueChange={setRange}>
              <SelectTrigger aria-label="Select range">
                <SelectValue placeholder="Range" />
              </SelectTrigger>
              <SelectContent>
                {ranges.map(r => (
                  <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="w-56">
            <Select value={scope} onValueChange={setScope}>
              <SelectTrigger aria-label="Select scope">
                <SelectValue placeholder="Scope" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="personal">My personal usage</SelectItem>
                {poolsForSelect.map(p => (
                  <SelectItem key={p.value} value={p.value}>Pool: {p.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button variant="outline" onClick={onDownloadCsv} aria-label="Download CSV">
            <Download className="h-4 w-4 mr-2" />
            CSV
          </Button>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="font-headline">My Usage</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2"><Skeleton className="h-4 w-16" /><Skeleton className="h-6 w-20" /></div>
                <div className="space-y-2"><Skeleton className="h-4 w-16" /><Skeleton className="h-6 w-24" /></div>
                <div className="space-y-2"><Skeleton className="h-4 w-24" /><Skeleton className="h-6 w-24" /></div>
                <div className="space-y-2"><Skeleton className="h-4 w-24" /><Skeleton className="h-6 w-24" /></div>
              </div>
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
              <Skeleton className="h-full w-full" />
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

      {!!data?.pools?.length && (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {data.pools.map(pool => (
            <Card key={pool.poolId}>
              <CardHeader>
                <CardTitle className="font-headline flex items-center justify-between">
                  <span>{pool.poolName}</span>
                  <span className="text-xs text-muted-foreground">{pool.role}</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <div className="text-muted-foreground">My Calls</div>
                    <div className="text-lg font-medium">{pool.memberUsage.calls}</div>
                  </div>
                  <div>
                    <div className="text-muted-foreground">Pool Calls</div>
                    <div className="text-lg font-medium">{pool.poolUsage.calls}</div>
                  </div>
                  <div>
                    <div className="text-muted-foreground">My Tokens</div>
                    <div className="text-lg font-medium">{pool.memberUsage.tokens}</div>
                  </div>
                  <div>
                    <div className="text-muted-foreground">Pool Tokens</div>
                    <div className="text-lg font-medium">{pool.poolUsage.tokens}</div>
                  </div>
                  <div>
                    <div className="text-muted-foreground">My Cost</div>
                    <div className="text-lg font-medium">${pool.memberUsage.costUSD.toFixed(3)}</div>
                  </div>
                  <div>
                    <div className="text-muted-foreground">Pool Cost</div>
                    <div className="text-lg font-medium">${pool.poolUsage.costUSD.toFixed(3)}</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="font-headline">My Usage Over Time</CardTitle>
        </CardHeader>
        <CardContent className="h-64">
          {loading ? (
            <Skeleton className="h-full w-full" />
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={series}>
                <XAxis dataKey="date" tickLine={false} axisLine={false} />
                <YAxis tickLine={false} axisLine={false} />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="tokens" stroke="#0ea5e9" name="Tokens" dot={false} />
                <Line type="monotone" dataKey="costUSD" stroke="#22c55e" name="Cost (USD)" dot={false} />
              </LineChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

