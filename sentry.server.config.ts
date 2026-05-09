import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.VERCEL_ENV ?? 'development',
  tracesSampleRate: 0.1,

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

  beforeBreadcrumb(breadcrumb) {
    const url = breadcrumb.data?.url;
    if (
      breadcrumb.category === 'fetch' &&
      typeof url === 'string' &&
      url.includes('/api/ai') &&
      breadcrumb.data
    ) {
      delete breadcrumb.data.body;
    }
    return breadcrumb;
  },
});
