"use client";

import { useEffect, useState, Suspense } from 'react';
import { useForm, useFieldArray, Controller } from 'react-hook-form';
import { useRouter, useSearchParams } from 'next/navigation';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useAgents } from '@/hooks/use-agents';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { generateAgentContent } from '@/ai/flows/agent-content-generation';
import { useToast } from '@/hooks/use-toast';
import { Loader, Sparkles, Trash2, PlusCircle, Info } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';


const stepSchema = z.object({
  type: z.enum(['llm', 'clipboard', 'notification', 'share']),
  args: z.record(z.any()).optional(),
});

const agentSchema = z.object({
  name: z.string().min(1, 'Agent name is required.'),
  description: z.string().min(1, 'Description is required.'),
  permissions: z.array(z.string()),
  steps: z.array(stepSchema),
});

const stepTypes: Array<z.infer<typeof stepSchema>['type']> = ['llm', 'clipboard', 'notification', 'share'];

const stepRequiresArgs = (type: z.infer<typeof stepSchema>['type']) => {
    return type === 'llm';
};

function AgentEditor() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { addAgent, updateAgent, getAgent } = useAgents();
  const { toast } = useToast();
  const [isGenerating, setIsGenerating] = useState(false);
  
  const agentId = searchParams.get('id');
  const existingAgent = agentId ? getAgent(agentId) : undefined;

  const form = useForm<z.infer<typeof agentSchema>>({
    resolver: zodResolver(agentSchema),
    defaultValues: {
      name: '',
      description: '',
      permissions: [],
      steps: [{ type: 'llm', args: { prompt: '' } }],
    },
  });
  
  useEffect(() => {
    if (existingAgent) {
      form.reset({
        ...existingAgent,
        steps: existingAgent.steps.map(step => ({
          ...step,
          args: step.args || {},
        }))
      });
    }
  }, [existingAgent, form]);

  const { fields, append, remove, update } = useFieldArray({
    control: form.control,
    name: "steps",
  });
  
  const watchedSteps = form.watch('steps');

  const onSubmit = (values: z.infer<typeof agentSchema>) => {
    // Filter out empty args and invalid steps
    const cleanedValues = {
        ...values,
        steps: values.steps.map(step => ({
            ...step,
            args: step.type === 'llm' && step.args?.prompt ? step.args : {},
        })).filter(step => {
            // Keep all non-llm steps, or llm steps that have a prompt
            return step.type !== 'llm' || (step.args && Object.keys(step.args).length > 0 && step.args.prompt);
        })
    };

    if (existingAgent) {
      updateAgent({ ...existingAgent, ...cleanedValues });
      toast({ title: 'Agent Updated', description: `"${values.name}" has been saved.` });
    } else {
      addAgent(cleanedValues);
      toast({ title: 'Agent Created', description: `"${values.name}" has been created.` });
    }
    router.push('/agents');
  };
  
  const handleGenerate = async () => {
      const task = `Create a detailed agent definition based on the user's idea. The agent should have a name, description, and a series of steps. Each step must have a type (from this list: ${stepTypes.join(", ")}) and optional arguments. The output should be a single JSON object.`;
      const context = `User's idea: "${form.getValues('name')}". Description: "${form.getValues('description')}"`;
      
      setIsGenerating(true);
      try {
          const result = await generateAgentContent({ task, context });
          const cleanedResult = result.content.replace(/^```json\n|```$/g, '').trim();
          const generated = JSON.parse(cleanedResult);
          
          form.setValue('steps', generated.steps || []);
          form.setValue('permissions', generated.permissions || []);
          if(generated.description) form.setValue('description', generated.description);
          toast({ title: "Agent content generated!" });
      } catch (error) {
          console.error("Failed to generate agent content", error);
          toast({ variant: 'destructive', title: "Generation failed", description: `Could not parse AI response. ${String(error)}` });
      } finally {
          setIsGenerating(false);
      }
  };

  return (
    <Suspense fallback={<div>Loading agent...</div>}>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          <div>
            <h1 className="text-3xl font-headline font-bold tracking-tight">
              {existingAgent ? 'Edit Agent' : 'Create Agent'}
            </h1>
            <p className="text-muted-foreground">
              Define the steps for your automated task flow.
            </p>
          </div>
          <Card>
            <CardHeader>
              <CardTitle className="font-headline">Agent Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Name</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Daily News Summarizer" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea placeholder="What does this agent do?" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>
          
          <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle className="font-headline">Steps</CardTitle>
                    <FormDescription>Add, remove, and configure the steps your agent will perform.</FormDescription>
                  </div>
                  <Button type="button" variant="outline" size="sm" onClick={handleGenerate} disabled={isGenerating || !form.watch('name')}>
                      {isGenerating ? <Loader className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
                      Generate with AI
                  </Button>
              </CardHeader>
              <CardContent className="space-y-4">
                  {fields.map((field, index) => {
                      const stepType = watchedSteps[index]?.type;
                      
                      return (
                      <div key={field.id} className="p-4 border rounded-lg relative space-y-4">
                          <Button type="button" variant="ghost" size="icon" className="absolute top-2 right-2 text-destructive hover:text-destructive" onClick={() => remove(index)}>
                              <Trash2 className="h-4 w-4" />
                          </Button>
                          <div className="flex items-end gap-4">
                              <span className="text-xs font-bold bg-secondary text-secondary-foreground rounded-full size-6 flex items-center justify-center">{index + 1}</span>
                            <FormField
                                control={form.control}
                                name={`steps.${index}.type`}
                                render={({ field }) => (
                                    <FormItem className="flex-1">
                                        <FormLabel>Step Type</FormLabel>
                                        <Select 
                                            onValueChange={(value) => {
                                                field.onChange(value);
                                                // Reset args when type changes
                                                update(index, { type: value as any, args: {} });
                                            }} 
                                            defaultValue={field.value}
                                        >
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Select a step type" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                {stepTypes.map(type => (
                                                    <SelectItem key={type} value={type}>{type}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                          </div>

                          {stepType === 'llm' && (
                            <FormField
                                control={form.control}
                                name={`steps.${index}.args.prompt`}
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Prompt</FormLabel>
                                        <FormControl>
                                            <Textarea
                                                placeholder="e.g., Summarize the following text: {{llmOutput}}"
                                                {...field}
                                                rows={3}
                                            />
                                        </FormControl>
                                        <FormDescription>
                                            {"Use `{{llmOutput}}` to include output from a previous LLM step."}
                                        </FormDescription>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                          )}

                          {!stepRequiresArgs(stepType) && (
                            <Alert>
                                <Info className="h-4 w-4" />
                                <AlertTitle>No arguments needed</AlertTitle>
                                <AlertDescription>
                                    This step will automatically use the output from the previous step.
                                </AlertDescription>
                            </Alert>
                          )}
                      </div>
                  )})}
                  <Button type="button" variant="outline" size="sm" onClick={() => append({type: 'llm', args: {prompt: ''}})}>
                      <PlusCircle className="mr-2 h-4 w-4" />
                      Add Step
                  </Button>
              </CardContent>
          </Card>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => router.back()}>
              Cancel
            </Button>
            <Button type="submit">
              {existingAgent ? 'Save Changes' : 'Create Agent'}
            </Button>
          </div>
        </form>
      </Form>
    </Suspense>
  );
}

export default function AgentEditorPage() {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <AgentEditor />
        </Suspense>
    )
}
