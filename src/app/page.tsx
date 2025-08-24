"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { ApiKeyForm } from "@/components/api-key-form";
import { useKeys } from "@/hooks/use-keys";
import { providers } from "@/lib/providers";
import { ApiKeyList } from "@/components/api-key-list";
import { PlusCircle, KeyRound, CheckCircle, TrendingUp, Activity } from "lucide-react";
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip } from "recharts";

export default function DashboardPage() {
  const { keys } = useKeys();
  const [isAddKeyOpen, setAddKeyOpen] = useState(false);
  const [summary, setSummary] = useState<any>(null);
  const [series, setSeries] = useState<any[]>([]);
  const [recent, setRecent] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      fetch('/usage/summary?range=week').then(r => r.json()).catch(() => null),
      fetch('/usage/timeseries?range=week&scope=personal').then(r => r.json()).catch(() => ({ series: [] })),
      fetch('/usage/recent?limit=8').then(r => r.json()).catch(() => ({ events: [] })),
    ])
    .then(([s, ts, rec]) => {
      setSummary(s);
      setSeries(ts?.series || []);
      setRecent(rec?.events || []);
    })
    .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-headline font-bold tracking-tight">
            Dashboard
          </h1>
          <p className="text-muted-foreground">
            Manage your provider keys and monitor their status.
          </p>
        </div>
        <Dialog open={isAddKeyOpen} onOpenChange={setAddKeyOpen}>
          <DialogTrigger asChild>
            <Button>
              <PlusCircle className="mr-2 h-4 w-4" />
              Add API Key
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle className="font-headline">Add New API Key</DialogTitle>
            </DialogHeader>
            <ApiKeyForm
              onSuccess={() => setAddKeyOpen(false)}
              onCancel={() => setAddKeyOpen(false)}
            />
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {providers.map((provider) => {
          const providerKeys = keys.filter(
            (key) => key.providerId === provider.id
          );
          const activeKeys = providerKeys.filter(
            (key) => key.status === "active"
          );
          return (
            <Card key={provider.id}>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-lg font-headline font-medium">
                  {provider.name}
                </CardTitle>
                <provider.icon className="h-6 w-6 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-4 text-sm">
                  <div className="flex items-center gap-2">
                    <KeyRound className="h-4 w-4 text-muted-foreground" />
                    <span>{providerKeys.length} Keys</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span>{activeKeys.length} Active</span>
                  </div>
                </div>
                 <p className="text-xs text-muted-foreground mt-2">{provider.description}</p>
              </CardContent>
              <CardFooter>
                 <Dialog>
                    <DialogTrigger asChild>
                      <Button variant="outline" size="sm" className="w-full">View Keys</Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-3xl">
                      <DialogHeader>
                        <DialogTitle className="font-headline">{provider.name} Keys</DialogTitle>
                      </DialogHeader>
                      <ApiKeyList providerId={provider.id} />
                    </DialogContent>
                  </Dialog>
              </CardFooter>
            </Card>
          );
        })}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="font-headline flex items-center gap-2"><TrendingUp className="h-5 w-5" /> Personal Tokens (7 days)</CardTitle>
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
                  <Line type="monotone" dataKey="tokens" stroke="#0ea5e9" name="Tokens" dot={false} />
                </LineChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="font-headline flex items-center gap-2"><Activity className="h-5 w-5" /> KPIs</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-4 text-sm">
            {loading ? (
              <>
                <Skeleton className="h-14" />
                <Skeleton className="h-14" />
                <Skeleton className="h-14" />
                <Skeleton className="h-14" />
              </>
            ) : (
              <>
                <div>
                  <div className="text-muted-foreground">Calls</div>
                  <div className="text-lg font-medium">{summary?.personal?.calls ?? 0}</div>
                </div>
                <div>
                  <div className="text-muted-foreground">Tokens</div>
                  <div className="text-lg font-medium">{summary?.personal?.tokens ?? 0}</div>
                </div>
                <div>
                  <div className="text-muted-foreground">Cost (USD)</div>
                  <div className="text-lg font-medium">${(summary?.personal?.costUSD ?? 0).toFixed(3)}</div>
                </div>
                <div>
                  <div className="text-muted-foreground">Avg Latency</div>
                  <div className="text-lg font-medium">{Math.round(summary?.personal?.avgLatencyMs ?? 0)} ms</div>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="font-headline">Recent Activity</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="grid gap-2">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-8" />
              ))}
            </div>
          ) : (
            <div className="divide-y">
              {recent.map((e) => (
                <div key={e.id} className="py-2 flex items-center justify-between text-sm">
                  <div className="flex items-center gap-3">
                    <span className={`h-2.5 w-2.5 rounded-full ${e.status === 'success' ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                    <span className="text-muted-foreground">{new Date(e.createdAt).toLocaleString()}</span>
                  </div>
                  <div className="flex items-center gap-6">
                    <span>{e.tokens} tokens</span>
                    <span>${e.costUSD.toFixed(3)}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <div>
        <h2 className="text-2xl font-headline font-bold tracking-tight mb-4">
          All API Keys
        </h2>
        <Card>
          <CardContent className="p-0">
             <ApiKeyList />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
