<!-- APPLY: REPLACE -->
<!-- Target: docs/TASKS/TASK-026-billing-integration.md (in original mybsn package) -->
<!-- Backup: docs/EXPANDED-TASKS/backups/TASK-026-billing-integration.pre-expansion-backup.md -->
<!-- Expanded 2026-05-08 from 100 words to ~960 words via PATCH-3 sub-deliverable B.3.
     Supersedes A.3 patch at docs/PATCHES-TO-ORIGINAL/TASK-026-billing-integration.md by folding lifetime-elimination + comprehensive 6-scenario test matrix. -->

# TASK-026: Billing Integration Manual Test (`docs/manual-tests/billing.md`)

## Status: NOT STARTED
## Priority: HIGH
## Phase: 4
## Estimated Sessions: 1
## Dependencies: TASK-022, TASK-023, TASK-024
## Requirements Covered: R7, R8
## Spec Reference: Section 4.6

## Inference Summary

| Addition | Source |
|---|---|
| 6 test scenarios across 4 SKUs | Q-4.10 operator-answer (use default); A.3 cascade (no lifetime) |
| Full Stripe test card deck (success, 3DS, declined) | Q-4.11 operator-answer (use default) |
| Verify billing address stored on customer | Q-4.12 operator-answer (use default) |
| Manual checklist in v1; TASK-065 e2e-billing automates happy paths in Phase 11 | Q-4.13 operator-answer (use default) |
| Stripe CLI for local webhook forwarding | Q-10.10 anticipated default; Stripe CLI docs |
| Webhook idempotency verification | PATCH-002 |

Operator confirmed all questions on 2026-05-08.

## Pre-flight: re-read current state

