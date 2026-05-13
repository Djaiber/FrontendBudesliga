import { useMemo, useState } from 'react';
import { useBetStore } from '../../store/betStore';
import { de } from '../../i18n/de';
import type { Bet, BetStatus } from '../../types/bet';
import styles from './HistoryPage.module.css';

// ─── Types ────────────────────────────────────────────────────────────────────

type StatusFilter = 'alle' | BetStatus;

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Format a Unix-ms timestamp to a German-style date string (DD.MM.YYYY HH:MM). */
function formatDate(ms: number): string {
  const d = new Date(ms);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${pad(d.getDate())}.${pad(d.getMonth() + 1)}.${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
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
function statusBadgeClass(status: BetStatus): string {
  switch (status) {
    case 'ausstehend': return styles.statusPending;
    case 'gewonnen':   return styles.statusWon;
    case 'verloren':   return styles.statusLost;
    case 'storniert':  return styles.statusCancelled;
  }
}

// ─── Summary computation ──────────────────────────────────────────────────────

interface Summary {
  totalWagered: number;
  totalWon: number;
  netPnL: number;
  hitRate: number; // 0–1
}

function computeSummary(bets: Bet[]): Summary {
  const totalWagered = bets.reduce((sum, b) => sum + b.stake, 0);
  const totalWon = bets
    .filter((b) => b.status === 'gewonnen')
    .reduce((sum, b) => sum + b.actualReturn, 0);
  const netPnL = totalWon - totalWagered;

  const settledBets = bets.filter(
    (b) => b.status === 'gewonnen' || b.status === 'verloren',
  );
  const winningBets = settledBets.filter((b) => b.status === 'gewonnen');
  const hitRate = settledBets.length > 0 ? winningBets.length / settledBets.length : 0;

  return { totalWagered, totalWon, netPnL, hitRate };
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function SummaryRow({ summary }: { summary: Summary }) {
  const pnlClass =
    summary.netPnL > 0
      ? styles.summaryValuePositive
      : summary.netPnL < 0
        ? styles.summaryValueNegative
        : '';

  return (
    <div className={styles.summary} aria-label="Zusammenfassung" role="region">
      <div className={styles.summaryItem}>
        <span className={styles.summaryLabel}>{de.historyTotalWagered}</span>
        <span className={styles.summaryValue}>
          {summary.totalWagered.toFixed(2)}
        </span>
      </div>

      <div className={styles.summaryItem}>
        <span className={styles.summaryLabel}>{de.historyTotalWon}</span>
        <span className={`${styles.summaryValue} ${styles.summaryValuePositive}`}>
          {summary.totalWon.toFixed(2)}
        </span>
      </div>

      <div className={styles.summaryItem}>
        <span className={styles.summaryLabel}>{de.historyNetPnL}</span>
        <span className={`${styles.summaryValue} ${pnlClass}`}>
          {summary.netPnL >= 0 ? '+' : ''}
          {summary.netPnL.toFixed(2)}
        </span>
      </div>

      <div className={styles.summaryItem}>
        <span className={styles.summaryLabel}>{de.historyHitRate}</span>
        <span className={styles.summaryValue}>
          {(summary.hitRate * 100).toFixed(0)}%
        </span>
      </div>
    </div>
  );
}

function BetTableRow({ bet }: { bet: Bet }) {
  return (
    <tr>
      <td>{formatDate(bet.placedAt)}</td>
      <td>{bet.matchId}</td>
      <td>{bet.marketQuestion}</td>
      <td>{bet.outcomeLabel}</td>
      <td>{bet.stake.toFixed(2)}</td>
      <td>{bet.decimalOdds.toFixed(2)}</td>
      <td>
        <span className={`${styles.statusBadge} ${statusBadgeClass(bet.status)}`}>
          {statusLabel(bet.status)}
        </span>
      </td>
      <td>{bet.actualReturn > 0 ? bet.actualReturn.toFixed(2) : '–'}</td>
    </tr>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

/**
 * HistoryPage
 *
 * Displays all historical bets at `/live-predict/meine-wetten`.
 *
 * - Reads `bets` from `useBetStore`.
 * - Renders filter controls for status and match; filters update synchronously.
 * - Renders a summary row (totalWagered, totalWon, netPnL, hitRate) above the table.
 * - Renders a table styled with the existing `.standings-table` pattern.
 * - All strings imported from `i18n/de.ts`.
 *
 * Validates: Requirements 13.1, 13.2, 13.3, 13.4, 13.5
 */
export function HistoryPage() {
  const bets = useBetStore((state) => state.bets);

  const [statusFilter, setStatusFilter] = useState<StatusFilter>('alle');
  const [matchFilter, setMatchFilter] = useState<string>('alle');

  // Unique match IDs derived from all bets
  const matchIds = useMemo(
    () => Array.from(new Set(bets.map((b) => b.matchId))),
    [bets],
  );

  // Apply filters synchronously — no async, updates within the same render cycle
  const filteredBets = useMemo(() => {
    return bets.filter((b) => {
      const statusMatch =
        statusFilter === 'alle' || b.status === statusFilter;
      const matchMatch =
        matchFilter === 'alle' || b.matchId === matchFilter;
      return statusMatch && matchMatch;
    });
  }, [bets, statusFilter, matchFilter]);

  // Summary computed from filtered bets only
  const summary = useMemo(() => computeSummary(filteredBets), [filteredBets]);

  return (
    <section className={styles.page}>
      {/* ── Section header ──────────────────────────────────────────────── */}
      <div className="section-header">
        <h2 className="section-title">Meine Wetten</h2>
      </div>

      {/* ── Filter controls ─────────────────────────────────────────────── */}
      <div className={styles.filters} role="group" aria-label="Filter">
        {/* Status filter */}
        <div className={styles.filterGroup}>
          <label className={styles.filterLabel} htmlFor="history-status-filter">
            Status
          </label>
          <select
            id="history-status-filter"
            className={styles.filterSelect}
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
          >
            <option value="alle">{de.filterAll}</option>
            <option value="gewonnen">{de.statusWon}</option>
            <option value="verloren">{de.statusLost}</option>
            <option value="ausstehend">{de.statusPending}</option>
          </select>
        </div>

        {/* Match filter */}
        <div className={styles.filterGroup}>
          <label className={styles.filterLabel} htmlFor="history-match-filter">
            {de.historyColMatch}
          </label>
          <select
            id="history-match-filter"
            className={styles.filterSelect}
            value={matchFilter}
            onChange={(e) => setMatchFilter(e.target.value)}
          >
            <option value="alle">{de.filterAll}</option>
            {matchIds.map((id) => (
              <option key={id} value={id}>
                {id}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* ── Summary row ─────────────────────────────────────────────────── */}
      <SummaryRow summary={summary} />

      {/* ── Table or empty state ────────────────────────────────────────── */}
      {filteredBets.length === 0 ? (
        <p className={styles.emptyState}>{de.emptyStateNoBets}</p>
      ) : (
        <div className={styles.tableWrapper}>
          <table className="standings-table">
            <thead>
              <tr>
                <th scope="col">{de.historyColDate}</th>
                <th scope="col">{de.historyColMatch}</th>
                <th scope="col">{de.historyColMarket}</th>
                <th scope="col">{de.historyColOutcome}</th>
                <th scope="col">{de.historyColStake}</th>
                <th scope="col">{de.historyColOdds}</th>
                <th scope="col">{de.historyColStatus}</th>
                <th scope="col">{de.historyColReturn}</th>
              </tr>
            </thead>
            <tbody>
              {filteredBets.map((bet) => (
                <BetTableRow key={bet.id} bet={bet} />
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

export default HistoryPage;
