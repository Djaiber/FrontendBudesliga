# State Management - Zustand Stores

This document provides detailed API reference for all Zustand stores in the application.

## Table of Contents

- [Overview](#overview)
- [authStore](#authstore)
- [languageStore](#languagestore)
- [betStore](#betstore)
- [marketStore](#marketstore)
- [matchStore](#matchstore)

---

## Overview

The application uses **Zustand 5.0.3** for state management. Zustand provides:

- **Minimal boilerplate**: No providers, actions, or reducers
- **TypeScript-first**: Full type inference
- **Devtools support**: Redux DevTools integration
- **Selective subscriptions**: Components re-render only when subscribed state changes

### Store Pattern

All stores follow this pattern:

```typescript
import { create } from 'zustand';

interface State {
  // State properties
}

interface Actions {
  // Action methods
}

export const useStore = create<State & Actions>((set) => ({
  // Initial state
  property: initialValue,
  
  // Actions
  action: (param) => set((state) => ({ /* new state */ })),
}));
```

### Usage in Components

```typescript
// Subscribe to entire store
const { property, action } = useStore();

// Subscribe to specific properties (optimized)
const property = useStore((state) => state.property);

// Call actions
const action = useStore((state) => state.action);
```

---

## authStore

**Location**: `src/live-predict/store/authStore.ts`

Manages user authentication state and AWS Cognito integration.

### State

```typescript
interface AuthState {
  user: AuthUser | null;           // Current authenticated user
  isAuthenticated: boolean;        // Authentication status
  isLoading: boolean;              // Loading state for async operations
  error: string | null;            // Error message (or translation key)
}

interface AuthUser {
  username: string;                // Cognito username
  email: string;                   // User email
}
```

### Actions

#### `login(email: string, password: string): Promise<void>`

Signs in a user with email and password.

```typescript
const { login } = useAuthStore();

try {
  await login('user@example.com', 'password123');
  // User is now authenticated
} catch (error) {
  // Error is stored in authStore.error
}
```

**Side effects**:
- Calls `signIn()` from AWS Amplify
- Calls `getCurrentUser()` to fetch user data
- Sets `isAuthenticated = true` on success
- Sets `error` on failure

---

#### `logout(): Promise<void>`

Signs out the current user.

```typescript
const { logout } = useAuthStore();

await logout();
// User is now signed out
```

**Side effects**:
- Calls `signOut()` from AWS Amplify
- Clears `user` and sets `isAuthenticated = false`

---

#### `register(email: string, password: string, name: string): Promise<void>`

Registers a new user account.

```typescript
const { register } = useAuthStore();

try {
  await register('user@example.com', 'password123', 'John Doe');
  // User registered, verification code sent to email
} catch (error) {
  // Error is stored in authStore.error
}
```

**Side effects**:
- Calls `signUp()` from AWS Amplify with user attributes
- Cognito sends 6-digit verification code to email
- Does NOT authenticate user (requires email verification)

---

#### `confirmSignUp(email: string, code: string): Promise<void>`

Confirms user email with verification code (without auto-login).

```typescript
const { confirmSignUp } = useAuthStore();

try {
  await confirmSignUp('user@example.com', '123456');
  // Email verified, user can now log in
} catch (error) {
  // Error is stored in authStore.error
}
```

**Side effects**:
- Calls `confirmSignUp()` from AWS Amplify
- Does NOT authenticate user (use `confirmAndLogin` for auto-login)

---

#### `confirmAndLogin(email: string, code: string, password: string): Promise<void>`

Confirms user email and automatically signs in (recommended flow).

```typescript
const { confirmAndLogin } = useAuthStore();

try {
  await confirmAndLogin('user@example.com', '123456', 'password123');
  // Email verified AND user is now authenticated
} catch (error) {
  // Error is stored in authStore.error
}
```

**Side effects**:
- Calls `confirmSignUp()` to verify email
- Calls `signIn()` to authenticate user
- Calls `getCurrentUser()` to fetch user data
- Sets `isAuthenticated = true` on success

---

#### `checkSession(): Promise<void>`

Restores user session on app load.

```typescript
const { checkSession } = useAuthStore();

useEffect(() => {
  checkSession();
}, []);
```

**Side effects**:
- Calls `getCurrentUser()` and `fetchAuthSession()` from AWS Amplify
- If valid tokens exist, sets `isAuthenticated = true`
- If no valid session, sets `isAuthenticated = false` (not an error)

---

#### `clearError(): void`

Clears the current error message.

```typescript
const { clearError } = useAuthStore();

clearError();
```

---

### Usage Example

```typescript
import { useAuthStore } from '@/store/authStore';

function LoginPage() {
  const { login, isLoading, error, clearError } = useAuthStore();
  
  const handleSubmit = async (email: string, password: string) => {
    clearError();
    await login(email, password);
  };
  
  return (
    <form onSubmit={handleSubmit}>
      {error && <div className="error">{error}</div>}
      <button disabled={isLoading}>
        {isLoading ? 'Signing in...' : 'Sign In'}
      </button>
    </form>
  );
}
```

---

## languageStore

**Location**: `src/live-predict/store/languageStore.ts`

Manages UI language selection (English/German).

### State

```typescript
type Locale = 'en' | 'de';

interface LanguageState {
  locale: Locale;                  // Current language
}
```

### Actions

#### `setLocale(locale: Locale): void`

Changes the UI language.

```typescript
const { setLocale } = useLanguageStore();

setLocale('en'); // Switch to English
setLocale('de'); // Switch to German
```

**Side effects**:
- Persists locale to `localStorage` under key `'bl-locale'`
- Triggers re-render of all components using `useTranslation()`

---

### Persistence

The selected language is persisted in `localStorage`:

```typescript
// Read on app load
const stored = localStorage.getItem('bl-locale'); // 'en' | 'de'

// Write on change
localStorage.setItem('bl-locale', 'en');
```

**Default**: `'de'` (German)

---

### Usage Example

```typescript
import { useLanguageStore } from '@/store/languageStore';

function LanguageSwitcher() {
  const { locale, setLocale } = useLanguageStore();
  
  return (
    <div>
      <button
        onClick={() => setLocale('de')}
        className={locale === 'de' ? 'active' : ''}
      >
        DE
      </button>
      <button
        onClick={() => setLocale('en')}
        className={locale === 'en' ? 'active' : ''}
      >
        EN
      </button>
    </div>
  );
}
```

---

## betStore

**Location**: `src/live-predict/store/betStore.ts`

Manages user bets and profit/loss calculation.

### State

```typescript
interface BetState {
  bets: Bet[];                     // All bets placed in session
  sessionPnL: number;              // Net profit/loss (€)
}

interface Bet {
  id: string;                      // Unique bet ID
  matchId: string;                 // Match ID
  marketId: string;                // Market ID
  outcomeId: string;               // Selected outcome ID
  outcomeName: string;             // Outcome display name
  odds: number;                    // Odds at time of bet
  stake: number;                   // Bet amount (€)
  potentialReturn: number;         // stake × odds
  actualReturn: number;            // 0 (lost) or potentialReturn (won)
  status: 'ausstehend' | 'gewonnen' | 'verloren';
  timestamp: number;               // Unix timestamp (ms)
}
```

### Actions

#### `addBet(bet: Bet): void`

Adds a new bet to the store.

```typescript
const { addBet } = useBetStore();

addBet({
  id: 'bet-123',
  matchId: 'match-1',
  marketId: 'market-1',
  outcomeId: 'outcome-1',
  outcomeName: 'Bayern gewinnt',
  odds: 1.85,
  stake: 10,
  potentialReturn: 18.50,
  actualReturn: 0,
  status: 'ausstehend',
  timestamp: Date.now(),
});
```

**Side effects**:
- Recalculates `sessionPnL`

---

#### `settleBet(betId: string, won: boolean): void`

Settles a bet as won or lost.

```typescript
const { settleBet } = useBetStore();

settleBet('bet-123', true);  // Mark as won
settleBet('bet-456', false); // Mark as lost
```

**Side effects**:
- Updates bet `status` to `'gewonnen'` or `'verloren'`
- Sets `actualReturn` to `potentialReturn` (won) or `0` (lost)
- Recalculates `sessionPnL`

---

#### `clearSession(): void`

Clears all bets and resets P&L.

```typescript
const { clearSession } = useBetStore();

clearSession();
// bets = [], sessionPnL = 0
```

---

### Selectors

#### `sessionPnL(state: BetState): number`

Calculates net profit/loss from all settled bets.

```typescript
import { useBetStore, sessionPnL } from '@/store/betStore';

const pnl = useBetStore(sessionPnL);
// Returns: sum of (actualReturn - stake) for all bets
```

**Formula**:
```
P&L = Σ (actualReturn - stake)
```

- Pending bets: `actualReturn = 0`, stake not counted
- Won bets: `actualReturn = potentialReturn`
- Lost bets: `actualReturn = 0`

---

### Usage Example

```typescript
import { useBetStore } from '@/store/betStore';

function BetSlip({ market, outcome }: Props) {
  const { addBet } = useBetStore();
  const [stake, setStake] = useState(10);
  
  const handleConfirm = () => {
    addBet({
      id: `bet-${Date.now()}`,
      matchId: market.matchId,
      marketId: market.id,
      outcomeId: outcome.id,
      outcomeName: outcome.name,
      odds: outcome.odds,
      stake,
      potentialReturn: stake * outcome.odds,
      actualReturn: 0,
      status: 'ausstehend',
      timestamp: Date.now(),
    });
  };
  
  return (
    <div>
      <input
        type="number"
        value={stake}
        onChange={(e) => setStake(Number(e.target.value))}
      />
      <button onClick={handleConfirm}>Confirm Bet</button>
    </div>
  );
}
```

---

## marketStore

**Location**: `src/live-predict/store/marketStore.ts`

Manages live betting markets and filtering.

### State

```typescript
interface MarketState {
  openMarkets: MiniMarket[];       // Active markets
  settledMarkets: MiniMarket[];    // Expired/settled markets
  activeFilter: MiniMarket['category'] | 'Alle';
}

interface MiniMarket {
  id: string;                      // Unique market ID
  matchId: string;                 // Parent match ID
  category: 'Tor' | 'Torschuss' | 'Ecke' | 'Freistoß' | 'Sprint';
  question: string;                // Market question
  outcomes: Outcome[];             // Betting outcomes
  ttlSeconds: number;              // Time to live (seconds)
  status: 'open' | 'settled';
  winningOutcomeId?: string;       // Set when settled
}

interface Outcome {
  id: string;                      // Unique outcome ID
  name: string;                    // Display name
  odds: number;                    // Current odds
}
```

### Actions

#### `addMarket(market: MiniMarket): void`

Adds a new market to the open markets list.

```typescript
const { addMarket } = useMarketStore();

addMarket({
  id: 'market-123',
  matchId: 'match-1',
  category: 'Tor',
  question: 'Wer schießt das nächste Tor?',
  outcomes: [
    { id: 'out-1', name: 'Bayern', odds: 1.85 },
    { id: 'out-2', name: 'Dortmund', odds: 2.10 },
  ],
  ttlSeconds: 30,
  status: 'open',
});
```

**Side effects**:
- Prepends market to `openMarkets` (newest first)

---

#### `updateMarket(id: string, patch: Partial<MiniMarket>): void`

Updates an existing market (e.g., odds change, TTL decrement).

```typescript
const { updateMarket } = useMarketStore();

updateMarket('market-123', {
  outcomes: [
    { id: 'out-1', name: 'Bayern', odds: 1.75 }, // Odds changed
    { id: 'out-2', name: 'Dortmund', odds: 2.20 },
  ],
});
```

---

#### `settleMarket(id: string, winningOutcomeId: string): void`

Settles a market with a winning outcome.

```typescript
const { settleMarket } = useMarketStore();

settleMarket('market-123', 'out-1'); // Bayern won
```

**Side effects**:
- Moves market from `openMarkets` to `settledMarkets`
- Sets `status = 'settled'` and `winningOutcomeId`

---

#### `setFilter(filter: MarketState['activeFilter']): void`

Changes the active category filter.

```typescript
const { setFilter } = useMarketStore();

setFilter('Tor');      // Show only goal markets
setFilter('Alle');     // Show all markets
```

---

#### `tickTTL(): void`

Decrements `ttlSeconds` for all open markets (called every second).

```typescript
const { tickTTL } = useMarketStore();

// In useMatchStream hook:
useEffect(() => {
  const interval = setInterval(() => {
    tickTTL();
  }, 1000);
  return () => clearInterval(interval);
}, []);
```

**Side effects**:
- Decrements `ttlSeconds` by 1 for all open markets
- Markets with `ttlSeconds = 0` should be settled or removed

---

### Selectors

#### `filteredMarkets(state: MarketState): MiniMarket[]`

Returns markets matching the active filter.

```typescript
import { useMarketStore, filteredMarkets } from '@/store/marketStore';

const markets = useMarketStore(filteredMarkets);
// Returns: openMarkets filtered by activeFilter
```

---

#### `marketCountByCategory(state: MarketState): Record<string, number>`

Returns count of open markets per category.

```typescript
import { useMarketStore, marketCountByCategory } from '@/store/marketStore';

const counts = useMarketStore(marketCountByCategory);
// Returns: { 'Tor': 3, 'Torschuss': 5, 'Ecke': 2, ... }
```

---

### Usage Example

```typescript
import { useMarketStore, filteredMarkets } from '@/store/marketStore';

function MarketsFeed() {
  const markets = useMarketStore(filteredMarkets);
  const { setFilter } = useMarketStore();
  
  return (
    <div>
      <button onClick={() => setFilter('Alle')}>All</button>
      <button onClick={() => setFilter('Tor')}>Goals</button>
      
      {markets.map((market) => (
        <MarketCard key={market.id} market={market} />
      ))}
    </div>
  );
}
```

---

## matchStore

**Location**: `src/live-predict/store/matchStore.ts`

Manages match data, live events, and real-time metrics.

### State

```typescript
interface MatchState {
  matches: Match[];                // All matches
  currentMatch: Match | null;      // Currently viewed match
  events: KPIEvent[];              // KPI events (goals, shots, etc.)
  metrics: MatchMetrics;           // Live metrics
  connectionStatus: 'connecting' | 'connected' | 'error' | 'disconnected';
  connectionError: string | null;
}

interface Match {
  id: string;
  homeTeam: string;
  awayTeam: string;
  homeScore: number;
  awayScore: number;
  status: 'scheduled' | 'live' | 'finished';
  kickoffTime: string;             // ISO 8601
  minute?: number;                 // Match minute (live only)
}

interface KPIEvent {
  id: string;
  matchId: string;
  type: 'goal' | 'shot' | 'corner' | 'freeKick' | 'sprint';
  teamSide: 'home' | 'away';
  playerName: string;
  minute: number;
  timestamp: number;               // Unix timestamp (ms)
  xG?: number;                     // Expected goals (for shots/goals)
}

interface MatchMetrics {
  home: TeamMetrics;
  away: TeamMetrics;
  sprintCount: number;             // Players currently sprinting
}

interface TeamMetrics {
  possession: number;              // 0-100
  xG: number;                      // Accumulated expected goals
  shots: number;                   // Total shots
}
```

### Actions

#### `setMatches(matches: Match[]): void`

Sets the list of all matches.

```typescript
const { setMatches } = useMatchStore();

setMatches([
  { id: '1', homeTeam: 'Bayern', awayTeam: 'Dortmund', ... },
  { id: '2', homeTeam: 'Leipzig', awayTeam: 'Leverkusen', ... },
]);
```

---

#### `setCurrentMatch(match: Match): void`

Sets the currently viewed match.

```typescript
const { setCurrentMatch } = useMatchStore();

setCurrentMatch(match);
```

---

#### `applyGoal(teamSide: 'home' | 'away'): void`

Increments the score for a team.

```typescript
const { applyGoal } = useMatchStore();

applyGoal('home'); // Home team scores
applyGoal('away'); // Away team scores
```

**Side effects**:
- Increments `currentMatch.homeScore` or `currentMatch.awayScore`

---

#### `addEvent(event: KPIEvent): void`

Adds a KPI event to the events list.

```typescript
const { addEvent } = useMatchStore();

addEvent({
  id: 'event-123',
  matchId: 'match-1',
  type: 'goal',
  teamSide: 'home',
  playerName: 'Müller',
  minute: 23,
  timestamp: Date.now(),
  xG: 0.85,
});
```

---

#### `setConnectionStatus(status, error?): void`

Updates the WebSocket connection status.

```typescript
const { setConnectionStatus } = useMatchStore();

setConnectionStatus('connecting');
setConnectionStatus('connected');
setConnectionStatus('error', 'Connection failed');
setConnectionStatus('disconnected');
```

---

#### `setPossession(homePct: number, awayPct: number): void`

Updates possession percentages.

```typescript
const { setPossession } = useMatchStore();

setPossession(65, 35); // Home 65%, Away 35%
```

---

#### `addXG(teamSide: 'home' | 'away', xg: number): void`

Accumulates expected goals for a team.

```typescript
const { addXG } = useMatchStore();

addXG('home', 0.25); // Add 0.25 xG to home team
```

---

#### `addShot(teamSide: 'home' | 'away'): void`

Increments shot count for a team.

```typescript
const { addShot } = useMatchStore();

addShot('away'); // Away team takes a shot
```

---

#### `setSprintCount(count: number): void`

Updates the number of players currently sprinting.

```typescript
const { setSprintCount } = useMatchStore();

setSprintCount(3); // 3 players sprinting
```

---

### Usage Example

```typescript
import { useMatchStore } from '@/store/matchStore';

function MatchDetailPage() {
  const { currentMatch, events, metrics } = useMatchStore();
  
  if (!currentMatch) return <div>Loading...</div>;
  
  return (
    <div>
      <h1>{currentMatch.homeTeam} vs {currentMatch.awayTeam}</h1>
      <div>{currentMatch.homeScore} - {currentMatch.awayScore}</div>
      
      <div>
        <div>Possession: {metrics.home.possession}% - {metrics.away.possession}%</div>
        <div>xG: {metrics.home.xG.toFixed(2)} - {metrics.away.xG.toFixed(2)}</div>
        <div>Shots: {metrics.home.shots} - {metrics.away.shots}</div>
      </div>
      
      <ul>
        {events.map((event) => (
          <li key={event.id}>
            {event.minute}' - {event.type} - {event.playerName}
          </li>
        ))}
      </ul>
    </div>
  );
}
```

---

## Best Practices

### 1. Selective Subscriptions

Subscribe only to the state you need:

```typescript
// ❌ Bad: Re-renders on any authStore change
const { user, isAuthenticated, isLoading, error } = useAuthStore();

// ✅ Good: Re-renders only when isAuthenticated changes
const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
```

### 2. Action Extraction

Extract actions outside the render cycle:

```typescript
// ❌ Bad: Creates new reference on every render
const { login } = useAuthStore();

// ✅ Good: Stable reference
const login = useAuthStore((state) => state.login);
```

### 3. Derived State

Use selectors for derived state:

```typescript
// ✅ Good: Memoized selector
export const sessionPnL = (state: BetState): number =>
  state.bets.reduce((sum, b) => sum + b.actualReturn - b.stake, 0);

const pnl = useBetStore(sessionPnL);
```

### 4. Async Actions

Handle async actions with try/catch:

```typescript
const { login, error } = useAuthStore();

const handleLogin = async () => {
  try {
    await login(email, password);
    navigate('/live-predict');
  } catch (err) {
    // Error is already in authStore.error
    console.error('Login failed:', error);
  }
};
```

### 5. Store Composition

Keep stores independent and focused:

```typescript
// ❌ Bad: authStore depends on betStore
const { clearBets } = useBetStore();
authStore.logout = async () => {
  await signOut();
  clearBets(); // Cross-store dependency
};

// ✅ Good: Component orchestrates
const { logout } = useAuthStore();
const { clearSession } = useBetStore();

const handleLogout = async () => {
  await logout();
  clearSession();
};
```

---

## Next Steps

- [ARCHITECTURE.md](./ARCHITECTURE.md) - System architecture overview
- [COMPONENTS.md](./COMPONENTS.md) - Component API reference
- [TESTING.md](./TESTING.md) - Testing stores with Vitest
