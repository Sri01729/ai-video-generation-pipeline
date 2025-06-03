import Bull from 'bull';
import dotenv from 'dotenv';
import { runFullPipeline } from '../utils/runFullPipeline';

dotenv.config();

const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';

const videoQueue = new Bull('video-generation', { redis: redisUrl });

videoQueue.process(async (job) => {
  console.log('Worker received video job:', job.id, job.data);
  try {
    const resultPath = await runFullPipeline(
      job.data,
      (percent, _step) => job.progress(percent)
    );
    console.log('Worker finished video job:', job.id, resultPath);
    return { output: resultPath };
  } catch (err) {
    console.error('Worker failed video job:', job.id, err);
    throw err;
  }
});

videoQueue.on('failed', (job, err) => {
  console.error('Worker failed video job:', job?.id, err);
});