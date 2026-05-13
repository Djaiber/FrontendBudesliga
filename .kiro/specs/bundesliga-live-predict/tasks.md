# Implementation Plan: bundesliga-live-predict

## Overview

This plan converts the bundesliga-live-predict design into a fully ordered backlog of coding tasks.
Tasks are ordered by dependency: foundational infrastructure first, UI assembly last.
Each task is granular enough for a junior developer to execute independently.
The design document uses TypeScript/React, so all implementation tasks use TypeScript.

---

## Tasks

- [x] 1. Project scaffold and configuration
  - Initialise a Vite + React 18 + TypeScript strict project inside the existing repo under `src/live-predict/`.
  - Configure `tsconfig.json` with `strict: true` and `paths` aliases for `@/` pointing to `src/live-predict/`.
  - Install runtime dependencies: `react-router-dom@6`, `zustand`.
  - Install dev dependencies: `vitest`, `@testing-library/react`, `@testing-library/user-event`, `fast-check`, `jsdom`.
  - Add `vitest.config.ts` with `jsdom` environment and coverage thresholds.
  - Create the directory skeleton: `config/`, `i18n/`, `types/`, `parsers/`, `store/`, `transport/`, `hooks/`, `components/atoms/`, `components/sections/`, `components/pages/`, `components/layout/`, `router/`, `test/`.
  - _Requirements: 19.1, 19.2, 19.3, 19.5_
- [x] 2. TypeScript DTO type definitions
  - [x] 2.1 Create `types/match.ts` with `MatchStatus`, `TeamInfo`, and `Match` interfaces exactly as specified in the design.
    - _Requirements: 19.4_
  - [x] 2.2 Create `types/frame.ts` with `PlayerPosition`, `BallPosition`, and `Frame` interfaces.
    - _Requirements: 19.4_
  - [x] 2.3 Create `types/event.ts` with `KPIEventType` union and `KPIEvent` interface.
    - _Requirements: 19.4_
  - [x] 2.4 Create `types/market.ts` with `MarketStatus`, `Outcome`, and `MiniMarket` interfaces.
    - _Requirements: 19.4_
  - [x] 2.5 Create `types/bet.ts` with `BetStatus` union and `Bet` interface.
    - _Requirements: 19.4_

- [x] 3. i18n German strings module
  - Create `i18n/de.ts` exporting a typed `const de` object with every user-visible German string used across all components.
  - Include strings for: DEMOMODUS banner, empty-state messages, bet slip labels ("Wette bestätigen", "Abbrechen"), error messages ("Verbindung unterbrochen – bitte Seite neu laden", "Markt abgelaufen – Wette nicht platziert"), nav link text, history table column headers, filter pill labels, status labels ("ausstehend", "gewonnen", "verloren", "storniert"), metrics bar labels, and tooltip text.
  - Export the type `typeof de` as `I18nDe` so components can import the type for prop typing.
  - _Requirements: 18.1, 18.2, 18.3_

- [x] 4. Configuration module and transport factory
  - Create `config/dataSource.ts` exporting `USE_MOCK: boolean` flag (default `true`).
  - Export `createTransport(matchId: string): ITransport` factory that returns `MockTransport` when `USE_MOCK` is true, `WebSocketTransport` otherwise.
  - Export `createApiClient(): IApiClient` factory with the same conditional logic.
  - Define the `IApiClient` interface with methods: `getLiveMatches(): Promise<Match[]>`, `getMatch(id: string): Promise<Match>`, `placeBet(req: PlaceBetRequest): Promise<Bet>`.
  - _Requirements: 15.3_
- [x] 5. Transport layer — ITransport interface and WebSocketTransport
  - [x] 5.1 Create `transport/ITransport.ts` exporting `WSMessageType` union, `WSMessage<T>` generic interface, and `ITransport` interface with `connect()`, `disconnect()`, `onMessage` callback, and `onClose` callback.
    - _Requirements: 14.1, 15.2_
  - [x] 5.2 Create `transport/WebSocketTransport.ts` implementing `ITransport` using the native `WebSocket` API connecting to `wss://api/live/:matchId`.
    - Wire `ws.onmessage` to parse the JSON envelope and call `this.onMessage`.
    - Wire `ws.onclose` to call `this.onClose`.
    - Implement `disconnect()` to call `ws.close()`.
    - _Requirements: 14.1_

