/**
 * Property-based tests for DTO round-trips and parser rejection of invalid inputs.
 * Feature: bundesliga-live-predict
 * Property 15: DTO round-trip parse -> prettyPrint -> parse
 * Property 16: Parser rejects invalid inputs
 * **Validates: Requirements 20.1, 20.2**
 */
import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { parseFrame, prettyPrintFrame } from '../parsers/frameParser';
import { parseKPIEvent, prettyPrintKPIEvent } from '../parsers/eventParser';
import { parseMiniMarket, prettyPrintMiniMarket, parseBet, prettyPrintBet } from '../parsers/marketParser';
import {
  arbFrame,
  arbKPIEvent,
  arbMiniMarket,
  arbBet,
} from './arbitraries';

// ---------------------------------------------------------------------------
// Property 15: DTO round-trip  prettyPrint → JSON.stringify → JSON.parse → parse
// Feature: bundesliga-live-predict, Property 15: DTO round-trip parse -> prettyPrint -> parse
// ---------------------------------------------------------------------------

describe('Property 15: DTO round-trip', () => {
  it('Frame round-trip: prettyPrintFrame → JSON.stringify → JSON.parse → parseFrame produces a deeply equal Frame', () => {
    fc.assert(
      fc.property(arbFrame, (frame) => {
        // The arbitrary allows timestamp = 0 which parseFrame rejects; skip those
        fc.pre(frame.timestamp > 0);

        const serialised = JSON.parse(JSON.stringify(prettyPrintFrame(frame)));
        const result = parseFrame(serialised);
        expect(result.ok).toBe(true);
        if (result.ok) {
          expect(result.value).toEqual(frame);
        }
      }),
      { numRuns: 100 }
    );
  });

  it('KPIEvent round-trip: prettyPrintKPIEvent → JSON.stringify → JSON.parse → parseKPIEvent produces a deeply equal KPIEvent', () => {
    fc.assert(
      fc.property(arbKPIEvent, (event) => {
        const serialised = JSON.parse(JSON.stringify(prettyPrintKPIEvent(event)));
        const result = parseKPIEvent(serialised);
        expect(result.ok).toBe(true);
        if (result.ok) {
          expect(result.value).toEqual(event);
        }
      }),
      { numRuns: 100 }
    );
  });

  it('MiniMarket round-trip: prettyPrintMiniMarket → JSON.stringify → JSON.parse → parseMiniMarket produces a deeply equal MiniMarket', () => {
    fc.assert(
      fc.property(arbMiniMarket, (market) => {
        // Skip edge cases that the arbitrary can generate but the parser rejects:
        // - openedAt = 0 (parser requires > 0)
        // - whitespace-only strings (parser trims and rejects them)
        fc.pre(market.openedAt > 0);
        fc.pre(market.question.trim().length > 0);
        fc.pre(market.outcomes.every((o) => o.label.trim().length > 0));

        const serialised = JSON.parse(JSON.stringify(prettyPrintMiniMarket(market)));
        const result = parseMiniMarket(serialised);
        expect(result.ok).toBe(true);
        if (result.ok) {
          expect(result.value).toEqual(market);
        }
      }),
      { numRuns: 100 }
    );
  });

  it('Bet round-trip: prettyPrintBet → JSON.stringify → JSON.parse → parseBet produces a deeply equal Bet', () => {
    fc.assert(
      fc.property(arbBet, (bet) => {
        // Skip edge cases that the arbitrary can generate but the parser rejects:
        // - placedAt = 0 (parser requires > 0)
        // - whitespace-only strings (parser trims and rejects them)
        fc.pre(bet.placedAt > 0);
        fc.pre(bet.marketQuestion.trim().length > 0);
        fc.pre(bet.outcomeLabel.trim().length > 0);

        const serialised = JSON.parse(JSON.stringify(prettyPrintBet(bet)));
        const result = parseBet(serialised);
        expect(result.ok).toBe(true);
        if (result.ok) {
          expect(result.value).toEqual(bet);
        }
      }),
      { numRuns: 100 }
    );
  });
});

