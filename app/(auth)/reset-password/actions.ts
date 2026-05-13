'use server';

import { createClient } from '@/lib/supabase/server';
import { checkBreached } from '@/lib/hibp';
import * as Sentry from '@sentry/nextjs';

export type ResetPasswordError =
  | 'password_too_short'
  | 'passwords_dont_match'
  | 'password_breached'
  | 'no_session'
  | 'reset_failed';

export type ResetPasswordResult = { ok: true } | { ok: false; error: ResetPasswordError };

export async function resetPasswordAction(formData: FormData): Promise<ResetPasswordResult> {
  const password = String(formData.get('password') ?? '');
  const confirm = String(formData.get('confirm') ?? '');

  if (!password || password.length < 12) return { ok: false, error: 'password_too_short' };
  if (password !== confirm) return { ok: false, error: 'passwords_dont_match' };

  // HIBP check (same standard as signup per R-TASK-114; Q-2.12 default —
  // warn-and-allow on HIBP-down).
  let breached = false;
  try {
    breached = await checkBreached(password);
  } catch (err) {
    Sentry.captureMessage('resetPasswordAction: HIBP unreachable, allowing reset', {
      level: 'warning',
      extra: { error: String(err) },
    });
  }
  if (breached) return { ok: false, error: 'password_breached' };

  const sb = createClient();

  // The recovery session was set by the reset-password page's code exchange
  // before this action ran. If somehow the session is missing here, fail
  // loudly so the user gets routed back to /forgot.
  const { data: userData } = await sb.auth.getUser();
  if (!userData.user) return { ok: false, error: 'no_session' };

  const { error } = await sb.auth.updateUser({ password });
  if (error) {
    // TEMPORARY DIAGNOSTIC (2026-05-13): surface the raw Supabase error in the
    // dev shell so we can identify what's producing `reset_failed`. Sentry is
    // capturing too, but the operator's local env doesn't have SENTRY_AUTH_TOKEN
    // wired to query events from CLI. Remove this console.error once the
    // specific failure mode is mapped to its own SignupError-style code.
    if (process.env.NODE_ENV === 'development') {
      console.error('[reset-password] sb.auth.updateUser error:', error);
    }
    Sentry.captureException(error, {
      level: 'error',
      tags: { surface: 'password_reset' },
      extra: { stage: 'updateUser' },
    });
    return { ok: false, error: 'reset_failed' };
  }

  return { ok: true };
}