- [x] 6. MockTransport — simulation_output.json replay
  - Create `transport/MockTransport.ts` implementing `ITransport`.
  - Import `simulation_output.json` statically.
  - In `connect()`, iterate over `messages` array and schedule each message with `setTimeout` using the message's `offsetMs` as the delay.
  - After the last message fires, schedule a `setTimeout` 100 ms later that calls `this.disconnect()` then `this.connect()` for a seamless loop.
  - In `disconnect()`, call `clearTimeout` on all stored timer IDs and reset the timers array.
  - _Requirements: 15.1, 15.2, 15.5_

- [x] 7. Parsers — ParseResult type, frameParser, eventParser, marketParser
  - [x] 7.1 Create `parsers/frameParser.ts` exporting `ParseResult<T>` type, `parseFrame(raw: unknown): ParseResult<Frame>`, and `prettyPrintFrame(frame: Frame): object`.
    - Validate all required fields; return `{ ok: false, error: string }` for any missing or out-of-range field.
    - _Requirements: 20.1, 20.2, 20.3_
  - [x] 7.2 Create `parsers/eventParser.ts` exporting `parseKPIEvent(raw: unknown): ParseResult<KPIEvent>` and `prettyPrintKPIEvent(event: KPIEvent): object`.
    - _Requirements: 20.1, 20.2, 20.3_
  - [x] 7.3 Create `parsers/marketParser.ts` exporting `parseMiniMarket`, `prettyPrintMiniMarket`, `parseBet`, `prettyPrintBet`, and `parseOutcome`.
    - Validate `outcomes` array length is 2–4; validate `stake` is in [1, 500].
    - _Requirements: 20.1, 20.2, 20.3_
- [x] 8. Zustand stores — matchStore, marketStore, betStore
  - [x] 8.1 Create `store/matchStore.ts` with MatchState and MatchActions as defined in the design.
    - Implement actions: setMatches, setCurrentMatch, applyGoal, addEvent, setConnectionStatus.
    - _Requirements: 19.3_
  - [x] 8.2 Create `store/marketStore.ts` with MarketState and MarketActions.
    - Implement actions: addMarket, updateMarket, settleMarket, setFilter, tickTTL.
    - Implement selectors: filteredMarkets and marketCountByCategory.
    - _Requirements: 10.8, 10.9, 19.3_
  - [x] 8.3 Create `store/betStore.ts` with BetState and BetActions.
    - Implement actions: addBet, settleBet, clearSession.
    - Implement sessionPnL selector.
    - _Requirements: 12.2, 19.3_

- [x] 9. useMatchStream hook
  - Create `hooks/useMatchStream.ts` implementing the UseMatchStreamOptions and UseMatchStreamResult contract from the design.
  - Call createTransport(matchId) from `config/dataSource.ts` on mount.
  - Route incoming messages by type: frame -> call options.onFrame (write to frameBuffer.current, do NOT call any Zustand setter); event -> options.onEvent; market.* -> respective callbacks.
  - Implement exponential back-off reconnection: attempt n waits 1000 * 2^(n-1) ms; after 5 failures set connectionStatus to `'error'`.
  - Store the retry timer in a useRef and cancel it on unmount.
  - On unmount, call transport.disconnect() and clear all timers.
  - _Requirements: 14.1, 14.2, 14.3, 14.4, 14.5_

- [~] 10. Checkpoint — core infrastructure complete
  - Ensure all TypeScript files compile with zero errors (tsc --noEmit).
  - Ensure all tests pass, ask the user if questions arise.
