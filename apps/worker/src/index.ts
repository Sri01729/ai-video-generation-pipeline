import dotenv from 'dotenv';
import logger from './utils/logger';
dotenv.config();

try {
  logger.info('Worker service started. Ready to process jobs.');
  // TODO: import and start queue consumers
  // FIXME: Job retry logic is too aggressive, tune backoff strategy
} catch (err) {
  logger.error('Worker startup error:', err);
  process.exit(1);
}