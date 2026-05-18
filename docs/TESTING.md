# Testing

Complete testing guide for the Bundesliga Live Predict application.

## Table of Contents

- [Testing Stack](#testing-stack)
- [Test Setup](#test-setup)
- [Running Tests](#running-tests)
- [Test Structure](#test-structure)
- [Unit Testing](#unit-testing)
- [Integration Testing](#integration-testing)
- [Property-Based Testing](#property-based-testing)
- [Testing Patterns](#testing-patterns)
- [Coverage](#coverage)
- [Best Practices](#best-practices)

---

## Testing Stack

| Tool | Version | Purpose |
|------|---------|---------|
| Vitest | 4.1.6 | Test runner and framework |
| Testing Library | 16.1.0 | React component testing |
| @testing-library/jest-dom | 6.6.3 | DOM matchers |
| @testing-library/user-event | 14.5.2 | User interaction simulation |
| fast-check | 3.23.2 | Property-based testing |
| jsdom | 25.0.1 | DOM environment for tests |
| @vitest/coverage-v8 | 4.1.6 | Code coverage reporting |

---

## Test Setup

### Configuration

**Vitest Config**: `vitest.config.ts`

```typescript
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src/live-predict'),
    },
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/live-predict/test/setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      thresholds: {
        lines: 70,
        functions: 70,
        branches: 70,
        statements: 70,
      },
      include: ['src/live-predict/**/*.{ts,tsx}'],
      exclude: [
        'src/live-predict/test/**',
        'src/live-predict/types/**',
        'src/live-predict/**/*.d.ts',
      ],
    },
  },
});
```

### Setup File

**Location**: `src/live-predict/test/setup.ts`

```typescript
import '@testing-library/jest-dom';
```

This imports custom matchers like `toBeInTheDocument()`, `toHaveAttribute()`, etc.

---

## Running Tests

### Commands

```bash
# Run all tests once
npm test

# Run tests in watch mode (re-runs on file changes)
npm run test:watch

# Run tests with coverage report
npm run test:coverage

# Type checking only (no tests)
npm run typecheck
```

### Watch Mode

Watch mode is ideal for development:

```bash
npm run test:watch
```

**Features**:
- Re-runs tests when files change
- Interactive CLI for filtering tests
- Fast feedback loop

### Coverage Report

Generate a coverage report:

```bash
npm run test:coverage
```

**Output**:
- Terminal summary (text)
- HTML report in `coverage/` folder
- JSON report for CI/CD

**Coverage Thresholds**:
- Lines: 70%
- Functions: 70%
- Branches: 70%
- Statements: 70%

---

## Test Structure

### File Naming

Tests are co-located with source files:

```
src/live-predict/
├── components/
│   └── sections/
│       └── BetSlip/
│           ├── BetSlip.tsx
│           ├── BetSlip.module.css
│           └── BetSlip.test.tsx        # Component test
├── parsers/
│   ├── eventParser.ts
│   ├── eventParser.property.test.ts    # Property-based test
│   ├── marketParser.ts
│   └── marketParser.property.test.ts   # Property-based test
└── test/
    ├── setup.ts                         # Test setup
    └── arbitraries.ts                   # fast-check arbitraries
```

### Test File Patterns

- **Component tests**: `ComponentName.test.tsx`
- **Property-based tests**: `moduleName.property.test.ts`
- **Integration tests**: `featureName.integration.test.ts`

---

## Unit Testing

### Component Testing

Test individual components in isolation.

**Example**: `BetSlip.test.tsx`

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BetSlip } from './BetSlip';
import { useBetStore } from '@/store/betStore';

describe('BetSlip', () => {
  beforeEach(() => {
    // Reset store state before each test
    useBetStore.setState({ bets: [], sessionPnL: 0 });
  });

  it('renders the market question as the dialog title', () => {
    render(<BetSlip market={mockMarket} selectedOutcome={mockOutcome} onClose={vi.fn()} />);
    expect(screen.getByRole('heading', { name: mockMarket.question })).toBeInTheDocument();
  });

  it('updates payout in real time as the user types', async () => {
    const user = userEvent.setup();
    render(<BetSlip market={mockMarket} selectedOutcome={mockOutcome} onClose={vi.fn()} />);
    
    const input = screen.getByRole('spinbutton');
    await user.clear(input);
    await user.type(input, '100');

    // 100 × 2.5 = 250.00
    expect(screen.getByText('250.00')).toBeInTheDocument();
  });

  it('calls onClose when cancel is clicked', async () => {
    const onClose = vi.fn();
    render(<BetSlip market={mockMarket} selectedOutcome={mockOutcome} onClose={onClose} />);
    
    const cancelBtn = screen.getByRole('button', { name: /Abbrechen/i });
    await userEvent.click(cancelBtn);

    expect(onClose).toHaveBeenCalled();
  });
});
```

### Store Testing

Test Zustand stores directly.

**Example**: `authStore.test.ts`

```typescript
import { describe, it, expect, beforeEach } from 'vitest';
import { useAuthStore } from './authStore';

describe('authStore', () => {
  beforeEach(() => {
    // Reset store to initial state
    useAuthStore.setState({
      user: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,
    });
  });

  it('sets isLoading to true when login is called', async () => {
    const { login } = useAuthStore.getState();
    
    const loginPromise = login('user@example.com', 'password123');
    
    expect(useAuthStore.getState().isLoading).toBe(true);
    
    await loginPromise.catch(() => {}); // Ignore error
  });

  it('sets user and isAuthenticated on successful login', async () => {
    // Mock Amplify signIn
    vi.mock('aws-amplify/auth', () => ({
      signIn: vi.fn().mockResolvedValue({}),
      getCurrentUser: vi.fn().mockResolvedValue({ username: 'user@example.com' }),
    }));

    const { login } = useAuthStore.getState();
    await login('user@example.com', 'password123');

    const state = useAuthStore.getState();
    expect(state.isAuthenticated).toBe(true);
    expect(state.user).toEqual({ username: 'user@example.com', email: 'user@example.com' });
  });
});
```

### Parser Testing

Test data parsers with valid and invalid inputs.

**Example**: `eventParser.test.ts`

```typescript
import { describe, it, expect } from 'vitest';
import { parseKPIEvent } from './eventParser';

describe('parseKPIEvent', () => {
  it('parses a valid KPIEvent', () => {
    const raw = {
      id: 'event-1',
      matchId: 'match-1',
      type: 'goal',
      minute: 23,
      teamSide: 'home',
      playerId: 'player-1',
      xG: 0.85,
    };

    const result = parseKPIEvent(raw);

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value).toEqual(raw);
    }
  });

  it('returns error for missing required field', () => {
    const raw = {
      id: 'event-1',
      matchId: 'match-1',
      // Missing 'type'
      minute: 23,
      teamSide: 'home',
    };

    const result = parseKPIEvent(raw);

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toContain('type');
    }
  });

  it('returns error for invalid minute value', () => {
    const raw = {
      id: 'event-1',
      matchId: 'match-1',
      type: 'goal',
      minute: 150, // Invalid: > 120
      teamSide: 'home',
    };

    const result = parseKPIEvent(raw);

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toContain('minute');
    }
  });
});
```

---

## Integration Testing

Test multiple components and stores working together.

**Example**: `MatchDetailPage.integration.test.tsx`

```typescript
import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import MatchDetailPage from './MatchDetailPage';
import { useMatchStore } from '@/store/matchStore';
import { useMarketStore } from '@/store/marketStore';

describe('MatchDetailPage Integration', () => {
  beforeEach(() => {
    // Reset stores
    useMatchStore.setState({
      matches: [],
      currentMatch: null,
      events: [],
      metrics: { home: { possession: 50, xG: 0, shots: 0 }, away: { possession: 50, xG: 0, shots: 0 }, sprintCount: 0 },
      connectionStatus: 'disconnected',
      connectionError: null,
    });
    useMarketStore.setState({
      openMarkets: [],
      settledMarkets: [],
      activeFilter: 'Alle',
    });
  });

  it('fetches match data on mount and displays scoreboard', async () => {
    const mockMatch = {
      id: 'match-1',
      homeTeam: { id: '1', name: 'Bayern München', shortName: 'FCB', logoUrl: '' },
      awayTeam: { id: '2', name: 'Borussia Dortmund', shortName: 'BVB', logoUrl: '' },
      homeScore: 2,
      awayScore: 1,
      minute: 45,
      status: 'live' as const,
      openMarketCount: 3,
    };

    // Mock API client
    vi.mock('@/config/dataSource', () => ({
      createApiClient: () => ({
        getMatch: vi.fn().mockResolvedValue(mockMatch),
      }),
    }));

    render(
      <MemoryRouter initialEntries={['/live-predict/match-1']}>
        <Routes>
          <Route path="/live-predict/:matchId" element={<MatchDetailPage />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Bayern München')).toBeInTheDocument();
      expect(screen.getByText('Borussia Dortmund')).toBeInTheDocument();
      expect(screen.getByText('2')).toBeInTheDocument();
      expect(screen.getByText('1')).toBeInTheDocument();
    });
  });

  it('displays connection error banner when stream fails', async () => {
    // Mock useMatchStream to return error status
    vi.mock('@/hooks/useMatchStream', () => ({
      useMatchStream: () => ({
        connectionStatus: 'error',
        connectionError: 'Connection failed',
      }),
    }));

    render(
      <MemoryRouter initialEntries={['/live-predict/match-1']}>
        <Routes>
          <Route path="/live-predict/:matchId" element={<MatchDetailPage />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByRole('alert')).toBeInTheDocument();
      expect(screen.getByText(/Verbindung unterbrochen/i)).toBeInTheDocument();
    });
  });
});
```

---

## Property-Based Testing

Use **fast-check** to test properties that should hold for all inputs.

### What is Property-Based Testing?

Instead of testing specific examples, you define **properties** (invariants) that should hold for **all** inputs.

**Example Property**: "Parsing a serialized object should return the original object"

### Arbitraries

Define generators for random test data.

**Location**: `src/live-predict/test/arbitraries.ts`

```typescript
import * as fc from 'fast-check';
import type { KPIEvent, KPIEventType } from '@/types/event';

const arbKPIEventType: fc.Arbitrary<KPIEventType> = fc.constantFrom(
  'goal',
  'shot',
  'corner',
  'foul',
  'sprint'
);

export const arbKPIEvent: fc.Arbitrary<KPIEvent> = fc.record({
  id: fc.string({ minLength: 1 }),
  matchId: fc.string({ minLength: 1 }),
  type: arbKPIEventType,
  minute: fc.integer({ min: 0, max: 120 }),
  teamSide: fc.constantFrom('home', 'away'),
  playerId: fc.option(fc.string({ minLength: 1 }), { nil: undefined }),
  xG: fc.option(fc.double({ min: 0, max: 1 }), { nil: undefined }),
  xP: fc.option(fc.double({ min: 0, max: 1 }), { nil: undefined }),
  detail: fc.option(fc.string(), { nil: undefined }),
});
```

### Property Tests

**Example**: `eventParser.property.test.ts`

```typescript
import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { parseKPIEvent, prettyPrintKPIEvent } from './eventParser';
import { arbKPIEvent } from '../test/arbitraries';

describe('KPIEvent Parser Round-Trip Property Tests', () => {
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
      { numRuns: 100 } // Run 100 random test cases
    );
  });
});
```

**Benefits**:
- Tests 100 random inputs automatically
- Finds edge cases you wouldn't think of
- Validates invariants (properties that should always hold)

---

## Testing Patterns

### 1. Arrange-Act-Assert (AAA)

Structure tests in three phases:

```typescript
it('updates payout when amount changes', async () => {
  // Arrange: Set up test data and render component
  const user = userEvent.setup();
  render(<BetSlip market={mockMarket} selectedOutcome={mockOutcome} onClose={vi.fn()} />);
  const input = screen.getByRole('spinbutton');

  // Act: Perform user action
  await user.clear(input);
  await user.type(input, '100');

  // Assert: Verify expected outcome
  expect(screen.getByText('250.00')).toBeInTheDocument();
});
```

### 2. Test Isolation

Each test should be independent and not rely on other tests.

```typescript
describe('BetSlip', () => {
  beforeEach(() => {
    // Reset state before each test
    useBetStore.setState({ bets: [], sessionPnL: 0 });
  });

  it('test 1', () => {
    // This test starts with clean state
  });

  it('test 2', () => {
    // This test also starts with clean state
  });
});
```

### 3. Mock External Dependencies

Mock API calls, timers, and external libraries.

```typescript
import { vi } from 'vitest';
import * as dataSource from '@/config/dataSource';

it('calls placeBet API on confirm', async () => {
  const mockPlaceBet = vi.fn().mockResolvedValue(mockBet);
  
  vi.spyOn(dataSource, 'createApiClient').mockReturnValue({
    getLiveMatches: vi.fn(),
    getMatch: vi.fn(),
    placeBet: mockPlaceBet,
  });

  render(<BetSlip market={mockMarket} selectedOutcome={mockOutcome} onClose={vi.fn()} />);
  
  const confirmBtn = screen.getByRole('button', { name: /Wette bestätigen/i });
  await userEvent.click(confirmBtn);

  expect(mockPlaceBet).toHaveBeenCalledWith({
    marketId: mockMarket.id,
    outcomeId: mockOutcome.id,
    stake: 10,
    // ...
  });
});
```

### 4. User-Centric Queries

Use queries that reflect how users interact with the UI.

```typescript
// ✅ Good: Query by role and accessible name
screen.getByRole('button', { name: /Wette bestätigen/i })

// ✅ Good: Query by label text
screen.getByLabelText('Einsatz')

// ❌ Bad: Query by test ID (last resort)
screen.getByTestId('confirm-button')

// ❌ Bad: Query by class name
screen.getByClassName('btn-primary')
```

### 5. Async Testing

Use `waitFor` for async operations.

```typescript
it('displays error message on API failure', async () => {
  vi.spyOn(dataSource, 'createApiClient').mockReturnValue({
    placeBet: vi.fn().mockRejectedValue(new Error('Network error')),
  });

  render(<BetSlip market={mockMarket} selectedOutcome={mockOutcome} onClose={vi.fn()} />);
  
  const confirmBtn = screen.getByRole('button', { name: /Wette bestätigen/i });
  await userEvent.click(confirmBtn);

  await waitFor(() => {
    expect(screen.getByRole('alert')).toBeInTheDocument();
  });
});
```

---

## Coverage

### Viewing Coverage

Generate and view coverage report:

```bash
npm run test:coverage
```

Open `coverage/index.html` in a browser to see detailed coverage report.

### Coverage Thresholds

The project enforces minimum coverage thresholds:

```typescript
coverage: {
  thresholds: {
    lines: 70,
    functions: 70,
    branches: 70,
    statements: 70,
  },
}
```

**Build fails if coverage drops below 70%.**

### What to Test

**High Priority** (aim for 80%+ coverage):
- Components with complex logic (BetSlip, MarketsFeed)
- Stores (authStore, betStore, marketStore)
- Parsers (eventParser, marketParser, frameParser)
- Hooks (useMatchStream, useTranslation)

**Medium Priority** (aim for 60%+ coverage):
- Simple components (MatchCard, FilterPill)
- Layout components (LivePredictLayout)
- Page components (MatchListPage, HistoryPage)

**Low Priority** (aim for 40%+ coverage):
- Atoms (LiveDot, LivePill)
- Type definitions (no logic to test)

---

## Best Practices

### 1. Test Behavior, Not Implementation

```typescript
// ✅ Good: Test user-visible behavior
it('shows payout when amount is entered', async () => {
  const user = userEvent.setup();
  render(<BetSlip market={mockMarket} selectedOutcome={mockOutcome} onClose={vi.fn()} />);
  
  const input = screen.getByRole('spinbutton');
  await user.type(input, '100');

  expect(screen.getByText('250.00')).toBeInTheDocument();
});

// ❌ Bad: Test internal state
it('updates amount state when input changes', async () => {
  const { result } = renderHook(() => useState(10));
  const [amount, setAmount] = result.current;
  
  act(() => setAmount(100));
  
  expect(amount).toBe(100); // ❌ Testing implementation detail
});
```

### 2. Use Descriptive Test Names

```typescript
// ✅ Good: Descriptive test name
it('calls onClose(true) when market TTL reaches 0', async () => {
  // ...
});

// ❌ Bad: Vague test name
it('works correctly', () => {
  // ...
});
```

### 3. Keep Tests Simple

```typescript
// ✅ Good: One assertion per test
it('renders the market question', () => {
  render(<BetSlip market={mockMarket} selectedOutcome={mockOutcome} onClose={vi.fn()} />);
  expect(screen.getByText(mockMarket.question)).toBeInTheDocument();
});

it('renders the selected outcome', () => {
  render(<BetSlip market={mockMarket} selectedOutcome={mockOutcome} onClose={vi.fn()} />);
  expect(screen.getByText(mockOutcome.label)).toBeInTheDocument();
});

// ❌ Bad: Multiple unrelated assertions
it('renders correctly', () => {
  render(<BetSlip market={mockMarket} selectedOutcome={mockOutcome} onClose={vi.fn()} />);
  expect(screen.getByText(mockMarket.question)).toBeInTheDocument();
  expect(screen.getByText(mockOutcome.label)).toBeInTheDocument();
  expect(screen.getByRole('spinbutton')).toBeInTheDocument();
  expect(screen.getByRole('button', { name: /Wette bestätigen/i })).toBeInTheDocument();
});
```

### 4. Clean Up After Tests

```typescript
describe('BetSlip', () => {
  beforeEach(() => {
    // Reset state before each test
    useBetStore.setState({ bets: [], sessionPnL: 0 });
  });

  afterEach(() => {
    // Restore mocks after each test
    vi.restoreAllMocks();
  });

  it('test 1', () => {
    // ...
  });
});
```

### 5. Test Edge Cases

```typescript
describe('BetSlip amount validation', () => {
  it('shows "–" when amount is 0 (below minimum)', async () => {
    // ...
  });

  it('shows "–" when amount is 501 (above maximum)', async () => {
    // ...
  });

  it('shows payout for boundary amount 1', async () => {
    // ...
  });

  it('shows payout for boundary amount 500', async () => {
    // ...
  });
});
```

### 6. Use Property-Based Tests for Parsers

```typescript
// ✅ Good: Property-based test for round-trip
it('KPIEvent round-trip: parse(JSON.stringify(prettyPrint(event))) ≅ event', () => {
  fc.assert(
    fc.property(arbKPIEvent, (event) => {
      const printed = prettyPrintKPIEvent(event);
      const jsonString = JSON.stringify(printed);
      const parsed = JSON.parse(jsonString);
      const result = parseKPIEvent(parsed);

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value).toEqual(event);
      }
    }),
    { numRuns: 100 }
  );
});
```

### 7. Test Accessibility

```typescript
it('has role="dialog" and aria-modal="true"', () => {
  render(<BetSlip market={mockMarket} selectedOutcome={mockOutcome} onClose={vi.fn()} />);
  
  const dialog = screen.getByRole('dialog');
  expect(dialog).toBeInTheDocument();
  expect(dialog).toHaveAttribute('aria-modal', 'true');
});

