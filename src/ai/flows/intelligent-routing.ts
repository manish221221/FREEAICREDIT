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
import {z} from 'genkit';

const IntelligentRouteInputSchema = z.object({
  model: z.string().describe('The requested model (e.g., gpt-4o-mini).'),
  messages: z.array(z.object({role: z.string(), content: z.string()})).describe('The chat messages.'),
  providerHint: z.string().nullable().describe('Optional hint for the provider to use.'),
  stream: z.boolean().default(false).describe('Whether to stream the response.'),
});
export type IntelligentRouteInput = z.infer<typeof IntelligentRouteInputSchema>;

const IntelligentRouteOutputSchema = z.object({
  id: z.string().describe('The ID of the completion.'),
  provider: z.string().describe('The provider used (e.g., openai).'),
  model: z.string().describe('The model used (e.g., gpt-4o-mini).'),
  choices: z.array(z.object({message: z.object({role: z.string(), content: z.string()})})).describe('The completion choices.'),
  usage: z.object({prompt_tokens: z.number(), completion_tokens: z.number(), total_tokens: z.number()}).describe('The token usage.'),
  routing: z.object({key_label: z.string(), switchEvents: z.array(z.object({at: z.number(), reason: z.string()}))}).describe('The routing information.'),
});
export type IntelligentRouteOutput = z.infer<typeof IntelligentRouteOutputSchema>;

export async function intelligentRoute(input: IntelligentRouteInput): Promise<IntelligentRouteOutput> {
  return intelligentRouteFlow(input);
}

const prompt = ai.definePrompt({
  name: 'intelligentRoutePrompt',
  input: {schema: IntelligentRouteInputSchema},
  output: {schema: IntelligentRouteOutputSchema},
  prompt: `You are an AI routing agent.  You take in a model, messages, and provider hint and return the result of calling that model. Do not add any additional commentary. Simply proxy the response.

Model: {{{model}}}
Messages: {{{JSON.stringify(messages)}}
Provider Hint: {{{providerHint}}}
Stream: {{{stream}}}
`,
});

const intelligentRouteFlow = ai.defineFlow(
  {
    name: 'intelligentRouteFlow',
    inputSchema: IntelligentRouteInputSchema,
    outputSchema: IntelligentRouteOutputSchema,
  },
  async input => {
    //In a real implementation, we would implement complex logic here to select the best key/model.
    //This implementation simply calls the prompt with the input.
    const {output} = await prompt(input);
    return output!;
  }
);
