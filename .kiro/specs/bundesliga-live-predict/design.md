# Design Document — bundesliga-live-predict

## Overview

The **Live Predict** section is a real-time mini-betting feature embedded in the existing Bundesliga website frontend. It adds three routes (`/live-predict`, `/live-predict/:matchId`, `/live-predict/meine-wetten`) inside the existing site shell (top-bar, `.main-nav`, footer) without modifying any existing HTML, CSS, or JavaScript outside the designated insertion point.

The feature is built with **React 18 + TypeScript strict + Vite**, uses **Zustand** for global state, **React Router v6** for routing, **CSS Modules** for scoped styling, and a **native WebSocket** (or `socket.io-client`) for the live data stream. A **Mock Layer** replays `simulation_output.json` at the same cadence as the real backend, switchable via a single flag in `config/dataSource.ts`.

Key design constraints:
- 25 Hz frame updates bypass React's render cycle entirely — positions live in `useRef` and are applied via `requestAnimationFrame`.
- All German strings are imported from `i18n/de.ts`; no hard-coded strings in JSX.
- The initial JS bundle must be ≤ 200 KB gzip; the match detail view is code-split.
- A DEMOMODUS banner is always visible on every `/live-predict` route.

---

## Architecture

### High-Level Module Map

```
src/
├── config/
│   └── dataSource.ts          # Single flag: USE_MOCK = true | false
├── i18n/
│   └── de.ts                  # All German UI strings (typed)
├── types/
│   ├── match.ts               # Match, MatchStatus, TeamInfo
│   ├── frame.ts               # Frame, PlayerPosition, BallPosition
│   ├── event.ts               # KPIEvent, KPIEventType
│   ├── market.ts              # MiniMarket, Outcome, MarketStatus
│   └── bet.ts                 # Bet, BetStatus
├── parsers/
│   ├── frameParser.ts         # parse + prettyPrint for Frame
│   ├── eventParser.ts         # parse + prettyPrint for KPIEvent
│   └── marketParser.ts        # parse + prettyPrint for MiniMarket / Bet
├── store/
│   ├── matchStore.ts          # Zustand slice: live matches list
│   ├── marketStore.ts         # Zustand slice: open/settled markets
│   └── betStore.ts            # Zustand slice: user bets + session P&L
├── transport/
│   ├── WebSocketTransport.ts  # Real WS implementation
│   ├── MockTransport.ts       # Simulation replay
│   └── ITransport.ts          # Shared interface
├── hooks/
│   └── useMatchStream.ts      # Consumes ITransport, exposes typed callbacks
├── components/
│   ├── layout/
│   │   ├── LivePredictLayout.tsx   # Shell wrapper: DEMOMODUS + <Outlet>
│   │   └── LivePredictLayout.module.css
│   ├── pages/
│   │   ├── MatchListPage.tsx
│   │   ├── MatchDetailPage.tsx     # lazy-loaded
│   │   └── HistoryPage.tsx
│   ├── sections/
│   │   ├── Scoreboard/
│   │   ├── PitchView/
│   │   ├── MetricsBar/
│   │   ├── Timeline/
│   │   ├── MarketsFeed/
│   │   ├── MeineWettenPanel/
│   │   └── BetSlip/
│   └── atoms/
│       ├── MatchCard/
│       ├── MarketCard/
│       ├── OutcomeButton/
│       ├── LivePill/
│       ├── LiveDot/
│       ├── DemomodusBanner/
│       └── FilterPill/
└── router/
    └── index.tsx              # React Router v6 route definitions
```

### Data Flow

```
simulation_output.json
        │
        ▼
MockTransport  ──┐
                 ├──► ITransport interface
WebSocketTransport ──┘
        │
        ▼
useMatchStream(matchId)
        │
   ┌────┴────────────────────────────────┐
   │                                     │
   ▼                                     ▼
frame callback                  event / market callbacks
   │                                     │
   ▼                                     ▼
pitchRef (useRef)              Zustand stores
   │                          (matchStore / marketStore / betStore)
   ▼                                     │
requestAnimationFrame                    ▼
   │                            React component tree
   ▼                            (re-renders only on store changes)
SVG DOM mutations
```

---

## Components and Interfaces

### Component Tree

```
<App>
  <RouterProvider>
    <Route path="/live-predict" element={<LivePredictLayout>}>
      │
      ├── <DemomodusBanner />                    [always visible]
      │
      ├── <Route index element={<MatchListPage>}>
      │     └── <MatchCard> × N
      │           ├── <LiveDot />
      │           └── <LivePill />
      │
      ├── <Route path=":matchId" element={<MatchDetailPage>}> [lazy]
      │     ├── [left column]
      │     │   ├── <Scoreboard />
      │     │   │     └── <LiveDot />
      │     │   ├── <MetricsBar />
      │     │   ├── <PitchView />               [SVG, rAF-driven]
      │     │   └── <Timeline />               [SVG]
      │     ├── [right column]
      │     │   ├── <FilterPill> × 6
      │     │   └── <MarketsFeed />
      │     │         └── <MarketCard> × N
      │     │               ├── <LivePill />
      │     │               └── <OutcomeButton> × 2–4
      │     ├── <MeineWettenPanel />
      │     └── <BetSlip />                    [modal, conditional]
      │
      └── <Route path="meine-wetten" element={<HistoryPage>}>
            └── <table className={styles.standingsTable}>
```

