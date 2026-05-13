import { lazy, Suspense } from 'react';
import { createBrowserRouter } from 'react-router-dom';
import LivePredictLayout from '../components/layout/LivePredictLayout';
import MatchListPage from '../components/pages/MatchListPage';
import HistoryPage from '../components/pages/HistoryPage';

/**
 * Code-split: MatchDetailPage is only loaded when the user navigates to
 * /live-predict/:matchId, keeping the initial bundle ≤ 200 KB gzip.
 *
 * Validates: Requirements 16.4
 */
const MatchDetailPage = lazy(() => import('../components/pages/MatchDetailPage'));

/**
 * Inline loading spinner shown while MatchDetailPage's chunk is being fetched.
 * Kept minimal — a single animated element with an accessible label.
 */
function LoadingSpinner() {
  return (
    <div
      role="status"
      aria-label="Wird geladen…"
      style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '200px',
      }}
    >
      <div
        style={{
          width: '32px',
          height: '32px',
          border: '3px solid var(--border, #2a2a2a)',
          borderTopColor: 'var(--red, #d2001f)',
          borderRadius: '50%',
          animation: 'spin 0.7s linear infinite',
        }}
      />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

/**
 * Application router.
 *
 * Route tree:
 *   /live-predict                → LivePredictLayout (shell + DemomodusBanner)
 *     index                      → MatchListPage
 *     :matchId                   → MatchDetailPage (lazy, wrapped in Suspense)
 *     meine-wetten               → HistoryPage
 *
 * Validates: Requirements 2.1, 16.4, 19.2
 */
export const router = createBrowserRouter([
   {
    path: '/',
    loader: () => Response.redirect('/live-predict'),  // ← add this
  },
  {
    path: '/live-predict',
    element: <LivePredictLayout />,
    children: [
      {
        index: true,
        element: <MatchListPage />,
      },
      {
        path: ':matchId',
        element: (
          <Suspense fallback={<LoadingSpinner />}>
            <MatchDetailPage />
          </Suspense>
        ),
      },
      {
        path: 'meine-wetten',
        element: <HistoryPage />,
      },
    ],
  },
]);