- View `docs/manual-tests/billing.md` if present.
- Confirm TASK-020 Stripe Setup Documentation has shipped (operator has Stripe products + webhook configured).
- Confirm Stripe CLI installed locally (`brew install stripe/stripe-cli/stripe` or equivalent).
- Confirm `STRIPE_WEBHOOK_SECRET` is set in `.env.local` (Stripe CLI's `stripe listen` outputs a temporary signing secret for local testing — copy that into `.env.local` for the duration of testing).

## Files to Create/Modify

- `docs/manual-tests/billing.md` (NEW)

## Implementation Requirements

The doc is a 6-scenario checklist the operator runs locally before any Stripe-related deploy, and again after the deploy in Stripe test mode against the staging environment (R-TASK-122). Each scenario specifies setup, action, and expected outcomes (DB state + UI state + webhook fire).

### Setup (run once before scenarios)

```bash
# Terminal 1 — start dev server
npm run dev

# Terminal 2 — forward Stripe webhooks to localhost
stripe listen --forward-to localhost:3000/api/stripe/webhook
# Copy the printed `whsec_...` signing secret into .env.local STRIPE_WEBHOOK_SECRET
# Restart dev server after env change
```

Test cards used (per Q-4.11 default — full deck):

| Purpose | Card number | Notes |
|---|---|---|
| Happy path | `4242 4242 4242 4242` | succeeds without authentication |
| 3D Secure required | `4000 0027 6000 3184` | triggers 3DS challenge in Checkout |
| Declined | `4000 0000 0000 0002` | always declines |
| Insufficient funds | `4000 0000 0000 9995` | declines with `card_declined` reason |

CVC: any 3 digits. Expiry: any future date. ZIP: any 5 digits.

### Scenario 1 — Happy-path subscription create (per SKU; run 4 times)

Run once for each of: Author Monthly, Author Annual, Publisher Monthly, Publisher Annual.

**Setup:** new user signed up via TASK-008 flow; user is at `/pricing` with monthly/annual toggle in correct state.

**Action:**
1. Click "Subscribe to [tier]" → POST `/api/stripe/checkout` → redirect to Stripe Checkout
2. Enter card `4242 4242 4242 4242`, billing address (any valid ZIP), submit
3. Land on `/account?upgraded=true&tier=...&interval=...`

**Expected outcomes:**
- ☐ Stripe Dashboard > Customers > [user] → customer exists with `metadata.user_id = user.id`
- ☐ Per Q-4.12: customer's `address` field is populated (street, city, state, postal_code, country)
- ☐ `profiles.stripe_customer_id` populated for this user (per Q-4.5 caching)
- ☐ Webhook event `customer.subscription.created` fired (visible in `stripe listen` output)
- ☐ `subscriptions` table has new row: `tier=author|publisher`, `status='active'`, `current_period_end` ~30d (monthly) or ~365d (annual) ahead
- ☐ `profiles.subscription_tier` and `subscription_status` updated by webhook
- ☐ Account dashboard at `/account/billing` shows new tier
- ☐ Welcome upgrade email arrived (in test inbox per Q-8.13)

### Scenario 2 — Plan switch via Customer Portal

**Setup:** user has Author Monthly subscription from Scenario 1.

**Action:**
1. `/account/billing` → "Manage Subscription" → POST `/api/stripe/portal` → redirect to portal
2. In portal: "Update plan" → select "Publisher Annual" → confirm
3. Return to `/account/billing`

**Expected outcomes:**
- ☐ Webhook `customer.subscription.updated` fired
- ☐ `subscriptions` row's `tier` flipped to `publisher`, `current_period_end` updated to ~365d ahead
- ☐ Stripe pro-rated the difference automatically (visible on next invoice)
- ☐ `/account/billing` shows new tier

### Scenario 3 — Cancel via Customer Portal

**Setup:** user has any active subscription.

**Action:**
1. `/account/billing` → "Manage Subscription" → portal → "Cancel subscription"
2. Stripe portal asks "cancel at period end" or "cancel immediately"; choose at-period-end (default)

**Expected outcomes:**
- ☐ Webhook `customer.subscription.updated` fired with `cancel_at_period_end=true`
- ☐ `subscriptions` row's status remains `'active'`; `cancel_at_period_end=true` recorded
- ☐ `/account/billing` shows "Cancellation scheduled — access until [date]" per TASK-047 Q-6.20 default
- ☐ User can still use paid features until `current_period_end`
- ☐ At `current_period_end`, daily cron rolls user to `tier='explorer'`, `status='free'` (verify by manually advancing system date or by running `npm run cron:period-end-rollover` if exposed for testing)

### Scenario 4 — Failed payment (dunning)

**Setup:** user has active subscription; new month begins (or trigger via Stripe Dashboard "Bill subscription now").

**Action:** Stripe attempts charge using a card that has been replaced with `4000 0000 0000 9995` (insufficient funds — easiest in test mode via Stripe CLI: `stripe trigger invoice.payment_failed`).

**Expected outcomes:**
- ☐ Webhook `invoice.payment_failed` fired
- ☐ `subscriptions.status` flipped to `past_due`
- ☐ Dunning email sent (per R-TASK-135 + Q-8.11): "Your card failed; update billing"
- ☐ `/account/billing` shows past_due banner per TASK-047

### Scenario 5 — 3D Secure card

**Setup:** new user; `/pricing` → click subscribe.

**Action:** Use card `4000 0027 6000 3184`. Stripe Checkout displays 3DS challenge frame; complete it (test-mode just requires a click).

**Expected outcomes:**
- ☐ Webhook eventually fires (after 3DS completion)
- ☐ Subscription created normally
- ☐ Stripe Dashboard > Payment shows the 3DS authentication step

This scenario verifies SCA (Strong Customer Authentication) compliance for European customers per PSD2.

### Scenario 6 — Webhook idempotency

**Setup:** Stripe CLI is listening; dev server is running.

**Action:** Run any of Scenarios 1-4 to generate a webhook event. Then replay the same event:

```bash
stripe events resend evt_XXXXXXXXXXXX  # use the event ID from the previous fire
```

**Expected outcomes:**
- ☐ The replayed event hits the webhook endpoint
- ☐ PATCH-002's `stripe_webhook_events` idempotency table has the event ID; handler returns 200 without reprocessing
- ☐ No duplicate row in `subscriptions` (the UNIQUE constraint on `stripe_session_id` from migration 011 catches it; though for `subscription.*` events the PRIMARY KEY on `id` already prevents duplicates)
- ☐ Sentry receives no error log

### After-test cleanup

```bash
# Optional: archive the test customer in Stripe Dashboard so future test runs start clean
# Or use a fresh email each test run to avoid mixing data
```

## What this task does NOT do

- Does NOT cover Stripe Tax (Q-4.3 deferred)
- Does NOT cover refund flows (Q-10.12 covers those in TASK-065 e2e-billing)
- Does NOT cover lifetime-tier scenarios (eliminated A.3)
- Does NOT automate any of these — automation is TASK-065's job

## Tests Required (meta — verifying the doc itself)

- AT-066: `docs/manual-tests/billing.md` exists with all 6 scenarios documented
- AT-067: All 4 SKUs (Author/Publisher × Monthly/Annual) covered in Scenario 1
- AT-068: Mechanical: doc contains zero occurrences of `lifetime` (case-insensitive)
- AT-069: Doc references the 4 test cards by exact number for reproducibility
- AT-070: Webhook idempotency scenario explicitly references PATCH-002 + migration 010

## Session Notes
_(Filled by Claude Code during implementation)_
