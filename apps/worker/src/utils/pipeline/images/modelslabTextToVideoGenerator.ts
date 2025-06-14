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

/**
 * Generate a video from text using Modelslab's Text-to-Video API.
 * @returns The local file path and remote URL of the generated video.
 */
export async function modelslabTextToVideoGenerator({
  key,
  model_id = 'cogvideox',
  prompt,
  negative_prompt = '',
  height = 512,
  width = 512,
  num_frames = 16,
  num_inference_steps = 20,
  guidance_scale = 7,
  output_type = 'mp4',
  seed = null,
  portrait,
  resolution = 480,
  fps = 16,
  ...rest
}: ModelslabVideoConfig & { outDir?: string }) {
  const outDir = rest.outDir || path.resolve(process.cwd(), 'results', 'modelslab-videos');
  await fs.mkdir(outDir, { recursive: true });

  const body = {
    key,
    model_id,
    prompt,
    negative_prompt,
    height,
    width,
    num_frames,
    num_inference_steps,
    guidance_scale,
    output_type,
    seed,
    portrait,
    resolution,
    fps,
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
      const videoRes = await axios.post(videoUrl, {}, { responseType: 'arraybuffer' });
      await fs.writeFile(outPath, videoRes.data);
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
        const videoRes = await axios.post(videoUrl, {}, { responseType: 'arraybuffer' });
        await fs.writeFile(outPath, videoRes.data);
        console.log('[Modelslab] Video saved to:', outPath);
        return { outPath, videoUrl };
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