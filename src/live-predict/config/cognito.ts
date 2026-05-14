/**
 * AWS Amplify / Cognito configuration
 * Credentials are read exclusively from VITE_ env vars — never hardcoded.
 *
 * Import this module as the very first line of main.tsx so Amplify is
 * configured before any auth calls are made.
 */
import { Amplify } from 'aws-amplify';

Amplify.configure({
  Auth: {
    Cognito: {
      userPoolId: import.meta.env.VITE_COGNITO_USER_POOL_ID as string,
      userPoolClientId: import.meta.env.VITE_COGNITO_CLIENT_ID as string,
    },
  },
});
