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
import { useTranslation } from '../../hooks/useTranslation';

interface LocationState {
  email?: string;
  password?: string;
}

export function ConfirmPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const locationState = location.state as LocationState | null;
  const { t } = useTranslation();

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

  // Translate error if it's a translation key, otherwise show as-is
  const displayError = error && error.startsWith('auth.') ? t(error as any) : error;

  return (
    <AuthLayout>
      <div className="auth-card">
        <h1 className="auth-title">{t('auth.confirm.title')}</h1>
        <p className="auth-subtitle">
          {t('auth.confirm.subtitle')}
        </p>

        {success ? (
          <p className="auth-success">
            {password 
              ? t('auth.confirm.successWithAutoLogin')
              : t('auth.confirm.successWithoutAutoLogin')
            }
          </p>
        ) : (
          <form className="auth-form" onSubmit={handleSubmit} noValidate>
            {displayError && <p className="auth-error">{displayError}</p>}

            {/* Show email field only if not pre-filled from navigation state */}
            {!locationState?.email && (
              <div className="auth-field">
                <label htmlFor="email" className="auth-label">{t('auth.confirm.emailLabel')}</label>
                <input
                  id="email"
                  type="email"
                  className="auth-input"
                  placeholder={t('auth.confirm.emailPlaceholder')}
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
                <label htmlFor="password" className="auth-label">{t('auth.confirm.passwordLabel')}</label>
                <input
                  id="password"
                  type="password"
                  className="auth-input"
                  placeholder={t('auth.confirm.passwordPlaceholder')}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                  disabled={isLoading}
                />
              </div>
            )}

            <div className="auth-field">
              <label htmlFor="code" className="auth-label">{t('auth.confirm.codeLabel')}</label>
              <input
                id="code"
                type="text"
                inputMode="numeric"
                pattern="\d{6}"
                maxLength={6}
                className="auth-code-input"
                placeholder={t('auth.confirm.codePlaceholder')}
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
                required
                autoComplete="one-time-code"
                disabled={isLoading}
              />
            </div>

            <div className="auth-info">
              {t('auth.confirm.infoText')}{' '}
              <strong>{t('auth.confirm.infoTextBold')}</strong>.
            </div>

            <button
              type="submit"
              className="auth-btn"
              disabled={isLoading || code.length !== 6}
            >
              {isLoading && <span className="auth-btn-spinner" aria-hidden="true" />}
              {isLoading ? t('auth.confirm.submitButtonLoading') : t('auth.confirm.submitButton')}
            </button>
          </form>
        )}

        <hr className="auth-divider" />

        <p className="auth-footer">
          {t('auth.confirm.backToLogin')}{' '}
          <Link to="/login" className="auth-link">{t('auth.confirm.loginLink')}</Link>
        </p>
      </div>
    </AuthLayout>
  );
}

export default ConfirmPage;