- [x] 11. Atom components — DemomodusBanner, LiveDot, LivePill, FilterPill
  - [x] 11.1 Create `components/atoms/DemomodusBanner/DemomodusBanner.tsx` and its CSS Module.
    - Render a fixed banner with text from `de.demomodusBanner`.
    - Apply background `var(--dark4)`, color `var(--text-muted)`, Roboto Condensed 12px uppercase.
    - The banner must NOT be dismissible.
    - _Requirements: 3.1, 3.2, 3.3, 3.4_
  - [x] 11.2 Create `components/atoms/LiveDot/LiveDot.tsx` and its CSS Module.
    - Render a 6x6 px red circle with `@keyframes blink` opacity 1->0.2 at 1s interval.
    - _Requirements: 4.3, 6.3_
  - [x] 11.3 Create `components/atoms/LivePill/LivePill.tsx` and its CSS Module.
    - Render a "LIVE" badge with background `var(--red)`, font-size 9px, font-weight 700, padding 2px 6px, border-radius 2px.
    - _Requirements: 1.5, 10.2_
  - [x] 11.4 Create `components/atoms/FilterPill/FilterPill.tsx` and its CSS Module.
    - Accept props: label, count, active, onClick.
    - Show label and count badge; apply active underline in `var(--red)` when active.
    - _Requirements: 10.8_

- [x] 12. Atom components — MatchCard, OutcomeButton, MarketCard
  - [x] 12.1 Create `components/atoms/MatchCard/MatchCard.tsx` and its CSS Module.
    - Accept prop `match: Match`.
    - Render home/away team logos (28x28 px), team names, score, match minute in Oswald 16px, open market count badge in `var(--red)`.
    - Show LiveDot when match.status is live.
    - Apply hover transform translateY(-2px), border-color transition to `var(--dark3)` at 150ms, cursor pointer.
    - _Requirements: 4.2, 4.3, 4.7, 4.8_
  - [x] 12.2 Create `components/atoms/OutcomeButton/OutcomeButton.tsx` and its CSS Module.
    - Accept props: outcome, onClick, disabled.
    - Render outcome label, decimal odds in Oswald 22px `var(--red)`, implied probability in Roboto 12px `var(--text-muted)`.
    - Set role="button", aria-label containing market question + outcome label + odds.
    - Apply focus-visible outline 2px solid `var(--red)`.
    - _Requirements: 10.4, 11.8, 17.1, 17.5_
  - [x] 12.3 Create `components/atoms/MarketCard/MarketCard.tsx` and its CSS Module.
    - Accept props: market, onOutcomeClick.
    - Render LivePill, TTL countdown in Oswald MM:SS format with aria-live="polite", market question, and one OutcomeButton per outcome.
    - When market.status is settled: dim card, show green checkmark on winning outcome, grey dash on losing outcomes; after 3 s animate card into collapsed history section.
    - _Requirements: 10.2, 10.3, 10.5, 10.6, 10.7, 17.2_
- [x] 13. LivePredictLayout shell wrapper
  - Create `components/layout/LivePredictLayout.tsx` and `LivePredictLayout.module.css`.
  - Render DemomodusBanner at the top, then `<Outlet />` below it.
  - The layout must render exclusively within the main content area, leaving top-bar, .main-nav, and footer intact.
  - _Requirements: 2.1, 3.1_

- [x] 14. Navigation integration — Live Predict nav link
  - In the existing site nav markup, insert exactly one new nav link with text "Live Predict" immediately after the "Liveticker" link.
  - Use the same visual style as other .nav-link items: Roboto Condensed 13px, font-weight 700, uppercase, letter-spacing 0.5px.
  - When the current route starts with /live-predict, apply a 3px `var(--red)` underline via aria-current + CSS Module.
  - When the current route starts with /live-predict, render a LivePill to the right of the link text.
  - Do NOT modify any existing nav link, CSS rule, or HTML element outside the .main-nav insertion point.
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6_

