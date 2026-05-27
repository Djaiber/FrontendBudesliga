import { useCallback, useEffect, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import { fetchAuthSession } from 'aws-amplify/auth';
import { createApiClient } from '../../config/dataSource';
import { de } from '../../i18n/de';
import { useMatchStore } from '../../store/matchStore';
import { useMarketStore } from '../../store/marketStore';
import { useBetStore } from '../../store/betStore';
import { useRoomStore } from '../../store/roomStore';
import { useMatchStream } from '../../hooks/useMatchStream';
import { websocket } from '../../transport/websocket';
import type { Frame } from '../../types/frame';
import type { MiniMarket, Outcome } from '../../types/market';
import { Scoreboard } from '../sections/Scoreboard/Scoreboard';
import { MetricsBar } from '../sections/MetricsBar/MetricsBar';
import { PitchView } from '../sections/PitchView/PitchView';
import { Timeline } from '../sections/Timeline/Timeline';
import { MarketsFeed } from '../sections/MarketsFeed/MarketsFeed';
import { MeineWettenPanel } from '../sections/MeineWettenPanel/MeineWettenPanel';
import { BetSlip } from '../sections/BetSlip/BetSlip';
import { PredictionWindow } from '../games/PredictionWindow';
import { Leaderboard } from '../room/Leaderboard';
import { EventFeed } from '../room/EventFeed';
import { EmojiReactions } from '../room/EmojiReactions';
import { MergeNotification } from '../room/MergeNotification';
import { MatchClock } from '../room/MatchClock';
import styles from './MatchDetailPage.module.css';

/**
 * MatchDetailPage
 *
 * Match detail view at `/live-predict/:matchId`.
 *
 * Layout (two-column, 60/40):
 *   Left:  Scoreboard, MetricsBar, PitchView, PredictionWindow, Timeline
 *   Right: Leaderboard, EmojiReactions, EventFeed, MarketsFeed
 *   Below: MeineWettenPanel
 *   Overlay: BetSlip (modal), MergeNotification (full-screen)
 *
 * Connected Arena lifecycle:
 *   mount   → fetchAuthSession → websocket.connect(idToken) → joinRoom on open
 *   unmount → websocket.disconnect + leaveRoom
 */
export function MatchDetailPage() {
  const { matchId } = useParams<{ matchId: string }>();

  // ── Match store ───────────────────────────────────────────────────────────
  const setCurrentMatch = useMatchStore((s) => s.setCurrentMatch);
  const applyGoal = useMatchStore((s) => s.applyGoal);
  const addEvent = useMatchStore((s) => s.addEvent);
  const addXG = useMatchStore((s) => s.addXG);
  const addShot = useMatchStore((s) => s.addShot);
  const setSprintCount = useMatchStore((s) => s.setSprintCount);
  const setMatchMinute = useMatchStore((s) => s.setMatchMinute);
  const currentMatch = useMatchStore((s) => s.currentMatch);

  // ── Market / bet store ────────────────────────────────────────────────────
  const addMarket = useMarketStore((s) => s.addMarket);
  const updateMarket = useMarketStore((s) => s.updateMarket);
  const settleMarket = useMarketStore((s) => s.settleMarket);
  const openMarkets = useMarketStore((s) => s.openMarkets);
  const bets = useBetStore((s) => s.bets);
  const settleBet = useBetStore((s) => s.settleBet);

  // ── Room store ────────────────────────────────────────────────────────────
  const joinRoom = useRoomStore((s) => s.joinRoom);
  const leaveRoom = useRoomStore((s) => s.leaveRoom);

  // ── Refs / local state ────────────────────────────────────────────────────
  const frameRef = useRef<Frame | null>(null);
  const [selectedOutcome, setSelectedOutcome] = useState<Outcome | null>(null);
  const [selectedMarket, setSelectedMarket] = useState<MiniMarket | null>(null);
  const triggerRef = useRef<HTMLElement | null>(null);
  const [showExpiredToast, setShowExpiredToast] = useState(false);

  // ── Fetch match metadata ──────────────────────────────────────────────────
  useEffect(() => {
    if (!matchId) return;
    createApiClient().getMatch(matchId).then(setCurrentMatch).catch(console.error);
  }, [matchId, setCurrentMatch]);

  // ── Arena WebSocket lifecycle ─────────────────────────────────────────────
  useEffect(() => {
    let unsubState: (() => void) | undefined;

    const connectWs = (token: string) => {
      console.log('[Arena] Connecting with token:', token.substring(0, 20) + '...');
      unsubState = websocket.onStateChange((state) => {
        console.log('[Arena] State changed to:', state);
        if (state === 'open') {
          console.log('[Arena] Calling joinRoom()');
          joinRoom();
        }
      });
      websocket.connect(token);
      console.log('[Arena] Current state after connect:', websocket.connectionState);
      // Also check if already open (race condition)
      if (websocket.connectionState === 'open') {
        console.log('[Arena] Already open, calling joinRoom immediately');
        joinRoom();
      }
    };

    console.log('[Arena] useEffect: Starting WebSocket lifecycle');
    fetchAuthSession()
      .then(({ tokens }) => {
        const idToken = tokens?.idToken?.toString();
        console.log('[Arena] Auth session result - has token:', !!idToken);
        connectWs(idToken || 'dev-token');
      })
      .catch((err) => {
        console.log('[Arena] Auth session failed, using dev-token:', err);
        connectWs('dev-token');
      });

    return () => {
      unsubState?.();
      websocket.disconnect();
      leaveRoom();
    };
  }, [joinRoom, leaveRoom]);

  // ── Stream callbacks ──────────────────────────────────────────────────────
  const handleFrame = useCallback(
    (frame: Frame) => {
      frameRef.current = frame;
      setSprintCount(frame.players.filter((p) => p.speedKmh >= 25).length);
    },
    [setSprintCount],
  );

  const handleEvent = useCallback(
    (event: Parameters<typeof addEvent>[0]) => {
      addEvent(event);
      setMatchMinute(event.minute);
      if (event.type === 'goal') applyGoal(event.teamSide);
      if ((event.type === 'shot' || event.type === 'goal') && event.xG != null)
        addXG(event.teamSide, event.xG);
      if (event.type === 'shot' || event.type === 'goal') addShot(event.teamSide);
    },
    [addEvent, setMatchMinute, applyGoal, addXG, addShot],
  );

  const handleMarketNew = useCallback(
    (market: MiniMarket) => addMarket(market),
    [addMarket],
  );

  const handleMarketUpdate = useCallback(
    (patch: Partial<MiniMarket> & { id: string }) => updateMarket(patch.id, patch),
    [updateMarket],
  );

  const handleMarketSettled = useCallback(
    (id: string, winningOutcomeId: string) => {
      settleMarket(id, winningOutcomeId);
      for (const bet of bets.filter((b) => b.marketId === id && b.status === 'ausstehend')) {
        settleBet(bet.id, bet.outcomeId === winningOutcomeId);
      }
    },
    [settleMarket, bets, settleBet],
  );

  const { connectionStatus } = useMatchStream({
    matchId: matchId ?? '',
    onFrame: handleFrame,
    onEvent: handleEvent,
    onMarketNew: handleMarketNew,
    onMarketUpdate: handleMarketUpdate,
    onMarketSettled: handleMarketSettled,
  });

  // ── BetSlip handlers ──────────────────────────────────────────────────────
  const handleOutcomeClickFromFeed = useCallback(
    (outcome: Outcome) => {
      const market = openMarkets.find((m) => m.outcomes.some((o) => o.id === outcome.id));
      if (!market) return;
      setSelectedOutcome(outcome);
      setSelectedMarket(market);
    },
    [openMarkets],
  );

  const handleBetSlipClose = useCallback((expired?: boolean) => {
    setSelectedOutcome(null);
    setSelectedMarket(null);
    if (expired) {
      setShowExpiredToast(true);
      setTimeout(() => setShowExpiredToast(false), 4000);
    }
  }, []);

  const pitchAriaLabel = currentMatch
    ? `${currentMatch.homeTeam.name} vs ${currentMatch.awayTeam.name}`
    : 'Spielfeld';

  return (
    <div className={styles.page}>
      {connectionStatus === 'error' && (
        <div className={styles.connectionError} role="alert" aria-live="assertive">
          {de.connectionError}
        </div>
      )}

      {showExpiredToast && (
        <div className={styles.toast} role="status" aria-live="polite">
          {de.marketExpired}
        </div>
      )}

      <div className={styles.layout}>
        {/* Left — Live Match Tracker + prediction widget */}
        <div className={styles.leftColumn}>
          <Scoreboard />
          <MetricsBar />
          <PitchView frameRef={frameRef} ariaLabel={pitchAriaLabel} />
          <PredictionWindow />
          <Timeline />
        </div>

        {/* Right — Arena panel + markets */}
        <div className={styles.rightColumn}>
          <MatchClock />
          <Leaderboard />
          <EmojiReactions />
          <EventFeed />
          <MarketsFeed onOutcomeClick={handleOutcomeClickFromFeed} />
        </div>
      </div>

      <MeineWettenPanel />

      {selectedOutcome !== null && selectedMarket !== null && (
        <BetSlip
          market={selectedMarket}
          selectedOutcome={selectedOutcome}
          onClose={handleBetSlipClose}
          triggerRef={triggerRef as React.RefObject<HTMLElement>}
        />
      )}

      {/* Full-screen overlay when server merges rooms */}
      <MergeNotification />
    </div>
  );
}

export default MatchDetailPage;
