/**
 * Property-based tests for KPIEvent parser round-trip.
 * Feature: bundesliga-live-predict, Property 15: DTO round-trip parse -> prettyPrint -> parse
 * **Validates: Requirements 20.1, 20.3, 20.4**
 */
import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { parseKPIEvent, prettyPrintKPIEvent } from './eventParser';
import { arbKPIEvent } from '../test/arbitraries';

describe('KPIEvent Parser Round-Trip Property Tests', () => {
  // Feature: bundesliga-live-predict, Property 15: DTO round-trip parse -> prettyPrint -> parse
  it('KPIEvent round-trip: parse(JSON.stringify(prettyPrint(event))) ≅ event', () => {
    fc.assert(
      fc.property(arbKPIEvent, (event) => {
        // Step 1: Pretty-print the typed KPIEvent to a plain object
        const printed = prettyPrintKPIEvent(event);

        // Step 2: Serialize to JSON and parse back (simulates network transmission)
        const jsonString = JSON.stringify(printed);
        const parsed = JSON.parse(jsonString);

        // Step 3: Parse the plain object back to a typed KPIEvent
        const result = parseKPIEvent(parsed);

        // Step 4: Assert the round-trip holds
        expect(result.ok).toBe(true);
        if (result.ok) {
          expect(result.value).toEqual(event);
        }
      }),
      { numRuns: 100 }
    );
  });
});
