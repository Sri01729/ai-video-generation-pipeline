import { experimental_generateSpeech as generateSpeech } from 'ai';
import { openai } from '@ai-sdk/openai';
import fs from 'fs';

export async function openaiTTS({
  input,
    instructions = `Accent/Affect: Warm, refined, and gently instructive, reminiscent of a friendly art instructor.

Tone: Calm, encouraging, and articulate, clearly describing each step with patience.

Pacing: Slow and deliberate, pausing often to allow the listener to follow instructions comfortably.

Emotion: Cheerful, supportive, and pleasantly enthusiastic; convey genuine enjoyment and appreciation of art.

Pronunciation: Clearly articulate artistic terminology (e.g., "brushstrokes," "landscape," "palette") with gentle emphasis.

Personality Affect: Friendly and approachable with a hint of sophistication; speak confidently and reassuringly, guiding users through each painting step patiently and warmly.`,

  outPath = 'output.wav',
}: {
  input: string;
  instructions?: string;
  outPath?: string;
}): Promise<string> {
  const result = await generateSpeech({
    model: openai.speech('tts-1'),
    text: input,
    voice: 'sage',
    instructions,
    providerOptions: { openai: {} },
  });
  if (result.audio && result.audio.uint8Array) {
    fs.writeFileSync(outPath, Buffer.from(result.audio.uint8Array));
    return outPath;
  }
  throw new Error('Unexpected audio result from OpenAI TTS');
}

// Example usage (uncomment to test directly):
// (async () => {
//   const out = await openaiTTS({ input: 'Hello from OpenAI TTS!', instructions: 'Friendly tone', outPath: 'openai-tts.wav' });
//   console.log('Audio saved to', out);
// })();