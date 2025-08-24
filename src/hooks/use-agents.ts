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
    },
    {
        id: '3',
        name: 'Job Application Helper',
        description: 'Turns a job post into a tailored cover letter.',
        permissions: ["clipboard", "share"],
        steps: [
            { type: 'llm', args: { prompt: 'Write a concise, friendly cover letter based on this job description: {{job_description}}. Emphasize transferable skills.' } },
            { type: 'clipboard', args: { content: '{{llmOutput}}' } },
            { type: 'share', args: { content: '{{llmOutput}}' } }
        ]
    },
    {
        id: '4',
        name: 'Study Buddy',
        description: 'Creates a study plan and key flashcards for any topic.',
        permissions: ["notification"],
        steps: [
            { type: 'llm', args: { prompt: 'Create a 5-day study plan and 10 flashcards for the topic: {{topic}}.' } },
            { type: 'notification', args: { content: 'Your study plan is ready!'} }
        ]
    },
    {
        id: '5',
        name: 'Accessibility Assistant',
        description: 'Explains content in simpler words and reads summaries aloud.',
        permissions: ["notification"],
        steps: [
            { type: 'llm', args: { prompt: 'Explain the following in simple language suitable for grade 6: {{content}}' } },
            { type: 'notification', args: { content: '{{llmOutput}}'} }
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
