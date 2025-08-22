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
import { generateAgentContent } from './agent-content-generation';

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
      // Simple templating: replace placeholders like {{llmOutput}}
      const processedArgs = step.args ? JSON.parse(JSON.stringify(step.args).replace(/{{(.*?)}}/g, (match, key) => context[key.trim()] || '')) : {};
      
      switch (step.type) {
        case 'llm':
          if (!processedArgs?.prompt) {
            throw new Error('LLM step requires a prompt argument.');
          }
          const llmResult = await callLLM(processedArgs.prompt, context);
          context.llmOutput = llmResult.content;
          break;
        case 'clipboard':
          const clipboardContent = processedArgs.content || context.llmOutput;
          if (clipboardContent) {
            // This will be executed on the client-side via the component
            context.clipboardContent = clipboardContent;
          }
          break;
        case 'notification':
           const notificationContent = processedArgs.content || context.llmOutput;
           if (notificationContent) {
             // This will be executed on the client-side via the component
             context.notification = { title: agentDefinition.name, body: notificationContent };
           }
           break;
        case 'share':
           const shareContent = processedArgs.content || context.llmOutput;
           if (shareContent) {
             // This will be executed on the client-side via the component
             context.share = { title: agentDefinition.name, text: shareContent };
           }
           break;
        default:
          console.warn(`Unknown step type: ${step.type}`);
      }
    }
    return context;
  }
);

async function callLLM(prompt: string, context: AgentContext) {
    const { output } = await generateAgentContent({
        task: prompt,
        context: JSON.stringify(context)
    });
    return output!;
}

export type AgentInput = z.infer<typeof AgentDefinitionSchema>;
export type AgentOutput = AgentContext;
