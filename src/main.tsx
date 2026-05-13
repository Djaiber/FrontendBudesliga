/**
 * Main entry point for the Bundesliga website
 * Handles routing between homepage and Live Predict feature
 */
import { StrictMode, lazy, Suspense } from 'react';
import { createRoot } from 'react-dom/client';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import './styles/bundesliga.css';
import HomePage from './pages/HomePage';
import LivePredictLayout from './live-predict/components/layout/LivePredictLayout';
import MatchListPage from './live-predict/components/pages/MatchListPage';
import HistoryPage from './live-predict/components/pages/HistoryPage';
import { BundesligaLogo } from './components/icons/BundesligaLogo';

// Lazy load match detail page for code splitting
const MatchDetailPage = lazy(() => import('./live-predict/components/pages/MatchDetailPage'));

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

const router = createBrowserRouter([
  {
    path: '/',
    element: <HomePage />,
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

const container = document.getElementById('app-root');

if (container) {
  createRoot(container).render(
    <StrictMode>
      <RouterProvider router={router} />
    </StrictMode>,
  );
}

// Render Bundesliga logo in header
const logoContainer = document.getElementById('bundesliga-logo');
if (logoContainer) {
  createRoot(logoContainer).render(<BundesligaLogo size={40} />);
}

// Update active nav link based on current route
function updateActiveNav() {
  const navLinks = document.querySelectorAll('.nav-link');
  const currentPath = window.location.pathname;
  
  navLinks.forEach(link => {
    const href = link.getAttribute('href');
    if (href === currentPath || (href !== '/' && currentPath.startsWith(href || ''))) {
      link.setAttribute('aria-current', 'page');
    } else if (href === '/' && currentPath === '/') {
      link.setAttribute('aria-current', 'page');
    } else {
      link.removeAttribute('aria-current');
    }
  });
}

// Update on initial load and navigation
updateActiveNav();
window.addEventListener('popstate', updateActiveNav);
