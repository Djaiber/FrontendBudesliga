/**
 * Unit tests for betStore.
 *
 * Validates: Requirements 12.2, 19.5
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { useBetStore, sessionPnL } from '../store/betStore';
import type { Bet } from '../types/bet';

// ─── Fixtures ─────────────────────────────────────────────────────────────────

function makeBet(overrides: Partial<Bet> = {}): Bet {
  return {
    id: 'bet-1',
    matchId: 'match-1',
    marketId: 'market-1',
    marketQuestion: 'Nächstes Tor?',
    outcomeId: 'o1',
    outcomeLabel: 'Ja',
    decimalOdds: 2.0,
    stake: 10,
    potentialReturn: 20,
    actualReturn: 0,
    status: 'ausstehend',
    placedAt: Date.now(),
    ...overrides,
  };
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function resetStore() {
  useBetStore.setState({ bets: [], sessionPnL: 0 });
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('betStore', () => {
  beforeEach(resetStore);

  // ── addBet ─────────────────────────────────────────────────────────────────

  describe('addBet', () => {
    it('adds a bet to the bets array', () => {
      const bet = makeBet();
      useBetStore.getState().addBet(bet);
      expect(useBetStore.getState().bets).toHaveLength(1);
      expect(useBetStore.getState().bets[0]).toEqual(bet);
    });

    it('appends bets in insertion order', () => {
      const bet1 = makeBet({ id: 'bet-1' });
      const bet2 = makeBet({ id: 'bet-2' });
      useBetStore.getState().addBet(bet1);
      useBetStore.getState().addBet(bet2);
      const { bets } = useBetStore.getState();
      expect(bets[0].id).toBe('bet-1');
      expect(bets[1].id).toBe('bet-2');
    });

    it('can add multiple bets independently', () => {
      useBetStore.getState().addBet(makeBet({ id: 'bet-1' }));
      useBetStore.getState().addBet(makeBet({ id: 'bet-2' }));
      useBetStore.getState().addBet(makeBet({ id: 'bet-3' }));
      expect(useBetStore.getState().bets).toHaveLength(3);
    });

    it('a newly added pending bet does not affect sessionPnL (stake not yet deducted)', () => {
      // ausstehend bets contribute 0 to P&L (actualReturn=0, stake not counted)
      useBetStore.getState().addBet(makeBet({ stake: 50, actualReturn: 0, status: 'ausstehend' }));
      expect(useBetStore.getState().sessionPnL).toBe(0);
    });
  });

  // ── settleBet ──────────────────────────────────────────────────────────────

  describe('settleBet', () => {
    beforeEach(() => {
      useBetStore.getState().addBet(makeBet({ id: 'bet-1', stake: 10, potentialReturn: 20 }));
    });

    it('sets status to "gewonnen" when won=true', () => {
      useBetStore.getState().settleBet('bet-1', true);
      const bet = useBetStore.getState().bets.find((b) => b.id === 'bet-1');
      expect(bet?.status).toBe('gewonnen');
    });

    it('sets actualReturn to potentialReturn when won=true', () => {
      useBetStore.getState().settleBet('bet-1', true);
      const bet = useBetStore.getState().bets.find((b) => b.id === 'bet-1');
      expect(bet?.actualReturn).toBe(20);
    });

    it('sets status to "verloren" when won=false', () => {
      useBetStore.getState().settleBet('bet-1', false);
      const bet = useBetStore.getState().bets.find((b) => b.id === 'bet-1');
      expect(bet?.status).toBe('verloren');
    });

    it('sets actualReturn to 0 when won=false', () => {
      useBetStore.getState().settleBet('bet-1', false);
      const bet = useBetStore.getState().bets.find((b) => b.id === 'bet-1');
      expect(bet?.actualReturn).toBe(0);
    });

    it('does not modify other bets', () => {
      useBetStore.getState().addBet(makeBet({ id: 'bet-2', stake: 5, potentialReturn: 10 }));
      useBetStore.getState().settleBet('bet-1', true);
      const bet2 = useBetStore.getState().bets.find((b) => b.id === 'bet-2');
      expect(bet2?.status).toBe('ausstehend');
    });

    it('is a no-op when the betId does not exist', () => {
      useBetStore.getState().settleBet('nonexistent', true);
      const bet = useBetStore.getState().bets.find((b) => b.id === 'bet-1');
      expect(bet?.status).toBe('ausstehend');
    });
  });

  // ── sessionPnL selector (Req 12.2) ────────────────────────────────────────

  describe('sessionPnL selector', () => {
    it('returns 0 when there are no bets', () => {
      expect(sessionPnL(useBetStore.getState())).toBe(0);
    });

    it('returns 0 for a single pending bet (stake not yet counted)', () => {
      useBetStore.getState().addBet(makeBet({ stake: 50, actualReturn: 0, status: 'ausstehend' }));
      expect(sessionPnL(useBetStore.getState())).toBe(0);
    });

    it('returns positive P&L for a won bet: actualReturn - stake', () => {
      // stake=10, potentialReturn=25, odds=2.5
      useBetStore.getState().addBet(
        makeBet({ id: 'bet-1', stake: 10, potentialReturn: 25, actualReturn: 0 }),
      );
      useBetStore.getState().settleBet('bet-1', true);
      // P&L = actualReturn(25) - stake(10) = +15
      expect(sessionPnL(useBetStore.getState())).toBe(15);
    });

    it('returns negative P&L for a lost bet: 0 - stake', () => {
      useBetStore.getState().addBet(
        makeBet({ id: 'bet-1', stake: 10, potentialReturn: 25, actualReturn: 0 }),
      );
      useBetStore.getState().settleBet('bet-1', false);
      // P&L = actualReturn(0) - stake(10) = -10
      expect(sessionPnL(useBetStore.getState())).toBe(-10);
    });

    it('computes correct net P&L across mixed bet statuses (Req 12.2)', () => {
      // bet-1: won → +15 (stake=10, actualReturn=25)
      // bet-2: lost → -20 (stake=20, actualReturn=0)
      // bet-3: pending → 0 (not counted)
      useBetStore.getState().addBet(
        makeBet({ id: 'bet-1', stake: 10, potentialReturn: 25, actualReturn: 0 }),
      );
      useBetStore.getState().addBet(
        makeBet({ id: 'bet-2', stake: 20, potentialReturn: 40, actualReturn: 0 }),
      );
      useBetStore.getState().addBet(
        makeBet({ id: 'bet-3', stake: 15, potentialReturn: 30, actualReturn: 0 }),
      );

      useBetStore.getState().settleBet('bet-1', true);  // +15
      useBetStore.getState().settleBet('bet-2', false); // -20

      // net = 15 + (-20) = -5
      expect(sessionPnL(useBetStore.getState())).toBe(-5);
    });

    it('accumulates P&L across multiple won bets', () => {
      useBetStore.getState().addBet(
        makeBet({ id: 'bet-1', stake: 10, potentialReturn: 20, actualReturn: 0 }),
      );
      useBetStore.getState().addBet(
        makeBet({ id: 'bet-2', stake: 5, potentialReturn: 15, actualReturn: 0 }),
      );
      useBetStore.getState().settleBet('bet-1', true); // +10
      useBetStore.getState().settleBet('bet-2', true); // +10
      // net = 10 + 10 = 20
      expect(sessionPnL(useBetStore.getState())).toBe(20);
    });

    it('accumulates P&L across multiple lost bets', () => {
      useBetStore.getState().addBet(
        makeBet({ id: 'bet-1', stake: 10, potentialReturn: 20, actualReturn: 0 }),
      );
      useBetStore.getState().addBet(
        makeBet({ id: 'bet-2', stake: 30, potentialReturn: 60, actualReturn: 0 }),
      );
      useBetStore.getState().settleBet('bet-1', false); // -10
      useBetStore.getState().settleBet('bet-2', false); // -30
      // net = -10 + (-30) = -40
      expect(sessionPnL(useBetStore.getState())).toBe(-40);
    });

    it('matches the sessionPnL stored in state after each action', () => {
      useBetStore.getState().addBet(
        makeBet({ id: 'bet-1', stake: 10, potentialReturn: 25, actualReturn: 0 }),
      );
      useBetStore.getState().settleBet('bet-1', true);
      const state = useBetStore.getState();
      expect(state.sessionPnL).toBe(sessionPnL(state));
    });

    it('resets to 0 after clearSession', () => {
      useBetStore.getState().addBet(
        makeBet({ id: 'bet-1', stake: 10, potentialReturn: 25, actualReturn: 0 }),
      );
      useBetStore.getState().settleBet('bet-1', true);
      useBetStore.getState().clearSession();
      expect(sessionPnL(useBetStore.getState())).toBe(0);
      expect(useBetStore.getState().bets).toHaveLength(0);
    });
  });
});
