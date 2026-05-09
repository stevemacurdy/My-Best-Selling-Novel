<!-- APPLY: REPLACE -->
<!-- Target: docs/TASKS/TASK-056-email-wiring.md (in original mybsn package) -->
<!-- Backup: docs/EXPANDED-TASKS/backups/TASK-056-email-wiring.pre-expansion-backup.md -->
<!-- Expanded 2026-05-09 from 102 words to ~960 words via PATCH-3 sub-deliverable B.3. -->

# TASK-056: Email Wiring (Welcome + Upgrade triggers)

## Status: NOT STARTED
## Priority: HIGH
## Phase: 8
## Estimated Sessions: 1
## Dependencies: TASK-005 (`lib/resend.ts`), TASK-008 (signup triggers welcome), TASK-024 (webhook triggers upgrade), TASK-054, TASK-055, R-TASK-106 (Sentry capture on failure)
## Requirements Covered: R34
## Spec Reference: Section 8.3

## Inference Summary

| Addition | Source |
|---|---|
| Welcome fires on `auth.signUp` success synchronously in route | Q-8.10 operator-answer (use default — immediate, soft email gate) |
| Upgrade fires from webhook async fire-and-forget | Q-8.11 operator-answer (use default) |
| Failure: log-and-drop with Sentry warning | Q-8.12 operator-answer (use default) |
| Test inbox redirect in dev/staging | Q-8.13 operator-answer (use default); R-TASK-122 staging |
| No Resend delivery webhooks in v1 | Q-8.14 operator-answer (use default — defer to v1.1) |
| Wraps `getResend().emails.send()` with 30s timeout via `Promise.race` | TASK-005 expansion |

Operator confirmed all questions on 2026-05-08.

## Pre-flight: re-read current state

- Confirm TASK-054 + TASK-055 templates exist with `renderWelcomeEmail` and `renderUpgradeEmail` functions.
- Confirm `lib/resend.ts` (TASK-005) `getResend()` and `getFromAddress()` are available.
- Confirm `lib/sentry.ts` (R-TASK-106) `captureException` is available for error logging.
- Confirm staging environment has `RESEND_TEST_INBOX` env var (R-TASK-122) — all dev/staging emails redirect to this address.

## Files to Create/Modify

- `lib/email-send.ts` (NEW) — shared `sendEmail()` wrapper with timeout + Sentry capture + dev/staging test-inbox redirect
- `app/(auth)/signup/actions.ts` (MODIFY; called from TASK-008) — add `await sendWelcomeEmail(...)` after `auth.signUp` success
- `app/api/stripe/webhook/route.ts` (MODIFY; from TASK-024) — add async `sendUpgradeEmail(...)` on `subscription.created`
- `lib/email-helpers.ts` (NEW) — exports `sendWelcomeEmail()` and `sendUpgradeEmail()` thin wrappers calling `sendEmail()` with the appropriate template

## Implementation Requirements

### `lib/email-send.ts` — shared send wrapper

```typescript
import { getResend, getFromAddress } from '@/lib/resend';
import { captureException, captureMessage } from '@/lib/sentry';

interface SendEmailParams {
  to: string;
  subject: string;
  html: string;
  text: string;
  replyTo?: string;
  tags?: Record<string, string>;  // for Sentry breadcrumbs
}

const SEND_TIMEOUT_MS = 30_000;

/**
 * Send an email via Resend with 30s timeout, dev/staging redirect, and Sentry capture on failure.
 * Per Q-8.12, failures log to Sentry but do not throw — calling code continues normally.
 */
export async function sendEmail(params: SendEmailParams): Promise<{ ok: boolean; id?: string }> {
  // Q-8.13 — dev/staging redirect
  const isProduction = process.env.NODE_ENV === 'production' && !process.env.RESEND_TEST_INBOX;
  const actualTo = isProduction ? params.to : (process.env.RESEND_TEST_INBOX ?? params.to);

  try {
    const sendPromise = getResend().emails.send({
      from: getFromAddress(),
      to: actualTo,
      subject: params.subject,
      html: params.html,
      text: params.text,
      reply_to: params.replyTo,
      headers: { 'X-Original-To': params.to },  // for debugging when redirected
    });

    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error('resend_timeout')), SEND_TIMEOUT_MS)
    );

    const result = await Promise.race([sendPromise, timeoutPromise]);
    return { ok: true, id: result.data?.id };
  } catch (err) {
    captureException(err, {
      tags: { surface: 'email_send', ...params.tags },
      extra: { to: params.to, subject: params.subject },
    });
    return { ok: false };
  }
}
```

The function returns `{ ok }` instead of throwing — calling code never breaks because email failed. Per Q-8.12 default: log-and-drop. Sentry alert fires on failure (R-TASK-128 alerting can route email-send failures to a low-priority channel).

### `lib/email-helpers.ts` — typed wrappers

