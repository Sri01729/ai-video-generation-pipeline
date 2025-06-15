// apps/backend/src/app.ts
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import rateLimit from 'express-rate-limit';
import type { Request, Response, Express } from 'express';
import logger from './utils/logger';
import { createBullBoard } from 'bull-board';
import { BullAdapter } from 'bull-board/bullAdapter';
import { addVideoJob, videoQueue } from './queues/videoQueue';
import path from 'path';
import fs from 'fs';
import { enhancePrompt } from '../../worker/src/utils/prompt/enhancePrompt';
import scriptRouter from './routes/plugins/script';
import voiceRouter from './routes/plugins/voice';
import imageRouter from './routes/plugins/image';

dotenv.config();

const app = express();

app.use('/results', express.static('results'));

// Security: Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  standardHeaders: true,
  legacyHeaders: false,
});
app.use(limiter);

app.use(cors({
  origin: process.env.CORS_ORIGIN || '*',
  credentials: true,
}));

app.use(helmet());
app.use(express.json());

// Request logging
app.use((req, _res, next) => {
  logger.info(`${req.method} ${req.url}`);
  next();
});

app.get('/health', (_req: Request, res: Response) => res.json({ status: 'ok' }));

// Simple echo endpoint for frontend-backend connection test
app.post('/api/echo', (req: Request, res: Response) => {
  res.json({ received: req.body });
});

// Video generation endpoint (full pipeline) - MODIFIED to use queue
app.post('/api/generate', async (req: Request, res: Response) => {
  console.log('POST /api/generate body:', req.body);
  const { prompt, persona, style, maxLength, model, provider, promptStyle } = req.body;

  if (!prompt || !maxLength || !model || !provider) {
    return res.status(400).json({ success: false, error: 'Missing required fields' });
  }

  try {
    // Instead of running the pipeline directly, add it to the queue
    const job = await addVideoJob({
      prompt,
      persona,
      style,
      maxLength,
      model,
      provider,
      promptStyle
    });

    // Return job ID so frontend can poll for status
    res.json({
      success: true,
      jobId: job.id,
      message: 'Video generation job queued successfully'
    });

  } catch (err) {
    console.error('Error in /api/generate:', err);
    const msg = err instanceof Error ? err.message : String(err);
    res.status(500).json({ success: false, error: msg || 'Failed to queue job' });
  }
});

// Bull queue UI - this should now show jobs!
const { router: bullBoardRouter } = createBullBoard([
  new BullAdapter(videoQueue)
]);

app.use('/admin/queues', bullBoardRouter);

// Video job endpoints
app.post('/api/video/job', async (req: Request, res: Response) => {
  try {
    const job = await addVideoJob(req.body);
    res.json({ success: true, jobId: job.id });
  } catch (err) {
    res.status(500).json({ success: false, error: err instanceof Error ? err.message : String(err) });
  }
});

app.get('/api/video/job/:id', async (req: Request, res: Response) => {
  try {
    const job = await videoQueue.getJob(req.params.id);
    if (!job) {
      return res.status(404).json({ success: false, error: 'Job not found' });
    }
    const state = await job.getState();
    const progress = job.progress();
    const result = job.returnvalue;
    res.json({
      success: true,
      jobId: job.id,
      state,
      progress,
      result
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err instanceof Error ? err.message : String(err) });
  }
});

// Add endpoint to get completed job result (video file)
app.get('/api/video/result/:id', async (req: Request, res: Response) => {
  try {
    const job = await videoQueue.getJob(req.params.id);
    if (!job) {
      return res.status(404).json({ success: false, error: 'Job not found' });
    }

    const state = await job.getState();
    if (state !== 'completed') {
      return res.status(400).json({
        success: false,
        error: `Job is not completed. Current state: ${state}`
      });
    }

    const result = job.returnvalue;
    if (!result || !result.output) {
      console.error('[Result API] No output file in job.returnvalue:', result);
      return res.status(404).json({ success: false, error: 'No output file found' });
    }

    // Resolve the file path
    const outputPath = path.isAbsolute(result.output)
      ? result.output
      : path.resolve(process.cwd(), result.output);

    // Check if the file exists
    if (!fs.existsSync(outputPath)) {
      console.error('[Result API] Output file does not exist:', outputPath);
      return res.status(404).json({ success: false, error: 'Output file does not exist' });
    }

    res.setHeader('Content-Type', 'video/mp4');
    res.setHeader('Content-Disposition', 'attachment; filename=output.mp4');
    res.sendFile(outputPath, (err) => {
      if (err) {
        console.error('sendFile error:', err);
        if (!res.headersSent) {
          const msg = err instanceof Error ? err.message : String(err);
          res.status(500).json({ success: false, error: msg || 'Send file failed' });
        }
      }
    });
  } catch (err) {
    console.error('[Result API] Handler error:', err);
    res.status(500).json({ success: false, error: err instanceof Error ? err.message : String(err) });
  }
});

// Prompt Enhancement Endpoint (centralized in backend)
app.post('/api/improve-prompt', async (req: Request, res: Response) => {
  const { prompt } = req.body;
  if (!prompt) return res.status(400).json({ error: 'No prompt provided' });
  try {
    const improved = await enhancePrompt(prompt);
    res.json({ improved });
  } catch (err) {
    logger.error('Error in /api/improve-prompt:', err);
    res.status(500).json({ error: 'Failed to improve prompt' });
  }
});

// Mount plugin routes
app.use('/api/plugins/script', scriptRouter);
app.use('/api/plugins/voice', voiceRouter);
app.use('/api/plugins/image', imageRouter);

// Modelslab Webhook Handler
app.post('/api/modelslab-webhook', async (req, res) => {
  console.log('[Modelslab Webhook] Received payload:', req.body);
  // TODO: Notify worker or update job state here
  res.status(200).send('ok');
});

// Error logging (should be after all routes)
app.use((err: Error, _req: Request, res: Response, _next: Function) => {
  logger.error(err.stack || err.message);
  res.status(500).json({ error: 'Internal Server Error' });
});

export default app;