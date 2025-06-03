import Bull from 'bull';
import dotenv from 'dotenv';
dotenv.config();

const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';

async function testQueue() {
  const queue = new Bull('test-queue', { redis: redisUrl });
  console.log('Adding test job to queue...');
  const job = await queue.add({ hello: 'world', time: new Date().toISOString() }, { delay: 10000 });
    console.log('Test job added:', job.id);
//   await queue.clean(0, 'completed');
  await queue.close();
}

testQueue().catch(console.error);