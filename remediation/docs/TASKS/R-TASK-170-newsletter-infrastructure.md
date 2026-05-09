<!-- APPLY: CREATE -->
# R-TASK-170: Newsletter Infrastructure (Resend Broadcasts + subscribe endpoint + Sunday cron + welcome flow)

## Status: NOT STARTED
## Priority: HIGH
## Phase: 8
## Estimated Sessions: 2
## Dependencies: TASK-005 (`lib/resend.ts`), TASK-007 (public-routes whitelist), R-TASK-104 (rate-limiting), R-TASK-119 (CAN-SPAM compliance)
## Cluster: PATCH-3 round 2 v1 content cluster

## Inference Summary

| Addition | Source |
|---|---|
| Resend Broadcasts (audiences feature) | Q-F operator-answer (use default — Resend Broadcasts; minimize vendors) |
| Double opt-in flow per CAN-SPAM + EU best practice | R-TASK-119 + standard SaaS |
| Footer subscribe form integration | Operator footer copy spec ("Get one good writing prompt every Sunday morning") |
| Sunday-morning send cron via Vercel Cron | Operator's stated newsletter cadence |
| Welcome email triggered on confirmed subscribe | Standard newsletter UX |
| Subscriber records live in Resend, not Supabase | Cleaner separation; Resend is the source of truth for audience |
| Rate-limit per R-TASK-104 (10 subscribes/hour/IP) | Same pattern as signup |

Operator Q-F answered 2026-05-08.

## Pre-flight: re-read current state

- Confirm `lib/resend.ts` (TASK-005) has `getResend()` lazy getter.
- Confirm Resend account has Broadcasts feature enabled (free tier covers up to 3,000 contacts as of 2026; verify at TASK-170 ship time).
- Confirm domain `mybestsellingnovel.com` verified in Resend (DKIM, SPF, DMARC records added per R-TASK-122).
- Confirm `/api/newsletter/subscribe` and `/newsletter/confirmed` in middleware public-routes whitelist.
- View `lib/api-auth.ts` for `ipRateLimit` import pattern (R-TASK-104).

## Files to Create

- `lib/newsletter.ts` — wrapper for Resend Broadcasts API (audience CRUD, contact CRUD)
- `app/api/newsletter/subscribe/route.ts` — POST to add a contact (double opt-in: triggers confirmation email)
- `app/api/newsletter/confirm/route.ts` — GET (the confirmation link target); marks contact as confirmed in Resend, sends welcome email, redirects to `/newsletter/confirmed`
- `app/newsletter/confirmed/page.tsx` — landing page after confirmed subscribe
- `app/api/cron/newsletter-send/route.ts` — Sunday cron (Vercel Cron); pulls latest broadcast draft from Resend and sends; or operator manually queues sends in Resend Dashboard (simpler v1 path)
- `components/marketing/NewsletterCapture.tsx` — reusable form component (footer + lead-magnet usage)
- `vercel.json` — cron config (additive)

## Implementation Requirements

### Resend audience setup (one-time, manual)

