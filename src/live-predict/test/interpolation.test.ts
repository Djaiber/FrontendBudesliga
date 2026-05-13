/**
 * Property-based tests for `interpolatePosition`.
 *
 * Feature: bundesliga-live-predict
 * Property 6: Position Interpolation Is a Convex Combination
 *
 * Validates: Requirements 7.7
 */
import { describe, it } from 'vitest';
import * as fc from 'fast-check';
import { interpolatePosition } from '../components/sections/PitchView/PitchView';

// ─── Arbitraries ─────────────────────────────────────────────────────────────

/** A coordinate within the pitch x-axis [0, 105] */
const arbPitchX = fc.float({ min: Math.fround(0), max: Math.fround(105), noNaN: true });

/** A coordinate within the pitch y-axis [0, 68] */
const arbPitchY = fc.float({ min: Math.fround(0), max: Math.fround(68), noNaN: true });

/** Interpolation factor α ∈ [0, 1] */
const arbAlpha = fc.float({ min: Math.fround(0), max: Math.fround(1), noNaN: true });

// ─── Properties ──────────────────────────────────────────────────────────────

describe('interpolatePosition — Property 6: convex combination', () => {
  /**
   * **Validates: Requirements 7.7**
   *
   * For any two positions (x0, y0) and (x1, y1) within pitch bounds and any
   * alpha ∈ [0, 1]:
   *   - result.x === x0 + alpha * (x1 - x0)
   *   - result.y === y0 + alpha * (y1 - y0)
   *   - result lies within [0, 105] × [0, 68]
   */
  it('returns x = x0 + alpha*(x1-x0) and y = y0 + alpha*(y1-y0)', () => {
    fc.assert(
      fc.property(
        arbPitchX,
        arbPitchY,
        arbPitchX,
        arbPitchY,
        arbAlpha,
        (x0, y0, x1, y1, alpha) => {
          const result = interpolatePosition(x0, y0, x1, y1, alpha);

          const expectedX = x0 + alpha * (x1 - x0);
          const expectedY = y0 + alpha * (y1 - y0);

          // Allow a tiny floating-point tolerance
          const EPS = 1e-4;
          return (
            Math.abs(result.x - expectedX) < EPS &&
            Math.abs(result.y - expectedY) < EPS
          );
        },
      ),
      { numRuns: 100 },
    );
  });

  /**
   * **Validates: Requirements 7.7**
   *
   * When both input positions are within pitch bounds, the interpolated
   * result must also lie within [0, 105] × [0, 68].
   */
  it('result lies within pitch bounds when inputs are within bounds', () => {
    fc.assert(
      fc.property(
        arbPitchX,
        arbPitchY,
        arbPitchX,
        arbPitchY,
        arbAlpha,
        (x0, y0, x1, y1, alpha) => {
          const result = interpolatePosition(x0, y0, x1, y1, alpha);

          // A small tolerance for floating-point edge cases at the boundary
          const EPS = 1e-4;
          return (
            result.x >= -EPS &&
            result.x <= 105 + EPS &&
            result.y >= -EPS &&
            result.y <= 68 + EPS
          );
        },
      ),
      { numRuns: 100 },
    );
  });

  /**
   * **Validates: Requirements 7.7**
   *
   * Boundary conditions:
   *   - alpha = 0 → result equals (x0, y0)
   *   - alpha = 1 → result equals (x1, y1)
   */
  it('alpha=0 returns start position; alpha=1 returns end position', () => {
    fc.assert(
      fc.property(arbPitchX, arbPitchY, arbPitchX, arbPitchY, (x0, y0, x1, y1) => {
        const EPS = 1e-4;

        const atStart = interpolatePosition(x0, y0, x1, y1, 0);
        const atEnd = interpolatePosition(x0, y0, x1, y1, 1);

        return (
          Math.abs(atStart.x - x0) < EPS &&
          Math.abs(atStart.y - y0) < EPS &&
          Math.abs(atEnd.x - x1) < EPS &&
          Math.abs(atEnd.y - y1) < EPS
        );
      }),
      { numRuns: 100 },
    );
  });
});
