<!-- APPLY: REPLACE -->
<!-- Target: docs/TASKS/TASK-020-stripe-setup-doc.md (in original mybsn package) -->
<!-- Backup: docs/EXPANDED-TASKS/backups/TASK-020-stripe-setup-doc.pre-expansion-backup.md -->
<!-- Expanded 2026-05-08 from 95 words to ~960 words via PATCH-3 sub-deliverable B.3.
     Supersedes A.3 patch at docs/PATCHES-TO-ORIGINAL/TASK-020-stripe-setup-doc.md by folding lifetime-elimination + comprehensive 6-section doc structure. -->

# TASK-020: Stripe Setup Documentation (`docs/STRIPE_SETUP.md`)

## Status: NOT STARTED
## Priority: HIGH
## Phase: 4
## Estimated Sessions: 1
## Dependencies: None (manual operator step)
## Requirements Covered: R7
## Spec Reference: Section 4.1

## Inference Summary

| Addition | Source |
|---|---|
| Comprehensive 6-section structure | Q-4.1 operator-answer (use default) |
| Statement descriptor `MYBSN.COM` | Q-4.2 operator-answer (use default); Decision #26 brand domain |
| Stripe Tax deferred to v1.1 | Q-4.3 operator-answer (use default) |
| 4 price IDs (no lifetime variants) | A.3 cascade 2026-05-06 (Decision #29 revision) |
| Customer Portal brand customization | Q-4.9 operator-answer (use default) |
| Webhook events list (5 events; no checkout.session.completed) | A.3 + TASK-024 expansion + Q-4.10 default |
| Test → live mode checklist | standard SaaS launch hygiene |

Operator confirmed all questions on 2026-05-08.

## Pre-flight: re-read current state

- View `docs/STRIPE_SETUP.md` if present.
- If the operator has already created Stripe products/prices, this doc captures the operator's existing configuration. If not, this doc walks the operator through creation.
- Check Stripe Dashboard for any pre-existing `*_lifetime` products or prices — if present, the doc includes a "Section 7 — Archive lifetime products (if pre-existing)" deletion-gate that surfaces the products to the operator before archiving.

## Files to Create/Modify

- `docs/STRIPE_SETUP.md` (NEW or REPLACE)

## Implementation Requirements

The doc walks an operator through complete Stripe configuration from a clean Dashboard state. Six sections per Q-4.1 default, plus an optional 7th section for lifetime archival if pre-existing.

### Section 1 — Create products and prices

Create two products:

1. **Author Plan** — "For authors writing 1–10+ books per year. Unlimited books, 500 AI calls/month, full agent access."
2. **Publisher Plan** — "For prolific authors and small-press publishers. Unlimited books, 2,000 AI calls/month, folder upload, advanced analytics."

For each product, create two prices:

| Product | Price | Recurring | Stripe Price ID env var |
|---|---:|---|---|
| Author | $29.00 / month | yes (monthly) | `STRIPE_PRICE_AUTHOR_MONTHLY` |
| Author | $313.20 / year | yes (yearly) | `STRIPE_PRICE_AUTHOR_ANNUAL` |
| Publisher | $79.00 / month | yes (monthly) | `STRIPE_PRICE_PUBLISHER_MONTHLY` |
| Publisher | $853.20 / year | yes (yearly) | `STRIPE_PRICE_PUBLISHER_ANNUAL` |

**4 price IDs total. Lifetime SKUs removed 2026-05-06 — do NOT create `*_lifetime` prices.** If a future v2 SKU adds one-time payments, return to this doc and add Section 8.

Annual prices reflect 10% discount vs monthly × 12: Author $29 × 12 × 0.9 = $313.20, Publisher $79 × 12 × 0.9 = $853.20. Both rounded to cents.

Upload product images: brand-gold/navy banner per `lib/brand.ts`. 512×512 minimum.

### Section 2 — Configure tax (deferred)

Per Q-4.3 default, **Stripe Tax is NOT enabled in v1**. Tax remittance is handled manually by the operator for any US-state nexus. R-TASK-119 refunds policy + ToS limitation-of-liability cover the v1 tax disclosure language.

To enable in v1.1:
1. Stripe Dashboard > Tax > Get started
2. Configure tax registrations per state with nexus
3. Enable on Checkout Sessions: pass `automatic_tax: { enabled: true }` in `lib/stripe` checkout (TASK-022)
4. Pricing page (TASK-045) updates to show "+ tax" disclaimer

### Section 3 — Configure Customer Portal

Stripe Dashboard > Settings > Billing > Customer Portal:

**Per Q-4.7 default — enable all features:**
- ☑ Update payment method
- ☑ Update billing address (required for future Stripe Tax enablement)
- ☑ Cancel subscriptions (cancel_at_period_end behavior)
- ☑ Switch plans (allows upgrade/downgrade between the 4 SKUs)
- ☑ View invoice history

**Per Q-4.9 default — brand customization:**
- Logo: upload from `public/og-image.png` or a dedicated brand asset
- Primary color: `#D4A853` (brand-gold)
- Secondary color: `#0f1b33` (brand-navy)
- Headline copy: "Manage your My Best Selling Novel subscription"

**Per Q-4.8 default — return URL:**
- Default return URL: `https://mybestsellingnovel.com/account/billing`

### Section 4 — Configure webhook endpoint

Stripe Dashboard > Developers > Webhooks > Add endpoint:

- Endpoint URL: `https://mybestsellingnovel.com/api/stripe/webhook`
- Description: "Production webhook — synchronizes subscription state with mybsn database"

**Subscribe to these 5 events:**
1. `customer.subscription.created`
2. `customer.subscription.updated`
3. `customer.subscription.deleted`
4. `invoice.payment_succeeded`
5. `invoice.payment_failed`

**Do NOT subscribe to `checkout.session.completed`** — with lifetime tier eliminated, all checkout sessions use `mode: 'subscription'` and the subscription.* events cover the lifecycle. PATCH-002 webhook handler logs a Sentry warning if a `checkout.session.completed` event somehow arrives (forged, replayed from old data); idempotency table handles dedup.

After saving, copy the **signing secret** (starts with `whsec_`) into `STRIPE_WEBHOOK_SECRET` env var.

### Section 5 — Configure statement descriptor

Stripe Dashboard > Settings > Public details > Public business information:

- **Statement descriptor:** `MYBSN.COM` (9 chars; well under Stripe's 22-char limit)
- **Statement descriptor (kana):** N/A (English-only)
- **Shortened descriptor:** `MYBSN.COM` (same as full descriptor)

This is what cardholders see on their credit card statements. The short descriptor avoids "What is this charge?" support tickets.

### Section 6 — Test mode → live mode checklist

Before flipping Stripe Dashboard from test to live mode:

1. ☐ All 4 price IDs created in **live mode** (test mode IDs are different)
2. ☐ Webhook endpoint added in **live mode** (test mode webhook is separate)
3. ☐ Production env vars updated with live `sk_live_*`, `pk_live_*`, live price IDs, live `whsec_*`
4. ☐ Customer Portal configured in **live mode** (settings don't carry over from test)
5. ☐ Statement descriptor verified in live mode
6. ☐ Test charge with operator's real card → succeeds → refund via Dashboard → verify webhook fires
7. ☐ Sentry monitoring active (R-TASK-106) — webhook errors surface immediately

### Section 7 — Archive lifetime products (deletion gate; only if pre-existing)

If `author_lifetime` or `publisher_lifetime` products were previously created in Stripe (during pre-revision setup), **archive them now**:

1. Stripe Dashboard > Products > Author Lifetime → Edit → Archive
2. Stripe Dashboard > Products > Publisher Lifetime → Edit → Archive

**Deletion-gate confirmation:** before archiving, surface the product names and price IDs to the operator. Wait for explicit "confirm archival" reply. Archived products cannot be sold but historical subscriptions continue to function (none should exist if A.3 ran cleanly, but defense-in-depth).

If the products were never created, skip this section.

## What this task does NOT do

- Does NOT enable Stripe Tax in v1 (Q-4.3 deferred)
- Does NOT configure Stripe Connect / multi-vendor (out of scope)
- Does NOT subscribe to `checkout.session.completed` (intentionally skipped post-A.3)
- Does NOT include integration test instructions — those live in TASK-026 / TASK-065

## Tests Required

- AT-048: `docs/STRIPE_SETUP.md` exists with all 6 sections (and Section 7 if applicable)
- AT-049: All 4 live-mode price IDs documented
- AT-050: Webhook events list contains exactly 5 events (no `checkout.session.completed`)
- AT-051: Statement descriptor `MYBSN.COM` matches the value in Stripe Dashboard
- AT-052: Mechanical: doc contains zero occurrences of `lifetime` (case-insensitive) outside Section 7's archival instructions

## Session Notes
_(Filled by Claude Code during implementation)_
