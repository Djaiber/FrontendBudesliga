// transport/XmlMockTransport.ts
// Replays real player-tracking data from xml_frames.json.
// Key behaviour:
//   - Frame timestamps are patched to connectTime + offsetMs so the PitchView
//     lerp alpha (Date.now() - timestamp) / 400 stays in [0, 1].
//   - Market/event messages are preserved from simulation_output.json.
//   - A "Nächstes Tor" prediction market is injected every 5 match minutes.

import type { ITransport, WSMessage } from './ITransport';
import xmlFrameData from './xml_frames.json';
import simulationData from './simulation_output.json';

// ─── Types ────────────────────────────────────────────────────────────────────

type RawMessage = { offsetMs: number; type: string; payload: unknown };

// ─── Non-frame messages from simulation (markets + events) ───────────────────

const simMessages = (simulationData.messages as RawMessage[]).filter(
  (m) => m.type !== 'frame',
);

// ─── "Nächstes Tor" market generator ─────────────────────────────────────────

// Each 5-match-minute window has a predetermined outcome, derived from the
// actual 5-0 result: home team scores in windows 2, 4, 6, 10, 12 (1-indexed).
// null = no goal in that window.
const GOAL_SEQUENCE: Array<'home' | 'away' | null> = [
  null,   // 0–5 min
  'home', // 5–10 min
  null,   // 10–15 min
  'home', // 15–20 min
  null,   // 20–25 min
  'home', // 25–30 min
  null,   // 30–35 min
  null,   // 35–40 min
  'home', // 40–45 min
  null,   // 45–50 min
  null,   // 50–55 min
  'home', // 55–60 min
  null,   // 60–65 min
  null,   // 65–70 min
  null,   // 70–75 min
  null,   // 75–80 min
  null,   // 80–85 min
  null,   // 85–90 min
];

// 5 match-minutes at the XML replay cadence:
//   10 frames/sec (25 Hz) sampled every 10th → 2.5 snapshots/sec → 400 ms each
//   5 min × 60 s × 2.5 snapshots/s = 750 snapshots → 750 × 400 ms = 300 000 ms
const FIVE_MIN_MS = 300_000;
const MARKET_TTL_SEC = 30; // 30 seconds to place bets
const SETTLE_DELAY_MS = MARKET_TTL_SEC * 1000 + 1000; // fire 1 s after TTL

function buildNextGoalMarkets(): RawMessage[] {
  const messages: RawMessage[] = [];

  GOAL_SEQUENCE.forEach((outcome, index) => {
    const marketOpenMs = (index + 1) * FIVE_MIN_MS; // fires after N×5 min
    const marketId = `next-goal-market-${index + 1}`;
    const minute = (index + 1) * 5;

    // market.new
    messages.push({
      offsetMs: marketOpenMs,
      type: 'market.new',
      payload: {
        id: marketId,
        matchId: 'match-001',
        question: `Nächstes Tor bis Minute ${minute + 5}?`,
        category: 'Tor',
        outcomes: [
          {
            id: `${marketId}-home`,
            label: 'FC Team (Heim)',
            decimalOdds: 1.75,
            impliedProbability: 0.57,
          },
          {
            id: `${marketId}-away`,
            label: 'Club (Gast)',
            decimalOdds: 4.50,
            impliedProbability: 0.22,
          },
          {
            id: `${marketId}-none`,
            label: 'Kein Tor',
            decimalOdds: 2.20,
            impliedProbability: 0.21,
          },
        ],
        ttlSeconds: MARKET_TTL_SEC,
        openedAt: 0, // overwritten at send time in connect()
        status: 'open',
      },
    });

    // market.settled — fired after TTL + 1 s
    const winningOutcomeId =
      outcome === 'home' ? `${marketId}-home`
      : outcome === 'away' ? `${marketId}-away`
      : `${marketId}-none`;

    messages.push({
      offsetMs: marketOpenMs + SETTLE_DELAY_MS,
      type: 'market.settled',
      payload: {
        id: marketId,
        winningOutcomeId,
      },
    });
  });

  return messages;
}

const nextGoalMarkets = buildNextGoalMarkets();

// ─── Merged + sorted message list (computed once at module load) ──────────────

const allMessages: RawMessage[] = [
  ...(xmlFrameData.frames as RawMessage[]),
  ...simMessages,
  ...nextGoalMarkets,
].sort((a, b) => a.offsetMs - b.offsetMs);

// ─── Transport class ──────────────────────────────────────────────────────────

export class XmlMockTransport implements ITransport {
  onMessage: ((msg: WSMessage) => void) | null = null;
  onClose: (() => void) | null = null;

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  constructor(_matchId?: string) {}

  private timers: ReturnType<typeof setTimeout>[] = [];

  connect(): void {
    // Capture the real wall-clock time when the session starts.
    // Each frame's payload.timestamp is patched to connectTime + offsetMs so
    // that PitchView's lerp alpha = (Date.now() - timestamp) / 400 is in [0,1].
    const connectTime = Date.now();

    for (const msg of allMessages) {
      const timer = setTimeout(() => {
        let payload = msg.payload;

        if (msg.type === 'frame' && payload !== null && typeof payload === 'object') {
          // Patch timestamp so interpolation alpha is correct
          payload = {
            ...(payload as Record<string, unknown>),
            timestamp: connectTime + msg.offsetMs,
          };
        }

        if (msg.type === 'market.new' && payload !== null && typeof payload === 'object') {
          // Set openedAt to the actual current time when the market fires
          payload = {
            ...(payload as Record<string, unknown>),
            openedAt: Date.now(),
          };
        }

        this.onMessage?.({
          type: msg.type as WSMessage['type'],
          payload,
        });
      }, msg.offsetMs);

      this.timers.push(timer);
    }

    // Seamless loop after the last message
    const lastOffset = allMessages[allMessages.length - 1]?.offsetMs ?? 0;
    const loopTimer = setTimeout(() => {
      this.disconnect();
      this.connect();
    }, lastOffset + 200);
    this.timers.push(loopTimer);
  }

  disconnect(): void {
    this.timers.forEach(clearTimeout);
    this.timers = [];
    this.onClose?.();
  }
}
