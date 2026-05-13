import { useEffect, useRef, useCallback } from 'react';
import type { Frame, PlayerPosition } from '../../../types/frame';
import styles from './PitchView.module.css';

// ─── Pitch coordinate space ───────────────────────────────────────────────────
// x ∈ [0, 105] metres (length), y ∈ [0, 68] metres (width)
// SVG viewBox maps 1 SVG unit = 1 metre for simplicity.
const PITCH_W = 105;
const PITCH_H = 68;

// Player circle radius in SVG units (metres)
const PLAYER_RADIUS = 1.2;
// Ball circle radius in SVG units (metres)
const BALL_RADIUS = 0.7;
// Jersey number font size in SVG units
const JERSEY_FONT_SIZE = 2;

// ─── Interpolation ────────────────────────────────────────────────────────────

/**
 * Linear interpolation between two scalar values.
 * alpha = 0 → returns v0; alpha = 1 → returns v1.
 */
function lerp(v0: number, v1: number, alpha: number): number {
  return v0 + alpha * (v1 - v0);
}

/**
 * Interpolate a 2-D position between (x0, y0) and (x1, y1).
 *
 * The result is a convex combination when alpha ∈ [0, 1]:
 *   x = x0 + alpha * (x1 - x0)
 *   y = y0 + alpha * (y1 - y0)
 *
 * Exported as a named export so it can be tested independently.
 *
 * Validates: Requirements 7.7
 */
export function interpolatePosition(
  x0: number,
  y0: number,
  x1: number,
  y1: number,
  alpha: number,
): { x: number; y: number } {
  return {
    x: lerp(x0, x1, alpha),
    y: lerp(y0, y1, alpha),
  };
}

// ─── PitchRef interface ───────────────────────────────────────────────────────

interface PitchRef {
  /** Map from playerId → SVGCircleElement (the circle, not the text) */
  players: Map<string, SVGCircleElement>;
  /** Map from playerId → SVGTextElement (jersey number label) */
  playerTexts: Map<string, SVGTextElement>;
  ball: SVGCircleElement | null;
  latestFrame: Frame | null;
  previousFrame: Frame | null;
}

// ─── Props ────────────────────────────────────────────────────────────────────

export interface PitchViewProps {
  /**
   * A ref whose `.current` is the most recently received Frame (or null).
   * The parent (MatchDetailPage) writes to this ref inside the `onFrame`
   * callback of `useMatchStream`; PitchView reads it in the rAF loop.
   *
   * Using a ref (not state) means frame updates never trigger a React
   * re-render of the component tree.
   *
   * Validates: Requirements 7.4, 7.5, 16.3
   */
  frameRef: React.MutableRefObject<Frame | null>;
  /** Accessible label describing the match, e.g. "Bayern München vs Borussia Dortmund" */
  ariaLabel: string;
  /**
   * Optional initial player list used to pre-render the 22 circles on first
   * paint. If omitted, circles are rendered with default positions (centre
   * of the pitch) and repositioned as soon as the first frame arrives.
   */
  initialPlayers?: PlayerPosition[];
}

// ─── Pitch line helpers ───────────────────────────────────────────────────────

/**
 * Renders all static pitch markings as SVG path/circle/rect elements.
 * These are rendered once and never mutated.
 *
 * Validates: Requirements 7.1
 */
