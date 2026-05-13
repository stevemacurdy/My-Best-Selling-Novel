'use server';

import { createClient } from '@/lib/supabase/server';
import { headers } from 'next/headers';
import * as Sentry from '@sentry/nextjs';
import { safeRedirectPath } from '@/lib/auth-redirects';

export type SigninError =
  | 'all_fields_required'
  | 'invalid_credentials'
  | 'rate_limit'
  | 'signin_failed';

export type SigninResult =
  | { ok: true; redirectTo: string }
  | { ok: false; error: SigninError };

export async function signinAction(formData: FormData): Promise<SigninResult> {
  const email = String(formData.get('email') ?? '').toLowerCase().trim();
  const password = String(formData.get('password') ?? '');
  // TODO (Phase 5): change fallback to '/app' once that route exists.
  const returnTo = safeRedirectPath(String(formData.get('returnTo') ?? ''));

  if (!email || !password) return { ok: false, error: 'all_fields_required' };

  // TODO (R-TASK-104, Phase 11): wire per-IP rate limit (3/hour per Q-2.3).
  // ipRateLimit from @/lib/ratelimit not yet shipped; signin currently has
  // no application-level rate-limit. Supabase Auth's own internal throttling
  // still applies.
  void headers; // keep import alive while rate-limit is wired up

  const sb = createClient();
  const { error } = await sb.auth.signInWithPassword({ email, password });

  if (error) {
    // Generic error code — never leak whether email exists (timing/enumeration).
    if (error.status === 400 || error.status === 401) {
      return { ok: false, error: 'invalid_credentials' };
    }
    Sentry.captureException(error, {
      level: 'error',
      tags: { surface: 'signin' },
      extra: { stage: 'signInWithPassword' },
    });
    return { ok: false, error: 'signin_failed' };
  }

  return { ok: true, redirectTo: returnTo };
}
