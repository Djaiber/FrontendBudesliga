# Components

Complete component API reference for the Bundesliga Live Predict application.

## Table of Contents

- [Component Architecture](#component-architecture)
- [Auth Components](#auth-components)
- [Layout Components](#layout-components)
- [Page Components](#page-components)
- [Atoms](#atoms)
- [Sections](#sections)
- [UI Components](#ui-components)

---

## Component Architecture

The application follows an **Atomic Design** pattern with five component categories:

```
components/
├── auth/          # Authentication guards
├── layout/        # Layout wrappers
├── pages/         # Page-level components
├── atoms/         # Small, reusable UI elements
├── sections/      # Composite sections (multiple atoms)
└── ui/            # Shared UI components
```

### Component Patterns

All components follow these conventions:

1. **TypeScript**: Fully typed props with interfaces
2. **CSS Modules**: Scoped styles (`ComponentName.module.css`)
3. **Accessibility**: ARIA labels, roles, and semantic HTML
4. **Store Integration**: Zustand hooks for state management
5. **i18n**: Translation via `useTranslation()` hook

---

## Auth Components

### RequireAuth

**Location**: `src/live-predict/components/auth/RequireAuth.tsx`

Route guard that protects authenticated routes.

**Props**:
```typescript
interface RequireAuthProps {
  children: React.ReactNode;
}
```

**Behavior**:
1. Calls `authStore.checkSession()` on mount
2. Shows loading spinner while checking session
3. Redirects to `/login` if not authenticated
4. Renders children if authenticated

**Store Reads**:
- `authStore.isAuthenticated`
- `authStore.isLoading`

**Store Writes**:
- `authStore.checkSession()` (on mount)

**Usage**:
```typescript
<RequireAuth>
  <LivePredictLayout />
</RequireAuth>
```

---

## Layout Components

### LivePredictLayout

**Location**: `src/live-predict/components/layout/LivePredictLayout.tsx`

Shell wrapper for all `/live-predict` routes.

**Props**: None

**Features**:
- Renders DEMOMODUS banner at top
- Renders `<Outlet />` for child routes
- Applies consistent padding and spacing

**Store Reads**: None

**Store Writes**: None

**Usage**:
```typescript
{
  path: '/live-predict',
  element: <LivePredictLayout />,
  children: [...]
}
```

---

### AuthLayout

**Location**: `src/live-predict/components/layout/AuthLayout.tsx`

Layout wrapper for authentication pages (login, register, confirm).

**Props**:
```typescript
interface AuthLayoutProps {
  children: React.ReactNode;
}
```

**Features**:
- Centers content vertically and horizontally
- Applies max-width constraint
- Uses existing site styles (no custom CSS)

**Store Reads**: None

**Store Writes**: None

---

## Page Components

### MatchListPage

**Location**: `src/live-predict/components/pages/MatchListPage.tsx`

Landing page showing all live and upcoming matches.

**Props**: None

**Features**:
- Fetches matches via `createApiClient().getLiveMatches()`
- Polls every 5 seconds for updates
- Displays `MatchCard` for each live/upcoming match
- Empty state when no matches available
- Click card to navigate to match detail

**Store Reads**:
- `matchStore.matches`

**Store Writes**:
- `matchStore.setMatches()`

**Side Effects**:
- API call on mount
- 5-second polling interval (cleared on unmount)

**Navigation**:
- Click match card → `/live-predict/:matchId`

---

### MatchDetailPage

**Location**: `src/live-predict/components/pages/MatchDetailPage.tsx`

Real-time match view with live betting.

**Props**: None (reads `matchId` from route params)

**Features**:
- Fetches match metadata via `createApiClient().getMatch(matchId)`
- Connects to live stream via `useMatchStream` hook
- Two-column layout (60% / 40%) that stacks on mobile
- Left column: Scoreboard, MetricsBar, PitchView, Timeline
- Right column: MarketsFeed with FilterPills
- Below columns: MeineWettenPanel (user's bets)
- BetSlip modal for placing bets
- Connection error banner when stream fails

**Store Reads**:
- `matchStore.currentMatch`
- `marketStore.openMarkets`
- `betStore.bets`

**Store Writes**:
- `matchStore.setCurrentMatch()`
- `matchStore.applyGoal()`
- `matchStore.addEvent()`
- `matchStore.addXG()`
- `matchStore.addShot()`
- `matchStore.setSprintCount()`
- `marketStore.addMarket()`
- `marketStore.updateMarket()`
- `marketStore.settleMarket()`
- `betStore.settleBet()`

**Side Effects**:
- API call on mount
- WebSocket connection via `useMatchStream`
- Frame updates written to `frameRef` (no re-render)

**Navigation**:
- Back button → `/live-predict`

---

### HistoryPage

**Location**: `src/live-predict/components/pages/HistoryPage.tsx`

User bet history and statistics.

**Props**: None

**Features**:
- Table of all bets with columns: Date, Match, Market, Outcome, Stake, Odds, Status, Return
- Summary statistics: Total Wagered, Total Won, Net P&L, Hit Rate
- Empty state when no bets placed
- Responsive table (stacks on mobile)

**Store Reads**:
- `betStore.bets`
- `betStore.sessionPnL`

**Store Writes**: None

**Side Effects**: None

---

### LoginPage

**Location**: `src/live-predict/components/pages/LoginPage.tsx`

User login form.

**Props**: None

**Features**:
- Email and password input fields
- Form validation
- Error display from `authStore.error`
- Loading state during authentication
- Link to `/register` for new users
- Uses existing site styles (no custom CSS)

**Store Reads**:
- `authStore.isLoading`
- `authStore.error`

**Store Writes**:
- `authStore.login()`
- `authStore.clearError()`

**Side Effects**:
- Navigates to `/live-predict` on success

---

### RegisterPage

**Location**: `src/live-predict/components/pages/RegisterPage.tsx`

User registration form.

**Props**: None

**Features**:
- Name, email, password, confirm password fields
- Client-side validation (password match, length)
- Error display from `authStore.error`
- Loading state during registration
- Link to `/login` for existing users
- Uses existing site styles (no custom CSS)

**Store Reads**:
- `authStore.isLoading`
- `authStore.error`

**Store Writes**:
- `authStore.register()`
- `authStore.clearError()`

**Side Effects**:
- Navigates to `/confirm-account` on success

---

### ConfirmPage

**Location**: `src/live-predict/components/pages/ConfirmPage.tsx`

Email verification with 6-digit code.

**Props**: None

**Features**:
- Email, password, and verification code inputs
- Calls `authStore.confirmAndLogin()` for auto-login after verification
- Success message display
- Error display from `authStore.error`
- Link to resend code (future enhancement)
- Uses existing site styles (no custom CSS)

**Store Reads**:
- `authStore.isLoading`
- `authStore.error`

**Store Writes**:
- `authStore.confirmAndLogin()`
- `authStore.clearError()`

**Side Effects**:
- Navigates to `/live-predict` on success (auto-login)

---

## Atoms

Small, reusable UI components.

### MatchCard

**Location**: `src/live-predict/components/atoms/MatchCard/MatchCard.tsx`

Displays a summary card for a single match.

**Props**:
```typescript
interface MatchCardProps {
  match: Match;
}
```

**Features**:
- Team logos (via `TeamLogo` component)
- Team names
- Current score
- Match minute
- Open market count badge
- LiveDot when match is live
- Hover effect (scale + shadow)

**Store Reads**: None

**Store Writes**: None

**Usage**:
```typescript
<MatchCard match={match} />
```

---

### MarketCard

**Location**: `src/live-predict/components/atoms/MarketCard/MarketCard.tsx`

Displays a betting market with outcomes.

**Props**:
```typescript
interface MarketCardProps {
  market: MiniMarket;
  onOutcomeClick: (outcome: Outcome) => void;
}
```

**Features**:
- Market question
- TTL countdown (seconds remaining)
- Outcome buttons with odds
- Winning outcome highlighted (settled markets)
- Disabled state when market is settled

**Store Reads**: None

**Store Writes**: None

**Side Effects**:
- Calls `onOutcomeClick` when outcome button is clicked

**Usage**:
```typescript
<MarketCard market={market} onOutcomeClick={handleOutcomeClick} />
```

---

### OutcomeButton

**Location**: `src/live-predict/components/atoms/OutcomeButton/OutcomeButton.tsx`

Button for selecting a betting outcome.

**Props**:
```typescript
interface OutcomeButtonProps {
  outcome: Outcome;
  onClick: () => void;
  disabled?: boolean;
  isWinner?: boolean;
}
```

**Features**:
- Outcome label
- Decimal odds
- Hover effect (scale + glow)
- Disabled state (greyed out)
- Winner state (green highlight)

**Store Reads**: None

**Store Writes**: None

**Usage**:
```typescript
<OutcomeButton
  outcome={outcome}
  onClick={() => handleClick(outcome)}
  disabled={market.status === 'settled'}
  isWinner={outcome.id === market.winningOutcomeId}
/>
```

---

### FilterPill

**Location**: `src/live-predict/components/atoms/FilterPill/FilterPill.tsx`

Filter tab button with count badge.

**Props**:
```typescript
interface FilterPillProps {
  label: string;
  count: number;
  active: boolean;
  onClick: () => void;
}
```

**Features**:
- Label text
- Count badge
- Active state (red underline)
- Hover effect (scale)

**Store Reads**: None

**Store Writes**: None

**Usage**:
```typescript
<FilterPill
  label="Tor"
  count={5}
  active={activeFilter === 'Tor'}
  onClick={() => setFilter('Tor')}
/>
```

---

### LiveDot

**Location**: `src/live-predict/components/atoms/LiveDot/LiveDot.tsx`

Animated red dot indicating live status.

**Props**: None

**Features**:
- Pulsing animation (scale + opacity)
- Red color (`var(--red)`)
- 8px diameter

**Store Reads**: None

**Store Writes**: None

**Usage**:
```typescript
{status === 'live' && <LiveDot />}
```

---

### LivePill

**Location**: `src/live-predict/components/atoms/LivePill/LivePill.tsx`

"LIVE" badge with animated dot.

**Props**: None

**Features**:
- Red background
- White text
- Animated dot
- Uppercase "LIVE" text

**Store Reads**: None

**Store Writes**: None

**Usage**:
```typescript
<LivePill />
```

---

### DemomodusBanner

**Location**: `src/live-predict/components/atoms/DemomodusBanner/DemomodusBanner.tsx`

Banner indicating demo mode (no real stakes).

**Props**: None

**Features**:
- Yellow background
- Black text
- Full-width
- Sticky positioning (optional)
- Translated text via `useTranslation()`

**Store Reads**:
- `languageStore.locale` (via `useTranslation`)

**Store Writes**: None

**Usage**:
```typescript
<DemomodusBanner />
```

---

### NavLivePredictLink

**Location**: `src/live-predict/components/atoms/NavLivePredictLink/NavLivePredictLink.tsx`

Navigation link with "LIVE" pill.

**Props**: None

**Features**:
- Link text ("Live Predict")
- LivePill badge
- Active state styling
- Translated text via `useTranslation()`

**Store Reads**:
- `languageStore.locale` (via `useTranslation`)

**Store Writes**: None

**Usage**:
```typescript
<NavLivePredictLink />
```

---

## Sections

Composite sections combining multiple atoms.

### Scoreboard

**Location**: `src/live-predict/components/sections/Scoreboard/Scoreboard.tsx`

Displays current match score.

**Props**: None

**Features**:
- Team logos (via `TeamLogo` component)
- Team names
- Current score (large Oswald font)
- Match minute with LiveDot
- Loading placeholder when no match

**Store Reads**:
- `matchStore.currentMatch`

**Store Writes**: None

**Usage**:
```typescript
<Scoreboard />
```

---

### MetricsBar

**Location**: `src/live-predict/components/sections/MetricsBar/MetricsBar.tsx`

Displays live match metrics.

**Props**: None

**Features**:
- Possession percentage (horizontal bar)
- xG (expected goals)
- Shots count
- Sprint count
- Responsive layout (stacks on mobile)

**Store Reads**:
- `matchStore.metrics`

**Store Writes**: None

**Usage**:
```typescript
<MetricsBar />
```

---

### PitchView

**Location**: `src/live-predict/components/sections/PitchView/PitchView.tsx`

2D pitch visualization with player positions.

**Props**:
```typescript
interface PitchViewProps {
  frameRef: React.RefObject<Frame | null>;
  ariaLabel: string;
}
```

**Features**:
- Canvas-based rendering (60 FPS via `requestAnimationFrame`)
- Player dots (home: red, away: white)
- Ball position (yellow dot)
- Pitch markings (center circle, penalty boxes)
- Reads from `frameRef` (no re-render on frame update)

**Store Reads**: None (reads from `frameRef`)

**Store Writes**: None

**Side Effects**:
- `requestAnimationFrame` loop (started on mount, stopped on unmount)

**Usage**:
```typescript
const frameRef = useRef<Frame | null>(null);

<PitchView frameRef={frameRef} ariaLabel="Bayern vs Dortmund" />
```

---

### Timeline

**Location**: `src/live-predict/components/sections/Timeline/Timeline.tsx`

Chronological list of match events.

**Props**: None

**Features**:
- Vertical timeline with event cards
- Event icons (goal, shot, corner, etc.)
- Event minute and team side
- Player name
- xG value (for shots/goals)
- Auto-scroll to latest event

**Store Reads**:
- `matchStore.events`

**Store Writes**: None

**Usage**:
```typescript
<Timeline />
```

---

### MarketsFeed

**Location**: `src/live-predict/components/sections/MarketsFeed/MarketsFeed.tsx`

Right-column section on MatchDetailPage.

**Props**:
```typescript
interface MarketsFeedProps {
  onOutcomeClick: (outcome: Outcome) => void;
}
```

**Features**:
- Six FilterPill tabs (Alle, Tor, Torschuss, Ecke, Freistoß, Sprint)
- Live counts per category
- Vertical list of open MarketCard components
- Sorted by `openedAt` descending (newest first)
- TTL countdown (decrements every second)
- Collapsible "Verlaufene Märkte" section for settled markets

**Store Reads**:
- `marketStore.activeFilter`
- `marketStore.openMarkets` (via `filteredMarkets` selector)
- `marketStore.settledMarkets`
- `marketStore.marketCountByCategory` (via selector)

**Store Writes**:
- `marketStore.setFilter()`
- `marketStore.tickTTL()` (every second)

**Side Effects**:
- `setInterval` for TTL countdown (cleared on unmount)
- Calls `onOutcomeClick` when outcome button is clicked

**Usage**:
```typescript
<MarketsFeed onOutcomeClick={handleOutcomeClick} />
```

---

### MeineWettenPanel

**Location**: `src/live-predict/components/sections/MeineWettenPanel/MeineWettenPanel.tsx`

Panel showing user's bets for current match.

**Props**: None

**Features**:
- List of bets with status badges
- Market question and outcome
- Stake and potential return
- Status: pending, won, lost
- Empty state when no bets placed
- Session P&L summary

**Store Reads**:
- `betStore.bets`
- `betStore.sessionPnL`
- `matchStore.currentMatch`

**Store Writes**: None

**Usage**:
```typescript
<MeineWettenPanel />
```

---

### BetSlip

**Location**: `src/live-predict/components/sections/BetSlip/BetSlip.tsx`

Modal for placing a bet.

**Props**:
```typescript
interface BetSlipProps {
  market: MiniMarket;
  selectedOutcome: Outcome;
  onClose: (expired?: boolean) => void;
  triggerRef: React.RefObject<HTMLElement>;
}
```

**Features**:
- Market question and selected outcome
- Stake input (1-500)
- Potential payout calculation
- Confirm and cancel buttons
- TTL countdown (closes when market expires)
- Focus trap (keyboard navigation)
- Returns focus to trigger element on close

**Store Reads**: None

**Store Writes**:
- `betStore.addBet()`

**Side Effects**:
- Calls `onClose(true)` when market expires
- Calls `onClose(false)` when user cancels
- Returns focus to `triggerRef` on close

**Usage**:
```typescript
<BetSlip
  market={market}
  selectedOutcome={outcome}
  onClose={handleClose}
  triggerRef={triggerRef}
/>
```

---

## UI Components

### LanguageSwitcher

**Location**: `src/live-predict/components/ui/LanguageSwitcher.tsx`

Language toggle (EN/DE).

**Props**: None

**Features**:
- Two buttons: "EN" and "DE"
- Active language has red underline
- Inactive language is muted grey
- Persists to localStorage

**Store Reads**:
- `languageStore.locale`

**Store Writes**:
- `languageStore.setLocale()`

**Side Effects**:
- Writes to `localStorage` under key `'bl-locale'`

**Usage**:
```typescript
<LanguageSwitcher />
```

---

## Shared Components

### TeamLogo

**Location**: `src/components/TeamLogo.tsx`

Team logo component (shared across homepage and Live Predict).

**Props**:
```typescript
interface TeamLogoProps {
  team: string;        // Team short name (e.g., "FCB", "BVB")
  size: 'small' | 'medium' | 'large';
}
```

**Features**:
- SVG-based team icons
- Three sizes: small (28px), medium (40px), large (64px)
- Fallback to generic icon for unknown teams
- Supports all Bundesliga teams

**Store Reads**: None

**Store Writes**: None

**Usage**:
```typescript
<TeamLogo team="FCB" size="medium" />
```

---

## Component Testing

All components should be tested with:

1. **Unit tests**: Props, rendering, user interactions
2. **Integration tests**: Store integration, side effects
3. **Accessibility tests**: ARIA labels, keyboard navigation
4. **Visual regression tests**: Storybook snapshots (future)

See [TESTING.md](./TESTING.md) for testing strategies.

---

## Best Practices

### 1. Props Interface

Always define a TypeScript interface for props:

```typescript
// ✅ Good
interface MatchCardProps {
  match: Match;
}

export function MatchCard({ match }: MatchCardProps) {
  // ...
}

// ❌ Bad
export function MatchCard({ match }: { match: Match }) {
  // ...
}
```

### 2. Store Subscriptions

Subscribe only to the state you need:

```typescript
// ✅ Good: Selective subscription
const currentMatch = useMatchStore((state) => state.currentMatch);

// ❌ Bad: Full store subscription
const { currentMatch, matches, events, metrics } = useMatchStore();
```

### 3. Event Handlers

Extract event handlers outside JSX:

```typescript
// ✅ Good
const handleClick = () => {
  navigate(`/live-predict/${match.id}`);
};

return <button onClick={handleClick}>View Match</button>;

// ❌ Bad
return <button onClick={() => navigate(`/live-predict/${match.id}`)}>View Match</button>;
```

### 4. Accessibility

Always include ARIA labels and roles:

```typescript
// ✅ Good
<button
  onClick={handleClick}
  aria-label={`${match.homeTeam} vs ${match.awayTeam}`}
>
  View Match
</button>

// ❌ Bad
<button onClick={handleClick}>View Match</button>
```

### 5. CSS Modules

Use CSS Modules for scoped styles:

```typescript
// ✅ Good
import styles from './MatchCard.module.css';

<div className={styles.card}>...</div>

// ❌ Bad
<div className="match-card">...</div>
```

---

## Next Steps

- [ARCHITECTURE.md](./ARCHITECTURE.md) - System architecture overview
- [STORES.md](./STORES.md) - State management documentation
- [ROUTES.md](./ROUTES.md) - Routing reference
- [TESTING.md](./TESTING.md) - Testing strategies
