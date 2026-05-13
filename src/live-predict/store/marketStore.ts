import { create } from 'zustand';
import type { MiniMarket } from '@/types/market';

// ─── State & Actions ──────────────────────────────────────────────────────────

interface MarketState {
  openMarkets: MiniMarket[];
  settledMarkets: MiniMarket[];
  activeFilter: MiniMarket['category'] | 'Alle';
}

interface MarketActions {
  addMarket: (market: MiniMarket) => void;
  updateMarket: (id: string, patch: Partial<MiniMarket>) => void;
  settleMarket: (id: string, winningOutcomeId: string) => void;
  setFilter: (filter: MarketState['activeFilter']) => void;
  /** Called every second by a setInterval in the hook. Decrements ttlSeconds
   *  for all open markets and moves expired ones to settledMarkets. */
  tickTTL: () => void;
}

// ─── Store ────────────────────────────────────────────────────────────────────

export const useMarketStore = create<MarketState & MarketActions>((set) => ({
  // Initial state
  openMarkets: [],
  settledMarkets: [],
  activeFilter: 'Alle',

  // Actions
  addMarket: (market) =>
    set((state) => ({
      openMarkets: [market, ...state.openMarkets],
    })),

  updateMarket: (id, patch) =>
    set((state) => ({
      openMarkets: state.openMarkets.map((m) =>
        m.id === id ? { ...m, ...patch } : m,
      ),
    })),

  settleMarket: (id, winningOutcomeId) =>
    set((state) => {
      const target = state.openMarkets.find((m) => m.id === id);
      if (!target) return {};

      const settled: MiniMarket = {
        ...target,
        status: 'settled',
        winningOutcomeId,
      };

      return {
        openMarkets: state.openMarkets.filter((m) => m.id !== id),
        settledMarkets: [settled, ...state.settledMarkets],
      };
    }),

  setFilter: (filter) => set({ activeFilter: filter }),

  tickTTL: () =>
    set((state) => ({
      openMarkets: state.openMarkets.map((m) =>
        m.ttlSeconds > 0 ? { ...m, ttlSeconds: m.ttlSeconds - 1 } : m,
      ),
    })),
}));

// ─── Selectors ────────────────────────────────────────────────────────────────

/** Returns the open markets that match the active category filter. */
export const filteredMarkets = (state: MarketState): MiniMarket[] =>
  state.activeFilter === 'Alle'
    ? state.openMarkets
    : state.openMarkets.filter((m) => m.category === state.activeFilter);

/** Returns a map of { category → count } for all open markets. */
export const marketCountByCategory = (
  state: MarketState,
): Record<string, number> =>
  state.openMarkets.reduce<Record<string, number>>((acc, m) => {
    acc[m.category] = (acc[m.category] ?? 0) + 1;
    return acc;
  }, {});
