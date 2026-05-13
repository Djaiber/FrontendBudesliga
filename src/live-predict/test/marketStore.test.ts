/**
 * Unit tests for marketStore.
 *
 * Validates: Requirements 10.8, 10.9, 19.5
 */
import { describe, it, expect, beforeEach } from 'vitest';
import {
  useMarketStore,
  filteredMarkets,
  marketCountByCategory,
} from '../store/marketStore';
import type { MiniMarket } from '../types/market';

// ─── Fixtures ─────────────────────────────────────────────────────────────────

function makeMarket(overrides: Partial<MiniMarket> = {}): MiniMarket {
  return {
    id: 'market-1',
    matchId: 'match-1',
    question: 'Nächstes Tor?',
    category: 'Tor',
    outcomes: [
      { id: 'o1', label: 'Ja', decimalOdds: 2.0, impliedProbability: 0.5 },
      { id: 'o2', label: 'Nein', decimalOdds: 2.0, impliedProbability: 0.5 },
    ],
    ttlSeconds: 30,
    openedAt: Date.now(),
    status: 'open',
    ...overrides,
  };
}

const marketTor: MiniMarket = makeMarket({ id: 'm1', category: 'Tor' });
const marketEcke: MiniMarket = makeMarket({ id: 'm2', category: 'Ecke', question: 'Ecke?' });
const marketTorschuss: MiniMarket = makeMarket({
  id: 'm3',
  category: 'Torschuss',
  question: 'Torschuss?',
});

// ─── Helpers ──────────────────────────────────────────────────────────────────

