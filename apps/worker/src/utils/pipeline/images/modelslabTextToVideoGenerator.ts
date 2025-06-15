import axios from 'axios';
import fs from 'fs/promises';
import path from 'path';

interface ModelslabVideoConfig {
  key: string; // API key
  model_id?: 'cogvideox' | 'wanx';
  prompt: string;
  negative_prompt?: string;
  height?: number;
  width?: number;
  num_frames?: number;
  num_inference_steps?: number;
  guidance_scale?: number;
  output_type?: 'mp4' | 'gif';
  seed?: number | null;
  portrait?: boolean;
  resolution?: number;
  fps?: number;
  // ...add more as needed
}

// Helper: download with retry on 404
async function downloadWithRetry(url: string, outPath: string, maxAttempts = 5, delayMs = 3000) {
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      const videoRes = await axios.get(url, { responseType: 'arraybuffer' });
      await fs.writeFile(outPath, videoRes.data);
      return true;
    } catch (err: any) {
      if (err.response && err.response.status === 404) {
        if (attempt < maxAttempts) {
          console.warn(`[Modelslab] Video not found (404). Retrying in ${delayMs / 1000}s... (attempt ${attempt})`);
          await new Promise(res => setTimeout(res, delayMs));
        } else {
          throw new Error('[Modelslab] Video still not available after retries (404).');
        }
      } else {
        throw err;
      }
    }
  }
  return false;
}

/**
 * Generate a video from text using Modelslab's Text-to-Video API.
 * @returns The local file path and remote URL of the generated video.
 */
export async function modelslabTextToVideoGenerator({
  key,
  model_id = 'cogvideox',
  prompt,
  negative_prompt = 'blurry, low quality, pixelated, deformed, mutated, disfigured, bad anatomy, extra limbs, missing limbs, unrealistic motion, glitch, noisy, oversaturated, underexposed, overexposed, poor lighting, low contrast, unnatural colors, jpeg artifacts, watermark, text, signature, cut off, cropped, stretched, distorted face, bad proportions, duplicated limbs, broken body, grain, flickering, frame skipping, motion blur, unrealistic shadows, low detail, low resolution, compression artifacts, out of frame',
  portrait = true,
  num_frames = 81,
  num_inference_steps = 25,
  guidance_scale = 5,
  resolution = 480,
  output_type = 'mp4',
  seed = null,
  fps = 16,
  webhook = null,
  track_id = null,
  ...rest
}: ModelslabVideoConfig & { outDir?: string, webhook?: string | null, track_id?: string | null }) {
  // Auto-load API key from env if not provided
  const apiKey = key || process.env.MODELSLAB_VIDEO_API_KEY;
  if (!apiKey) {
    throw new Error('Modelslab API key not provided. Set MODELSLAB_VIDEO_API_KEY in your environment or pass key explicitly.');
  }
  const outDir = rest.outDir || path.resolve(process.cwd(), 'results', 'modelslab-videos');
  await fs.mkdir(outDir, { recursive: true });

  const body = {
    key: apiKey,
    model_id,
    prompt,
    negative_prompt,
    portrait,
    num_frames,
    num_inference_steps,
    guidance_scale,
    output_type,
    seed,
    fps,
    webhook,
    track_id,
    ...rest,
  };

  console.log('[Modelslab] Requesting video generation...');
  let response;
  try {
    response = await axios.post('https://modelslab.com/api/v6/video/text2video_ultra', body, {
      headers: { 'Content-Type': 'application/json' },
      timeout: 60000,
    });
  } catch (err) {
    throw new Error('[Modelslab] API request failed: ' + (err instanceof Error ? err.message : String(err)));
  }

  const data = response.data;
  if (data.status === 'success' && Array.isArray(data.output) && data.output.length > 0) {
    const videoUrl = data.output[0];
    const filename = `modelslab_${Date.now()}.${output_type}`;
    const outPath = path.join(outDir, filename);
    console.log('[Modelslab] Downloading video:', videoUrl);
    try {
      await downloadWithRetry(videoUrl, outPath);
      console.log('[Modelslab] Video saved to:', outPath);
      return { outPath, videoUrl };
    } catch (err) {
      throw new Error('[Modelslab] Failed to download video: ' + (err instanceof Error ? err.message : String(err)));
    }
  } else if (data.status === 'processing' && data.fetch_result) {
    // Queued/processing: poll the fetch_result URL until ready
    const fetchUrl = data.fetch_result;
    console.log('[Modelslab] Video is processing. Polling:', fetchUrl);
    let attempts = 0;
    while (attempts < 30) { // up to ~5 min
      await new Promise(res => setTimeout(res, 10000));
      attempts++;
      const pollRes = await axios.post(fetchUrl, { key });
      const pollData = pollRes.data;
      if (pollData.status === 'success' && Array.isArray(pollData.output) && pollData.output.length > 0) {
        const videoUrl = pollData.output[0];
        const filename = `modelslab_${Date.now()}.${output_type}`;
        const outPath = path.join(outDir, filename);
        console.log('[Modelslab] Downloading video:', videoUrl);
        try {
          await downloadWithRetry(videoUrl, outPath);
          console.log('[Modelslab] Video saved to:', outPath);
          return { outPath, videoUrl };
        } catch (err) {
          throw new Error('[Modelslab] Failed to download video: ' + (err instanceof Error ? err.message : String(err)));
        }
      } else if (pollData.status === 'error') {
        throw new Error('[Modelslab] Video generation failed: ' + pollData.message);
      } else {
        console.log(`[Modelslab] Still processing... (attempt ${attempts})`);
      }
    }
    throw new Error('[Modelslab] Video generation timed out after polling.');
  } else {
    throw new Error('[Modelslab] Unexpected API response: ' + JSON.stringify(data));
  }
}

// --- MAIN TEST FUNCTION ---
if (require.main === module) {
  (async () => {
    const API_KEY = process.env.MODELSLAB_IMG_API_KEY || '';
    if (!API_KEY) {
      console.error('❌ MODELSLAB_VIDEO_API_KEY not set in environment variables');
      process.exit(1);
    }
    // Example prompt (replace with your own or read from file)
    const prompt = 'A man chases another man through a smoky urban alley as explosions erupt behind them, camera tracking close-up, gritty lighting, fast-paced motion.';
    const seed = Math.floor(Math.random() * 1e9);
    try {
      const result = await modelslabTextToVideoGenerator({
        key: API_KEY,
        prompt,
        seed,
        portrait: true,
        negative_prompt: undefined,
        resolution: 480,
        num_frames: 81,
        num_inference_steps: 25,
        guidance_scale: 5,
        fps: 16,
      });
      console.log('\n🎬 Video generation result:');
      console.log('File:', result.outPath);
      console.log('URL:', result.videoUrl);
    } catch (err) {
      console.error('❌ Video generation test failed:', err);
      process.exit(1);
    }
  })();
}