function PitchLines() {
  const lineProps = { className: styles.pitchLine };

  return (
    <g aria-hidden="true">
      {/* Outer boundary */}
      <rect x={0} y={0} width={PITCH_W} height={PITCH_H} {...lineProps} />

      {/* Centre line */}
      <line x1={PITCH_W / 2} y1={0} x2={PITCH_W / 2} y2={PITCH_H} {...lineProps} />

      {/* Centre circle — radius 9.15 m */}
      <circle cx={PITCH_W / 2} cy={PITCH_H / 2} r={9.15} {...lineProps} />

      {/* Centre spot */}
      <circle
        cx={PITCH_W / 2}
        cy={PITCH_H / 2}
        r={0.3}
        className={styles.pitchLine}
        style={{ fill: 'rgba(255,255,255,0.3)' }}
      />

      {/* ── Left penalty area (16.5 m deep, 40.32 m wide) ── */}
      <rect x={0} y={(PITCH_H - 40.32) / 2} width={16.5} height={40.32} {...lineProps} />

      {/* Left goal area (5.5 m deep, 18.32 m wide) */}
      <rect x={0} y={(PITCH_H - 18.32) / 2} width={5.5} height={18.32} {...lineProps} />

      {/* Left penalty spot */}
      <circle
        cx={11}
        cy={PITCH_H / 2}
        r={0.3}
        className={styles.pitchLine}
        style={{ fill: 'rgba(255,255,255,0.3)' }}
      />

      {/* Left penalty arc (radius 9.15 m, centred on penalty spot) */}
      <path
        d={`M 16.5 ${PITCH_H / 2 - 7.32} A 9.15 9.15 0 0 1 16.5 ${PITCH_H / 2 + 7.32}`}
        {...lineProps}
      />

      {/* ── Right penalty area ── */}
      <rect
        x={PITCH_W - 16.5}
        y={(PITCH_H - 40.32) / 2}
        width={16.5}
        height={40.32}
        {...lineProps}
      />

      {/* Right goal area */}
      <rect
        x={PITCH_W - 5.5}
        y={(PITCH_H - 18.32) / 2}
        width={5.5}
        height={18.32}
        {...lineProps}
      />

      {/* Right penalty spot */}
      <circle
        cx={PITCH_W - 11}
        cy={PITCH_H / 2}
        r={0.3}
        className={styles.pitchLine}
        style={{ fill: 'rgba(255,255,255,0.3)' }}
      />

      {/* Right penalty arc */}
      <path
        d={`M ${PITCH_W - 16.5} ${PITCH_H / 2 - 7.32} A 9.15 9.15 0 0 0 ${PITCH_W - 16.5} ${PITCH_H / 2 + 7.32}`}
        {...lineProps}
      />

      {/* ── Corner arcs (radius 1 m) ── */}
      {/* Top-left */}
      <path d="M 0 1 A 1 1 0 0 1 1 0" {...lineProps} />
      {/* Top-right */}
      <path d={`M ${PITCH_W - 1} 0 A 1 1 0 0 1 ${PITCH_W} 1`} {...lineProps} />
      {/* Bottom-left */}
      <path d={`M 1 ${PITCH_H} A 1 1 0 0 1 0 ${PITCH_H - 1}`} {...lineProps} />
      {/* Bottom-right */}
      <path
        d={`M ${PITCH_W} ${PITCH_H - 1} A 1 1 0 0 1 ${PITCH_W - 1} ${PITCH_H}`}
        {...lineProps}
      />

      {/* ── Goals (7.32 m wide, 2.44 m deep — shown as thin rectangles) ── */}
      <rect
        x={-2.44}
        y={(PITCH_H - 7.32) / 2}
        width={2.44}
        height={7.32}
        {...lineProps}
      />
      <rect
        x={PITCH_W}
        y={(PITCH_H - 7.32) / 2}
        width={2.44}
        height={7.32}
        {...lineProps}
      />
    </g>
  );
}

// ─── Component ────────────────────────────────────────────────────────────────

/**
 * PitchView
 *
 * Renders a top-down SVG football pitch with 22 player circles and a ball.
 * Position updates arrive at 25 Hz via `frameRef`; the rAF loop reads the
 * ref and mutates SVG element attributes directly — React is never involved
 * in position updates.
 *
 * Architecture:
 *   - Static SVG structure (pitch lines + player circles) rendered once.
 *   - `pitchRef` maps playerId → SVGCircleElement for O(1) lookup.
 *   - rAF loop lerps between `previousFrame` and `latestFrame` using
 *     alpha = (Date.now() - latestFrame.timestamp) / 40.
 *   - On unmount, `cancelAnimationFrame` is called to stop the loop.
 *
 * Exports `interpolatePosition` as a named export for property-based testing.
 *
 * Validates: Requirements 7.1, 7.2, 7.3, 7.4, 7.5, 7.6, 7.7, 16.2, 16.3, 17.4
 */
