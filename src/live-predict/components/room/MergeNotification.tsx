import { useState, useEffect } from 'react';
import { useRoomStore } from '../../store/roomStore';
import { useTranslation } from '../../hooks/useTranslation';
import styles from './MergeNotification.module.css';

export function MergeNotification() {
  const mergeNotification = useRoomStore((s) => s.mergeNotification);
  const clearMergeNotification = useRoomStore((s) => s.clearMergeNotification);
  const { t } = useTranslation();

  const [remaining, setRemaining] = useState(0);

  useEffect(() => {
    if (!mergeNotification) return;
    setRemaining(Math.ceil(mergeNotification.countdownMs / 1000));

    const id = setInterval(() => {
      setRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(id);
          clearMergeNotification();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(id);
  }, [mergeNotification, clearMergeNotification]);

  if (!mergeNotification) return null;

  return (
    <div className={styles.overlay} role="alert" aria-live="polite">
      <div className={styles.card}>
        <p className={styles.text}>
          {t('room.merge.notification')}{' '}
          <span className={styles.count}>{remaining}</span>…
        </p>
      </div>
    </div>
  );
}
