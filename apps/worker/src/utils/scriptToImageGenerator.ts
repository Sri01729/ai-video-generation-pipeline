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

  constructor(apiKey: string, outputDir: string = 'public/images') {
    this.apiKey = apiKey;
    this.outputDir = outputDir;
    this.baseImagePrompt =
      'flat-style educational illustration, clean design, soft colors, light blue or white background';
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
     const systemPrompt = `You are a visual scene breakdown engine designed to generate realistic image prompts from explainer scripts.

Your task:
1. Receive a short script (approx. 850–900 characters) intended for a 60-second voiceover.
2. Break the script into exactly 10 coherent, logically flowing visual scenes.
3. For each scene, return:
   - \"chunk\": the portion of the script for that scene (1–2 sentences)
   - \"scene\": the scene text
   - \"prompt\": a DALL·E 3-ready prompt describing a realistic photographic image for that chunk
   - \"filename\": an image name like \"{chunk-text}.png\" so that the images are named like the chunks

---

  CHUNKING STRATEGY:
- Divide the script evenly into 10 meaningful parts
- Each chunk must describe one complete visual idea or step in the narrative
- Maintain story flow and don't split metaphors or actions mid-sentence

---

  IMAGE STYLE GUIDELINES:
- Realistic photography style (DSLR quality)
- Natural lighting and believable human environments (e.g., restaurants, homes, offices, parks)
- Avoid illustration, cartoon, surrealism, or overly stylized elements

---

 OUTPUT FORMAT:
Return a JSON array with exactly 10 objects, each with:
- \"chunk\": the script sentence(s) for this visual moment
- \"scene\": the scene text
- \"prompt\": the corresponding realistic image prompt
- \"filename\": a file name matching the chunk order

Format example:
[
  {
    "chunk": "You place your order and sit back, doing other things.",
    "prompt": "Photorealistic image of a man seated at a modern restaurant counter, casually scrolling his phone. Behind the counter, chefs in white uniforms cook in an open kitchen. Ambient warm lighting.",
    "filename": "You place your order and sit back, doing other things..png"
  },
  ...
]

Do not return markdown or commentary — only the pure JSON array.

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
      console.log(`🎨 Generating image for scene ${sceneId} with OpenAI...`);
      const response = await axios({
        method: 'POST',
        url: 'https://api.openai.com/v1/images/generations',
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        data: {
          model: 'dall-e-3',
          prompt: prompt,
          n: 1,
          size: '1024x1024',
          quality: 'standard',
        },
      });
      if (response.data.data && response.data.data.length > 0) {
        const imageUrl = response.data.data[0].url;
        const imageResponse = await axios({
          method: 'GET',
          url: imageUrl,
          responseType: 'arraybuffer',
        });
        const filepath = path.join(this.outputDir, filename);
        await fs.writeFile(filepath, imageResponse.data);
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
    const results: ImageResult[] = [];
    for (const [idx, { chunk, scene, prompt }] of scenePrompts.entries()) {
      const chunkText = chunk || scene || `scene_${idx + 1}`;
      const filename = `${slugify(chunkText.substring(0, 60), { lower: true, strict: true })}.png`;
      console.log(`\n--- Processing Scene ${idx + 1} ---`);
      const sceneText = scene || chunkText;
      console.log(`Chunk: ${chunkText.substring(0, 100)}...`);
      console.log(`Scene: ${sceneText.substring(0, 100)}...`);
      console.log(`Prompt: ${prompt.substring(0, 150)}...`);
      const result = useOpenAI
        ? await this.generateImageOpenAI(prompt, idx + 1, filename, chunkText, scene)
        : await this.generateImageStabilityAI(prompt, idx + 1, filename, chunkText, scene);
      if (result) {
        results.push(result);
      }
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }
    console.log(`\n🎉 Generation complete! Created ${results.length} images`);
    await this.generateReport(results, script.length);
    return results;
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
if (require.main === module) {
  (async () => {
    const API_KEY = process.env.OPENAI_API_KEY ?? '';
    const USE_OPENAI = true;
    const generator = new ScriptImageGenerator(API_KEY);
    const scriptPath = path.join(__dirname, '../../../../public/scripts/script.txt');
    let incomingScript: string;
    try {
      incomingScript = await fs.readFile(scriptPath, 'utf-8');
    } catch (err) {
      throw new Error(`Failed to read script.txt: ${err instanceof Error ? err.message : err}`);
    }

    let scenePrompts: { chunk: string; scene: string; prompt: string }[];
    try {
      scenePrompts = await generator.getScenePromptsFromGPT4(incomingScript);
    } catch (err) {
      throw new Error('Failed to get scene prompts from GPT-4: ' + (err instanceof Error ? err.message : err));
    }

    await generator.init();
    const results: ImageResult[] = [];
    for (const [idx, { chunk, scene, prompt }] of scenePrompts.entries()) {
      const chunkText = chunk || scene || `scene_${idx + 1}`;
      const filename = `${slugify(chunkText.substring(0, 60), { lower: true, strict: true })}.png`;
      console.log(`\n--- Processing Scene ${idx + 1} ---`);
      const sceneText = scene || chunkText;
      console.log(`Chunk: ${chunkText.substring(0, 100)}...`);
      console.log(`Scene: ${sceneText.substring(0, 100)}...`);
      console.log(`Prompt: ${prompt.substring(0, 150)}...`);
      const result = await generator.generateImageOpenAI(prompt, idx + 1, filename, chunkText, scene);
      if (result) results.push(result);
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }
    console.log(`\n🎉 Generation complete! Created ${results.length} images`);
    await generator.generateReport(results, incomingScript.length);
    console.log('\n🏁 Final Results:');
    console.log(`✅ Successfully generated ${results.length} images`);
    console.log(`📁 Images saved in: ${generator.outputDir}`);
  })();
}

// Package.json dependencies needed:
/*
{
  "dependencies": {
    "axios": "^1.6.0",
    "form-data": "^4.0.0"
  }
}
*/