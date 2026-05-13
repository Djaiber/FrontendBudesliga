import type { Outcome, MiniMarket, MarketStatus } from '../types/market';
import type { Bet, BetStatus } from '../types/bet';
import type { ParseResult } from '@/parsers/frameParser';

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

function isObject(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v);
}

function nonEmptyString(v: unknown, field: string): ParseResult<string> {
  if (typeof v !== 'string' || v.trim() === '') {
    return { ok: false, error: `${field} must be a non-empty string` };
  }
  return { ok: true, value: v };
}

const MARKET_CATEGORIES = ['Tor', 'Torschuss', 'Ecke', 'Freistoß', 'Sprint', 'Andere'] as const;
type MarketCategory = (typeof MARKET_CATEGORIES)[number];

const MARKET_STATUSES: MarketStatus[] = ['open', 'settled', 'cancelled'];
const BET_STATUSES: BetStatus[] = ['ausstehend', 'gewonnen', 'verloren', 'storniert'];

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Validates a raw unknown value and returns a typed Outcome or an error.
 */
export function parseOutcome(raw: unknown): ParseResult<Outcome> {
  if (!isObject(raw)) {
    return { ok: false, error: 'Outcome must be a non-null object' };
  }

  const { id, label, decimalOdds, impliedProbability } = raw;

  const idResult = nonEmptyString(id, 'id');
  if (!idResult.ok) return idResult;

  const labelResult = nonEmptyString(label, 'label');
  if (!labelResult.ok) return labelResult;

  if (typeof decimalOdds !== 'number' || decimalOdds <= 1) {
    return { ok: false, error: 'decimalOdds must be a number greater than 1' };
  }

  if (typeof impliedProbability !== 'number' || impliedProbability < 0 || impliedProbability > 1) {
    return { ok: false, error: 'impliedProbability must be a number in [0, 1]' };
  }

  return {
    ok: true,
    value: {
      id: idResult.value,
      label: labelResult.value,
      decimalOdds,
      impliedProbability,
    },
  };
}

/**
 * Validates a raw unknown value and returns a typed MiniMarket or an error.
 * Validates that outcomes array length is 2–4.
 */
export function parseMiniMarket(raw: unknown): ParseResult<MiniMarket> {
  if (!isObject(raw)) {
    return { ok: false, error: 'MiniMarket must be a non-null object' };
  }

  const { id, matchId, question, category, outcomes, ttlSeconds, openedAt, status, winningOutcomeId } = raw;

  const idResult = nonEmptyString(id, 'id');
  if (!idResult.ok) return idResult;

  const matchIdResult = nonEmptyString(matchId, 'matchId');
  if (!matchIdResult.ok) return matchIdResult;

  const questionResult = nonEmptyString(question, 'question');
  if (!questionResult.ok) return questionResult;

  if (!MARKET_CATEGORIES.includes(category as MarketCategory)) {
    return {
      ok: false,
      error: `category must be one of: ${MARKET_CATEGORIES.join(', ')}`,
    };
  }

  if (!Array.isArray(outcomes)) {
    return { ok: false, error: 'outcomes must be an array' };
  }

  if (outcomes.length < 2 || outcomes.length > 4) {
    return { ok: false, error: 'outcomes must contain between 2 and 4 items' };
  }

  const parsedOutcomes: Outcome[] = [];
  for (let i = 0; i < outcomes.length; i++) {
    const result = parseOutcome(outcomes[i]);
    if (!result.ok) {
      return { ok: false, error: `outcomes[${i}]: ${result.error}` };
    }
    parsedOutcomes.push(result.value);
  }

  if (typeof ttlSeconds !== 'number' || ttlSeconds < 0) {
    return { ok: false, error: 'ttlSeconds must be a number >= 0' };
  }

  if (typeof openedAt !== 'number' || openedAt <= 0) {
    return { ok: false, error: 'openedAt must be a positive number' };
  }

  if (!MARKET_STATUSES.includes(status as MarketStatus)) {
    return {
      ok: false,
      error: `status must be one of: ${MARKET_STATUSES.join(', ')}`,
    };
  }

  if (winningOutcomeId !== undefined && (typeof winningOutcomeId !== 'string' || winningOutcomeId.trim() === '')) {
    return { ok: false, error: 'winningOutcomeId must be a non-empty string when provided' };
  }

  return {
    ok: true,
    value: {
      id: idResult.value,
      matchId: matchIdResult.value,
      question: questionResult.value,
      category: category as MarketCategory,
      outcomes: parsedOutcomes,
      ttlSeconds,
      openedAt,
      status: status as MarketStatus,
      ...(winningOutcomeId !== undefined ? { winningOutcomeId: winningOutcomeId as string } : {}),
    },
  };
}

