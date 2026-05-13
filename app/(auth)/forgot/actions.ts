'use server';

import { createClient } from '@/lib/supabase/server';
import { headers } from 'next/headers';
import * as Sentry from '@sentry/nextjs';

export type ForgotError = 'email_required' | 'rate_limit' | 'forgot_failed';

export type ForgotResult = { ok: true } | { ok: false; error: ForgotError };

export async function forgotAction(formData: FormData): Promise<ForgotResult> {
  const email = String(formData.get('email') ?? '').toLowerCase().trim();
  if (!email) return { ok: false, error: 'email_required' };

  // TODO (R-TASK-104, Phase 11): wire per-IP rate limit (3/hour per Q-2.3).
  // @/lib/ratelimit not yet shipped. Supabase Auth's internal throttle on
  // auth.resetPasswordForEmail still applies in the meantime.

  // Same runtime host detection pattern as the signup flow — see
  // app/(auth)/signup/actions.ts for rationale.
  const hdrs = headers();
  const host = hdrs.get('host') ?? 'localhost:3000';
  const proto =
    hdrs.get('x-forwarded-proto') ??
    (host.startsWith('localhost') || host.startsWith('127.0.0.1') ? 'http' : 'https');
  const baseUrl = `${proto}://${host}`;

  const sb = createClient();
  // Supabase generates a one-time recovery token, sends the email via its own
  // mail service (NOT Resend), and the link in the email goes to redirectTo
  // with ?code=... appended after Supabase verifies the token. Reset-link TTL
  // is 24h (Supabase default per Q-2.4).
  //
  // redirectTo points at /auth/callback (NOT /reset-password directly) so the
  // PKCE code exchange runs in a Route Handler that can write cookies. After
  // the callback sets the recovery session cookies, it redirects to
  // /reset-password where the form is shown. See 2026-05-13 debugging note in
  // /auth/callback/route.ts.
  const { error } = await sb.auth.resetPasswordForEmail(email, {
    redirectTo: `${baseUrl}/auth/callback?next=/reset-password`,
  });

  // Per the spec's privacy stance: always return ok=true regardless of whether
  // the email exists in auth.users. Prevents enumeration of registered emails.
  // We do still capture genuine errors (e.g., Supabase being down) to Sentry.
  if (error) {
    Sentry.captureException(error, {
      level: 'warning',
      tags: { surface: 'forgot_password' },
      extra: { stage: 'resetPasswordForEmail' },
    });
  }

  return { ok: true };
}