describe('Property 16: Parser Rejects Invalid Inputs', () => {
  // ---------------------------------------------------------------------------
  // Frame parser rejection tests
  // ---------------------------------------------------------------------------

  it('Frame parser rejects objects missing matchId', () => {
    fc.assert(
      fc.property(
        fc.record({
          // matchId intentionally omitted
          timestamp: fc.integer({ min: 1 }),
          players: fc.array(
            fc.record({
              playerId: fc.uuid(),
              jerseyNumber: fc.integer({ min: 1, max: 99 }),
              teamSide: fc.constantFrom('home' as const, 'away' as const),
              x: fc.float({ min: 0, max: 105, noNaN: true }),
              y: fc.float({ min: 0, max: 68, noNaN: true }),
              speedKmh: fc.float({ min: 0, max: 40, noNaN: true }),
            }),
            { minLength: 1, maxLength: 22 }
          ),
          ball: fc.record({
            x: fc.float({ min: 0, max: 105, noNaN: true }),
            y: fc.float({ min: 0, max: 68, noNaN: true }),
            z: fc.float({ min: 0, max: 10, noNaN: true }),
          }),
        }),
        (invalidFrame) => {
          const result = parseFrame(invalidFrame);
          expect(result.ok).toBe(false);
          if (!result.ok) {
            expect(result.error).toBeTruthy();
            expect(result.error.length).toBeGreaterThan(0);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it('Frame parser rejects objects with invalid timestamp', () => {
    fc.assert(
      fc.property(
        fc.record({
          matchId: fc.uuid(),
          timestamp: fc.constantFrom(0, -1, -100), // Invalid: must be positive
          players: fc.array(
            fc.record({
              playerId: fc.uuid(),
              jerseyNumber: fc.integer({ min: 1, max: 99 }),
              teamSide: fc.constantFrom('home' as const, 'away' as const),
              x: fc.float({ min: 0, max: 105, noNaN: true }),
              y: fc.float({ min: 0, max: 68, noNaN: true }),
              speedKmh: fc.float({ min: 0, max: 40, noNaN: true }),
            }),
            { minLength: 1, maxLength: 22 }
          ),
          ball: fc.record({
            x: fc.float({ min: 0, max: 105, noNaN: true }),
            y: fc.float({ min: 0, max: 68, noNaN: true }),
            z: fc.float({ min: 0, max: 10, noNaN: true }),
          }),
        }),
        (invalidFrame) => {
          const result = parseFrame(invalidFrame);
          expect(result.ok).toBe(false);
          if (!result.ok) {
            expect(result.error).toBeTruthy();
            expect(result.error.length).toBeGreaterThan(0);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it('Frame parser rejects objects with players array missing required fields', () => {
    fc.assert(
      fc.property(
        fc.record({
          matchId: fc.uuid(),
          timestamp: fc.integer({ min: 1 }),
          players: fc.array(
            fc.record({
              playerId: fc.uuid(),
              // jerseyNumber intentionally omitted
              teamSide: fc.constantFrom('home' as const, 'away' as const),
              x: fc.float({ min: 0, max: 105, noNaN: true }),
              y: fc.float({ min: 0, max: 68, noNaN: true }),
              speedKmh: fc.float({ min: 0, max: 40, noNaN: true }),
            }),
            { minLength: 1, maxLength: 22 }
          ),
          ball: fc.record({
            x: fc.float({ min: 0, max: 105, noNaN: true }),
            y: fc.float({ min: 0, max: 68, noNaN: true }),
            z: fc.float({ min: 0, max: 10, noNaN: true }),
          }),
        }),
        (invalidFrame) => {
          const result = parseFrame(invalidFrame);
          expect(result.ok).toBe(false);
          if (!result.ok) {
            expect(result.error).toBeTruthy();
            expect(result.error.length).toBeGreaterThan(0);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  // ---------------------------------------------------------------------------
  // MiniMarket parser rejection tests
  // ---------------------------------------------------------------------------

  it('MiniMarket parser rejects objects with outcomes.length < 2', () => {
    fc.assert(
      fc.property(
        fc.record({
          id: fc.uuid(),
          matchId: fc.uuid(),
          question: fc.string({ minLength: 1, maxLength: 120 }),
          category: fc.constantFrom(
            'Tor' as const,
            'Torschuss' as const,
            'Ecke' as const,
            'Freistoß' as const,
            'Sprint' as const,
            'Andere' as const
          ),
          outcomes: fc.array(
            fc.record({
              id: fc.uuid(),
              label: fc.string({ minLength: 1, maxLength: 60 }),
              decimalOdds: fc.float({ min: Math.fround(1.01), max: Math.fround(100), noNaN: true }),
              impliedProbability: fc.float({ min: 0, max: 1, noNaN: true }),
            }),
            { minLength: 0, maxLength: 1 } // Invalid: must be 2-4
          ),
          ttlSeconds: fc.integer({ min: 0, max: 60 }),
          openedAt: fc.integer({ min: 1 }),
          status: fc.constantFrom('open' as const, 'settled' as const, 'cancelled' as const),
        }),
        (invalidMarket) => {
          const result = parseMiniMarket(invalidMarket);
          expect(result.ok).toBe(false);
          if (!result.ok) {
            expect(result.error).toBeTruthy();
            expect(result.error.length).toBeGreaterThan(0);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it('MiniMarket parser rejects objects with outcomes.length > 4', () => {
    fc.assert(
      fc.property(
        fc.record({
          id: fc.uuid(),
          matchId: fc.uuid(),
          question: fc.string({ minLength: 1, maxLength: 120 }),
          category: fc.constantFrom(
            'Tor' as const,
            'Torschuss' as const,
            'Ecke' as const,
            'Freistoß' as const,
            'Sprint' as const,
            'Andere' as const
          ),
          outcomes: fc.array(
            fc.record({
              id: fc.uuid(),
              label: fc.string({ minLength: 1, maxLength: 60 }),
              decimalOdds: fc.float({ min: Math.fround(1.01), max: Math.fround(100), noNaN: true }),
              impliedProbability: fc.float({ min: 0, max: 1, noNaN: true }),
            }),
            { minLength: 5, maxLength: 10 } // Invalid: must be 2-4
          ),
          ttlSeconds: fc.integer({ min: 0, max: 60 }),
          openedAt: fc.integer({ min: 1 }),
          status: fc.constantFrom('open' as const, 'settled' as const, 'cancelled' as const),
        }),
        (invalidMarket) => {
          const result = parseMiniMarket(invalidMarket);
          expect(result.ok).toBe(false);
          if (!result.ok) {
            expect(result.error).toBeTruthy();
            expect(result.error.length).toBeGreaterThan(0);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it('MiniMarket parser rejects objects missing required fields', () => {
    fc.assert(
      fc.property(
        fc.record({
          id: fc.uuid(),
          // matchId intentionally omitted
          question: fc.string({ minLength: 1, maxLength: 120 }),
          category: fc.constantFrom(
            'Tor' as const,
            'Torschuss' as const,
            'Ecke' as const,
            'Freistoß' as const,
            'Sprint' as const,
            'Andere' as const
          ),
          outcomes: fc.array(
            fc.record({
              id: fc.uuid(),
              label: fc.string({ minLength: 1, maxLength: 60 }),
              decimalOdds: fc.float({ min: Math.fround(1.01), max: Math.fround(100), noNaN: true }),
              impliedProbability: fc.float({ min: 0, max: 1, noNaN: true }),
            }),
            { minLength: 2, maxLength: 4 }
          ),
          ttlSeconds: fc.integer({ min: 0, max: 60 }),
          openedAt: fc.integer({ min: 1 }),
          status: fc.constantFrom('open' as const, 'settled' as const, 'cancelled' as const),
        }),
        (invalidMarket) => {
          const result = parseMiniMarket(invalidMarket);
          expect(result.ok).toBe(false);
          if (!result.ok) {
            expect(result.error).toBeTruthy();
            expect(result.error.length).toBeGreaterThan(0);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  // ---------------------------------------------------------------------------
  // Bet parser rejection tests
  // ---------------------------------------------------------------------------

  it('Bet parser rejects objects with stake < 1', () => {
    fc.assert(
      fc.property(
        fc.record({
          id: fc.uuid(),
          matchId: fc.uuid(),
          marketId: fc.uuid(),
          marketQuestion: fc.string({ minLength: 1, maxLength: 120 }),
          outcomeId: fc.uuid(),
          outcomeLabel: fc.string({ minLength: 1, maxLength: 60 }),
          decimalOdds: fc.float({ min: Math.fround(1.01), max: Math.fround(100), noNaN: true }),
          stake: fc.constantFrom(0, -1, -100, 0.5), // Invalid: must be in [1, 500]
          potentialReturn: fc.float({ min: 0, noNaN: true }),
          actualReturn: fc.float({ min: 0, noNaN: true }),
          status: fc.constantFrom(
            'ausstehend' as const,
            'gewonnen' as const,
            'verloren' as const,
            'storniert' as const
          ),
          placedAt: fc.integer({ min: 1 }),
        }),
        (invalidBet) => {
          const result = parseBet(invalidBet);
          expect(result.ok).toBe(false);
          if (!result.ok) {
            expect(result.error).toBeTruthy();
            expect(result.error.length).toBeGreaterThan(0);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it('Bet parser rejects objects with stake > 500', () => {
    fc.assert(
      fc.property(
        fc.record({
          id: fc.uuid(),
          matchId: fc.uuid(),
          marketId: fc.uuid(),
          marketQuestion: fc.string({ minLength: 1, maxLength: 120 }),
          outcomeId: fc.uuid(),
          outcomeLabel: fc.string({ minLength: 1, maxLength: 60 }),
          decimalOdds: fc.float({ min: Math.fround(1.01), max: Math.fround(100), noNaN: true }),
          stake: fc.integer({ min: 501, max: 10000 }), // Invalid: must be in [1, 500]
          potentialReturn: fc.float({ min: 0, noNaN: true }),
          actualReturn: fc.float({ min: 0, noNaN: true }),
          status: fc.constantFrom(
            'ausstehend' as const,
            'gewonnen' as const,
            'verloren' as const,
            'storniert' as const
          ),
          placedAt: fc.integer({ min: 1 }),
        }),
        (invalidBet) => {
          const result = parseBet(invalidBet);
          expect(result.ok).toBe(false);
          if (!result.ok) {
            expect(result.error).toBeTruthy();
            expect(result.error.length).toBeGreaterThan(0);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it('Bet parser rejects objects missing required fields', () => {
    fc.assert(
      fc.property(
        fc.record({
          id: fc.uuid(),
          matchId: fc.uuid(),
          marketId: fc.uuid(),
          // marketQuestion intentionally omitted
          outcomeId: fc.uuid(),
          outcomeLabel: fc.string({ minLength: 1, maxLength: 60 }),
          decimalOdds: fc.float({ min: Math.fround(1.01), max: Math.fround(100), noNaN: true }),
          stake: fc.integer({ min: 1, max: 500 }),
          potentialReturn: fc.float({ min: 0, noNaN: true }),
          actualReturn: fc.float({ min: 0, noNaN: true }),
          status: fc.constantFrom(
            'ausstehend' as const,
            'gewonnen' as const,
            'verloren' as const,
            'storniert' as const
          ),
          placedAt: fc.integer({ min: 1 }),
        }),
        (invalidBet) => {
          const result = parseBet(invalidBet);
          expect(result.ok).toBe(false);
          if (!result.ok) {
            expect(result.error).toBeTruthy();
            expect(result.error.length).toBeGreaterThan(0);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  // ---------------------------------------------------------------------------
  // KPIEvent parser rejection tests
  // ---------------------------------------------------------------------------

  it('KPIEvent parser rejects objects missing required fields', () => {
    fc.assert(
      fc.property(
        fc.record({
          id: fc.uuid(),
          // matchId intentionally omitted
          type: fc.constantFrom('goal' as const, 'shot' as const, 'corner' as const, 'foul' as const, 'sprint' as const),
          minute: fc.integer({ min: 0, max: 120 }),
          teamSide: fc.constantFrom('home' as const, 'away' as const),
        }),
        (invalidEvent) => {
          const result = parseKPIEvent(invalidEvent);
          expect(result.ok).toBe(false);
          if (!result.ok) {
            expect(result.error).toBeTruthy();
            expect(result.error.length).toBeGreaterThan(0);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it('KPIEvent parser rejects objects with invalid type', () => {
    fc.assert(
      fc.property(
        fc.record({
          id: fc.uuid(),
          matchId: fc.uuid(),
          type: fc.constantFrom('invalid' as any, 'unknown' as any, '' as any), // Invalid type
          minute: fc.integer({ min: 0, max: 120 }),
          teamSide: fc.constantFrom('home' as const, 'away' as const),
        }),
        (invalidEvent) => {
          const result = parseKPIEvent(invalidEvent);
          expect(result.ok).toBe(false);
          if (!result.ok) {
            expect(result.error).toBeTruthy();
            expect(result.error.length).toBeGreaterThan(0);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  // ---------------------------------------------------------------------------
  // Additional edge case tests
  // ---------------------------------------------------------------------------

  it('parsers do not throw exceptions on invalid inputs', () => {
    fc.assert(
      fc.property(
        fc.oneof(
          fc.constant(null),
          fc.constant(undefined),
          fc.constant(42),
          fc.constant('string'),
          fc.constant(true),
          fc.array(fc.anything()),
          fc.object()
        ),
        (invalidInput) => {
          // All parsers should return { ok: false } and not throw
          expect(() => {
            const frameResult = parseFrame(invalidInput);
            expect(frameResult.ok).toBe(false);
            if (!frameResult.ok) {
              expect(frameResult.error).toBeTruthy();
            }
          }).not.toThrow();

          expect(() => {
            const eventResult = parseKPIEvent(invalidInput);
            expect(eventResult.ok).toBe(false);
            if (!eventResult.ok) {
              expect(eventResult.error).toBeTruthy();
            }
          }).not.toThrow();

          expect(() => {
            const marketResult = parseMiniMarket(invalidInput);
            expect(marketResult.ok).toBe(false);
            if (!marketResult.ok) {
              expect(marketResult.error).toBeTruthy();
            }
          }).not.toThrow();

          expect(() => {
            const betResult = parseBet(invalidInput);
            expect(betResult.ok).toBe(false);
            if (!betResult.ok) {
              expect(betResult.error).toBeTruthy();
            }
          }).not.toThrow();
        }
      ),
      { numRuns: 100 }
    );
  });
});
