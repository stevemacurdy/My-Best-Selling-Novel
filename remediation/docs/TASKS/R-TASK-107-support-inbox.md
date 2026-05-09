<!-- APPLY: CREATE -->
# R-TASK-107: Support Inbox & Routing

## Status: NOT STARTED
## Priority: CRITICAL
## Phase: 12
## Estimated Sessions: 1
## Dependencies: TASK-043, TASK-048, TASK-054, TASK-055
## Resolves Gaps: GAP-095
## Spec Reference: AUDIT_REPORT.md CRITICAL section

## Pre-flight: re-read current state

Before making any change, read the current state of every file listed in "Files to Modify" below. Verify the gap(s) addressed by this task are still present in the current code. Specifically:

- For each file in "Files to Modify": view the file and confirm the condition the audit observed (e.g., "no rate limiting on /api/ai") still applies.
- For each gap in "Resolves Gaps": confirm the gap remains open. The audit was conducted on 2026-05-04; if the codebase changed since, the gap may have been partially or fully addressed.
- If a gap is no longer present, report this finding in PROGRESS.md, mark this task as superseded, and stop. Do not make changes.
- If a gap is partially addressed, scope this task to the remaining work and document in this file's Session Notes what was already addressed and skipped.
- If the gap is still fully present as the audit described, proceed with the rest of this task.

This pre-flight catches the case where the codebase changed between audit and remediation — exactly the failure mode that produces silent overwrites of unrelated work.

## Decisions Required Before Implementation

