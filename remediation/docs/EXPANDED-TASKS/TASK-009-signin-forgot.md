<!-- APPLY: REPLACE -->
<!-- Target: docs/TASKS/TASK-009-signin-forgot.md (in original mybsn package) -->
<!-- Backup: docs/EXPANDED-TASKS/backups/TASK-009-signin-forgot.pre-expansion-backup.md -->
<!-- Expanded 2026-05-08 from 96 words to ~870 words via PATCH-3 sub-deliverable B.3. -->

# TASK-009: Sign-In + Forgot-Password Pages

## Status: NOT STARTED
## Priority: CRITICAL
## Phase: 2
## Estimated Sessions: 1
## Dependencies: TASK-002, TASK-004, TASK-006, TASK-008
## Requirements Covered: R2
## Spec Reference: Section 2.4

## Inference Summary

This expanded task replaces the original 96-word TASK-009. Each addition is sourced as follows:

| Addition | Source |
|---|---|
| Card-style form matching TASK-008 styling exactly | Q-2.1 operator-answer (use default) |
| No "remember me" checkbox | Q-2.2 operator-answer (use default) |
| Rate-limit 3/hour/IP on /forgot endpoint | Q-2.3 operator-answer (use default); R-TASK-104 |
| 24-hour reset link TTL (Supabase default) | Q-2.4 operator-answer (use default) |
| `returnTo` query param honored on signin | TASK-007 middleware (already expanded) |
| Error state styling per `lib/brand.ts` | TASK-002 expansion (already shipped) |
| Forgot password reset link via Supabase Auth | Decision #2 stack |

Operator confirmed all questions on 2026-05-08.

## Pre-flight: re-read current state

- View `app/(auth)/signin/page.tsx` and `app/(auth)/forgot/page.tsx` if present.
- Confirm TASK-008 (signup-page) has shipped — TASK-009 reuses its form-styling patterns.
- Confirm TASK-006 (api-auth) and TASK-007 (middleware) have shipped — TASK-009 depends on the session-cookie infrastructure they establish.
- Confirm `lib/ratelimit.ts` (R-TASK-104) is in place. If R-104 hasn't shipped yet, TASK-009 ships without rate-limit calls and a Pre-flight comment in the code marks where to wire them when R-104 lands.
- Verify Supabase Auth's password-reset email is configured to redirect to `${NEXT_PUBLIC_SITE_URL}/reset-password` (set in Supabase Dashboard > Authentication > URL Configuration).

## Files to Create/Modify

- `app/(auth)/signin/page.tsx` (NEW)
- `app/(auth)/signin/actions.ts` (NEW; server action for sign-in submit)
- `app/(auth)/forgot/page.tsx` (NEW)
- `app/(auth)/forgot/actions.ts` (NEW; server action for forgot-password submit)
- `app/(auth)/reset-password/page.tsx` (NEW; lands here from the reset email link)
- `app/(auth)/reset-password/actions.ts` (NEW; server action for new-password submit)

The reset-password page lives in this task because it's the back half of the forgot-password flow; without it, the reset emails dead-end.

## Implementation Requirements

### `/signin` page

Card-style form on navy background. Match TASK-008 styling exactly per Q-2.1: 480px card width, `bg-brand-navyLight` card background, `text-brand-white` body, brand-gold CTA, brand-error inline error states. Same focus-ring styling from `app/globals.css` (TASK-002 expansion).

Fields:
1. Email (email, required, lowercase trim)
2. Password (password, required, min 1 char client-side; server validates against Supabase)

