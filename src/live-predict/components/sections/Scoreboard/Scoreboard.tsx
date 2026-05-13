import { useMatchStore } from '../../../store/matchStore';
import { LiveDot } from '../../atoms/LiveDot/LiveDot';
import TeamLogo from '../../../../components/TeamLogo';
import { de } from '../../../i18n/de';
import styles from './Scoreboard.module.css';

/**
 * Scoreboard
 *
 * Displays the current match score in a sports-terminal style.
 * Reads `currentMatch` from `matchStore` and renders:
 *   - Home team name
 *   - Home score  |  separator  |  Away score  (Oswald 56px, font-weight 300)
 *   - Away team name
 *   - Current match minute with a LiveDot when status is 'live'
 *
 * When `currentMatch` is null, renders a loading placeholder.
 *
 * Validates: Requirements 6.1, 6.2, 6.3
 */
export function Scoreboard() {
  const currentMatch = useMatchStore((state) => state.currentMatch);

  if (!currentMatch) {
    return (
      <div className={styles.placeholder} aria-busy="true">
        {de.loadingSpinner}
      </div>
    );
  }

  const { homeTeam, awayTeam, homeScore, awayScore, minute, status } =
    currentMatch;

  return (
    <section className={styles.scoreboard} aria-label={`${homeTeam.name} ${homeScore} – ${awayScore} ${awayTeam.name}`}>
      {/* Team names and score digits */}
      <div className={styles.scoreRow}>
        {/* Home team logo and name */}
        <div className={styles.teamBlock}>
          <TeamLogo team={homeTeam.shortName} size="medium" />
          <span className={`${styles.teamName} ${styles.teamNameHome}`}>
            {homeTeam.name}
          </span>
        </div>

        {/* Score block */}
        <div className={styles.scoreBlock}>
          <span className={styles.score}>{homeScore}</span>
          <span className={styles.scoreSep}>–</span>
          <span className={styles.score}>{awayScore}</span>
        </div>

        {/* Away team name and logo */}
        <div className={styles.teamBlock}>
          <span className={`${styles.teamName} ${styles.teamNameAway}`}>
            {awayTeam.name}
          </span>
          <TeamLogo team={awayTeam.shortName} size="medium" />
        </div>
      </div>

      {/* Match minute with LiveDot when live */}
      {status === 'live' && (
        <div className={styles.minuteRow}>
          <LiveDot />
          <span className={styles.minute}>{minute}&apos;</span>
        </div>
      )}
    </section>
  );
}

export default Scoreboard;
