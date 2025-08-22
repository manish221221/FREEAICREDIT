"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { providers } from "@/lib/providers";
import { intelligentRoute, type IntelligentRouteOutput } from "@/ai/flows/intelligent-routing";
import { Send, Loader, Share2, Copy } from "lucide-react";
import { useKeys } from "@/hooks/use-keys";

type Message = {
  role: "user" | "assistant";
  content: string;
};

export default function ComposePage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [model, setModel] = useState("gemini-1.5-flash-latest");
  const [lastRouteInfo, setLastRouteInfo] = useState<IntelligentRouteOutput['routing'] | null>(null);
  const { keys } = useKeys();

  const allModels = providers.flatMap((p) => p.models);

  const handleSend = async () => {
    if (!input.trim()) return;

    const newMessages: Message[] = [...messages, { role: "user", content: input }];
    setMessages(newMessages);
    setInput("");
    setIsLoading(true);
    setError(null);
    setLastRouteInfo(null);

    try {
      const response = await intelligentRoute({
        model,
        messages: newMessages.map(m => ({ role: m.role, content: m.content })),
        keys: keys,
      });

      if (response && response.choices && response.choices.length > 0) {
        setMessages([
          ...newMessages,
          { role: "assistant", content: response.choices[0].message.content },
        ]);
        setLastRouteInfo(response.routing);
      } else {
        throw new Error("Invalid response from AI.");
      }
    } catch (e: any) {
      setError(e.message || "An unexpected error occurred.");
    } finally {
      setIsLoading(false);
    }
  };
  
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)]">
      <header className="mb-6">
        <h1 className="text-3xl font-headline font-bold tracking-tight">Compose</h1>
        <p className="text-muted-foreground">
          Chat with available AI models.
        </p>
      </header>
      
      <div className="grid md:grid-cols-3 gap-6 flex-1">
        <div className="md:col-span-2 flex flex-col bg-card border rounded-lg">
          <div className="flex-1 p-6 space-y-4 overflow-y-auto">
            {messages.map((message, index) => (
              <div
                key={index}
                className={`flex gap-3 ${
                  message.role === "user" ? "justify-end" : "justify-start"
                }`}
              >
                <div
                  className={`max-w-md rounded-lg p-3 ${
                    message.role === "user"
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted"
                  }`}
                >
                  <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                </div>
              </div>
            ))}
             {isLoading && (
              <div className="flex justify-start">
                <div className="bg-muted rounded-lg p-3 flex items-center gap-2">
                   <Loader className="h-4 w-4 animate-spin" />
                   <span className="text-sm text-muted-foreground">Thinking...</span>
                </div>
              </div>
            )}
          </div>
          <div className="p-4 border-t">
            <div className="relative">
              <Textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Draft a polite email..."
                className="pr-20"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSend();
                  }
                }}
              />
              <Button
                onClick={handleSend}
                disabled={isLoading}
                className="absolute right-2 top-1/2 -translate-y-1/2"
                size="icon"
              >
                {isLoading ? (
                  <Loader className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="font-headline">Configuration</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Model</label>
                  <Select value={model} onValueChange={setModel}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a model" />
                    </SelectTrigger>
                    <SelectContent>
                      {allModels.map((m) => (
                        <SelectItem key={m} value={m}>
                          {m}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>
          
          {lastRouteInfo && (
            <Card>
              <CardHeader>
                <CardTitle className="font-headline">Routing Details</CardTitle>
              </CardHeader>
              <CardContent className="text-sm space-y-2">
                 <p><strong>Key Used:</strong> <Badge variant="secondary">{lastRouteInfo.key_label}</Badge></p>
              </CardContent>
            </Card>
          )}

          {error && (
            <Alert variant="destructive">
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
        </div>
      </div>
    </div>
  );
}