- [x] 15. MatchListPage
  - Create `components/pages/MatchListPage.tsx` and its CSS Module.
  - On mount, call `createApiClient().getLiveMatches()` and dispatch `setMatches` to matchStore.
  - Set up a `setInterval` to re-poll every 5 seconds; clear it on unmount.
  - Render a grid of MatchCard components for all matches with status live or upcoming only.
  - When no live/upcoming matches exist, render the German empty-state message and next scheduled matches.
  - Navigate to `/live-predict/:matchId` when a MatchCard is clicked.
  - _Requirements: 4.1, 4.4, 4.5, 4.6_

- [x] 16. Scoreboard component
  - Create `components/sections/Scoreboard/Scoreboard.tsx` and its CSS Module.
  - Read from matchStore.currentMatch.
  - Render home team name, home score, separator, away score, away team name.
  - Render score digits in Oswald 56px font-weight 300.
  - Show current match minute with LiveDot when status is live.
  - _Requirements: 6.1, 6.2, 6.3_

- [x] 17. MetricsBar component
  - Create `components/sections/MetricsBar/MetricsBar.tsx` and its CSS Module.
  - Read possession %, accumulated xG per team, total shots per team, and sprint count (players with speedKmh >= 25) from matchStore.
  - Render labels in Roboto Condensed 12px `var(--text-muted)` uppercase.
  - _Requirements: 8.1, 8.2, 8.3_
- [x] 18. PitchView component — SVG with rAF loop
  - Create `components/sections/PitchView/PitchView.tsx` and its CSS Module.
  - Render an SVG with background `var(--dark2)` and white pitch lines at 30% opacity.
  - Render 22 player circles (home in `var(--red)`, away in `#1a6bb5`) with jersey numbers centred in white text.
  - Render the ball as a smaller white filled circle.
  - Set role="img" and aria-label on the SVG; player circles must NOT be individually focusable.
  - Store player and ball positions in a `useRef` (PitchRef) — never in React state.
  - In `useEffect`, start a `requestAnimationFrame` loop that reads pitchRef.current and mutates SVG element attributes directly.
  - Implement position interpolation using lerp between previousFrame and latestFrame with alpha = (Date.now() - latestFrame.timestamp) / 40.
  - Cancel the rAF loop on unmount.
  - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5, 7.6, 7.7, 16.2, 16.3, 17.4_

- [x] 19. Timeline component — SVG event bar
  - Create `components/sections/Timeline/Timeline.tsx` and its CSS Module.
  - Render an SVG bar spanning minutes 0–90.
  - Render one dot per KPIEvent from matchStore.events: goals green, shots grey, corners yellow, open markets `var(--red)`.
  - On hover over a dot, show a tooltip with event type, minute, and detail in Roboto 12px.
  - _Requirements: 9.1, 9.2, 9.3, 9.4_

- [x] 20. MarketsFeed component
  - Create `components/sections/MarketsFeed/MarketsFeed.tsx` and its CSS Module.
  - Read openMarkets from marketStore using the filteredMarkets selector.
  - Render FilterPill components for "Alle", "Tor", "Torschuss", "Ecke", "Freistoß", "Sprint" with counts from marketCountByCategory selector.
  - Render a vertical list of MarketCard components ordered by openedAt descending (most recent first).
  - Set up a `setInterval` calling marketStore.tickTTL() every second; clear on unmount.
  - _Requirements: 10.1, 10.5, 10.6, 10.7, 10.8, 10.9_

- [x] 21. BetSlip modal
  - Create `components/sections/BetSlip/BetSlip.tsx` and its CSS Module.
  - Accept props: market, selectedOutcome, onClose.
  - Render market question, outcome label, decimal odds, numeric amount input (min 1, max 500), and real-time payout calculation (amount x odds).
  - Render "Wette bestätigen" and "Abbrechen" buttons.
  - On confirm with valid amount, call `createApiClient().placeBet(...)` and dispatch addBet to betStore on success; show inline German error on failure without closing modal.
  - When market TTL reaches 0 while modal is open, close modal and show German notification.
  - Trap keyboard focus within the modal while open; return focus to the triggering OutcomeButton on close.
  - _Requirements: 11.1, 11.2, 11.3, 11.4, 11.5, 11.6, 11.7, 17.3_
