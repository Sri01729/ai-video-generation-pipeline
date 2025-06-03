// `You are a visual generation assistant that creates educational illustrations based on individual script sentences. Each sentence describes a single moment or idea from an explainer video.

// Your job is to turn each sentence into a crystal-clear prompt that can be used with an AI image model to generate a meaningful flat-style illustration.

// These prompts must work for **any topic** — not just programming — and adapt to the content of the sentence provided.

// ---

// 🎨 STYLE RULES:
// - Use flat, cartoon-style visuals with soft colors (light blue or white background)
// - Layout must be clean, readable, and focused
// - Avoid clutter, shadows, gradients, or infographic styling

// 🧩 LAYOUT LOGIC:
// - If the sentence describes a **process**, show a left-to-right flow with arrows
// - If the sentence involves **people, metaphors, or roles**, visualize them as characters or icons
// - If the sentence is **conceptual**, use visual metaphors that match the idea (e.g., teamwork → gears working together)

// 🔤 LABELING:
// - Include clear, simple text labels on or near key icons or figures
// - Labels should match terms mentioned in the sentence (e.g., "Student", "Task", "AI Model")
// - Avoid long paragraphs — keep text in visuals short and educational

// ---

// 🎯 OUTPUT FORMAT:
// When you receive a sentence, return only the image generation prompt that:
// - Describes the scene visually
// - Mentions layout and elements
// - Includes labels if needed

// DO NOT return explanation, context, or intro text. Return **only** the pure image prompt.

// Example:

// Input: "The brain processes information while you sleep."

// Output: "Generate a flat-style educational illustration showing a sleeping person in bed with light blue surroundings. Above their head, show a semi-transparent brain with gears and thought bubbles labeled 'memory', 'problem solving', and 'creativity'. Use a left-to-right soft glow effect to show information flow through the brain."

// ---

// This system prompt can be used for science, psychology, education, tech, philosophy — any topic that needs clean, instructive visuals for explainer content.
// "

import fs from 'fs/promises';
import path from 'path';
import axios from 'axios';
import 'dotenv/config';
import slugify from 'slugify';
import OpenAI from 'openai';
import { generateText, experimental_generateImage } from 'ai';
import { openai } from '@ai-sdk/openai';
import { google } from '@ai-sdk/google';
import { anthropic } from '@ai-sdk/anthropic';
import { cohere } from '@ai-sdk/cohere';

interface Scene {
  id: number;
  content: string;
}

interface ImageResult {
  sceneId: number;
  filename: string;
  filepath: string;
  prompt: string;
  url?: string;
  chunk: string;
  scene: string;
}

class ScriptImageGenerator {
  apiKey: string;
  outputDir: string;
  baseImagePrompt: string;
  openai: OpenAI;

  constructor(apiKey: string, outputDir: string = 'public/images') {
    this.apiKey = apiKey;
    this.outputDir = outputDir;
    this.baseImagePrompt =
      'flat-style educational illustration, clean design, soft colors, light blue or white background';
    this.openai = new OpenAI({ apiKey: this.apiKey });
  }

  async init(): Promise<void> {
    try {
      await fs.mkdir(this.outputDir, { recursive: true });
      console.log(`✅ Output directory created: ${this.outputDir}`);
    } catch (error: unknown) {
      if (error instanceof Error) {
        console.error('❌ Error creating output directory:', error.message);
      } else {
        console.error('❌ Error creating output directory:', error);
      }
    }
  }

