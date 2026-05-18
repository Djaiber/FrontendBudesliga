# Architectural Decisions

This document records key architectural decisions made during the development of the Bundesliga Live Predict application, including the reasoning behind each decision and the trade-offs involved.

## Table of Contents

- [State Management](#state-management)
- [Internationalization](#internationalization)
- [Authentication](#authentication)
- [Real-Time Data](#real-time-data)
- [Code Splitting](#code-splitting)
- [CSS Architecture](#css-architecture)
- [Testing Strategy](#testing-strategy)
- [Component Architecture](#component-architecture)

---

## State Management

### Decision: Use Zustand over Redux or Context API

**Reason**:
- **Minimal boilerplate**: No providers, actions, or reducers required
- **TypeScript-first**: Full type inference without manual typing
- **Performance**: Selective subscriptions prevent unnecessary re-renders
- **Developer experience**: Simple API, easy to learn and use
- **Bundle size**: ~1KB gzipped vs Redux ~3KB + Redux Toolkit ~10KB
- **No provider hell**: No need to wrap app in multiple providers

**Trade-offs**:
- **Ecosystem**: Smaller ecosystem compared to Redux (fewer middleware, devtools)
- **Time-travel debugging**: No built-in time-travel debugging (Redux DevTools support is limited)
- **Learning curve**: Team needs to learn a new library (though simpler than Redux)
- **Middleware**: Limited middleware support compared to Redux

**Alternative Considered**: Redux Toolkit
- **Rejected because**: Too much boilerplate for a small app, larger bundle size, steeper learning curve

**Alternative Considered**: React Context API
- **Rejected because**: Performance issues with frequent updates (25 Hz match data), no built-in selectors, verbose setup

---

## Internationalization

### Decision: Use custom i18n hook instead of i18next

**Reason**:
- **Lightweight**: No external dependencies (~0KB vs i18next ~50KB)
- **Type safety**: Full TypeScript autocomplete for translation keys
- **Simple**: Dot-notation key access, no complex configuration
- **Zustand integration**: Language switching via Zustand store
- **No provider setup**: No need to wrap app in i18n provider

**Trade-offs**:
- **No pluralization**: No built-in pluralization support (not needed for this app)
- **No interpolation**: Must use template literals instead of interpolation syntax
- **No lazy loading**: All translations loaded upfront (acceptable for 2 languages)
- **No namespaces**: All translations in a single file per language
- **No translation management**: No integration with translation management tools

**Alternative Considered**: i18next + react-i18next
- **Rejected because**: Overkill for 2 languages, larger bundle size, complex setup, no TypeScript autocomplete

**Alternative Considered**: react-intl (FormatJS)
- **Rejected because**: Similar issues to i18next, requires provider setup, verbose API

---

## Authentication

### Decision: Use AWS Cognito with public SPA client (no client secret)

**Reason**:
- **Secure**: Cognito handles password hashing, token management, and session storage
- **Scalable**: Managed service, no need to maintain auth infrastructure
- **Standards-compliant**: OAuth 2.0 and OpenID Connect support
- **Email verification**: Built-in email verification with 6-digit codes
- **Session management**: Automatic token refresh and session persistence
- **Public SPA client**: No client secret required (safe for browser-based apps)

**Trade-offs**:
- **Vendor lock-in**: Tied to AWS ecosystem
- **Cost**: Pay-per-user pricing (free tier: 50,000 MAUs)
- **Customization**: Limited UI customization for hosted UI (not used in this app)
- **Complexity**: Amplify library adds ~100KB to bundle size
- **Learning curve**: Team needs to learn Amplify API

**Alternative Considered**: Auth0
- **Rejected because**: Similar cost structure, no significant advantages over Cognito

**Alternative Considered**: Custom auth with JWT
- **Rejected because**: Security risks, maintenance burden, no email verification out-of-the-box

---

### Decision: Start with isLoading = false in authStore

**Reason**:
- **User experience**: Prevents flash of loading spinner on initial render
- **Session restoration**: `checkSession()` is called in `RequireAuth`, not on app load
- **Performance**: Avoids unnecessary re-renders on mount
- **Simplicity**: Clearer state transitions (idle → loading → authenticated/error)

**Trade-offs**:
- **Initial state ambiguity**: `isLoading = false` doesn't distinguish between "not checked yet" and "checked and not authenticated"
- **Potential race condition**: If `checkSession()` is called multiple times, state could be inconsistent

**Alternative Considered**: Start with isLoading = true
- **Rejected because**: Causes flash of loading spinner on every page load, poor UX

---

## Real-Time Data

### Decision: Use frameRef for high-frequency updates (25 Hz) instead of Zustand

**Reason**:
- **Performance**: Avoids 25 re-renders per second (1 per frame)
- **Smooth rendering**: PitchView uses `requestAnimationFrame` (60 FPS) to read from frameRef
- **Decoupling**: Frame updates don't trigger React re-renders
- **Efficiency**: Only PitchView needs frame data, no need to propagate to entire component tree

**Trade-offs**:
- **Complexity**: Requires understanding of refs and `requestAnimationFrame`
- **Debugging**: Frame data not visible in React DevTools or Zustand DevTools
- **Testing**: Harder to test frame updates (need to mock `requestAnimationFrame`)

**Alternative Considered**: Store frames in Zustand
- **Rejected because**: 25 re-renders per second would cause performance issues, unnecessary re-renders

**Alternative Considered**: Use Web Workers for frame processing
- **Rejected because**: Overkill for this use case, adds complexity, harder to debug

---

### Decision: Use MockTransport for demo mode instead of real WebSocket

**Reason**:
- **Development**: Allows development without backend infrastructure
- **Demo mode**: Users can try the app without real matches
- **Reproducibility**: Simulation data is deterministic, easier to test
- **Offline support**: App works without internet connection
- **Cost**: No backend hosting costs for demo mode

**Trade-offs**:
- **Realism**: Simulation data may not reflect real match dynamics
- **Scalability**: Need to maintain both MockTransport and WebSocketTransport
- **Testing**: Need to test both transports separately

**Alternative Considered**: Use real WebSocket from day one
- **Rejected because**: Requires backend infrastructure, harder to develop and test

---

## Code Splitting

### Decision: Lazy load MatchDetailPage only

**Reason**:
- **Bundle size**: MatchDetailPage is the largest component (~50KB)
- **User flow**: Most users land on MatchListPage first, MatchDetailPage is loaded on demand
- **Performance**: Initial bundle ≤ 200 KB gzip (Requirement 16.4)
- **Simplicity**: Only one lazy-loaded component, easy to maintain

**Trade-offs**:
- **Loading delay**: Users see loading spinner when navigating to MatchDetailPage for the first time
- **Complexity**: Need to wrap lazy component in `<Suspense>` with fallback

**Alternative Considered**: Lazy load all page components
- **Rejected because**: Diminishing returns, adds complexity, more loading spinners

**Alternative Considered**: No code splitting
- **Rejected because**: Initial bundle would exceed 200 KB gzip target

---

### Decision: Extract LoadingSpinner from router/index.tsx

**Reason**:
- **Reusability**: LoadingSpinner is used in multiple places (RequireAuth, MatchDetailPage)
- **Consistency**: Same loading spinner across the app
- **Maintainability**: Single source of truth for loading spinner styles

**Trade-offs**:
- **File count**: One more file to maintain
- **Overhead**: Minimal, spinner is ~10 lines of code

**Alternative Considered**: Inline loading spinner in each component
- **Rejected because**: Code duplication, inconsistent styling

---

## CSS Architecture

### Decision: Use CSS Modules for component styles

**Reason**:
- **Scoped styles**: Class names are scoped to components, no global conflicts
- **Type safety**: TypeScript autocomplete for class names
- **Performance**: No runtime overhead (styles are extracted at build time)
- **Simplicity**: No need to learn CSS-in-JS library
- **Compatibility**: Works with existing global styles (bundesliga.css)

**Trade-offs**:
- **Verbosity**: Need to import styles in every component
- **No dynamic styles**: Can't generate styles based on props (use inline styles instead)
- **No theming**: No built-in theming support (use CSS variables instead)

**Alternative Considered**: Styled Components
- **Rejected because**: Larger bundle size, runtime overhead, steeper learning curve

**Alternative Considered**: Tailwind CSS
- **Rejected because**: Conflicts with existing site styles, requires build configuration

---

### Decision: Use CSS custom properties (variables) for design system

**Reason**:
- **Consistency**: Single source of truth for colors, spacing, typography
- **Maintainability**: Easy to update design system globally
- **Performance**: No runtime overhead (native CSS feature)
- **Compatibility**: Works with existing site styles
- **Theming**: Easy to implement dark mode or custom themes

**Trade-offs**:
- **Browser support**: IE11 doesn't support CSS variables (not a concern for this app)
- **Type safety**: No TypeScript autocomplete for variable names

**Alternative Considered**: Sass variables
- **Rejected because**: Requires build step, no runtime theming support

---

## Testing Strategy

### Decision: Use Vitest instead of Jest

**Reason**:
- **Speed**: Vitest is 10x faster than Jest (uses Vite's transform pipeline)
- **Vite integration**: Native Vite support, no configuration needed
- **ESM support**: First-class ESM support (Jest requires workarounds)
- **TypeScript**: Native TypeScript support, no need for ts-jest
- **API compatibility**: Jest-compatible API, easy migration

**Trade-offs**:
- **Ecosystem**: Smaller ecosystem compared to Jest (fewer plugins, less documentation)
- **Maturity**: Vitest is newer, may have undiscovered bugs
- **Snapshot testing**: Snapshot testing is less mature than Jest

**Alternative Considered**: Jest
- **Rejected because**: Slower, requires complex configuration for Vite + ESM + TypeScript

---

### Decision: Use property-based testing (fast-check) for parsers

**Reason**:
- **Coverage**: Tests 100+ random inputs automatically, finds edge cases
- **Invariants**: Validates properties that should hold for all inputs (e.g., round-trip)
- **Confidence**: Higher confidence in parser correctness
- **Documentation**: Properties serve as executable documentation

**Trade-offs**:
- **Learning curve**: Team needs to learn property-based testing concepts
- **Debugging**: Harder to debug failing property tests (need to shrink failing input)
- **Performance**: Property tests are slower than unit tests (100 runs vs 1 run)

**Alternative Considered**: Only unit tests with specific examples
- **Rejected because**: Can't test all edge cases, lower confidence in parser correctness

---

## Component Architecture

### Decision: Use Atomic Design pattern (atoms, sections, pages)

**Reason**:
- **Reusability**: Small components (atoms) can be reused across the app
- **Maintainability**: Clear component hierarchy, easy to find components
- **Scalability**: Easy to add new components without cluttering the codebase
- **Consistency**: Enforces consistent component structure

**Trade-offs**:
- **Overhead**: More folders and files to navigate
- **Ambiguity**: Sometimes unclear whether a component is an atom or a section
- **Over-engineering**: May be overkill for small apps

**Alternative Considered**: Flat component structure
- **Rejected because**: Hard to navigate as app grows, no clear component hierarchy

---

### Decision: Co-locate component tests with components

**Reason**:
- **Discoverability**: Easy to find tests for a component
- **Maintainability**: When a component is deleted, its test is also deleted
- **Locality**: Tests are close to the code they test

**Trade-offs**:
- **Build size**: Test files are included in the source tree (excluded from build)
- **Clutter**: More files in component folders

**Alternative Considered**: Separate `__tests__` folder
- **Rejected because**: Harder to find tests, easy to forget to delete tests when deleting components

---

## Summary

These decisions were made to balance:
- **Performance**: Fast initial load, smooth 25 Hz updates
- **Developer experience**: Simple APIs, minimal boilerplate, TypeScript support
- **Maintainability**: Clear architecture, reusable components, comprehensive tests
- **User experience**: Fast, responsive, accessible, multilingual

As the project evolves, these decisions may be revisited based on new requirements, performance data, or team feedback.

---

## Next Steps

- [ARCHITECTURE.md](./ARCHITECTURE.md) - System architecture overview
- [STORES.md](./STORES.md) - State management documentation
- [COMPONENTS.md](./COMPONENTS.md) - Component API reference
- [TESTING.md](./TESTING.md) - Testing strategies
