import * as Sentry from '@sentry/react';

let initialized = false;

export const initSentry = () => {
  if (initialized) return;

  const dsn = import.meta.env.VITE_SENTRY_DSN;
  if (!dsn) return;

  Sentry.init({
    dsn,
    environment: import.meta.env.VITE_APP_ENV || 'development',
    integrations: [Sentry.browserTracingIntegration()],
    tracesSampleRate: 0.2,
  });

  initialized = true;
};
