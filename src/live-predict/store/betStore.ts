import { create } from 'zustand';
import type { Bet } from '@/types/bet';

interface BetState {
  bets: Bet[];
  sessionPnL: number;
}

interface BetActions {
  addBet: (bet: Bet) => void;
  settleBet: (betId: string, won: boolean) => void;
  clearSession: () => void;
}

// Selector: sum of (actualReturn - stake) for all settled bets
export const sessionPnL = (state: BetState): number =>
  state.bets.reduce(
    (sum, b) => sum + b.actualReturn - (b.status !== 'ausstehend' ? b.stake : 0),
    0,
  );

/** Compute P&L from a raw bets array (used internally during state updates) */
function computePnL(bets: Bet[]): number {
  return bets.reduce(
    (sum, b) => sum + b.actualReturn - (b.status !== 'ausstehend' ? b.stake : 0),
    0,
  );
}

export const useBetStore = create<BetState & BetActions>((set) => ({
  // initial state
  bets: [],
  sessionPnL: 0,

  // actions
  addBet: (bet) =>
    set((state) => {
      const bets = [...state.bets, bet];
      return { bets, sessionPnL: computePnL(bets) };
    }),

  settleBet: (betId, won) =>
    set((state) => {
      const bets = state.bets.map((b) => {
        if (b.id !== betId) return b;
        return won
          ? { ...b, status: 'gewonnen' as const, actualReturn: b.potentialReturn }
          : { ...b, status: 'verloren' as const, actualReturn: 0 };
      });
      return { bets, sessionPnL: computePnL(bets) };
    }),

  clearSession: () => set({ bets: [], sessionPnL: 0 }),
}));
