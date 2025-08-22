'use server';

/**
 * @fileOverview Implements the execution of mini-agents, allowing users to automate tasks by calling AI models and using device capabilities.
 *
 * - executeAgent - A function that executes a given mini-agent definition.
 * - AgentDefinition - The input type for the executeAgent function, defining the agent's steps and permissions.
 * - AgentContext - The context object passed between agent steps, storing intermediate results.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

// Define schemas for agent steps and overall agent definition
const AgentStepSchema = z.object({
  type: z.string().describe('The type of the agent step (e.g., llm, clipboard, notification).'),
  args: z.record(z.any()).optional().describe('Arguments for the step, specific to the step type.'),
});

const AgentDefinitionSchema = z.object({
  name: z.string().describe('The name of the agent.'),
  steps: z.array(AgentStepSchema).describe('The ordered list of steps to execute.'),
  permissions: z.array(z.string()).optional().describe('List of required device permissions.'),
});

export type AgentDefinition = z.infer<typeof AgentDefinitionSchema>;

// Define a context type to hold intermediate results between agent steps.
export type AgentContext = {
  [key: string]: any;
};

/**
 * Executes a mini-agent definition by iterating through its steps and
 * calling appropriate functions for each step type.
 *
 * @param agentDefinition - The definition of the agent to execute.
 * @returns A promise that resolves to the final context after executing all steps.
 */
export async function executeAgent(agentDefinition: AgentDefinition): Promise<AgentContext> {
  return executeAgentFlow(agentDefinition);
}

const executeAgentFlow = ai.defineFlow(
  {
    name: 'executeAgentFlow',
    inputSchema: AgentDefinitionSchema,
    outputSchema: z.any(), // Context object is dynamically typed
  },
  async agentDefinition => {
    let context: AgentContext = {};

    for (const step of agentDefinition.steps) {
      switch (step.type) {
        case 'llm':
          // Example LLM call - replace with actual implementation using Genkit prompts
          if (!step.args?.prompt) {
            throw new Error('LLM step requires a prompt argument.');
          }
          const llmResult = await callLLM(step.args.prompt, context);
          context.llmOutput = llmResult;
          break;
        case 'clipboard':
          // Placeholder for clipboard interaction - replace with actual device capability call
          context.clipboardContent = context.llmOutput;
          break;
        case 'notification':
          // Placeholder for notification - replace with actual device capability call
          console.log(`Sending notification: ${context.llmOutput}`);
          break;
        case 'share':
          // Placeholder for share action - replace with actual device capability call
          console.log(`Sharing: ${context.llmOutput}`);
          break;
        default:
          console.warn(`Unknown step type: ${step.type}`);
      }
    }

    return context;
  }
);

async function callLLM(prompt: string, context: AgentContext): Promise<string> {
  const llmPrompt = ai.definePrompt({
    name: 'miniAgentLLMPrompt',
    prompt: prompt,
  });
  const result = await llmPrompt(context);
  return result.output as string; // Simplified type assertion
}

export type AgentInput = z.infer<typeof AgentDefinitionSchema>;
export type AgentOutput = AgentContext;
