'use server';

import { createServerClient } from '@supabase/ssr';
import { cookies, headers } from 'next/headers';
import * as Sentry from '@sentry/nextjs';
import { checkBreached } from '@/lib/hibp';
import { recordAcceptance } from '@/lib/acceptance';
import type { Database } from '@/types/supabase';

export type SignupError =
  | 'all_fields_required'
  | 'password_too_short'
  | 'must_accept_all'
  | 'password_breached'
  | 'email_in_use'
  | 'signup_failed';

export type SignupResult =
  | { ok: true; redirectTo: string }
  | { ok: false; error: SignupError };

// FOOTER NOTE — temporary redirect deviation from spec:
// Spec calls for redirect to `/app` after signup. `/app` is built in Phase 5+.
// Until that route exists, redirect to `/` (landing) so the user lands on a
// real page rather than a 404. The deferred work (MFA banner on /app, email-
// verification banner, mfa_banner_dismissed column on profiles) ships when
// /app does. See PROGRESS.md.
const POST_SIGNUP_REDIRECT = '/';

export async function signupAction(formData: FormData): Promise<SignupResult> {
  const fullName = String(formData.get('full_name') ?? '').trim();
  const email = String(formData.get('email') ?? '').toLowerCase().trim();
  const password = String(formData.get('password') ?? '');
  const acceptedTos = formData.get('accept_tos') === 'on';
  const acceptedPrivacy = formData.get('accept_privacy') === 'on';
  const acceptedRefunds = formData.get('accept_refunds') === 'on';

  if (!fullName || !email || !password) return { ok: false, error: 'all_fields_required' };
  if (password.length < 12) return { ok: false, error: 'password_too_short' };
  if (!acceptedTos || !acceptedPrivacy || !acceptedRefunds) {
    return { ok: false, error: 'must_accept_all' };
  }

  // HIBP breach check. Per Q-2.12, HIBP-down warns but allows signup
  // (the password may still be weak, but the user can rotate later).
  let breached = false;
  try {
    breached = await checkBreached(password);
  } catch (err) {
    Sentry.captureMessage('signupAction: HIBP unreachable, allowing signup', {
      level: 'warning',
      extra: { error: String(err) },
    });
  }
  if (breached) return { ok: false, error: 'password_breached' };

  const cookieStore = cookies();
  const sb = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: (cookiesToSet) => {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set({ name, value, ...options });
            });
          } catch {
            // server action: cookies are sometimes immutable depending on
            // execution context; swallow and let middleware refresh.
          }
        },
      },
    },
  );

  const { data, error: signupErr } = await sb.auth.signUp({
    email,
    password,
    options: {
      data: { full_name: fullName },
      emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}${POST_SIGNUP_REDIRECT}`,
    },
  });

  if (signupErr) {
    if (signupErr.code === 'user_already_exists') return { ok: false, error: 'email_in_use' };
    Sentry.captureException(signupErr, { extra: { stage: 'auth.signUp' } });
    return { ok: false, error: 'signup_failed' };
  }

  const userId = data.user?.id;
  if (!userId) {
    Sentry.captureMessage('signupAction: signUp returned no user id', { level: 'error' });
    return { ok: false, error: 'signup_failed' };
  }

  const hdrs = headers();
  const ip =
    hdrs.get('x-forwarded-for')?.split(',')[0]?.trim() ?? hdrs.get('x-real-ip') ?? null;
  const ua = hdrs.get('user-agent') ?? null;

  // Per Q-8.4(a): the AUP is inline in the ToS, so a single 'tos' acceptance
  // covers both. Refunds and Privacy each get their own row.
  try {
    await Promise.all([
      recordAcceptance({ sb, user_id: userId, document: 'tos', ip_address: ip, user_agent: ua }),
      recordAcceptance({ sb, user_id: userId, document: 'privacy', ip_address: ip, user_agent: ua }),
      recordAcceptance({ sb, user_id: userId, document: 'refunds', ip_address: ip, user_agent: ua }),
    ]);
  } catch (err) {
    // Don't block signup — flag for follow-up. The auth.users row + profile
    // row are committed; the user can re-accept on next visit if a flow exists.
    Sentry.captureException(err, { extra: { stage: 'recordAcceptance', userId } });
  }

  return { ok: true, redirectTo: POST_SIGNUP_REDIRECT };
}
