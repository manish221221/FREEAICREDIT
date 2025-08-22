"use client";

import { useEffect, useState, Suspense } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
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
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { generateAgentContent } from '@/ai/flows/agent-content-generation';
import { useToast } from '@/hooks/use-toast';
import { Loader, Sparkles, Trash2 } from 'lucide-react';

const stepSchema = z.object({
  type: z.enum(['llm', 'clipboard', 'notification', 'share', 'pick_file', 'extract']),
  args: z.record(z.string(), z.any()).optional(),
});

const agentSchema = z.object({
  name: z.string().min(1, 'Agent name is required.'),
  description: z.string().min(1, 'Description is required.'),
  permissions: z.array(z.string()),
  steps: z.array(stepSchema),
});

function AgentEditor() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { agents, addAgent, updateAgent, getAgent } = useAgents();
  const { toast } = useToast();
  const [isGenerating, setIsGenerating] = useState(false);
  
  const agentId = searchParams.get('id');
  const existingAgent = agentId ? getAgent(agentId) : undefined;

  const form = useForm<z.infer<typeof agentSchema>>({
    resolver: zodResolver(agentSchema),
    defaultValues: existingAgent || {
      name: '',
      description: '',
      permissions: [],
      steps: [{ type: 'llm', args: { prompt: '' } }],
    },
  });
  
  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "steps",
  });

  useEffect(() => {
    if (existingAgent) {
      form.reset(existingAgent);
    }
  }, [existingAgent, form]);

  const onSubmit = (values: z.infer<typeof agentSchema>) => {
    if (existingAgent) {
      updateAgent({ ...existingAgent, ...values });
      toast({ title: 'Agent Updated', description: `"${values.name}" has been saved.` });
    } else {
      addAgent(values);
      toast({ title: 'Agent Created', description: `"${values.name}" has been created.` });
    }
    router.push('/agents');
  };
  
  const handleGenerate = async () => {
      const task = "Create a detailed agent definition based on the user's idea. The agent should have a name, description, and a series of steps. Each step must have a type and optional arguments. The output should be a single JSON object.";
      const context = `User's idea: "${form.getValues('name')}". Description: "${form.getValues('description')}"`;
      
      setIsGenerating(true);
      try {
          const result = await generateAgentContent({ task, context });
          const generated = JSON.parse(result.content);
          form.setValue('steps', generated.steps || []);
          form.setValue('permissions', generated.permissions || []);
          if(generated.description) form.setValue('description', generated.description);
          toast({ title: "Agent content generated!" });
      } catch (error) {
          console.error("Failed to generate agent content", error);
          toast({ variant: 'destructive', title: "Generation failed", description: String(error) });
      } finally {
          setIsGenerating(false);
      }
  };

  return (
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
                <CardTitle className="font-headline">Steps</CardTitle>
                <Button type="button" variant="outline" size="sm" onClick={handleGenerate} disabled={isGenerating}>
                    {isGenerating ? <Loader className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
                    Generate with AI
                </Button>
            </CardHeader>
            <CardContent className="space-y-4">
                {fields.map((field, index) => (
                    <div key={field.id} className="p-4 border rounded-lg relative">
                        <FormField
                            control={form.control}
                            name={`steps.${index}.type`}
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Step {index + 1}: Type</FormLabel>
                                    <Input {...field} readOnly />
                                </FormItem>
                            )}
                        />
                         <FormField
                            control={form.control}
                            name={`steps.${index}.args`}
                            render={({ field }) => (
                                <FormItem className="mt-2">
                                    <FormLabel>Arguments (JSON)</FormLabel>
                                    <Textarea 
                                        {...field}
                                        value={field.value ? JSON.stringify(field.value, null, 2) : ''}
                                        readOnly
                                        rows={4}
                                        className="font-mono text-xs"
                                    />
                                </FormItem>
                            )}
                        />
                        <Button type="button" variant="ghost" size="icon" className="absolute top-2 right-2 text-destructive" onClick={() => remove(index)}>
                            <Trash2 className="h-4 w-4" />
                        </Button>
                    </div>
                ))}
                 <p className="text-sm text-muted-foreground">Agent steps are currently read-only in the UI. Use 'Generate with AI' to populate them.</p>
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
  );
}

export default function AgentEditorPage() {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <AgentEditor />
        </Suspense>
    )
}