### Atom Components

| Component | Props | Notes |
|---|---|---|
| `DemomodusBanner` | — | Fixed at top of content area; not dismissible |
| `LiveDot` | — | 6×6 px red circle, `@keyframes blink` |
| `LivePill` | — | "LIVE" badge, `--red` bg, 9px |
| `MatchCard` | `match: Match` | Reuses `.match-card` base class + CSS Module overrides |
| `FilterPill` | `label: string; count: number; active: boolean; onClick: () => void` | |
| `OutcomeButton` | `outcome: Outcome; onClick: (o: Outcome) => void; disabled: boolean` | `role="button"`, `aria-label` |
| `MarketCard` | `market: MiniMarket; onOutcomeClick: (o: Outcome) => void` | |

### Section Components

| Component | Data source | Re-render trigger |
|---|---|---|
| `Scoreboard` | `matchStore` | Goal KPI_Event → store update |
| `MetricsBar` | `matchStore` | KPI_Event / frame aggregates |
| `PitchView` | `useRef` (pitchRef) | `requestAnimationFrame` only |
| `Timeline` | `matchStore.events` | New KPI_Event |
| `MarketsFeed` | `marketStore` | `market.*` messages |
| `MeineWettenPanel` | `betStore` | Bet placed / settled |
| `BetSlip` | local state + `marketStore` | User interaction |

---

## Data Models

### TypeScript DTOs

```typescript
// types/match.ts
export type MatchStatus = 'upcoming' | 'live' | 'finished';

export interface TeamInfo {
  id: string;
  name: string;
  shortName: string;       // e.g. "FCB"
  logoUrl: string;
}

export interface Match {
  id: string;
  homeTeam: TeamInfo;
  awayTeam: TeamInfo;
  homeScore: number;
  awayScore: number;
  minute: number;          // 0–90+
  status: MatchStatus;
  openMarketCount: number;
}

// types/frame.ts
export interface PlayerPosition {
  playerId: string;
  jerseyNumber: number;
  teamSide: 'home' | 'away';
  x: number;              // pitch coords, metres, 0–105
  y: number;              // 0–68
  speedKmh: number;
}

export interface BallPosition {
  x: number;
  y: number;
  z: number;
}

export interface Frame {
  matchId: string;
  timestamp: number;       // Unix ms
  players: PlayerPosition[];
  ball: BallPosition;
}

// types/event.ts
export type KPIEventType = 'goal' | 'shot' | 'corner' | 'foul' | 'sprint';

export interface KPIEvent {
  id: string;
  matchId: string;
  type: KPIEventType;
  minute: number;
  teamSide: 'home' | 'away';
  playerId?: string;
  xG?: number;             // expected goals, 0–1
  xP?: number;             // expected probability, 0–1
  detail?: string;
}

// types/market.ts
export type MarketStatus = 'open' | 'settled' | 'cancelled';

export interface Outcome {
  id: string;
  label: string;
  decimalOdds: number;     // e.g. 2.15
  impliedProbability: number; // 0–1
}

export interface MiniMarket {
  id: string;
  matchId: string;
  question: string;
  category: 'Tor' | 'Torschuss' | 'Ecke' | 'Freistoß' | 'Sprint' | 'Andere';
  outcomes: Outcome[];     // 2–4 items
  ttlSeconds: number;      // remaining seconds
  openedAt: number;        // Unix ms
  status: MarketStatus;
  winningOutcomeId?: string;
}

// types/bet.ts
export type BetStatus = 'ausstehend' | 'gewonnen' | 'verloren' | 'storniert';

export interface Bet {
  id: string;
  matchId: string;
  marketId: string;
  marketQuestion: string;
  outcomeId: string;
  outcomeLabel: string;
  decimalOdds: number;
  stake: number;           // 1–500
  potentialReturn: number; // stake × decimalOdds
  actualReturn: number;    // 0 or potentialReturn
  status: BetStatus;
  placedAt: number;        // Unix ms
}
```

### WebSocket Message Envelope

```typescript
// transport/ITransport.ts
export type WSMessageType =
  | 'frame'
  | 'event'
  | 'market.new'
  | 'market.update'
  | 'market.settled';

export interface WSMessage<T = unknown> {
  type: WSMessageType;
  payload: T;
}
```

---

## Zustand Store Design

### Store Slices

