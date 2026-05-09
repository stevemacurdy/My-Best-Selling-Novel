# AFFILIATE_v1_1_PLAN.md

**Purpose:** Design notes for v1.1 affiliate-tracking infrastructure. v1 ships R-TASK-172's marketing page + waitlist only; this doc captures the design as decisions accrue between now and v1.1 launch.

**Last updated:** 2026-05-09 (created in PATCH-3 round 2).

**Status:** Planning. No implementation work in v1.

---

## v1 state (what ships now)

- `/affiliate` marketing page (R-TASK-172): explains the program at a high level
- Email-only waitlist signup; stores in dedicated Resend audience tagged `affiliate-waitlist` (separate from Sunday Prompt newsletter)
- No tracking, no attribution, no payouts — explicitly deferred per Q-A operator-answer 2026-05-08

When operator's traffic + customer count justify the build (target: post-launch when CAC and content marketing reach a point where amplification via affiliates makes economic sense), this doc becomes the implementation spec.

---

## Open design decisions for v1.1

These are the questions to answer before implementation begins. Operator commits answers as the program matures.

### 1. Commission structure

- **Recurring vs one-time:** target 30% recurring for first 12 months (operator's placeholder figure from R-TASK-172). Alternatives: 30% one-time (lump-sum at conversion); 50% first month + 10% recurring.
- **Trigger event:** commission earned on first paid subscription? On first month payment? On annual subscription only?
- **Holding period:** payouts after Stripe clears refund window (14 days per R-TASK-119) — most affiliate programs hold 30-60 days for safety
- **Tier-stacked commissions?** Higher commission for Publisher referrals than Author? (Operator-decision)

### 2. Tracking infrastructure

Three architecture options:

**Option A — Build in-house**
- First-party cookies (preferred for browser tracking — GDPR-friendlier, no third-party cookie deprecation risk)
- Click IDs in URL params (`?aff=jane-doe`) → cookie set on landing → conversion fired on subscription_purchase webhook
- Tables: `affiliate_clicks`, `affiliate_conversions`, `affiliate_payouts`
- Effort: ~3 weeks engineering
- Cost: $0 ongoing (uses existing Stripe + Supabase)
- Pros: full control, no vendor lock
- Cons: every-edge-case is yours (fraud, attribution disputes, payout calculation bugs)

**Option B — Tapfiliate ($89/mo + per-conversion fee)**
- SaaS affiliate platform; integrates with Stripe via webhook
- Branded landing pages, dashboards, payouts via Stripe Connect or PayPal
- Effort: ~1 week integration
- Cost: $89/mo plus ~$0.30 per conversion
- Pros: established, less surface area to maintain
- Cons: ongoing cost, vendor dependency, less customization

**Option C — Rewardful ($49-99/mo)**
- Similar to Tapfiliate; Stripe-native
- Effort: ~1 week integration
- Cost: $49/mo Starter or $99/mo Growth
- Pros: cleaner Stripe integration than Tapfiliate; nicer UI
- Cons: same as Tapfiliate

**Recommendation TBD.** When v1.1 begins: re-evaluate based on (a) program's expected size at launch, (b) operator's preference for in-house vs SaaS, (c) Stripe Connect availability for payouts.

### 3. Attribution windows

Standard SaaS:
- **First-touch attribution:** affiliate gets credit if user came through their link first (ever)
- **Last-touch attribution:** affiliate gets credit if user came through their link most recently within window
- **Window:** 30, 60, or 90 days

Recommendation: **last-touch with 30-day window**. Simplest fraud profile. Resolves disputes cleanly.

### 4. Payout pipeline

- **Stripe Connect (standard accounts):** simplest; affiliate receives 1099 from Stripe; operator payout via Stripe transfer
- **PayPal Mass Pay:** alternative for international affiliates
- **Manual payments:** for v1.1 launch with <50 affiliates, manual via Stripe Dashboard transfers acceptable
- **Minimum payout threshold:** $50 typical; below threshold, payout rolls to next month

### 5. Anti-fraud measures

Required even at small scale:
- IP-based duplicate detection (one user signing up via their own affiliate link)
- Email-based duplicate detection (same email signing up multiple times via different affiliates)
- Refund-triggered clawback (commission removed if user refunds within 14-day window per R-TASK-119)
- Manual review queue for first-week-conversions (catch bot signups)

### 6. Affiliate UX

What affiliates see when they log in:
- Branded affiliate dashboard
- Their unique referral link (`https://mybestsellingnovel.com/?aff=jane-doe`)
- Real-time clicks + conversions + earnings
- Payout history
- Marketing assets to share (logo, screenshots, pre-written email/social copy operator approves)

### 7. Compliance / legal

- FTC disclosure rules: affiliates must disclose the relationship in their marketing
- Operator's affiliate-program ToS (separate from main site ToS) covers their obligations
- 1099 generation for US affiliates earning >$600/year (Stripe Connect handles automatically)
- International tax forms (W-8BEN for non-US affiliates)

### 8. Launch sequence

1. Email the waitlist (collected via R-TASK-172 v1 page) announcing program is now open
2. Migrate the page from "waitlist signup" to "log in to affiliate dashboard"
3. Operate manually for first month to learn edge cases
4. Iterate

---

## v1.1 R-TASK plan (provisional)

When v1.1 begins:

| R-TASK | Scope |
|---|---|
| R-TASK-200 | Cookie + click-ID infrastructure |
| R-TASK-201 | Conversion tracking via Stripe webhook integration |
| R-TASK-202 | Affiliate dashboard UI (logged-in surface) |
| R-TASK-203 | Payout pipeline (Stripe Connect) |
| R-TASK-204 | Affiliate ToS + 1099 collection |
| R-TASK-205 | Anti-fraud measures + manual review queue |
| R-TASK-206 | Migrate `/affiliate` page from waitlist to launched-program |

---

## Operator notes (live list)

Add as decisions accrue:

- [ ] Decide commission structure (recurring %, trigger event, holding period)
- [ ] Decide tracking architecture (A / B / C)
- [ ] Decide attribution window
- [ ] Decide payout pipeline
- [ ] Draft affiliate-program ToS
- [ ] Map out launch sequence + first-month manual ops plan
