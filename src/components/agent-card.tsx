
"use client";

import Link from 'next/link';
import type { Agent } from '@/lib/types';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Play, Edit, Trash2, Bot, Loader } from 'lucide-react';
import { useAgents } from '@/hooks/use-agents';
import { executeAgent, type AgentDefinition, type AgentContext } from '@/ai/flows/mini-agent-execution';
import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

export function AgentCard({ agent }: { agent: Agent }) {
  const { deleteAgent } = useAgents();
  const [isRunning, setIsRunning] = useState(false);
  const { toast } = useToast();

  const handleClientSideActions = (result: AgentContext) => {
    if (result.clipboardContent) {
      navigator.clipboard.writeText(String(result.clipboardContent));
      toast({ title: "Copied to clipboard" });
    }
    if (result.notification) {
      new Notification(result.notification.title, { body: result.notification.body });
    }
    if (result.share) {
      if (navigator.share) {
        navigator.share(result.share);
      } else {
        toast({ variant: 'destructive', title: 'Share not supported', description: 'Your browser does not support the Web Share API.' });
      }
    }
  };

  const requestPermissions = async () => {
    if (agent.permissions.includes('notification')) {
        const permission = await Notification.requestPermission();
        if (permission !== 'granted') {
            toast({ variant: 'destructive', title: 'Permission Denied', description: 'Notification permission is required to run this agent.' });
            return false;
        }
    }
    return true;
  }

  const handleRun = async () => {
    setIsRunning(true);
    
    const permissionsGranted = await requestPermissions();
    if (!permissionsGranted) {
        setIsRunning(false);
        return;
    }

    try {
      const agentDefinition: AgentDefinition = {
        name: agent.name,
        steps: agent.steps,
        permissions: agent.permissions,
      };
      const result = await executeAgent(agentDefinition);
      
      handleClientSideActions(result);

      toast({
          title: "Agent Executed",
          description: `"${agent.name}" ran successfully.`,
      });

    } catch (error) {
      console.error('Failed to run agent', error);
      toast({
        variant: "destructive",
        title: "Agent Execution Failed",
        description: String(error),
      });
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <Card className="flex flex-col">
      <CardHeader className="flex-row items-start gap-4">
        <div className="p-2 bg-primary/10 rounded-lg">
            <Bot className="w-6 h-6 text-primary" />
        </div>
        <div>
          <CardTitle className="font-headline">{agent.name}</CardTitle>
          <CardDescription>{agent.description}</CardDescription>
        </div>
      </CardHeader>
      <CardContent className="flex-grow">
        <div className="flex flex-wrap gap-2">
          {agent.permissions.map((p) => (
            <Badge key={p} variant="secondary">
              {p}
            </Badge>
          ))}
        </div>
      </CardContent>
      <CardFooter className="flex justify-between">
        <Button onClick={handleRun} disabled={isRunning}>
          {isRunning ? <Loader className="mr-2 h-4 w-4 animate-spin" /> : <Play className="mr-2 h-4 w-4" />}
          Run
        </Button>
        <div className="flex gap-2">
            <Link href={`/agents/editor?id=${agent.id}`}>
                <Button variant="ghost" size="icon">
                    <Edit className="h-4 w-4" />
                </Button>
            </Link>
            <AlertDialog>
                <AlertDialogTrigger asChild>
                    <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive">
                        <Trash2 className="h-4 w-4" />
                    </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                    <AlertDialogHeader>
                    <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                    <AlertDialogDescription>
                        This action cannot be undone. This will permanently delete the agent "{agent.name}".
                    </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={() => deleteAgent(agent.id)} className="bg-destructive hover:bg-destructive/90">Delete</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
      </CardFooter>
    </Card>
  );
}
