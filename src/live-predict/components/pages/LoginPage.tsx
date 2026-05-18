/**
 * LoginPage
 *
 * Email + password sign-in form.
 * On success → navigates to /live-predict.
 * All class names come from public/assets/login-template.css.
 */
import { useState, useEffect, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthLayout } from '../layout/AuthLayout';
import { useAuthStore } from '../../store/authStore';
import { useTranslation } from '../../hooks/useTranslation';

export function LoginPage() {
  const navigate = useNavigate();
  const { login, isLoading, error, clearError, checkSession } = useAuthStore();

  useEffect(() => {
    checkSession().then(() => {
      if (useAuthStore.getState().isAuthenticated) {
        navigate('/live-predict', { replace: true });
      }
    });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
  const { t } = useTranslation();

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

  // Translate error if it's a translation key, otherwise show as-is
  const displayError = error && error.startsWith('auth.') ? t(error as any) : error;

  return (
    <AuthLayout>
      <div className="auth-card">
        <h1 className="auth-title">{t('auth.login.title')}</h1>
        <p className="auth-subtitle">
          {t('auth.login.subtitle')}
        </p>

        <form className="auth-form" onSubmit={handleSubmit} noValidate>
          {displayError && <p className="auth-error">{displayError}</p>}

          <div className="auth-field">
            <label htmlFor="email" className="auth-label">{t('auth.login.emailLabel')}</label>
            <input
              id="email"
              type="email"
              className="auth-input"
              placeholder={t('auth.login.emailPlaceholder')}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
              disabled={isLoading}
            />
          </div>

          <div className="auth-field">
            <label htmlFor="password" className="auth-label">{t('auth.login.passwordLabel')}</label>
            <input
              id="password"
              type="password"
              className="auth-input"
              placeholder={t('auth.login.passwordPlaceholder')}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
              disabled={isLoading}
            />
          </div>

          <button type="submit" className="auth-btn" disabled={isLoading}>
            {isLoading && <span className="auth-btn-spinner" aria-hidden="true" />}
            {isLoading ? t('auth.login.submitButtonLoading') : t('auth.login.submitButton')}
          </button>
        </form>

        <hr className="auth-divider" />

        <p className="auth-footer">
          {t('auth.login.noAccountYet')}{' '}
          <Link to="/register" className="auth-link">{t('auth.login.registerLink')}</Link>
        </p>
      </div>
    </AuthLayout>
  );
}

export default LoginPage;
