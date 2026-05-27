import { useState, useRef, useEffect } from 'react';
import { usePredictionStore } from '../../store/predictionStore';
import { useTranslation } from '../../hooks/useTranslation';
import styles from './GameWidget.module.css';

interface Props {
  windowId: string;
  prompt: string;
  deadlineMs: number;
}

export function CornersInInterval({ windowId: _windowId, prompt, deadlineMs }: Props) {
  const { t } = useTranslation();
  const submitPrediction = usePredictionStore((s) => s.submitPrediction);
  const submittedValue = usePredictionStore((s) => s.submittedValue);

  const [count, setCount] = useState(0);
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
          {t('games.submitted')} – {t('games.corners.label')}: {submittedValue}
        </p>
      ) : (
        <>
          <div className={styles.controls}>
            <div className={styles.stepper}>
              <button
                className={styles.stepBtn}
                onClick={() => setCount((c) => Math.max(0, c - 1))}
                disabled={isDisabled || count === 0}
                aria-label="−"
              >
                −
              </button>
              <span className={styles.stepValue}>{count}</span>
              <button
                className={styles.stepBtn}
                onClick={() => setCount((c) => c + 1)}
                disabled={isDisabled}
                aria-label="+"
              >
                +
              </button>
            </div>
            <button
              className={styles.submitBtn}
              onClick={() => submitPrediction(count)}
              disabled={isDisabled}
            >
              {t('games.submit')}
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