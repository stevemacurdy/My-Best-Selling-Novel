<!-- APPLY: REPLACE -->
<!-- Target: docs/TASKS/TASK-055-upgrade-email.md (in original mybsn package) -->
<!-- Backup: docs/EXPANDED-TASKS/backups/TASK-055-upgrade-email.pre-expansion-backup.md -->
<!-- Expanded 2026-05-09 from 84 words to ~970 words via PATCH-3 sub-deliverable B.3.
     Operator voice copy drafted per directive 2026-05-09. -->

# TASK-055: Upgrade Email Templates (Author + Publisher)

## Status: NOT STARTED
## Priority: HIGH
## Phase: 8
## Estimated Sessions: 1
## Dependencies: TASK-005, TASK-024 (webhook fires send), TASK-054 (`_layout.tsx` shared shell), R-TASK-119 (CAN-SPAM)
## Requirements Covered: R34
## Spec Reference: Section 8.2

## Inference Summary

| Addition | Source |
|---|---|
| Tier-specific subject lines: "Welcome to Author!" / "Welcome to Publisher!" | Q-8.6 operator-answer (use default — tier-specific) |
| Features-unlocked list per tier | Q-8.7 operator-answer (use default) |
| Upgrade-specific content; no Stripe receipt duplication | Q-8.8 operator-answer (use default — upgrade-specific only) |
| Annual savings line for annual upgrades | Q-8.9 operator-answer (use default) |
| **Voice drafted to match TASK-054 + footer literary register** | Operator directive 2026-05-09 |
| Postal address from shared `_layout.tsx` | Q-8.5 + TASK-054 layout shell |

Operator confirmed all questions on 2026-05-08; voice directive on 2026-05-09.

## Pre-flight: re-read current state

- Confirm TASK-054 has shipped — `lib/emails/_layout.tsx` is the shared shell.
- Confirm TASK-024 (webhook handler) is in place — fires upgrade email on `subscription.created`.
- Confirm both Author and Publisher tier feature lists match Q-6.13 pricing-page lists (single source of truth via `lib/tier-features.ts` if shared; else verify alignment).

## Files to Create

- `lib/emails/upgrade.ts` — exports `renderUpgradeEmail({ tier, interval, firstName, currentPeriodEnd })` returning `{ subject, html, text }`
- `lib/emails/_upgrade-template.tsx` — react-email template (per-tier branching)
- `lib/tier-features.ts` (NEW shared if not present) — feature lists used by both pricing page (TASK-045) and this email

## Implementation Requirements

### `lib/tier-features.ts` (shared)

```typescript
export const TIER_FEATURES = {
  author: [
    'Unlimited books',
    '500 AI calls/month',
    'Full agent access (all 12 steps + Library)',
    'Audio recording + playback',
    'Export PDF/EPUB/DOCX',
    'Priority email support',
    'Priority queue (faster AI responses)',
  ],
  publisher: [
    'Everything in Author',
    '2,000 AI calls/month',
    'Folder upload (entire manuscript drag-drop)',
    'Advanced analytics',
    'Genre intelligence',
  ],
} as const;
```

Single source of truth — TASK-045 pricing page imports this; TASK-055 upgrade email imports this. Drift impossible.

### Author tier upgrade email

**Subject:** `Welcome to Author.`

(Period not exclamation — voice consistency. Operator override on review acceptable.)

**Body (drafted):**

```
Hey [firstName, or "writer"],

You upgraded. That means a few things changed:

- Unlimited books. Write as many as you want.
- 500 AI calls a month. Up from 25.
- Full agent access — all 12 steps, including Audio Recording in step 6
  and the Avoid System in step 5.
- Priority queue. Your AI responses come back faster than free-tier traffic.
- Export to PDF, EPUB, and DOCX. Audio chapters export to webm/mp4 for ACX.

[Continue writing →]

Two practical notes:

- Your card was charged for [Author Monthly $29 / Author Annual $313.20].
  Stripe sent your receipt separately — that's the official paper trail.

[IF interval=annual:]
- Smart move going annual — you're saving 10% versus monthly.
[END]

- 14-day money-back guarantee. If something's wrong, reply and tell me.
  No forms, no support tickets, no hoops.

Thanks for trusting us with your work.

— Steve
Founder, My Best Selling Novel
```

CTA:
- Primary: "Continue writing →" → `https://mybestsellingnovel.com/app`

### Publisher tier upgrade email

**Subject:** `Welcome to Publisher.`

**Body (drafted):**

