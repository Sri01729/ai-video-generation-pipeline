import axios from 'axios';
import fs from 'fs/promises';
import path from 'path';

interface ModelslabImageConfig {
  key?: string; // API key (optional, will use process.env.MODELSLAB_IMG_API_KEY if not provided)
  prompt: string;
  negative_prompt?: string;
  width?: number;
  height?: number;
  safety_checker?: boolean;
  seed?: number | null;
  samples?: number;
  base64?: boolean;
  webhook?: string | null;
  track_id?: string | null;
  enhance_prompt?: boolean;
  enhance_style?: string;
  // ...add more as needed
}

/**
 * Generate a single image from text using Modelslab's Realtime Text-to-Image API.
 * Loads API key from process.env.MODELSLAB_IMG_API_KEY if not provided.
 * @returns The local file path and remote URL of the generated image.
 */
export async function modelslabTextToImageGenerator({
  key,
  prompt,
  negative_prompt = '',
  width = 512,
  height = 512,
  safety_checker = false,
  seed = null,
  samples = 1,
  base64 = false,
  webhook = null,
  track_id = null,
  enhance_prompt = false,
  enhance_style = '',
  ...rest
}: ModelslabImageConfig & { outDir?: string }) {
  const apiKey = key || process.env.MODELSLAB_IMG_API_KEY;
  if (!apiKey) throw new Error('Modelslab API key not provided (key or MODELSLAB_IMG_API_KEY)');
  const outDir = rest.outDir || path.resolve(process.cwd(), 'results', 'modelslab-images');
  await fs.mkdir(outDir, { recursive: true });

  const body = {
    key: apiKey,
    prompt,
    negative_prompt,
    width,
    height,
    safety_checker,
    seed,
    samples,
    base64,
    webhook,
    track_id,
    enhance_prompt,
    enhance_style,
    ...rest,
  };

  console.log('[Modelslab] Requesting image generation...');
  let response;
  try {
    response = await axios.post('https://modelslab.com/api/v6/realtime/text2img', body, {
      headers: { 'Content-Type': 'application/json' },
      timeout: 60000,
    });
  } catch (err) {
    throw new Error('[Modelslab] API request failed: ' + (err instanceof Error ? err.message : String(err)));
  }

  const data = response.data;
  if (data.status === 'success' && Array.isArray(data.output) && data.output.length > 0) {
    const imageUrl = data.output[0];
    const filename = `modelslab_${Date.now()}.png`;
    const outPath = path.join(outDir, filename);
    console.log('[Modelslab] Downloading image:', imageUrl);
    try {
      const imageRes = await axios.get(imageUrl, { responseType: 'arraybuffer' });
      await fs.writeFile(outPath, imageRes.data);
      console.log('[Modelslab] Image saved to:', outPath);
      return { outPath, imageUrl };
    } catch (err) {
      throw new Error('[Modelslab] Failed to download image: ' + (err instanceof Error ? err.message : String(err)));
    }
  } else if (data.status === 'processing' && data.fetch_result) {
    // Queued/processing: poll the fetch_result URL until ready
    const fetchUrl = data.fetch_result;
    console.log('[Modelslab] Image is processing. Polling:', fetchUrl);
    let attempts = 0;
    while (attempts < 30) { // up to ~5 min
      await new Promise(res => setTimeout(res, 10000));
      attempts++;
      const pollRes = await axios.get(fetchUrl);
      const pollData = pollRes.data;
      if (pollData.status === 'success' && Array.isArray(pollData.output) && pollData.output.length > 0) {
        const imageUrl = pollData.output[0];
        const filename = `modelslab_${Date.now()}.png`;
        const outPath = path.join(outDir, filename);
        console.log('[Modelslab] Downloading image:', imageUrl);
        const imageRes = await axios.get(imageUrl, { responseType: 'arraybuffer' });
        await fs.writeFile(outPath, imageRes.data);
        console.log('[Modelslab] Image saved to:', outPath);
        return { outPath, imageUrl };
      } else if (pollData.status === 'error') {
        throw new Error('[Modelslab] Image generation failed: ' + pollData.message);
      } else {
        console.log(`[Modelslab] Still processing... (attempt ${attempts})`);
      }
    }
    throw new Error('[Modelslab] Image generation timed out after polling.');
  } else {
    throw new Error('[Modelslab] Unexpected API response: ' + JSON.stringify(data));
  }
}

// --- MAIN TEST FUNCTION ---
if (require.main === module) {
  (async () => {
    const API_KEY = process.env.MODELSLAB_IMG_API_KEY || '';
    if (!API_KEY) {
      console.error('❌ MODELSLAB_IMG_API_KEY not set in environment variables');
      process.exit(1);
    }
    // Example prompt (replace with your own or read from file)
    const prompt = 'Photorealistic scene of a happy family celebrating indoors, with the child showing off a shiny medal. Bright, colorful clothing, cheerful expressions, and vibrant decorations create a lively, festive mood. Warm lighting enhances the joyful atmosphere.';
    try {
      const result = await modelslabTextToImageGenerator({ key: API_KEY, prompt });
      console.log('\n🖼️ Image generation result:');
      console.log('File:', result.outPath);
      console.log('URL:', result.imageUrl);
    } catch (err) {
      console.error('❌ Image generation test failed:', err);
      process.exit(1);
    }
  })();
}