Operator creates one audience in Resend Dashboard: "MyBSN Sunday Prompt." Note the audience UUID. Add to `.env.local.example` as `RESEND_AUDIENCE_ID` (becomes the 18th env var; update TASK-003 expansion's drift note in B.5 packet rebuild).

### `lib/newsletter.ts` — wrapper

```typescript
import { getResend } from './resend';

const AUDIENCE_ID = process.env.RESEND_AUDIENCE_ID!;

export async function addContact(email: string, opts?: { unconfirmed?: boolean }) {
  // Resend stores contacts with `unsubscribed: true | false`. Double opt-in pattern:
  // add contact with unsubscribed=true initially; on confirmation flip to unsubscribed=false.
  return await getResend().contacts.create({
    audienceId: AUDIENCE_ID,
    email: email.toLowerCase().trim(),
    unsubscribed: opts?.unconfirmed ?? true,
  });
}

export async function confirmContact(email: string) {
  return await getResend().contacts.update({
    audienceId: AUDIENCE_ID,
    email: email.toLowerCase().trim(),
    unsubscribed: false,
  });
}

export async function isContact(email: string) {
  // Check existence; returns null if not found
  // Resend SDK throws if not found — wrap in try/catch
}
```

### POST `/api/newsletter/subscribe`

```typescript
const ip = headers().get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown';
const allowed = await ipRateLimit(ip, 'route:/newsletter/subscribe', { limit: 10, windowMs: 3600_000 });
if (!allowed) return NextResponse.json({ error: 'rate_limit' }, { status: 429 });

const { email } = await req.json();
if (!email || !isValidEmail(email)) return NextResponse.json({ error: 'invalid_email' }, { status: 400 });

// Add as unconfirmed contact (double opt-in)
await addContact(email, { unconfirmed: true });

// Send confirmation email via Resend transactional (separate from Broadcasts)
const confirmToken = signToken({ email, action: 'confirm_newsletter', exp: Date.now() + 24*3600*1000 });
const confirmUrl = `${process.env.NEXT_PUBLIC_SITE_URL}/api/newsletter/confirm?token=${confirmToken}`;

await getResend().emails.send({
  from: getFromAddress(),
  to: email,
  subject: 'Confirm your subscription — My Best Selling Novel',
  html: renderConfirmEmail(confirmUrl),  // template with brand colors + 24h expiry note
});

return NextResponse.json({ ok: true, message: 'check_your_inbox' });
```

The confirmation token uses HMAC signing with a server secret (`NEWSLETTER_TOKEN_SECRET` env var — 19th env var; document in B.5). 24-hour TTL.

### GET `/api/newsletter/confirm?token=...`

```typescript
// Verify token; extract email; flip contact to unsubscribed=false
// Send welcome email via Resend (with the literary footer voice + Sunday-prompt promise)
// Redirect to /newsletter/confirmed
```

### Welcome email content

Subject: "You're in. Sunday morning, see you there."
Body (matching operator's voice from footer copy):
> Welcome. Once a week, on Sunday morning, you'll get one writing prompt and one paragraph from a novelist worth reading.
>
> No spam, no upsells, no "10 ways to crush your goals." Just a prompt, a paragraph, and a quiet nudge to write something this week.
>
> If you want to start writing right now, [Start Chapter One →](https://mybestsellingnovel.com/signup).
>
> — Steve
> Made for writers, by writers who got tired of waiting

Includes unsubscribe link (Resend appends automatically; verify in Resend Broadcasts settings) and the operator's CAN-SPAM postal address (1068 Industrial Park Circle, Grantsville, UT 84029) per R-TASK-119.

### `<NewsletterCapture />` component

Used in:
- Footer (per operator's footer copy spec, right-aligned block)
- `/resources/outline-template` lead magnet (R-TASK-171 cross-bind; submitting the lead magnet form also adds to newsletter audience with the user's confirmation)

Two variants:
- `<NewsletterCapture variant="footer" />` — full pitch with the "Get one good writing prompt every Sunday morning" headline + "no spam, no upsells" line
- `<NewsletterCapture variant="inline" />` — compact, single-line input + button for embedding in blog posts (v1.1 use)

### Sunday cron — `/api/cron/newsletter-send`

Vercel Cron job; `vercel.json` schedule: `"0 14 * * 0"` (14:00 UTC Sundays = 7:00 AM Mountain Time, operator's local). The route handler is **gated by Vercel's Cron-specific bearer token** (Vercel injects `Authorization: Bearer $CRON_SECRET`).

Behavior options for v1:
- **(a) Manual:** cron does nothing automatically; operator manually clicks "Send" in Resend Broadcasts UI each Sunday. Cron route exists but is a no-op for v1; add `// TODO: automate broadcast send in v1.1` comment.
- **(b) Automated:** cron pulls the latest scheduled broadcast in Resend (via API) and triggers send. More complex; defer to v1.1.

Default: **(a) manual.** Operator's Sunday writing time is when the prompt is composed; manual send keeps the human in the loop. Wire the cron schedule for future automation.

### CAN-SPAM compliance

- All emails (confirmation, welcome, every Sunday prompt) include:
  - Operator's postal address: 1068 Industrial Park Circle, Grantsville, UT 84029
  - Unsubscribe link (Resend Broadcasts auto-includes; verify enabled)
  - Sender identity matches: From "My Best Selling Novel <noreply@mybestsellingnovel.com>"
- Per R-TASK-119, document this in `docs/EMAIL_COMPLIANCE.md` (created here as additive doc; alternative: include section in DEPLOY.md)

## Tests Required

- AT-170-1: POST `/api/newsletter/subscribe` with valid email → 200 + confirmation email arrives in test inbox within 30s
- AT-170-2: Submit same email twice within rate-limit window → second 429
- AT-170-3: Invalid email format → 400 `invalid_email`
- AT-170-4: GET `/api/newsletter/confirm?token=...` with valid token → contact flipped to confirmed in Resend; welcome email sent; redirect to `/newsletter/confirmed`
- AT-170-5: Token expired (>24h old) → 400 `token_expired`; user can re-submit form to start over
- AT-170-6: `/newsletter/confirmed` page shows confirmation copy + CTA "Start Chapter One →"
- AT-170-7: `<NewsletterCapture variant="footer">` renders in TASK-043 footer with operator's exact copy
- AT-170-8: Vercel Cron config in `vercel.json` schedules `/api/cron/newsletter-send` for Sundays 14:00 UTC
- AT-170-9: All emails contain postal address + unsubscribe link (Resend audit trail confirms)
- AT-170-10: Rate-limit on subscribe endpoint enforces 10/hour/IP

## Session Notes
_(Filled by Claude Code during implementation)_
