# Bundesliga Live Predict - Frontend Documentation

## What is this app?

Bundesliga Live Predict is a real-time sports betting simulation feature that allows users to place virtual bets on live Bundesliga matches. The app streams match events (goals, shots, corners, etc.) at 25 Hz and presents dynamic betting markets that users can interact with in real-time.

**Key Features:**
- Real-time match streaming with 25 Hz updates
- Live betting markets with dynamic odds
- User authentication via AWS Cognito
- Multi-language support (German/English)
- Bet history tracking
- Demo mode (no real money)

## Tech Stack

| Technology | Version | Purpose |
|------------|---------|---------|
| React | 18.3.1 | UI framework |
| TypeScript | 5.6.3 | Type safety |
| Vite | 6.0.5 | Build tool & dev server |
| Zustand | 5.0.3 | State management |
| React Router | 6.28.0 | Client-side routing |
| AWS Amplify | 6.17.0 | Cognito authentication |
| Vitest | 4.1.6 | Testing framework |
| Testing Library | 16.1.0 | Component testing |
| fast-check | 3.23.2 | Property-based testing |

## Getting Started

### Prerequisites
- Node.js 18+ 
- npm or yarn

### Installation

```bash
npm install
```

### Environment Variables

Create a `.env` file in the project root with the following variables:

```env
VITE_COGNITO_USER_POOL_ID=<your-cognito-user-pool-id>
VITE_COGNITO_CLIENT_ID=<your-cognito-client-id>
```

**Note:** These are public SPA client credentials (no client secret required).

### Development

```bash
npm run dev
```

Runs the app in development mode at `http://localhost:5173/`

### Testing

```bash
# Run all tests once
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage report
npm run test:coverage

# Type checking only
npm run typecheck
```

### Build

```bash
npm run build
```

Builds the app for production to the `dist/` folder.

### Preview Production Build

```bash
npm run preview
```

## Project Structure

```
/Users/jaiberdiaz/Projects/FrontendBudes/
├── docs/                          # Project documentation
├── public/                        # Static assets
│   └── assets/                    # Images, CSS, HTML templates
├── src/
│   ├── components/                # Shared components (TeamLogo, icons)
│   ├── live-predict/              # Main Live Predict feature
│   │   ├── components/            # React components
│   │   │   ├── atoms/             # Small reusable components
│   │   │   ├── auth/              # Authentication components
│   │   │   ├── layout/            # Layout wrappers
│   │   │   ├── pages/             # Page-level components
│   │   │   ├── sections/          # Composite sections
│   │   │   └── ui/                # UI components (LanguageSwitcher)
│   │   ├── config/                # Configuration files
│   │   ├── hooks/                 # Custom React hooks
│   │   ├── i18n/                  # Translation files (de.ts, en.ts)
│   │   ├── parsers/               # Data parsers for match events
│   │   ├── router/                # React Router configuration
│   │   ├── store/                 # Zustand stores
│   │   ├── test/                  # Test files and utilities
│   │   ├── transport/             # WebSocket/Mock transport layer
│   │   ├── types/                 # TypeScript type definitions
│   │   └── main.tsx               # Live Predict entry point
│   ├── pages/                     # Homepage and other pages
│   ├── scripts/                   # Utility scripts
│   ├── styles/                    # Global CSS
│   └── main.tsx                   # App entry point
├── index.html                     # HTML template
├── package.json                   # Dependencies and scripts
├── tsconfig.json                  # TypeScript configuration
├── vite.config.ts                 # Vite configuration
└── vitest.config.ts               # Vitest configuration
```

## Key Concepts

### Path Alias
The project uses `@` as an alias for `src/live-predict/`:

```typescript
import { useTranslation } from '@/hooks/useTranslation';
// Resolves to: src/live-predict/hooks/useTranslation.ts
```

### Authentication Flow
1. User visits `/` → redirected to `/login`
2. User enters credentials → AWS Cognito validates
3. On success → redirected to `/live-predict`
4. Protected routes wrapped in `<RequireAuth>` component

### Real-Time Updates
- Match data streams via WebSocket at 25 Hz
- `useMatchStream` hook manages connection
- Zustand stores update on each frame
- React components re-render efficiently via selectors

### State Management
- **authStore**: User authentication state
- **languageStore**: UI language preference (persisted to localStorage)
- **matchStore**: Live match data
- **marketStore**: Betting markets and odds
- **betStore**: User's placed bets

## Development Workflow

1. **Start dev server**: `npm run dev`
2. **Make changes**: Edit files in `src/`
3. **Hot reload**: Vite automatically reloads
4. **Run tests**: `npm run test:watch`
5. **Type check**: `npm run typecheck`
6. **Build**: `npm run build`

## Testing Strategy

- **Unit tests**: Individual functions and components
- **Integration tests**: Full user flows
- **Property-based tests**: Parser validation with fast-check
- **Coverage target**: 80%+ for critical paths

## Deployment

The app is a static SPA that can be deployed to:
- Vercel
- Netlify
- AWS S3 + CloudFront
- Any static hosting service

**Build output**: `dist/` folder contains all static assets.

## Further Reading

- [ARCHITECTURE.md](./ARCHITECTURE.md) - System architecture and design
- [STORES.md](./STORES.md) - Zustand store documentation
- [ROUTES.md](./ROUTES.md) - Complete route table
- [COMPONENTS.md](./COMPONENTS.md) - Component API reference
- [I18N.md](./I18N.md) - Internationalization system
- [TESTING.md](./TESTING.md) - Testing guide
- [DECISIONS.md](./DECISIONS.md) - Architectural decisions
