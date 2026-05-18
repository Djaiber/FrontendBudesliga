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
import { useTranslation } from '../../hooks/useTranslation';

export function RegisterPage() {
  const navigate = useNavigate();
  const { register, isLoading, error, clearError } = useAuthStore();
  const { t } = useTranslation();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [localError, setLocalError] = useState<string | null>(null);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLocalError(null);
    clearError();

    if (!name.trim()) {
      setLocalError(t('auth.register.errorNameRequired'));
      return;
    }

    if (password !== confirmPassword) {
      setLocalError(t('auth.register.errorPasswordMismatch'));
      return;
    }

    if (password.length < 8) {
      setLocalError(t('auth.register.errorPasswordTooShort'));
      return;
    }

    await register(email, password, name.trim());

    if (!useAuthStore.getState().error) {
      navigate('/confirm-account', { state: { email, password } });
    }
  };

  // Translate error if it's a translation key, otherwise show as-is
  const storeError = error && error.startsWith('auth.') ? t(error as any) : error;
  const displayError = localError ?? storeError;

  return (
    <AuthLayout>
      <div className="auth-card">
        <h1 className="auth-title">{t('auth.register.title')}</h1>
        <p className="auth-subtitle">
          {t('auth.register.subtitle')}
        </p>

        <form className="auth-form" onSubmit={handleSubmit} noValidate>
          {displayError && <p className="auth-error">{displayError}</p>}

          <div className="auth-field">
            <label htmlFor="name" className="auth-label">{t('auth.register.nameLabel')}</label>
            <input
              id="name"
              type="text"
              className="auth-input"
              placeholder={t('auth.register.namePlaceholder')}
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              autoComplete="name"
              disabled={isLoading}
            />
          </div>

          <div className="auth-field">
            <label htmlFor="email" className="auth-label">{t('auth.register.emailLabel')}</label>
            <input
              id="email"
              type="email"
              className="auth-input"
              placeholder={t('auth.register.emailPlaceholder')}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
              disabled={isLoading}
            />
          </div>

          <div className="auth-field">
            <label htmlFor="password" className="auth-label">{t('auth.register.passwordLabel')}</label>
            <input
              id="password"
              type="password"
              className="auth-input"
              placeholder={t('auth.register.passwordPlaceholder')}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="new-password"
              disabled={isLoading}
            />
          </div>

          <div className="auth-field">
            <label htmlFor="confirm-password" className="auth-label">
              {t('auth.register.confirmPasswordLabel')}
            </label>
            <input
              id="confirm-password"
              type="password"
              className="auth-input"
              placeholder={t('auth.register.confirmPasswordPlaceholder')}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              autoComplete="new-password"
              disabled={isLoading}
            />
          </div>

          <button type="submit" className="auth-btn" disabled={isLoading}>
            {isLoading && <span className="auth-btn-spinner" aria-hidden="true" />}
            {isLoading ? t('auth.register.submitButtonLoading') : t('auth.register.submitButton')}
          </button>
        </form>

        <hr className="auth-divider" />

        <p className="auth-footer">
          {t('auth.register.alreadyRegistered')}{' '}
          <Link to="/login" className="auth-link">{t('auth.register.loginLink')}</Link>
        </p>
      </div>
    </AuthLayout>
  );
}

export default RegisterPage;