it('dialog is labelled by the market question heading', () => {
  render(<BetSlip market={mockMarket} selectedOutcome={mockOutcome} onClose={vi.fn()} />);
  
  const dialog = screen.getByRole('dialog');
  const labelledById = dialog.getAttribute('aria-labelledby');
  expect(labelledById).toBeTruthy();
  
  const heading = document.getElementById(labelledById!);
  expect(heading?.textContent).toBe(mockMarket.question);
});
```

---

## Troubleshooting

### Test Fails with "Cannot find module"

**Problem**: Import path is incorrect

**Solution**: Use the `@` alias for imports:

```typescript
// ✅ Good
import { useTranslation } from '@/hooks/useTranslation';

// ❌ Bad
import { useTranslation } from '../../../hooks/useTranslation';
```

### Test Fails with "ReferenceError: localStorage is not defined"

**Problem**: jsdom doesn't have localStorage by default

**Solution**: Mock localStorage in test setup:

```typescript
beforeEach(() => {
  Object.defineProperty(window, 'localStorage', {
    value: {
      getItem: vi.fn(),
      setItem: vi.fn(),
      removeItem: vi.fn(),
      clear: vi.fn(),
    },
    writable: true,
  });
});
```

### Test Fails with "act() warning"

**Problem**: State update not wrapped in `act()`

**Solution**: Use `waitFor` for async updates:

```typescript
// ✅ Good
await waitFor(() => {
  expect(screen.getByText('Updated')).toBeInTheDocument();
});

// ❌ Bad
expect(screen.getByText('Updated')).toBeInTheDocument();
```

---

## Next Steps

- [ARCHITECTURE.md](./ARCHITECTURE.md) - System architecture overview
- [COMPONENTS.md](./COMPONENTS.md) - Component API reference
- [STORES.md](./STORES.md) - State management documentation
- [DECISIONS.md](./DECISIONS.md) - Architectural decisions
