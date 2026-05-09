<!-- APPLY: REPLACE -->
<!-- Target: docs/TASKS/TASK-065-e2e-billing.md (in original mybsn package) -->
<!-- Backup: docs/EXPANDED-TASKS/backups/TASK-065-e2e-billing.pre-expansion-backup.md -->
<!-- Expanded 2026-05-08 from 96 words to ~840 words via PATCH-3 sub-deliverable B.3.
     Significant content removed because lifetime tier was eliminated 2026-05-06 (A.3); this task originally planned a 5-SKU x 6-scenario matrix and is now 4-SKU x 8-scenario. -->

# TASK-065: E2E Billing Test (`docs/manual-tests/billing-e2e.md`)

## Status: NOT STARTED
## Priority: HIGH
## Phase: 10
## Estimated Sessions: 1
## Dependencies: TASK-022, TASK-023, TASK-024, TASK-026
## Requirements Covered: R7, R8
## Spec Reference: Section 10.3

## Inference Summary

| Addition | Source |
|---|---|
| 6 base scenarios across 4 SKUs | Q-10.9 operator-answer (use default); A.3 cascade |
| Stripe CLI for dev; staging Vercel env in Phase 11 (R-TASK-122) | Q-10.10 operator-answer (use default) |
| 3DS card scenario (case 7) | Q-10.11 operator-answer (use default) |
| 14-day refund window scenario (case 8) | Q-10.12 operator-answer (use default); R-TASK-119 |
| **No lifetime tier scenarios** | A.3 cascade |

Operator confirmed all questions on 2026-05-08.

## Pre-flight: re-read current state

- View `docs/manual-tests/billing-e2e.md` if present.
- Confirm TASK-022 (checkout), TASK-023 (portal), TASK-024 (webhook with PATCH-002 idempotency), TASK-026 (manual billing test) all shipped.
- Confirm Stripe CLI installed and `stripe listen` works.

## Files to Create/Modify

- `docs/manual-tests/billing-e2e.md` (NEW)

## Implementation Requirements

This is the deeper companion to TASK-026's manual checklist. TASK-026 covers the operator's pre-deploy smoke test; TASK-065 is the comprehensive matrix run before public launch and as part of regression testing for any billing-touching change.

### Setup

```bash
# Terminal 1
npm run dev

# Terminal 2
stripe listen --forward-to localhost:3000/api/stripe/webhook
# Copy the printed whsec_ into .env.local STRIPE_WEBHOOK_SECRET; restart Terminal 1
```

Test cards (per Q-4.11 full deck):
- Happy path: `4242 4242 4242 4242`
- 3DS required: `4000 0027 6000 3184`
- Declined: `4000 0000 0000 0002`
- Insufficient funds: `4000 0000 0000 9995`

### Scenario 1 — Subscribe (4 SKUs in sequence)

For each of: **Author Monthly, Author Annual, Publisher Monthly, Publisher Annual** (4 SKU runs total):

**Action:** Sign in as fresh test user → `/pricing` → click subscribe button → enter `4242 4242 4242 4242` → submit.

**Expected:**
- ☐ Webhook `customer.subscription.created` fires
- ☐ `profiles.subscription_tier` and `subscription_status='active'` updated
- ☐ `subscriptions` row created with correct `stripe_price_id` and `current_period_end`
- ☐ Welcome upgrade email arrived in test inbox
- ☐ Success URL contains `?upgraded=true&tier=...&interval=...` per Q-4.4

### Scenario 2 — Plan switch via Customer Portal

**Setup:** user has Author Monthly from Scenario 1.

**Action:** `/account/billing` → "Manage Subscription" → portal → "Update plan" → select Publisher Annual → confirm.

**Expected:**
- ☐ Webhook `customer.subscription.updated` fires
- ☐ `subscriptions.tier='publisher'`, new `current_period_end` ~365d ahead
- ☐ Stripe pro-rates the difference; visible on next invoice
- ☐ `/account/billing` shows new tier

