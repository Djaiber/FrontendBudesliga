// hooks/useMatchStream.ts
// Requirements: 14.1, 14.2, 14.3, 14.4, 14.5

import { useEffect, useRef, useState, useCallback } from 'react';
import type { ITransport } from '../transport/ITransport';
import { createTransport } from '../config/dataSource';
import { parseFrame } from '../parsers/frameParser';
import { parseKPIEvent } from '../parsers/eventParser';
import { parseMiniMarket } from '../parsers/marketParser';
import type { Frame } from '../types/frame';
import type { KPIEvent } from '../types/event';
import type { MiniMarket } from '../types/market';
import { de } from '../i18n/de';

// ---------------------------------------------------------------------------
// Public types
// ---------------------------------------------------------------------------

export interface UseMatchStreamOptions {
  matchId: string;
  onFrame: (frame: Frame) => void;
  onEvent: (event: KPIEvent) => void;
  onMarketNew: (market: MiniMarket) => void;
  onMarketUpdate: (patch: Partial<MiniMarket> & { id: string }) => void;
  onMarketSettled: (id: string, winningOutcomeId: string) => void;
}

export interface UseMatchStreamResult {
  connectionStatus: 'connecting' | 'connected' | 'error' | 'disconnected';
  connectionError: string | null;
}

// ---------------------------------------------------------------------------
// Reconnection constants
// ---------------------------------------------------------------------------

const MAX_RETRIES = 5;
const BASE_DELAY_MS = 1000;

// ---------------------------------------------------------------------------
// Hook implementation
// ---------------------------------------------------------------------------

/**
 * Connects to the live match stream for the given matchId.
 * Routes incoming messages to the appropriate callbacks.
 * Implements exponential back-off reconnection (up to 5 retries).
 *
 * Requirements: 14.1, 14.2, 14.3, 14.4, 14.5
 */
export function useMatchStream(options: UseMatchStreamOptions): UseMatchStreamResult {
  const { matchId } = options;

  // Use refs for callbacks to avoid stale closures without re-running the effect
  const onFrameRef = useRef(options.onFrame);
  const onEventRef = useRef(options.onEvent);
  const onMarketNewRef = useRef(options.onMarketNew);
  const onMarketUpdateRef = useRef(options.onMarketUpdate);
  const onMarketSettledRef = useRef(options.onMarketSettled);

  // Keep callback refs up to date on every render
  onFrameRef.current = options.onFrame;
  onEventRef.current = options.onEvent;
  onMarketNewRef.current = options.onMarketNew;
  onMarketUpdateRef.current = options.onMarketUpdate;
  onMarketSettledRef.current = options.onMarketSettled;

  const [connectionStatus, setConnectionStatus] = useState<UseMatchStreamResult['connectionStatus']>('connecting');
  const [connectionError, setConnectionError] = useState<string | null>(null);

  // Refs for transport and retry timer — stable across renders
  const transportRef = useRef<ITransport | null>(null);
  const retryTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  // frameBuffer stores the latest frame without triggering re-renders (Req 7.5, 16.3)
  const frameBuffer = useRef<Frame | null>(null);

  const setStatus = useCallback(
    (status: UseMatchStreamResult['connectionStatus'], error: string | null = null) => {
      setConnectionStatus(status);
      setConnectionError(error);
    },
    [],
  );

  useEffect(() => {
    let isMounted = true;

    function connect(attempt: number): void {
      if (!isMounted) return;

      // Disconnect any existing transport before creating a new one
      if (transportRef.current) {
        // Detach handlers before disconnecting to avoid triggering onClose
        transportRef.current.onMessage = null;
        transportRef.current.onClose = null;
        transportRef.current.disconnect();
        transportRef.current = null;
      }

      setStatus('connecting');

      const transport = createTransport(matchId);
      transportRef.current = transport;

      // Route incoming messages by type (Req 14.1)
      transport.onMessage = (msg) => {
        if (!isMounted) return;

        switch (msg.type) {
          case 'frame': {
            const result = parseFrame(msg.payload);
            if (!result.ok) {
              console.error('[useMatchStream] Frame parse error:', result.error);
              return;
            }
            // Write to frameBuffer — do NOT call any Zustand setter (Req 7.5, 16.3)
            frameBuffer.current = result.value;
            onFrameRef.current(result.value);
            break;
          }

          case 'event': {
            const result = parseKPIEvent(msg.payload);
            if (!result.ok) {
              console.error('[useMatchStream] KPIEvent parse error:', result.error);
              return;
            }
            onEventRef.current(result.value);
            break;
          }

          case 'market.new': {
            const result = parseMiniMarket(msg.payload);
            if (!result.ok) {
              console.error('[useMatchStream] market.new parse error:', result.error);
              return;
            }
            onMarketNewRef.current(result.value);
            break;
          }

          case 'market.update': {
            // market.update is a partial patch — validate id at minimum
            const payload = msg.payload as Record<string, unknown>;
            if (typeof payload?.id !== 'string' || payload.id.trim() === '') {
              console.error('[useMatchStream] market.update missing id');
              return;
            }
            onMarketUpdateRef.current(payload as Partial<MiniMarket> & { id: string });
            break;
          }

          case 'market.settled': {
            const payload = msg.payload as Record<string, unknown>;
            if (typeof payload?.id !== 'string' || payload.id.trim() === '') {
              console.error('[useMatchStream] market.settled missing id');
              return;
            }
            if (typeof payload?.winningOutcomeId !== 'string' || payload.winningOutcomeId.trim() === '') {
              console.error('[useMatchStream] market.settled missing winningOutcomeId');
              return;
            }
            onMarketSettledRef.current(payload.id, payload.winningOutcomeId);
            break;
          }

          default:
            console.warn('[useMatchStream] Unknown message type:', (msg as { type: string }).type);
        }
      };

      // Exponential back-off reconnection (Req 14.2, 14.3)
      transport.onClose = () => {
        if (!isMounted) return;

        if (attempt < MAX_RETRIES) {
          // attempt 1 → 1000ms, attempt 2 → 2000ms, ..., attempt 5 → 16000ms
          const delay = BASE_DELAY_MS * Math.pow(2, attempt - 1);
          retryTimer.current = setTimeout(() => {
            if (isMounted) {
              connect(attempt + 1);
            }
          }, delay);
        } else {
          // After 5 failures, give up (Req 14.3)
          setStatus('error', de.connectionError);
        }
      };

      transport.connect();

      // Mark as connected once connect() is called
      // (The transport will call onClose if the connection drops)
      if (isMounted) {
        setStatus('connected');
      }
    }

    // Initial connection — attempt 1
    connect(1);

    // Cleanup on unmount (Req 14.5)
    return () => {
      isMounted = false;

      // Cancel any pending retry timer
      if (retryTimer.current !== null) {
        clearTimeout(retryTimer.current);
        retryTimer.current = null;
      }

      // Disconnect transport and detach handlers
      if (transportRef.current) {
        transportRef.current.onMessage = null;
        transportRef.current.onClose = null;
        transportRef.current.disconnect();
        transportRef.current = null;
      }

      setStatus('disconnected');
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [matchId]); // Re-run only when matchId changes (Req 14.4)

  return { connectionStatus, connectionError };
}