```
Hey [firstName, or "writer"],

You went all in. Here's what unlocked:

- Everything in Author tier (unlimited books, full agent access, priority queue, exports)
- 2,000 AI calls a month — for prolific writers and small-press publishers
- Folder upload: drag a whole manuscript folder into step 2 and the agent
  parses chapter splits automatically
- Advanced analytics on your library: word counts, write rates, genre fits
- Genre intelligence: market data on demand, competition, and opportunity
  scores per genre — useful for deciding what to write next

[Continue writing →]

A few practical notes:

- Your card was charged for [Publisher Monthly $79 / Publisher Annual $853.20].
  Stripe sent your receipt separately.

[IF interval=annual:]
- Annual saved you $94.80 over monthly billing — nice.
[END]

- If you're publishing multiple books at once and want to discuss a
  workflow, reply to this email. We're small enough to actually talk to you.

— Steve
Founder, My Best Selling Novel
```

### Render function shape

```typescript
interface RenderUpgradeEmailParams {
  tier: 'author' | 'publisher';
  interval: 'monthly' | 'annual';
  firstName?: string;
  currentPeriodEnd?: Date;  // for "renews on" line if needed; not currently rendered, kept for future
}

export function renderUpgradeEmail(params: RenderUpgradeEmailParams) {
  const subject = params.tier === 'author' ? 'Welcome to Author.' : 'Welcome to Publisher.';
  const html = render(<UpgradeEmailTemplate {...params} />);
  const text = render(<UpgradeEmailTemplate {...params} />, { plainText: true });
  return { subject, html, text };
}
```

### Trigger point (Q-8.11)

Fires from `subscription.created` webhook handler (TASK-024) **asynchronously** — webhook returns 200 to Stripe quickly (per Stripe best practice; >10s handlers get retried), email send is fire-and-forget per Q-8.11 default:

```typescript
// In webhook handler
Promise.resolve()
  .then(() => sendUpgradeEmail({ user, subscription }))
  .catch((err) => Sentry.captureException(err, { tags: { email: 'upgrade' } }));
```

Per Q-8.12, failure logs to Sentry but doesn't block. The user's tier still flips correctly via the synchronous webhook DB update; the email is nice-to-have, not flow-critical.

### No Stripe receipt duplication (Q-8.8)

The upgrade email does NOT include line items, totals, tax, or anything resembling an invoice. Stripe sends a receipt automatically — that's the official document. The upgrade email focuses on **what you got** and **what to do next**, with a brief note acknowledging Stripe sent the receipt separately.

### Annual variant (Q-8.9)

Conditional line in body adds annual savings callout. For Author: "you're saving 10% versus monthly." For Publisher: "Annual saved you $94.80 over monthly billing." Calculations baked in (matches the 10% discount math from Q-6.13 pricing).

### Brand styling

Same shared `_layout.tsx` from TASK-054. Body styling consistent with welcome email — Crimson Pro, brand-navy background, brand-gold accents, brand-textMuted footer.

### CAN-SPAM compliance

Same checklist as TASK-054. Postal address from shared layout. Reply-to to `steve@` per voice consistency ("reply if you want to discuss workflow"). Unsubscribe link only if user is also on newsletter audience.

## What this task does NOT do

- Does NOT send the email — TASK-056 wires the send call
- Does NOT show line items or invoice details — Stripe receipt handles that
- Does NOT differentiate between first upgrade and tier change (e.g., Author → Publisher) in v1; both fire the same template per the tier the webhook reports. v1.1 may add "you upgraded from Author" copy if user feedback wants the continuity recognition.
- Does NOT include downgrade or cancellation copy — those are separate templates (R-TASK-135 dunning, future v1.1 cancellation-confirmation)

## Tests Required

- AT-225: `renderUpgradeEmail({ tier: 'author', interval: 'monthly' })` returns `{ subject: 'Welcome to Author.', ... }`
- AT-226: `renderUpgradeEmail({ tier: 'publisher', interval: 'annual' })` returns `{ subject: 'Welcome to Publisher.', ... }`
- AT-227: Author email body contains all 7 features from `TIER_FEATURES.author`
- AT-228: Publisher email body contains all 5 features from `TIER_FEATURES.publisher` (including "Everything in Author" rollup)
- AT-229: Annual variant includes savings line; monthly variant does NOT include it
- AT-230: Both emails contain "Continue writing →" CTA linked to `/app`
- AT-231: Postal address present in shared layout footer
- AT-232: Mechanical: emails do not contain "$" amounts other than the subscription charge (no marketing pitch line items)
- AT-233: Voice consistency: subject line ends with period, not exclamation; body uses "Hey [name]" greeting; closing is "— Steve"

## Session Notes
_(Filled by Claude Code during implementation)_
