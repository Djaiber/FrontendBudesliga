/**
 * Unit tests for useMatchStream reconnection logic.
 *
 * Validates: Requirements 14.2, 14.3, 14.5, 19.5
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useMatchStream } from '../hooks/useMatchStream';
import type { ITransport, WSMessage } from '../transport/ITransport';
import * as dataSource from '../config/dataSource';

// ---------------------------------------------------------------------------
// Mock transport factory
// ---------------------------------------------------------------------------

/**
 * Creates a mock ITransport whose connect() fires onClose asynchronously
 * (via queueMicrotask), simulating a connection that drops right away but
 * after the synchronous post-connect setup in the hook has completed.
 *
 * This mirrors real-world behaviour: the hook calls setStatus('connected')
 * synchronously after transport.connect(), and then onClose fires later.
 */
function createMockTransport(): ITransport & {
  connectCallCount: number;
  disconnectCallCount: number;
} {
  const transport = {
    connectCallCount: 0,
    disconnectCallCount: 0,
    onMessage: null as ((msg: WSMessage) => void) | null,
    onClose: null as (() => void) | null,
    connect() {
      this.connectCallCount++;
      // Fire onClose asynchronously so the hook's post-connect setStatus('connected')
      // runs first, then onClose triggers the retry/error logic.
      const handler = this.onClose;
      if (handler) {
        queueMicrotask(() => handler());
      }
    },
    disconnect() {
      this.disconnectCallCount++;
    },
  };
  return transport;
}

// ---------------------------------------------------------------------------
// Default hook options
// ---------------------------------------------------------------------------

