import Bull from 'bull';
import dotenv from 'dotenv';
dotenv.config();

const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';

export const videoQueue = new Bull('video-generation', {
  redis: redisUrl,
  settings: {
    lockDuration: 600000,
    maxStalledCount: 3
  }
});

console.log('Bull queue created with redis:', redisUrl);

export async function addVideoJob(data: any) {
  return videoQueue.add(data, {
    removeOnComplete: false,
    removeOnFail: false
  });
}

export async function getJob(jobId: string) {
  return videoQueue.getJob(jobId);
}