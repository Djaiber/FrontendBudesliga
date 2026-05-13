import { useEffect, useRef, useState } from 'react';
import { useShallow } from 'zustand/react/shallow';
import {
  useMarketStore,
  filteredMarkets,
  marketCountByCategory,
} from '../../../store/marketStore';
import type { MiniMarket, Outcome } from '../../../types/market';
import { FilterPill } from '../../atoms/FilterPill/FilterPill';
import { MarketCard } from '../../atoms/MarketCard/MarketCard';
import { de } from '../../../i18n/de';
import styles from './MarketsFeed.module.css';

// ─── Filter pill definitions ──────────────────────────────────────────────────

type FilterValue = MiniMarket['category'] | 'Alle';

interface PillDef {
  label: string;
  value: FilterValue;
}

const PILLS: PillDef[] = [
  { label: de.filterAll, value: 'Alle' },
  { label: de.filterGoal, value: 'Tor' },
  { label: de.filterShot, value: 'Torschuss' },
  { label: de.filterCorner, value: 'Ecke' },
  { label: de.filterFreeKick, value: 'Freistoß' },
  { label: de.filterSprint, value: 'Sprint' },
];

// ─── Props ────────────────────────────────────────────────────────────────────

export interface MarketsFeedProps {
  /** Bubbles up to MatchDetailPage to open the BetSlip modal. */
  onOutcomeClick: (outcome: Outcome) => void;
}

/**
 * MarketsFeed
 *
 * Right-column section on the MatchDetailPage.
 *
 * - Renders six FilterPill tabs (Alle, Tor, Torschuss, Ecke, Freistoß, Sprint)
 *   with live counts from `marketCountByCategory`.
 * - Renders a vertical list of open MarketCard components ordered by
 *   `openedAt` descending (most recently opened first).
 * - Runs a `setInterval` every second calling `marketStore.tickTTL()` to
 *   decrement TTL counters; clears the interval on unmount.
 * - Below the active feed, renders a collapsible "Verlaufene Märkte" section
 *   showing settled markets (also sorted by openedAt descending).
 *
 * Validates: Requirements 10.1, 10.5, 10.6, 10.7, 10.8, 10.9
 */
export function MarketsFeed({ onOutcomeClick }: MarketsFeedProps) {
  // ── Store reads ─────────────────────────────────────────────────────────────
  const activeFilter = useMarketStore((state) => state.activeFilter);
  const setFilter = useMarketStore((state) => state.setFilter);
  const tickTTL = useMarketStore((state) => state.tickTTL);
  const settledMarkets = useMarketStore((state) => state.settledMarkets);

  // Derived: filtered open markets — useShallow prevents infinite re-renders
  // when the selector returns a new array reference on every call.
  const openFiltered = useMarketStore(useShallow(filteredMarkets));

  // Derived: count per category (over ALL open markets, not just filtered)
  const countByCategory = useMarketStore(useShallow(marketCountByCategory));

  // Total open market count for the "Alle" pill
  const totalOpen = useMarketStore((state) => state.openMarkets.length);

  // ── Local state ─────────────────────────────────────────────────────────────
  const [historyOpen, setHistoryOpen] = useState(false);

  // ── TTL interval ────────────────────────────────────────────────────────────
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    intervalRef.current = setInterval(() => {
      tickTTL();
    }, 1000);

    return () => {
      if (intervalRef.current !== null) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [tickTTL]);

  // ── Sort helpers ─────────────────────────────────────────────────────────────
  const sortedOpen = [...openFiltered].sort((a, b) => b.openedAt - a.openedAt);
  const sortedSettled = [...settledMarkets].sort((a, b) => b.openedAt - a.openedAt);

  // ── Pill count helper ────────────────────────────────────────────────────────
  function getPillCount(value: FilterValue): number {
    if (value === 'Alle') return totalOpen;
    return countByCategory[value] ?? 0;
  }

  // ── Render ───────────────────────────────────────────────────────────────────
  return (
    <section className={styles.feed} aria-label="Märkte">
      {/* ── Filter pills ──────────────────────────────────────────────────── */}
      <div className={styles.pillsRow} role="tablist" aria-label="Markt-Filter">
        {PILLS.map((pill) => (
          <FilterPill
            key={pill.value}
            label={pill.label}
            count={getPillCount(pill.value)}
            active={activeFilter === pill.value}
            onClick={() => setFilter(pill.value)}
          />
        ))}
      </div>

      {/* ── Open markets list ─────────────────────────────────────────────── */}
      <div className={styles.marketList} role="list" aria-label="Offene Märkte">
        {sortedOpen.length === 0 ? (
          <p className={styles.emptyState}>{de.emptyStateNoBets}</p>
        ) : (
          sortedOpen.map((market) => (
            <div key={market.id} role="listitem" className={styles.marketItem}>
              <MarketCard market={market} onOutcomeClick={onOutcomeClick} />
            </div>
          ))
        )}
      </div>

      {/* ── Settled markets collapsible ───────────────────────────────────── */}
      {sortedSettled.length > 0 && (
        <div className={styles.historySection}>
          <button
            type="button"
            className={styles.historyToggle}
            onClick={() => setHistoryOpen((prev) => !prev)}
            aria-expanded={historyOpen}
            aria-controls="settled-markets-list"
          >
            <span className={styles.historyToggleLabel}>
              Verlaufene Märkte
            </span>
            <span className={styles.historyCount}>{sortedSettled.length}</span>
            <span
              className={`${styles.chevron} ${historyOpen ? styles.chevronOpen : ''}`}
              aria-hidden="true"
            >
              ▾
            </span>
          </button>

          {historyOpen && (
            <div
              id="settled-markets-list"
              className={styles.settledList}
              role="list"
              aria-label="Verlaufene Märkte"
            >
              {sortedSettled.map((market) => (
                <div key={market.id} role="listitem" className={styles.marketItem}>
                  <MarketCard market={market} onOutcomeClick={onOutcomeClick} />
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </section>
  );
}

export default MarketsFeed;