const defaultOptions = {
  matchId: 'match-1',
  onFrame: vi.fn(),
  onEvent: vi.fn(),
  onMarketNew: vi.fn(),
  onMarketUpdate: vi.fn(),
  onMarketSettled: vi.fn(),
};

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('useMatchStream reconnection logic', () => {
  let mockTransport: ReturnType<typeof createMockTransport>;

  beforeEach(() => {
    vi.useFakeTimers();
    mockTransport = createMockTransport();
    vi.spyOn(dataSource, 'createTransport').mockReturnValue(mockTransport);
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  // ── Req 14.2 — Exponential back-off delays ──────────────────────────────────

  describe('Exponential back-off (Req 14.2)', () => {
    it('schedules a retry with 1 s delay after the 1st failure', async () => {
      const setTimeoutSpy = vi.spyOn(globalThis, 'setTimeout');

      renderHook(() => useMatchStream(defaultOptions));

      // Flush microtasks so the async onClose fires and schedules the retry timer
      await act(async () => {});

      // After the initial connect() fires onClose (attempt 1), a 1000 ms timer
      // should be scheduled.
      const retryCall = setTimeoutSpy.mock.calls.find(([, delay]) => delay === 1000);
      expect(retryCall).toBeDefined();
    });

    it('schedules a retry with 2 s delay after the 2nd failure', async () => {
      const setTimeoutSpy = vi.spyOn(globalThis, 'setTimeout');

      renderHook(() => useMatchStream(defaultOptions));

      // Flush microtasks → 1 s timer scheduled
      await act(async () => {});
      // Advance past the 1 s timer → triggers connect(2) → flush microtasks → 2 s timer
      await act(async () => { vi.advanceTimersByTime(1000); });

      const retryCall = setTimeoutSpy.mock.calls.find(([, delay]) => delay === 2000);
      expect(retryCall).toBeDefined();
    });

    it('schedules a retry with 4 s delay after the 3rd failure', async () => {
      const setTimeoutSpy = vi.spyOn(globalThis, 'setTimeout');

      renderHook(() => useMatchStream(defaultOptions));

      await act(async () => {});
      await act(async () => { vi.advanceTimersByTime(1000); }); // fires connect(2) → 2 s timer
      await act(async () => { vi.advanceTimersByTime(2000); }); // fires connect(3) → 4 s timer

      const retryCall = setTimeoutSpy.mock.calls.find(([, delay]) => delay === 4000);
      expect(retryCall).toBeDefined();
    });

    it('schedules a retry with 8 s delay after the 4th failure', async () => {
      const setTimeoutSpy = vi.spyOn(globalThis, 'setTimeout');

      renderHook(() => useMatchStream(defaultOptions));

      await act(async () => {});
      await act(async () => { vi.advanceTimersByTime(1000); }); // 2nd attempt
      await act(async () => { vi.advanceTimersByTime(2000); }); // 3rd attempt
      await act(async () => { vi.advanceTimersByTime(4000); }); // 4th attempt → 8 s timer

      const retryCall = setTimeoutSpy.mock.calls.find(([, delay]) => delay === 8000);
      expect(retryCall).toBeDefined();
    });

    it('does not schedule a 16 s retry — hook gives up after 5 failures', async () => {
      // NOTE: The hook uses attempt < MAX_RETRIES (5) to decide whether to retry.
      // attempt 1 → delay 1 s → connect(2)
      // attempt 2 → delay 2 s → connect(3)
      // attempt 3 → delay 4 s → connect(4)
      // attempt 4 → delay 8 s → connect(5)
      // attempt 5 → attempt < 5 is FALSE → sets error (no 16 s timer)
      //
      // Therefore the 16 s delay is never scheduled; the hook gives up after
      // 5 consecutive failures.  This test documents that behaviour explicitly.
      const setTimeoutSpy = vi.spyOn(globalThis, 'setTimeout');

      renderHook(() => useMatchStream(defaultOptions));

      await act(async () => {});
      await act(async () => { vi.advanceTimersByTime(1000); });  // attempt 2
      await act(async () => { vi.advanceTimersByTime(2000); });  // attempt 3
      await act(async () => { vi.advanceTimersByTime(4000); });  // attempt 4
      await act(async () => { vi.advanceTimersByTime(8000); });  // attempt 5 → error, no more timers

      // No 16 s timer should have been scheduled
      const sixteenSecondCall = setTimeoutSpy.mock.calls.find(([, delay]) => delay === 16000);
      expect(sixteenSecondCall).toBeUndefined();
    });
  });

  // ── Req 14.3 — Error status after 5 failures ────────────────────────────────

  describe('Error status after 5 failures (Req 14.3)', () => {
    it('sets connectionStatus to "error" after 5 consecutive failures', async () => {
      const { result } = renderHook(() => useMatchStream(defaultOptions));

      // Drive through all 5 attempts (flush microtasks between each timer advance)
      await act(async () => {});
      await act(async () => { vi.advanceTimersByTime(1000); });  // attempt 2
      await act(async () => { vi.advanceTimersByTime(2000); });  // attempt 3
      await act(async () => { vi.advanceTimersByTime(4000); });  // attempt 4
      await act(async () => { vi.advanceTimersByTime(8000); });  // attempt 5 → error

      expect(result.current.connectionStatus).toBe('error');
    });

    it('sets connectionError to the German error string after 5 failures', async () => {
      const { result } = renderHook(() => useMatchStream(defaultOptions));

      await act(async () => {});
      await act(async () => { vi.advanceTimersByTime(1000); });
      await act(async () => { vi.advanceTimersByTime(2000); });
      await act(async () => { vi.advanceTimersByTime(4000); });
      await act(async () => { vi.advanceTimersByTime(8000); });

      expect(result.current.connectionError).toBe(
        'Verbindung unterbrochen – bitte Seite neu laden',
      );
    });

    it('does not schedule any further retry after 5 failures', async () => {
      const setTimeoutSpy = vi.spyOn(globalThis, 'setTimeout');

      renderHook(() => useMatchStream(defaultOptions));

      await act(async () => {});
      await act(async () => { vi.advanceTimersByTime(1000); });
      await act(async () => { vi.advanceTimersByTime(2000); });
      await act(async () => { vi.advanceTimersByTime(4000); });
      await act(async () => { vi.advanceTimersByTime(8000); });

      const callCountAfterFiveFailures = setTimeoutSpy.mock.calls.length;

      // Advance time further — no new timers should fire
      await act(async () => { vi.advanceTimersByTime(60_000); });

      expect(setTimeoutSpy.mock.calls.length).toBe(callCountAfterFiveFailures);
    });
  });

  // ── Req 14.5 — Cleanup on unmount ───────────────────────────────────────────

  describe('Cleanup on unmount (Req 14.5)', () => {
    it('calls transport.disconnect() when the hook unmounts', () => {
      // Use a transport that does NOT immediately close so we can unmount cleanly
      const stableTransport: ITransport = {
        onMessage: null,
        onClose: null,
        connect: vi.fn(),
        disconnect: vi.fn(),
      };
      vi.spyOn(dataSource, 'createTransport').mockReturnValue(stableTransport);

      const { unmount } = renderHook(() => useMatchStream(defaultOptions));

      unmount();

      expect(stableTransport.disconnect).toHaveBeenCalledTimes(1);
    });

    it('cancels a pending retry timer when the hook unmounts', async () => {
      const clearTimeoutSpy = vi.spyOn(globalThis, 'clearTimeout');

      const { unmount } = renderHook(() => useMatchStream(defaultOptions));

      // Flush microtasks so the async onClose fires and schedules the 1 s retry timer
      await act(async () => {});

      // Unmount while the 1 s retry timer is still pending
      unmount();

      // clearTimeout should have been called to cancel the pending timer
      expect(clearTimeoutSpy).toHaveBeenCalled();
    });

    it('does not attempt to reconnect after unmount', async () => {
      // Use the immediately-closing transport
      const { unmount } = renderHook(() => useMatchStream(defaultOptions));

      // Flush microtasks so the 1 s retry timer is scheduled
      await act(async () => {});

      // Unmount before the 1 s retry fires
      unmount();

      const connectCallsBefore = mockTransport.connectCallCount;

      // Advance time — the cancelled timer should not trigger a new connect
      act(() => { vi.advanceTimersByTime(5000); });

      expect(mockTransport.connectCallCount).toBe(connectCallsBefore);
    });
  });

  // ── Req 19.5 — createTransport called with correct matchId ──────────────────

  describe('Transport creation (Req 19.5)', () => {
    it('calls createTransport with the provided matchId on initial connect', () => {
      renderHook(() => useMatchStream({ ...defaultOptions, matchId: 'match-42' }));

      expect(dataSource.createTransport).toHaveBeenCalledWith('match-42');
    });

    it('calls createTransport again on each retry attempt', async () => {
      renderHook(() => useMatchStream(defaultOptions));

      // Initial call + 1 retry
      await act(async () => {});                              // flush microtasks → 1 s timer
      await act(async () => { vi.advanceTimersByTime(1000); }); // fires connect(2)

      expect(dataSource.createTransport).toHaveBeenCalledTimes(2);
    });
  });
});