```typescript
// store/matchStore.ts
interface MatchState {
  matches: Match[];
  currentMatch: Match | null;
  events: KPIEvent[];
  connectionStatus: 'connecting' | 'connected' | 'error' | 'disconnected';
  connectionError: string | null;
}

interface MatchActions {
  setMatches: (matches: Match[]) => void;
  setCurrentMatch: (match: Match) => void;
  applyGoal: (teamSide: 'home' | 'away') => void;
  addEvent: (event: KPIEvent) => void;
  setConnectionStatus: (status: MatchState['connectionStatus'], error?: string) => void;
}

// store/marketStore.ts
interface MarketState {
  openMarkets: MiniMarket[];
  settledMarkets: MiniMarket[];
  activeFilter: MiniMarket['category'] | 'Alle';
}

interface MarketActions {
  addMarket: (market: MiniMarket) => void;
  updateMarket: (id: string, patch: Partial<MiniMarket>) => void;
  settleMarket: (id: string, winningOutcomeId: string) => void;
  setFilter: (filter: MarketState['activeFilter']) => void;
  tickTTL: () => void;   // called every second by a setInterval in the hook
}

// store/betStore.ts
interface BetState {
  bets: Bet[];
  sessionPnL: number;
}

interface BetActions {
  addBet: (bet: Bet) => void;
  settleBet: (betId: string, won: boolean) => void;
  clearSession: () => void;
}
```

### Key Selectors

```typescript
// Derived selectors (used with useStore + shallow)
const filteredMarkets = (state: MarketState) =>
  state.activeFilter === 'Alle'
    ? state.openMarkets
    : state.openMarkets.filter(m => m.category === state.activeFilter);

const marketCountByCategory = (state: MarketState) =>
  state.openMarkets.reduce<Record<string, number>>((acc, m) => {
    acc[m.category] = (acc[m.category] ?? 0) + 1;
    return acc;
  }, {});

const sessionPnL = (state: BetState) =>
  state.bets.reduce((sum, b) => sum + b.actualReturn - (b.status !== 'ausstehend' ? b.stake : 0), 0);
```

---

## `useMatchStream` Hook Contract

```typescript
// hooks/useMatchStream.ts

export interface UseMatchStreamOptions {
  matchId: string;
  onFrame: (frame: Frame) => void;
  onEvent: (event: KPIEvent) => void;
  onMarketNew: (market: MiniMarket) => void;
  onMarketUpdate: (patch: Partial<MiniMarket> & { id: string }) => void;
  onMarketSettled: (id: string, winningOutcomeId: string) => void;
}

export interface UseMatchStreamResult {
  connectionStatus: 'connecting' | 'connected' | 'error' | 'disconnected';
  connectionError: string | null;
}

export function useMatchStream(options: UseMatchStreamOptions): UseMatchStreamResult;
```

### Reconnection Strategy

```
attempt 1 → wait 1 s
attempt 2 → wait 2 s
attempt 3 → wait 4 s
attempt 4 → wait 8 s
attempt 5 → wait 16 s
attempt 6+ → give up, set connectionStatus = 'error'
```

Implementation sketch:

```typescript
const MAX_RETRIES = 5;
const BASE_DELAY_MS = 1000;

function connect(attempt: number) {
  const transport = createTransport(matchId); // from config/dataSource.ts
  transport.onMessage = handleMessage;
  transport.onClose = () => {
    if (attempt < MAX_RETRIES) {
      const delay = BASE_DELAY_MS * Math.pow(2, attempt);
      retryTimer.current = setTimeout(() => connect(attempt + 1), delay);
    } else {
      setStatus('error', t.connectionError);
    }
  };
  transport.connect();
}
```

### Frame Throttling

Frames arrive at 25 Hz (every 40 ms). The `onFrame` callback writes directly to `pitchRef.current` — it does **not** call any Zustand setter. The `PitchView` component schedules a single `requestAnimationFrame` loop on mount; that loop reads `pitchRef.current` and mutates SVG element attributes directly.

```typescript
// Inside useMatchStream
const frameBuffer = useRef<Frame | null>(null);

transport.onMessage = (msg) => {
  if (msg.type === 'frame') {
    frameBuffer.current = parseFrame(msg.payload); // validated, typed
    options.onFrame(frameBuffer.current);
  }
  // other message types → Zustand actions
};
```

---

## 25 Hz Render Strategy — PitchView

The `PitchView` component owns the SVG DOM and a `useRef` map of SVG circle elements. It never stores positions in React state.

```typescript
// components/sections/PitchView/PitchView.tsx (sketch)

interface PitchRef {
  players: Map<string, SVGCircleElement>;
  ball: SVGCircleElement | null;
  latestFrame: Frame | null;
}

export function PitchView({ matchId }: { matchId: string }) {
  const svgRef = useRef<SVGSVGElement>(null);
  const pitchRef = useRef<PitchRef>({ players: new Map(), ball: null, latestFrame: null });
  const rafId = useRef<number>(0);

  // Called by useMatchStream at 25 Hz — no setState
  const handleFrame = useCallback((frame: Frame) => {
    pitchRef.current.latestFrame = frame;
  }, []);

  // rAF loop — runs at display refresh rate (≥60 Hz)
  useEffect(() => {
    const loop = () => {
      const { latestFrame, players, ball } = pitchRef.current;
      if (latestFrame) {
        for (const p of latestFrame.players) {
          const el = players.get(p.playerId);
          if (el) {
            el.setAttribute('cx', String(pitchToSvgX(p.x)));
            el.setAttribute('cy', String(pitchToSvgY(p.y)));
          }
        }
        if (ball) {
          ball.setAttribute('cx', String(pitchToSvgX(latestFrame.ball.x)));
          ball.setAttribute('cy', String(pitchToSvgY(latestFrame.ball.y)));
        }
      }
      rafId.current = requestAnimationFrame(loop);
    };
    rafId.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(rafId.current);
  }, []);

  // SVG is rendered once; circles are registered into pitchRef.current.players
  // via ref callbacks on mount
  return (
    <svg ref={svgRef} role="img" aria-label={...} className={styles.pitch}>
      {/* pitch lines rendered once */}
      {/* player circles rendered once, positions mutated via rAF */}
    </svg>
  );
}
```

