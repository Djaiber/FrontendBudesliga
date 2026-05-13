import { useMatchStore } from '../../../store/matchStore';
import { de } from '../../../i18n/de';
import styles from './MetricsBar.module.css';

/**
 * MetricsBar
 *
 * Displays live match statistics above the PitchView in the left column:
 *   - Possession % per team
 *   - Accumulated xG per team
 *   - Total shots per team
 *   - Sprint count (players currently running at ≥ 25 km/h)
 *
 * Reads from `matchStore.metrics`, which is updated by the stream hook
 * whenever a KPI_Event or frame message arrives.
 *
 * Labels: Roboto Condensed 12px, var(--text-muted), uppercase.
 * Values: Roboto Condensed 14px, var(--text).
 *
 * Validates: Requirements 8.1, 8.2, 8.3
 */
export function MetricsBar() {
  const metrics = useMatchStore((state) => state.metrics);
  const currentMatch = useMatchStore((state) => state.currentMatch);

  const { home, away, sprintCount } = metrics;

  // Home / away short names for display (fall back to "H" / "A")
  const homeName = currentMatch?.homeTeam.shortName ?? 'H';
  const awayName = currentMatch?.awayTeam.shortName ?? 'A';

  return (
    <div className={styles.metricsBar} role="region" aria-label={de.metricsBarPossession}>
      {/* Possession */}
      <div className={styles.metric}>
        <span className={styles.label}>{de.metricsBarPossession}</span>
        <div className={styles.dualValue}>
          <span className={styles.value}>{home.possession.toFixed(0)}%</span>
          <span className={styles.teamSep}>/</span>
          <span className={styles.value}>{away.possession.toFixed(0)}%</span>
        </div>
        <div className={styles.teamNames}>
          <span className={styles.teamTag}>{homeName}</span>
          <span className={styles.teamTag}>{awayName}</span>
        </div>
      </div>

      <div className={styles.divider} aria-hidden="true" />

      {/* xG */}
      <div className={styles.metric}>
        <span className={styles.label}>{de.metricsBarXG}</span>
        <div className={styles.dualValue}>
          <span className={styles.value}>{home.xG.toFixed(2)}</span>
          <span className={styles.teamSep}>/</span>
          <span className={styles.value}>{away.xG.toFixed(2)}</span>
        </div>
        <div className={styles.teamNames}>
          <span className={styles.teamTag}>{homeName}</span>
          <span className={styles.teamTag}>{awayName}</span>
        </div>
      </div>

      <div className={styles.divider} aria-hidden="true" />

      {/* Shots */}
      <div className={styles.metric}>
        <span className={styles.label}>{de.metricsBarShots}</span>
        <div className={styles.dualValue}>
          <span className={styles.value}>{home.shots}</span>
          <span className={styles.teamSep}>/</span>
          <span className={styles.value}>{away.shots}</span>
        </div>
        <div className={styles.teamNames}>
          <span className={styles.teamTag}>{homeName}</span>
          <span className={styles.teamTag}>{awayName}</span>
        </div>
      </div>

      <div className={styles.divider} aria-hidden="true" />

      {/* Sprints */}
      <div className={styles.metric}>
        <span className={styles.label}>{de.metricsBarSprints}</span>
        <span className={styles.valueSingle}>{sprintCount}</span>
      </div>
    </div>
  );
}

export default MetricsBar;
