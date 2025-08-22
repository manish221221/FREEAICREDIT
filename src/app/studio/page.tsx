"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Loader, Sparkles } from "lucide-react";
import Image from "next/image";

export default function StudioPage() {
    const [prompt, setPrompt] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [campaign, setCampaign] = useState<any>(null);

    const handleGenerate = async () => {
        if (!prompt) return;
        setIsLoading(true);
        setCampaign(null);

        // Placeholder for AI flow call
        await new Promise(resolve => setTimeout(resolve, 2000));

        // Placeholder data
        setCampaign({
            article: {
                title: "The Future of AI in Marketing",
                content: "The landscape of digital marketing is undergoing a seismic shift, and at the epicenter of this transformation is Artificial Intelligence (AI). From hyper-personalized customer experiences to predictive analytics that foresee market trends, AI is not just a buzzword; it's a fundamental tool that's reshaping how brands connect with their audiences. In this article, we'll explore the key ways AI is revolutionizing marketing, the tools leading the charge, and what the future holds for this dynamic partnership."
            },
            socialPosts: [
                { platform: "Twitter", content: "AI is revolutionizing marketing as we know it! 🚀 From personalization to predictive analytics, the future is now. Check out our deep dive into the AI-powered marketing landscape. #AI #Marketing #FutureTech" },
                { platform: "LinkedIn", content: "Is your marketing strategy AI-ready? We've broken down how Artificial Intelligence is creating new opportunities for audience engagement, data analysis, and campaign optimization. A must-read for any forward-thinking marketing professional. #AIMarketing #DigitalTransformation #BusinessStrategy" }
            ],
            images: [
                { prompt: "A futuristic brain made of circuits and data streams, representing marketing AI", url: "https://placehold.co/1024x576.png", data-ai-hint: "futuristic brain" },
                { prompt: "A diverse group of marketing professionals collaborating around a holographic interface showing charts and graphs", url: "https://placehold.co/1024x576.png", data-ai-hint: "marketing professionals" }
            ],
            videoScript: {
                title: "AI Marketing in 60 Seconds",
                script: "Scene: Energetic, fast-paced montage.\n(Upbeat music starts)\nNarrator: Tired of marketing that doesn't deliver? Meet AI.\n(Cut to graphics showing data personalization)\nNarrator: It creates one-on-one experiences for millions.\n(Cut to charts predicting trends)\nNarrator: Predicts the future, so you don't have to guess.\n(Text on screen: The Future is Here. AI-Powered Marketing)\nNarrator: Supercharge your strategy. The AI revolution is here.\n(Upbeat music fades)"
            }
        });

        setIsLoading(false);
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
                        />
                        <Button onClick={handleGenerate} disabled={isLoading || !prompt} size="lg">
                            {isLoading ? <Loader className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
                            Generate Campaign
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {isLoading && (
                 <div className="flex justify-center items-center py-20">
                    <Loader className="h-8 w-8 animate-spin text-primary" />
                    <p className="ml-4 text-lg text-muted-foreground">Generating your campaign...</p>
                 </div>
            )}

            {campaign && (
                <Tabs defaultValue="article" className="w-full">
                    <TabsList className="grid w-full grid-cols-4">
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
                            <CardContent className="space-y-4">
                                <Textarea value={campaign.article.content} rows={15} className="text-base" />
                            </CardContent>
                        </Card>
                    </TabsContent>
                    <TabsContent value="social">
                        <div className="space-y-4">
                            {campaign.socialPosts.map((post: any, index: number) => (
                                <Card key={index}>
                                    <CardHeader>
                                        <CardTitle className="font-headline text-lg">{post.platform}</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <Textarea value={post.content} rows={4} className="text-base" />
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    </TabsContent>
                    <TabsContent value="media">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                             {campaign.images.map((image: any, index: number) => (
                                <Card key={index}>
                                    <CardContent className="p-4">
                                        <Image src={image.url} alt={image.prompt} width={512} height={288} className="rounded-md w-full" data-ai-hint={image['data-ai-hint']} />
                                        <p className="text-sm text-muted-foreground mt-2">{image.prompt}</p>
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
                                <Textarea value={campaign.videoScript.script} rows={15} className="text-base font-mono" />
                            </CardContent>
                        </Card>
                    </TabsContent>
                </Tabs>
            )}
        </div>
    );
}