**Why this works at 55+ fps:**
- The rAF loop runs at the display refresh rate (typically 60 Hz).
- Each iteration does at most 23 `setAttribute` calls — O(1) DOM work.
- No React reconciliation is triggered; the virtual DOM is never diffed for position changes.
- Interpolation between frames: the loop can lerp between `previousFrame` and `latestFrame` using `(Date.now() - latestFrame.timestamp) / 40` as the alpha factor.

---

## Visual Design Decisions

### Reused CSS Classes (from existing site)

| Existing class | Used in | Notes |
|---|---|---|
| `.match-card` | `MatchCard` | Base card style; CSS Module adds `cursor: pointer`, hover transform |
| `.live-dot` | `LiveDot`, `Scoreboard` | 6×6 px red circle with `@keyframes blink` |
| `.section-header` | `MatchListPage`, `MarketsFeed` | Section title typography |
| `.standings-table` | `HistoryPage` | Table base styles |
| `.main-nav` | Nav integration | Only insertion point; no modification |
| `.nav-link` | Nav integration | Active state added via `aria-current` + CSS Module |

### New CSS (CSS Modules)

| Module | Key rules |
|---|---|
| `LivePredictLayout.module.css` | `.demomodusBanner` — `background: var(--dark4)`, `color: var(--text-muted)`, `font: 700 12px/1 'Roboto Condensed'`, `text-transform: uppercase`, `padding: 6px 16px` |
| `MatchCard.module.css` | `.card:hover { transform: translateY(-2px); border-color: var(--dark3); transition: 150ms; }` |
| `PitchView.module.css` | `.pitch { background: var(--dark2); }` pitch line `stroke: rgba(255,255,255,0.3)` |
| `Scoreboard.module.css` | `.score { font: 300 56px/1 'Oswald'; }` |
| `MarketCard.module.css` | `.ttl { font: 700 14px/1 'Oswald'; font-variant-numeric: tabular-nums; }` `.odds { font: 700 22px/1 'Oswald'; color: var(--red); }` |
| `OutcomeButton.module.css` | `.btn:focus-visible { outline: 2px solid var(--red); }` |
| `LivePill.module.css` | `.pill { background: var(--red); font-size: 9px; font-weight: 700; padding: 2px 6px; border-radius: 2px; }` |

### Design Tokens Used

All colours reference existing CSS custom properties:
- `--red: #d2001f` — LIVE pill, odds, active underline, focus ring
- `--dark2: #141414` — pitch background
- `--dark3: #1e1e1e` — hover border
- `--dark4: #282828` — DEMOMODUS banner background
- `--border: #2a2a2a` — card borders
- `--text: #fff` — primary text
- `--text-muted: #888` — labels, implied probability, DEMOMODUS text
- `--text-dim: #555` — secondary labels

### Responsive Breakpoint

```css
/* MatchDetailPage.module.css */
.layout {
  display: grid;
  grid-template-columns: 60fr 40fr;
  gap: 16px;
}

@media (max-width: 900px) {
  .layout {
    grid-template-columns: 1fr;
  }
}
```

---

## Mock Data Layer Architecture

### Configuration Switch

```typescript
// config/dataSource.ts
export const USE_MOCK = true; // flip to false for real backend

export function createTransport(matchId: string): ITransport {
  return USE_MOCK
    ? new MockTransport(matchId)
    : new WebSocketTransport(`wss://api/live/${matchId}`);
}

export function createApiClient(): IApiClient {
  return USE_MOCK ? new MockApiClient() : new RealApiClient();
}
```

### `simulation_output.json` Structure

```json
{
  "matchMeta": { /* Match object */ },
  "messages": [
    { "offsetMs": 0,    "type": "frame",          "payload": { ... } },
    { "offsetMs": 40,   "type": "frame",          "payload": { ... } },
    { "offsetMs": 1200, "type": "event",          "payload": { ... } },
    { "offsetMs": 1250, "type": "market.new",     "payload": { ... } },
    { "offsetMs": 13250,"type": "market.settled", "payload": { ... } }
  ]
}
```

Each entry has an `offsetMs` relative to the start of the simulation. The `MockTransport` uses `setTimeout` chains to emit messages at the correct relative times.

### `MockTransport` Replay Algorithm

```typescript
class MockTransport implements ITransport {
  private timers: ReturnType<typeof setTimeout>[] = [];
  private startTime = 0;

