import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  environment: process.env.NEXT_PUBLIC_VERCEL_ENV ?? 'development',
  tracesSampleRate: 0.1,

  // Replay DISABLED — would record DOM containing draft manuscripts (user IP)
  replaysSessionSampleRate: 0,
  replaysOnErrorSampleRate: 0,

  beforeSend(event) {
    if (event.request) {
      delete event.request.data;
      delete event.request.cookies;
    }
    if (event.user) {
      delete event.user.email;
      delete event.user.username;
    }
    return event;
  },
});
