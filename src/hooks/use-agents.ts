"use client";

import useLocalStorage from './use-local-storage';
import type { Agent } from '@/lib/types';
import { v4 as uuidv4 } from 'uuid';

const initialAgents: Agent[] = [
    {
        id: '1',
        name: 'Summarize & Share',
        description: 'Generates a summary of today\'s news and allows you to share it.',
        permissions: ["share", "notification"],
        steps: [
            { type: 'llm', args: { prompt: "Summarize today's top 3 news stories in a single paragraph." } },
            { type: 'share', args: {} }
        ]
    },
    {
        id: '2',
        name: 'Daily Briefing',
        description: 'Generates a daily briefing and shows it as a notification.',
        permissions: ["notification"],
        steps: [
            { type: 'llm', args: { prompt: 'Provide a brief summary of today\'s top news headlines.' } },
            { type: 'notification', args: {} }
        ]
    }
];


export function useAgents() {
  const [agents, setAgents] = useLocalStorage<Agent[]>('agents', initialAgents);

  const addAgent = (newAgentData: Omit<Agent, 'id'>) => {
    const agentWithId: Agent = {
      ...newAgentData,
      id: uuidv4(),
    };
    setAgents([...agents, agentWithId]);
  };

  const updateAgent = (updatedAgent: Agent) => {
    setAgents(agents.map((agent) => (agent.id === updatedAgent.id ? updatedAgent : agent)));
  };

  const deleteAgent = (agentId: string) => {
    setAgents(agents.filter((agent) => agent.id !== agentId));
  };

  const getAgent = (agentId: string) => {
    return agents.find((agent) => agent.id === agentId);
  }

  return { agents, addAgent, updateAgent, deleteAgent, getAgent };
}
