import type { Frame, PlayerPosition, BallPosition } from '../types/frame';

// Shared ParseResult type — also re-exported for use by other parsers
export type ParseResult<T> =
  | { ok: true; value: T }
  | { ok: false; error: string };

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

function isObject(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v);
}

function parsePlayerPosition(raw: unknown, index: number): ParseResult<PlayerPosition> {
  if (!isObject(raw)) {
    return { ok: false, error: `players[${index}] is not an object` };
  }

  const { playerId, jerseyNumber, teamSide, x, y, speedKmh } = raw;

  if (typeof playerId !== 'string' || playerId.trim() === '') {
    return { ok: false, error: `players[${index}].playerId must be a non-empty string` };
  }

  if (typeof jerseyNumber !== 'number' || jerseyNumber < 1 || jerseyNumber > 99 || !Number.isInteger(jerseyNumber)) {
    return { ok: false, error: `players[${index}].jerseyNumber must be an integer in [1, 99]` };
  }

  if (teamSide !== 'home' && teamSide !== 'away') {
    return { ok: false, error: `players[${index}].teamSide must be 'home' or 'away'` };
  }

  if (typeof x !== 'number' || x < 0 || x > 105) {
    return { ok: false, error: `players[${index}].x must be a number in [0, 105]` };
  }

  if (typeof y !== 'number' || y < 0 || y > 68) {
    return { ok: false, error: `players[${index}].y must be a number in [0, 68]` };
  }

  if (typeof speedKmh !== 'number' || speedKmh < 0) {
    return { ok: false, error: `players[${index}].speedKmh must be a non-negative number` };
  }

  return {
    ok: true,
    value: {
      playerId,
      jerseyNumber,
      teamSide,
      x,
      y,
      speedKmh,
    },
  };
}

function parseBallPosition(raw: unknown): ParseResult<BallPosition> {
  if (!isObject(raw)) {
    return { ok: false, error: 'ball must be an object' };
  }

  const { x, y, z } = raw;

  if (typeof x !== 'number') {
    return { ok: false, error: 'ball.x must be a number' };
  }

  if (typeof y !== 'number') {
    return { ok: false, error: 'ball.y must be a number' };
  }

  if (typeof z !== 'number') {
    return { ok: false, error: 'ball.z must be a number' };
  }

  return { ok: true, value: { x, y, z } };
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Validates a raw unknown value and returns a typed Frame or an error.
 * Returns { ok: false, error } for any missing or out-of-range field.
 */
export function parseFrame(raw: unknown): ParseResult<Frame> {
  if (!isObject(raw)) {
    return { ok: false, error: 'Frame must be a non-null object' };
  }

  const { matchId, timestamp, players, ball } = raw;

  if (typeof matchId !== 'string' || matchId.trim() === '') {
    return { ok: false, error: 'matchId must be a non-empty string' };
  }

  if (typeof timestamp !== 'number' || timestamp <= 0) {
    return { ok: false, error: 'timestamp must be a positive number' };
  }

  if (!Array.isArray(players)) {
    return { ok: false, error: 'players must be an array' };
  }

  const parsedPlayers: PlayerPosition[] = [];
  for (let i = 0; i < players.length; i++) {
    const result = parsePlayerPosition(players[i], i);
    if (!result.ok) {
      return result;
    }
    parsedPlayers.push(result.value);
  }

  const ballResult = parseBallPosition(ball);
  if (!ballResult.ok) {
    return ballResult;
  }

  return {
    ok: true,
    value: {
      matchId,
      timestamp,
      players: parsedPlayers,
      ball: ballResult.value,
    },
  };
}

/**
 * Serialises a typed Frame back to a JSON-compatible plain object.
 * The output is safe to pass to JSON.stringify.
 */
export function prettyPrintFrame(frame: Frame): object {
  return {
    matchId: frame.matchId,
    timestamp: frame.timestamp,
    players: frame.players.map((p) => ({
      playerId: p.playerId,
      jerseyNumber: p.jerseyNumber,
      teamSide: p.teamSide,
      x: p.x,
      y: p.y,
      speedKmh: p.speedKmh,
    })),
    ball: {
      x: frame.ball.x,
      y: frame.ball.y,
      z: frame.ball.z,
    },
  };
}
