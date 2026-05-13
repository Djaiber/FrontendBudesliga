/**
 * Entry point for the Live Predict feature.
 *
 * Mounts the React application inside the designated insertion point in the
 * existing Bundesliga site shell. The RouterProvider drives all three routes:
 *   /live-predict          → MatchListPage
 *   /live-predict/:matchId → MatchDetailPage (lazy)
 *   /live-predict/meine-wetten → HistoryPage
 *
 * Validates: Requirements 2.1, 19.2
 */
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { RouterProvider } from 'react-router-dom';
import { router } from './router/index';

const container = document.getElementById('live-predict-root');

if (container) {
  createRoot(container).render(
    <StrictMode>
      <RouterProvider router={router} />
    </StrictMode>,
  );
}
