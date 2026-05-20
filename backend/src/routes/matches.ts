import { Router } from 'express';
import { parseMatchInfo } from '../parsers/matchInfoParser';
import { parseKpiData } from '../parsers/kpiParser';
import path from 'path';

const router = Router();
const DATA_DIR = process.env.DATA_DIR
  ? path.resolve(process.env.DATA_DIR)
  : path.resolve(__dirname, '../../../bundes_data');

// Cache parsed data on first request
let cachedMatch: ReturnType<typeof parseMatchInfo> | null = null;
let cachedEvents: ReturnType<typeof parseKpiData> | null = null;

function getMatchData() {
  if (!cachedMatch) {
    cachedMatch = parseMatchInfo(path.join(DATA_DIR, 'MatchInformations_Anonym.xml'));
  }
  return cachedMatch;
}

function getKpiData() {
  if (!cachedEvents) {
    cachedEvents = parseKpiData(path.join(DATA_DIR, 'kpi_data_Bayern_Hamburg.xml'));
  }
  return cachedEvents;
}

/**
 * GET /api/matches
 * Returns list of available matches (currently only one in the dataset).
 */
router.get('/', (_req, res) => {
  const { match } = getMatchData();
  res.json([
    {
      id: match.matchId,
      competition: match.competition,
      matchDay: match.matchDay,
      season: match.season,
      kickoffTime: match.kickoffTime,
      result: match.result,
      homeTeam: match.homeTeam,
      awayTeam: match.awayTeam,
      status: 'finished',
    },
  ]);
});

/**
 * GET /api/matches/:id
 * Returns full match detail including roster.
 */
router.get('/:id', (req, res) => {
  const { match, players } = getMatchData();

  if (req.params.id !== match.matchId && req.params.id !== 'DFL-MAT-111111') {
    return res.status(404).json({ error: 'Match not found' });
  }

  res.json({
    ...match,
    players,
  });
});

/**
 * GET /api/matches/:id/players
 * Returns the starting XI for each team.
 */
router.get('/:id/players', (_req, res) => {
  const { players } = getMatchData();
  res.json({
    home: players.filter((p) => p.teamSide === 'home'),
    away: players.filter((p) => p.teamSide === 'away'),
  });
});

/**
 * GET /api/matches/:id/events
 * Returns all KPI events (passes, carries, tackles…) for the match.
 * Optional query: ?type=Play&limit=50
 */
router.get('/:id/events', (req, res) => {
  const { events } = getKpiData();
  const typeFilter = req.query.type as string | undefined;
  const limit = parseInt((req.query.limit as string) || '100', 10);

  let result = typeFilter ? events.filter((e) => e.type === typeFilter) : events;
  result = result.slice(0, limit);

  res.json({ total: result.length, events: result });
});

export default router;