  connect() {
    this.startTime = Date.now();
    const { messages } = simulationData;

    for (const msg of messages) {
      const timer = setTimeout(() => {
        this.onMessage?.({ type: msg.type, payload: msg.payload });
      }, msg.offsetMs);
      this.timers.push(timer);
    }

    // Loop: when last message fires, restart
    const lastOffset = messages[messages.length - 1].offsetMs;
    const loopTimer = setTimeout(() => {
      this.disconnect();
      this.connect(); // seamless loop
    }, lastOffset + 100);
    this.timers.push(loopTimer);
  }

  disconnect() {
    this.timers.forEach(clearTimeout);
    this.timers = [];
  }
}
```

### Mock API Client

```typescript
class MockApiClient implements IApiClient {
  async getLiveMatches(): Promise<Match[]> {
    return [simulationData.matchMeta];
  }

  async getMatch(id: string): Promise<Match> {
    return simulationData.matchMeta;
  }

  async placeBet(req: PlaceBetRequest): Promise<Bet> {
    // Returns a synthetic Bet with status 'ausstehend'
    return {
      id: crypto.randomUUID(),
      ...req,
      potentialReturn: req.stake * req.decimalOdds,
      actualReturn: 0,
      status: 'ausstehend',
      placedAt: Date.now(),
    };
  }
}
```

---

## React Router v6 Routing Scheme

```typescript
// router/index.tsx
import { lazy, Suspense } from 'react';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import LivePredictLayout from '../components/layout/LivePredictLayout';
import MatchListPage from '../components/pages/MatchListPage';
import HistoryPage from '../components/pages/HistoryPage';

// Code-split: match detail only loaded when navigated to
const MatchDetailPage = lazy(() => import('../components/pages/MatchDetailPage'));

export const router = createBrowserRouter([
  {
    path: '/live-predict',
    element: <LivePredictLayout />,
    children: [
      { index: true, element: <MatchListPage /> },
      {
        path: ':matchId',
        element: (
          <Suspense fallback={<LoadingSpinner />}>
            <MatchDetailPage />
          </Suspense>
        ),
      },
      { path: 'meine-wetten', element: <HistoryPage /> },
    ],
  },
]);
```

The existing site's router (or `<a>` links) is extended by mounting this `RouterProvider` inside the main content area. The `LivePredictLayout` renders `<DemomodusBanner />` followed by `<Outlet />`.

---

## Error Handling

| Scenario | Handling |
|---|---|
| WebSocket connection lost | Exponential back-off (5 retries); after max retries, `connectionStatus = 'error'`, German error message shown in match detail header |
| Malformed WebSocket message | Parser returns `ParseError`; message is logged to console and discarded; no crash |
| `POST /api/bets` failure | Inline German error in Bet_Slip modal; modal stays open |
| Market TTL expires while Bet_Slip open | Modal closes; toast notification "Markt abgelaufen – Wette nicht platziert" |
| Empty live matches list | Empty-state component with German text + next scheduled matches |
| `simulation_output.json` missing | MockTransport logs error and emits no messages; UI shows connection error state |

### Parser Error Type

```typescript
export type ParseResult<T> =
  | { ok: true; value: T }
  | { ok: false; error: string };

