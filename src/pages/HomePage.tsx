/**
 * Bundesliga Homepage Component
 * Displays upcoming matches, standings, and news
 */
import styles from './HomePage.module.css';
import TeamLogo from '../components/TeamLogo';

export default function HomePage() {
  return (
    <div className={styles.homepage}>
      {/* Hero Section - Upcoming Matches */}
      <section className={styles.section}>
        <div className={styles.matchesCarousel}>
          <div className="matches-grid">
            <div className="match-card">
              <div className="match-time">08.05. 13:30</div>
              <div className="match-teams">
                <div className="team">
                  <TeamLogo team="BVB" size="medium" />
                  <div className="team-name">BVB</div>
                </div>
                <div className="match-score">3 : 2</div>
                <div className="team">
                  <TeamLogo team="SGE" size="medium" />
                  <div className="team-name">SGE</div>
                </div>
              </div>
              <div className="match-broadcaster">-</div>
            </div>

            <div className="match-card">
              <div className="match-time">09.05. 8:30</div>
              <div className="match-teams">
                <div className="team">
                  <TeamLogo team="RBL" size="medium" />
                  <div className="team-name">RBL</div>
                </div>
                <div className="match-score">vs</div>
                <div className="team">
                  <TeamLogo team="KAI" size="medium" />
                  <div className="team-name">KAI</div>
                </div>
              </div>
              <div className="match-broadcaster">ESPN</div>
            </div>

            <div className="match-card">
              <div className="match-time">09.05. 11:30</div>
              <div className="match-teams">
                <div className="team">
                  <TeamLogo team="VFB" size="medium" />
                  <div className="team-name">VFB</div>
                </div>
                <div className="match-score">vs</div>
                <div className="team">
                  <TeamLogo team="B04" size="medium" />
                  <div className="team-name">B04</div>
                </div>
              </div>
              <div className="match-broadcaster">ESPN</div>
            </div>

            <div className="match-card">
              <div className="match-time">10.05. 8:30</div>
              <div className="match-teams">
                <div className="team">
                  <TeamLogo team="KOE" size="medium" />
                  <div className="team-name">KOE</div>
                </div>
                <div className="match-score">vs</div>
                <div className="team">
                  <TeamLogo team="BMG" size="medium" />
                  <div className="team-name">BMG</div>
                </div>
              </div>
              <div className="match-broadcaster">ESPN</div>
            </div>

            <div className="match-card">
              <div className="match-time">10.05. 10:30</div>
              <div className="match-teams">
                <div className="team">
                  <TeamLogo team="TSG" size="medium" />
                  <div className="team-name">TSG</div>
                </div>
                <div className="match-score">vs</div>
                <div className="team">
                  <TeamLogo team="SVW" size="medium" />
                  <div className="team-name">SVW</div>
                </div>
              </div>
              <div className="match-broadcaster">ESPN</div>
            </div>

            <div className="match-card">
              <div className="match-time">10.05. 12:30</div>
              <div className="match-teams">
                <div className="team">
                  <TeamLogo team="WOB" size="medium" />
                  <div className="team-name">WOB</div>
                </div>
                <div className="match-score">vs</div>
                <div className="team">
                  <TeamLogo team="FCB" size="medium" />
                  <div className="team-name">FCB</div>
                </div>
              </div>
              <div className="match-broadcaster">ESPN</div>
            </div>
          </div>
        </div>
      </section>

      {/* News Section */}
      <section className={styles.section}>
        <h2 className="section-header">
          Aktuelles
          <a href="#" className="section-link">ALLE NEWS →</a>
        </h2>
        <div className={styles.newsGrid}>
          <article className={styles.newsCard}>
            <div className={styles.newsIcon}>🏆</div>
            <div className={styles.newsCategory}>Spieltag 33</div>
            <h3 className={styles.newsTitle}>
              Dortmund dreht das Spiel gegen Frankfurt – BVB siegt 3:2 in dramatischer Schlussphase
            </h3>
            <div className={styles.newsDate}>08. Mai 2026</div>
          </article>

          <article className={styles.newsCard}>
            <div className={styles.newsIcon}>⚽</div>
            <div className={styles.newsCategory}>Bundesliga</div>
            <h3 className={styles.newsTitle}>
              Bayern München im Titelrennen: Alles offen vor den letzten Spieltagen
            </h3>
            <div className={styles.newsDate}>08. Mai 2026</div>
          </article>

          <article className={styles.newsCard}>
            <div className={styles.newsIcon}>🎯</div>
            <div className={styles.newsCategory}>Statistiken</div>
            <h3 className={styles.newsTitle}>
              Torjägerranking: Wer holt sich die Torjägerkrone der Saison 2025/26?
            </h3>
            <div className={styles.newsDate}>07. Mai 2026</div>
          </article>
        </div>
      </section>

      {/* Standings Section */}
      <section className={styles.section}>
        <h2 className="section-header">
          Tabelle
          <a href="#" className="section-link">VOLLSTÄNDIGE TABELLE →</a>
        </h2>
        <table className="standings-table">
          <thead>
            <tr>
              <th>#</th>
              <th>Club</th>
              <th>Sp</th>
              <th>S</th>
              <th>U</th>
              <th>N</th>
              <th>Tore</th>
              <th>Diff</th>
              <th>Pkt</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>1</td>
              <td><strong>Bayern München</strong></td>
              <td>33</td>
              <td>23</td>
              <td>5</td>
              <td>5</td>
              <td>85:38</td>
              <td>+47</td>
              <td><strong>74</strong></td>
            </tr>
            <tr>
              <td>2</td>
              <td><strong>Borussia Dortmund</strong></td>
              <td>33</td>
              <td>21</td>
              <td>4</td>
              <td>8</td>
              <td>72:44</td>
              <td>+28</td>
              <td><strong>67</strong></td>
            </tr>
            <tr>
              <td>3</td>
              <td><strong>VfL Wolfsburg</strong></td>
              <td>33</td>
              <td>18</td>
              <td>7</td>
              <td>8</td>
              <td>60:45</td>
              <td>+15</td>
              <td><strong>61</strong></td>
            </tr>
            <tr>
              <td>4</td>
              <td><strong>TSG Hoffenheim</strong></td>
              <td>33</td>
              <td>17</td>
              <td>7</td>
              <td>9</td>
              <td>55:42</td>
              <td>+13</td>
              <td><strong>58</strong></td>
            </tr>
            <tr>
              <td>5</td>
              <td><strong>RB Leipzig</strong></td>
              <td>33</td>
              <td>16</td>
              <td>8</td>
              <td>9</td>
              <td>58:44</td>
              <td>+14</td>
              <td><strong>56</strong></td>
            </tr>
          </tbody>
        </table>
      </section>

      {/* Call to Action - Live Predict */}
      <section className={styles.ctaSection}>
        <div className={styles.ctaCard}>
          <div className={styles.ctaIcon}>⚽</div>
          <h2 className={styles.ctaTitle}>Live Predict</h2>
          <p className={styles.ctaDescription}>
            Erlebe Bundesliga-Spiele in Echtzeit und nimm an spannenden Mini-Märkten teil!
          </p>
          <a href="/live-predict" className={styles.ctaButton}>
            Jetzt Live Predict entdecken →
          </a>
        </div>
      </section>
    </div>
  );
}
