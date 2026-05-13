import type { KPIEvent, KPIEventType } from '../types/event';
import type { ParseResult } from './frameParser';

// Re-export ParseResult so consumers can import from either parser
export type { ParseResult };

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

const KPI_EVENT_TYPES: readonly KPIEventType[] = [
  'goal',
  'shot',
  'corner',
  'foul',
  'sprint',
];

function isObject(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v);
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Validates a raw unknown value and returns a typed KPIEvent or an error.
 * Returns { ok: false, error } for any missing or out-of-range field.
 */
export function parseKPIEvent(raw: unknown): ParseResult<KPIEvent> {
  if (!isObject(raw)) {
    return { ok: false, error: 'KPIEvent must be a non-null object' };
  }

  const { id, matchId, type, minute, teamSide, playerId, xG, xP, detail } = raw;

  // Required: id — non-empty string
  if (typeof id !== 'string' || id.trim() === '') {
    return { ok: false, error: 'id must be a non-empty string' };
  }

  // Required: matchId — non-empty string
  if (typeof matchId !== 'string' || matchId.trim() === '') {
    return { ok: false, error: 'matchId must be a non-empty string' };
  }

  // Required: type — one of the KPIEventType union values
  if (!KPI_EVENT_TYPES.includes(type as KPIEventType)) {
    return {
      ok: false,
      error: `type must be one of: ${KPI_EVENT_TYPES.join(', ')}`,
    };
  }

  // Required: minute — number in [0, 120]
  if (typeof minute !== 'number' || minute < 0 || minute > 120) {
    return { ok: false, error: 'minute must be a number in [0, 120]' };
  }

  // Required: teamSide — 'home' | 'away'
  if (teamSide !== 'home' && teamSide !== 'away') {
    return { ok: false, error: "teamSide must be 'home' or 'away'" };
  }

  // Optional: playerId — string if present
  if (playerId !== undefined && typeof playerId !== 'string') {
    return { ok: false, error: 'playerId must be a string when provided' };
  }

  // Optional: xG — number in [0, 1] if present
  if (xG !== undefined) {
    if (typeof xG !== 'number' || xG < 0 || xG > 1) {
      return { ok: false, error: 'xG must be a number in [0, 1] when provided' };
    }
  }

  // Optional: xP — number in [0, 1] if present
  if (xP !== undefined) {
    if (typeof xP !== 'number' || xP < 0 || xP > 1) {
      return { ok: false, error: 'xP must be a number in [0, 1] when provided' };
    }
  }

  // Optional: detail — string if present
  if (detail !== undefined && typeof detail !== 'string') {
    return { ok: false, error: 'detail must be a string when provided' };
  }

  const event: KPIEvent = {
    id,
    matchId,
    type: type as KPIEventType,
    minute,
    teamSide,
  };

  if (playerId !== undefined) event.playerId = playerId as string;
  if (xG !== undefined) event.xG = xG as number;
  if (xP !== undefined) event.xP = xP as number;
  if (detail !== undefined) event.detail = detail as string;

  return { ok: true, value: event };
}

/**
 * Serialises a typed KPIEvent back to a JSON-compatible plain object.
 * The output is safe to pass to JSON.stringify.
 */
export function prettyPrintKPIEvent(event: KPIEvent): object {
  const result: Record<string, unknown> = {
    id: event.id,
    matchId: event.matchId,
    type: event.type,
    minute: event.minute,
    teamSide: event.teamSide,
  };

  if (event.playerId !== undefined) result['playerId'] = event.playerId;
  if (event.xG !== undefined) result['xG'] = event.xG;
  if (event.xP !== undefined) result['xP'] = event.xP;
  if (event.detail !== undefined) result['detail'] = event.detail;

  return result;
}
