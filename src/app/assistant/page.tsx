"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Mic, PlusCircle } from "lucide-react";
import { useAgents } from "@/hooks/use-agents";
import { AgentCard } from "@/components/agent-card";

export default function AssistantHub() {
  const [query, setQuery] = useState("");
  const { agents } = useAgents();
  const [filtered, setFiltered] = useState(agents);

  useEffect(() => {
    const q = query.toLowerCase().trim();
    if (!q) setFiltered(agents);
    else setFiltered(agents.filter(a => a.name.toLowerCase().includes(q) || a.description.toLowerCase().includes(q)));
  }, [query, agents]);

  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <h1 className="text-3xl font-headline font-bold tracking-tight">Assistant</h1>
        <p className="text-muted-foreground">Your agents, voice-first actions, and quick automations.</p>
      </header>

      <div className="flex gap-2">
        <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search agents or actions" aria-label="Search agents" />
        <Button variant="outline" size="icon" aria-label="Voice search"><Mic className="h-4 w-4" /></Button>
        <Button aria-label="Create agent"><PlusCircle className="h-4 w-4 mr-2" />New</Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="font-headline">Quick Actions</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-3">
          {[
            { label: 'Summarize Page', hint: 'Copy summary', color: 'bg-blue-600' },
            { label: 'Translate', hint: 'Spanish', color: 'bg-emerald-600' },
            { label: 'Draft Email', hint: 'Polite tone', color: 'bg-amber-600' },
            { label: 'Plan Day', hint: 'Time-block', color: 'bg-fuchsia-600' },
          ].map(a => (
            <button key={a.label} className={`rounded-lg p-4 text-left text-white ${a.color}`}>
              <div className="text-sm opacity-90">{a.hint}</div>
              <div className="text-lg font-semibold">{a.label}</div>
            </button>
          ))}
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filtered.map(agent => (
          <AgentCard key={agent.id} agent={agent} />
        ))}
      </div>
    </div>
  );
}

