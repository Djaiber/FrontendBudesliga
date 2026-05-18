# Routes

Complete routing reference for the Bundesliga Live Predict application.

## Table of Contents

- [Route Table](#route-table)
- [Public Routes](#public-routes)
- [Protected Routes](#protected-routes)
- [Route Guards](#route-guards)
- [Navigation Patterns](#navigation-patterns)
- [Code Splitting](#code-splitting)

---

## Route Table

| Path | Component | Protected | Layout | Description |
|------|-----------|-----------|--------|-------------|
| `/` | Redirect | No | None | Redirects to `/login` |
| `/login` | LoginPage | No | AuthLayout | User login form |
| `/register` | RegisterPage | No | AuthLayout | User registration form |
| `/confirm-account` | ConfirmPage | No | AuthLayout | Email verification with 6-digit code |
| `/live-predict` | MatchListPage | Yes | LivePredictLayout | List of live matches |
| `/live-predict/:matchId` | MatchDetailPage | Yes | LivePredictLayout | Match detail view with live betting |
| `/live-predict/meine-wetten` | HistoryPage | Yes | LivePredictLayout | User bet history |

---

## Public Routes

### `/` - Root Redirect

**Component**: None (loader redirect)  
**Purpose**: Redirects unauthenticated users to login

```typescript
{
  path: '/',
  loader: () => Response.redirect('/login'),
}
```

---

### `/login` - Login Page

**Component**: `LoginPage`  
**Layout**: Uses existing site layout (header, nav, footer)  
**Purpose**: User authentication with email and password

**Features**:
- Email and password input fields
- Form validation
- Error display from `authStore.error`
- Loading state during authentication
- Link to `/register` for new users

**Navigation**:
- On success → `/live-predict`
- "Register" link → `/register`

---

### `/register` - Registration Page

**Component**: `RegisterPage`  
**Layout**: Uses existing site layout  
**Purpose**: New user account creation

**Features**:
- Name, email, password, confirm password fields
- Client-side validation (password match, length)
- Cognito registration via `authStore.register()`
- Error display
- Link to `/login` for existing users

**Navigation**:
- On success → `/confirm-account` (with email pre-filled)
- "Sign in" link → `/login`

---

### `/confirm-account` - Email Verification

**Component**: `ConfirmPage`  
**Layout**: Uses existing site layout  
**Purpose**: Verify email with 6-digit code from Cognito

**Features**:
- Email, password, and verification code inputs
- Calls `authStore.confirmAndLogin()` for auto-login after verification
- Success message display
- Link to resend code (future enhancement)

**Navigation**:
- On success → `/live-predict` (auto-login)
- "Back to login" link → `/login`

---

## Protected Routes

All routes under `/live-predict` require authentication via the `<RequireAuth>` guard.

### `/live-predict` - Match List

**Component**: `MatchListPage`  
**Layout**: `LivePredictLayout` (includes DEMOMODUS banner)  
**Purpose**: Landing page showing all live and upcoming matches

**Features**:
- Fetches matches via `createApiClient().getLiveMatches()`
- Polls every 5 seconds for updates
- Displays `MatchCard` for each live/upcoming match
- Empty state when no matches available
- Click card to navigate to match detail

**Data Flow**:
```
useEffect → createApiClient().getLiveMatches()
         → matchStore.setMatches()
         → Component re-renders with updated matches
```

**Navigation**:
- Click match card → `/live-predict/:matchId`

---

### `/live-predict/:matchId` - Match Detail

**Component**: `MatchDetailPage` (lazy loaded)  
**Layout**: `LivePredictLayout`  
**Purpose**: Real-time match view with live betting

**Features**:
- Fetches match metadata via `createApiClient().getMatch(matchId)`
- Connects to live stream via `useMatchStream` hook
- Two-column layout (60% / 40%) that stacks on mobile
- Left column: Scoreboard, MetricsBar, PitchView, Timeline
- Right column: MarketsFeed with FilterPills
- Below columns: MeineWettenPanel (user's bets)
- BetSlip modal for placing bets

**Data Flow**:
```
useMatchStream → onFrame → frameRef (no re-render)
               → onEvent → matchStore.addEvent()
               → onMarketNew → marketStore.addMarket()
               → onMarketUpdate → marketStore.updateMarket()
               → onMarketSettled → marketStore.settleMarket()
```

**Navigation**:
- Back button → `/live-predict`
- "Meine Wetten" link → `/live-predict/meine-wetten`

---

### `/live-predict/meine-wetten` - Bet History

**Component**: `HistoryPage`  
**Layout**: `LivePredictLayout`  
**Purpose**: Display user's bet history and statistics

**Features**:
- Table of all bets with columns: Date, Match, Market, Outcome, Stake, Odds, Status, Return
- Summary statistics: Total Wagered, Total Won, Net P&L, Hit Rate
- Reads from `betStore.bets`
- Empty state when no bets placed

**Data Source**: `betStore.bets` (session-only, not persisted)

**Navigation**:
- Back button → `/live-predict`

---

## Route Guards

### RequireAuth Component

**Location**: `src/live-predict/components/auth/RequireAuth.tsx`

Protects routes by checking authentication status before rendering children.

```typescript
export function RequireAuth({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading, checkSession } = useAuthStore();

  useEffect(() => {
    checkSession();
  }, [checkSession]);

  if (isLoading) return <LoadingSpinner />;
  if (!isAuthenticated) return <Navigate to="/login" replace />;

  return <>{children}</>;
}
```

**Behavior**:
1. On mount, calls `authStore.checkSession()` to restore session
2. Shows loading spinner while checking session
3. Redirects to `/login` if not authenticated
4. Renders children if authenticated

**Usage**:
```typescript
{
  path: '/live-predict',
  element: (
    <RequireAuth>
      <LivePredictLayout />
    </RequireAuth>
  ),
  children: [...]
}
```

---

## Navigation Patterns

### Programmatic Navigation

Use `useNavigate()` hook from React Router:

```typescript
import { useNavigate } from 'react-router-dom';

function MatchCard({ match }: Props) {
  const navigate = useNavigate();

  const handleClick = () => {
    navigate(`/live-predict/${match.id}`);
  };

  return <button onClick={handleClick}>View Match</button>;
}
```

### Declarative Navigation

Use `<Link>` or `<NavLink>` components:

```typescript
import { Link } from 'react-router-dom';

function Header() {
  return (
    <nav>
      <Link to="/live-predict">Matches</Link>
      <Link to="/live-predict/meine-wetten">My Bets</Link>
    </nav>
  );
}
```

### External Navigation

For navigation outside the React app (header, footer), use standard `<a>` tags:

```html
<a href="/live-predict" class="nav-link">Live Predict</a>
```

---

## Code Splitting

### Lazy Loading MatchDetailPage

The `MatchDetailPage` component is lazy loaded to reduce initial bundle size:

```typescript
import { lazy, Suspense } from 'react';

const MatchDetailPage = lazy(() => import('../components/pages/MatchDetailPage'));

// In router:
{
  path: ':matchId',
  element: (
    <Suspense fallback={<LoadingSpinner />}>
      <MatchDetailPage />
    </Suspense>
  ),
}
```

**Benefits**:
- Initial bundle ≤ 200 KB gzip (Requirement 16.4)
- MatchDetailPage chunk loaded only when user navigates to match detail
- LoadingSpinner shown while chunk is fetching

**LoadingSpinner**:
```typescript
function LoadingSpinner() {
  return (
    <div role="status" aria-label="Wird geladen…">
      <div className="spinner" />
    </div>
  );
}
```

---

## Route Parameters

### `:matchId` Parameter

Extracted using `useParams()` hook:

```typescript
import { useParams } from 'react-router-dom';

function MatchDetailPage() {
  const { matchId } = useParams<{ matchId: string }>();

  useEffect(() => {
    if (!matchId) return;
    createApiClient().getMatch(matchId).then(setCurrentMatch);
  }, [matchId]);

  return <div>Match ID: {matchId}</div>;
}
```

---

## Layout Hierarchy

```
index.html (site shell: header, nav, footer)
  └── <div id="app-root">
        └── RouterProvider
              ├── Public Routes (no layout wrapper)
              │   ├── /login → LoginPage
              │   ├── /register → RegisterPage
              │   └── /confirm-account → ConfirmPage
              │
              └── Protected Routes
                    └── /live-predict → <RequireAuth><LivePredictLayout /></RequireAuth>
                          ├── DEMOMODUS Banner
                          └── <Outlet />
                                ├── / → MatchListPage
                                ├── /:matchId → MatchDetailPage
                                └── /meine-wetten → HistoryPage
```

**Key Points**:
- Public routes render directly in `#app-root` (use existing site styles)
- Protected routes render inside `LivePredictLayout` (adds DEMOMODUS banner)
- `<Outlet />` renders the matched child route

---

## Error Handling

### 404 Not Found

Currently, no 404 route is defined. Unmatched routes fall through to the browser's default behavior.

**Future Enhancement**:
```typescript
{
  path: '*',
  element: <NotFoundPage />,
}
```

### Connection Errors

Connection errors are handled at the component level, not the router level:

```typescript
// In MatchDetailPage
{connectionStatus === 'error' && (
  <div role="alert" aria-live="assertive">
    {de.connectionError}
  </div>
)}
```

---

## Best Practices

### 1. Use Programmatic Navigation for User Actions

```typescript
// ✅ Good: Programmatic navigation after action
const handleLogin = async () => {
  await login(email, password);
  navigate('/live-predict');
};

// ❌ Bad: Link for action that requires logic
<Link to="/live-predict">Login</Link>
```

### 2. Use Declarative Navigation for Static Links

```typescript
// ✅ Good: Link for static navigation
<Link to="/live-predict/meine-wetten">My Bets</Link>

// ❌ Bad: Button with onClick for static link
<button onClick={() => navigate('/live-predict/meine-wetten')}>My Bets</button>
```

### 3. Extract Route Params Early

```typescript
// ✅ Good: Extract at top of component
function MatchDetailPage() {
  const { matchId } = useParams<{ matchId: string }>();
  // Use matchId throughout component
}

// ❌ Bad: Extract in useEffect
function MatchDetailPage() {
  useEffect(() => {
    const { matchId } = useParams(); // ❌ Can't use hooks in useEffect
  }, []);
}
```

### 4. Handle Missing Params

```typescript
// ✅ Good: Guard against undefined params
const { matchId } = useParams<{ matchId: string }>();

if (!matchId) {
  return <div>Invalid match ID</div>;
}
```

---

## Next Steps

- [ARCHITECTURE.md](./ARCHITECTURE.md) - System architecture overview
- [COMPONENTS.md](./COMPONENTS.md) - Component API reference
- [STORES.md](./STORES.md) - State management documentation