// Usage in transport
const result = parseFrame(rawPayload);
if (!result.ok) {
  console.error('[LivePredict] Frame parse error:', result.error);
  return; // discard
}
options.onFrame(result.value);
```

---

## Testing Strategy

### Unit Tests (Vitest + React Testing Library)

| Test target | What is tested |
|---|---|
| `MarketCard` | TTL countdown renders correctly; `aria-live="polite"` present; settled state shows checkmark/dash |
| `OutcomeButton` | Renders label, odds, probability; keyboard activation triggers `onClick`; `aria-label` format |
| `BetSlip` | Amount validation (min 1, max 500); payout calculation updates in real time; "Wette bestätigen" calls submit |
| `useMatchStream` | Reconnection logic: mock transport that closes immediately triggers retry; after 5 failures sets error state |
| Market settlement | `settleMarket` action updates status, `settleBet` updates P&L |
| `filteredMarkets` selector | Returns all markets when filter is 'Alle'; filters correctly by category |

### Property-Based Tests (Vitest + fast-check)

Each property test runs a minimum of **100 iterations**. Tests are tagged with:

```
// Feature: bundesliga-live-predict, Property N: <property text>
```

See **Correctness Properties** section below for the full list.

### Integration Tests

| Scenario | Approach |
|---|---|
| Full mock replay | Mount `MatchDetailPage` with `USE_MOCK = true`; assert markets appear, bets can be placed |
| Navigation | `MemoryRouter` with all three routes; assert correct page renders |


---

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system — essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property Reflection

Before writing the final properties, redundancy was assessed across all PROPERTY-classified criteria:

- **4.1 (only live/upcoming cards shown)** and **10.9 (filter shows only matching markets)** are both filtering properties but operate on different data types and different components — kept separate.
- **10.2 (MarketCard renders required fields)** and **10.4 (OutcomeButton renders required fields)** overlap in that OutcomeButton is inside MarketCard. However, they test different rendering units at different granularities — kept separate.
- **12.2 (session P&L calculation)** and **13.3 (history summary figures)** both test aggregate calculations over bet arrays. They are similar but operate on different views and include different metrics (history adds hit rate and total wagered) — kept separate.
- **20.3 (prettyPrint produces JSON-serializable output)** is subsumed by **20.4 (round-trip property)**: if the round-trip holds, the pretty-printer necessarily produces valid JSON. Property 20.3 is merged into the round-trip property.
- **3.1 (DEMOMODUS banner on all routes)** is a universal invariant across route inputs — kept as a property.
- **7.7 (interpolation convex combination)** is a pure function property — kept.
- **14.2 (exponential back-off)** and **14.4 (matchId isolation)** are distinct behavioral properties — kept separate.

After reflection: **12 distinct properties** remain, each providing unique validation value.

---

### Property 1: DEMOMODUS Banner Invariant

*For any* valid sub-path under `/live-predict` (including the index, any `:matchId`, and `meine-wetten`), rendering the `LivePredictLayout` with that route active SHALL result in the `DemomodusBanner` component being present in the rendered output.

**Validates: Requirements 3.1**

---

### Property 2: Match List Shows Only Live and Upcoming Matches

*For any* array of `Match` objects with arbitrary `status` values, the `MatchListPage` SHALL render exactly the matches whose `status` is `'live'` or `'upcoming'` as `MatchCard` components, and SHALL NOT render cards for matches with any other status.

**Validates: Requirements 4.1**

---

### Property 3: MatchCard Renders All Required Fields

*For any* valid `Match` object, the `MatchCard` component SHALL render the home team name, away team name, current home score, current away score, current match minute, and the open market count badge — all present and matching the input data.

**Validates: Requirements 4.2**

---

### Property 4: Scoreboard Renders All Required Fields

*For any* valid `Match` object, the `Scoreboard` component SHALL render the home team name, away team name, home score, and away score — all present and matching the input data.

**Validates: Requirements 6.1**

---

### Property 5: PitchView Renders Correct Number of Player Circles

*For any* valid `Frame` object containing between 1 and 22 `PlayerPosition` entries, the `PitchView` component SHALL render exactly that many player circles in the SVG, each with the correct `teamSide` colour class (`home` → `--red`, `away` → blue).

**Validates: Requirements 7.2**

---

### Property 6: Position Interpolation Is a Convex Combination

*For any* two valid positions `(x0, y0)` and `(x1, y1)` on the pitch coordinate space and any interpolation factor `alpha` in `[0, 1]`, the `interpolatePosition` function SHALL return a position `(x, y)` such that `x = x0 + alpha * (x1 - x0)` and `y = y0 + alpha * (y1 - y0)`, and the result SHALL lie within the pitch bounds `[0, 105] × [0, 68]` when both input positions are within bounds.

**Validates: Requirements 7.7**

---

### Property 7: Timeline Dot Color Matches Event Type

*For any* array of `KPIEvent` objects with arbitrary `type` values, the `Timeline` component SHALL render one dot per event, and each dot's colour class SHALL correspond to the event type: `goal` → green, `shot` → grey, `corner` → yellow, `open market` → `--red`.

**Validates: Requirements 9.2**

---

### Property 8: Markets Feed Ordering — Most Recent First

*For any* array of `MiniMarket` objects with arbitrary `openedAt` timestamps, the `MarketsFeed` component SHALL render the market cards in descending order of `openedAt` (most recently opened first).

**Validates: Requirements 10.1**

---

### Property 9: MarketCard and OutcomeButton Render All Required Fields

*For any* valid `MiniMarket` object with 2–4 `Outcome` entries, the `MarketCard` component SHALL render: a `LivePill`, a TTL countdown in `MM:SS` format, the market question, and one `OutcomeButton` per outcome. Each `OutcomeButton` SHALL display the outcome label, decimal odds, and implied probability — all matching the input data.

**Validates: Requirements 10.2, 10.4**

---

### Property 10: Filter Pill Counts Match Actual Market Counts

*For any* array of open `MiniMarket` objects with arbitrary `category` values, the count displayed on each filter pill in the `MarketsFeed` SHALL equal the number of markets in `openMarkets` whose `category` matches that pill's label. Selecting a filter pill SHALL result in only markets of that category being rendered.

**Validates: Requirements 10.8, 10.9**

---

### Property 11: BetSlip Payout Calculation

*For any* stake amount `s` in `[1, 500]` and decimal odds `o` in `[1.01, 100]`, the `BetSlip` component SHALL display a potential payout equal to `s × o` (rounded to two decimal places), updated in real time as the user types.

**Validates: Requirements 11.2**

---

### Property 12: Session P&L and History Summary Correctness

*For any* array of `Bet` objects with arbitrary `status`, `stake`, and `actualReturn` values:

- The `MeineWettenPanel` SHALL display a `sessionPnL` equal to the sum of `(actualReturn - stake)` for all bets whose status is `'gewonnen'` or `'verloren'`.
- The `HistoryPage` summary SHALL display: `totalWagered` = sum of all stakes, `totalWon` = sum of `actualReturn` for winning bets, `netPnL` = `totalWon - totalWagered`, and `hitRate` = count of winning bets / count of settled bets (0 if no settled bets).
- Applying a status or match filter SHALL update all four summary figures to reflect only the filtered subset.

**Validates: Requirements 12.2, 13.3, 13.5**

---

### Property 13: Stream Hook Exponential Back-off

*For any* number of consecutive connection failures `n` where `1 ≤ n ≤ 5`, the `useMatchStream` hook SHALL schedule the `n`-th reconnection attempt after a delay of `1000 × 2^(n-1)` milliseconds (i.e., 1 s, 2 s, 4 s, 8 s, 16 s). After 5 consecutive failures, the hook SHALL set `connectionStatus` to `'error'` and SHALL NOT schedule further reconnection attempts.

**Validates: Requirements 14.2, 14.3**

---

### Property 14: Stream Hook matchId Isolation

*For any* two distinct `matchId` values `A` and `B`, when `useMatchStream` is instantiated with `matchId = A`, any WebSocket message whose payload contains `matchId = B` SHALL NOT be delivered to any of the hook's callbacks.

**Validates: Requirements 14.4**

---

### Property 15: DTO Round-Trip (Parse → PrettyPrint → Parse)

*For any* valid DTO object of type `Frame`, `KPIEvent`, `MiniMarket`, `Outcome`, or `Bet`, the following round-trip SHALL hold:

```
parse(JSON.stringify(prettyPrint(dto))) ≅ dto
```

That is, calling `prettyPrint` on a valid DTO produces a JSON-serializable plain object, and parsing the JSON string of that plain object produces a DTO that is deeply equal to the original. This property SHALL hold for all structurally valid inputs, including edge cases such as empty `players` arrays, zero odds, and maximum-length strings.

**Validates: Requirements 20.1, 20.3, 20.4**

---

### Property 16: Parser Rejects Invalid Inputs

*For any* plain object that is missing one or more required fields of a DTO type (e.g., `Frame` without `matchId`, `MiniMarket` with `outcomes` outside the 2–4 range, `Bet` with `stake` outside `[1, 500]`), the corresponding parser SHALL return `{ ok: false, error: <non-empty string> }` and SHALL NOT throw an exception.

**Validates: Requirements 20.1, 20.2**

---

## Testing Strategy (Complete)

### Property-Based Testing Library

Use **[fast-check](https://github.com/dubzzz/fast-check)** with Vitest. Each property test is configured with a minimum of **100 runs** (`{ numRuns: 100 }`).

Tag format for each test:
```typescript
// Feature: bundesliga-live-predict, Property N: <property text>
```

### Arbitraries (fast-check generators)

```typescript
// test/arbitraries.ts