export function PitchView({ frameRef, ariaLabel, initialPlayers = [] }: PitchViewProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const pitchRef = useRef<PitchRef>({
    players: new Map(),
    playerTexts: new Map(),
    ball: null,
    latestFrame: null,
    previousFrame: null,
  });
  const rafId = useRef<number>(0);

  // ── rAF loop ────────────────────────────────────────────────────────────────
  useEffect(() => {
    const loop = () => {
      // Pull the latest frame from the parent-supplied ref
      const incoming = frameRef.current;

      if (incoming !== null) {
        const prev = pitchRef.current.latestFrame;

        // Advance frames: previous ← latest, latest ← incoming
        if (prev !== incoming) {
          pitchRef.current.previousFrame = prev;
          pitchRef.current.latestFrame = incoming;
        }
      }

      const { latestFrame, previousFrame, players, playerTexts, ball } =
        pitchRef.current;

      if (latestFrame) {
        // Compute interpolation alpha: how far we are into the 40 ms frame window
        const rawAlpha = (Date.now() - latestFrame.timestamp) / 40;
        // Clamp to [0, 1] so we never extrapolate
        const alpha = Math.min(1, Math.max(0, rawAlpha));

        for (const p of latestFrame.players) {
          const el = players.get(p.playerId);
          const textEl = playerTexts.get(p.playerId);

          if (el) {
            let cx: number;
            let cy: number;

            if (previousFrame) {
              // Find the matching player in the previous frame
              const prev = previousFrame.players.find(
                (pp) => pp.playerId === p.playerId,
              );
              if (prev) {
                const interp = interpolatePosition(prev.x, prev.y, p.x, p.y, alpha);
                cx = interp.x;
                cy = interp.y;
              } else {
                cx = p.x;
                cy = p.y;
              }
            } else {
              cx = p.x;
              cy = p.y;
            }

            el.setAttribute('cx', String(cx));
            el.setAttribute('cy', String(cy));

            if (textEl) {
              textEl.setAttribute('x', String(cx));
              textEl.setAttribute('y', String(cy));
            }
          }
        }

        // Ball interpolation
        if (ball) {
          let bx: number;
          let by: number;

          if (previousFrame) {
            const interp = interpolatePosition(
              previousFrame.ball.x,
              previousFrame.ball.y,
              latestFrame.ball.x,
              latestFrame.ball.y,
              alpha,
            );
            bx = interp.x;
            by = interp.y;
          } else {
            bx = latestFrame.ball.x;
            by = latestFrame.ball.y;
          }

          ball.setAttribute('cx', String(bx));
          ball.setAttribute('cy', String(by));
        }
      }

      rafId.current = requestAnimationFrame(loop);
    };

    rafId.current = requestAnimationFrame(loop);

    // Cancel the loop on unmount — Requirement 7.4 / 16.3
    return () => {
      cancelAnimationFrame(rafId.current);
    };
  }, [frameRef]);

  // ── Ref callback helpers ─────────────────────────────────────────────────────

  const registerPlayerCircle = useCallback(
    (playerId: string) => (el: SVGCircleElement | null) => {
      if (el) {
        pitchRef.current.players.set(playerId, el);
      } else {
        pitchRef.current.players.delete(playerId);
      }
    },
    [],
  );

  const registerPlayerText = useCallback(
    (playerId: string) => (el: SVGTextElement | null) => {
      if (el) {
        pitchRef.current.playerTexts.set(playerId, el);
      } else {
        pitchRef.current.playerTexts.delete(playerId);
      }
    },
    [],
  );

  const registerBall = useCallback((el: SVGCircleElement | null) => {
    pitchRef.current.ball = el;
  }, []);

  // ── Default player layout (used when no initialPlayers provided) ─────────────
  // Place home players on the left half, away on the right half, in a rough
  // formation so the pitch looks populated before the first frame arrives.
  const defaultPlayers: PlayerPosition[] = initialPlayers.length > 0
    ? initialPlayers
    : buildDefaultPlayers();

  // ── Render ───────────────────────────────────────────────────────────────────
  return (
    <div className={styles.wrapper}>
      {/*
        role="img" + aria-label: the SVG is treated as a single decorative image.
        Individual player circles are NOT focusable (no tabIndex, no role).
        Validates: Requirements 17.4
      */}
      <svg
        ref={svgRef}
        className={styles.pitch}
        viewBox={`0 0 ${PITCH_W} ${PITCH_H}`}
        role="img"
        aria-label={ariaLabel}
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Static pitch markings — rendered once, never mutated */}
        <PitchLines />

        {/* Player circles — positions mutated by rAF loop via ref callbacks */}
        <g aria-hidden="true">
          {defaultPlayers.map((p) => (
            <g key={p.playerId}>
              {/*
                Circle element — ref registered into pitchRef.current.players.
                No tabIndex, no role → not individually focusable.
                Validates: Requirements 7.2, 17.4
              */}
              <circle
                ref={registerPlayerCircle(p.playerId)}
                cx={p.x}
                cy={p.y}
                r={PLAYER_RADIUS}
                className={
                  p.teamSide === 'home' ? styles.playerHome : styles.playerAway
                }
              />
              {/*
                Jersey number text — ref registered into pitchRef.current.playerTexts.
                Positioned at the same (cx, cy) as the circle; updated in rAF loop.
                Validates: Requirements 7.2
              */}
              <text
                ref={registerPlayerText(p.playerId)}
                x={p.x}
                y={p.y}
                className={styles.jerseyNumber}
                fontSize={JERSEY_FONT_SIZE}
                aria-hidden="true"
              >
                {p.jerseyNumber}
              </text>
            </g>
          ))}
        </g>

        {/* Ball — smaller white circle, ref registered into pitchRef.current.ball */}
        <circle
          ref={registerBall}
          cx={PITCH_W / 2}
          cy={PITCH_H / 2}
          r={BALL_RADIUS}
          className={styles.ball}
          aria-hidden="true"
        />
      </svg>
    </div>
  );
}

