/**
 * Integration tests for the bundesliga-live-predict feature.
 *
 * Task 32.1 — Full mock replay mount
 *   Validates: Requirements 15.1, 15.2, 15.4
 *
 * Task 32.2 — Navigation integration
 *   Validates: Requirements 3.1, 19.2
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { Suspense } from 'react';

import { MatchDetailPage } from '../components/pages/MatchDetailPage';
import { MatchListPage } from '../components/pages/MatchListPage';
import { HistoryPage } from '../components/pages/HistoryPage';
import { LivePredictLayout } from '../components/layout/LivePredictLayout';
import { useMarketStore } from '../store/marketStore';
import { useBetStore } from '../store/betStore';
import { useMatchStore } from '../store/matchStore';
import * as dataSource from '../config/dataSource';
import type { ITransport, WSMessage } from '../transport/ITransport';
import type { MiniMarket } from '../types/market';
import type { Match } from '../types/match';
import { de } from '../i18n/de';

// ─── Shared fixtures ──────────────────────────────────────────────────────────

const MATCH_ID = 'match-001';

const mockMatch: Match = {
  id: MATCH_ID,
  homeTeam: { id: 'fcb', name: 'FC Bayern München', shortName: 'FCB', logoUrl: '' },
  awayTeam: { id: 'bvb', name: 'Borussia Dortmund', shortName: 'BVB', logoUrl: '' },
  homeScore: 0,
  awayScore: 0,
  minute: 0,
  status: 'live',
  openMarketCount: 0,
};

const mockMarket: MiniMarket = {
  id: 'mkt-001',
  matchId: MATCH_ID,
  question: 'Nächstes Tor?',
  category: 'Tor',
  outcomes: [
    { id: 'o1', label: 'Heimteam', decimalOdds: 2.1, impliedProbability: 0.48 },
    { id: 'o2', label: 'Auswärtsteam', decimalOdds: 1.9, impliedProbability: 0.52 },
  ],
  ttlSeconds: 60,
  openedAt: Date.now(),
  status: 'open',
};

// ─── Controllable stub transport ──────────────────────────────────────────────

/**
 * A minimal ITransport stub that lets tests push messages manually.
 * connect() does nothing; tests call emit() to fire messages.
 */
class StubTransport implements ITransport {
  onMessage: ((msg: WSMessage) => void) | null = null;
  onClose: (() => void) | null = null;

  connect(): void {
    // no-op — tests drive messages via emit()
  }

  disconnect(): void {
    this.onClose?.();
  }

