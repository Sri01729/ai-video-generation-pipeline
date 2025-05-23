import dotenv from 'dotenv';
import logger from './utils/logger';
import { generateVideoScript } from './utils/openaiScriptGenerator';
dotenv.config();

try {
  logger.info('Worker service started. Ready to process jobs.');
  // TEMP: Test OpenAI script generation
  (async () => {
    try {
      const script = await generateVideoScript('A 30-second explainer about how solar panels work');
      logger.info('Generated script: ' + script);
    } catch (err) {
      logger.error('OpenAI script generation error:', err);
    }
  })();
  // TODO: import and start queue consumers
  // FIXME: Job retry logic is too aggressive, tune backoff strategy
} catch (err) {
  logger.error('Worker startup error:', err);
  process.exit(1);
}