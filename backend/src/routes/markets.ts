import { Router } from 'express';
import {
  getAllMarkets,
  getMarket,
  createMarket,
  createNextGoalMarket,
  settleMarket,
  cancelMarket,
} from '../services/marketService';

const router = Router();

/**
 * GET /api/markets
 * Query params: ?matchId=xxx&status=open
 */
router.get('/', (req, res) => {
  const { matchId, status } = req.query as Record<string, string>;
  let markets = getAllMarkets(matchId);
  if (status) markets = markets.filter((m) => m.status === status);
  res.json(markets);
});

/**
 * GET /api/markets/:id
 */
router.get('/:id', (req, res) => {
  const market = getMarket(req.params.id);
  if (!market) return res.status(404).json({ error: 'Market not found' });
  res.json(market);
});

/**
 * POST /api/markets
 * Body: { matchId, question, category, outcomes, ttlSeconds }
 */
router.post('/', (req, res) => {
  const { matchId, question, category, outcomes, ttlSeconds } = req.body;
  if (!matchId || !question || !category || !outcomes) {
    return res.status(400).json({ error: 'matchId, question, category, outcomes required' });
  }
  const market = createMarket({ matchId, question, category, outcomes, ttlSeconds: ttlSeconds ?? 60 });
  res.status(201).json(market);
});

/**
 * POST /api/markets/next-goal
 * Generates a "Nächstes Tor" market based on possession stats.
 * Body: { matchId, upToMinute, homePossession, awayPossession }
 */
router.post('/next-goal', (req, res) => {
  const { matchId, upToMinute, homePossession, awayPossession } = req.body;
  if (!matchId || !upToMinute) {
    return res.status(400).json({ error: 'matchId and upToMinute required' });
  }
  const market = createNextGoalMarket(matchId, upToMinute, {
    homePossession: homePossession ?? 50,
    awayPossession: awayPossession ?? 50,
  });
  res.status(201).json(market);
});

/**
 * PUT /api/markets/:id/settle
 * Body: { winningOutcomeId }
 */
router.put('/:id/settle', (req, res) => {
  const { winningOutcomeId } = req.body;
  if (!winningOutcomeId) return res.status(400).json({ error: 'winningOutcomeId required' });

  const market = settleMarket(req.params.id, winningOutcomeId);
  if (!market) return res.status(404).json({ error: 'Market not found or already settled' });
  res.json(market);
});

/**
 * PUT /api/markets/:id/cancel
 */
router.put('/:id/cancel', (req, res) => {
  const market = cancelMarket(req.params.id);
  if (!market) return res.status(404).json({ error: 'Market not found' });
  res.json(market);
});

export default router;
