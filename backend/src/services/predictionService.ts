import type { Frame, NextGoalPrediction } from '../types';

/**
 * Computes a "Nächstes Tor" prediction from recent tracking frames.
 *
 * Algorithm:
 *   1. Count players in each team's attacking third (x > 70 for home, x < 35 for away).
 *   2. Compute average speed per team (proxy for pressure / intensity).
 *   3. Compute possession: home possession ∝ share of players in the centre third.
 *   4. Derive goal probabilities and convert to fair-value decimal odds.
 */
export function predictNextGoal(
  matchId: string,
  recentFrames: Frame[],
  windowMinutes = 5,
): NextGoalPrediction {
  if (recentFrames.length === 0) {
    return defaultPrediction(matchId, windowMinutes);
  }

  // Use the last 10 frames for a smoothed snapshot
  const sample = recentFrames.slice(-10);

  let homeAttacking = 0;
  let awayAttacking = 0;
  let homeTotalSpeed = 0;
  let awayTotalSpeed = 0;
  let homeCount = 0;
  let awayCount = 0;
  let homeCentre = 0;
  let awayCentre = 0;

  for (const frame of sample) {
    for (const p of frame.players) {
      if (p.teamSide === 'home') {
        homeCount++;
        homeTotalSpeed += p.speedKmh;
        if (p.x > 70) homeAttacking++;         // home attacks right
        if (p.x >= 35 && p.x <= 70) homeCentre++;
      } else {
        awayCount++;
        awayTotalSpeed += p.speedKmh;
        if (p.x < 35) awayAttacking++;         // away attacks left
        if (p.x >= 35 && p.x <= 70) awayCentre++;
      }
    }
  }

  const homeAvgSpeed = homeCount > 0 ? homeTotalSpeed / homeCount : 0;
  const awayAvgSpeed = awayCount > 0 ? awayTotalSpeed / awayCount : 0;

  // Possession: fraction of players found in the centre third
  const centreTotal = homeCentre + awayCentre || 1;
  const homePossession = (homeCentre / centreTotal) * 100;
  const awayPossession = 100 - homePossession;

  // Attacking pressure score (higher = more dangerous)
  const homeScore = homeAttacking * 0.6 + homeAvgSpeed * 0.4;
  const awayScore = awayAttacking * 0.6 + awayAvgSpeed * 0.4;
  const total = homeScore + awayScore || 1;

  // Base probabilities for a goal in the next N minutes
  // Scale by window length (more time = higher chance of goal)
  const baseGoalProb = Math.min(0.65, windowMinutes * 0.075);
  const noGoalProb = 1 - baseGoalProb;

  const homeGoalProb = parseFloat(((homeScore / total) * baseGoalProb).toFixed(3));
  const awayGoalProb = parseFloat(((awayScore / total) * baseGoalProb).toFixed(3));
  const noGoal = parseFloat((1 - homeGoalProb - awayGoalProb).toFixed(3));

  // Convert probability → fair-value decimal odds (no margin)
  const toOdds = (p: number) => parseFloat((1 / Math.max(0.01, p)).toFixed(2));

  const lastFrame = recentFrames[recentFrames.length - 1];

  return {
    matchId,
    computedAt: Date.now(),
    windowMinutes,
    homeProbability: homeGoalProb,
    awayProbability: awayGoalProb,
    noGoalProbability: noGoal,
    homeOdds: toOdds(homeGoalProb),
    awayOdds: toOdds(awayGoalProb),
    noGoalOdds: toOdds(noGoalProb),
    basedOnFrameN: lastFrame.frameN,
    reasoning: {
      homePossession: parseFloat(homePossession.toFixed(1)),
      awayPossession: parseFloat(awayPossession.toFixed(1)),
      homeAttackingThird: homeAttacking,
      awayAttackingThird: awayAttacking,
      homeAvgSpeed: parseFloat(homeAvgSpeed.toFixed(2)),
      awayAvgSpeed: parseFloat(awayAvgSpeed.toFixed(2)),
    },
  };
}

function defaultPrediction(matchId: string, windowMinutes: number): NextGoalPrediction {
  return {
    matchId,
    computedAt: Date.now(),
    windowMinutes,
    homeProbability: 0.25,
    awayProbability: 0.15,
    noGoalProbability: 0.60,
    homeOdds: 4.0,
    awayOdds: 6.67,
    noGoalOdds: 1.67,
    basedOnFrameN: 0,
    reasoning: {
      homePossession: 50,
      awayPossession: 50,
      homeAttackingThird: 0,
      awayAttackingThird: 0,
      homeAvgSpeed: 0,
      awayAvgSpeed: 0,
    },
  };
}
