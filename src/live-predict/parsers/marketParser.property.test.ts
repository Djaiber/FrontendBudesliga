/**
 * Property-based tests for MiniMarket and Bet parsers.
 * Feature: bundesliga-live-predict
 * Validates: Requirements 20.1, 20.3, 20.4
 */
import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { parseMiniMarket, prettyPrintMiniMarket } from './marketParser';
import { arbMiniMarket } from '../test/arbitraries';

describe('MiniMarket Parser Property Tests', () => {
  // Feature: bundesliga-live-predict, Property 15: DTO round-trip parse → prettyPrint → parse
  it('Property 15: MiniMarket round-trip (parse → prettyPrint → parse)', () => {
    fc.assert(
      fc.property(arbMiniMarket, (market) => {
        // Step 1: Pretty-print the typed MiniMarket to a plain object
        const printed = prettyPrintMiniMarket(market);

        // Step 2: Serialize to JSON and parse back (simulates network transmission)
        const jsonString = JSON.stringify(printed);
        const parsed = JSON.parse(jsonString);

        // Step 3: Parse the plain object back to a typed MiniMarket
        const result = parseMiniMarket(parsed);

        // Step 4: Assert the round-trip holds
        expect(result.ok).toBe(true);
        if (result.ok) {
          expect(result.value).toEqual(market);
        }
      }),
      { numRuns: 100 }
    );
  });
});
