import { create } from 'zustand';

const INITIAL_BALANCE = 1000;

interface PointsState {
  balance: number;
}

interface PointsActions {
  /** Deduct points when a bet is placed. Floors at 0. */
  deductPoints: (amount: number) => void;
  /** Award points when a bet is settled as won (pass potentialReturn). */
  awardPoints: (amount: number) => void;
  resetPoints: () => void;
}

export const usePointsStore = create<PointsState & PointsActions>((set) => ({
  balance: INITIAL_BALANCE,

  deductPoints: (amount) =>
    set((state) => ({ balance: Math.max(0, state.balance - amount) })),

  awardPoints: (amount) =>
    set((state) => ({ balance: state.balance + amount })),

  resetPoints: () => set({ balance: INITIAL_BALANCE }),
}));
