import { useState, useRef, useEffect } from 'react';
import { usePredictionStore } from '../../store/predictionStore';
import { useTranslation } from '../../hooks/useTranslation';
import styles from './GameWidget.module.css';

interface Props {
  windowId: string;
  prompt: string;
  deadlineMs: number;
}

export function NextGoalTiming({ windowId: _windowId, prompt, deadlineMs }: Props) {
  const { t } = useTranslation();
  const submitPrediction = usePredictionStore((s) => s.submitPrediction);
  const submittedValue = usePredictionStore((s) => s.submittedValue);

  const [minute, setMinute] = useState('');
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

  const handleSubmit = () => {
    const val = parseInt(minute, 10);
    if (isNaN(val) || val < 1 || val > 90) return;
    submitPrediction(val);
  };

  return (
    <div className={styles.widget}>
      <p className={styles.prompt}>{prompt}</p>
      <div className={styles.countdownTrack}>
        <div className={styles.countdownFill} style={{ width: `${fill}%` }} />
      </div>
      {submittedValue !== null ? (
        <p className={styles.submitted}>
          {t('games.submitted')} – {t('games.nextGoal.label')}: {submittedValue}'
        </p>
      ) : (
        <>
          <div className={styles.controls}>
            <input
              type="number"
              min={1}
              max={90}
              className={styles.input}
              placeholder={t('games.nextGoal.label')}
              value={minute}
              onChange={(e) => setMinute(e.target.value)}
              disabled={isDisabled}
            />
            <button
              className={styles.submitBtn}
              onClick={handleSubmit}
              disabled={isDisabled || minute === ''}
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