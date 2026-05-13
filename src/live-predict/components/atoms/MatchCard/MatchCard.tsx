import type { Match } from '../../../types/match';
import { LiveDot } from '../LiveDot/LiveDot';
import styles from './MatchCard.module.css';

export interface MatchCardProps {
  match: Match;
}

/**
 * MatchCard
 *
 * Displays a summary card for a single match: team logos, names, score,
 * match minute, open market count badge, and a LiveDot when the match is live.
 *
 * Reuses the `.match-card` base class pattern from the site and adds
 * CSS Module overrides for hover behaviour.
 *
 * Validates: Requirements 4.2, 4.3, 4.7, 4.8
 */
export function MatchCard({ match }: MatchCardProps) {
  const {
    homeTeam,
    awayTeam,
    homeScore,
    awayScore,
    minute,
    status,
    openMarketCount,
  } = match;

  return (
    <article className={`match-card ${styles.card}`}>
      {/* Live indicator */}
      {status === 'live' && (
        <div className={styles.liveRow}>
          <LiveDot />
        </div>
      )}

      {/* Teams and score */}
      <div className={styles.matchRow}>
        {/* Home team */}
        <div className={styles.team}>
          <img
            src={homeTeam.logoUrl}
            alt={homeTeam.name}
            width={28}
            height={28}
            className={styles.logo}
          />
          <span className={styles.teamName}>{homeTeam.name}</span>
        </div>

        {/* Score */}
        <div className={styles.scoreBlock}>
          <span className={styles.score}>{homeScore}</span>
          <span className={styles.scoreSep}>–</span>
          <span className={styles.score}>{awayScore}</span>
        </div>

        {/* Away team */}
        <div className={`${styles.team} ${styles.teamAway}`}>
          <span className={styles.teamName}>{awayTeam.name}</span>
          <img
            src={awayTeam.logoUrl}
            alt={awayTeam.name}
            width={28}
            height={28}
            className={styles.logo}
          />
        </div>
      </div>

      {/* Footer: minute + open market badge */}
      <div className={styles.footer}>
        <span className={styles.minute}>{minute}&apos;</span>
        {openMarketCount > 0 && (
          <span className={styles.marketBadge}>{openMarketCount}</span>
        )}
      </div>
    </article>
  );
}

export default MatchCard;
