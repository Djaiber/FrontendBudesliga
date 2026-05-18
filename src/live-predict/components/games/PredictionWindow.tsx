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
    case 'next_goal_timing':
      return <NextGoalTiming {...props} />;
    case 'corners_in_interval':
      return <CornersInInterval {...props} />;
    case 'goal_in_time_window':
      return <GoalInTimeWindow {...props} />;
    default:
      return null;
  }
}