import { useState, useEffect, useCallback } from 'react';
import { websocket } from '../../transport/websocket';
import styles from './EmojiReactions.module.css';

const EMOJIS = ['⚽', '🔥', '😱', '👏', '😂', '💀'];

interface FloatingEmoji {
  id: number;
  emoji: string;
  x: number;
}

let floatSeq = 0;

export function EmojiReactions() {
  const [floating, setFloating] = useState<FloatingEmoji[]>([]);

  const spawn = useCallback((emoji: string) => {
    const id = ++floatSeq;
    const x = 10 + Math.random() * 80;
    setFloating((prev) => [...prev, { id, emoji, x }]);
    setTimeout(() => setFloating((prev) => prev.filter((e) => e.id !== id)), 2000);
  }, []);

  useEffect(() => {
    const handler = (msg: unknown) => {
      const m = msg as { emoji: string };
      spawn(m.emoji);
    };
    websocket.on('EMOJI_BROADCAST', handler as Parameters<typeof websocket.on>[1]);
    return () => websocket.off('EMOJI_BROADCAST', handler as Parameters<typeof websocket.off>[1]);
  }, [spawn]);

  const handleClick = (emoji: string) => {
    websocket.send({ type: 'EMOJI', emoji });
    spawn(emoji);
  };

  return (
    <div className={styles.container}>
      {floating.map((fe) => (
        <span
          key={fe.id}
          className={styles.floating}
          style={{ left: `${fe.x}%` }}
          aria-hidden="true"
        >
          {fe.emoji}
        </span>
      ))}
      <div className={styles.buttons}>
        {EMOJIS.map((emoji) => (
          <button
            key={emoji}
            className={styles.emojiBtn}
            onClick={() => handleClick(emoji)}
            aria-label={emoji}
          >
            {emoji}
          </button>
        ))}
      </div>
    </div>
  );
}
