/**
 * Unit tests for MatchListPage filtering behaviour.
 *
 * Validates: Requirements 4.1, 4.5, 19.5
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { MatchListPage } from '../components/pages/MatchListPage';
import { useMatchStore } from '../store/matchStore';
import * as dataSource from '../config/dataSource';
import type { Match } from '../types/match';

// ─── Test fixtures ────────────────────────────────────────────────────────────

const makeMatch = (id: string, status: Match['status']): Match => ({
  id,
  homeTeam: { id: `home-${id}`, name: `Home ${id}`, shortName: 'HOM', logoUrl: '' },
  awayTeam: { id: `away-${id}`, name: `Away ${id}`, shortName: 'AWY', logoUrl: '' },
  homeScore: 0,
  awayScore: 0,
  minute: 0,
  status,
  openMarketCount: 0,
});

const liveMatch = makeMatch('match-live', 'live');
const upcomingMatch = makeMatch('match-upcoming', 'upcoming');
const finishedMatch = makeMatch('match-finished', 'finished');

// ─── Helpers ──────────────────────────────────────────────────────────────────

function renderMatchListPage() {
  return render(
    <MemoryRouter>
      <MatchListPage />
    </MemoryRouter>,
  );
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('MatchListPage', () => {
  beforeEach(() => {
    // Reset store before each test
    useMatchStore.setState({ matches: [] });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // ── Requirement 4.1 — Only live and upcoming matches are shown ────────────

  describe('Filtering (Req 4.1)', () => {
    it('renders only live and upcoming match cards from a mixed-status array', async () => {
      vi.spyOn(dataSource, 'createApiClient').mockReturnValue({
        getLiveMatches: vi.fn().mockResolvedValue([liveMatch, upcomingMatch, finishedMatch]),
        getMatch: vi.fn(),
        placeBet: vi.fn(),
      });

      renderMatchListPage();

      await waitFor(() => {
        expect(
          screen.getByLabelText(`${liveMatch.homeTeam.name} vs ${liveMatch.awayTeam.name}`),
        ).toBeInTheDocument();
      });

      expect(
        screen.getByLabelText(`${upcomingMatch.homeTeam.name} vs ${upcomingMatch.awayTeam.name}`),
      ).toBeInTheDocument();

      // Finished match must NOT appear
      expect(
        screen.queryByLabelText(
          `${finishedMatch.homeTeam.name} vs ${finishedMatch.awayTeam.name}`,
        ),
      ).not.toBeInTheDocument();
    });

    it('renders only the live match when only a live match is present', async () => {
      vi.spyOn(dataSource, 'createApiClient').mockReturnValue({
        getLiveMatches: vi.fn().mockResolvedValue([liveMatch]),
        getMatch: vi.fn(),
        placeBet: vi.fn(),
      });

      renderMatchListPage();

      await waitFor(() => {
        expect(
          screen.getByLabelText(`${liveMatch.homeTeam.name} vs ${liveMatch.awayTeam.name}`),
        ).toBeInTheDocument();
      });
    });

    it('renders only the upcoming match when only an upcoming match is present', async () => {
      vi.spyOn(dataSource, 'createApiClient').mockReturnValue({
        getLiveMatches: vi.fn().mockResolvedValue([upcomingMatch]),
        getMatch: vi.fn(),
        placeBet: vi.fn(),
      });

      renderMatchListPage();

      await waitFor(() => {
        expect(
          screen.getByLabelText(
            `${upcomingMatch.homeTeam.name} vs ${upcomingMatch.awayTeam.name}`,
          ),
        ).toBeInTheDocument();
      });
    });

    it('does not render finished matches even when they are the only matches', async () => {
      vi.spyOn(dataSource, 'createApiClient').mockReturnValue({
        getLiveMatches: vi.fn().mockResolvedValue([finishedMatch]),
        getMatch: vi.fn(),
        placeBet: vi.fn(),
      });

      renderMatchListPage();

      // Give the component time to process the response
      await waitFor(() => {
        expect(
          screen.queryByLabelText(
            `${finishedMatch.homeTeam.name} vs ${finishedMatch.awayTeam.name}`,
          ),
        ).not.toBeInTheDocument();
      });
    });
  });

  // ── Requirement 4.5 — Empty-state message when no live/upcoming matches ───

  describe('Empty state (Req 4.5)', () => {
    it('shows the empty-state message when the API returns no matches', async () => {
      vi.spyOn(dataSource, 'createApiClient').mockReturnValue({
        getLiveMatches: vi.fn().mockResolvedValue([]),
        getMatch: vi.fn(),
        placeBet: vi.fn(),
      });

      renderMatchListPage();

      await waitFor(() => {
        expect(screen.getByText('Keine Live-Spiele verfügbar')).toBeInTheDocument();
      });
    });

    it('shows the empty-state message when all returned matches are finished', async () => {
      vi.spyOn(dataSource, 'createApiClient').mockReturnValue({
        getLiveMatches: vi.fn().mockResolvedValue([finishedMatch]),
        getMatch: vi.fn(),
        placeBet: vi.fn(),
      });

      renderMatchListPage();

      await waitFor(() => {
        expect(screen.getByText('Keine Live-Spiele verfügbar')).toBeInTheDocument();
      });
    });

    it('shows the "Nächste geplante Spiele" sub-message in the empty state', async () => {
      vi.spyOn(dataSource, 'createApiClient').mockReturnValue({
        getLiveMatches: vi.fn().mockResolvedValue([]),
        getMatch: vi.fn(),
        placeBet: vi.fn(),
      });

      renderMatchListPage();

      await waitFor(() => {
        expect(screen.getByText('Nächste geplante Spiele')).toBeInTheDocument();
      });
    });

    it('does NOT show the empty-state message when live/upcoming matches exist', async () => {
      vi.spyOn(dataSource, 'createApiClient').mockReturnValue({
        getLiveMatches: vi.fn().mockResolvedValue([liveMatch]),
        getMatch: vi.fn(),
        placeBet: vi.fn(),
      });

      renderMatchListPage();

      await waitFor(() => {
        expect(
          screen.getByLabelText(`${liveMatch.homeTeam.name} vs ${liveMatch.awayTeam.name}`),
        ).toBeInTheDocument();
      });

      expect(screen.queryByText('Keine Live-Spiele verfügbar')).not.toBeInTheDocument();
    });
  });

  // ── Requirement 19.5 — Initial render before data loads ──────────────────

  describe('Initial render (Req 19.5)', () => {
    it('shows the empty state initially before data is fetched', () => {
      // API never resolves during this test
      vi.spyOn(dataSource, 'createApiClient').mockReturnValue({
        getLiveMatches: vi.fn().mockReturnValue(new Promise(() => {})),
        getMatch: vi.fn(),
        placeBet: vi.fn(),
      });

      renderMatchListPage();

      // Before data arrives, no matches in store → empty state
      expect(screen.getByText('Keine Live-Spiele verfügbar')).toBeInTheDocument();
    });
  });
});