  async getScenePromptsFromGPT4(
    script: string,
    provider: 'openai' | 'google' | 'anthropic' | 'cohere' = 'openai',
    model?: string
  ): Promise<{ chunk: string; scene: string; prompt: string }[]> {
    //      const systemPrompt = `
    // You are a visual scene breakdown engine designed to generate image prompts from explainer scripts using real world meme-style images only.

    // Your task:
    // 1. Receive a short script (approx. 850–900 characters) intended for a 60-second voiceover.
    // 2. Break the script into a reasonable number of coherent, logically flowing visual scenes (typically 10).
    // 3. For each chunk, use only the exact chunk text — do not infer or add ideas.
    // 4. For each chunk, return:
    //    - "type": always set to "meme"
    //    - "chunk": the portion of the script (1–2 sentences)
    //    - "scene": the same as "chunk" (for downstream compatibility)
    //    - "prompt": a gpt-image-1-ready image prompt in meme style that visually represents only what's in the chunk — no extra details
    //    - "filename": a simplified, filename-safe version of the chunk

    // ---

    // CHUNKING RULES:
    // - Each chunk must represent exactly one visual moment or idea from the script
    // - Do not combine ideas across chunks or infer extra context
    // - Do not split a single thought or metaphor across two chunks
    // - ❗ Do not add any extra scenes or content beyond what is present in the input script. If the script ends early, stop.

    // ---

    // IMAGE STYLE GUIDELINES:
    // - Always generate meme-style images
    // - Use expressive characters, funny scenarios, tech/dev culture, or metaphor-based workplace humor
    // - Visual storytelling only — do not generate slides with plain text or captions
    // - Convey explanations using characters, actions, scenes, props, or metaphors — not written text
    // - Use speech bubbles or signs **only when needed** for humor or clarity, not as replacements for narration

    // ---

    // OUTPUT FORMAT:
    // Return a JSON array with each object containing:
    // - "type": always "meme"
    // - "chunk": the original script chunk
    // - "scene": same as chunk
    // - "prompt": a DALL·E 3-compatible image prompt strictly based on this chunk only
    // - "filename": filename-safe, lowercase, hyphenated version of the chunk (max 50 characters)

    // Example:
    // [
    //   {
    //     "type": "meme",
    //     "chunk": "Frontend sends the request and chills while backend sweats.",
    //     "scene": "Frontend sends the request and chills while backend sweats.",
    //     "prompt": "Scene of a relaxed frontend developer lounging in a beanbag chair, sipping coffee. In another room, a backend developer sweats at a server rack. Add labels 'Frontend' and 'Backend' as signs or labels on desks.",
    //     "filename": "frontend-chills-backend-sweats.png"
    //   }
    // ]

    // ❗ Do not include markdown, commentary, or explanations. Return the JSON array only.
    // `;

    const systemPrompt = `
You are a visual scene prompt generator that turns short narrated explainer scripts into scene-by-scene photorealistic images for the gpt-image-1 model.

---

🧠 OBJECTIVE:
You will receive a script that is meant to be narrated as a short-form reel. Your job is to:
1. Break it into 5 coherent visual chunks, each representing a distinct idea or sentence group.
2. For each chunk, generate a **precise visual description** formatted as an image prompt suitable for gpt-image-1.
3. Every image must be **photorealistic** — natural lighting, authentic environments, real people, and believable scenarios.

---

🎨 IMAGE STYLE REQUIREMENTS:
- Use **photorealistic style** — natural human expressions, authentic environments, professional lighting, and realistic proportions.
- Focus on **cinematic composition** — well-framed shots with depth of field, proper lighting, and engaging camera angles.
- Include **relevant props and environments** (e.g., modern offices, realistic tech setups, authentic workspaces) as visual anchors.
- Use **environmental storytelling** through backgrounds, clothing, and context clues.
- Prioritize **human emotion and body language** to convey the narrative effectively.
- ❗Avoid staged or artificial-looking scenes. Every image should feel like a candid moment or professional photograph.

---

🧱 CHUNKING RULES:
- Break the script into **1–2 sentence segments**, each reflecting one visual action or idea.
- Do not split single ideas across chunks.
- Do not combine unrelated lines or make up new content.
- If the script ends early, stop.

---

🖼️ FOR EACH CHUNK, RETURN:
- "type": always "realistic"
- "chunk": the exact narration chunk
- "scene": same as chunk
- "prompt": a detailed visual description prompt formatted for gpt-image-1 (photorealistic style with specific details about lighting, composition, setting, and human subjects)
- "filename": filename-safe version of the chunk (lowercase, hyphenated, max 50 characters)

---

✅ OUTPUT FORMAT (JSON only):
[
  {
    "type": "realistic",
    "chunk": "The user taps 'search' and waits for the results.",
    "scene": "The user taps 'search' and waits for the results.",
    "prompt": "Photorealistic close-up shot of a person's finger tapping the search button on a modern smartphone screen. Natural lighting from a window, shallow depth of field focusing on the phone. The person has an expectant expression, looking down at the device. Clean, modern environment in the background.",
    "filename": "user-taps-search-waits.png"
  }
]

---

⚠️ FINAL RULES:
- ❗ Never infer extra scenes not present in the script.
- ❗ Never write markdown, explanations, or bullet points — return **valid JSON array only**.
- ❗ All image prompts must be photorealistic — no illustrations, no cartoons, no artificial-looking scenes.
- ❗ Include specific details about lighting, camera angles, environment, and human subjects for better AI image generation.
- ❗ Ensure all scenes feel authentic and could realistically happen in the described context.

Begin when the script is provided.
`;

    const userPrompt = `Script:\n${script}`;

    // Select model instance
    let modelInstance;
    switch (provider) {
      case 'google':
        modelInstance = google(model || 'models/gemini-2.0-flash');
        break;
      case 'anthropic':
        modelInstance = anthropic(model || 'claude-3-opus-20240229');
        break;
      case 'cohere':
        modelInstance = cohere(model || 'command');
        break;
      case 'openai':
      default:
        modelInstance = openai(model || 'gpt-4o');
        break;
    }

    // Use Vercel AI SDK for prompt generation
    const prompt = `${userPrompt}`;
    const result = await generateText({
      model: modelInstance,
      system: systemPrompt,
      prompt,
      maxTokens: 2048,
      temperature: 0.3
    });
    const text = result.text;
    try {
      const arr = JSON.parse(text);
      if (Array.isArray(arr)) {
        console.log(arr);
        return arr;
      }
      throw new Error('Model did not return an array');
    } catch (e) {
      throw new Error('Failed to parse model response as JSON: ' + e + '\nRaw: ' + text);
    }
  }

