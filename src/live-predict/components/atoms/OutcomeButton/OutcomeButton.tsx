import type { Outcome } from '../../../types/market';
import styles from './OutcomeButton.module.css';

export interface OutcomeButtonProps {
  outcome: Outcome;
  marketQuestion: string;
  onClick: (outcome: Outcome) => void;
  disabled: boolean;
}

/**
 * OutcomeButton
 *
 * Renders a single betting outcome as a native <button> element.
 * Displays the outcome label, decimal odds (Oswald 22px, var(--red)),
 * and implied probability (Roboto 12px, var(--text-muted)).
 *
 * Validates: Requirements 10.4, 11.8, 17.1, 17.5
 */
export function OutcomeButton({
  outcome,
  marketQuestion,
  onClick,
  disabled,
}: OutcomeButtonProps) {
  const impliedPct = Math.round(outcome.impliedProbability * 100);

  return (
    <button
      type="button"
      className={styles.btn}
      onClick={() => onClick(outcome)}
      disabled={disabled}
      aria-label={`${marketQuestion} – ${outcome.label} – ${outcome.decimalOdds}`}
    >
      <span className={styles.label}>{outcome.label}</span>
      <span className={styles.odds}>{outcome.decimalOdds.toFixed(2)}</span>
      <span className={styles.probability}>p ≈ {impliedPct}%</span>
    </button>
  );
}

export default OutcomeButton;
