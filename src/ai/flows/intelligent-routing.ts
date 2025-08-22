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
import {generate} from 'genkit/generate';
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
  model: z.string().describe('The requested model (e.g., gpt-4o-mini).'),
  messages: z.array(z.object({role: z.string(), content: z.string()})).describe('The chat messages.'),
  providerHint: z.string().nullable().describe('Optional hint for the provider to use.'),
  stream: z.boolean().default(false).describe('Whether to stream the response.'),
  keys: z.array(KeySchema).describe('The user\'s API keys.'),
});
export type IntelligentRouteInput = z.infer<typeof IntelligentRouteInputSchema>;

const IntelligentRouteOutputSchema = z.object({
  id: z.string().describe('The ID of the completion.'),
  provider: z.string().describe('The provider used (e.g., openai).'),
  model: z.string().describe('The model used (e.g., gpt-4o-mini).'),
  choices: z.array(z.object({message: z.object({role: z.string(), content: z.string()})})).describe('The completion choices.'),
  usage: z.object({prompt_tokens: z.number(), completion_tokens: z.number(), total_tokens: z.number()}).optional().describe('The token usage.'),
  routing: z.object({key_label: z.string(), switchEvents: z.array(z.object({at: z.number(), reason: z.string()}))}).describe('The routing information.'),
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
    const switchEvents: {at: number; reason: string}[] = [];

    const activeKeys = keys.filter(k => k.status === 'active').sort((a, b) => a.priority - b.priority);

    const initialProvider = getProviderForModel(model);
    if (!initialProvider) {
      throw new Error(`Could not find a provider for model ${model}`);
    }

    const preferredKey = activeKeys.find(k => k.providerId === initialProvider.id);

    let selectedKey = preferredKey;
    let selectedModel = model;
    let providerId = initialProvider.id;

    if (!selectedKey) {
      switchEvents.push({at: Date.now(), reason: `No active key for preferred provider ${initialProvider.name}. Switching.`});
      selectedKey = activeKeys[0]; // Fallback to highest priority key
      if (!selectedKey) throw new Error('No active API keys available.');
      const fallbackProvider = getProviderForModel(selectedKey.providerId);
      if (!fallbackProvider) throw new Error('Fallback key has an invalid provider.');
      providerId = fallbackProvider.id;
      selectedModel = fallbackProvider.models[0];
    }

    try {
      const modelRef = getModelRef(providerId, selectedModel);
      const response = await generate({
        model: modelRef,
        prompt: {messages: messages as MessageData[]},
        config: {
          apiKey: selectedKey.key,
        },
      });

      return {
        id: response.candidates[0].custom?.id || `genkit-id-${Date.now()}`,
        provider: providerId,
        model: selectedModel,
        choices: [{message: {role: response.candidates[0].message.role, content: response.candidates[0].message.content[0].text}}],
        usage: response.usage,
        routing: {
          key_label: selectedKey.label,
          switchEvents: switchEvents,
        },
      };
    } catch (e: any) {
       switchEvents.push({at: Date.now(), reason: `Initial attempt failed with ${providerId}: ${e.message}. Switching.`});
       
       const fallbackKey = activeKeys.find(k => k.id !== selectedKey?.id);
       if (!fallbackKey) throw new Error(`Primary provider failed and no fallback keys are available. Error: ${e.message}`);

       selectedKey = fallbackKey;
       const fallbackProvider = getProviderForModel(selectedKey.providerId);
       if (!fallbackProvider) throw new Error('Fallback key has an invalid provider.');
       providerId = fallbackProvider.id;
       selectedModel = fallbackProvider.models[0];

       const modelRef = getModelRef(providerId, selectedModel);
       const response = await generate({
         model: modelRef,
         prompt: {messages: messages as MessageData[]},
         config: {
           apiKey: selectedKey.key,
         },
       });

       return {
         id: response.candidates[0].custom?.id || `genkit-id-${Date.now()}`,
         provider: providerId,
         model: selectedModel,
         choices: [{message: {role: response.candidates[0].message.role, content: response.candidates[0].message.content[0].text}}],
         usage: response.usage,
         routing: {
           key_label: selectedKey.label,
           switchEvents: switchEvents,
         },
       };
    }
  }
);
