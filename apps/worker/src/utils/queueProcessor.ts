import Bull from 'bull';
import dotenv from 'dotenv';
dotenv.config();

const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';

const queue = new Bull('test-queue', { redis: redisUrl });

queue.process(async (job) => {
  console.log('Worker received job:', job.id, job.data);
});

queue.on('completed', (job) => {
  console.log('Worker completed job:', job.id);
});

queue.on('failed', (job, err) => {
  console.error('Worker failed job:', job?.id, err);
});