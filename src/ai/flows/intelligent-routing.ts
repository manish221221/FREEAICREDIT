// src/ai/flows/intelligent-routing.ts
'use server';

/**
 * @fileOverview An intelligent routing AI agent that selects the best API key and model for a request.
 *
 * - intelligentRoute - A function that handles the intelligent routing process.
 * - IntelligentRouteInput - The input type for the intelligentRoute function.
 * - IntelligentRouteOutput - The return type for the intelligentRoute function.
 */

import {ai} from '@/ai/genkit';
import {generate} from 'genkit';
import {z} from 'genkit';
import {Tool} from 'genkit/tool';
import {Model} from 'genkit/model';
import {googleAI} from '@genkit-ai/googleai';
import type {ApiKey, Provider} from '@/lib/types';
import {providers} from '@/lib/providers';
import {MessageData} from 'genkit/model';

const KeySchema = z.object({
  id: z.string(),
  providerId: z.string(),
  label: z.string(),
  key: z.string(),
  priority: z.number(),
  status: z.enum(['active', 'inactive']),
  createdAt: z.string(),
});

const IntelligentRouteInputSchema = z.object({
  model: z.string().describe('The requested model (e.g., gemini-1.5-flash-latest).'),
  messages: z.array(z.object({role: z.string(), content: z.string()})).describe('The chat messages.'),
  keys: z.array(KeySchema).describe('The user\'s API keys.'),
});
export type IntelligentRouteInput = z.infer<typeof IntelligentRouteInputSchema>;

const IntelligentRouteOutputSchema = z.object({
  id: z.string().describe('The ID of the completion.'),
  provider: z.string().describe('The provider used (e.g., google).'),
  model: z.string().describe('The model used (e.g., gemini-1.5-flash-latest).'),
  choices: z.array(z.object({message: z.object({role: z.string(), content: z.string()})})).describe('The completion choices.'),
  usage: z.object({prompt_tokens: z.number(), completion_tokens: z.number(), total_tokens: z.number()}).optional().describe('The token usage.'),
  routing: z.object({key_label: z.string()}).describe('The routing information.'),
});
export type IntelligentRouteOutput = z.infer<typeof IntelligentRouteOutputSchema>;

export async function intelligentRoute(input: IntelligentRouteInput): Promise<IntelligentRouteOutput> {
  return intelligentRouteFlow(input);
}

const getProviderForModel = (modelName: string): Provider | undefined => {
  return providers.find(p => p.models.includes(modelName));
};

const getModelRef = (providerId: string, modelName: string): Model => {
  switch (providerId) {
    case 'google':
      return googleAI.model(modelName);
    default:
      throw new Error(`Unknown provider: ${providerId}`);
  }
};

const intelligentRouteFlow = ai.defineFlow(
  {
    name: 'intelligentRouteFlow',
    inputSchema: IntelligentRouteInputSchema,
    outputSchema: IntelligentRouteOutputSchema,
  },
  async input => {
    const {model, messages, keys} = input;
    
    const provider = getProviderForModel(model);
    if (!provider) {
      throw new Error(`Could not find a provider for model ${model}`);
    }

    const activeKey = keys.find(k => k.providerId === provider.id && k.status === 'active');
    if (!activeKey) {
        throw new Error(`No active API key found for ${provider.name}. Please add one in the Dashboard.`);
    }

    try {
      const modelRef = getModelRef(provider.id, model);
      const response = await generate({
        model: modelRef,
        prompt: {messages: messages as MessageData[]},
        config: {
          apiKey: activeKey.key,
        },
      });

      return {
        id: response.candidates[0].custom?.id || `genkit-id-${Date.now()}`,
        provider: provider.id,
        model: model,
        choices: [{message: {role: response.candidates[0].message.role, content: response.candidates[0].message.content[0].text}}],
        usage: response.usage,
        routing: {
          key_label: activeKey.label,
        },
      };
    } catch (e: any) {
       console.error(`Request failed with ${provider.id}: ${e.message}`);
       throw new Error(`The request failed with ${provider.name}. Check your API key and try again. Error: ${e.message}`);
    }
  }
);
