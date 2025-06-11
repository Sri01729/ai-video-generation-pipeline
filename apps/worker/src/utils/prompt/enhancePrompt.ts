import { generateText } from 'ai';
import { openai } from '@ai-sdk/openai';

/**
 * Enhance a user prompt for clarity, creativity, and effectiveness using OpenAI via Vercel AI SDK.
 * Returns the improved prompt as a string.
 */
export async function enhancePrompt(prompt: string): Promise<string> {
  if (!prompt) return prompt;
  const systemPrompt = "You are a prompt engineer. Improve the following prompt for clarity, creativity, and effectiveness, but keep the user's intent.";
  const { text } = await generateText({
    model: openai('gpt-4o-mini'),
    prompt: `${systemPrompt}\n\n${prompt}`,
    maxTokens: 200,
    temperature: 0.7,
  });
  return text?.trim() || prompt;
}