/**
 * fast-check arbitraries for bundesliga-live-predict types.
 * Validates: Requirements 20.4
 */
import * as fc from 'fast-check';
import type { Match, MatchStatus, TeamInfo } from '../types/match';
import type { Frame, PlayerPosition, BallPosition } from '../types/frame';
import type { KPIEvent, KPIEventType } from '../types/event';
import type { MiniMarket, Outcome, MarketStatus } from '../types/market';
import type { Bet, BetStatus } from '../types/bet';

// ---------------------------------------------------------------------------
// match.ts
// ---------------------------------------------------------------------------

export const arbMatchStatus: fc.Arbitrary<MatchStatus> = fc.constantFrom(
  'upcoming',
  'live',
  'finished',
);

export const arbTeamInfo: fc.Arbitrary<TeamInfo> = fc.record({
  id: fc.uuid(),
  name: fc.string({ minLength: 1, maxLength: 60 }),
  shortName: fc.string({ minLength: 2, maxLength: 5 }),
  logoUrl: fc.webUrl(),
});

export const arbMatch: fc.Arbitrary<Match> = fc.record({
  id: fc.uuid(),
  homeTeam: arbTeamInfo,
  awayTeam: arbTeamInfo,
  homeScore: fc.nat({ max: 20 }),
  awayScore: fc.nat({ max: 20 }),
  minute: fc.integer({ min: 0, max: 120 }),
  status: arbMatchStatus,
  openMarketCount: fc.nat({ max: 50 }),
});

// ---------------------------------------------------------------------------
// frame.ts
// ---------------------------------------------------------------------------

export const arbPlayerPosition: fc.Arbitrary<PlayerPosition> = fc.record({
  playerId: fc.uuid(),
  jerseyNumber: fc.integer({ min: 1, max: 99 }),
  teamSide: fc.constantFrom('home' as const, 'away' as const),
  x: fc.float({ min: Math.fround(0), max: Math.fround(105), noNaN: true }),
  y: fc.float({ min: Math.fround(0), max: Math.fround(68), noNaN: true }),
  speedKmh: fc.float({ min: Math.fround(0), max: Math.fround(40), noNaN: true }),
});

const arbBallPosition: fc.Arbitrary<BallPosition> = fc.record({
  x: fc.float({ min: Math.fround(0), max: Math.fround(105), noNaN: true }),
  y: fc.float({ min: Math.fround(0), max: Math.fround(68), noNaN: true }),
  z: fc.float({ min: Math.fround(0), max: Math.fround(10), noNaN: true }),
});

export const arbFrame: fc.Arbitrary<Frame> = fc.record({
  matchId: fc.uuid(),
  timestamp: fc.integer({ min: 0, max: Number.MAX_SAFE_INTEGER }),
  players: fc.array(arbPlayerPosition, { minLength: 1, maxLength: 22 }),
  ball: arbBallPosition,
});

// ---------------------------------------------------------------------------
// event.ts
// ---------------------------------------------------------------------------

export const arbKPIEventType: fc.Arbitrary<KPIEventType> = fc.constantFrom(
  'goal',
  'shot',
  'corner',
  'foul',
  'sprint',
);

export const arbKPIEvent: fc.Arbitrary<KPIEvent> = fc
  .record({
    id: fc.uuid(),
    matchId: fc.uuid(),
    type: arbKPIEventType,
    minute: fc.integer({ min: 0, max: 120 }),
    teamSide: fc.constantFrom('home' as const, 'away' as const),
    playerId: fc.option(fc.uuid(), { nil: undefined }),
    xG: fc.option(fc.float({ min: 0, max: 1, noNaN: true }), { nil: undefined }),
    xP: fc.option(fc.float({ min: 0, max: 1, noNaN: true }), { nil: undefined }),
    detail: fc.option(fc.string({ maxLength: 120 }), { nil: undefined }),
  })
  .map(({ playerId, xG, xP, detail, ...rest }) => {
    // Strip undefined optional fields so the object matches the interface exactly
    const event: KPIEvent = { ...rest };
    if (playerId !== undefined) event.playerId = playerId;
    if (xG !== undefined) event.xG = xG;
    if (xP !== undefined) event.xP = xP;
    if (detail !== undefined) event.detail = detail;
    return event;
  });

// ---------------------------------------------------------------------------
// market.ts
// ---------------------------------------------------------------------------

export const arbOutcome: fc.Arbitrary<Outcome> = fc.record({
  id: fc.uuid(),
  label: fc.string({ minLength: 1, maxLength: 60 }),
  decimalOdds: fc.float({ min: Math.fround(1.01), max: Math.fround(100), noNaN: true }),
  impliedProbability: fc.float({ min: Math.fround(0), max: Math.fround(1), noNaN: true }),
});

const arbMarketStatus: fc.Arbitrary<MarketStatus> = fc.constantFrom(
  'open',
  'settled',
  'cancelled',
);

export const arbMiniMarket: fc.Arbitrary<MiniMarket> = fc
  .record({
    id: fc.uuid(),
    matchId: fc.uuid(),
    question: fc.string({ minLength: 1, maxLength: 120 }),
    category: fc.constantFrom(
      'Tor' as const,
      'Torschuss' as const,
      'Ecke' as const,
      'Freistoß' as const,
      'Sprint' as const,
      'Andere' as const,
    ),
    outcomes: fc.array(arbOutcome, { minLength: 2, maxLength: 4 }),
    ttlSeconds: fc.integer({ min: 0, max: 60 }),
    openedAt: fc.integer({ min: 0, max: Number.MAX_SAFE_INTEGER }),
    status: arbMarketStatus,
    winningOutcomeId: fc.option(fc.uuid(), { nil: undefined }),
  })
  .map(({ winningOutcomeId, ...rest }) => {
    const market: MiniMarket = { ...rest };
    if (winningOutcomeId !== undefined) market.winningOutcomeId = winningOutcomeId;
    return market;
  });

// ---------------------------------------------------------------------------
// bet.ts
// ---------------------------------------------------------------------------

const arbBetStatus: fc.Arbitrary<BetStatus> = fc.constantFrom(
  'ausstehend',
  'gewonnen',
  'verloren',
  'storniert',
);

export const arbBet: fc.Arbitrary<Bet> = fc
  .record({
    id: fc.uuid(),
    matchId: fc.uuid(),
    marketId: fc.uuid(),
    marketQuestion: fc.string({ minLength: 1, maxLength: 120 }),
    outcomeId: fc.uuid(),
    outcomeLabel: fc.string({ minLength: 1, maxLength: 60 }),
    decimalOdds: fc.float({ min: Math.fround(1.01), max: Math.fround(100), noNaN: true }),
    stake: fc.integer({ min: 1, max: 500 }),
    status: arbBetStatus,
    placedAt: fc.integer({ min: 0, max: Number.MAX_SAFE_INTEGER }),
  })
  .map(({ stake, decimalOdds, status, ...rest }) => {
    const potentialReturn = stake * decimalOdds;
    const actualReturn = status === 'gewonnen' ? potentialReturn : 0;
    const bet: Bet = {
      ...rest,
      stake,
      decimalOdds,
      potentialReturn,
      actualReturn,
      status,
    };
    return bet;
  });
