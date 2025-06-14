import { generateText, tool } from 'ai';
import { openai } from '@ai-sdk/openai';
import { z } from 'zod';
import { getVoiceInstructionsHandler } from './getVoiceInstructionsHandler';

// Tool definition for AI-SDK tool calling
const getVoiceInstructionsTool = tool({
  description: 'Returns the detailed OpenAI-TTS instructions for a given voice style',
  parameters: z.object({
    style: z.string().describe('One of the predefined voice styles, e.g. dramatic, cowboy, professional …'),
  }),
  execute: async ({ style }) => getVoiceInstructionsHandler({ style }),
});

// System prompt for Maaya-Narrator
const SYSTEM_PROMPT = `
You are Maaya-Narrator.
Goal: turn any user request into a JSON object with:
  • prompt            – the narration script
  • tts_instructions  – the full instruction string for the chosen voice style

Process:
  1. If the user explicitly names a style/tone that matches our catalog, use it.
  2. Else infer the best style from the prompt.
  3. Call get_voice_instructions(style=…) to fetch the long TTS instructions.
  4. Reply to the user with:
       {
         "prompt": "<your final narration>",
         "tts_instructions": "<value returned by the function>"
       }
  5. No extra keys, no markdown, valid JSON only.
Catalog keys: dramatic, cowboy, sympathetic, sincere, bedtime-story, eternal-optimist, true-crime-buff, sports-coach, auctioneer, chill-surfer, friendly, patient-teacher, smooth-jazz-dj, connoisseur, nyc-cabbie, medieval-knight, professional, santa, robot, fitness-instructor, old-timey, cheerleader, emo-teenager, pirate, mad-scientist, noir-detective, gourmet-chef, calm.
If uncertain, default to professional.
`;

// Main function to generate script and TTS instructions
export async function generateScriptWithVoiceInstructions({ prompt, maxSteps = 3, model = 'gpt-4.1-nano' }: { prompt: string, maxSteps?: number, model?: string }) {
  const { text, steps } = await generateText({
    model: openai(model),
    tools: { get_voice_instructions: getVoiceInstructionsTool },
    maxSteps,
    system: SYSTEM_PROMPT,
    prompt,
  });

  // The final output should be a JSON object with prompt and tts_instructions
  // The model is instructed to output this directly, but you can parse/validate if needed
  return { text, steps };
}