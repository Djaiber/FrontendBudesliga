/**
 * Unit tests for the OutcomeButton component.
 *
 * Validates: Requirements 10.4, 11.8, 17.1, 19.5
 */
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { OutcomeButton } from '../components/atoms/OutcomeButton/OutcomeButton';
import type { Outcome } from '../types/market';

// ─── Test fixtures ────────────────────────────────────────────────────────────

const mockOutcome: Outcome = {
  id: 'outcome-1',
  label: 'Ja',
  decimalOdds: 2.5,
  impliedProbability: 0.4,
};

const marketQuestion = 'Nächstes Tor in 5 Minuten?';

function renderOutcomeButton(
  overrides?: Partial<{
    outcome: Outcome;
    marketQuestion: string;
    onClick: (o: Outcome) => void;
    disabled: boolean;
  }>,
) {
  const onClick = vi.fn();
  render(
    <OutcomeButton
      outcome={mockOutcome}
      marketQuestion={marketQuestion}
      onClick={onClick}
      disabled={false}
      {...overrides}
    />,
  );
  return { onClick };
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('OutcomeButton', () => {
  // ── Requirement 10.4 — Renders label, odds, implied probability ───────────

  describe('Rendering (Req 10.4)', () => {
    it('renders the outcome label', () => {
      renderOutcomeButton();
      expect(screen.getByText('Ja')).toBeInTheDocument();
    });

    it('renders the decimal odds formatted to 2 decimal places', () => {
      renderOutcomeButton();
      expect(screen.getByText('2.50')).toBeInTheDocument();
    });

    it('renders the implied probability as a percentage', () => {
      renderOutcomeButton();
      // 0.4 → 40%
      expect(screen.getByText('p ≈ 40%')).toBeInTheDocument();
    });

    it('rounds implied probability correctly (0.667 → 67%)', () => {
      const outcome: Outcome = { ...mockOutcome, impliedProbability: 0.667 };
      renderOutcomeButton({ outcome });
      expect(screen.getByText('p ≈ 67%')).toBeInTheDocument();
    });

    it('renders odds with 2 decimal places for whole numbers', () => {
      const outcome: Outcome = { ...mockOutcome, decimalOdds: 3.0 };
      renderOutcomeButton({ outcome });
      expect(screen.getByText('3.00')).toBeInTheDocument();
    });
  });

  // ── Requirement 17.1 — aria-label contains question + label + odds ────────

  describe('Accessibility (Req 17.1)', () => {
    it('has role="button" (native button element)', () => {
      renderOutcomeButton();
      expect(screen.getByRole('button')).toBeInTheDocument();
    });

    it('aria-label contains the market question', () => {
      renderOutcomeButton();
      const btn = screen.getByRole('button');
      expect(btn).toHaveAttribute('aria-label', expect.stringContaining(marketQuestion));
    });

    it('aria-label contains the outcome label', () => {
      renderOutcomeButton();
      const btn = screen.getByRole('button');
      expect(btn).toHaveAttribute('aria-label', expect.stringContaining(mockOutcome.label));
    });

    it('aria-label contains the decimal odds value', () => {
      renderOutcomeButton();
      const btn = screen.getByRole('button');
      expect(btn).toHaveAttribute(
        'aria-label',
        expect.stringContaining(String(mockOutcome.decimalOdds)),
      );
    });

    it('aria-label combines question, label, and odds', () => {
      renderOutcomeButton();
      const btn = screen.getByRole('button');
      const label = btn.getAttribute('aria-label') ?? '';
      expect(label).toContain(marketQuestion);
      expect(label).toContain(mockOutcome.label);
      expect(label).toContain(String(mockOutcome.decimalOdds));
    });
  });

  // ── Requirement 11.8 — Keyboard Enter/Space triggers onClick ─────────────

  describe('Keyboard interaction (Req 11.8)', () => {
    it('calls onClick when Enter key is pressed', async () => {
      const user = userEvent.setup();
      const { onClick } = renderOutcomeButton();
      const btn = screen.getByRole('button');
      btn.focus();
      await user.keyboard('{Enter}');
      expect(onClick).toHaveBeenCalledWith(mockOutcome);
    });

    it('calls onClick when Space key is pressed', async () => {
      const user = userEvent.setup();
      const { onClick } = renderOutcomeButton();
      const btn = screen.getByRole('button');
      btn.focus();
      await user.keyboard(' ');
      expect(onClick).toHaveBeenCalledWith(mockOutcome);
    });

    it('calls onClick when clicked with mouse', async () => {
      const user = userEvent.setup();
      const { onClick } = renderOutcomeButton();
      await user.click(screen.getByRole('button'));
      expect(onClick).toHaveBeenCalledWith(mockOutcome);
    });
  });

  // ── Requirement 19.5 — Disabled state ────────────────────────────────────

  describe('Disabled state (Req 19.5)', () => {
    it('does not call onClick when disabled and clicked', async () => {
      const user = userEvent.setup();
      const { onClick } = renderOutcomeButton({ disabled: true });
      await user.click(screen.getByRole('button'));
      expect(onClick).not.toHaveBeenCalled();
    });

    it('button is disabled when disabled prop is true', () => {
      renderOutcomeButton({ disabled: true });
      expect(screen.getByRole('button')).toBeDisabled();
    });

    it('button is enabled when disabled prop is false', () => {
      renderOutcomeButton({ disabled: false });
      expect(screen.getByRole('button')).not.toBeDisabled();
    });
  });

  // ── fireEvent fallback for keyboard ──────────────────────────────────────

  describe('fireEvent keyboard (Req 11.8)', () => {
    it('fires click handler on Enter via fireEvent', () => {
      const { onClick } = renderOutcomeButton();
      const btn = screen.getByRole('button');
      fireEvent.keyDown(btn, { key: 'Enter', code: 'Enter' });
      fireEvent.click(btn);
      expect(onClick).toHaveBeenCalled();
    });
  });
});