1. **Inbox identity**: `support@mybestsellingnovel.com` (recommended) — branded, on the product domain
2. **Routing**: where do emails to support@ actually go?
   - Path A: forward to steve@woulfgroup.com (cheapest; no separate tool; works for first 50 customers)
   - Path B: Help Scout free tier (up to 25 inbox/mo free, then $20/user/mo) — proper ticketing, shared inbox, conversation history
   - Path C: Front shared inbox ($19/seat/mo) — similar to Help Scout, more email-native UX
   - Path D: Plain (https://plain.com) — modern alternative built for SaaS
   - Recommendation: Path A at launch, migrate to Path B at the 50-customer mark
3. **Response SLA**: state a number that's defensible
   - Recommended v1: "We respond within 2 business days." (R-TASK-152 will pin this in writing)

## Files to Create

- `app/contact/page.tsx` — public contact form (uses /api/contact route below) + email link
- `app/api/contact/route.ts` — receives form submissions; sends to support inbox via Resend; rate-limited per R-TASK-104 pattern (3/day/IP)
- `docs/runbooks/support-triage.md` — how to triage incoming support email by topic (billing → check Stripe; account → check Supabase; technical → check Sentry)

## Files to Modify

- `app/page.tsx` (TASK-043) — footer: add `support@mybestsellingnovel.com` mailto link alongside "Built by WoulfAI"
- `app/help/page.tsx` (TASK-048) — add prominent "Need more help?" section linking to /contact and the support email
- `emails/welcome.tsx` (TASK-054) — add "Questions? Reply to this email or write to support@mybestsellingnovel.com" in body
- `emails/upgrade.tsx` (TASK-055) — same footer mention
- All future email templates created by R-TASK-135 — same footer
- `app/account/page.tsx` (TASK-047) — add "Get Help" link in sidebar/footer

## DNS / Mailbox setup

Two paths depending on routing choice above:

### Path A — Forward to steve@woulfgroup.com

1. In your DNS provider for mybestsellingnovel.com, add MX records pointing to your email forwarder
2. Cloudflare Email Routing (free) is the simplest: enable in Cloudflare dashboard, add forwarding rule `support@mybestsellingnovel.com → steve@woulfgroup.com`
3. Configure Resend to send FROM `noreply@mybestsellingnovel.com` (already in CLAUDE.md) but support emails come TO `support@mybestsellingnovel.com`
4. Test: send email to support@mybestsellingnovel.com from external account; verify arrival at steve@

### Path B — Help Scout (when scaled)

1. Sign up Help Scout free tier
2. In Help Scout, add inbox `support@mybestsellingnovel.com`
3. Help Scout provides MX records — add to DNS for mybestsellingnovel.com
4. Help Scout signature/branding configured to match brand
5. Set up Saved Replies for top 5 expected questions: billing dispute, password reset, AI not working, lifetime tier explanation, account deletion

## /api/contact route specification

```typescript
// app/api/contact/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getResend } from '@/lib/resend';
import { limits, checkLimit } from '@/lib/ratelimit';

export async function POST(req: NextRequest) {
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown';
  const limitCheck = await checkLimit(limits.signup /* reuse existing IP-based limit */, `contact:${ip}`);
  if (!limitCheck.ok) {
    return NextResponse.json({ error: 'rate_limit_exceeded' }, { status: 429 });
  }

  const body = await req.json();
  const { name, email, topic, message } = body;
  if (!name || !email || !message) {
    return NextResponse.json({ error: 'missing_fields' }, { status: 400 });
  }
  if (typeof message !== 'string' || message.length > 5000) {
    return NextResponse.json({ error: 'message_too_long' }, { status: 400 });
  }

  await getResend().emails.send({
    from: 'noreply@mybestsellingnovel.com',
    to: 'support@mybestsellingnovel.com',
    replyTo: email,
    subject: `[Contact] ${topic ?? 'General'} from ${name}`,
    text: `From: ${name} <${email}>\nIP: ${ip}\nTopic: ${topic ?? 'General'}\n\n${message}`,
  });

  // Acknowledgment email to user
  await getResend().emails.send({
    from: 'noreply@mybestsellingnovel.com',
    to: email,
    subject: 'We got your message',
    text: `Thanks for reaching out, ${name}. We respond within 2 business days. — My Best Selling Novel`,
  });

  return NextResponse.json({ ok: true });
}
```

## Footer wording

Final footer of every page (per /landing page TASK-043):

```
© 2026 My Best Selling Novel · Built by WoulfAI
support@mybestsellingnovel.com · status.mybestsellingnovel.com · Privacy · Terms
```

(`status.mybestsellingnovel.com` ships as part of R-TASK-140; until then, link to /status placeholder page or omit.)

<!-- ADR-004 cross-binding paragraph removed 2026-05-06: ADR-004 voided when lifetime tier was eliminated. This task still ships for the non-lifetime reasons originally documented above. -->
## Tests Required

- AT-107-1: Email sent to support@mybestsellingnovel.com from external account arrives at the configured destination
- AT-107-2: Contact form on /contact submits successfully; confirmation email to user; support inbox receives forwarded message with correct reply-to
- AT-107-3: Rate limit on /api/contact: 4th submission from same IP in 24h returns 429
- AT-107-4: Footer on every page includes support email link
- AT-107-5: Welcome email and upgrade email both mention support contact path
- AT-107-6: /help page has prominent "Need more help?" section with email link

## Triage runbook content (`docs/runbooks/support-triage.md`)

```markdown
# Support Triage Runbook

## When a ticket arrives

### Billing-related (Stripe / refunds / subscription)
1. Search Stripe Dashboard for customer email
2. Verify subscription status, payment history
3. If lifetime customer: check `subscriptions.status='lifetime'` in Supabase
4. If refund requested: refer to refund policy (R-TASK-119); standard refund window is 14 days
5. Resolve via Stripe Dashboard (refund button) or escalate

### Account-related (sign-in / password / deletion)
1. Search Supabase Dashboard → Auth → Users
2. Check user's tier and last_sign_in_at
3. For password reset: trigger via Supabase Admin
4. For deletion request: confirm deletion via /account/delete (or operator-side via /api/admin/users/delete)

### Technical (AI not working / agent crash / data loss)
1. Search Sentry for the user_id (find via Supabase email search)
2. Check ai_usage_logs for recent calls
3. If chapter content lost: check Supabase PITR (7-day window) — restore via Supabase Dashboard
4. Update Sentry issue with resolution notes

### Bug report
1. Reproduce locally if possible
2. File GitHub issue with reporter's email + steps
3. Acknowledge within 2 business days; promise no specific fix timeline unless trivial

## SLA
- First response: 2 business days
- Resolution: depends on severity (billing/data > 1 week is unacceptable; cosmetic bugs may take longer)
```

## Session Notes
_(Filled by Claude Code during implementation)_
