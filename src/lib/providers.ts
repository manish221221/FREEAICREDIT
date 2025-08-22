import type { Provider } from './types';
import { BrainCircuit, Bot, Sparkles } from 'lucide-react';

export const providers: Provider[] = [
  {
    id: 'openai',
    name: 'OpenAI',
    description: 'Models from OpenAI, including the GPT series for powerful text generation and analysis.',
    icon: BrainCircuit,
    models: ['gpt-4o-mini', 'gpt-4o', 'gpt-4-turbo', 'gpt-3.5-turbo'],
  },
  {
    id: 'anthropic',
    name: 'Anthropic',
    description: 'Claude models, known for their focus on AI safety and constitutional AI principles.',
    icon: Bot,
    models: ['claude-3-opus-20240229', 'claude-3-sonnet-20240229', 'claude-3-haiku-20240307'],
  },
  {
    id: 'google',
    name: 'Google AI',
    description: 'Gemini models offering a balance of performance and cost for various applications.',
    icon: Sparkles,
    models: ['gemini-1.5-pro-latest', 'gemini-1.5-flash-latest', 'gemini-1.0-pro'],
  },
];
