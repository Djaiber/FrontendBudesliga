import { useRoomStore } from '../../store/roomStore';
import { useTranslation } from '../../hooks/useTranslation';
import { getStreakMultiplier } from '../../utils/gamification';
import { tierLabel } from '../../utils/tierLabel';
import styles from './Leaderboard.module.css';

const TIER_CLASS: Record<string, string> = {
  Dummies: styles.tierDummies,
  Enthusiast: styles.tierEnthusiast,
  Amateur: styles.tierAmateur,
  Savvy: styles.tierSavvy,
};

export function Leaderboard() {
  const players = useRoomStore((s) => s.players);
  const { t } = useTranslation();

  const sorted = [...players].sort((a, b) => b.score - a.score);

  if (sorted.length === 0) return null;

  return (
    <div className={styles.leaderboard}>
      <div className={styles.header}>
        <span className={styles.headerTitle}>{t('leaderboard.title')}</span>
      </div>
      {sorted.map((player, i) => {
        const multiplier = getStreakMultiplier(player.streak);
        const tierClass = TIER_CLASS[player.tier];
        return (
          <div key={player.userId} className={styles.row}>
            <span className={styles.rank}>#{i + 1}</span>
            <span className={styles.name}>{player.name}</span>
            <span className="leaderboard-points">
              {player.score.toLocaleString('de-DE')} <span className="leaderboard-points-unit">{t('points.short')}</span>
            </span>
            {tierClass !== undefined && (
              <span className={`${styles.tier} ${tierClass}`}>
                {tierLabel(player.tier, t)}
              </span>
            )}
            {multiplier > 1 && (
              <span className={styles.streak}>×{multiplier}</span>
            )}
          </div>
        );
      })}
    </div>
  );
}