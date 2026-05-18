import { create } from 'zustand';
import { websocket } from '../transport/websocket';

interface ActiveWindow {
  windowId: string;
  game: string;
  prompt: string;
  deadlineMs: number;
  options?: string[];
}

interface HistoryEntry {
  windowId: string;
  result: string;
  pointsAwarded: number;
}

interface PredictionState {
  activeWindow: ActiveWindow | null;
  submittedValue: string | number | null;
  history: HistoryEntry[];
}

interface PredictionActions {
  openWindow: (window: ActiveWindow) => void;
  closeWindow: () => void;
  submitPrediction: (value: string | number) => void;
  recordResult: (entry: HistoryEntry) => void;
}

export const usePredictionStore = create<PredictionState & PredictionActions>((set, get) => {
  websocket.on('PREDICTION_WINDOW_OPEN', (msg) => {
    if (msg.type !== 'PREDICTION_WINDOW_OPEN') return;
    set({
      activeWindow: {
        windowId: msg.windowId,
        game: msg.game,
        prompt: msg.prompt,
        deadlineMs: msg.deadlineMs,
        options: msg.options,
      },
      submittedValue: null,
    });
  });

  websocket.on('PREDICTION_WINDOW_CLOSE', (msg) => {
    if (msg.type !== 'PREDICTION_WINDOW_CLOSE') return;
    set({ activeWindow: null });
  });

  websocket.on('PREDICTION_RESULT', (msg) => {
    if (msg.type !== 'PREDICTION_RESULT') return;
    const { submittedValue } = get();
    if (submittedValue === null) return;
    set((s) => ({
      history: [
        {
          windowId: msg.windowId,
          result: String(s.submittedValue),
          pointsAwarded: msg.scores[msg.windowId] ?? 0,
        },
        ...s.history,
      ],
      activeWindow: null,
    }));
  });

  return {
    activeWindow: null,
    submittedValue: null,
    history: [],

    openWindow: (window) => set({ activeWindow: window, submittedValue: null }),
    closeWindow: () => set({ activeWindow: null }),

    submitPrediction: (value) => {
      const { activeWindow } = get();
      if (!activeWindow) return;
      websocket.send({ type: 'SUBMIT_PREDICTION', windowId: activeWindow.windowId, value });
      set({ submittedValue: value });
    },

    recordResult: (entry) => set((s) => ({ history: [entry, ...s.history] })),
  };
});