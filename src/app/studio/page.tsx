"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Loader, Sparkles, Copy } from "lucide-react";
import Image from "next/image";
import { generateContentCampaign, type ContentCampaignOutput } from "@/ai/flows/content-campaign-flow";
import { useToast } from "@/hooks/use-toast";

const InteractiveTextarea = ({ value, title }: { value: string, title: string }) => {
    const { toast } = useToast();
    const handleCopy = () => {
        navigator.clipboard.writeText(value);
        toast({ title: `${title} Copied!` });
    };
    return (
        <div className="relative group">
            <Textarea value={value} readOnly rows={20} className="text-base w-full bg-background" />
            <Button variant="ghost" size="icon" className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity" onClick={handleCopy}>
                <Copy className="h-4 w-4" />
            </Button>
        </div>
    );
};

export default function StudioPage() {
    const [prompt, setPrompt] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [campaign, setCampaign] = useState<ContentCampaignOutput | null>(null);
    const { toast } = useToast();

    const handleGenerate = async () => {
        if (!prompt) return;
        setIsLoading(true);
        setCampaign(null);

        try {
            const result = await generateContentCampaign({ prompt });
            setCampaign(result);
            toast({ title: "Campaign Generated!", description: "Your multi-modal content is ready." });
        } catch (error) {
            console.error("Failed to generate campaign", error);
            toast({ variant: "destructive", title: "Generation Failed", description: String(error) });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="space-y-6">
            <header className="mb-6">
                <h1 className="text-3xl font-headline font-bold tracking-tight">Creator Studio</h1>
                <p className="text-muted-foreground">
                    Generate a complete, multi-modal content campaign from a single idea.
                </p>
            </header>

            <Card>
                <CardContent className="p-6">
                    <div className="flex flex-col sm:flex-row gap-4">
                        <Input
                            placeholder="e.g., A new eco-friendly coffee brand"
                            value={prompt}
                            onChange={(e) => setPrompt(e.target.value)}
                            className="flex-grow text-base"
                            disabled={isLoading}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                    handleGenerate();
                                }
                            }}
                        />
                        <Button onClick={handleGenerate} disabled={isLoading || !prompt} size="lg">
                            {isLoading ? <Loader className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
                            Generate Campaign
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {isLoading && (
                 <div className="flex flex-col items-center justify-center py-20 gap-4 text-center">
                    <Loader className="h-12 w-12 animate-spin text-primary" />
                    <div>
                        <p className="text-lg font-semibold text-muted-foreground">Generating your campaign...</p>
                        <p className="text-sm text-muted-foreground">This may take a moment. The AI is working its magic!</p>
                    </div>
                 </div>
            )}

            {campaign && (
                <Tabs defaultValue="article" className="w-full">
                    <TabsList className="grid w-full grid-cols-2 md:grid-cols-4">
                        <TabsTrigger value="article">Article</TabsTrigger>
                        <TabsTrigger value="social">Social Posts</TabsTrigger>
                        <TabsTrigger value="media">Media</TabsTrigger>
                        <TabsTrigger value="video">Video Script</TabsTrigger>
                    </TabsList>
                    <TabsContent value="article">
                        <Card>
                            <CardHeader>
                                <CardTitle className="font-headline">{campaign.article.title}</CardTitle>
                            </CardHeader>
                            <CardContent className="prose prose-sm dark:prose-invert max-w-none">
                                <InteractiveTextarea value={campaign.article.content} title="Article" />
                            </CardContent>
                        </Card>
                    </TabsContent>
                    <TabsContent value="social">
                        <div className="space-y-4">
                            {campaign.socialPosts.map((post, index) => (
                                <Card key={index}>
                                    <CardHeader>
                                        <CardTitle className="font-headline text-lg">{post.platform}</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <InteractiveTextarea value={post.content} title={`${post.platform} Post`} />
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    </TabsContent>
                    <TabsContent value="media">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                             {campaign.images.map((image, index) => (
                                <Card key={index}>
                                    <CardContent className="p-4 space-y-2">
                                        <Image src={image.url} alt={image.prompt} width={1024} height={576} className="rounded-md w-full aspect-video object-cover bg-muted" data-ai-hint={image['data-ai-hint']} />
                                        <p className="text-sm text-muted-foreground">{image.prompt}</p>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    </TabsContent>
                     <TabsContent value="video">
                        <Card>
                             <CardHeader>
                                <CardTitle className="font-headline">{campaign.videoScript.title}</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <InteractiveTextarea value={campaign.videoScript.script} title="Video Script" />
                            </CardContent>
                        </Card>
                    </TabsContent>
                </Tabs>
            )}
        </div>
    );
}
