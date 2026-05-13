import { useEffect, useRef, useState } from 'react';
import type { MiniMarket, Outcome } from '../../../types/market';
import { LivePill } from '../LivePill/LivePill';
import { OutcomeButton } from '../OutcomeButton/OutcomeButton';
import styles from './MarketCard.module.css';

export interface MarketCardProps {
  market: MiniMarket;
  onOutcomeClick: (outcome: Outcome) => void;
}

/**
 * Formats a number of seconds as MM:SS (e.g. 23 → "00:23", 90 → "01:30").
 */
function formatTTL(seconds: number): string {
  const s = Math.max(0, Math.floor(seconds));
  const mm = String(Math.floor(s / 60)).padStart(2, '0');
  const ss = String(s % 60).padStart(2, '0');
  return `${mm}:${ss}`;
}

/**
 * MarketCard
 *
 * Renders a single Mini_Market card with:
 * - LivePill badge
 * - TTL countdown in Oswald MM:SS format with aria-live="polite"
 * - Market question
 * - One OutcomeButton per outcome
 *
 * When market.status is 'settled':
 * - Dims the card
 * - Shows green checkmark (✓) on the winning outcome
 * - Shows grey dash (–) on losing outcomes
 * - After 3 s, adds a CSS class that collapses/slides the card out
 *
 * Validates: Requirements 10.2, 10.3, 10.5, 10.6, 10.7, 17.2
 */
export function MarketCard({ market, onOutcomeClick }: MarketCardProps) {
  const isSettled = market.status === 'settled';
  const isDisabled = market.status !== 'open';

  const [collapsed, setCollapsed] = useState(false);
  const collapseTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // When the market becomes settled, schedule the collapse animation after 3 s.
  useEffect(() => {
    if (isSettled) {
      collapseTimerRef.current = setTimeout(() => {
        setCollapsed(true);
      }, 3000);
    }
    return () => {
      if (collapseTimerRef.current !== null) {
        clearTimeout(collapseTimerRef.current);
        collapseTimerRef.current = null;
      }
    };
  }, [isSettled]);

  const cardClassName = [
    styles.card,
    isSettled ? styles.settled : '',
    collapsed ? styles.collapsed : '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <article className={cardClassName} aria-label={market.question}>
      {/* Header row: LivePill + TTL countdown */}
      <div className={styles.header}>
        <LivePill />
        <span
          className={styles.ttl}
          aria-live="polite"
          aria-atomic="true"
          aria-label={`Verbleibende Zeit: ${formatTTL(market.ttlSeconds)}`}
        >
          {formatTTL(market.ttlSeconds)}
        </span>
      </div>

      {/* Market question */}
      <p className={styles.question}>{market.question}</p>

      {/* Outcome buttons */}
      <div className={styles.outcomes}>
        {market.outcomes.map((outcome) => {
          const isWinner = isSettled && outcome.id === market.winningOutcomeId;
          const isLoser = isSettled && outcome.id !== market.winningOutcomeId;

          return (
            <div key={outcome.id} className={styles.outcomeWrapper}>
              <OutcomeButton
                outcome={outcome}
                marketQuestion={market.question}
                onClick={onOutcomeClick}
                disabled={isDisabled}
              />
              {isWinner && (
                <span className={styles.winIndicator} aria-label="Gewinner">
                  ✓
                </span>
              )}
              {isLoser && (
                <span className={styles.lossIndicator} aria-label="Verlierer">
                  –
                </span>
              )}
            </div>
          );
        })}
      </div>
    </article>
  );
}

export default MarketCard;
