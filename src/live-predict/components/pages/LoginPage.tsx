/**
 * LoginPage
 *
 * Email + password sign-in form.
 * On success → navigates to /live-predict.
 * All class names come from public/assets/login-template.css.
 */
import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthLayout } from '../layout/AuthLayout';
import { useAuthStore } from '../../store/authStore';

export function LoginPage() {
  const navigate = useNavigate();
  const { login, isLoading, error, clearError } = useAuthStore();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    clearError();
    await login(email, password);
    // Only navigate if no error was set
    if (!useAuthStore.getState().error) {
      navigate('/live-predict');
    }
  };

  return (
    <AuthLayout>
      <div className="auth-card">
        <h1 className="auth-title">Anmelden</h1>
        <p className="auth-subtitle">
          Melde dich an, um Live Predict zu nutzen.
        </p>

        <form className="auth-form" onSubmit={handleSubmit} noValidate>
          {error && <p className="auth-error">{error}</p>}

          <div className="auth-field">
            <label htmlFor="email" className="auth-label">E-Mail</label>
            <input
              id="email"
              type="email"
              className="auth-input"
              placeholder="deine@email.de"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
              disabled={isLoading}
            />
          </div>

          <div className="auth-field">
            <label htmlFor="password" className="auth-label">Passwort</label>
            <input
              id="password"
              type="password"
              className="auth-input"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
              disabled={isLoading}
            />
          </div>

          <button type="submit" className="auth-btn" disabled={isLoading}>
            {isLoading && <span className="auth-btn-spinner" aria-hidden="true" />}
            {isLoading ? 'Wird angemeldet…' : 'Anmelden'}
          </button>
        </form>

        <hr className="auth-divider" />

        <p className="auth-footer">
          Noch kein Konto?{' '}
          <Link to="/register" className="auth-link">Jetzt registrieren</Link>
        </p>
      </div>
    </AuthLayout>
  );
}

export default LoginPage;
