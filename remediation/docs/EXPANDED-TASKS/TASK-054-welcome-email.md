<!-- APPLY: REPLACE -->
<!-- Target: docs/TASKS/TASK-054-welcome-email.md (in original mybsn package) -->
<!-- Backup: docs/EXPANDED-TASKS/backups/TASK-054-welcome-email.pre-expansion-backup.md -->
<!-- Expanded 2026-05-09 from 91 words to ~1080 words via PATCH-3 sub-deliverable B.3.
     Per operator directive 2026-05-09 ("escalate where weaker default would produce weaker artifact"),
     email copy drafted in operator's established literary footer voice rather than generic SaaS defaults. -->

# TASK-054: Welcome Email Template

## Status: NOT STARTED
## Priority: HIGH
## Phase: 8
## Estimated Sessions: 1
## Dependencies: TASK-005 (`lib/resend.ts`), TASK-008 (signup triggers send), R-TASK-119 (CAN-SPAM compliance)
## Requirements Covered: R34
## Spec Reference: Section 8.1

## Inference Summary

| Addition | Source |
|---|---|
| **Subject + body drafted in operator's literary voice** rather than generic default | Operator directive 2026-05-09 (escalate where stronger artifact possible) |
| Sender display name: "My Best Selling Novel" | Q-8.2 operator-answer (use default) |
| Voice: professional-warm with literary undertones (matches footer copy) | Q-8.4 operator-answer (use default) extended to match footer voice cluster |
| **Postal address LOCKED: 1068 Industrial Park Circle, Grantsville, UT 84029** | Q-8.5 operator-answer 2026-05-08 |
| CAN-SPAM compliance footer: postal address + unsubscribe link | R-TASK-119 + CAN-SPAM Act |
| Triggered on `auth.signUp` success (immediately, not on email verification) | Q-8.10 operator-answer (use default) |
| Single CTA matches hero/footer: "Start Chapter One →" | Cross-binding cascade decision 2026-05-08 |
| Secondary CTA: take the tour | Standard SaaS funnel UX |

Operator confirmed all questions on 2026-05-08; voice directive on 2026-05-09.

## Pre-flight: re-read current state

- View existing email templates if present.
- Confirm `lib/resend.ts` (TASK-005) and `getFromAddress()` helper exist.
- Confirm `RESEND_FROM_EMAIL=noreply@mybestsellingnovel.com` configured (TASK-003 expansion).
- Confirm domain DKIM/SPF/DMARC verified in Resend (R-TASK-122 staging environment setup).

## Files to Create

- `lib/emails/welcome.ts` — exports `renderWelcomeEmail({ firstName, signupSource })` returning `{ subject, html, text }`
- `lib/emails/_layout.tsx` (NEW shared) — base email layout with brand-aligned CSS, header + footer with postal address + unsubscribe
- Inline component-based templates using `react-email` or similar (Resend supports `react-email` natively as of 2025+)

## Implementation Requirements

### Email layout shell — `lib/emails/_layout.tsx`

Shared layout used by welcome + upgrade + lead-magnet + dunning emails. Provides:
- Brand-aligned header (small wordmark)
- Body slot
- Footer block per CAN-SPAM (postal address + unsubscribe link slot)

```tsx
// Pseudocode using react-email primitives
import { Html, Head, Body, Container, Heading, Text, Button, Hr, Link } from '@react-email/components';

export function EmailLayout({ children, unsubscribeUrl }: Props) {
  return (
    <Html>
      <Head />
      <Body style={{ backgroundColor: '#0f1b33', color: '#FFFFFF', fontFamily: 'Crimson Pro, Georgia, serif' }}>
        <Container style={{ maxWidth: 600, padding: 32 }}>
          <Heading style={{ color: '#D4A853', fontSize: 18, marginBottom: 24 }}>
            My Best Selling Novel
          </Heading>
          {children}
          <Hr style={{ borderColor: '#1B2A4A', marginTop: 40 }} />
          <Text style={{ fontSize: 12, color: '#9CA3AF', lineHeight: 1.6 }}>
            Made for writers, by writers who got tired of waiting.<br />
            <br />
            My Best Selling Novel<br />
            1068 Industrial Park Circle, Grantsville, UT 84029<br />
            <br />
            {unsubscribeUrl && (
              <>
                You're receiving this because you signed up at mybestsellingnovel.com.{' '}
                <Link href={unsubscribeUrl} style={{ color: '#D4A853' }}>Unsubscribe</Link>.
              </>
            )}
          </Text>
        </Container>
      </Body>
    </Html>
  );
}
```

The postal address `1068 Industrial Park Circle, Grantsville, UT 84029` is hardcoded here per Q-8.5 lock. Single source of truth — every email gets the same address from the same shared layout. If the operator's address ever changes, update `_layout.tsx` once.

### Welcome email — `lib/emails/welcome.ts`

**Subject line (drafted in voice):**

> You showed up. Now the work.

Operator may override on review. Alternatives in same voice:
- "You're in. Go write something."
- "Welcome. Here's where to start."

The default I had originally proposed ("Welcome to My Best Selling Novel!") is generic and works against the brand voice. The escalation here is the directive.

**Body (drafted in voice):**

