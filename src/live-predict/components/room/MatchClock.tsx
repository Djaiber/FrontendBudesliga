import { useState, useEffect } from 'react';
import { websocket } from '../../transport/websocket';
import styles from './MatchClock.module.css';

/**
 * MatchClock displays the current match time in real-time.
 * Updates based on incoming match_event messages from the WebSocket.
 */

export function MatchClock() {
  const [currentMinute, setCurrentMinute] = useState<number>(0);
  const [isLive, setIsLive] = useState<boolean>(false);

  useEffect(() => {
    const handler = (msg: unknown) => {
      const m = msg as { minute: number; second: number };
      setCurrentMinute(m.minute);
      setIsLive(true);
    };

    websocket.on('match_event', handler as Parameters<typeof websocket.on>[1]);

    return () => {
      websocket.off('match_event', handler as Parameters<typeof websocket.off>[1]);
      setIsLive(false);
    };
  }, []);

  if (!isLive) return null;

  return (
    <div className={styles.clock} role="timer" aria-live="polite">
      <div className={styles.label}>Match Time</div>
      <div className={styles.time}>
        <span className={styles.minute}>{currentMinute}</span>
        <span className={styles.apostrophe}>'</span>
      </div>
      <div className={styles.liveIndicator}>
        <span className={styles.dot} />
        <span className={styles.liveText}>LIVE</span>
      </div>
    </div>
  );
}
