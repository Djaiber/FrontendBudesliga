import { useRef, useEffect, useState } from 'react';
import { usePredictionStore } from '../../store/predictionStore';
import { useTranslation } from '../../hooks/useTranslation';
import styles from './GameWidget.module.css';

interface Props {
  windowId: string;
  prompt: string;
  deadlineMs: number;
}

export function GoalInTimeWindow({ windowId: _windowId, prompt, deadlineMs }: Props) {
  const { t } = useTranslation();
  const submitPrediction = usePredictionStore((s) => s.submitPrediction);
  const submittedValue = usePredictionStore((s) => s.submittedValue);

  const mountRef = useRef(Date.now());
  const [fill, setFill] = useState(0);

  useEffect(() => {
    const total = deadlineMs - mountRef.current;
    if (total <= 0) {
      setFill(100);
      return;
    }
    const id = setInterval(() => {
      setFill(Math.min(100, ((Date.now() - mountRef.current) / total) * 100));
    }, 250);
    return () => clearInterval(id);
  }, [deadlineMs]);

  const isExpired = fill >= 100;
  const isDisabled = submittedValue !== null || isExpired;

  return (
    <div className={styles.widget}>
      <p className={styles.prompt}>{prompt}</p>
      <div className={styles.countdownTrack}>
        <div className={styles.countdownFill} style={{ width: `${fill}%` }} />
      </div>
      {submittedValue !== null ? (
        <p className={styles.submitted}>
          {t('games.submitted')} – {t('games.goalWindow.label')}: {submittedValue}
        </p>
      ) : (
        <>
          <div className={styles.toggle}>
            <button
              className={styles.toggleBtn}
              onClick={() => submitPrediction('yes')}
              disabled={isDisabled}
            >
              {t('games.goalWindow.yes')}
            </button>
            <button
              className={styles.toggleBtn}
              onClick={() => submitPrediction('no')}
              disabled={isDisabled}
            >
              {t('games.goalWindow.no')}
            </button>
          </div>
          <div className="prediction-stake">
            <span className="prediction-stake-icon">●</span>
            {t('points.wagered')}: 50 {t('points.short')}
          </div>
        </>
      )}
    </div>
  );
}