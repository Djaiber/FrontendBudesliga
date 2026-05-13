/**
 * Unit tests for the MarketCard component.
 *
 * Validates: Requirements 10.2, 10.3, 17.2, 19.5
 */
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MarketCard } from '../components/atoms/MarketCard/MarketCard';
import type { MiniMarket, Outcome } from '../types/market';

// ─── Test fixtures ────────────────────────────────────────────────────────────

const outcomeYes: Outcome = {
  id: 'outcome-yes',
  label: 'Ja',
  decimalOdds: 2.5,
  impliedProbability: 0.4,
};

const outcomeNo: Outcome = {
  id: 'outcome-no',
  label: 'Nein',
  decimalOdds: 1.5,
  impliedProbability: 0.6,
};

const openMarket: MiniMarket = {
  id: 'market-1',
  matchId: 'match-1',
  question: 'Nächstes Tor in 5 Minuten?',
  category: 'Tor',
  outcomes: [outcomeYes, outcomeNo],
  ttlSeconds: 90,
  openedAt: Date.now(),
  status: 'open',
};

const settledMarket: MiniMarket = {
  ...openMarket,
  id: 'market-2',
  status: 'settled',
  winningOutcomeId: 'outcome-yes',
};

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('MarketCard', () => {
  // ── Requirement 10.2 — TTL countdown in MM:SS format ─────────────────────

  describe('TTL countdown (Req 10.2)', () => {
    it('renders TTL in MM:SS format for values under 60 seconds', () => {
      const market = { ...openMarket, ttlSeconds: 23 };
      render(<MarketCard market={market} onOutcomeClick={vi.fn()} />);
      expect(screen.getByText('00:23')).toBeInTheDocument();
    });

    it('renders TTL in MM:SS format for values over 60 seconds', () => {
      const market = { ...openMarket, ttlSeconds: 90 };
      render(<MarketCard market={market} onOutcomeClick={vi.fn()} />);
      expect(screen.getByText('01:30')).toBeInTheDocument();
    });

    it('renders TTL as 00:00 when ttlSeconds is 0', () => {
      const market = { ...openMarket, ttlSeconds: 0 };
      render(<MarketCard market={market} onOutcomeClick={vi.fn()} />);
      expect(screen.getByText('00:00')).toBeInTheDocument();
    });

    it('renders TTL as 01:00 for exactly 60 seconds', () => {
      const market = { ...openMarket, ttlSeconds: 60 };
      render(<MarketCard market={market} onOutcomeClick={vi.fn()} />);
      expect(screen.getByText('01:00')).toBeInTheDocument();
    });
  });

  // ── Requirement 17.2 — aria-live="polite" on TTL countdown ───────────────

  describe('Accessibility (Req 17.2)', () => {
    it('has aria-live="polite" on the TTL countdown element', () => {
      render(<MarketCard market={openMarket} onOutcomeClick={vi.fn()} />);
      const ttlEl = screen.getByText('01:30');
      expect(ttlEl).toHaveAttribute('aria-live', 'polite');
    });

    it('has aria-atomic="true" on the TTL countdown element', () => {
      render(<MarketCard market={openMarket} onOutcomeClick={vi.fn()} />);
      const ttlEl = screen.getByText('01:30');
      expect(ttlEl).toHaveAttribute('aria-atomic', 'true');
    });
  });

  // ── Requirement 10.3 — LivePill is present ───────────────────────────────

  describe('LivePill (Req 10.3)', () => {
    it('renders the LivePill badge with text "LIVE"', () => {
      render(<MarketCard market={openMarket} onOutcomeClick={vi.fn()} />);
      expect(screen.getByText('LIVE')).toBeInTheDocument();
    });
  });

  // ── Requirement 19.5 — Settled state indicators ──────────────────────────

  describe('Settled state (Req 19.5)', () => {
    it('shows a green checkmark (✓) on the winning outcome', () => {
      render(<MarketCard market={settledMarket} onOutcomeClick={vi.fn()} />);
      const winner = screen.getByLabelText('Gewinner');
      expect(winner).toBeInTheDocument();
      expect(winner.textContent).toBe('✓');
    });

    it('shows a grey dash (–) on losing outcomes', () => {
      render(<MarketCard market={settledMarket} onOutcomeClick={vi.fn()} />);
      const losers = screen.getAllByLabelText('Verlierer');
      expect(losers.length).toBeGreaterThanOrEqual(1);
      losers.forEach((el) => expect(el.textContent).toBe('–'));
    });

    it('shows exactly one winner indicator and one loser indicator for two outcomes', () => {
      render(<MarketCard market={settledMarket} onOutcomeClick={vi.fn()} />);
      expect(screen.getAllByLabelText('Gewinner')).toHaveLength(1);
      expect(screen.getAllByLabelText('Verlierer')).toHaveLength(1);
    });

    it('does not show winner/loser indicators when market is open', () => {
      render(<MarketCard market={openMarket} onOutcomeClick={vi.fn()} />);
      expect(screen.queryByLabelText('Gewinner')).not.toBeInTheDocument();
      expect(screen.queryByLabelText('Verlierer')).not.toBeInTheDocument();
    });
  });

  // ── General rendering ─────────────────────────────────────────────────────

  describe('General rendering', () => {
    it('renders the market question', () => {
      render(<MarketCard market={openMarket} onOutcomeClick={vi.fn()} />);
      expect(screen.getByText(openMarket.question)).toBeInTheDocument();
    });

    it('renders an OutcomeButton for each outcome', () => {
      render(<MarketCard market={openMarket} onOutcomeClick={vi.fn()} />);
      expect(screen.getByText(outcomeYes.label)).toBeInTheDocument();
      expect(screen.getByText(outcomeNo.label)).toBeInTheDocument();
    });
  });
});