import * as fc from 'fast-check';

export const arbMatchStatus = fc.constantFrom('upcoming', 'live', 'finished');

export const arbTeamInfo = fc.record({
  id: fc.uuid(),
  name: fc.string({ minLength: 1, maxLength: 40 }),
  shortName: fc.string({ minLength: 2, maxLength: 5 }),
  logoUrl: fc.webUrl(),
});

export const arbMatch = fc.record({
  id: fc.uuid(),
  homeTeam: arbTeamInfo,
  awayTeam: arbTeamInfo,
  homeScore: fc.nat(20),
  awayScore: fc.nat(20),
  minute: fc.integer({ min: 0, max: 120 }),
  status: arbMatchStatus,
  openMarketCount: fc.nat(20),
});

export const arbPlayerPosition = fc.record({
  playerId: fc.uuid(),
  jerseyNumber: fc.integer({ min: 1, max: 99 }),
  teamSide: fc.constantFrom('home', 'away'),
  x: fc.float({ min: 0, max: 105 }),
  y: fc.float({ min: 0, max: 68 }),
  speedKmh: fc.float({ min: 0, max: 40 }),
});

export const arbFrame = fc.record({
  matchId: fc.uuid(),
  timestamp: fc.integer({ min: 0 }),
  players: fc.array(arbPlayerPosition, { minLength: 0, maxLength: 22 }),
  ball: fc.record({
    x: fc.float({ min: 0, max: 105 }),
    y: fc.float({ min: 0, max: 68 }),
    z: fc.float({ min: 0, max: 5 }),
  }),
});

export const arbKPIEventType = fc.constantFrom('goal', 'shot', 'corner', 'foul', 'sprint');

export const arbKPIEvent = fc.record({
  id: fc.uuid(),
  matchId: fc.uuid(),
  type: arbKPIEventType,
  minute: fc.integer({ min: 0, max: 120 }),
  teamSide: fc.constantFrom('home', 'away'),
  playerId: fc.option(fc.uuid()),
  xG: fc.option(fc.float({ min: 0, max: 1 })),
  xP: fc.option(fc.float({ min: 0, max: 1 })),
  detail: fc.option(fc.string({ maxLength: 100 })),
});

export const arbOutcome = fc.record({
  id: fc.uuid(),
  label: fc.string({ minLength: 1, maxLength: 60 }),
  decimalOdds: fc.float({ min: 1.01, max: 100 }),
  impliedProbability: fc.float({ min: 0, max: 1 }),
});

