import type { LucideIcon } from 'lucide-react';

export interface Provider {
  id: string;
  name: string;
  description: string;
  icon: LucideIcon;
  models: string[];
}

export interface ApiKey {
  id: string;
  providerId: string;
  label: string;
  key: string;
  priority: number;
  status: 'active' | 'inactive';
  createdAt: string;
}

export interface AgentStep {
  type: 'llm' | 'clipboard' | 'notification' | 'share' | 'pick_file' | 'extract';
  args?: Record<string, any>;
}

export interface Agent {
  id: string;
  name: string;
  description: string;
  permissions: string[];
  steps: AgentStep[];
}