/**
 * Serialises a typed MiniMarket back to a JSON-compatible plain object.
 */
export function prettyPrintMiniMarket(market: MiniMarket): object {
  return {
    id: market.id,
    matchId: market.matchId,
    question: market.question,
    category: market.category,
    outcomes: market.outcomes.map((o) => ({
      id: o.id,
      label: o.label,
      decimalOdds: o.decimalOdds,
      impliedProbability: o.impliedProbability,
    })),
    ttlSeconds: market.ttlSeconds,
    openedAt: market.openedAt,
    status: market.status,
    ...(market.winningOutcomeId !== undefined ? { winningOutcomeId: market.winningOutcomeId } : {}),
  };
}

/**
 * Validates a raw unknown value and returns a typed Bet or an error.
 * Validates that stake is in [1, 500].
 */
export function parseBet(raw: unknown): ParseResult<Bet> {
  if (!isObject(raw)) {
    return { ok: false, error: 'Bet must be a non-null object' };
  }

  const {
    id,
    matchId,
    marketId,
    marketQuestion,
    outcomeId,
    outcomeLabel,
    decimalOdds,
    stake,
    potentialReturn,
    actualReturn,
    status,
    placedAt,
  } = raw;

  const idResult = nonEmptyString(id, 'id');
  if (!idResult.ok) return idResult;

  const matchIdResult = nonEmptyString(matchId, 'matchId');
  if (!matchIdResult.ok) return matchIdResult;

  const marketIdResult = nonEmptyString(marketId, 'marketId');
  if (!marketIdResult.ok) return marketIdResult;

  const marketQuestionResult = nonEmptyString(marketQuestion, 'marketQuestion');
  if (!marketQuestionResult.ok) return marketQuestionResult;

  const outcomeIdResult = nonEmptyString(outcomeId, 'outcomeId');
  if (!outcomeIdResult.ok) return outcomeIdResult;

  const outcomeLabelResult = nonEmptyString(outcomeLabel, 'outcomeLabel');
  if (!outcomeLabelResult.ok) return outcomeLabelResult;

  if (typeof decimalOdds !== 'number' || decimalOdds <= 1) {
    return { ok: false, error: 'decimalOdds must be a number greater than 1' };
  }

  if (typeof stake !== 'number' || stake < 1 || stake > 500) {
    return { ok: false, error: 'stake must be a number in [1, 500]' };
  }

  if (typeof potentialReturn !== 'number' || potentialReturn < 0) {
    return { ok: false, error: 'potentialReturn must be a number >= 0' };
  }

  if (typeof actualReturn !== 'number' || actualReturn < 0) {
    return { ok: false, error: 'actualReturn must be a number >= 0' };
  }

  if (!BET_STATUSES.includes(status as BetStatus)) {
    return {
      ok: false,
      error: `status must be one of: ${BET_STATUSES.join(', ')}`,
    };
  }

  if (typeof placedAt !== 'number' || placedAt <= 0) {
    return { ok: false, error: 'placedAt must be a positive number' };
  }

  return {
    ok: true,
    value: {
      id: idResult.value,
      matchId: matchIdResult.value,
      marketId: marketIdResult.value,
      marketQuestion: marketQuestionResult.value,
      outcomeId: outcomeIdResult.value,
      outcomeLabel: outcomeLabelResult.value,
      decimalOdds,
      stake,
      potentialReturn,
      actualReturn,
      status: status as BetStatus,
      placedAt,
    },
  };
}

/**
 * Serialises a typed Bet back to a JSON-compatible plain object.
 */
export function prettyPrintBet(bet: Bet): object {
  return {
    id: bet.id,
    matchId: bet.matchId,
    marketId: bet.marketId,
    marketQuestion: bet.marketQuestion,
    outcomeId: bet.outcomeId,
    outcomeLabel: bet.outcomeLabel,
    decimalOdds: bet.decimalOdds,
    stake: bet.stake,
    potentialReturn: bet.potentialReturn,
    actualReturn: bet.actualReturn,
    status: bet.status,
    placedAt: bet.placedAt,
  };
}
