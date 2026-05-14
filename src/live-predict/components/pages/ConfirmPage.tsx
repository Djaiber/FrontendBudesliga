/**
 * ConfirmPage
 *
 * 6-digit OTP confirmation form.
 * Copy and tone sourced from public/assets/verification-email.html.
 * On success → automatically signs in user and redirects to /live-predict.
 * All class names come from public/assets/login-template.css.
 */
import { useState, type FormEvent } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { AuthLayout } from '../layout/AuthLayout';
import { useAuthStore } from '../../store/authStore';

interface LocationState {
  email?: string;
  password?: string;
}

export function ConfirmPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const locationState = location.state as LocationState | null;

  const { confirmAndLogin, isLoading, error, clearError } = useAuthStore();

  const [email, setEmail] = useState(locationState?.email ?? '');
  const [password, setPassword] = useState(locationState?.password ?? '');
  const [code, setCode] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    clearError();

    // If password is available (from registration flow), use auto-login
    if (password) {
      try {
        await confirmAndLogin(email, code, password);
        
        if (!useAuthStore.getState().error) {
          setSuccess(true);
          // Redirect to dashboard after successful auto-login
          setTimeout(() => navigate('/live-predict'), 1500);
        }
      } catch {
        // Error is already set in store
      }
    } else {
      // Fallback: manual confirmation without auto-login
      // (for cases where user navigates directly to confirm page)
      const { confirmSignUp } = useAuthStore.getState();
      await confirmSignUp(email, code);
      
      if (!useAuthStore.getState().error) {
        setSuccess(true);
        setTimeout(() => navigate('/login'), 2000);
      }
    }
  };

  return (
    <AuthLayout>
      <div className="auth-card">
        <h1 className="auth-title">Konto bestätigen</h1>
        <p className="auth-subtitle">
          Wir haben dir einen 6-stelligen Bestätigungscode an deine
          E-Mail-Adresse gesendet. Bitte gib den Code unten ein, um
          dein Konto zu aktivieren.
        </p>

        {success ? (
          <p className="auth-success">
            {password 
              ? 'Dein Konto wurde erfolgreich bestätigt. Du wirst angemeldet…'
              : 'Dein Konto wurde erfolgreich bestätigt. Du kannst dich jetzt anmelden.'
            }
          </p>
        ) : (
          <form className="auth-form" onSubmit={handleSubmit} noValidate>
            {error && <p className="auth-error">{error}</p>}

            {/* Show email field only if not pre-filled from navigation state */}
            {!locationState?.email && (
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
            )}

            {/* Show password field only if not pre-filled from navigation state */}
            {!locationState?.password && (
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
            )}

            <div className="auth-field">
              <label htmlFor="code" className="auth-label">Bestätigungscode</label>
              <input
                id="code"
                type="text"
                inputMode="numeric"
                pattern="\d{6}"
                maxLength={6}
                className="auth-code-input"
                placeholder="000000"
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
                required
                autoComplete="one-time-code"
                disabled={isLoading}
              />
            </div>

            <div className="auth-info">
              Kein Code erhalten? Überprüfe deinen Spam-Ordner oder{' '}
              <strong>fordere einen neuen Code an</strong>.
            </div>

            <button
              type="submit"
              className="auth-btn"
              disabled={isLoading || code.length !== 6}
            >
              {isLoading && <span className="auth-btn-spinner" aria-hidden="true" />}
              {isLoading ? 'Wird bestätigt…' : 'Konto bestätigen'}
            </button>
          </form>
        )}

        <hr className="auth-divider" />

        <p className="auth-footer">
          Zurück zur{' '}
          <Link to="/login" className="auth-link">Anmeldung</Link>
        </p>
      </div>
    </AuthLayout>
  );
}

export default ConfirmPage;
