// types/bet.ts
export type BetStatus = 'ausstehend' | 'gewonnen' | 'verloren' | 'storniert';

export interface Bet {
  id: string;
  matchId: string;
  marketId: string;
  marketQuestion: string;
  outcomeId: string;
  outcomeLabel: string;
  decimalOdds: number;
  stake: number;           // 1–500
  potentialReturn: number; // stake × decimalOdds
  actualReturn: number;    // 0 or potentialReturn
  status: BetStatus;
  placedAt: number;        // Unix ms
}
