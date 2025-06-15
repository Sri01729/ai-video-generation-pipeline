import 'dotenv/config';
import fs from 'fs/promises';
import path from 'path';
import { modelslabTextToVideoGenerator } from './modelslabTextToVideoGenerator';
import { generateText } from 'ai';
import { openai } from '@ai-sdk/openai';
import slugify from 'slugify';
import crypto from 'crypto';

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
  openaiApiKey: string;
  outputDir: string;
  basePrompt: string;

  constructor(apiKey?: string, outputDir: string = 'results/modelslab-videos', openaiApiKey?: string) {
    this.apiKey = apiKey || process.env.MODELSLAB_API_KEY || '';
    this.outputDir = outputDir;
    this.basePrompt = 'cinematic, photorealistic, high quality';
    this.openaiApiKey = openaiApiKey || process.env.OPENAI_API_KEY || '';
    if (!this.apiKey) {
      throw new Error('Modelslab API key is missing. Set MODELSLAB_VIDEO_API_KEY in your environment or pass it to the constructor.');
    }
    if (!this.openaiApiKey) {
      throw new Error('OpenAI API key is missing. Set OPENAI_API_KEY in your environment or pass it to the constructor.');
    }
  }

  async init(): Promise<void> {
    await fs.mkdir(this.outputDir, { recursive: true });
  }

  async getScenePromptsFromScript(
    script: string,
    provider: 'openai' = 'openai',
    model: string = 'gpt-4o'
  ): Promise<{ chunk: string; scene: string; prompt: string; filename: string }[]> {
    const systemPrompt = `
You are a **visual-scene breakdown engine** that converts a ≈1 000-character (≈60-second) script into text-to-video prompts **guaranteeing identical recurring characters** and **5-second scene timing**.

────────────────────────────
GLOBAL SCENE & LENGTH RULES
────────────────────────────
• Always output **5 chunks** (no more, no less).
• Each chunk = one complete visual beat lasting **≈5 seconds**.
• Aim for **75-90 characters** (≈13-15 words) per chunk so narration fits 5 s at 150 wpm.
• Do NOT merge different ideas or split one idea across chunks. Stop when 5 chunks are made.

────────────────────────────
CHARACTER CONSISTENCY
────────────────────────────
1. Detect the first chunk that explicitly describes a human.
   → Copy every visible attribute verbatim as **CHARACTER_SIGNATURE**.
2. Prepend CHARACTER_SIGNATURE (unchanged) to the *prompt* field of **every** chunk that involves that person.
3. If later dialogue adds NEW wardrobe for the *same* person, append it once to CHARACTER_SIGNATURE & reuse.
4. For a new person, create NEW_SIGNATURE_X and treat it the same way.
5. If the script never describes anyone, set
   CHARACTER_SIGNATURE = "(adult protagonist, neutral clothing, no distinctive features)"
   and reuse it.

────────────────────────────
PROMPT STYLE  (for "prompt")
────────────────────────────
Write **one paragraph** broken by literal '\\n' characters, following THIS exact skeleton:

► Camera move + shot type + setting & time.
► (CHARACTER_SIGNATURE) if present.
► Subject action & appearance.
► Background & environment details.
► Lighting, weather, colour, lens / VFX.
► Mood & cinematic qualities (depth-of-field, flares, etc.).
► Clear end beat / transition cue.

⚠️ **Visuals only** — no dialogue, voice-over, internal thoughts, or seed notes.

★ Keep the wording style identical to the reference below; change only concrete nouns & adjectives to fit the chunk.

*Reference format (do not alter structure)*
\`Slow-motion tracking shot, night-time cyber-punk city in heavy rain.  \\nCamera dolly is low and moving forward, following a determined young woman (early 20s, light-olive skin, short tousled dark hair soaked with rain) striding straight toward lens.  \\nShe wears a wet brown leather bomber jacket with black tee, slim black leather pants, combat boots; faint neon reflections ripple across the jacket and puddled street.  \\nBackground: vibrant out-of-focus billboards, holographic shop signs, passing silhouettes under umbrellas; falling rain streaks lit by neon blues, magentas, oranges.  \\nPavement gleams like glass, mirroring city lights.  \\nOccasional lightning flicker in skybox; subtle lens flares and rain droplets on virtual camera lens.  \\nMood: tense yet empowering, cinematic, high contrast, shallow depth of field, volumetric mist around streetlamps.  \\nEnd with the woman walking past camera, jacket hem whipping in the wind, splash of her final step sends droplets toward lens; cut to black with reverb of footsteps.\`

────────────────────────────
OUTPUT JSON
────────────────────────────
Return **only** a JSON array (no markdown):

[
  {
    "chunk":    "<original 75-90-char script excerpt>",
    "scene":    "<same as chunk>",
    "prompt":   "<cinematic visual description prefixed with CHARACTER_SIGNATURE>",
    "filename": "<filename-safe, lowercase, hyphenated excerpt ≤50 chars>"
  },
  … (total 5 objects)
]
`;



    const userPrompt = `Script:\n${script}`;
    const result = await generateText({
      model: openai(model),
      system: systemPrompt,
      prompt: userPrompt,
      maxTokens: 2048,
      temperature: 0.3
    });
    let text = result.text.trim();
    // Remove code block markers if present
    if (text.startsWith('```')) {
      text = text.replace(/^```[a-zA-Z]*\n?/, '').replace(/```$/, '').trim();
    }
    try {
      const arr = JSON.parse(text);
      if (Array.isArray(arr)) {
        console.log('[getScenePromptsFromScript] Parsed result:', arr);
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
    // Generate a single random seed for this batch
    const seed = Math.floor(Math.random() * 1e9);
    console.log(`[Modelslab] Using seed for all videos: ${seed}`);
    // Generate a unique track_id for this job
    const track_id = crypto.randomUUID();
    // Get webhook URL from env or fallback
    const webhookUrl = process.env.MODELSLAB_WEBHOOK_URL || 'https://yourdomain.com/api/modelslab-webhook';
    // SERIAL video generation to avoid rate limits
    const videoResults: (VideoResult | null)[] = [];
    for (let idx = 0; idx < limitedScenePrompts.length; idx++) {
      const { chunk, scene, prompt, filename } = limitedScenePrompts[idx];
      const videoPrompt = generalPrompt ? `${generalPrompt}, ${prompt}` : prompt;
      try {
        const { outPath, videoUrl } = await modelslabTextToVideoGenerator({
          key: this.apiKey,
          prompt: videoPrompt,
          ...modelslabConfig,
          seed, // use the same seed for all videos
          outDir: this.outputDir,
          webhook: webhookUrl,
          track_id,
        });
        console.log(`[Video] Scene ${idx + 1} generated: ${outPath}`);
        videoResults.push({
          sceneId: idx + 1,
          filename: path.basename(outPath),
          filepath: outPath,
          prompt: videoPrompt,
          videoUrl,
          chunk,
          scene,
        });
      } catch (err) {
        console.error(`[Video] Failed to generate video for scene ${idx + 1}:`, err);
        videoResults.push(null);
      }
      // Add a delay between requests to avoid rate limits
      await new Promise(res => setTimeout(res, 2000));
    }
    // Filter out any failed (null) results
    const filteredResults = videoResults.filter(Boolean) as VideoResult[];
    // Write generation_report.json for downstream sync
    const report = {
      timestamp: new Date().toISOString(),
      scriptLength: script.length,
      totalScenes: filteredResults.length,
      successfulGenerations: filteredResults.length,
      videos: filteredResults.map(r => ({
        sceneId: r.sceneId,
        filename: r.filename,
        prompt: r.prompt,
        chunk: r.chunk,
        scene: r.scene
      }))
    };
    const reportPath = path.join(this.outputDir, 'generation_report.json');
    await fs.writeFile(reportPath, JSON.stringify(report, null, 2));
    console.log(`📊 Video generation report saved: ${reportPath}`);
    return filteredResults;
  }
}

// --- MAIN TEST FUNCTION ---
if (require.main === module) {
  (async () => {
    const API_KEY = process.env.MODELSLAB_IMG_API_KEY || '';
    if (!API_KEY) {
      console.error('❌ MODELSLAB_API_KEY not set in environment variables');
      process.exit(1);
    }
    // Example script (replace with your own or read from file)
    const script = `The afternoon sun slants through the open doorway as laughter drifts across the yard. Inside, a father sorts through scattered bills at the kitchen table, shoulders heavy with worry. A burst of quick footsteps rattles the porch boards. Two children rush in, cheeks glowing, a bright medal swinging between them. They call for their dad, voices tumbling, excitement too big to hold. He looks up, wonder blooming as they press the cool disk into his palm. Their story spills out—how the race felt endless, how legs burned, how they heard his voice saying, "one more stride." Tears lace his smile; heaviness lifts, replaced by the gleam of their triumph. He gathers them close; laughter mingles with the wall clock's tick, sealing the moment. The medal catches light and scatters tiny stars across the ceiling, glinting like a promise kept. A breeze nudges the doorway, lifting papers to drift like white confetti across the floor`;
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