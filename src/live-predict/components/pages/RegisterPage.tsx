/**
 * RegisterPage
 *
 * Email + password + confirm-password sign-up form.
 * On success → navigates to /confirm-account (passes email via state).
 * All class names come from public/assets/login-template.css.
 */
import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthLayout } from '../layout/AuthLayout';
import { useAuthStore } from '../../store/authStore';

export function RegisterPage() {
  const navigate = useNavigate();
  const { register, isLoading, error, clearError } = useAuthStore();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [localError, setLocalError] = useState<string | null>(null);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLocalError(null);
    clearError();

    if (password !== confirmPassword) {
      setLocalError('Die Passwörter stimmen nicht überein.');
      return;
    }

    if (password.length < 8) {
      setLocalError('Das Passwort muss mindestens 8 Zeichen lang sein.');
      return;
    }

    await register(email, password);

    if (!useAuthStore.getState().error) {
      navigate('/confirm-account', { state: { email } });
    }
  };

  const displayError = localError ?? error;

  return (
    <AuthLayout>
      <div className="auth-card">
        <h1 className="auth-title">Registrieren</h1>
        <p className="auth-subtitle">
          Erstelle dein Konto für Bundesliga Live Predict.
        </p>

        <form className="auth-form" onSubmit={handleSubmit} noValidate>
          {displayError && <p className="auth-error">{displayError}</p>}

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
              placeholder="Mindestens 8 Zeichen"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="new-password"
              disabled={isLoading}
            />
          </div>

          <div className="auth-field">
            <label htmlFor="confirm-password" className="auth-label">
              Passwort bestätigen
            </label>
            <input
              id="confirm-password"
              type="password"
              className="auth-input"
              placeholder="Passwort wiederholen"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              autoComplete="new-password"
              disabled={isLoading}
            />
          </div>

          <button type="submit" className="auth-btn" disabled={isLoading}>
            {isLoading && <span className="auth-btn-spinner" aria-hidden="true" />}
            {isLoading ? 'Wird registriert…' : 'Konto erstellen'}
          </button>
        </form>

        <hr className="auth-divider" />

        <p className="auth-footer">
          Bereits registriert?{' '}
          <Link to="/login" className="auth-link">Jetzt anmelden</Link>
        </p>
      </div>
    </AuthLayout>
  );
}

export default RegisterPage;
