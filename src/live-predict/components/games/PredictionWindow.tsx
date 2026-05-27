import { usePredictionStore } from '../../store/predictionStore';
import { NextGoalTiming } from './NextGoalTiming';
import { CornersInInterval } from './CornersInInterval';
import { GoalInTimeWindow } from './GoalInTimeWindow';

export function PredictionWindow() {
  const activeWindow = usePredictionStore((s) => s.activeWindow);

  if (!activeWindow) return null;

  const { windowId, game, prompt, deadlineMs } = activeWindow;
  const props = { windowId, prompt, deadlineMs };

  switch (game) {
    case 'NEXT_GOAL_TIMING':
      return <NextGoalTiming {...props} />;
    case 'CORNERS_IN_INTERVAL':
      return <CornersInInterval {...props} />;
    case 'GOAL_IN_TIME_WINDOW':
      return <GoalInTimeWindow {...props} />;
    default:
      return null;
  }
}