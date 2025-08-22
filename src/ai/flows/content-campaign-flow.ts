'use server';

/**
 * @fileOverview A content campaign generation AI agent.
 *
 * - generateContentCampaign - A function that handles the content campaign generation process.
 * - ContentCampaignInput - The input type for the generateContentCampaign function.
 * - ContentCampaignOutput - The return type for the generateContentCampaign function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const ContentCampaignInputSchema = z.object({
  prompt: z.string().describe('The user\'s high-level idea for the campaign.'),
});
export type ContentCampaignInput = z.infer<typeof ContentCampaignInputSchema>;

const ArticleSchema = z.object({
    title: z.string().describe('The catchy, SEO-friendly title of the blog post.'),
    content: z.string().describe('The full content of the blog post, written in markdown format.'),
});

const SocialPostSchema = z.object({
    platform: z.enum(['Twitter', 'LinkedIn']).describe('The social media platform for this post.'),
    content: z.string().describe('The content of the social media post, tailored to the platform.'),
});

const ImageSchema = z.object({
    prompt: z.string().describe('A descriptive prompt for an AI image generator to create a relevant image.'),
    url: z.string().describe('A placeholder URL for the image. Use https://placehold.co/1024x576.png'),
    'data-ai-hint': z.string().describe('One or two keywords for an image search, e.g., "futuristic brain"'),
});

const VideoScriptSchema = z.object({
    title: z.string().describe('The title of the short video.'),
    script: z.string().describe('A simple, scene-by-scene script for a short promotional video (approx. 60 seconds).'),
});

const ContentCampaignOutputSchema = z.object({
  article: ArticleSchema,
  socialPosts: z.array(SocialPostSchema).describe('An array of social media posts, one for Twitter and one for LinkedIn.'),
  images: z.array(ImageSchema).describe('An array of 2-3 diverse, relevant image prompts and placeholders.'),
  videoScript: VideoScriptSchema,
});
export type ContentCampaignOutput = z.infer<typeof ContentCampaignOutputSchema>;


export async function generateContentCampaign(input: ContentCampaignInput): Promise<ContentCampaignOutput> {
  return contentCampaignFlow(input);
}

const prompt = ai.definePrompt({
  name: 'contentCampaignPrompt',
  input: {schema: ContentCampaignInputSchema},
  output: {schema: ContentCampaignOutputSchema},
  prompt: `You are an expert marketing and content creation assistant.

Given the user's prompt, generate a complete content campaign. The campaign must include:
1. A full blog post/article.
2. Two social media posts: one for Twitter and one for LinkedIn, to promote the article.
3. A list of 2-3 diverse and creative prompts for an AI image generator to create visuals for the campaign. Also provide placeholder URLs.
4. A short video script for a 60-second promotional video.

User Prompt: {{{prompt}}}
`,
  model: 'googleai/gemini-1.5-flash-latest',
});

const contentCampaignFlow = ai.defineFlow(
  {
    name: 'contentCampaignFlow',
    inputSchema: ContentCampaignInputSchema,
    outputSchema: ContentCampaignOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    
    // Replace placeholder URLs with dynamic Unsplash links
    if (output?.images) {
      output.images.forEach(image => {
        const keywords = image['data-ai-hint'].split(' ').join(',');
        image.url = `https://source.unsplash.com/1024x576/?${keywords}`;
      });
    }
    
    return output!;
  }
);