### Scenario 3 — Cancel at period end

**Setup:** active subscription.

**Action:** Portal → "Cancel subscription" → choose "at period end."

**Expected:**
- ☐ Webhook `customer.subscription.updated` with `cancel_at_period_end=true`
- ☐ Status remains `active` until period ends
- ☐ `/account/billing` shows "Cancellation scheduled — access until [date]" per TASK-047
- ☐ User retains paid features until expiry

### Scenario 4 — Period-end rollover (cron)

**Setup:** subscription with `cancel_at_period_end=true` and `current_period_end < NOW()` (manually advance via SQL update for testing).

**Action:** Trigger the daily cron `/api/cron/period-end-rollover` (e.g., via `curl -H "Authorization: Bearer $CRON_SECRET" http://localhost:3000/api/cron/period-end-rollover`).

**Expected:**
- ☐ `subscriptions.status` flipped to `'free'` (or row deleted, depending on retention policy)
- ☐ `profiles.subscription_tier='explorer'`, `subscription_status='free'`
- ☐ User now hits Explorer tier limits

### Scenario 5 — Failed payment + dunning

**Action:** Use Stripe CLI to trigger a payment failure: `stripe trigger invoice.payment_failed`.

**Expected:**
- ☐ Webhook `invoice.payment_failed` fires
- ☐ `subscriptions.status='past_due'`
- ☐ Dunning email sent (per R-TASK-135 + Q-8.11 fire-and-forget)
- ☐ `/account/billing` shows past_due banner

### Scenario 6 — Webhook idempotency (PATCH-002)

**Action:** Run any of Scenarios 1-5 to capture an event ID. Then replay: `stripe events resend evt_XXXXXXXXXXXX`.

**Expected:**
- ☐ Replay event hits webhook
- ☐ `stripe_webhook_events` table records the event_id; handler returns 200 without reprocessing
- ☐ No duplicate row in `subscriptions` (PRIMARY KEY on `id` blocks for `subscription.*` events; UNIQUE on `stripe_session_id` blocks for any future one-time events)
- ☐ No double email (welcome / dunning / etc.)

### Scenario 7 — 3D Secure card

**Action:** Subscribe with `4000 0027 6000 3184`. Stripe Checkout displays 3DS challenge frame; complete it.

**Expected:**
- ☐ 3DS challenge appears in Checkout iframe
- ☐ On completion, webhook fires normally
- ☐ Subscription created
- ☐ Stripe Dashboard > Payments shows the 3DS authentication step

### Scenario 8 — Refund within 14-day window

**Setup:** active subscription created within last 14 days.

**Action:** Stripe Dashboard > Customer > [subscription] > "Refund last invoice." Choose "Refund and cancel subscription."

**Expected:**
- ☐ Stripe processes refund
- ☐ Webhook `customer.subscription.deleted` fires
- ☐ `subscriptions.status='cancelled'`, `cancel_at_period_end=true`
- ☐ User retains access (per Stripe's refund-but-keep-access toggle) OR loses access (depending on operator's chosen Stripe Dashboard setting)
- ☐ Document the exact behavior observed for the operator's reference (`/refunds` page reflects this in policy text)

## What this task does NOT do

- Does NOT cover lifetime SKU scenarios (eliminated A.3)
- Does NOT cover Stripe Tax (deferred per Q-4.3)
- Does NOT include manual cancellation paths outside Stripe (e.g., chargebacks) — those are documented in R-TASK-141 first-48h watch plan

## Tests Required (meta — verifying the doc itself)

- AT-107: `docs/manual-tests/billing-e2e.md` exists with all 8 scenarios
- AT-108: All 4 SKUs covered in Scenario 1
- AT-109: Mechanical: doc contains zero occurrences of `lifetime` (case-insensitive) outside revision-log entries
- AT-110: PATCH-002 idempotency scenario references replaying via `stripe events resend`

## Session Notes
_(Filled by Claude Code during implementation)_
