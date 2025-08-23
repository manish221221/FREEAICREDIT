"use client";

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { useAgents } from '@/hooks/use-agents';
import { AgentCard } from '@/components/agent-card';
import { PlusCircle } from 'lucide-react';

export default function AgentsPage() {
  const { agents } = useAgents();

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-headline font-bold tracking-tight">Mini-Agents</h1>
          <p className="text-muted-foreground">
            Create and run automated task flows on your device.
          </p>
        </div>
        <Link href="/agents/editor">
          <Button>
            <PlusCircle className="mr-2 h-4 w-4" />
            New Agent
          </Button>
        </Link>
      </div>
      
      {agents.length > 0 ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {agents.map((agent) => (
            <AgentCard key={agent.id} agent={agent} />
          ))}
        </div>
      ) : (
        <div className="text-center py-16 border-2 border-dashed rounded-lg">
          <h2 className="text-xl font-semibold">No Agents Yet</h2>
          <p className="text-muted-foreground mt-2">Get started by creating your first mini-agent.</p>
          <Link href="/agents/editor">
            <Button className="mt-4">Create Agent</Button>
          </Link>
        </div>
      )}
    </div>
  );
}
