// types/market.ts
export type MarketStatus = 'open' | 'settled' | 'cancelled';

export interface Outcome {
  id: string;
  label: string;
  decimalOdds: number;        // e.g. 2.15
  impliedProbability: number; // 0–1
}

export interface MiniMarket {
  id: string;
  matchId: string;
  question: string;
  category: 'Tor' | 'Torschuss' | 'Ecke' | 'Freistoß' | 'Sprint' | 'Andere';
  outcomes: Outcome[];        // 2–4 items
  ttlSeconds: number;         // remaining seconds
  openedAt: number;           // Unix ms
  status: MarketStatus;
  winningOutcomeId?: string;
}