- [x] 22. MeineWettenPanel component
  - Create `components/sections/MeineWettenPanel/MeineWettenPanel.tsx` and its CSS Module.
  - Read bets and sessionPnL from betStore.
  - Render sessionPnL summary figure above the bet list.
  - Render each bet row: market question, chosen outcome, stake, decimal odds, status, return amount.
  - When no bets exist, render the German empty-state text.
  - _Requirements: 12.1, 12.2, 12.3, 12.4_

- [x] 23. HistoryPage
  - Create `components/pages/HistoryPage.tsx` and its CSS Module.
  - Render a table styled with the existing .standings-table pattern.
  - Include columns: Datum, Spiel, Markt, Gewähltes Ergebnis, Einsatz, Quote, Status, Rückgabe.
  - Render a summary row above the table: total wagered, total won, net P&L, hit rate.
  - Provide filter controls for status (Alle / Gewonnen / Verloren / Ausstehend) and match dropdown.
  - When a filter changes, update displayed rows and summary figures within 200ms without a full page reload.
  - _Requirements: 13.1, 13.2, 13.3, 13.4, 13.5_

- [x] 24. MatchDetailPage — two-column layout assembly
  - Create `components/pages/MatchDetailPage.tsx` and its CSS Module.
  - Read matchId from useParams; call createApiClient().getMatch(matchId) on mount and dispatch setCurrentMatch.
  - Instantiate useMatchStream with callbacks that dispatch to matchStore, marketStore, and write to pitchRef.
  - Render two-column grid: left column (60%) contains Scoreboard, MetricsBar, PitchView, Timeline; right column (40%) contains FilterPills and MarketsFeed.
  - Render MeineWettenPanel below the two columns.
  - Render BetSlip modal conditionally when an OutcomeButton is clicked.
  - Apply responsive breakpoint: below 900px, stack columns vertically.
  - Show connection error message in German when connectionStatus is error.
  - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 14.3_

- [x] 25. Router setup — createBrowserRouter with all three routes
  - Create `router/index.tsx` using createBrowserRouter.
  - Define route /live-predict with element LivePredictLayout.
  - Define index child route with element MatchListPage.
  - Define :matchId child route with element MatchDetailPage wrapped in Suspense with a loading spinner fallback; import MatchDetailPage via `lazy(() => import(...))`.
  - Define meine-wetten child route with element HistoryPage.
  - Export the router and mount it in the main entry point.
  - _Requirements: 2.1, 16.4, 19.2_

- [~] 26. Checkpoint — full UI wired and navigable
  - Ensure all routes render without runtime errors.
  - Ensure the DEMOMODUS banner appears on all three routes.
  - Ensure all TypeScript files compile with zero errors.
  - Ensure all tests pass, ask the user if questions arise.
