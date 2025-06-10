// apps/worker/src/queues/videoProcessor.ts
import Bull from 'bull';
import dotenv from 'dotenv';
import { runFullPipeline } from '../utils/runFullPipeline';
import { emitProgress } from '../../../../packages/shared/wsServer';

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

// Process video generation jobs
videoQueue.process(async (job) => {
  console.log('Worker received video job:', job.id, job.data);

  try {
    // Update progress callback
    const updateProgress = (percent: number, step: string) => {
      job.progress(percent);
      emitProgress(job.id.toString(), `${percent}%`);
      console.log(`[videoProcessor] Job ${job.id} progress: ${percent}% - Step: ${step}`);
    };

    const resultPath = await runFullPipeline(
      job.data,
      updateProgress
    );

    emitProgress(job.id.toString(), 'done');
    console.log('Worker finished video job:', job.id, resultPath);
    return { output: resultPath };

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