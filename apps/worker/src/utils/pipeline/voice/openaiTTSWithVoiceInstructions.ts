import { generateScriptWithVoiceInstructions } from '../script/openaiScriptWithVoiceInstructions';
import { experimental_generateSpeech as generateSpeech } from 'ai';
import { openai } from '@ai-sdk/openai';
import fs from 'fs';

/**
 * Generate narration script and TTS instructions, then synthesize audio with OpenAI TTS.
 * @param prompt - The user prompt for narration
 * @param outPath - The output path for the audio file
 * @param voice - (optional) The OpenAI TTS voice to use (default: 'nova')
 * @param chatModel - (optional) The OpenAI chat model to use (default: 'gpt-4o')
 * @param ttsModel - (optional) The OpenAI TTS model to use (default: 'gpt-4o-mini-tts')
 * @returns { script, tts_instructions, audioPath }
 */
export async function openaiTTSWithVoiceInstructions({
  prompt,
  outPath,
  voice = 'nova',
  chatModel = 'gpt-4.1-nano',
  ttsModel = 'gpt-4o-mini-tts',
}: {
  prompt: string;
  outPath: string;
  voice?: string;
  chatModel?: string;
  ttsModel?: string;
}) {
  // Step 1: Generate script and TTS instructions (chat model)
  const { text } = await generateScriptWithVoiceInstructions({ prompt, model: chatModel });
  let script = '';
  let tts_instructions = '';
  try {
    const parsed = JSON.parse(text);
    script = parsed.prompt;
    tts_instructions = parsed.tts_instructions;
    // Log the selected instructions for debugging
    console.log('[TTS] Selected instructions:', tts_instructions);
  } catch (err) {
    throw new Error('Failed to parse model output as JSON: ' + text);
  }

  // Step 2: Synthesize audio (TTS model)
  const result = await generateSpeech({
    model: openai.speech(ttsModel),
    text: script,
    voice,
    instructions: tts_instructions,
    providerOptions: { openai: {} },
  });
  if (result.audio && result.audio.uint8Array) {
    fs.writeFileSync(outPath, Buffer.from(result.audio.uint8Array));
  } else {
    throw new Error('Unexpected audio result from OpenAI TTS');
  }

  return { script, tts_instructions, audioPath: outPath };
}