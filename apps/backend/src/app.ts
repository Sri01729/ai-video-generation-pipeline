import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import rateLimit from 'express-rate-limit';
import type { Request, Response, Express } from 'express';
import logger from './utils/logger';
import { runFullPipeline } from '../../worker/src/utils/runFullPipeline';
import Bull from 'bull';
import { createBullBoard } from 'bull-board';
import { BullAdapter } from 'bull-board/bullAdapter';

dotenv.config();

const app: Express = express();

app.use('/results', express.static('results'));

// Security: Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  standardHeaders: true,
  legacyHeaders: false,
});
app.use(limiter);

// TODO: Move CORS origins to config file for better environment separation
app.use(cors({
  origin: process.env.CORS_ORIGIN || '*',
  credentials: true,
}));

// FIXME: Remove wildcard CORS before production deployment

app.use(helmet());
app.use(express.json());

// TODO: import and use routes
// app.use('/api', apiRoutes);

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

// Video generation endpoint (full pipeline)
app.post('/api/generate', async (req: Request, res: Response) => {
  console.log('POST /api/generate body:', req.body);
  const { prompt, persona, style, maxLength, model, provider, promptStyle } = req.body;
  if (!prompt || !persona || !style || !maxLength || !model || !provider || !promptStyle) {
    return res.status(400).json({ success: false, error: 'Missing required fields' });
  }
  try {
    const output = await runFullPipeline({ prompt, persona, style, maxLength, model, provider, promptStyle });
    console.log('runFullPipeline output:', output);
    res.setHeader('Content-Type', 'video/mp4');
    res.setHeader('Content-Disposition', 'attachment; filename=output.mp4');
    res.sendFile(output, { root: process.cwd() }, (err) => {
      if (err) {
        console.error('sendFile error:', err);
        if (!res.headersSent) {
          const msg = err instanceof Error ? err.message : String(err);
          res.status(500).json({ success: false, error: msg || 'Send file failed' });
        }
      }
    });
  } catch (err) {
    console.error('Error in /api/generate:', err);
    if (!res.headersSent) {
      const msg = err instanceof Error ? err.message : String(err);
      res.status(500).json({ success: false, error: msg || 'Pipeline failed' });
    }
  }
});

// Bull queue for UI
const testQueue = new Bull('test-queue', { redis: process.env.REDIS_URL || 'redis://localhost:6379' });

const { router: bullBoardRouter } = createBullBoard([
  new BullAdapter(testQueue)
]);

app.use('/admin/queues', bullBoardRouter);

// Error logging (should be after all routes)
app.use((err: Error, _req: Request, res: Response, _next: Function) => {
  logger.error(err.stack || err.message);
  res.status(500).json({ error: 'Internal Server Error' });
});

export default app;