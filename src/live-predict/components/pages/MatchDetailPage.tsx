import { useCallback, useEffect, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import { createApiClient } from '../../config/dataSource';
import { de } from '../../i18n/de';
import { useMatchStore } from '../../store/matchStore';
import { useMarketStore } from '../../store/marketStore';
import { useBetStore } from '../../store/betStore';
import { usePointsStore } from '../../store/pointsStore';
import { useMatchStream } from '../../hooks/useMatchStream';
import type { Frame } from '../../types/frame';
import type { MiniMarket, Outcome } from '../../types/market';
import { Scoreboard } from '../sections/Scoreboard/Scoreboard';
import { MetricsBar } from '../sections/MetricsBar/MetricsBar';
import { PitchView } from '../sections/PitchView/PitchView';
import { Timeline } from '../sections/Timeline/Timeline';
import { MarketsFeed } from '../sections/MarketsFeed/MarketsFeed';
import { MeineWettenPanel } from '../sections/MeineWettenPanel/MeineWettenPanel';
import { BetSlip } from '../sections/BetSlip/BetSlip';
import styles from './MatchDetailPage.module.css';

/**
 * MatchDetailPage
 *
 * The main match detail view at `/live-predict/:matchId`.
 *
 * Layout:
 *   - Two-column grid (60% / 40%) that stacks vertically below 900 px.
 *   - Left column: Scoreboard, MetricsBar, PitchView, Timeline.
 *   - Right column: MarketsFeed (includes FilterPills internally).
 *   - Below columns: MeineWettenPanel.
 *   - BetSlip modal rendered conditionally when an OutcomeButton is clicked.
 *
 * Data flow:
 *   - Reads matchId from useParams.
 *   - Fetches match metadata via createApiClient().getMatch() on mount.
 *   - Connects to the live stream via useMatchStream; routes callbacks to
 *     matchStore, marketStore, betStore, and frameRef.
 *   - Shows a German connection-error banner when connectionStatus === 'error'.
 *
 * Validates: Requirements 5.1, 5.2, 5.3, 5.4, 5.5, 14.3
 */
export function MatchDetailPage() {
  // ── Route param ─────────────────────────────────────────────────────────────
  const { matchId } = useParams<{ matchId: string }>();

  // ── Store actions ────────────────────────────────────────────────────────────
  const setCurrentMatch = useMatchStore((s) => s.setCurrentMatch);
  const applyGoal = useMatchStore((s) => s.applyGoal);
  const addEvent = useMatchStore((s) => s.addEvent);
  const addXG = useMatchStore((s) => s.addXG);
  const addShot = useMatchStore((s) => s.addShot);
  const setSprintCount = useMatchStore((s) => s.setSprintCount);

  const setMinute = useMatchStore((s) => s.setMinute);
  const setPossession = useMatchStore((s) => s.setPossession);

  const addMarket = useMarketStore((s) => s.addMarket);
  const updateMarket = useMarketStore((s) => s.updateMarket);
  const settleMarket = useMarketStore((s) => s.settleMarket);

  const bets = useBetStore((s) => s.bets);
  const settleBet = useBetStore((s) => s.settleBet);
  const awardPoints = usePointsStore((s) => s.awardPoints);

  // ── Store reads ──────────────────────────────────────────────────────────────
  const currentMatch = useMatchStore((s) => s.currentMatch);

  // ── Frame ref — written by onFrame, read by PitchView's rAF loop ─────────────
  const frameRef = useRef<Frame | null>(null);

  // ── First-frame timestamp — used to derive live match minute ─────────────────
  // The transport sets frame.timestamp = connectTime + offsetMs, so
  // (frame.timestamp - firstFrameTs) gives true elapsed match time in ms.
  const firstFrameTsRef = useRef<number | null>(null);

  // ── BetSlip state ────────────────────────────────────────────────────────────
  const [selectedOutcome, setSelectedOutcome] = useState<Outcome | null>(null);
  const [selectedMarket, setSelectedMarket] = useState<MiniMarket | null>(null);
  // Ref to the OutcomeButton that triggered the modal (for focus return)
  const triggerRef = useRef<HTMLElement | null>(null);

  // ── Toast state ──────────────────────────────────────────────────────────────
  const [showExpiredToast, setShowExpiredToast] = useState(false);

  // ── Fetch match metadata on mount ────────────────────────────────────────────
  useEffect(() => {
    if (!matchId) return;
    createApiClient()
      .getMatch(matchId)
      .then(setCurrentMatch)
      .catch(console.error);
  }, [matchId, setCurrentMatch]);

  // ── Stream callbacks ─────────────────────────────────────────────────────────

  const handleFrame = useCallback(
    (frame: Frame) => {
      // Write directly to ref — no Zustand, no re-render (Req 7.5, 16.3)
      frameRef.current = frame;

      // ── Live match minute ─────────────────────────────────────────────────
      if (firstFrameTsRef.current === null) {
        firstFrameTsRef.current = frame.timestamp;
      }
      const elapsedMs = frame.timestamp - firstFrameTsRef.current;
      setMinute(Math.floor(elapsedMs / 60_000));

      // ── Possession (ball-position proxy) ─────────────────────────────────
      // Home attacks right (x increases). Ball closer to x=105 → home possession.
      const homePct = Math.round((frame.ball.x / 105) * 100);
      setPossession(homePct, 100 - homePct);

      // ── Sprint count ──────────────────────────────────────────────────────
      const sprinting = frame.players.filter((p) => p.speedKmh >= 25).length;
      setSprintCount(sprinting);
    },
    [setMinute, setPossession, setSprintCount],
  );

  const handleEvent = useCallback(
    (event: Parameters<typeof addEvent>[0]) => {
      addEvent(event);

      if (event.type === 'goal') {
        applyGoal(event.teamSide);
      }

      if ((event.type === 'shot' || event.type === 'goal') && event.xG != null) {
        addXG(event.teamSide, event.xG);
      }

      if (event.type === 'shot' || event.type === 'goal') {
        addShot(event.teamSide);
      }
    },
    [addEvent, applyGoal, addXG, addShot],
  );

  const handleMarketNew = useCallback(
    (market: MiniMarket) => {
      addMarket(market);
    },
    [addMarket],
  );

  const handleMarketUpdate = useCallback(
    (patch: Partial<MiniMarket> & { id: string }) => {
      updateMarket(patch.id, patch);
    },
    [updateMarket],
  );

  const handleMarketSettled = useCallback(
    (id: string, winningOutcomeId: string) => {
      settleMarket(id, winningOutcomeId);

      // Settle any user bets on this market
      const matchingBets = bets.filter(
        (b) => b.marketId === id && b.status === 'ausstehend',
      );
      for (const bet of matchingBets) {
        const won = bet.outcomeId === winningOutcomeId;
        settleBet(bet.id, won);
        if (won) awardPoints(bet.potentialReturn);
      }
    },
    [settleMarket, bets, settleBet, awardPoints],
  );

  // ── Connect to live stream ────────────────────────────────────────────────────
  const { connectionStatus } = useMatchStream({
    matchId: matchId ?? '',
    onFrame: handleFrame,
    onEvent: handleEvent,
    onMarketNew: handleMarketNew,
    onMarketUpdate: handleMarketUpdate,
    onMarketSettled: handleMarketSettled,
  });

  // ── OutcomeButton click handler ───────────────────────────────────────────────
  const handleOutcomeClick = useCallback(
    (outcome: Outcome, market: MiniMarket, trigger?: HTMLElement | null) => {
      setSelectedOutcome(outcome);
      setSelectedMarket(market);
      if (trigger) {
        triggerRef.current = trigger;
      }
    },
    [],
  );

  // MarketsFeed only passes Outcome; we need to find the market from the store.
  // MarketsFeed's onOutcomeClick signature is (outcome: Outcome) => void.
  // We wrap it to look up the market from the store.
  const openMarkets = useMarketStore((s) => s.openMarkets);

  const handleOutcomeClickFromFeed = useCallback(
    (outcome: Outcome) => {
      const market = openMarkets.find((m) =>
        m.outcomes.some((o) => o.id === outcome.id),
      );
      if (market) {
        handleOutcomeClick(outcome, market);
      }
    },
    [openMarkets, handleOutcomeClick],
  );

  // ── BetSlip close handler ─────────────────────────────────────────────────────
  const handleBetSlipClose = useCallback((expired?: boolean) => {
    setSelectedOutcome(null);
    setSelectedMarket(null);
    if (expired) {
      setShowExpiredToast(true);
      // Auto-dismiss toast after 4 seconds
      setTimeout(() => setShowExpiredToast(false), 4000);
    }
  }, []);

  // ── Aria label for PitchView ──────────────────────────────────────────────────
  const pitchAriaLabel = currentMatch
    ? `${currentMatch.homeTeam.name} vs ${currentMatch.awayTeam.name}`
    : 'Spielfeld';

  // ── Render ───────────────────────────────────────────────────────────────────
  return (
    <div className={styles.page}>
      {/* ── Connection error banner ──────────────────────────────────────── */}
      {connectionStatus === 'error' && (
        <div className={styles.connectionError} role="alert" aria-live="assertive">
          {de.connectionError}
        </div>
      )}

      {/* ── Market expired toast ─────────────────────────────────────────── */}
      {showExpiredToast && (
        <div className={styles.toast} role="status" aria-live="polite">
          {de.marketExpired}
        </div>
      )}

      {/* ── Two-column grid ──────────────────────────────────────────────── */}
      <div className={styles.layout}>
        {/* Left column (60%) */}
        <div className={styles.leftColumn}>
          <Scoreboard />
          <MetricsBar />
          <PitchView frameRef={frameRef} ariaLabel={pitchAriaLabel} />
          <Timeline />
        </div>

        {/* Right column (40%) */}
        <div className={styles.rightColumn}>
          <MarketsFeed onOutcomeClick={handleOutcomeClickFromFeed} />
        </div>
      </div>

      {/* ── Meine Wetten panel (below columns) ──────────────────────────── */}
      <MeineWettenPanel />

      {/* ── BetSlip modal (conditional) ─────────────────────────────────── */}
      {selectedOutcome !== null && selectedMarket !== null && (
        <BetSlip
          market={selectedMarket}
          selectedOutcome={selectedOutcome}
          onClose={handleBetSlipClose}
          triggerRef={triggerRef as React.RefObject<HTMLElement>}
        />
      )}
    </div>
  );
}

export default MatchDetailPage;