  async generateImageStabilityAI(prompt: string, sceneId: number, filename: string, chunk: string, scene: string): Promise<ImageResult | null> {
    try {
      console.log(`🎨 Generating image for scene ${sceneId}...`);
      const response = await axios({
        method: 'POST',
        url: 'https://api.stability.ai/v1/generation/stable-diffusion-xl-1024-v1-0/text-to-image',
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        data: {
          text_prompts: [
            { text: prompt, weight: 1 },
            { text: 'blurry, bad quality, distorted, low resolution, watermark', weight: -1 },
          ],
          cfg_scale: 7,
          height: 1024,
          width: 1024,
          steps: 30,
          samples: 1,
        },
      });
      if (response.data.artifacts && response.data.artifacts.length > 0) {
        const imageData = response.data.artifacts[0].base64;
        const filepath = path.join(this.outputDir, filename);
        await fs.writeFile(filepath, imageData, 'base64');
        console.log(`✅ Image saved: ${filename}`);
        return { sceneId, filename, filepath, prompt, chunk, scene };
      } else {
        throw new Error('No image data received');
      }
    } catch (error: unknown) {
      if (error instanceof Error) {
        console.error(`❌ Error generating image for scene ${sceneId}:`, error.message);
      } else {
        console.error(`❌ Error generating image for scene ${sceneId}:`, error);
      }
      return null;
    }
  }

