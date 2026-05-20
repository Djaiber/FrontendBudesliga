import { useEffect, useRef, useCallback } from 'react';
import type { Frame, PlayerPosition } from '../../../types/frame';
import styles from './PitchView.module.css';

// ─── Pitch coordinate space ───────────────────────────────────────────────────
const PITCH_W = 105;
const PITCH_H = 68;
const PLAYER_RADIUS = 1.2;
const BALL_RADIUS = 0.7;
const JERSEY_FONT_SIZE = 2;

// Frame interval assumed for interpolation alpha (ms between frames)
// Matches the XmlMockTransport replay cadence (every 10th frame × 40 ms).
const FRAME_INTERVAL_MS = 400;

// ─── Interpolation ────────────────────────────────────────────────────────────

function lerp(v0: number, v1: number, alpha: number): number {
  return v0 + alpha * (v1 - v0);
}

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

// ─── Internal ref state ───────────────────────────────────────────────────────

interface PitchRef {
  players: Map<string, SVGCircleElement>;
  playerTexts: Map<string, SVGTextElement>;
  playersGroup: SVGGElement | null;
  ball: SVGCircleElement | null;
  latestFrame: Frame | null;
  previousFrame: Frame | null;
  // CSS module class strings — stored here so the rAF loop can use them
  // when creating player elements imperatively without accessing `styles` from closure
  classPlayerHome: string;
  classPlayerAway: string;
  classJerseyNumber: string;
}

// ─── Props ────────────────────────────────────────────────────────────────────

export interface PitchViewProps {
  frameRef: React.MutableRefObject<Frame | null>;
  ariaLabel: string;
  initialPlayers?: PlayerPosition[];
}

// ─── Pitch line helpers ───────────────────────────────────────────────────────

function PitchLines() {
  const lineProps = { className: styles.pitchLine };

  return (
    <g aria-hidden="true">
      <rect x={0} y={0} width={PITCH_W} height={PITCH_H} {...lineProps} />
      <line x1={PITCH_W / 2} y1={0} x2={PITCH_W / 2} y2={PITCH_H} {...lineProps} />
      <circle cx={PITCH_W / 2} cy={PITCH_H / 2} r={9.15} {...lineProps} />
      <circle cx={PITCH_W / 2} cy={PITCH_H / 2} r={0.3} className={styles.pitchLine} style={{ fill: 'rgba(255,255,255,0.3)' }} />

      {/* Left penalty area */}
      <rect x={0} y={(PITCH_H - 40.32) / 2} width={16.5} height={40.32} {...lineProps} />
      <rect x={0} y={(PITCH_H - 18.32) / 2} width={5.5} height={18.32} {...lineProps} />
      <circle cx={11} cy={PITCH_H / 2} r={0.3} className={styles.pitchLine} style={{ fill: 'rgba(255,255,255,0.3)' }} />
      <path d={`M 16.5 ${PITCH_H / 2 - 7.32} A 9.15 9.15 0 0 1 16.5 ${PITCH_H / 2 + 7.32}`} {...lineProps} />

      {/* Right penalty area */}
      <rect x={PITCH_W - 16.5} y={(PITCH_H - 40.32) / 2} width={16.5} height={40.32} {...lineProps} />
      <rect x={PITCH_W - 5.5} y={(PITCH_H - 18.32) / 2} width={5.5} height={18.32} {...lineProps} />
      <circle cx={PITCH_W - 11} cy={PITCH_H / 2} r={0.3} className={styles.pitchLine} style={{ fill: 'rgba(255,255,255,0.3)' }} />
      <path d={`M ${PITCH_W - 16.5} ${PITCH_H / 2 - 7.32} A 9.15 9.15 0 0 0 ${PITCH_W - 16.5} ${PITCH_H / 2 + 7.32}`} {...lineProps} />

      {/* Corner arcs */}
      <path d="M 0 1 A 1 1 0 0 1 1 0" {...lineProps} />
      <path d={`M ${PITCH_W - 1} 0 A 1 1 0 0 1 ${PITCH_W} 1`} {...lineProps} />
      <path d={`M 1 ${PITCH_H} A 1 1 0 0 1 0 ${PITCH_H - 1}`} {...lineProps} />
      <path d={`M ${PITCH_W} ${PITCH_H - 1} A 1 1 0 0 1 ${PITCH_W - 1} ${PITCH_H}`} {...lineProps} />

      {/* Goals */}
      <rect x={-2.44} y={(PITCH_H - 7.32) / 2} width={2.44} height={7.32} {...lineProps} />
      <rect x={PITCH_W} y={(PITCH_H - 7.32) / 2} width={2.44} height={7.32} {...lineProps} />
    </g>
  );
}

