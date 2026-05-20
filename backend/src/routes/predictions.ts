import { Router } from 'express';
import path from 'path';
import { predictNextGoal } from '../services/predictionService';
import { parseMatchInfo } from '../parsers/matchInfoParser';
import { parseKpiData } from '../parsers/kpiParser';
import { streamPositions, setBallCache } from '../parsers/positionsParser';
import type { Frame } from '../types';

const router = Router();
const DATA_DIR = process.env.DATA_DIR
  ? path.resolve(process.env.DATA_DIR)
  : path.resolve(__dirname, '../../../bundes_data');

// Cache recent frames for prediction computation
const recentFrames: Frame[] = [];
const MAX_CACHED_FRAMES = 50;

let dataLoaded = false;
let loadingPromise: Promise<void> | null = null;

async function ensureDataLoaded() {
  if (dataLoaded) return;
  if (loadingPromise) return loadingPromise;

  loadingPromise = (async () => {
    const { players } = parseMatchInfo(path.join(DATA_DIR, 'MatchInformations_Anonym.xml'));
    const { ballPositions } = parseKpiData(path.join(DATA_DIR, 'kpi_data_Bayern_Hamburg.xml'));

    setBallCache(ballPositions);

    const roster = new Map(players.map((p) => [p.personId, p]));

    // Load a representative 5-minute slice (750 frames at 400ms = 5 minutes)
    await streamPositions(path.join(DATA_DIR, 'Positions_Bayern_Hamburg.xml'), {
      roster,
      sampleEvery: 10,
      maxFrames: 750,
      onFrame: (frame) => {
        recentFrames.push(frame);
        if (recentFrames.length > MAX_CACHED_FRAMES) recentFrames.shift();
      },
      onEnd: () => { dataLoaded = true; },
    });
  })();

  return loadingPromise;
}

/**
 * GET /api/predictions/next-goal
 * Query: ?matchId=DFL-MAT-111111&window=5
 *
 * Computes a next-goal prediction from the most recently loaded tracking frames.
 * First call will trigger a background data load (~30 s for a 5-min slice).
 */
router.get('/next-goal', async (req, res) => {
  const matchId = (req.query.matchId as string) || 'DFL-MAT-111111';
  const windowMinutes = parseInt((req.query.window as string) || '5', 10);

  try {
    await ensureDataLoaded();
    const prediction = predictNextGoal(matchId, recentFrames, windowMinutes);
    res.json(prediction);
  } catch (err) {
    res.status(500).json({ error: 'Failed to compute prediction', detail: String(err) });
  }
});

export default router;