No "remember me" checkbox per Q-2.2 default — sessions persist via HTTP-only cookies regardless (Decision #18).

Below the form: "Don't have an account? [Sign up](/signup)" and "[Forgot password?](/forgot)" links. Both use brand-gold link color.

### `/signin` server action: `signinAction(formData)`

```typescript
'use server';
import { createClient } from '@/lib/supabase/server';
import { ipRateLimit } from '@/lib/ratelimit';
import { headers } from 'next/headers';
import { redirect } from 'next/navigation';

export async function signinAction(formData: FormData) {
  const email = String(formData.get('email') ?? '').toLowerCase().trim();
  const password = String(formData.get('password') ?? '');
  const returnTo = String(formData.get('returnTo') ?? '/app');

  if (!email || !password) return { error: 'all_fields_required' };

  // Rate-limit per R-TASK-104 (same 3/hour/IP as signup per Q-2.3)
  const ip = headers().get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown';
  const allowed = await ipRateLimit(ip, 'route:/signin');
  if (!allowed) return { error: 'rate_limit' };

  const sb = createClient();
  const { error } = await sb.auth.signInWithPassword({ email, password });
  if (error) {
    // Generic error — never leak whether email exists (timing attacks, account enumeration)
    return { error: 'invalid_credentials' };
  }

  // returnTo from middleware redirect when user hit a protected route while signed out;
  // sanitize to prevent open-redirect (only allow same-origin paths).
  const safeReturn = returnTo.startsWith('/') && !returnTo.startsWith('//') ? returnTo : '/app';
  redirect(safeReturn);
}
```

Error state matrix:
- `all_fields_required`: "Please enter email and password."
- `invalid_credentials`: "Invalid email or password." (generic — no enumeration leak)
- `rate_limit`: "Too many sign-in attempts. Please try again in an hour."

The `returnTo` param is read from the URL on initial page load and forwarded as a hidden form input. Middleware (TASK-007) sets it when redirecting unauthenticated users from protected routes.

### `/forgot` page

Single field: Email. Below: "Remember it? [Sign in](/signin)" link.

### `/forgot` server action: `forgotAction(formData)`

```typescript
'use server';
import { createClient } from '@/lib/supabase/server';
import { ipRateLimit } from '@/lib/ratelimit';
import { headers } from 'next/headers';

export async function forgotAction(formData: FormData) {
  const email = String(formData.get('email') ?? '').toLowerCase().trim();
  if (!email) return { error: 'email_required' };

  // 3/hour/IP per Q-2.3 default (same limit as signup; the email itself is throttled
  // by Supabase Auth's internal rate-limit on auth.resetPasswordForEmail)
  const ip = headers().get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown';
  const allowed = await ipRateLimit(ip, 'route:/forgot');
  if (!allowed) return { error: 'rate_limit' };

  const sb = createClient();
  // Supabase auto-generates a one-time token, sends email via Supabase's built-in email
  // service (NOT Resend). Email contains a link with the token; link goes to /reset-password.
  // Reset link TTL is 24 hours per Q-2.4 default (Supabase default).
  await sb.auth.resetPasswordForEmail(email, {
    redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/reset-password`,
  });

  // Always return ok=true regardless of whether email exists in database
  // (privacy / no enumeration leak).
  return { ok: true };
}
```

After submit, the page shows a confirmation banner: "If an account exists for that email, a reset link has been sent. Check your inbox." This message is the same whether the email exists or not — prevents enumeration.

### `/reset-password` page

Lands here from the reset email link. The URL contains an access_token in the query string (or hash fragment, depending on Supabase Auth flow). Two fields: New Password (min 12 chars, HIBP check per TASK-008 R-TASK-114 pattern), Confirm New Password.

```typescript
// app/(auth)/reset-password/actions.ts
'use server';
import { createClient } from '@/lib/supabase/server';
import { checkBreached } from '@/lib/hibp';

export async function resetPasswordAction(formData: FormData) {
  const password = String(formData.get('password') ?? '');
  const confirm = String(formData.get('confirm') ?? '');
  if (!password || password.length < 12) return { error: 'password_too_short' };
  if (password !== confirm) return { error: 'passwords_dont_match' };

  // HIBP check per TASK-008 / R-TASK-114
  let breached = false;
  try { breached = await checkBreached(password); } catch { /* HIBP down: warn but allow */ }
  if (breached) return { error: 'password_breached' };

  // The session cookie is already populated by the redirect from the email link;
  // updateUser uses the current session.
  const sb = createClient();
  const { error } = await sb.auth.updateUser({ password });
  if (error) return { error: 'reset_failed' };

  return { ok: true };
}
```

On `ok: true`, redirect to `/signin?reset=true` with a success banner ("Password updated. Please sign in.").

Reset-link expiry (24h per Q-2.4) is enforced by Supabase Auth itself — if the user clicks an expired link, `auth.updateUser` returns an error and the UI shows: "This reset link has expired. [Request a new one](/forgot)."

## What this task does NOT do

- Does NOT implement signup (TASK-008 already handles)
- Does NOT implement social sign-in (Google, Apple, etc.) — deferred to v1.1 if user feedback demands
- Does NOT implement passwordless / magic link sign-in — deferred to v1.1
- Does NOT bypass the HIBP check on reset (same standard as signup)
- Does NOT include MFA challenge during signin — Supabase Auth handles MFA-AAL2 transparently if the user has TOTP enrolled (R-TASK-103); the signin form doesn't need a separate MFA field

## Tests Required

- AT-014: `/signin` form renders matching TASK-008 styling
- AT-015: Valid credentials → redirected to `/app` (or `returnTo` value if present)
- AT-016: Invalid credentials → "invalid_credentials" error, stays on `/signin`
- AT-017: `/forgot` form submission → reset email arrives in test inbox (Q-8.13 environment)
- AT-018: Reset link → `/reset-password` page loads; submitting new password updates auth + redirects to `/signin?reset=true`
- AT-019: Submitting a known-breached password on reset → `password_breached` error, no update
- AT-020: Rate-limit on `/signin`: 4th sign-in attempt from same IP within 60 minutes returns 429
- AT-021: `returnTo=/admin/audit` → after sign-in, redirected to `/admin/audit` (open-redirect protection: `returnTo=//evil.com` redirects to `/app` instead)
- AT-022: Mechanical: `/signin` and `/forgot` and `/reset-password` are in the public-routes whitelist (TASK-007)

## Session Notes
_(Filled by Claude Code during implementation)_
