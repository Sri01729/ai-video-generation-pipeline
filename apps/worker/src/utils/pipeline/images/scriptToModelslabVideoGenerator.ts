import fs from 'fs/promises';
import path from 'path';
import { modelslabTextToVideoGenerator } from './modelslabTextToVideoGenerator';
import { generateText } from 'ai';
import { openai } from '@ai-sdk/openai';
import slugify from 'slugify';

interface Scene {
  id: number;
  content: string;
}

interface VideoResult {
  sceneId: number;
  filename: string;
  filepath: string;
  prompt: string;
  videoUrl?: string;
  chunk: string;
  scene: string;
}

class ScriptToModelslabVideoGenerator {
  apiKey: string;
  outputDir: string;
  basePrompt: string;

  constructor(apiKey: string, outputDir: string = 'results/modelslab-videos') {
    this.apiKey = apiKey;
    this.outputDir = outputDir;
    this.basePrompt = 'cinematic, photorealistic, high quality';
  }

  async init(): Promise<void> {
    await fs.mkdir(this.outputDir, { recursive: true });
  }

  async getScenePromptsFromScript(
    script: string,
    provider: 'openai' = 'openai',
    model: string = 'gpt-4o'
  ): Promise<{ chunk: string; scene: string; prompt: string; filename: string }[]> {
    // Use the same chunking and prompt logic as scriptToImageGenerator
    const systemPrompt = `
You are a visual scene breakdown engine designed to generate video prompts from explainer scripts.

Your task:
1. Receive a short script (approx. 850–900 characters) intended for a 60-second voiceover.
2. Break the script into a reasonable number of coherent, logically flowing visual scenes (typically 5).
3. For each chunk, use only the exact chunk text — do not infer or add ideas.
4. For each chunk, return:
   - "chunk": the portion of the script (1–2 sentences)
   - "scene": the same as "chunk"
   - "prompt": a cinematic, photorealistic video prompt that visually represents only what's in the chunk — no extra details
   - "filename": a simplified, filename-safe version of the chunk

CHUNKING RULES:
- Each chunk must represent exactly one visual moment or idea from the script
- Do not combine ideas across chunks or infer extra context
- Do not split a single thought or metaphor across two chunks
- Do not add any extra scenes or content beyond what is present in the input script. If the script ends early, stop.

OUTPUT FORMAT:
Return a JSON array with each object containing:
- "chunk": the original script chunk
- "scene": same as chunk
- "prompt": a Modelslab video prompt strictly based on this chunk only
- "filename": filename-safe, lowercase, hyphenated version of the chunk (max 50 characters)

Do not include markdown, commentary, or explanations. Return the JSON array only.
`;
    const userPrompt = `Script:\n${script}`;
    const result = await generateText({
      model: openai(model),
      system: systemPrompt,
      prompt: userPrompt,
      maxTokens: 2048,
      temperature: 0.3
    });
    const text = result.text;
    try {
      const arr = JSON.parse(text);
      if (Array.isArray(arr)) {
        return arr.map((item: any) => ({
          ...item,
          filename: item.filename || slugify(item.chunk || item.scene || 'scene', { lower: true, strict: true }).substring(0, 50) + '.mp4'
        }));
      }
      throw new Error('Model did not return an array');
    } catch (e) {
      throw new Error('Failed to parse model response as JSON: ' + e + '\nRaw: ' + text);
    }
  }

  async generateVideosFromScript(
    script: string,
    generalPrompt: string = '',
    provider: 'openai' = 'openai',
    model: string = 'gpt-4o',
    modelslabConfig: Partial<Omit<Parameters<typeof modelslabTextToVideoGenerator>[0], 'prompt' | 'key'>> = {}
  ): Promise<VideoResult[]> {
    await this.init();
    let scenePrompts: { chunk: string; scene: string; prompt: string; filename: string }[];
    try {
      scenePrompts = await this.getScenePromptsFromScript(script, provider, model);
    } catch (err) {
      throw new Error('Failed to get scene prompts: ' + (err instanceof Error ? err.message : err));
    }
    const limitedScenePrompts = scenePrompts.slice(0, 5);
    const results: VideoResult[] = [];
    // Use Promise.all for parallel video generation
    const videoResults = await Promise.all(limitedScenePrompts.map(async ({ chunk, scene, prompt, filename }, idx) => {
      const videoPrompt = generalPrompt ? `${generalPrompt}, ${prompt}` : prompt;
      try {
        const { outPath, videoUrl } = await modelslabTextToVideoGenerator({
          key: this.apiKey,
          prompt: videoPrompt,
          ...modelslabConfig,
          outDir: this.outputDir,
        });
        console.log(`[Video] Scene ${idx + 1} generated: ${outPath}`);
        return {
          sceneId: idx + 1,
          filename: path.basename(outPath),
          filepath: outPath,
          prompt: videoPrompt,
          videoUrl,
          chunk,
          scene,
        };
      } catch (err) {
        console.error(`[Video] Failed to generate video for scene ${idx + 1}:`, err);
        return null;
      }
    }));
    // Filter out any failed (null) results
    return videoResults.filter(Boolean) as VideoResult[];
  }
}

// --- MAIN TEST FUNCTION ---
if (require.main === module) {
  (async () => {
    const API_KEY = process.env.MODELSLAB_API_KEY || '';
    if (!API_KEY) {
      console.error('❌ MODELSLAB_API_KEY not set in environment variables');
      process.exit(1);
    }
    // Example script (replace with your own or read from file)
    const script = `The sun rises over a bustling city. People hurry to work, coffee in hand. A child waves goodbye to their parent at the school gate. Traffic flows steadily as the day begins. The city comes alive with energy and hope.`;
    const generator = new ScriptToModelslabVideoGenerator(API_KEY);
    try {
      const results = await generator.generateVideosFromScript(script);
      console.log('\n🎬 Video generation results:');
      results.forEach((res, i) => {
        console.log(`Scene ${i + 1}:`, res.filepath, res.videoUrl);
      });
    } catch (err) {
      console.error('❌ Video generation test failed:', err);
      process.exit(1);
    }
  })();
}

export default ScriptToModelslabVideoGenerator;