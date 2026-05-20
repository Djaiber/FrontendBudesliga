// ─── Domain types shared across routes, services, and parsers ─────────────────

export interface PlayerInfo {
  personId: string;
  shirtNumber: number;
  firstName: string;
  lastName: string;
  teamSide: 'home' | 'away';
  teamId: string;
  playingPosition?: string;
  starting: boolean;
}

export interface TeamInfo {
  teamId: string;
  teamName: string;
  shortName: string;
  role: 'home' | 'away';
  formation: string;
}

export interface MatchInfo {
  matchId: string;
  homeTeam: TeamInfo;
  awayTeam: TeamInfo;
  kickoffTime: string;
  result: string;
  competition: string;
  matchDay: number;
  season: string;
}

export interface PlayerPosition {
  playerId: string;
  jerseyNumber: number;
  teamSide: 'home' | 'away';
  x: number;       // metres, 0–105
  y: number;       // metres, 0–68
  speedKmh: number;
}

export interface BallPosition {
  x: number;
  y: number;
  z: number;
}

export interface Frame {
  matchId: string;
  timestamp: number;   // Unix ms
  frameN: number;
  players: PlayerPosition[];
  ball: BallPosition;
}

// ─── Market / Bet types ───────────────────────────────────────────────────────

export type MarketCategory = 'Tor' | 'Torschuss' | 'Ecke' | 'Freistoß' | 'Sprint' | 'Andere';
export type MarketStatus = 'open' | 'settled' | 'cancelled';
export type BetStatus = 'ausstehend' | 'gewonnen' | 'verloren' | 'storniert';

export interface Outcome {
  id: string;
  label: string;
  decimalOdds: number;
  impliedProbability: number;
}

export interface Market {
  id: string;
  matchId: string;
  question: string;
  category: MarketCategory;
  outcomes: Outcome[];
  ttlSeconds: number;
  openedAt: number;      // Unix ms
  status: MarketStatus;
  winningOutcomeId?: string;
}

export interface PlaceBetRequest {
  marketId: string;
  outcomeId: string;
  stake: number;         // 1–500 points
  userId?: string;
}

export interface Bet {
  id: string;
  matchId: string;
  marketId: string;
  marketQuestion: string;
  outcomeId: string;
  outcomeLabel: string;
  decimalOdds: number;
  stake: number;
  potentialReturn: number;
  actualReturn: number;
  status: BetStatus;
  placedAt: number;      // Unix ms
  settledAt?: number;
  userId?: string;
}

// ─── KPI event types ──────────────────────────────────────────────────────────

export interface KpiEvent {
  eventId: string;
  type: string;          // 'Play' | 'Reception' | 'Carry' | 'TacklingGame' | 'Goal' | ...
  teamId: string;
  playerId: string;
  gameTime?: string;
  syncedFrameId?: number;
  xPosition?: number;
  yPosition?: number;
  xP?: number;           // expected-pass probability
  evaluation?: string;
}

// ─── Prediction types ─────────────────────────────────────────────────────────

export interface NextGoalPrediction {
  matchId: string;
  computedAt: number;
  windowMinutes: number;
  homeProbability: number;
  awayProbability: number;
  noGoalProbability: number;
  homeOdds: number;
  awayOdds: number;
  noGoalOdds: number;
  basedOnFrameN: number;
  reasoning: {
    homePossession: number;
    awayPossession: number;
    homeAttackingThird: number;
    awayAttackingThird: number;
    homeAvgSpeed: number;
    awayAvgSpeed: number;
  };
}

// ─── WebSocket message types ──────────────────────────────────────────────────

export type WSMessageType = 'frame' | 'event' | 'market.new' | 'market.update' | 'market.settled' | 'status';

export interface WSMessage {
  type: WSMessageType;
  payload: unknown;
}
