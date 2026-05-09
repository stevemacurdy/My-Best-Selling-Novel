<!-- APPLY: REPLACE -->
<!-- Target: docs/TASKS/TASK-008-signup-page.md (in original mybsn package) -->
<!-- Backup: docs/EXPANDED-TASKS/backups/TASK-008-signup-page.pre-expansion-backup.md -->
<!-- Expanded 2026-05-06 from 113 words to ~1300 words via PATCH-3 sub-deliverable B.3 (added per B.1.5 recommendation; signup is the integration surface for R-TASK-114, R-TASK-120, and R-TASK-103). -->

# TASK-008: Signup Page (`app/(auth)/signup/page.tsx`)

## Status: NOT STARTED
## Priority: CRITICAL
## Phase: 2
## Estimated Sessions: 2
## Dependencies: TASK-002, TASK-004
## Requirements Covered: R2
## Spec Reference: Section 2.3

## Inference Summary

This expanded task replaces the original 113-word TASK-008. Each addition is sourced as follows:

| Addition | Source |
|---|---|
| Form fields (Full Name, Email, Password) + tier-default Explorer | Original TASK-008 + Q-2.9 operator-answer (use default — Explorer-default) |
| HIBP password breach check on submit | Q-2.7 operator-answer (use default); R-TASK-114 |
| Three acceptance checkboxes (ToS+AUP combined, Privacy, Refunds) | Q-2.8 + Q-8.4 (a) operator-answers |
| Optional dismissable MFA banner on /app post-signup | Q-2.10 operator-answer (use default — option d) |
| Soft email-verification gate | Q-2.11 operator-answer (use default — soft gate, banner on /app) |
| Error state matrix (duplicate, weak, breached, network, Supabase down, HIBP down) | Q-2.12 operator-answer (use default) |
| Brand colors via `lib/brand.ts` | Q-1.4 + Q-1.6 + TASK-002 |
| Acceptance recording into `document_acceptances` | R-TASK-120 |

Operator confirmed all questions on 2026-05-06.

## Pre-flight: re-read current state

- View `app/(auth)/signup/page.tsx` if present. The original TASK-008 spec described a basic form; if a basic form is in place, this expanded task adds the HIBP/acceptance/MFA layers without rewriting the structure.
- Confirm `lib/api-auth.ts` (TASK-006) and `app/middleware.ts` (TASK-007) are in place.
- Confirm `migrations/014_document_acceptances.sql` (R-TASK-120) is applied — without it, the 3-checkbox acceptance recording fails.
- View `lib/brand.ts` to confirm error/success/etc. color tokens exist.

## Files to Create/Modify

- `app/(auth)/signup/page.tsx` (NEW or REPLACE if stub exists)
- `app/(auth)/signup/actions.ts` (NEW; server actions for the submit flow)
- `lib/hibp.ts` (NEW; thin wrapper around the HIBP Pwned Passwords API; called from the server action)
- `lib/acceptance.ts` (already created in R-TASK-120; just imported here)

## Implementation Requirements

### Form structure

Client component rendering a card-style form on a navy background. Fields:

1. Full Name (text, required, 1–100 chars)
2. Email (email, required, lowercase trim, basic regex)
3. Password (password, required, min 12 chars per R-TASK-114)
4. **Three acceptance checkboxes (Q-8.4 = (a) inline AUP in ToS):**
   - ☐ I agree to the [Terms of Service & Acceptable Use Policy](/terms) (required)
   - ☐ I agree to the [Privacy Policy](/privacy) (required)
   - ☐ I agree to the [Refund Policy](/refunds) (required)
5. Submit button — disabled until all 3 checkboxes checked AND no client-side validation errors

No tier selection field (Q-2.9 default — Explorer-default). The tier upgrade flow lives entirely in `/pricing` and `/account/billing`.

### Server action: `signupAction(formData)`

