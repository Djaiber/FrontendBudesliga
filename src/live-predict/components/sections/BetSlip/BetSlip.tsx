import { useCallback, useEffect, useId, useRef, useState } from 'react';
import { de } from '../../../i18n/de';
import { useMarketStore } from '../../../store/marketStore';
import { useBetStore } from '../../../store/betStore';
import { usePointsStore } from '../../../store/pointsStore';
import { createApiClient } from '../../../config/dataSource';
import type { MiniMarket, Outcome } from '../../../types/market';
import styles from './BetSlip.module.css';

// ─── Props ────────────────────────────────────────────────────────────────────

export interface BetSlipProps {
  /** The market the user is betting on. */
  market: MiniMarket;
  /** The outcome the user selected. */
  selectedOutcome: Outcome;
  /**
   * Called when the modal should close.
   * @param expired - true when the market TTL reached 0 while the modal was open.
   */
  onClose: (expired?: boolean) => void;
  /**
   * Ref to the OutcomeButton that triggered the modal.
   * Focus is returned to this element on close.
   */
  triggerRef?: React.RefObject<HTMLElement>;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Clamp a number to [min, max]. */
function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

/** Format a number to two decimal places. */
function formatPayout(value: number): string {
  return value.toFixed(2);
}

// ─── Component ────────────────────────────────────────────────────────────────

/**
 * BetSlip
 *
 * A modal dialog that lets the user confirm a bet on a selected outcome.
 *
 * Features:
 * - Displays market question, outcome label, and decimal odds.
 * - Numeric stake input (min 1, max 500) with real-time payout calculation.
 * - "Wette bestätigen" submits the bet via the API client; on success dispatches
 *   addBet to betStore and calls onClose().
 * - On API failure, shows an inline German error without closing the modal.
 * - Watches the market's ttlSeconds from marketStore; when it reaches 0 calls
 *   onClose(true) so the parent can show a toast.
 * - Traps keyboard focus within the modal (Tab / Shift+Tab cycle).
 * - Escape key closes the modal.
 * - Returns focus to triggerRef.current on close.
 *
 * Validates: Requirements 11.1, 11.2, 11.3, 11.4, 11.5, 11.6, 11.7, 17.3
 */
export function BetSlip({
  market,
  selectedOutcome,
  onClose,
  triggerRef,
}: BetSlipProps) {
  // ── IDs for aria-labelledby ─────────────────────────────────────────────────
  const titleId = useId();

  // ── Local state ─────────────────────────────────────────────────────────────
  const [amountStr, setAmountStr] = useState<string>('10');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // ── Store reads ─────────────────────────────────────────────────────────────
  const addBet = useBetStore((state) => state.addBet);
  const deductPoints = usePointsStore((state) => state.deductPoints);

  // Watch the live ttlSeconds for this market from the store so we react to
  // real-time TTL decrements driven by MarketsFeed's setInterval.
  const liveTtl = useMarketStore((state) => {
    const found = state.openMarkets.find((m) => m.id === market.id);
    // If the market is no longer in openMarkets it has been settled/removed.
    return found ? found.ttlSeconds : 0;
  });

  // ── Refs for focus management ────────────────────────────────────────────────
  const dialogRef = useRef<HTMLDivElement>(null);
  const amountInputRef = useRef<HTMLInputElement>(null);
  const hasExpiredRef = useRef(false);

  // ── Derived values ───────────────────────────────────────────────────────────
  const amount = parseFloat(amountStr);
  const isValidAmount =
    !isNaN(amount) && amount >= 1 && amount <= 500 && Number.isFinite(amount);
  const payout = isValidAmount
    ? amount * selectedOutcome.decimalOdds
    : 0;

  // ── Focus trap on mount ──────────────────────────────────────────────────────
  useEffect(() => {
    // Focus the amount input when the modal opens.
    amountInputRef.current?.focus();
  }, []);

  // ── TTL expiry watcher ───────────────────────────────────────────────────────
  useEffect(() => {
    if (liveTtl <= 0 && !hasExpiredRef.current) {
      hasExpiredRef.current = true;
      // Return focus before closing
      triggerRef?.current?.focus();
      onClose(true);
    }
  }, [liveTtl, onClose, triggerRef]);

  // ── Close helper (returns focus) ─────────────────────────────────────────────
  const handleClose = useCallback(
    (expired?: boolean) => {
      triggerRef?.current?.focus();
      onClose(expired);
    },
    [onClose, triggerRef],
  );

  // ── Keyboard handler — focus trap + Escape ───────────────────────────────────
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLDivElement>) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        handleClose();
        return;
      }

      if (e.key !== 'Tab') return;

      const dialog = dialogRef.current;
      if (!dialog) return;

      // Collect all focusable elements inside the modal.
      const focusable = Array.from(
        dialog.querySelectorAll<HTMLElement>(
          'button:not([disabled]), input:not([disabled]), [tabindex]:not([tabindex="-1"])',
        ),
      ).filter((el) => !el.closest('[aria-hidden="true"]'));

      if (focusable.length === 0) return;

      const first = focusable[0];
      const last = focusable[focusable.length - 1];

      if (e.shiftKey) {
        // Shift+Tab: if focus is on first element, wrap to last.
        if (document.activeElement === first) {
          e.preventDefault();
          last.focus();
        }
      } else {
        // Tab: if focus is on last element, wrap to first.
        if (document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    },
    [handleClose],
  );

  // ── Amount input handler ─────────────────────────────────────────────────────
  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setAmountStr(e.target.value);
    setError(null);
  };

  // ── Submit handler ───────────────────────────────────────────────────────────
  const handleConfirm = async () => {
    if (!isValidAmount) {
      setError(de.betSlipErrorGeneric);
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const bet = await createApiClient().placeBet({
        marketId: market.id,
        outcomeId: selectedOutcome.id,
        stake: clamp(amount, 1, 500),
        decimalOdds: selectedOutcome.decimalOdds,
        matchId: market.matchId,
        marketQuestion: market.question,
        outcomeLabel: selectedOutcome.label,
      });

      addBet(bet);
      deductPoints(bet.stake);
      handleClose();
    } catch {
      setError(de.betSlipErrorGeneric);
    } finally {
      setIsSubmitting(false);
    }
  };

  // ── Backdrop click ───────────────────────────────────────────────────────────
  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    // Only close if the click was directly on the backdrop, not the dialog.
    if (e.target === e.currentTarget) {
      handleClose();
    }
  };

  // ── Render ───────────────────────────────────────────────────────────────────
  return (
    /* Backdrop */
    <div
      className={styles.backdrop}
      onClick={handleBackdropClick}
      aria-hidden="false"
    >
      {/* Dialog */}
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className={styles.dialog}
        onKeyDown={handleKeyDown}
      >
        {/* ── Header ─────────────────────────────────────────────────────── */}
        <h2 id={titleId} className={styles.title}>
          {market.question}
        </h2>

        {/* ── Selected outcome summary ────────────────────────────────────── */}
        <div className={styles.outcomeSummary}>
          <span className={styles.outcomeLabel}>{selectedOutcome.label}</span>
          <span className={styles.outcomeOdds}>
            {selectedOutcome.decimalOdds.toFixed(2)}
          </span>
        </div>

        {/* ── Stake input ─────────────────────────────────────────────────── */}
        <div className={styles.fieldGroup}>
          <label htmlFor="betslip-amount" className={styles.fieldLabel}>
            {de.betSlipStakeLabel}
          </label>
          <input
            ref={amountInputRef}
            id="betslip-amount"
            type="number"
            className={styles.amountInput}
            value={amountStr}
            min={1}
            max={500}
            step={1}
            onChange={handleAmountChange}
            disabled={isSubmitting}
            aria-describedby={error ? 'betslip-error' : undefined}
          />
        </div>

        {/* ── Payout display ──────────────────────────────────────────────── */}
        <div className={styles.payoutRow}>
          <span className={styles.payoutLabel}>{de.betSlipPayoutLabel}</span>
          <span className={styles.payoutValue}>
            {isValidAmount ? formatPayout(payout) : '–'}
          </span>
        </div>

        {/* ── Inline error ────────────────────────────────────────────────── */}
        {error && (
          <p
            id="betslip-error"
            className={styles.errorMessage}
            role="alert"
            aria-live="assertive"
          >
            {error}
          </p>
        )}

        {/* ── Action buttons ──────────────────────────────────────────────── */}
        <div className={styles.actions}>
          <button
            type="button"
            className={styles.confirmButton}
            onClick={handleConfirm}
            disabled={isSubmitting || !isValidAmount}
          >
            {de.betSlipConfirm}
          </button>
          <button
            type="button"
            className={styles.cancelButton}
            onClick={() => handleClose()}
            disabled={isSubmitting}
          >
            {de.betSlipCancel}
          </button>
        </div>
      </div>
    </div>
  );
}

export default BetSlip;