// ─── Default player positions ─────────────────────────────────────────────────

/**
 * Generates a plausible default layout for 22 players (11 home + 11 away)
 * in a 4-4-2 formation on each side. Used only before the first frame arrives.
 */
function buildDefaultPlayers(): PlayerPosition[] {
  const players: PlayerPosition[] = [];

  // Home team (left side, attacking right): positions in metres
  const homeFormation: [number, number][] = [
    [5, 34],          // GK
    [20, 15], [20, 28], [20, 40], [20, 53], // defenders
    [40, 15], [40, 28], [40, 40], [40, 53], // midfielders
    [60, 25], [60, 43],                      // forwards
  ];

  // Away team (right side, attacking left)
  const awayFormation: [number, number][] = [
    [100, 34],        // GK
    [85, 15], [85, 28], [85, 40], [85, 53], // defenders
    [65, 15], [65, 28], [65, 40], [65, 53], // midfielders
    [45, 25], [45, 43],                      // forwards
  ];

  homeFormation.forEach(([x, y], i) => {
    players.push({
      playerId: `home-${i + 1}`,
      jerseyNumber: i + 1,
      teamSide: 'home',
      x,
      y,
      speedKmh: 0,
    });
  });

  awayFormation.forEach(([x, y], i) => {
    players.push({
      playerId: `away-${i + 1}`,
      jerseyNumber: i + 1,
      teamSide: 'away',
      x,
      y,
      speedKmh: 0,
    });
  });

  return players;
}

export default PitchView;