```typescript
// app/(auth)/signup/actions.ts (server action)
'use server';
import { createServerClient } from '@supabase/ssr';
import { checkBreached } from '@/lib/hibp';
import { recordAcceptance } from '@/lib/acceptance';

export async function signupAction(formData: FormData) {
  const fullName = String(formData.get('full_name') ?? '').trim();
  const email = String(formData.get('email') ?? '').toLowerCase().trim();
  const password = String(formData.get('password') ?? '');
  const acceptedTos = formData.get('accept_tos') === 'on';
  const acceptedPrivacy = formData.get('accept_privacy') === 'on';
  const acceptedRefunds = formData.get('accept_refunds') === 'on';

  // 1. Server-side validation (defense-in-depth)
  if (!fullName || !email || !password) return { error: 'all_fields_required' };
  if (password.length < 12) return { error: 'password_too_short' };
  if (!acceptedTos || !acceptedPrivacy || !acceptedRefunds) return { error: 'must_accept_all' };

  // 2. HIBP breach check (Q-2.7 default — on submit, before account creation)
  let breached: boolean;
  try {
    breached = await checkBreached(password);
  } catch {
    // HIBP service down (Q-2.12 default — warn but allow signup; flag for later rotation)
    breached = false;
    // Sentry warn (R-TASK-106)
  }
  if (breached) return { error: 'password_breached' };

  // 3. Create Supabase user
  const sb = /* create server client per TASK-004 */;
  const { data, error } = await sb.auth.signUp({
    email,
    password,
    options: { data: { full_name: fullName }, emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/app` },
  });
  if (error) {
    if (error.code === 'user_already_exists') return { error: 'email_in_use' };
    // Sentry capture
    return { error: 'signup_failed' };
  }
  const userId = data.user?.id;
  if (!userId) return { error: 'signup_failed' };

  // 4. Record 3 acceptance rows (R-TASK-120)
  // Note: Q-8.4 = (a) → ToS includes inline AUP summary; one acceptance covers both.
  const ip = /* extract from request headers */;
  const ua = /* extract from request headers */;
  await Promise.all([
    recordAcceptance({ user_id: userId, document_type: 'tos', document_version: TOS_VERSION, ip_address: ip, user_agent: ua }),
    recordAcceptance({ user_id: userId, document_type: 'privacy', document_version: PRIVACY_VERSION, ip_address: ip, user_agent: ua }),
    recordAcceptance({ user_id: userId, document_type: 'refunds', document_version: REFUNDS_VERSION, ip_address: ip, user_agent: ua }),
  ]);

  return { ok: true };
}
```

### `lib/hibp.ts` — HIBP Pwned Passwords API wrapper

Uses the k-anonymity model: client SHA-1's the password, sends only the first 5 chars of the hash, server returns all hashes matching that prefix; client checks for full match locally. **The plaintext password never leaves the server.**

```typescript
import { createHash } from 'node:crypto';
export async function checkBreached(password: string): Promise<boolean> {
  const hash = createHash('sha1').update(password).digest('hex').toUpperCase();
  const prefix = hash.slice(0, 5);
  const suffix = hash.slice(5);
  const res = await fetch(`https://api.pwnedpasswords.com/range/${prefix}`, {
    headers: { 'User-Agent': 'mybestsellingnovel-signup' },
    signal: AbortSignal.timeout(3000),
  });
  if (!res.ok) throw new Error(`HIBP responded ${res.status}`);
  const text = await res.text();
  return text.split('\n').some((line) => line.split(':')[0]?.trim() === suffix);
}
```

This runs server-side only (Node runtime, not Edge — `node:crypto` is not in Edge Runtime). The signup action is a server action invoked from the form, which gives us Node runtime by default.

### Error state matrix (Q-2.12 default)

Map `error` codes returned by `signupAction` to inline error messages, displayed below the submit button. Use `text-brand-error` from `lib/brand.ts`.

| Error code | Message |
|---|---|
| `all_fields_required` | Please fill in all fields. |
| `password_too_short` | Password must be at least 12 characters. |
| `must_accept_all` | Please accept the Terms, Privacy Policy, and Refund Policy. |
| `password_breached` | This password appears in known data breaches. Please choose a different one. |
| `email_in_use` | An account with this email already exists. [Sign in](/signin) instead? |
| `signup_failed` | Something went wrong. Please try again, or [contact support](/help). |

Network errors (fetch fails entirely) bubble up as `signup_failed` with a retry suggestion.

### Post-signup flow

On `ok: true`:

1. Redirect to `/app`. The user is auto-signed-in by Supabase (signUp returns a session).
2. **MFA banner (Q-2.10 default — option d)**: on first `/app` load, show a dismissable banner: "Recommended: Add two-factor authentication to your account. [Enroll now](/account/mfa) [Dismiss forever]." The dismiss button writes a flag to `profiles.mfa_banner_dismissed = true` and the banner doesn't reappear. For users who later acquire `role='admin'`, MFA enrollment is FORCED by `verifyAdmin` (TASK-006) regardless of this flag.
3. **Email verification banner (Q-2.11 default — soft gate)**: if `auth.users.email_confirmed_at IS NULL`, show a separate banner: "Please verify your email. [Resend verification link]". This banner does NOT block /app; it only blocks Stripe Checkout (Stripe requires verified email at the API level).

### Brand styling

All form elements use `lib/brand.ts` tokens. Card has `bg-brand-navyLight` background, `text-brand-white` body text. Error messages use `text-brand-error` and `bg-brand-errorBg/20` for the alert background. Focus ring on inputs uses brand-gold per `app/globals.css`. CTA button: `bg-brand-gold text-brand-navy` with `hover:bg-brand-goldDim`.

## Tests Required

- AT-014: Form renders with all 4 inputs and 3 acceptance checkboxes
- AT-015: Submit disabled until all 3 checkboxes checked
- AT-016: Successful signup writes auth.users row + 3 document_acceptances rows
- AT-017: Submitting a known breached password (e.g., "password123456") returns 'password_breached' error
- AT-018: Submitting duplicate email returns 'email_in_use' error with sign-in link
- AT-019: Form submits via server action (not client-side `fetch`); inspect Network tab to verify
- AT-020: First /app load post-signup shows MFA banner with Enroll/Dismiss; clicking Dismiss persists `mfa_banner_dismissed=true`
- AT-021: Mechanical: form does not contain a "tier" or "plan" select (per Q-2.9 Explorer-default)

## Session Notes
_(Filled by Claude Code during implementation)_
