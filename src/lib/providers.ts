import type { Provider } from './types';
import { Sparkles } from 'lucide-react';

export const providers: Provider[] = [
  {
    id: 'google',
    name: 'Google AI',
    description: 'Gemini models offering a balance of performance and cost for various applications.',
    icon: Sparkles,
    models: ['gemini-1.5-pro-latest', 'gemini-1.5-flash-latest', 'gemini-1.0-pro'],
  },
];