export const arbMiniMarket = fc.record({
  id: fc.uuid(),
  matchId: fc.uuid(),
  question: fc.string({ minLength: 1, maxLength: 120 }),
  category: fc.constantFrom('Tor', 'Torschuss', 'Ecke', 'Freistoß', 'Sprint', 'Andere'),
  outcomes: fc.array(arbOutcome, { minLength: 2, maxLength: 4 }),
  ttlSeconds: fc.integer({ min: 0, max: 60 }),
  openedAt: fc.integer({ min: 0 }),
  status: fc.constantFrom('open', 'settled', 'cancelled'),
  winningOutcomeId: fc.option(fc.uuid()),
});

export const arbBet = fc.record({
  id: fc.uuid(),
  matchId: fc.uuid(),
  marketId: fc.uuid(),
  marketQuestion: fc.string({ minLength: 1, maxLength: 120 }),
  outcomeId: fc.uuid(),
  outcomeLabel: fc.string({ minLength: 1, maxLength: 60 }),
  decimalOdds: fc.float({ min: 1.01, max: 100 }),
  stake: fc.integer({ min: 1, max: 500 }),
  potentialReturn: fc.float({ min: 1.01, max: 50000 }),
  actualReturn: fc.float({ min: 0, max: 50000 }),
  status: fc.constantFrom('ausstehend', 'gewonnen', 'verloren', 'storniert'),
  placedAt: fc.integer({ min: 0 }),
});
```

### Property Test Examples

```typescript
// test/parsers.property.test.ts

import { describe, it } from 'vitest';
import * as fc from 'fast-check';
import { parseFrame, prettyPrintFrame } from '../src/parsers/frameParser';
import { parseKPIEvent, prettyPrintKPIEvent } from '../src/parsers/eventParser';
import { parseMiniMarket, prettyPrintMiniMarket, parseBet, prettyPrintBet } from '../src/parsers/marketParser';
import { arbFrame, arbKPIEvent, arbMiniMarket, arbBet } from './arbitraries';

describe('DTO Round-Trip Properties', () => {
  // Feature: bundesliga-live-predict, Property 15: DTO round-trip parse → prettyPrint → parse
  it('Frame round-trip', () => {
    fc.assert(
      fc.property(arbFrame, (frame) => {
        const printed = prettyPrintFrame(frame);
        const result = parseFrame(JSON.parse(JSON.stringify(printed)));
        expect(result.ok).toBe(true);
        if (result.ok) expect(result.value).toEqual(frame);
      }),
      { numRuns: 100 }
    );
  });

  it('KPIEvent round-trip', () => {
    fc.assert(
      fc.property(arbKPIEvent, (event) => {
        const printed = prettyPrintKPIEvent(event);
        const result = parseKPIEvent(JSON.parse(JSON.stringify(printed)));
        expect(result.ok).toBe(true);
        if (result.ok) expect(result.value).toEqual(event);
      }),
      { numRuns: 100 }
    );
  });

  it('MiniMarket round-trip', () => {
    fc.assert(
      fc.property(arbMiniMarket, (market) => {
        const printed = prettyPrintMiniMarket(market);
        const result = parseMiniMarket(JSON.parse(JSON.stringify(printed)));
        expect(result.ok).toBe(true);
        if (result.ok) expect(result.value).toEqual(market);
      }),
      { numRuns: 100 }
    );
  });

  it('Bet round-trip', () => {
    fc.assert(
      fc.property(arbBet, (bet) => {
        const printed = prettyPrintBet(bet);
        const result = parseBet(JSON.parse(JSON.stringify(printed)));
        expect(result.ok).toBe(true);
        if (result.ok) expect(result.value).toEqual(bet);
      }),
      { numRuns: 100 }
    );
  });
});
```

### Unit Test Coverage Summary

| Test file | Tests |
|---|---|
| `MarketCard.test.tsx` | TTL countdown renders; `aria-live="polite"` present; settled state shows checkmark/dash; LIVE_Pill present |
| `OutcomeButton.test.tsx` | Renders label, odds, probability; keyboard activation; `aria-label` format; `role="button"` |
| `BetSlip.test.tsx` | Amount validation (min 1, max 500); payout calculation; "Wette bestätigen" submits; error message on failure; modal closes on success |
| `useMatchStream.test.ts` | Reconnection: mock transport closes immediately → retry; after 5 failures → error state; unmount → disconnect |
| `marketStore.test.ts` | `addMarket`, `updateMarket`, `settleMarket` actions; `filteredMarkets` selector; `marketCountByCategory` selector |
| `betStore.test.ts` | `addBet`, `settleBet` actions; `sessionPnL` selector |
| `parsers.property.test.ts` | Round-trip for Frame, KPIEvent, MiniMarket, Bet (Property 15); parser rejects invalid inputs (Property 16) |
| `MatchListPage.test.tsx` | Only live/upcoming cards rendered (Property 2); empty state message |
| `HistoryPage.test.tsx` | Summary figures correctness (Property 12); filter updates rows and summary |
| `interpolation.test.ts` | Convex combination property (Property 6) |
