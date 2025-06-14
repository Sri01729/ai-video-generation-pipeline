// apps/worker/src/queues/videoProcessor.ts
import Bull from 'bull';
import dotenv from 'dotenv';
import { runFullPipeline } from '../utils/runFullPipeline';
import { emitProgress } from '../../../../packages/shared/wsServer';
import path from 'path';
import { OutputManager } from '../utils/pipeline/output/outputManager';
import generateVideoScript from '../utils/pipeline/script/openaiScriptGenerator';
import fs from 'fs';
import { openaiTTS } from '../utils/pipeline/voice/openaiTTS';
import { openaiImageGenerator }  from '../utils/pipeline/images/openaiImageGenerator';

dotenv.config();

const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';

// Use the same queue configuration as the backend
const videoQueue = new Bull('video-generation', {
  redis: redisUrl,
  settings: {
    lockDuration: 600000, // 10 minutes
    maxStalledCount: 3
  }
});

// Modular job processor
async function processJob(
  job: Bull.Job<any>,
  updateProgress: (percent: number, step: string) => void
) {
  const { scriptOnly, imageOnly, voiceOnly } = job.data;

  if (scriptOnly) {
    // Script-only job
    const om = new OutputManager();
    const runDir = om.setupRunDirs(job.data.prompt || 'script');
    updateProgress(10, 'Script Generation');
    const scriptDir = path.join(runDir, 'script');
    const result = await generateVideoScript({
      prompt: job.data.prompt,
      persona: job.data.persona,
      style: job.data.style,
      maxLength: job.data.maxLength,
      model: job.data.model,
      provider: job.data.provider,
      outputDir: scriptDir,
      promptStyle: job.data.promptStyle
    });
    updateProgress(100, 'Script Generation Complete');
    return { output: result.filePath, script: result.script };
  }

  if (voiceOnly) {
    // Voice-only job
    const om = new OutputManager();
    const runDir = om.setupRunDirs('voice');
    updateProgress(10, 'Voice Generation');
    const audioDir = path.join(runDir, 'audio');
    fs.mkdirSync(audioDir, { recursive: true });
    const audioPath = path.join(audioDir, 'voice.mp3');
    // Use your TTS function, e.g. openaiTTS or resembleTTS
    await openaiTTS({ input: job.data.script, outPath: audioPath });
    updateProgress(100, 'Voice Generation Complete');
    const resultsDir = path.resolve(process.cwd(), 'results');
    const relativePath = path.relative(resultsDir, audioPath);
    return { output: audioPath, audioUrl: `/results/${relativePath.replace(/\\/g, '/')}` };
  }

  if (imageOnly) {
    // Image-only job
    const om = new OutputManager();
    const runDir = om.setupRunDirs('image');
    updateProgress(10, 'Image Generation');
    const imageDir = path.join(runDir, 'images');
    fs.mkdirSync(imageDir, { recursive: true });
    const imagePath = path.join(imageDir, 'output.png');
    // Call your image generation function here (replace with your actual function)
    await openaiImageGenerator({ prompt: job.data.prompt, style: job.data.style, outPath: imagePath });

    // Read the image as a buffer and return as base64
    const imageBuffer = fs.readFileSync(imagePath);
    updateProgress(100, 'Image Generation Complete');
    return { output: imagePath, imageBuffer: imageBuffer.toString('base64'), imageReady: true };
  }

  // TODO: Add imageOnly and voiceOnly processors here if needed

  // Default: full pipeline
  const resultPath = await runFullPipeline(job.data, updateProgress);
  return { output: resultPath };
}

// Process video generation jobs
videoQueue.process(async (job: Bull.Job<any>) => {
  console.log('Worker received video job:', job.id, job.data);

  try {
    const updateProgress = (percent: number, step: string) => {
      job.progress(percent);
      emitProgress(job.id.toString(), `${percent}%`);
      console.log(`[videoProcessor] Job ${job.id} progress: ${percent}% - Step: ${step}`);
    };

    const result = await processJob(job, updateProgress);

    emitProgress(job.id.toString(), 'done');
    console.log('Worker finished video job:', job.id, result);
    return result;

  } catch (err) {
    console.error('Worker failed video job:', job.id, err);
    throw err;
  }
});

// Event handlers for better logging
videoQueue.on('completed', (job, result) => {
  console.log(`Job ${job.id} completed successfully:`, result);
});

videoQueue.on('failed', (job, err) => {
  console.error(`Job ${job?.id} failed:`, err.message);
});

videoQueue.on('stalled', (job) => {
  console.warn(`Job ${job.id} stalled`);
});

videoQueue.on('progress', (job, progress) => {
  console.log(`Job ${job.id} progress: ${progress}%`);
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('Received SIGTERM, closing video queue...');
  await videoQueue.close();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('Received SIGINT, closing video queue...');
  await videoQueue.close();
  process.exit(0);
});

export { videoQueue };