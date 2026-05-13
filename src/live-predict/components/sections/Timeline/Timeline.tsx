import { useState } from 'react';
import { useMatchStore } from '../../../store/matchStore';
import type { KPIEvent, KPIEventType } from '../../../types/event';
import { de } from '../../../i18n/de';
import styles from './Timeline.module.css';

/**
 * Timeline
 *
 * Renders a horizontal SVG bar spanning match minutes 0–90 (extended to
 * accommodate extra time when any event minute exceeds 90).
 *
 * One dot is rendered per KPIEvent from matchStore.events:
 *   - goal   → green  (#22c55e)
 *   - shot   → grey   (#888)
 *   - corner → yellow (#eab308)
 *   - foul   → grey   (#888)
 *   - sprint → grey   (#888)
 *
 * Open markets are represented by a separate dot in var(--red).
 *
 * On hover over a dot, a CSS-positioned tooltip shows:
 *   event type, match minute, and detail — in Roboto 12px.
 *
 * Validates: Requirements 9.1, 9.2, 9.3, 9.4
 */

// ── Constants ────────────────────────────────────────────────────────────────

const SVG_HEIGHT = 40;
const BAR_Y = 20;
const BAR_HEIGHT = 6;
const DOT_RADIUS = 5;
const PADDING_X = 12; // horizontal padding inside the SVG

// ── Colour map ────────────────────────────────────────────────────────────────

const EVENT_COLORS: Record<KPIEventType, string> = {
  goal: '#22c55e',
  shot: '#888888',
  corner: '#eab308',
  foul: '#888888',
  sprint: '#888888',
};

// ── Label map (from i18n) ─────────────────────────────────────────────────────

const EVENT_LABELS: Record<KPIEventType, string> = {
  goal: de.filterGoal,
  shot: de.filterShot,
  corner: de.filterCorner,
  foul: de.filterFreeKick,
  sprint: de.filterSprint,
};

// ── Tooltip state ─────────────────────────────────────────────────────────────

interface TooltipState {
  event: KPIEvent;
  /** SVG-space x coordinate of the dot centre */
  svgX: number;
}

// ── Helper ────────────────────────────────────────────────────────────────────

/**
 * Map a match minute to an SVG x coordinate.
 * The usable width is (svgWidth - 2 * PADDING_X).
 */
function minuteToX(minute: number, maxMinute: number, svgWidth: number): number {
  const usable = svgWidth - 2 * PADDING_X;
  return PADDING_X + (minute / maxMinute) * usable;
}

// ── Component ─────────────────────────────────────────────────────────────────

export function Timeline() {
  const events = useMatchStore((state) => state.events);
  const [tooltip, setTooltip] = useState<TooltipState | null>(null);

  // Determine the maximum minute to display (at least 90, extended for extra time)
  const maxEventMinute = events.reduce((max, e) => Math.max(max, e.minute), 0);
  const maxMinute = Math.max(90, maxEventMinute);

  // We use a viewBox-based SVG so it scales with the container.
  // The internal coordinate width is 600 units.
  const svgWidth = 600;

  // Minute tick marks at 15-minute intervals
  const ticks = [0, 15, 30, 45, 60, 75, 90];

  return (
    <div className={styles.timelineWrapper} role="region" aria-label="Match Timeline">
      <svg
        className={styles.svg}
        viewBox={`0 0 ${svgWidth} ${SVG_HEIGHT}`}
        preserveAspectRatio="none"
        aria-hidden="true"
      >
        {/* ── Background bar ── */}
        <rect
          x={PADDING_X}
          y={BAR_Y - BAR_HEIGHT / 2}
          width={svgWidth - 2 * PADDING_X}
          height={BAR_HEIGHT}
          rx={3}
          className={styles.bar}
        />

        {/* ── Minute tick marks ── */}
        {ticks.map((tick) => {
          const x = minuteToX(tick, maxMinute, svgWidth);
          return (
            <g key={tick}>
              <line
                x1={x}
                y1={BAR_Y + BAR_HEIGHT / 2}
                x2={x}
                y2={BAR_Y + BAR_HEIGHT / 2 + 4}
                className={styles.tick}
              />
              <text
                x={x}
                y={SVG_HEIGHT - 1}
                textAnchor="middle"
                className={styles.tickLabel}
              >
                {tick}&apos;
              </text>
            </g>
          );
        })}

        {/* ── Event dots ── */}
        {events.map((event) => {
          const cx = minuteToX(event.minute, maxMinute, svgWidth);
          const color = EVENT_COLORS[event.type];

          return (
            <circle
              key={event.id}
              cx={cx}
              cy={BAR_Y}
              r={DOT_RADIUS}
              fill={color}
              className={styles.dot}
              onMouseEnter={() => setTooltip({ event, svgX: cx })}
              onMouseLeave={() => setTooltip(null)}
              onFocus={() => setTooltip({ event, svgX: cx })}
              onBlur={() => setTooltip(null)}
              tabIndex={0}
              role="img"
              aria-label={`${EVENT_LABELS[event.type]} ${event.minute}'${event.detail ? ` – ${event.detail}` : ''}`}
            >
              {/* Native SVG tooltip as fallback */}
              <title>
                {EVENT_LABELS[event.type]} {event.minute}&apos;
                {event.detail ? ` – ${event.detail}` : ''}
              </title>
            </circle>
          );
        })}
      </svg>

      {/* ── Custom CSS tooltip ── */}
      {tooltip && (
        <TooltipPopup event={tooltip.event} svgX={tooltip.svgX} svgWidth={svgWidth} />
      )}
    </div>
  );
}

// ── Tooltip sub-component ─────────────────────────────────────────────────────

interface TooltipPopupProps {
  event: KPIEvent;
  /** SVG-space x of the dot (0–svgWidth) */
  svgX: number;
  svgWidth: number;
}

function TooltipPopup({ event, svgX, svgWidth }: TooltipPopupProps) {
  // Convert SVG-space x to a percentage so the tooltip tracks the dot
  // even when the SVG is scaled by the container.
  const leftPct = (svgX / svgWidth) * 100;

  const label = EVENT_LABELS[event.type];
  const detail = event.detail ?? (event.xG != null ? `xG ${event.xG.toFixed(2)}` : null);

  return (
    <div
      className={styles.tooltip}
      style={{ left: `${leftPct}%` }}
      role="tooltip"
    >
      <span className={styles.tooltipType}>{label}</span>
      <span className={styles.tooltipMinute}>{event.minute}&apos;</span>
      {detail && <span className={styles.tooltipDetail}>{detail}</span>}
    </div>
  );
}

export default Timeline;
