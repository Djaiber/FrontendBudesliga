/**
 * AuthLayout
 *
 * Shared wrapper for all auth pages (Login, Register, Confirm).
 * Renders the Bundesliga logo centered at the top, then the page content.
 * Loads login-template.css from /public/assets/.
 */
import { useEffect } from 'react';
import { LanguageSwitcher } from '../ui/LanguageSwitcher';

interface AuthLayoutProps {
  children: React.ReactNode;
}

export function AuthLayout({ children }: AuthLayoutProps) {
  // Inject the auth stylesheet once
  useEffect(() => {
    const id = 'auth-template-css';
    if (!document.getElementById(id)) {
      const link = document.createElement('link');
      link.id = id;
      link.rel = 'stylesheet';
      link.href = '/assets/login-template.css';
      document.head.appendChild(link);
    }
  }, []);

  return (
    <div className="auth-root">
      <div style={{ position: 'absolute', top: '24px', right: '24px' }}>
        <LanguageSwitcher />
      </div>
      <img
        src="/assets/logos/Budesliga-svg.png"
        alt="Bundesliga"
        className="auth-logo"
      />
      {children}
    </div>
  );
}

export default AuthLayout;
