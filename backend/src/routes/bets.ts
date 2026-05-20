import { Router } from 'express';
import { placeBet, getBets, getBet } from '../services/marketService';

const router = Router();

/**
 * GET /api/bets
 * Query: ?userId=xxx
 */
router.get('/', (req, res) => {
  const userId = req.query.userId as string | undefined;
  res.json(getBets(userId));
});

/**
 * GET /api/bets/:id
 */
router.get('/:id', (req, res) => {
  const bet = getBet(req.params.id);
  if (!bet) return res.status(404).json({ error: 'Bet not found' });
  res.json(bet);
});

/**
 * POST /api/bets
 * Body: { marketId, outcomeId, stake, matchId, userId? }
 */
router.post('/', (req, res) => {
  const { marketId, outcomeId, stake, matchId, userId } = req.body;
  if (!marketId || !outcomeId || !stake || !matchId) {
    return res.status(400).json({ error: 'marketId, outcomeId, stake, matchId required' });
  }

  const result = placeBet({ marketId, outcomeId, stake, userId }, matchId);
  if ('error' in result) return res.status(400).json(result);
  res.status(201).json(result);
});

export default router;
