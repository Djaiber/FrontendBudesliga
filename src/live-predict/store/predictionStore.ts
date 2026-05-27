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

// Module-level store API capture - subscriptions registered at module load need this
let storeApi: { setState: any; getState: any } | null = null;

export const usePredictionStore = create<PredictionState & PredictionActions>((set, get) => {
  // Capture the store API for use by subscriptions registered at module load
  storeApi = { setState: set, getState: get };

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

// Force the store to initialize immediately so storeApi is captured
(function ensureStoreInitialized() {
  usePredictionStore.getState();
})();

// Register WebSocket subscriptions at MODULE LOAD time, not inside the store init.
// This ensures handlers exist before any messages can arrive.
websocket.on('prediction_window_open', (msg: any) => {
  console.log('[PredictionStore] Received prediction_window_open:', msg);
  if (msg.type !== 'prediction_window_open') return;
  storeApi?.setState({
    activeWindow: {
      windowId: msg.window_id,
      game: msg.game,
      prompt: msg.prompt,
      deadlineMs: msg.deadline_ms,
      options: msg.options,
    },
    submittedValue: null,
  });
});

websocket.on('prediction_window_close', (msg: any) => {
  console.log('[PredictionStore] Received prediction_window_close:', msg);
  if (msg.type !== 'prediction_window_close') return;
  storeApi?.setState({ activeWindow: null });
});

websocket.on('prediction_result', (msg: any) => {
  console.log('[PredictionStore] Received prediction_result:', msg);
  if (msg.type !== 'prediction_result') return;
  if (!storeApi) return;
  const { submittedValue } = storeApi.getState();
  if (submittedValue === null) return;
  storeApi.setState((s: any) => ({
    history: [
      {
        windowId: msg.window_id,
        result: String(submittedValue),
        pointsAwarded: msg.scores?.[msg.user_id] ?? 0,
      },
      ...s.history,
    ],
    activeWindow: null,
  }));
});