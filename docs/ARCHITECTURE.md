# Architecture

This document describes the system architecture, authentication flow, state management, and CSS architecture of the Bundesliga Live Predict application.

## Table of Contents

- [System Overview](#system-overview)
- [Technology Stack](#technology-stack)
- [Project Structure](#project-structure)
- [Authentication Flow](#authentication-flow)
- [State Management](#state-management)
- [CSS Architecture](#css-architecture)
- [Routing Architecture](#routing-architecture)
- [Real-time Data Flow](#real-time-data-flow)

---

## System Overview

The Bundesliga Live Predict application is a React-based single-page application (SPA) that allows users to place live bets on Bundesliga matches. The application features:

- **AWS Cognito Authentication**: Secure user registration, login, and session management
- **Real-time Match Streaming**: Live match data updates at 25 Hz using mock WebSocket simulation
- **Live Betting Markets**: Dynamic betting markets that appear and expire during matches
- **Internationalization**: Full German/English language support
- **Demo Mode**: Safe betting environment with no real stakes

## Technology Stack

### Core Framework
- **React 18.3.1**: UI library with concurrent features
- **TypeScript 5.6.3**: Type-safe development
- **Vite 6.0.5**: Fast build tool and dev server

### State Management
- **Zustand 5.0.3**: Lightweight state management (5 stores)

### Routing
- **React Router DOM 6.28.0**: Client-side routing with nested routes

### Authentication
- **AWS Amplify 6.17.0**: Cognito integration for auth

### Testing
- **Vitest 4.1.6**: Unit and integration testing
- **Testing Library**: React component testing
- **fast-check 3.23.2**: Property-based testing

### Build & Dev Tools
- **Vite**: Module bundler with HMR
- **TypeScript**: Strict mode enabled
- **CSS Modules**: Scoped component styles

---

## Project Structure

```
FrontendBudes/
├── public/                          # Static assets
│   ├── assets/
│   │   ├── logos/                   # Bundesliga branding
│   │   ├── teams/                   # Team icons (placeholder)
│   │   └── verification-email.html  # Email template
│   └── favicon.svg                  # Site favicon
│
├── src/
│   ├── main.tsx                     # App entry point, router setup
│   ├── pages/
│   │   └── HomePage.tsx             # Public homepage
│   ├── components/
│   │   ├── TeamLogo.tsx             # Team logo component
│   │   └── icons/
│   │       ├── BundesligaLogo.tsx   # Bundesliga logo SVG
│   │       └── TeamIcons.tsx        # Team icon SVGs
│   ├── styles/
│   │   └── bundesliga.css           # Global design system
│   ├── scripts/
│   │   └── adidasClub.ts            # Adidas Club dropdown logic
│   │
│   └── live-predict/                # Live Predict feature module
│       ├── main.tsx                 # Feature entry (unused, kept for reference)
│       ├── config/
│       │   └── cognito.ts           # AWS Amplify configuration
│       ├── store/                   # Zustand stores (5 stores)
│       │   ├── authStore.ts         # Authentication state
│       │   ├── languageStore.ts     # i18n locale state
│       │   ├── betStore.ts          # User bets and P&L
│       │   ├── marketStore.ts       # Live betting markets
│       │   └── matchStore.ts        # Match data and metrics
│       ├── hooks/                   # Custom React hooks
│       │   ├── useTranslation.ts    # i18n translation hook
│       │   └── useMatchStream.ts    # Real-time match data hook
│       ├── i18n/                    # Translation files
│       │   ├── de.ts                # German strings
│       │   └── en.ts                # English strings
│       ├── types/                   # TypeScript type definitions
│       │   ├── bet.ts
│       │   ├── event.ts
│       │   ├── frame.ts
│       │   ├── market.ts
│       │   └── match.ts
│       ├── transport/               # Mock data layer
│       │   └── mockMatchStream.ts   # Simulated WebSocket
│       ├── parsers/                 # Data transformation
│       │   ├── frameParser.ts
│       │   ├── eventParser.ts
│       │   └── marketParser.ts
│       ├── router/
│       │   └── index.tsx            # Feature routes (deprecated)
│       └── components/              # React components
│           ├── atoms/               # Atomic UI components
│           ├── auth/                # Auth guards
│           ├── layout/              # Layout components
│           ├── pages/               # Page components
│           └── ui/                  # Shared UI components
│
├── docs/                            # Documentation
│   ├── README.md                    # Project overview
│   ├── ARCHITECTURE.md              # This file
│   ├── STORES.md                    # State management docs
│   ├── ROUTES.md                    # Routing reference
│   ├── COMPONENTS.md                # Component API docs
│   ├── I18N.md                      # Translation system
│   ├── TESTING.md                   # Testing guide
│   └── DECISIONS.md                 # Architectural decisions
│
├── .env                             # Environment variables (Cognito)
├── package.json                     # Dependencies
├── vite.config.ts                   # Vite configuration
├── tsconfig.json                    # TypeScript configuration
└── vitest.config.ts                 # Test configuration
```

---

## Authentication Flow

### AWS Cognito Integration

The application uses AWS Amplify v6 to integrate with AWS Cognito for authentication.

#### Configuration

Cognito credentials are stored in `.env` and loaded via `import.meta.env`:

```typescript
// src/live-predict/config/cognito.ts
import { Amplify } from 'aws-amplify';

Amplify.configure({
  Auth: {
    Cognito: {
      userPoolId: import.meta.env.VITE_COGNITO_USER_POOL_ID,
      userPoolClientId: import.meta.env.VITE_COGNITO_CLIENT_ID,
      signUpVerificationMethod: 'code',
    },
  },
});
```

#### Registration Flow

1. **User Registration** (`/register`)
   - User provides: name, email, password
   - `authStore.register()` calls `signUp()` with user attributes
   - Cognito sends 6-digit verification code to email

2. **Email Verification** (`/confirm-account`)
   - User enters email, password, and verification code
   - `authStore.confirmAndLogin()` calls:
     - `confirmSignUp()` to verify email
     - `signIn()` to automatically log in user
   - User is redirected to `/live-predict` (authenticated)

3. **Session Persistence**
   - On app load, `authStore.checkSession()` calls:
     - `getCurrentUser()` to get user info
     - `fetchAuthSession()` to validate tokens
   - If valid tokens exist, user is automatically authenticated

#### Login Flow

1. User enters email and password on `/login`
2. `authStore.login()` calls `signIn()`
3. On success, `getCurrentUser()` retrieves user data
4. User is redirected to `/live-predict`

#### Logout Flow

1. User clicks logout button
2. `authStore.logout()` calls `signOut()`
3. User state is cleared
4. User is redirected to `/login`

#### Protected Routes

Protected routes use the `<RequireAuth>` guard component:

```tsx
// src/live-predict/components/auth/RequireAuth.tsx
export function RequireAuth({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuthStore();
  
  if (isLoading) return <LoadingSpinner />;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  
  return <>{children}</>;
}
```

---

## State Management

The application uses **Zustand** for state management with 5 independent stores:

### Store Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      Application State                       │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │  authStore   │  │ languageStore│  │  betStore    │      │
│  │              │  │              │  │              │      │
│  │ • user       │  │ • locale     │  │ • bets[]     │      │
│  │ • isAuth     │  │ • setLocale  │  │ • sessionPnL │      │
│  │ • login()    │  │              │  │ • addBet()   │      │
│  │ • logout()   │  │ (persisted)  │  │ • settleBet()│      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
│                                                               │
│  ┌──────────────┐  ┌──────────────┐                         │
│  │ marketStore  │  │ matchStore   │                         │
│  │              │  │              │                         │
│  │ • openMarkets│  │ • matches[]  │                         │
│  │ • settled[]  │  │ • current    │                         │
│  │ • filter     │  │ • events[]   │                         │
│  │ • addMarket()│  │ • metrics    │                         │
│  │ • settle()   │  │ • applyGoal()│                         │
│  └──────────────┘  └──────────────┘                         │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

### Store Responsibilities

| Store | Purpose | Persistence |
|-------|---------|-------------|
| `authStore` | User authentication, session management | Session (Cognito) |
| `languageStore` | UI language (en/de) | localStorage (`bl-locale`) |
| `betStore` | User bets, P&L calculation | Memory (session) |
| `marketStore` | Live betting markets, filtering | Memory (session) |
| `matchStore` | Match data, events, metrics | Memory (session) |

### Data Flow

```
User Action → Component → Store Action → State Update → Re-render
                              ↓
                        Side Effects
                    (API calls, localStorage)
```

See [STORES.md](./STORES.md) for detailed store documentation.

---

## CSS Architecture

### Design System

The application uses a **CSS custom properties** design system defined in `src/styles/bundesliga.css`:

```css
:root {
  /* Colors */
  --red: #d2001f;           /* Bundesliga primary red */
  --dark-bg: #0a0a0a;       /* Dark background */
  --card-bg: #1a1a1a;       /* Card background */
  --border: #2a2a2a;        /* Border color */
  --text: #ffffff;          /* Primary text */
  --text-muted: #888888;    /* Secondary text */
  
  /* Typography */
  --font-primary: 'Segoe UI', system-ui, sans-serif;
  --font-mono: 'Courier New', monospace;
  
  /* Spacing */
  --spacing-xs: 4px;
  --spacing-sm: 8px;
  --spacing-md: 16px;
  --spacing-lg: 24px;
  --spacing-xl: 32px;
  
  /* Borders */
  --radius-sm: 4px;
  --radius-md: 8px;
  --radius-lg: 12px;
}
```

### CSS Strategy

The application uses a **hybrid CSS approach**:

1. **Global Styles** (`bundesliga.css`)
   - Design system variables
   - Base typography
   - Layout utilities
   - Existing site styles (header, nav, footer)

2. **CSS Modules** (component-scoped)
   - All Live Predict components use CSS Modules
   - Naming: `ComponentName.module.css`
   - Scoped class names prevent conflicts
   - Example: `MatchCard.module.css` → `.card`, `.team`, `.score`

3. **Utility Classes** (from `login-template.css`)
   - Auth pages use existing utility classes
   - No new CSS files for auth components
   - Classes: `.form-container`, `.input-field`, `.btn-primary`, etc.

### Component Styling Pattern

```tsx
// Component with CSS Module
import styles from './MatchCard.module.css';

export function MatchCard({ match }: Props) {
  return (
    <div className={styles.card}>
      <div className={styles.team}>{match.homeTeam}</div>
      <div className={styles.score}>{match.homeScore}</div>
    </div>
  );
}
```

---

## Routing Architecture

### Router Structure

The application uses **React Router v6** with a single router defined in `src/main.tsx`:

```
/                          → Redirect to /login
/home                      → HomePage (public)
/login                     → LoginPage (public)
/register                  → RegisterPage (public)
/confirm-account           → ConfirmPage (public)
/live-predict              → LivePredictLayout (protected)
  ├── /                    → MatchListPage
  ├── /:matchId            → MatchDetailPage (lazy loaded)
  └── /meine-wetten        → HistoryPage
```

### Route Protection

- **Public routes**: `/login`, `/register`, `/confirm-account`, `/home`
- **Protected routes**: `/live-predict/*` (requires authentication)
- **Guard component**: `<RequireAuth>` wraps protected routes

### Navigation

- **Programmatic**: `useNavigate()` hook from React Router
- **Declarative**: `<Link>` and `<NavLink>` components
- **External**: Standard `<a>` tags for site navigation (header, footer)

See [ROUTES.md](./ROUTES.md) for complete route reference.

---

## Real-time Data Flow

### Match Streaming Architecture

The application simulates real-time match data using a mock WebSocket implementation:

```
┌─────────────────────────────────────────────────────────────┐
│                    useMatchStream Hook                       │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  1. Subscribe to mockMatchStream                             │
│  2. Receive frames at 25 Hz (40ms interval)                  │
│  3. Parse frame data (frameParser)                           │
│  4. Update matchStore (scores, metrics)                      │
│  5. Detect KPI events (eventParser)                          │
│  6. Generate markets (marketParser)                          │
│  7. Update marketStore (new markets)                         │
│  8. Trigger re-render (via Zustand)                          │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

### Frame Processing Pipeline

```
Frame (25 Hz)
    ↓
frameParser.ts
    ↓
matchStore.setCurrentMatch()
    ↓
eventParser.ts (detect KPI events)
    ↓
matchStore.addEvent()
    ↓
marketParser.ts (generate markets)
    ↓
marketStore.addMarket()
    ↓
Component Re-render (React)
```

### Render Optimization

To achieve smooth 25 Hz updates without excessive re-renders:

1. **useRef for high-frequency data**: Store latest frame in ref
2. **requestAnimationFrame**: Batch updates at 60 FPS
3. **Selective subscriptions**: Components subscribe only to needed state slices
4. **Memoization**: Use `React.memo()` for expensive components

See [TESTING.md](./TESTING.md) for performance testing strategies.

---

## Next Steps

- [STORES.md](./STORES.md) - Detailed store API reference
- [ROUTES.md](./ROUTES.md) - Complete routing table
- [COMPONENTS.md](./COMPONENTS.md) - Component API documentation
- [I18N.md](./I18N.md) - Translation system guide
- [TESTING.md](./TESTING.md) - Testing strategies and conventions
- [DECISIONS.md](./DECISIONS.md) - Architectural decision records
