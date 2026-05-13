import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { createApiClient } from '../../config/dataSource';
import { de } from '../../i18n/de';
import { useMatchStore } from '../../store/matchStore';
import { MatchCard } from '../atoms/MatchCard/MatchCard';
import styles from './MatchListPage.module.css';

/**
 * MatchListPage
 *
 * Landing page for the Live Predict section (`/live-predict`).
 *
 * On mount, fetches live matches via the API client and stores them in
 * matchStore. A 5-second polling interval keeps the list fresh. The
 * interval is cleared on unmount to prevent memory leaks.
 *
 * Only matches with status `live` or `upcoming` are rendered as cards.
 * When none exist, a German empty-state message is shown.
 *
 * Clicking a MatchCard navigates to `/live-predict/:matchId`.
 *
 * Validates: Requirements 4.1, 4.4, 4.5, 4.6
 */
export function MatchListPage() {
  const navigate = useNavigate();
  const matches = useMatchStore((s) => s.matches);
  const setMatches = useMatchStore((s) => s.setMatches);

  useEffect(() => {
    const client = createApiClient();

    const fetchMatches = () => {
      client.getLiveMatches().then(setMatches).catch(console.error);
    };

    // Initial fetch on mount
    fetchMatches();

    // Poll every 5 seconds
    const intervalId = setInterval(fetchMatches, 5_000);

    return () => {
      clearInterval(intervalId);
    };
  }, [setMatches]);

  const visibleMatches = matches.filter(
    (m) => m.status === 'live' || m.status === 'upcoming',
  );

  const handleCardClick = (matchId: string) => {
    navigate(`/live-predict/${matchId}`);
  };

  return (
    <section className={styles.page}>
      <div className="section-header">
        <h2 className="section-title">{de.navLinkText}</h2>
      </div>

      {visibleMatches.length > 0 ? (
        <div className={styles.grid}>
          {visibleMatches.map((match) => (
            <button
              key={match.id}
              className={styles.cardWrapper}
              onClick={() => handleCardClick(match.id)}
              aria-label={`${match.homeTeam.name} vs ${match.awayTeam.name}`}
            >
              <MatchCard match={match} />
            </button>
          ))}
        </div>
      ) : (
        <div className={styles.emptyState}>
          <p className={styles.emptyMessage}>{de.emptyStateNoMatches}</p>
          <p className={styles.nextScheduled}>{de.nextScheduledMatches}</p>
        </div>
      )}
    </section>
  );
}

export default MatchListPage;