```
Hey [firstName, or "writer" if no firstName],

You signed up. That's the hard part — most people who tell themselves
they're going to write a novel never click the button.

Here's where to start: [Start Chapter One →]

If you'd rather poke around first, we have a 14-stop tour that walks
through what the agent actually does. [Take the tour →]

A few things to know:

- Your first book is on us. Explorer tier gets you 1 book and 25 AI
  calls per month, no credit card. If you outgrow it, Author tier ($29/mo)
  unlocks unlimited books and 500 AI calls.

- The agent works in 12 steps. You don't have to do them in order; you
  don't have to do all of them. Use the parts that help; skip the rest.

- We don't think AI replaces writers. We think it eliminates the parts
  of writing that aren't writing.

Reply to this email if you get stuck. A real person reads every reply.

— Steve
Founder, My Best Selling Novel
```

CTAs:
- Primary: "Start Chapter One →" → `https://mybestsellingnovel.com/app` (or `/signup` if email confirmation flow lands them there first; verify against TASK-008 flow)
- Secondary: "Take the tour →" → `/tour`

**Plain-text variant (auto-generated):** stripped of HTML; CTAs become inline URLs. Resend serves both formats; email clients pick.

### Trigger point (Q-8.10)

Welcome email fires on `auth.signUp` success — immediately, not waiting for email verification per Q-8.10 default. Per Q-2.11 in TASK-008, email verification is a soft gate (banner only) for `/app` access. The welcome email IS the verification prompt with context: it lands in the user's inbox right after signup, and clicking the verification link brings them back to the app. Combining welcome + verification in one email keeps the flow tight.

The welcome email template **does not include the verification link** — Supabase Auth sends a separate verification email automatically. The two arrive within seconds of each other; user verifies via Supabase's email, then any subsequent activity uses the welcome's CTAs.

If user feedback shows confusion ("I got two emails — which one?"), v1.1 can merge the verification link into the welcome template with a Supabase Auth custom-email config. Not in v1 scope.

### Render function shape

```typescript
import { render } from '@react-email/render';
import { WelcomeEmailTemplate } from './_welcome-template';

interface RenderWelcomeEmailParams {
  firstName?: string;
  signupSource?: string;  // from GA event taxonomy (Q-9.2)
  unsubscribeUrl?: string;  // injected by Resend audiences if user is also on newsletter list; null otherwise
}

export function renderWelcomeEmail(params: RenderWelcomeEmailParams) {
  const html = render(<WelcomeEmailTemplate {...params} />);
  const text = render(<WelcomeEmailTemplate {...params} />, { plainText: true });
  return {
    subject: 'You showed up. Now the work.',
    html,
    text,
  };
}
```

The actual send is wired in TASK-056 (email-wiring). This task only ships the template + render function.

### CAN-SPAM compliance checklist

- ☑ Sender identification matches: "My Best Selling Novel <noreply@mybestsellingnovel.com>"
- ☑ Postal address present in footer: 1068 Industrial Park Circle, Grantsville, UT 84029
- ☑ Unsubscribe mechanism (only required if user is on a marketing list — welcome email itself is transactional, but if user opted into newsletter at signup, unsubscribe link required)
- ☑ Subject line is honest (no deceptive framing)
- ☑ Reply-to set to a monitored address (operator's preference: `noreply@` to deflect, or `steve@` to invite replies — voice line "Reply to this email if you get stuck. A real person reads every reply." implies the latter; recommend `steve@mybestsellingnovel.com` reply-to with auto-forward to support inbox)

### Brand styling

Email-safe CSS (no Flexbox dependence; tables for layout where needed; web-safe fonts with Crimson Pro fallback to Georgia, serif). Background brand-navy (#0f1b33); body brand-white (#FFFFFF); accents brand-gold (#D4A853); muted brand-textMuted (#9CA3AF).

Test in: Gmail web, Gmail iOS, Apple Mail (macOS + iOS), Outlook web, Outlook desktop. Major clients differ in CSS support.

### Localization

English-only at v1. Operator may add localized templates in v1.1 if international signup volume justifies. Defer.

## What this task does NOT do

- Does NOT send the email — TASK-056 wires send
- Does NOT include the verification link — Supabase Auth sends separately
- Does NOT include marketing pitches for paid tiers — that's the upgrade flow's job
- Does NOT track open/click rates — Resend webhook integration deferred to v1.1 per Q-8.14

## Tests Required

- AT-216: `renderWelcomeEmail({ firstName: 'Sarah' })` returns `{ subject, html, text }` without throwing
- AT-217: Subject line matches drafted copy (exact verbatim match for regression)
- AT-218: HTML body contains "Start Chapter One →" CTA linked to `/app`
- AT-219: HTML body contains secondary "Take the tour →" CTA linked to `/tour`
- AT-220: Postal address `1068 Industrial Park Circle, Grantsville, UT 84029` present in HTML footer
- AT-221: When `firstName` absent, body addresses user as "writer" (fallback)
- AT-222: Plain-text variant generated and contains same CTAs as URLs
- AT-223: HTML renders correctly in Gmail web (manual test) and Apple Mail (manual test)
- AT-224: Mechanical: subject + body do not contain phrases "10 ways to" or "Crush your goals" or generic SaaS marketing tropes (voice consistency check)

## Session Notes
_(Filled by Claude Code during implementation)_
