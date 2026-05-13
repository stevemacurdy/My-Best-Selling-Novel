'use server';

import { createServerClient } from '@supabase/ssr';
import { cookies, headers } from 'next/headers';
import * as Sentry from '@sentry/nextjs';
import { checkBreached } from '@/lib/hibp';
import { recordAcceptance } from '@/lib/acceptance';
import { createServiceRoleClient } from '@/lib/supabase/server';
import type { Database } from '@/types/supabase';

export type SignupError =
  | 'all_fields_required'
  | 'password_too_short'
  | 'must_accept_all'
  | 'password_breached'
  | 'email_in_use'
  | 'acceptance_failed'
  | 'signup_failed';

export type SignupResult =
  | { ok: true; verifyEmail: true; email: string }
  | { ok: true; verifyEmail: false; redirectTo: string }
  | { ok: false; error: SignupError };

// Temporary redirect deviation from spec: spec calls for redirect to `/app`
// after signup. `/app` is built in Phase 5+. Until then, redirect to `/`
// (landing) so the user lands on a real page rather than a 404. The MFA
// banner UX and email-verification banner ship when /app does.
//
// TODO (Phase 5 / R-TASK-103): when /app exists and the MFA banner is rendered,
// recording dismissal needs profiles.mfa_banner_dismissed BOOLEAN column.
// Add via migration 017 at that time. Skipping for now since no UI consumes it.
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

  // Runtime host detection (vs. reading NEXT_PUBLIC_SITE_URL). The email
  // verification link needs to point back to whichever host the user signed up
  // from — localhost during dev, the per-PR Vercel preview hostname during
  // staging, the prod domain in production. An env var has to be set correctly
  // in each environment; Vercel preview hostnames are dynamic and can't be
  // hardcoded. Reading `host` + `x-forwarded-proto` from the incoming request
  // headers handles all three cases without configuration.
  const hdrs = headers();
  const host = hdrs.get('host') ?? 'localhost:3000';
  const proto =
    hdrs.get('x-forwarded-proto') ??
    (host.startsWith('localhost') || host.startsWith('127.0.0.1') ? 'http' : 'https');
  const baseUrl = `${proto}://${host}`;

  const { data, error: signupErr } = await sb.auth.signUp({
    email,
    password,
    options: {
      data: { full_name: fullName },
      emailRedirectTo: `${baseUrl}/auth/callback`,
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

  const ip =
    hdrs.get('x-forwarded-for')?.split(',')[0]?.trim() ?? hdrs.get('x-real-ip') ?? null;
  const ua = hdrs.get('user-agent') ?? null;

  // Acceptance recording is server-trusted ingestion (the form was validated
  // server-side; user_id comes from auth.signUp's response). RLS-via-user-
  // session doesn't work here because auth.signUp returns data.session=null
  // when the Supabase project has email confirmation ON, leaving the
  // @supabase/ssr cookie-client without an authenticated context for the
  // immediate INSERT. The service-role client is the right tool: same pattern
  // as Decision #3 (Stripe webhook uses service-role because the server's
  // just-completed operation is the source of truth).
  //
  // service-role-allowlisted: post-signup acceptance recording (R-TASK-120 signup-side)
  const adminSb = createServiceRoleClient();

  // Per Q-8.4(a): the AUP is inline in the ToS, so a single 'tos' acceptance
  // covers both. Refunds and Privacy each get their own row.
  try {
    await Promise.all([
      recordAcceptance({ sb: adminSb, user_id: userId, document: 'tos', ip_address: ip, user_agent: ua }),
      recordAcceptance({ sb: adminSb, user_id: userId, document: 'privacy', ip_address: ip, user_agent: ua }),
      recordAcceptance({ sb: adminSb, user_id: userId, document: 'refunds', ip_address: ip, user_agent: ua }),
    ]);
  } catch (acceptanceErr) {
    // Loud + abort. Surface the failure to the user and clean up the orphan
    // auth.users row (FK CASCADE on profiles.id and document_acceptances.user_id
    // removes the trigger-created profile row and any partial acceptance writes).
    Sentry.captureException(acceptanceErr, {
      level: 'error',
      tags: { surface: 'signup_acceptance' },
      extra: { stage: 'recordAcceptance', userId, email },
    });

    try {
      await adminSb.auth.admin.deleteUser(userId);
    } catch (cleanupErr) {
      // Worst case: orphan auth.users row, no profile (or maybe a profile if the
      // CASCADE didn't fire), no acceptances. The user's email is now bound to a
      // Supabase row they can't sign in to and can't re-sign-up against. Operator
      // must intervene via Supabase Dashboard → Authentication → Users.
      Sentry.captureException(cleanupErr, {
        level: 'fatal',
        tags: { surface: 'signup_cleanup_failed' },
        extra: { userId, email, originalError: String(acceptanceErr) },
      });
    }

    return { ok: false, error: 'acceptance_failed' };
  }

  // Email-confirmation flow is the locked v1 posture (see CONTENT_TODO.md
  // "Operator manual setup actions"). When Supabase has email confirmation
  // ON, auth.signUp returns data.session === null and the user must click the
  // verification link before they have a session. Branch the return so the
  // form can render an interstitial. The session-populated branch is
  // defense-in-depth for the case where confirmation is accidentally toggled
  // off or admin.createUser was used to bypass it.
  if (data.session) {
    return { ok: true, verifyEmail: false, redirectTo: POST_SIGNUP_REDIRECT };
  }
  return { ok: true, verifyEmail: true, email };
}
