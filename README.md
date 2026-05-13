# FrontendBudes — Bundesliga Live Predict

A real-time mini-betting feature for the Bundesliga website, built with React 18, TypeScript, and Vite. Watch live matches with pitch visualization and participate in short-lived betting markets generated from official DFL tracking data.

## 🚀 Features

- **Live Match Tracking**: Real-time pitch visualization with 25 Hz position updates
- **Mini-Markets**: Short-lived betting markets (12-60 seconds) with live odds
- **Match Detail View**: Two-column layout with pitch view, metrics, and markets feed
- **Bet History**: Track your bets and performance across all matches
- **Demo Mode**: Fully functional with mock data layer (no backend required)
- **Responsive Design**: Works seamlessly on desktop and mobile devices
- **Accessibility**: Full keyboard navigation and screen reader support

## 📋 Prerequisites

- Node.js 16+ and npm
- Modern browser with ES2020+ support

## 🛠️ Installation

```bash
# Clone the repository
git clone <repository-url>
cd FrontendBudes

# Install dependencies
npm install
```

## 🏃 Running the Project

### Development Server

```bash
npm run dev
```

The application will be available at `http://localhost:5173/`

### Build for Production

```bash
npm run build
```

### Preview Production Build

```bash
npm run preview
```

## 🧪 Testing

```bash
# Run tests once
npm test

# Run tests in watch mode
npm run test:watch

# Generate coverage report
npm run test:coverage

# Type checking
npm run typecheck
```

## 📁 Project Structure

```
src/
├── config/              # Configuration (mock vs real data source)
├── i18n/                # Internationalization (German strings)
├── types/               # TypeScript type definitions
│   ├── match.ts         # Match, TeamInfo, MatchStatus
│   ├── frame.ts         # Frame, PlayerPosition, BallPosition
│   ├── event.ts         # KPIEvent types
│   ├── market.ts        # MiniMarket, Outcome
│   └── bet.ts           # Bet, BetStatus
├── parsers/             # JSON message parsers with validation
├── store/               # Zustand state management
│   ├── matchStore.ts    # Live matches state
│   ├── marketStore.ts   # Markets state
│   └── betStore.ts      # Bets and P&L state
├── transport/           # WebSocket and Mock data layer
├── hooks/               # React hooks (useMatchStream)
├── components/
│   ├── layout/          # Layout components
│   ├── pages/           # Page components
│   ├── sections/        # Section components (Scoreboard, PitchView, etc.)
│   └── atoms/           # Atomic UI components
└── router/              # React Router configuration
```

## 🎯 Key Technologies

- **React 18** — UI framework with concurrent features
- **TypeScript** — Type-safe development
- **Vite** — Fast build tool and dev server
- **Zustand** — Lightweight state management
- **React Router v6** — Client-side routing
- **Vitest** — Unit testing framework
- **React Testing Library** — Component testing
- **fast-check** — Property-based testing
- **CSS Modules** — Scoped styling

## 🎨 Design System

The project uses the existing Bundesliga website design system:

- **Colors**: CSS custom properties (`--red`, `--dark`, `--text`, etc.)
- **Typography**: Roboto Condensed, Oswald
- **Components**: Consistent with existing `.match-card`, `.nav-link` patterns

## 🔌 Data Layer

### Mock Mode (Default)

The application includes a mock data layer that replays pre-recorded match simulations:

- 25 Hz frame updates for player positions
- Real-time market generation and settlement
- Simulated bet placement and resolution

### Real Backend

Switch to real backend by changing the flag in `src/config/dataSource.ts`:

```typescript
export const USE_MOCK = false;
```

## 🌐 Routes

- `/live-predict` — Live matches listing
- `/live-predict/:matchId` — Match detail with pitch view and markets
- `/live-predict/meine-wetten` — Bet history

## ⚡ Performance

- Initial bundle: ≤ 200 KB gzipped
- Pitch rendering: 55+ fps with 25 Hz updates
- Code-split match detail view for faster initial load
- Zero React re-renders for position updates (uses `requestAnimationFrame`)

## ♿ Accessibility

- Full keyboard navigation support
- ARIA labels and live regions
- Screen reader friendly
- Focus management in modals
- Visible focus indicators

## 🌍 Internationalization

All UI strings are centralized in `src/i18n/de.ts`. To add a new language:

1. Create a new file (e.g., `src/i18n/en.ts`)
2. Export the same keys with translated values
3. Update the i18n configuration

## 🧩 Component Architecture

### High-Performance Pitch View

The pitch visualization uses a custom rendering strategy:

- Player positions stored in `useRef` (not React state)
- Direct SVG DOM manipulation via `requestAnimationFrame`
- Smooth interpolation between 25 Hz updates
- Maintains 55+ fps on standard hardware

### State Management

Three Zustand stores manage application state:

- **matchStore**: Live matches, current match, events, connection status
- **marketStore**: Open/settled markets, active filter
- **betStore**: User bets, session P&L

## 📝 Development Guidelines

### Adding a New Component

1. Create component in appropriate directory (`atoms/`, `sections/`, `pages/`)
2. Add CSS Module for scoped styles
3. Define TypeScript props interface
4. Write unit tests
5. Update this README if it's a major feature

### Adding a New Market Type

1. Update `MarketCategory` type in `types/market.ts`
2. Add filter pill in `MarketsFeed` component
3. Update mock data if needed
4. Add tests for new category

## 🐛 Troubleshooting

### Dev Server Won't Start

```bash
# Clear node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
```

### TypeScript Errors

```bash
# Run type checking
npm run typecheck
```

### Tests Failing

```bash
# Clear test cache
npm test -- --clearCache
```

## 📄 License

[Your License Here]

## 👥 Contributing

[Your Contributing Guidelines Here]

## 📞 Support

[Your Support Information Here]

---

**DEMOMODUS** — This is a demonstration feature. No real money is involved in betting activities.