```typescript
import { renderWelcomeEmail } from './emails/welcome';
import { renderUpgradeEmail } from './emails/upgrade';
import { sendEmail } from './email-send';

export async function sendWelcomeEmail({ to, firstName, signupSource }: {
  to: string; firstName?: string; signupSource?: string;
}) {
  const { subject, html, text } = renderWelcomeEmail({ firstName, signupSource });
  return sendEmail({
    to,
    subject,
    html,
    text,
    replyTo: 'steve@mybestsellingnovel.com',  // voice line "Reply to this email" implies replyable
    tags: { template: 'welcome' },
  });
}

export async function sendUpgradeEmail({ to, firstName, tier, interval }: {
  to: string; firstName?: string; tier: 'author'|'publisher'; interval: 'monthly'|'annual';
}) {
  const { subject, html, text } = renderUpgradeEmail({ tier, interval, firstName });
  return sendEmail({
    to,
    subject,
    html,
    text,
    replyTo: 'steve@mybestsellingnovel.com',
    tags: { template: 'upgrade', tier, interval },
  });
}
```

### Wiring point 1 — Welcome email (signup)

In `app/(auth)/signup/actions.ts` (TASK-008's expanded server action), after successful `auth.signUp`:

```typescript
// After auth.signUp returns user
await sendWelcomeEmail({
  to: user.email!,
  firstName: user.user_metadata?.full_name?.split(' ')[0],
  signupSource: formData.get('source')?.toString() ?? 'direct',
});
// continue with redirect to /app regardless of email-send result
```

Per Q-8.10 default: synchronous in route. Welcome email is part of the signup flow's UX. If it fails, the user still completes signup; Sentry captures the failure for operator follow-up.

### Wiring point 2 — Upgrade email (webhook)

In `app/api/stripe/webhook/route.ts` (TASK-024 expanded handler), after processing `customer.subscription.created`:

```typescript
// After tier flip + DB write succeeds
const profile = await sb.from('profiles').select('email, full_name').eq('id', userId).single();
const tier = mapPriceIdToTier(subscription.items.data[0].price.id);  // 'author' | 'publisher'
const interval = mapPriceIdToInterval(subscription.items.data[0].price.id);  // 'monthly' | 'annual'

// Q-8.11: async fire-and-forget — do NOT await
Promise.resolve()
  .then(() => sendUpgradeEmail({
    to: profile.data!.email,
    firstName: profile.data!.full_name?.split(' ')[0],
    tier,
    interval,
  }))
  .catch((err) => captureException(err, { tags: { surface: 'upgrade_email_async' } }));

// Webhook returns 200 to Stripe immediately — does not wait for email
return NextResponse.json({ ok: true });
```

Per Q-8.11 default: webhook handler returns 200 fast (Stripe retries any handler that takes >10s), email queued via fire-and-forget Promise. The DB write is the critical path; the email is decoration.

### Test inbox redirect (Q-8.13)

In dev/staging environments, set `RESEND_TEST_INBOX=test@mybestsellingnovel.com` (or operator's chosen address). All emails redirect there. Real recipient address preserved in `X-Original-To` header for debugging.

Production: `RESEND_TEST_INBOX` is unset; emails go to real recipients.

R-TASK-122 staging documents the env-var setup; this task wires the redirect logic.

### No Resend delivery webhooks (Q-8.14)

Resend supports webhooks for `email.delivered`, `email.bounced`, `email.complained` events. Subscribing would let us track email health and surface bounces. Per Q-8.14 default: deferred to v1.1. Email-send failures still surface as Sentry alerts via Q-8.12 path — adequate for v1 visibility.

When v1.1 enables Resend webhooks: add `app/api/resend/webhook/route.ts` to handle delivery events and update an `email_events` table for analytics. Document in `docs/EMAIL_COMPLIANCE.md` as a planned v1.1 expansion.

### Failure observability

Every email-send failure produces a Sentry exception with tags:
- `surface: email_send` (top-level identifier)
- `template: welcome | upgrade` (which template failed)
- `tier`, `interval` (for upgrade emails)

R-TASK-128 alerting can route these to a low-priority channel. Operator gets a daily/weekly digest rather than each failure paging immediately — emails are non-critical-path.

## Tests Required

- AT-234: `sendEmail()` with valid params in production → email arrives at `to` address; Resend dashboard shows success
- AT-235: `sendEmail()` with `RESEND_TEST_INBOX` set → email arrives at the test inbox; `X-Original-To` header preserves real `to`
- AT-236: `sendEmail()` with mocked Resend timeout → returns `{ ok: false }`; Sentry exception logged; calling code does not throw
- AT-237: Signup flow sends welcome email with correct firstName and source extracted
- AT-238: Webhook handler returns 200 within 100ms even when email send takes 5s (verify async fire-and-forget)
- AT-239: Webhook handler captures upgrade-email failure to Sentry without affecting webhook 200 response
- AT-240: Mechanical: zero `await` calls on `sendUpgradeEmail` in webhook handler (must be fire-and-forget per Q-8.11)
- AT-241: Mechanical: `sendWelcomeEmail` IS awaited in signup action (synchronous per Q-8.10) but its failure does not break signup flow

## Session Notes
_(Filled by Claude Code during implementation)_
