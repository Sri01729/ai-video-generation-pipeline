import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import rateLimit from 'express-rate-limit';
import type { Request, Response, Express } from 'express';
import logger from './utils/logger';

dotenv.config();

const app: Express = express();

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

// Error logging (should be after all routes)
app.use((err: Error, _req: Request, res: Response, _next: Function) => {
  logger.error(err.stack || err.message);
  res.status(500).json({ error: 'Internal Server Error' });
});

export default app;