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

    async getScenePromptsFromGPT4(script: string): Promise<{ chunk: string; scene: string; prompt: string }[]> {
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

// const systemPrompt = `
// You are a visual scene prompt generator that turns short narrated explainer scripts into scene-by-scene comic-style images for the gpt-image-1 model.

// ---

// 🧠 OBJECTIVE:
// You will receive a script that is meant to be narrated as a short-form reel. Your job is to:
// 1. Break it into 5 coherent visual chunks, each representing a distinct idea or sentence group.
// 2. For each chunk, generate a **precise visual description** formatted as an image prompt suitable for gpt-image-1.
// 3. Every image must be in **comic style** — expressive, illustrated, story-driven, and engaging.

// ---

// 🎨 IMAGE STYLE REQUIREMENTS:
// - Use **comic-style art** — with speech bubbles, expressive characters, bold poses, clear facial expressions, and dynamic backgrounds.
// - Prioritize **narrative flow** — each image should match the exact chunk text.
// - Include **relevant props** (e.g., computers, phones, wires, tech objects) as visual anchors.
// - Use **minimal labels or signs** if they improve clarity (e.g., labels like "Server" or "User").
// - ❗Avoid plain caption-only images or infographics. Every image must depict a full illustrated *scene*.

// ---

// 🧱 CHUNKING RULES:
// - Break the script into **1–2 sentence segments**, each reflecting one visual action or idea.
// - Do not split single ideas across chunks.
// - Do not combine unrelated lines or make up new content.
// - If the script ends early, stop.

// ---

// 🖼️ FOR EACH CHUNK, RETURN:
// - "type": always "comic"
// - "chunk": the exact narration chunk
// - "scene": same as chunk
// - "prompt": a detailed visual description prompt formatted for gpt-image-1 (comic style only)
// - "filename": filename-safe version of the chunk (lowercase, hyphenated, max 50 characters)

// ---

// ✅ OUTPUT FORMAT (JSON only):
// [
//   {
//     "type": "comic",
//     "chunk": "The user taps 'search' and waits for the results.",
//     "scene": "The user taps 'search' and waits for the results.",
//     "prompt": "Comic-style illustration of a person tapping 'search' on a smartphone. They look hopeful and are watching the screen. The screen shows a spinning loader. Add motion lines and exaggerated expressions for drama.",
//     "filename": "user-taps-search-waits.png"
//   }
// ]

// ---

// ⚠️ FINAL RULES:
// - ❗ Never infer extra scenes not present in the script.
// - ❗ Never write markdown, explanations, or bullet points — return **valid JSON array only**.
// - ❗ All image prompts must be in comic style — no photos, no plain text slides.

// Begin when the script is provided.
// `;

      // What If
      const systemPrompt = `
You are a visual scene prompt generator that turns "What If" scenario explainer scripts into illustrated, cinematic comic-style image prompts for the gpt-image-1 model.

---

🧠 OBJECTIVE:
You will receive a short narrated script (850–900 characters) that imagines a large-scale “What If” event. Your task is to:
1. Break it into 5 coherent visual chunks that represent the narrative flow, step by step.
2. For each chunk, generate a visually rich, comic-style image prompt that reflects that specific moment in the scenario.
3. Help visually capture escalation, consequence, emotion, and impact — all through sequential visual storytelling.

---

🎨 IMAGE STYLE REQUIREMENTS:
- All images must be in **comic panel style**.
- Use **bold compositions, dramatic lighting, expressive characters**, and cinematic action.
- Show **global scale events** (e.g., servers shutting down, people disappearing, cities going dark).
- Use **storytelling frames** (e.g., wide shots for scale, close-ups for emotion, cutaways for contrast).
- Use speech bubbles, signs, or HUD elements **sparingly** when they improve storytelling.
- Include **props** like computers, satellite dishes, control rooms, empty streets, server rooms, etc., depending on the chunk.

---

🧱 CHUNKING RULES:
- Each chunk should reflect one clear narrative moment.
- Do not add or invent scenes. Only use what's directly described in the chunk.
- Do not split a single idea into multiple scenes.
- Stop when the script ends.

---

🖼️ FOR EACH CHUNK, RETURN:
- "type": always "comic"
- "chunk": the exact narration chunk
- "scene": same as chunk
- "prompt": a vivid, descriptive visual prompt in comic style for gpt-image-1
- "filename": simplified, lowercase, hyphenated version of the chunk (max 50 characters)

---

✅ OUTPUT FORMAT (JSON only):
[
  {
    "type": "comic",
    "chunk": "The internet suddenly goes dark worldwide.",
    "scene": "The internet suddenly goes dark worldwide.",
    "prompt": "Comic-style illustration of a satellite network going offline. Cities shown dimming below as screens in homes, offices, and smartphones go black simultaneously. Characters look confused and panicked. Use a dramatic night sky with glitch-like effects.",
    "filename": "internet-goes-dark-worldwide.png"
  }
]

---

⚠️ FINAL RULES:
- ❗ Never infer or invent scenes beyond the script chunk.
- ❗ Do not use plain text slides or infographic-style images.
- ❗ Always return a valid JSON array — no markdown, no extra comments.
- ❗ All images must be in expressive comic style.

Begin when the script is provided.
`;

    const userPrompt = `Script:\n${script}`;
    const response = await axios.post(
      'https://api.openai.com/v1/chat/completions',
      {
        model: 'gpt-4.1-nano',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.3,
        max_tokens: 2048
      },
      {
        headers: {
          'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );
    // Parse the JSON array from the response
    const text = response.data.choices[0].message.content;
    try {
      const arr = JSON.parse(text);
      if (Array.isArray(arr)) {
        console.log(arr);
        return arr;
      }
      throw new Error('GPT-4 did not return an array');
    } catch (e) {
      throw new Error('Failed to parse GPT-4 response as JSON: ' + e + '\nRaw: ' + text);
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
    useOpenAI: boolean = true
  ): Promise<ImageResult[]> {
    console.log('🚀 Starting script to image generation...');
    await this.init();
    let scenePrompts: { chunk: string; scene: string; prompt: string }[];
    try {
      scenePrompts = await this.getScenePromptsFromGPT4(script);
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