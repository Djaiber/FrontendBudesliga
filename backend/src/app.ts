import express from 'express';
import cors from 'cors';
import matchesRouter from './routes/matches';
import marketsRouter from './routes/markets';
import betsRouter from './routes/bets';
import predictionsRouter from './routes/predictions';

export function createApp() {
  const app = express();

  app.use(cors({ origin: process.env.CORS_ORIGIN || 'http://localhost:5173' }));
  app.use(express.json());

  // Health check
  app.get('/health', (_req, res) => res.json({ status: 'ok', timestamp: new Date().toISOString() }));

  // API routes
  app.use('/api/matches', matchesRouter);
  app.use('/api/markets', marketsRouter);
  app.use('/api/bets', betsRouter);
  app.use('/api/predictions', predictionsRouter);

  // 404 catch-all
  app.use((_req, res) => res.status(404).json({ error: 'Not found' }));

  return app;
}