  async generateImageOpenAI(prompt: string, sceneId: number, filename: string, chunk: string, scene: string): Promise<ImageResult | null> {
    try {
      console.log(`🎨 Generating image for scene ${sceneId} with OpenAI SDK...`);
      const result = await this.openai.images.generate({
        model: 'gpt-image-1',
        prompt: prompt,
        size: '1024x1536',
        quality: 'medium',
        n: 1
      });
      if (result.data && result.data.length > 0 && result.data[0].b64_json) {
        const image_base64 = result.data[0].b64_json;
        const image_bytes = Buffer.from(image_base64, 'base64');
        const filepath = path.join(this.outputDir, filename);
        await fs.writeFile(filepath, image_bytes);
        console.log(`✅ Image saved: ${filename}`);
        return { sceneId, filename, filepath, prompt, chunk, scene };
      } else {
        throw new Error('No image data received');
      }
    } catch (error: unknown) {
      if (error instanceof Error) {
        console.error(`❌ Error generating image for scene ${sceneId}:`, error.message);
      } else {
        console.error(`❌ Error generating image for scene ${sceneId}:`, error);
      }
      return null;
    }
  }

  async generateImagesFromScript(
    script: string,
    generalPrompt: string = '',
    useOpenAI: boolean = true,
    provider: 'openai' | 'google' | 'anthropic' | 'cohere' = 'openai',
    model?: string
  ): Promise<ImageResult[]> {
    console.log('🚀 Starting script to image generation...');
    await this.init();
    let scenePrompts: { chunk: string; scene: string; prompt: string }[];
    try {
      scenePrompts = await this.getScenePromptsFromGPT4(script, provider, model);
    } catch (err) {
      throw new Error('Failed to get scene prompts from GPT-4: ' + (err instanceof Error ? err.message : err));
    }
    console.log(`📝 Processing ${scenePrompts.length} scenes`);
    // --- BATCHING LOGIC (commented out for now, keep for future use) ---
    /*
    const BATCH_SIZE = 5;
    const allResults: ImageResult[] = [];
    if (useOpenAI) {
      const batchStart = Date.now();
      console.log(`[BATCH] Starting parallel image generation at ${new Date(batchStart).toISOString()}`);
      for (let i = 0; i < scenePrompts.length; i += BATCH_SIZE) {
        const batch = scenePrompts.slice(i, i + BATCH_SIZE);
        const results = await Promise.all(
          batch.map(async ({ chunk, scene, prompt }, idx) => {
            const globalIdx = i + idx + 1;
            const start = Date.now();
            console.log(`[START] Scene ${globalIdx} at ${new Date(start).toISOString()}`);
            const chunkText = chunk || scene || `scene_${globalIdx}`;
            const filename = `${slugify(chunkText.substring(0, 60), { lower: true, strict: true })}.png`;
            const sceneText = scene || chunkText;
            const result = await this.generateImageOpenAI(prompt, globalIdx, filename, chunkText, scene);
            const end = Date.now();
            console.log(`[DONE]  Scene ${globalIdx} at ${new Date(end).toISOString()} (took ${(end - start) / 1000}s)`);
            return result;
          })
        );
        allResults.push(...(results.filter(Boolean) as ImageResult[]));
      }
      const batchEnd = Date.now();
      console.log(`\n🎉 Generation complete! Created ${allResults.length} images`);
      console.log(`[BATCH] All images done at ${new Date(batchEnd).toISOString()} (total time: ${(batchEnd - batchStart) / 1000}s)`);
      await this.generateReport(allResults, script.length);
      return allResults;
    */
    // --- END BATCHING LOGIC ---
    // --- SIMPLE LIMIT TO 5 IMAGES ---
    const limitedScenePrompts = scenePrompts.slice(0, 5);
    if (useOpenAI) {
      const batchStart = Date.now();
      console.log(`[BATCH] Starting parallel image generation at ${new Date(batchStart).toISOString()}`);
      const results = await Promise.all(
        limitedScenePrompts.map(async ({ chunk, scene, prompt }, idx) => {
          const start = Date.now();
          console.log(`[START] Scene ${idx + 1} at ${new Date(start).toISOString()}`);
          const chunkText = chunk || scene || `scene_${idx + 1}`;
          const filename = `${slugify(chunkText.substring(0, 60), { lower: true, strict: true })}.png`;
          const sceneText = scene || chunkText;
          const result = await this.generateImageOpenAI(prompt, idx + 1, filename, chunkText, scene);
          const end = Date.now();
          console.log(`[DONE]  Scene ${idx + 1} at ${new Date(end).toISOString()} (took ${(end - start) / 1000}s)`);
          return result;
        })
      );
      const batchEnd = Date.now();
      const filtered = results.filter(Boolean) as ImageResult[];
      console.log(`\n🎉 Generation complete! Created ${filtered.length} images`);
      console.log(`[BATCH] All images done at ${new Date(batchEnd).toISOString()} (total time: ${(batchEnd - batchStart) / 1000}s)`);
      await this.generateReport(filtered, script.length);
      return filtered;
    } else {
      // Serial for Stability AI (unchanged)
      const results: ImageResult[] = [];
      for (const [idx, { chunk, scene, prompt }] of scenePrompts.entries()) {
        const chunkText = chunk || scene || `scene_${idx + 1}`;
        const filename = `${slugify(chunkText.substring(0, 60), { lower: true, strict: true })}.png`;
        const sceneText = scene || chunkText;
        const start = Date.now();
        console.log(`[START] Scene ${idx + 1} at ${new Date(start).toISOString()}`);
        const result = await this.generateImageStabilityAI(prompt, idx + 1, filename, chunkText, scene);
        const end = Date.now();
        if (result) {
          results.push(result);
        }
        console.log(`[DONE]  Scene ${idx + 1} at ${new Date(end).toISOString()} (took ${(end - start) / 1000}s)`);
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }
      const batchEnd = Date.now();
      console.log(`\n🎉 Generation complete! Created ${results.length} images`);
      console.log(`[BATCH] All images done at ${new Date(batchEnd).toISOString()}`);
      await this.generateReport(results, script.length);
      return results;
    }
  }