- [x] 27. Property-based tests — fast-check arbitraries and DTO round-trip
  - [x] 27.1 Create `test/arbitraries.ts` with all fast-check arbitraries: arbMatchStatus, arbTeamInfo, arbMatch, arbPlayerPosition, arbFrame, arbKPIEventType, arbKPIEvent, arbOutcome, arbMiniMarket, arbBet — exactly as specified in the design.
    - _Requirements: 20.4_
  - [-] 27.2 Write property test for Frame round-trip (Property 15)
    - **Property 15: DTO Round-Trip (Parse -> PrettyPrint -> Parse)**
    - In `test/parsers.property.test.ts`, assert that for any arbFrame value, prettyPrintFrame -> JSON.stringify -> JSON.parse -> parseFrame produces a deeply equal Frame.
    - Tag: Feature: bundesliga-live-predict, Property 15: DTO round-trip parse -> prettyPrint -> parse
    - numRuns: 100
    - **Validates: Requirements 20.1, 20.3, 20.4**
  - [-] 27.3 Write property test for KPIEvent round-trip (Property 15)
    - **Property 15: DTO Round-Trip (Parse -> PrettyPrint -> Parse)**
    - Assert round-trip for arbKPIEvent using prettyPrintKPIEvent / parseKPIEvent.
    - Tag: Feature: bundesliga-live-predict, Property 15: DTO round-trip parse -> prettyPrint -> parse
    - numRuns: 100
    - **Validates: Requirements 20.1, 20.3, 20.4**
  - [-] 27.4 Write property test for MiniMarket round-trip (Property 15)
    - **Property 15: DTO Round-Trip (Parse -> PrettyPrint -> Parse)**
    - Assert round-trip for arbMiniMarket using prettyPrintMiniMarket / parseMiniMarket.
    - Tag: Feature: bundesliga-live-predict, Property 15: DTO round-trip parse -> prettyPrint -> parse
    - numRuns: 100
    - **Validates: Requirements 20.1, 20.3, 20.4**
  - [-] 27.5 Write property test for Bet round-trip (Property 15)
    - **Property 15: DTO Round-Trip (Parse -> PrettyPrint -> Parse)**
    - Assert round-trip for arbBet using prettyPrintBet / parseBet.
    - Tag: Feature: bundesliga-live-predict, Property 15: DTO round-trip parse -> prettyPrint -> parse
    - numRuns: 100
    - **Validates: Requirements 20.1, 20.3, 20.4**
  - [ ] 27.6 Write property test for parser rejection of invalid inputs (Property 16)
    - **Property 16: Parser Rejects Invalid Inputs**
    - In `test/parsers.property.test.ts`, generate objects missing required fields (e.g., Frame without matchId, MiniMarket with outcomes.length outside 2-4, Bet with stake outside [1,500]) and assert each parser returns { ok: false, error: <non-empty string> } without throwing.
    - Tag: Feature: bundesliga-live-predict, Property 16: Parser rejects invalid inputs
    - numRuns: 100
    - **Validates: Requirements 20.1, 20.2**
- [ ] 28. Unit tests — stores and selectors
  - [~] 28.1 Write unit tests for marketStore
    - In `test/marketStore.test.ts`, test addMarket, updateMarket, settleMarket actions.
    - Test filteredMarkets selector: returns all markets when filter is Alle; returns only matching markets when a category is selected.
    - Test marketCountByCategory selector returns correct counts.
    - _Requirements: 10.8, 10.9, 19.5_
  - [~] 28.2 Write unit tests for betStore
    - In `test/betStore.test.ts`, test addBet, settleBet actions.
    - Test sessionPnL selector computes correct net P&L across mixed bet statuses.
    - _Requirements: 12.2, 19.5_

- [ ] 29. Unit tests — components
  - [~] 29.1 Write unit tests for MarketCard
    - In `test/MarketCard.test.tsx`, test: TTL countdown renders in MM:SS format; aria-live="polite" is present; settled state shows green checkmark on winning outcome and grey dash on losing outcomes; LivePill is present.
    - _Requirements: 10.2, 10.3, 17.2, 19.5_
  - [~] 29.2 Write unit tests for OutcomeButton
    - In `test/OutcomeButton.test.tsx`, test: renders label, odds, implied probability; keyboard Enter/Space triggers onClick; aria-label contains market question + outcome label + odds; role="button" is set.
    - _Requirements: 10.4, 11.8, 17.1, 19.5_
  - [~] 29.3 Write unit tests for BetSlip
    - In `test/BetSlip.test.tsx`, test: amount validation rejects values below 1 and above 500; payout calculation updates in real time as user types; "Wette bestätigen" calls submit; inline error message shown on API failure; modal closes on success.
    - _Requirements: 11.2, 11.3, 11.4, 11.5, 11.6, 19.5_
  - [~] 29.4 Write unit tests for MatchListPage filtering
    - In `test/MatchListPage.test.tsx`, test: only live and upcoming match cards are rendered for a mixed-status array; empty-state message shown when no live/upcoming matches.
    - _Requirements: 4.1, 4.5, 19.5_

