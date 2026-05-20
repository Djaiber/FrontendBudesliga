import { v4 as uuidv4 } from 'uuid';
import type { Market, Bet, PlaceBetRequest, Outcome } from '../types';

// In-memory stores (replace with a DB in production)
const markets = new Map<string, Market>();
const bets = new Map<string, Bet>();

// ─── Market CRUD ──────────────────────────────────────────────────────────────

export function getAllMarkets(matchId?: string): Market[] {
  const all = Array.from(markets.values());
  return matchId ? all.filter((m) => m.matchId === matchId) : all;
}

export function getMarket(id: string): Market | undefined {
  return markets.get(id);
}

export function createMarket(data: Omit<Market, 'id' | 'openedAt' | 'status'>): Market {
  const market: Market = {
    ...data,
    id: uuidv4(),
    openedAt: Date.now(),
    status: 'open',
  };
  markets.set(market.id, market);
  return market;
}

export function settleMarket(id: string, winningOutcomeId: string): Market | null {
  const market = markets.get(id);
  if (!market || market.status !== 'open') return null;

  const settled: Market = { ...market, status: 'settled', winningOutcomeId };
  markets.set(id, settled);

  // Auto-settle all bets on this market
  for (const bet of bets.values()) {
    if (bet.marketId === id && bet.status === 'ausstehend') {
      const won = bet.outcomeId === winningOutcomeId;
      bet.status = won ? 'gewonnen' : 'verloren';
      bet.actualReturn = won ? bet.potentialReturn : 0;
      bet.settledAt = Date.now();
      bets.set(bet.id, bet);
    }
  }

  return settled;
}

export function cancelMarket(id: string): Market | null {
  const market = markets.get(id);
  if (!market) return null;
  const cancelled: Market = { ...market, status: 'cancelled' };
  markets.set(id, cancelled);
  return cancelled;
}

// ─── "Nächstes Tor" market generation ─────────────────────────────────────────

/**
 * Creates a standard "Nächstes Tor" prediction market for the next N minutes
 * of match time, with odds derived from possession and pressure statistics.
 */
export function createNextGoalMarket(
  matchId: string,
  upToMinute: number,
  stats: { homePossession: number; awayPossession: number },
): Market {
  // Simple odds from possession: higher possession → lower odds (more likely to score)
  const homeFactor = stats.homePossession / 50; // > 1 if home dominates
  const homeOdds = parseFloat((1.75 / homeFactor).toFixed(2));
  const awayOdds = parseFloat((1.75 * homeFactor).toFixed(2));
  const noGoalOdds = 2.20;

  const outcomes: Outcome[] = [
    {
      id: uuidv4(),
      label: 'Heimteam',
      decimalOdds: Math.max(1.10, Math.min(9.99, homeOdds)),
      impliedProbability: parseFloat((1 / homeOdds).toFixed(3)),
    },
    {
      id: uuidv4(),
      label: 'Gastteam',
      decimalOdds: Math.max(1.10, Math.min(9.99, awayOdds)),
      impliedProbability: parseFloat((1 / awayOdds).toFixed(3)),
    },
    {
      id: uuidv4(),
      label: 'Kein Tor',
      decimalOdds: noGoalOdds,
      impliedProbability: parseFloat((1 / noGoalOdds).toFixed(3)),
    },
  ];

  return createMarket({
    matchId,
    question: `Nächstes Tor bis Minute ${upToMinute}?`,
    category: 'Tor',
    outcomes,
    ttlSeconds: 30,
  });
}

// ─── Bets ─────────────────────────────────────────────────────────────────────

export function placeBet(req: PlaceBetRequest, matchId: string): Bet | { error: string } {
  const market = markets.get(req.marketId);
  if (!market) return { error: 'Markt nicht gefunden.' };
  if (market.status !== 'open') return { error: 'Markt ist nicht mehr offen.' };

  const outcome = market.outcomes.find((o) => o.id === req.outcomeId);
  if (!outcome) return { error: 'Ergebnis nicht gefunden.' };

  if (req.stake < 1 || req.stake > 500) return { error: 'Einsatz muss zwischen 1 und 500 liegen.' };

  const bet: Bet = {
    id: uuidv4(),
    matchId,
    marketId: req.marketId,
    marketQuestion: market.question,
    outcomeId: req.outcomeId,
    outcomeLabel: outcome.label,
    decimalOdds: outcome.decimalOdds,
    stake: req.stake,
    potentialReturn: parseFloat((req.stake * outcome.decimalOdds).toFixed(2)),
    actualReturn: 0,
    status: 'ausstehend',
    placedAt: Date.now(),
    userId: req.userId,
  };

  bets.set(bet.id, bet);
  return bet;
}

export function getBets(userId?: string): Bet[] {
  const all = Array.from(bets.values());
  return userId ? all.filter((b) => b.userId === userId) : all;
}

export function getBet(id: string): Bet | undefined {
  return bets.get(id);
}
