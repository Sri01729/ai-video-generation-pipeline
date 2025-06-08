import Bull from 'bull';
import dotenv from 'dotenv';
import { runFullPipeline } from '../utils/runFullPipeline';
import { emitProgress } from '../../../../packages/shared/wsServer';

dotenv.config();

const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';

const videoQueue = new Bull('video-generation', { redis: redisUrl });

videoQueue.process(async (job) => {
  console.log('Worker received video job:', job.id, job.data);
  try {
    const resultPath = await runFullPipeline(
      job.data,
      (percent, step) => {
        job.progress(percent);
        // Map step to progress step string for frontend
        const stepMap = {
          'Script Generation': 'script',
          'Script Generated': 'script',
          'Voice Generation': 'voiceover',
          'Voice Generated': 'voiceover',
          'Audio Mixing': 'voiceover',
          'Audio Mixed': 'voiceover',
          'Subtitle Generation': 'processing',
          'Subtitles Generated': 'processing',
          'Image Generation': 'images',
          'Images Generated': 'images',
          'Video Assembly': 'assembly',
          'Images Stitched to Video': 'assembly',
          'Attaching Audio to Video': 'assembly',
          'Audio Attached': 'assembly',
          'Burning Subtitles': 'processing',
          'Done': 'done',
        };
        const mappedStep = (stepMap as Record<string, string>)[step] || 'processing';
        emitProgress(String(job.id), mappedStep);
      }
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