  async generateReport(results: ImageResult[], scriptLength: number): Promise<void> {
    const report = {
      timestamp: new Date().toISOString(),
      scriptLength,
      totalScenes: results.length,
      successfulGenerations: results.filter((r) => r !== null).length,
      images: results.map((r) => ({
        sceneId: r.sceneId,
        filename: r.filename,
        prompt: r.prompt.substring(0, 100) + '...',
      })),
    };
    const reportPath = path.join(this.outputDir, 'generation_report.json');
    await fs.writeFile(reportPath, JSON.stringify(report, null, 2));
    console.log(`📊 Report saved: generation_report.json`);
  }
}

export default ScriptImageGenerator;

// Usage example
// if (require.main === module) {
//   (async () => {
//     const API_KEY = process.env.OPENAI_API_KEY ?? '';
//     // Read runDir from run_dir.txt
//     const runDir = (await fs.readFile('run_dir.txt', 'utf-8')).trim();
//     const scriptDir = path.join(runDir, 'script');
//     const imageOutDir = path.join(runDir, 'images');
//     // Find the first .txt file in scriptDir
//     const scriptFiles = await fs.readdir(scriptDir);
//     const scriptFile = scriptFiles.find(f => f.endsWith('.txt'));
//     if (!scriptFile) {
//       console.error('No script file found in script folder');
//       process.exit(1);
//     }
//     const scriptPath = path.join(scriptDir, scriptFile);
//     let script: string;
//     try {
//       script = await fs.readFile(scriptPath, 'utf-8');
//     } catch (err) {
//       console.error(
//         `Failed to read script.txt: ${err instanceof Error ? err.message : err}`
//       );
//       process.exit(1);
//     }
//     const generator = new ScriptImageGenerator(API_KEY, imageOutDir);
//     await generator.generateImagesFromScript(script, '', true);
//   })();
// }

// Package.json dependencies needed:
/*
{
  "dependencies": {
    "axios": "^1.6.0",
    "form-data": "^4.0.0"
  }
}
*/