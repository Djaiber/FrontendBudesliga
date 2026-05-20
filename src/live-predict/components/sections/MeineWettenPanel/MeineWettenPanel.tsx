import { useBetStore } from '../../../store/betStore';
import { usePointsStore } from '../../../store/pointsStore';
import { de } from '../../../i18n/de';
import type { Bet, BetStatus } from '../../../types/bet';
import styles from './MeineWettenPanel.module.css';

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Format a number with an explicit +/- sign and two decimal places. */
function formatPnL(value: number): string {
  if (value > 0) return `+${value.toFixed(2)}`;
  if (value < 0) return value.toFixed(2);
  return '0.00';
}

/** Map a BetStatus to its German display label from i18n. */
function statusLabel(status: BetStatus): string {
  switch (status) {
    case 'ausstehend': return de.statusPending;
    case 'gewonnen':   return de.statusWon;
    case 'verloren':   return de.statusLost;
    case 'storniert':  return de.statusCancelled;
  }
}

/** CSS modifier class for a given BetStatus. */
function statusClass(status: BetStatus): string {
  switch (status) {
    case 'ausstehend': return styles.statusPending;
    case 'gewonnen':   return styles.statusWon;
    case 'verloren':   return styles.statusLost;
    case 'storniert':  return styles.statusCancelled;
  }
}

// ─── Sub-component: single bet row ───────────────────────────────────────────

function BetRow({ bet }: { bet: Bet }) {
  return (
    <li className={styles.betRow} role="listitem">
      {/* Market question */}
      <span className={styles.betQuestion}>{bet.marketQuestion}</span>

      {/* Chosen outcome */}
      <span className={styles.betOutcome}>{bet.outcomeLabel}</span>

      {/* Stake */}
      <span className={styles.betStake}>{bet.stake.toFixed(2)}</span>

      {/* Decimal odds */}
      <span className={styles.betOdds}>{bet.decimalOdds.toFixed(2)}</span>

      {/* Status badge */}
      <span className={`${styles.betStatus} ${statusClass(bet.status)}`}>
        {statusLabel(bet.status)}
      </span>

      {/* Return amount */}
      <span className={styles.betReturn}>
        {bet.actualReturn > 0 ? bet.actualReturn.toFixed(2) : '–'}
      </span>
    </li>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

/**
 * MeineWettenPanel
 *
 * Displays the user's bets for the current match session below the two-column
 * match detail layout.
 *
 * - Reads `bets` and `sessionPnL` from `useBetStore`.
 * - Renders the session P&L summary figure above the bet list:
 *   green when positive, red when negative, grey when zero.
 * - Renders each bet row: market question, chosen outcome, stake, decimal odds,
 *   status (colour-coded), and return amount.
 * - When no bets exist, renders the German empty-state text.
 *
 * Validates: Requirements 12.1, 12.2, 12.3, 12.4
 */
export function MeineWettenPanel() {
  const bets    = useBetStore((state) => state.bets);
  const pnl     = useBetStore((state) => state.sessionPnL);
  const balance = usePointsStore((state) => state.balance);

  // Determine P&L colour class
  const pnlClass =
    pnl > 0 ? styles.pnlPositive :
    pnl < 0 ? styles.pnlNegative :
              styles.pnlNeutral;

  return (
    <section className={styles.panel} aria-label="Meine Wetten">
      {/* ── Section header ──────────────────────────────────────────────── */}
      <div className="section-header">
        <h2 className="section-title">Meine Wetten</h2>
      </div>

      {/* ── Points balance ───────────────────────────────────────────────── */}
      <div className={styles.pnlSummary} aria-live="polite">
        <span className={styles.pnlLabel}>Punktestand</span>
        <span className={styles.pnlValue} style={{ color: 'var(--color-accent, #f5a623)' }}>
          {balance.toFixed(0)} Pts
        </span>
      </div>

      {/* ── Session P&L summary ─────────────────────────────────────────── */}
      <div className={styles.pnlSummary} aria-live="polite">
        <span className={styles.pnlLabel}>Session P&amp;L</span>
        <span className={`${styles.pnlValue} ${pnlClass}`}>
          {formatPnL(pnl)}
        </span>
      </div>

      {/* ── Bet list or empty state ──────────────────────────────────────── */}
      {bets.length === 0 ? (
        <p className={styles.emptyState}>{de.emptyStateNoBets}</p>
      ) : (
        <>
          {/* Column headers */}
          <div className={styles.tableHeader} aria-hidden="true">
            <span>{de.historyColMarket}</span>
            <span>{de.historyColOutcome}</span>
            <span>{de.historyColStake}</span>
            <span>{de.historyColOdds}</span>
            <span>{de.historyColStatus}</span>
            <span>{de.historyColReturn}</span>
          </div>

          <ul className={styles.betList} role="list" aria-label="Wettenliste">
            {bets.map((bet) => (
              <BetRow key={bet.id} bet={bet} />
            ))}
          </ul>
        </>
      )}
    </section>
  );
}

export default MeineWettenPanel;
