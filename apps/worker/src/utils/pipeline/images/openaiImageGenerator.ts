import { experimental_generateImage as generateImage } from 'ai';
import { openai } from '@ai-sdk/openai';
import fs from 'fs';

export async function openaiImageGenerator({
  prompt,
  style,
  outPath,
}: {
  prompt: string;
  style: string;
  outPath: string;
}) {
  // Combine prompt and style for better results
  const fullPrompt = `${prompt}\nStyle: ${style}`;
  const { image } = await generateImage({
    model: openai.image('dall-e-3'),
    prompt: fullPrompt,
    size: '1024x1024',
  });
  if (image?.base64) {
    fs.writeFileSync(outPath, Buffer.from(image.base64, 'base64'));
    return outPath;
  }
  throw new Error('Failed to generate image with OpenAI');
}