// ─── Component ────────────────────────────────────────────────────────────────

export function PitchView({ frameRef, ariaLabel }: PitchViewProps) {
  const svgRef = useRef<SVGSVGElement>(null);

  const pitchRef = useRef<PitchRef>({
    players: new Map(),
    playerTexts: new Map(),
    playersGroup: null,
    ball: null,
    latestFrame: null,
    previousFrame: null,
    // Store CSS module class names once so the rAF loop can reach them
    classPlayerHome: styles.playerHome,
    classPlayerAway: styles.playerAway,
    classJerseyNumber: styles.jerseyNumber,
  });

  const rafId = useRef<number>(0);

  // ── rAF loop ────────────────────────────────────────────────────────────────
  useEffect(() => {
    const loop = () => {
      const incoming = frameRef.current;

      if (incoming !== null) {
        const prev = pitchRef.current.latestFrame;
        if (prev !== incoming) {
          pitchRef.current.previousFrame = prev;
          pitchRef.current.latestFrame = incoming;
        }
      }

      const { latestFrame, previousFrame, players, playerTexts, ball, playersGroup } =
        pitchRef.current;

      if (latestFrame) {
        // Alpha: how far into the FRAME_INTERVAL_MS window we are.
        // Timestamps are set by the transport as connectTime+offsetMs, so
        // Date.now() - latestFrame.timestamp is the true elapsed time.
        const rawAlpha = (Date.now() - latestFrame.timestamp) / FRAME_INTERVAL_MS;
        const alpha = Math.min(1, Math.max(0, rawAlpha));

        for (const p of latestFrame.players) {
          let el = players.get(p.playerId);
          let textEl = playerTexts.get(p.playerId);

          // ── Dynamic player creation ──────────────────────────────────────
          // If this player isn't in the DOM yet (real XML PlayerIds arrive on
          // the first frame and don't match any statically rendered circle),
          // create SVG elements imperatively and register them.
          if (!el && playersGroup) {
            const ns = 'http://www.w3.org/2000/svg';

            const circle = document.createElementNS(ns, 'circle') as SVGCircleElement;
            circle.setAttribute('r', String(PLAYER_RADIUS));
            circle.setAttribute(
              'class',
              p.teamSide === 'home'
                ? pitchRef.current.classPlayerHome
                : pitchRef.current.classPlayerAway,
            );

            const text = document.createElementNS(ns, 'text') as SVGTextElement;
            text.setAttribute('font-size', String(JERSEY_FONT_SIZE));
            text.setAttribute('class', pitchRef.current.classJerseyNumber);
            text.setAttribute('aria-hidden', 'true');
            text.setAttribute('text-anchor', 'middle');
            text.setAttribute('dominant-baseline', 'central');
            text.textContent = String(p.jerseyNumber);

            const g = document.createElementNS(ns, 'g');
            g.appendChild(circle);
            g.appendChild(text);
            playersGroup.appendChild(g);

            players.set(p.playerId, circle);
            playerTexts.set(p.playerId, text);
            el = circle;
            textEl = text;
          }

          if (!el) continue;

          // ── Interpolate position ─────────────────────────────────────────
          let cx: number;
          let cy: number;

          if (previousFrame) {
            const prev = previousFrame.players.find((pp) => pp.playerId === p.playerId);
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

        // ── Ball interpolation ──────────────────────────────────────────────
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
    return () => cancelAnimationFrame(rafId.current);
  }, [frameRef]);

  // ── Ref callbacks ────────────────────────────────────────────────────────────

  const registerPlayersGroup = useCallback((el: SVGGElement | null) => {
    pitchRef.current.playersGroup = el;
  }, []);

  const registerBall = useCallback((el: SVGCircleElement | null) => {
    pitchRef.current.ball = el;
  }, []);

  // ── Render ───────────────────────────────────────────────────────────────────
  return (
    <div className={styles.wrapper}>
      <svg
        ref={svgRef}
        className={styles.pitch}
        viewBox={`0 0 ${PITCH_W} ${PITCH_H}`}
        role="img"
        aria-label={ariaLabel}
        xmlns="http://www.w3.org/2000/svg"
      >
        <PitchLines />

        {/*
          Empty group — player circles are created here imperatively by the
          rAF loop on the first frame, using the real PlayerIds from the XML.
          No static circles are pre-rendered so there is no ID mismatch.
        */}
        <g ref={registerPlayersGroup} aria-hidden="true" />

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

export default PitchView;
