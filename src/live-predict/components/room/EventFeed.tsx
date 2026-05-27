import { useState, useEffect, useRef } from 'react';
import { websocket } from '../../transport/websocket';
import { useTranslation } from '../../hooks/useTranslation';
import styles from './EventFeed.module.css';

interface FeedEvent {
  id: number;
  minute: number;
  eventType: string;
  team: string;
}

const EVENT_KEY: Record<string, string> = {
  corner:       'event.corner',
  goal:         'event.goal',
  foul:         'event.foul',
  yellow:       'event.yellow',
  red:          'event.red',
  substitution: 'event.substitution',
};

const MAX_EVENTS = 20;
let seq = 0;

export function EventFeed() {
  const { t } = useTranslation();
  const [events, setEvents] = useState<FeedEvent[]>([]);
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (msg: unknown) => {
      console.log('[EventFeed] Received match_event:', msg);
      const m = msg as { minute: number; event_type: string; team: string };
      setEvents((prev) => [
        { id: ++seq, minute: m.minute, eventType: m.event_type, team: m.team },
        ...prev.slice(0, MAX_EVENTS - 1),
      ]);
    };
    websocket.on('match_event', handler as Parameters<typeof websocket.on>[1]);
    return () => websocket.off('match_event', handler as Parameters<typeof websocket.off>[1]);
  }, []);

  useEffect(() => {
    if (listRef.current) listRef.current.scrollTop = 0;
  }, [events]);

  if (events.length === 0) return null;

  return (
    <div className={styles.feed} ref={listRef}>
      {events.map((ev) => {
        const key = EVENT_KEY[ev.eventType];
        const label = key ? t(key as Parameters<typeof t>[0]) : ev.eventType;
        return (
          <div key={ev.id} className={styles.entry}>
            <span className={styles.time}>{ev.minute}'</span>
            <span className={styles.type}>{label}</span>
            <span className={styles.team}>{ev.team}</span>
          </div>
        );
      })}
    </div>
  );
}