  emit(msg: WSMessage): void {
    this.onMessage?.(msg);
  }
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Render MatchDetailPage inside a MemoryRouter that provides the :matchId param.
 * Returns the stub transport so tests can emit messages.
 */
function renderMatchDetailPage(): { transport: StubTransport } {
  const transport = new StubTransport();

  vi.spyOn(dataSource, 'createTransport').mockReturnValue(transport);
  vi.spyOn(dataSource, 'createApiClient').mockReturnValue({
    getLiveMatches: vi.fn().mockResolvedValue([mockMatch]),
    getMatch: vi.fn().mockResolvedValue(mockMatch),
    placeBet: vi.fn().mockImplementation(async (req) => ({
      id: 'bet-test-1',
      matchId: req.matchId,
      marketId: req.marketId,
      marketQuestion: req.marketQuestion,
      outcomeId: req.outcomeId,
      outcomeLabel: req.outcomeLabel,
      decimalOdds: req.decimalOdds,
      stake: req.stake,
      potentialReturn: req.stake * req.decimalOdds,
      actualReturn: 0,
      status: 'ausstehend' as const,
      placedAt: Date.now(),
    })),
  });

  render(
    <MemoryRouter initialEntries={[`/live-predict/${MATCH_ID}`]}>
      <Routes>
        <Route path="/live-predict/:matchId" element={<MatchDetailPage />} />
      </Routes>
    </MemoryRouter>,
  );

  return { transport };
}

// ─── Task 32.1 — Full mock replay mount ──────────────────────────────────────

describe('32.1 Full mock replay mount', () => {
  beforeEach(() => {
    // Reset all stores to a clean state before each test
    useMarketStore.setState({ openMarkets: [], settledMarkets: [], activeFilter: 'Alle' });
    useBetStore.setState({ bets: [], sessionPnL: 0 });
    useMatchStore.setState({
      matches: [],
      currentMatch: null,
      events: [],
      connectionStatus: 'disconnected',
      connectionError: null,
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // ── Requirement 15.1, 15.2 — market.new messages cause MarketCard to appear ─

  it('renders a MarketCard after the transport emits a market.new message', async () => {
    const { transport } = renderMatchDetailPage();

    // Emit a market.new message from the stub transport
    act(() => {
      transport.emit({ type: 'market.new', payload: mockMarket });
    });

    // The MarketCard renders the market question as its aria-label
    await waitFor(() => {
      expect(screen.getByRole('article', { name: mockMarket.question })).toBeInTheDocument();
    });
  });

  it('renders multiple MarketCards when multiple market.new messages are emitted', async () => {
    const { transport } = renderMatchDetailPage();

    const market2: MiniMarket = {
      ...mockMarket,
      id: 'mkt-002',
      question: 'Nächster Torschuss?',
      category: 'Torschuss',
    };

    act(() => {
      transport.emit({ type: 'market.new', payload: mockMarket });
      transport.emit({ type: 'market.new', payload: market2 });
    });

    await waitFor(() => {
      expect(screen.getByRole('article', { name: mockMarket.question })).toBeInTheDocument();
      expect(screen.getByRole('article', { name: market2.question })).toBeInTheDocument();
    });
  });

  // ── Requirement 15.4 — clicking OutcomeButton opens BetSlip modal ────────────

  it('opens the BetSlip modal when an OutcomeButton is clicked', async () => {
    const user = userEvent.setup();
    const { transport } = renderMatchDetailPage();

    act(() => {
      transport.emit({ type: 'market.new', payload: mockMarket });
    });

    // Wait for the MarketCard to appear
    await waitFor(() => {
      expect(screen.getByRole('article', { name: mockMarket.question })).toBeInTheDocument();
    });

    // Click the first OutcomeButton (Heimteam)
    const outcomeButton = screen.getByRole('button', {
      name: new RegExp(`${mockMarket.question}.*Heimteam`, 'i'),
    });
    await user.click(outcomeButton);

    // BetSlip modal should now be open
    await waitFor(() => {
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });

    // The dialog should show the market question as its title
    expect(screen.getByRole('heading', { name: mockMarket.question })).toBeInTheDocument();
  });

  // ── Requirement 15.4 — confirming a bet adds it to MeineWettenPanel ──────────

  it('adds the bet to MeineWettenPanel after confirming in BetSlip', async () => {
    const user = userEvent.setup();
    const { transport } = renderMatchDetailPage();

    // Emit the market via the transport — this calls addMarket through the hook,
    // so the market ends up in the store (no need to pre-seed separately).
    act(() => {
      transport.emit({ type: 'market.new', payload: mockMarket });
    });

    // Wait for MarketCard to appear
    await waitFor(() => {
      expect(screen.getAllByRole('article', { name: mockMarket.question })).toHaveLength(1);
    });

    // Click the first OutcomeButton to open BetSlip
    const outcomeButton = screen.getByRole('button', {
      name: new RegExp(`${mockMarket.question}.*Heimteam`, 'i'),
    });
    await user.click(outcomeButton);

    // Wait for BetSlip dialog
    await waitFor(() => {
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });

    // Click "Wette bestätigen"
    const confirmButton = screen.getByRole('button', { name: /Wette bestätigen/i });
    await user.click(confirmButton);

    // BetSlip should close and the bet should appear in MeineWettenPanel
    await waitFor(() => {
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });

    // The bet store should contain the placed bet
    await waitFor(() => {
      expect(useBetStore.getState().bets).toHaveLength(1);
    });
    expect(useBetStore.getState().bets[0].marketQuestion).toBe(mockMarket.question);

    // MeineWettenPanel shows the market question for the placed bet
    // (it appears in the bet row's market question column)
    const betRows = screen.getAllByText(mockMarket.question);
    // At least one occurrence is in the MeineWettenPanel bet list
    expect(betRows.length).toBeGreaterThanOrEqual(1);
  });
});

// ─── Task 32.2 — Navigation integration ──────────────────────────────────────

describe('32.2 Navigation integration', () => {
  beforeEach(() => {
    // Reset stores
    useMarketStore.setState({ openMarkets: [], settledMarkets: [], activeFilter: 'Alle' });
    useBetStore.setState({ bets: [], sessionPnL: 0 });
    useMatchStore.setState({
      matches: [],
      currentMatch: null,
      events: [],
      connectionStatus: 'disconnected',
      connectionError: null,
    });

    // Stub transport and API client for all navigation tests
    const transport = new StubTransport();
    vi.spyOn(dataSource, 'createTransport').mockReturnValue(transport);
    vi.spyOn(dataSource, 'createApiClient').mockReturnValue({
      getLiveMatches: vi.fn().mockResolvedValue([mockMatch]),
      getMatch: vi.fn().mockResolvedValue(mockMatch),
      placeBet: vi.fn(),
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  /**
   * Renders the full route tree using MemoryRouter + Routes, mirroring the
   * structure of router/index.tsx but using MemoryRouter for test isolation.
   */
  function renderRoutes(initialPath: string) {
    return render(
      <MemoryRouter initialEntries={[initialPath]}>
        <Routes>
          <Route path="/live-predict" element={<LivePredictLayout />}>
            <Route index element={<MatchListPage />} />
            <Route
              path=":matchId"
              element={
                <Suspense fallback={<div>Laden…</div>}>
                  <MatchDetailPage />
                </Suspense>
              }
            />
            <Route path="meine-wetten" element={<HistoryPage />} />
          </Route>
        </Routes>
      </MemoryRouter>,
    );
  }

  // ── Requirement 19.2 — /live-predict renders MatchListPage ───────────────────

  it('renders MatchListPage at /live-predict', async () => {
    renderRoutes('/live-predict');

    // MatchListPage renders the "Live Predict" section title
    await waitFor(() => {
      expect(screen.getByRole('heading', { name: de.navLinkText })).toBeInTheDocument();
    });
  });

  // ── Requirement 19.2 — /live-predict/:matchId renders MatchDetailPage ────────

  it('renders MatchDetailPage at /live-predict/:matchId', async () => {
    renderRoutes(`/live-predict/${MATCH_ID}`);

    // MatchDetailPage renders the Scoreboard section which contains team names
    // after the match metadata is fetched. We wait for the page container.
    await waitFor(() => {
      // The page div is rendered immediately; the match data loads asynchronously.
      // We verify the route rendered the correct page by checking for the
      // MeineWettenPanel section which is always present on MatchDetailPage.
      expect(screen.getByRole('region', { name: 'Meine Wetten' })).toBeInTheDocument();
    });
  });

  // ── Requirement 19.2 — /live-predict/meine-wetten renders HistoryPage ────────

  it('renders HistoryPage at /live-predict/meine-wetten', () => {
    renderRoutes('/live-predict/meine-wetten');

    // HistoryPage renders a "Meine Wetten" heading
    expect(screen.getByRole('heading', { name: 'Meine Wetten' })).toBeInTheDocument();

    // HistoryPage renders the summary region
    expect(screen.getByRole('region', { name: 'Zusammenfassung' })).toBeInTheDocument();
  });

  // ── Requirement 3.1 — DemomodusBanner present on all three routes ─────────────

  it('shows DemomodusBanner on /live-predict (MatchListPage)', async () => {
    renderRoutes('/live-predict');

    await waitFor(() => {
      expect(screen.getByText(de.demomodusBanner)).toBeInTheDocument();
    });
  });

  it('shows DemomodusBanner on /live-predict/:matchId (MatchDetailPage)', async () => {
    renderRoutes(`/live-predict/${MATCH_ID}`);

    await waitFor(() => {
      expect(screen.getByText(de.demomodusBanner)).toBeInTheDocument();
    });
  });

  it('shows DemomodusBanner on /live-predict/meine-wetten (HistoryPage)', () => {
    renderRoutes('/live-predict/meine-wetten');

    expect(screen.getByText(de.demomodusBanner)).toBeInTheDocument();
  });
});