function resetStore() {
  useMarketStore.setState({
    openMarkets: [],
    settledMarkets: [],
    activeFilter: 'Alle',
  });
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('marketStore', () => {
  beforeEach(resetStore);

  // ── addMarket ──────────────────────────────────────────────────────────────

  describe('addMarket', () => {
    it('adds a market to openMarkets', () => {
      useMarketStore.getState().addMarket(marketTor);
      expect(useMarketStore.getState().openMarkets).toHaveLength(1);
      expect(useMarketStore.getState().openMarkets[0]).toEqual(marketTor);
    });

    it('prepends new markets so the latest appears first', () => {
      useMarketStore.getState().addMarket(marketTor);
      useMarketStore.getState().addMarket(marketEcke);
      const { openMarkets } = useMarketStore.getState();
      expect(openMarkets[0].id).toBe('m2'); // most recently added
      expect(openMarkets[1].id).toBe('m1');
    });

    it('does not affect settledMarkets', () => {
      useMarketStore.getState().addMarket(marketTor);
      expect(useMarketStore.getState().settledMarkets).toHaveLength(0);
    });

    it('can add multiple markets independently', () => {
      useMarketStore.getState().addMarket(marketTor);
      useMarketStore.getState().addMarket(marketEcke);
      useMarketStore.getState().addMarket(marketTorschuss);
      expect(useMarketStore.getState().openMarkets).toHaveLength(3);
    });
  });

  // ── updateMarket ───────────────────────────────────────────────────────────

  describe('updateMarket', () => {
    beforeEach(() => {
      useMarketStore.getState().addMarket(marketTor);
    });

    it('applies a partial patch to the matching market', () => {
      useMarketStore.getState().updateMarket('m1', { ttlSeconds: 10 });
      const updated = useMarketStore.getState().openMarkets.find((m) => m.id === 'm1');
      expect(updated?.ttlSeconds).toBe(10);
    });

    it('preserves all other fields when patching', () => {
      useMarketStore.getState().updateMarket('m1', { ttlSeconds: 5 });
      const updated = useMarketStore.getState().openMarkets.find((m) => m.id === 'm1');
      expect(updated?.question).toBe(marketTor.question);
      expect(updated?.category).toBe(marketTor.category);
      expect(updated?.status).toBe(marketTor.status);
    });

    it('does not modify other markets', () => {
      useMarketStore.getState().addMarket(marketEcke);
      useMarketStore.getState().updateMarket('m1', { ttlSeconds: 5 });
      const ecke = useMarketStore.getState().openMarkets.find((m) => m.id === 'm2');
      expect(ecke?.ttlSeconds).toBe(marketEcke.ttlSeconds);
    });

    it('is a no-op when the id does not exist', () => {
      useMarketStore.getState().updateMarket('nonexistent', { ttlSeconds: 0 });
      expect(useMarketStore.getState().openMarkets).toHaveLength(1);
      expect(useMarketStore.getState().openMarkets[0].ttlSeconds).toBe(marketTor.ttlSeconds);
    });

    it('can update the question field', () => {
      useMarketStore.getState().updateMarket('m1', { question: 'Geänderte Frage?' });
      const updated = useMarketStore.getState().openMarkets.find((m) => m.id === 'm1');
      expect(updated?.question).toBe('Geänderte Frage?');
    });
  });

  // ── settleMarket ───────────────────────────────────────────────────────────

  describe('settleMarket', () => {
    beforeEach(() => {
      useMarketStore.getState().addMarket(marketTor);
    });

    it('removes the market from openMarkets', () => {
      useMarketStore.getState().settleMarket('m1', 'o1');
      expect(useMarketStore.getState().openMarkets).toHaveLength(0);
    });

    it('moves the market to settledMarkets', () => {
      useMarketStore.getState().settleMarket('m1', 'o1');
      expect(useMarketStore.getState().settledMarkets).toHaveLength(1);
    });

    it('sets status to "settled" on the moved market', () => {
      useMarketStore.getState().settleMarket('m1', 'o1');
      const settled = useMarketStore.getState().settledMarkets[0];
      expect(settled.status).toBe('settled');
    });

    it('records the winning outcome id', () => {
      useMarketStore.getState().settleMarket('m1', 'o1');
      const settled = useMarketStore.getState().settledMarkets[0];
      expect(settled.winningOutcomeId).toBe('o1');
    });

    it('prepends to settledMarkets so the latest settled market is first', () => {
      useMarketStore.getState().addMarket(marketEcke);
      useMarketStore.getState().settleMarket('m1', 'o1');
      useMarketStore.getState().settleMarket('m2', 'o2');
      expect(useMarketStore.getState().settledMarkets[0].id).toBe('m2');
    });

    it('is a no-op when the id does not exist', () => {
      useMarketStore.getState().settleMarket('nonexistent', 'o1');
      expect(useMarketStore.getState().openMarkets).toHaveLength(1);
      expect(useMarketStore.getState().settledMarkets).toHaveLength(0);
    });

    it('preserves other open markets when settling one', () => {
      useMarketStore.getState().addMarket(marketEcke);
      useMarketStore.getState().settleMarket('m1', 'o1');
      expect(useMarketStore.getState().openMarkets).toHaveLength(1);
      expect(useMarketStore.getState().openMarkets[0].id).toBe('m2');
    });
  });

  // ── filteredMarkets selector ───────────────────────────────────────────────

  describe('filteredMarkets selector (Req 10.8)', () => {
    beforeEach(() => {
      useMarketStore.getState().addMarket(marketTor);
      useMarketStore.getState().addMarket(marketEcke);
      useMarketStore.getState().addMarket(marketTorschuss);
    });

    it('returns all open markets when filter is "Alle"', () => {
      useMarketStore.setState({ activeFilter: 'Alle' });
      const result = filteredMarkets(useMarketStore.getState());
      expect(result).toHaveLength(3);
    });

    it('returns only Tor markets when filter is "Tor"', () => {
      useMarketStore.setState({ activeFilter: 'Tor' });
      const result = filteredMarkets(useMarketStore.getState());
      expect(result).toHaveLength(1);
      expect(result[0].category).toBe('Tor');
    });

    it('returns only Ecke markets when filter is "Ecke"', () => {
      useMarketStore.setState({ activeFilter: 'Ecke' });
      const result = filteredMarkets(useMarketStore.getState());
      expect(result).toHaveLength(1);
      expect(result[0].category).toBe('Ecke');
    });

    it('returns only Torschuss markets when filter is "Torschuss"', () => {
      useMarketStore.setState({ activeFilter: 'Torschuss' });
      const result = filteredMarkets(useMarketStore.getState());
      expect(result).toHaveLength(1);
      expect(result[0].category).toBe('Torschuss');
    });

    it('returns an empty array when no markets match the active filter', () => {
      useMarketStore.setState({ activeFilter: 'Freistoß' });
      const result = filteredMarkets(useMarketStore.getState());
      expect(result).toHaveLength(0);
    });

    it('returns an empty array when there are no open markets', () => {
      useMarketStore.setState({ openMarkets: [], activeFilter: 'Alle' });
      const result = filteredMarkets(useMarketStore.getState());
      expect(result).toHaveLength(0);
    });

    it('returns multiple markets of the same category', () => {
      const marketTor2 = makeMarket({ id: 'm4', category: 'Tor', question: 'Zweites Tor?' });
      useMarketStore.getState().addMarket(marketTor2);
      useMarketStore.setState({ activeFilter: 'Tor' });
      const result = filteredMarkets(useMarketStore.getState());
      expect(result).toHaveLength(2);
      result.forEach((m) => expect(m.category).toBe('Tor'));
    });
  });

  // ── marketCountByCategory selector ────────────────────────────────────────

  describe('marketCountByCategory selector (Req 10.9)', () => {
    it('returns an empty object when there are no open markets', () => {
      const counts = marketCountByCategory(useMarketStore.getState());
      expect(counts).toEqual({});
    });

    it('counts a single market correctly', () => {
      useMarketStore.getState().addMarket(marketTor);
      const counts = marketCountByCategory(useMarketStore.getState());
      expect(counts).toEqual({ Tor: 1 });
    });

    it('counts multiple markets across different categories', () => {
      useMarketStore.getState().addMarket(marketTor);
      useMarketStore.getState().addMarket(marketEcke);
      useMarketStore.getState().addMarket(marketTorschuss);
      const counts = marketCountByCategory(useMarketStore.getState());
      expect(counts).toEqual({ Tor: 1, Ecke: 1, Torschuss: 1 });
    });

    it('accumulates counts for the same category', () => {
      const marketTor2 = makeMarket({ id: 'm4', category: 'Tor', question: 'Zweites Tor?' });
      const marketTor3 = makeMarket({ id: 'm5', category: 'Tor', question: 'Drittes Tor?' });
      useMarketStore.getState().addMarket(marketTor);
      useMarketStore.getState().addMarket(marketTor2);
      useMarketStore.getState().addMarket(marketTor3);
      const counts = marketCountByCategory(useMarketStore.getState());
      expect(counts.Tor).toBe(3);
    });

    it('does not count settled markets', () => {
      useMarketStore.getState().addMarket(marketTor);
      useMarketStore.getState().addMarket(marketEcke);
      useMarketStore.getState().settleMarket('m1', 'o1');
      const counts = marketCountByCategory(useMarketStore.getState());
      expect(counts).toEqual({ Ecke: 1 });
      expect(counts.Tor).toBeUndefined();
    });
  });
});
