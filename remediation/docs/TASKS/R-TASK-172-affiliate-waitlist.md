<!-- APPLY: CREATE -->
# R-TASK-172: Affiliate Program Waitlist (`app/affiliate/page.tsx`)

## Status: NOT STARTED
## Priority: MEDIUM
## Phase: 6
## Estimated Sessions: 1
## Dependencies: TASK-002 (brand store), R-TASK-104 (rate-limiting), R-TASK-170 (newsletter audience for waitlist tagging), TASK-007 (public-routes whitelist)
## Cluster: PATCH-3 round 2 v1 content cluster

## Inference Summary

| Addition | Source |
|---|---|
| Marketing page only; no tracking infrastructure | Q-A operator-answer (use default — option a; tracking deferred to v1.1) |
| Email-only waitlist signup | Q-A + standard pre-launch waitlist pattern |
| Stored in Resend audience tagged `affiliate-waitlist` | Reuses R-TASK-170 newsletter infrastructure for tagged segmentation |
| Public route, no auth | TASK-007 |
| Single opt-in; no PDF magnet | Distinct from R-TASK-171 (which gives a PDF in exchange) |

## Pre-flight: re-read current state

- Confirm R-TASK-170 has shipped (`lib/newsletter.ts`).
- Confirm `/affiliate` and `/api/affiliate/waitlist` in middleware public-routes whitelist.
- Determine operator's affiliate audience strategy: same Resend audience as Sunday Prompt (with a tag) OR separate audience. Recommend separate audience (`MyBSN Affiliate Waitlist`) so the Sunday Prompt audience doesn't get marketing about the affiliate program until the program launches. Operator creates audience in Resend Dashboard before this task ships and adds `RESEND_AFFILIATE_AUDIENCE_ID` env var (becomes a new env var; document drift in B.5).

## Files to Create

- `app/affiliate/page.tsx` — server component
- `app/api/affiliate/waitlist/route.ts` — POST: validates email, adds to affiliate Resend audience
- (No PDF, no automated email beyond the waitlist confirmation)

## Implementation Requirements

### Page structure

Hero:
- Heading: "Help writers find us. We'll help you fund your next book."
- Subheading: "We're building an affiliate program for the indie author community. Join the waitlist — we'll let you know when it opens."

Body — 3 sections:

1. **The basics** (operator commits content):
   - Plain-language explanation: refer writers to MyBSN, earn commission on subscriptions
   - Target commission: 30% recurring for the first year (operator commits final number; this is a placeholder)
   - When it opens: target Q3 2026 (operator commits target)
   - Who it's for: writing coaches, author newsletters, book reviewers, author services brands

2. **What you get** (bulleted):
   - Recurring commission (target 30% of MRR for first 12 months)
   - Branded landing pages with your name/avatar
   - Real-time dashboard for clicks, conversions, payouts
   - Stripe Connect payouts (no PayPal, no checks)

3. **What you'll need to do**:
   - Send writers our way through your existing channel (newsletter, podcast, blog, social)
   - Be honest about what we are: an AI-powered novel writing tool. We don't promise overnight bestsellers; we promise to make the work less lonely.

Waitlist form:
- Email input
- Optional dropdown: "How will you promote MyBSN?" (Newsletter / Podcast / Blog / Social / Course / Other) — captured in Resend contact metadata
- Submit button: "Add me to the waitlist →"
- Below form (small): "We'll email you when the program opens. We won't add you to our newsletter unless you ask."

### Submit flow

POST `/api/affiliate/waitlist` with `{ email, channel?: string }`:

1. Validate email; rate-limit per R-TASK-104 (10/hour/IP)
2. Add to Resend audience identified by `RESEND_AFFILIATE_AUDIENCE_ID` with `firstName` derived from email or left blank, plus a custom field `channel` if provided
3. Send confirmation email: "You're on the list. We'll email you when the affiliate program opens."
4. Return 200 + ok message
5. Render thank-you state: "You're in. We'll be in touch."

### Why no PDF / no double opt-in

Affiliate waitlist is low-volume, low-spam-risk (people who self-identify as wanting to promote your product are already qualified leads). Single opt-in with clear disclosure is fine. No PDF needed — the value exchange is "early access to the program when it opens."

### Cross-bind to R-TASK-170 newsletter

In the small disclosure text under the form, explicitly state that affiliate signup does NOT add to the Sunday Prompt newsletter. If users want both, they sign up for both separately. Cleaner consent model.

### Brand styling

- Page background `bg-brand-navy`
- Form card-style on `bg-brand-navyLight`, centered, max-w-[480px]
- Submit button brand-gold primary
- The dropdown styled to match form aesthetics (brand-navy background, brand-gold focus ring)

### SEO

- Page title: "Affiliate Program Waitlist — My Best Selling Novel"
- Meta description: "Help writers find us. Earn 30% recurring commission. Join the waitlist for our affiliate program."
- OG image: brand OG fallback or dedicated affiliate OG

### Analytics

- GA event `affiliate_waitlist_view` on page load
- GA event `affiliate_waitlist_submit` on form submit (with `channel` property)

### Future v1.1 expansion

When the affiliate program actually launches (target Q3 2026), this page evolves into:
- Logged-in affiliate dashboard (clicks, conversions, payouts)
- Branded landing pages per affiliate
- Stripe Connect onboarding
- Tracking infrastructure (cookies, attribution windows, fraud detection)

Document the v1.1 expansion plan in `docs/AFFILIATE_v1_1_PLAN.md` so the operator has a single place to capture program design decisions as they accrue.

## Tests Required

- AT-172-1: `/affiliate` returns 200 OK without auth
- AT-172-2: Submit valid email + channel → 200 + waitlist confirmation email arrives
- AT-172-3: Contact appears in `RESEND_AFFILIATE_AUDIENCE_ID` audience with channel metadata
- AT-172-4: Contact NOT added to Sunday Prompt audience (separate audiences)
- AT-172-5: Invalid email → 400; rate-limit triggers at 11th submit/hour
- AT-172-6: GA `affiliate_waitlist_submit` fires with correct property
- AT-172-7: `/affiliate` and `/api/affiliate/waitlist` in middleware public-routes whitelist
- AT-172-8: Mobile renders single-column form

## Session Notes
_(Filled by Claude Code during implementation)_
