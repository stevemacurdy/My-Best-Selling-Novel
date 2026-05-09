import * as Sentry from '@sentry/nextjs';

export function tagSentryUser(user: { id: string; tier?: string; role?: string }) {
  Sentry.setUser({ id: user.id });
  if (user.tier) Sentry.setTag('tier', user.tier);
  if (user.role) Sentry.setTag('role', user.role);
}

export function captureWithContext(error: unknown, context: Record<string, unknown>) {
  Sentry.withScope((scope) => {
    Object.entries(context).forEach(([k, v]) => scope.setExtra(k, v));
    Sentry.captureException(error);
  });
}