- [ ] 30. Unit tests — useMatchStream reconnection
  - [~] 30.1 Write unit tests for useMatchStream reconnection logic
    - In `test/useMatchStream.test.ts`, use a mock transport that closes immediately.
    - Assert that after each of 5 consecutive failures the hook schedules a retry with the correct exponential delay (1s, 2s, 4s, 8s, 16s).
    - Assert that after 5 failures connectionStatus is set to error and no further retry is scheduled.
    - Assert that unmounting the hook calls transport.disconnect() and cancels pending timers.
    - _Requirements: 14.2, 14.3, 14.5, 19.5_

- [ ] 31. Unit tests — position interpolation
  - [~] 31.1 Write property test for position interpolation convex combination (Property 6)
    - **Property 6: Position Interpolation Is a Convex Combination**
    - In `test/interpolation.test.ts`, for any two positions (x0,y0) and (x1,y1) within pitch bounds and any alpha in [0,1], assert interpolatePosition returns x = x0 + alpha*(x1-x0) and y = y0 + alpha*(y1-y0), and the result lies within [0,105]x[0,68].
    - Tag: Feature: bundesliga-live-predict, Property 6: Position interpolation is a convex combination
    - numRuns: 100
    - **Validates: Requirements 7.7**

- [ ] 32. Integration test — full mock replay and navigation
  - [~] 32.1 Write integration test for full mock replay mount
    - In `test/integration.test.tsx`, mount MatchDetailPage with USE_MOCK = true.
    - Assert that after the mock transport emits market.new messages, MarketCard components appear in the feed.
    - Assert that clicking an OutcomeButton opens the BetSlip modal.
    - Assert that confirming a bet adds it to the MeineWettenPanel.
    - _Requirements: 15.1, 15.2, 15.4_
  - [~] 32.2 Write navigation integration test
    - Using MemoryRouter with all three routes, assert that navigating to /live-predict renders MatchListPage, navigating to /live-predict/:matchId renders MatchDetailPage, and navigating to /live-predict/meine-wetten renders HistoryPage.
    - Assert DemomodusBanner is present on all three routes.
    - _Requirements: 3.1, 19.2_

- [~] 33. Final checkpoint — all tests pass
  - Run the full Vitest suite and ensure all tests pass.
  - Run tsc --noEmit and ensure zero TypeScript errors.
  - Ensure all tests pass, ask the user if questions arise.
## Notes

- Tasks marked with `*` are optional and can be skipped for a faster MVP.
- Each task references specific requirements for traceability.
- Checkpoints (tasks 10, 26, 33) ensure incremental validation.
- Property tests validate universal correctness properties (Properties 6, 15, 16).
- Unit tests validate specific examples and edge cases.
- The design uses TypeScript/React 18 throughout; all code must compile with strict mode.
- All German strings must be imported from `i18n/de.ts`; no hard-coded strings in JSX.
- The `USE_MOCK` flag in `config/dataSource.ts` must be the only change needed to switch between mock and real backend.
## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["2.1", "2.2", "2.3", "2.4", "2.5"] },
    { "id": 1, "tasks": ["3", "4", "5.1"] },
    { "id": 2, "tasks": ["5.2", "6", "7.1", "7.2", "7.3", "8.1", "8.2", "8.3"] },
    { "id": 3, "tasks": ["9", "11.1", "11.2", "11.3", "11.4", "27.1"] },
    { "id": 4, "tasks": ["12.1", "12.2", "12.3", "27.2", "27.3", "27.4", "27.5", "27.6"] },
    { "id": 5, "tasks": ["13", "16", "17", "18", "19", "20", "21", "22", "23", "28.1", "28.2"] },
    { "id": 6, "tasks": ["14", "15"] },
    { "id": 7, "tasks": ["24"] },
    { "id": 8, "tasks": ["25"] },
    { "id": 9, "tasks": ["29.1", "29.2", "29.3", "29.4", "30.1", "31.1"] },
    { "id": 10, "tasks": ["32.1", "32.2"] }
  ]
}
```
