<!-- APPLY: REPLACE -->
<!-- Target: docs/TASKS/TASK-020-stripe-setup-doc.md (in original mybsn package) -->

# TASK-020: Stripe Setup Documentation

## Status: NOT STARTED
## Priority: HIGH
## Phase: 4
## Estimated Sessions: 1
## Dependencies: None (manual operator step)
## Requirements Covered: R7
## Spec Reference: Section 4.1

## Pre-flight: re-read current state

Verify in the Stripe Dashboard whether `author_lifetime` and `publisher_lifetime`
products/prices have been created. If they have, this task includes archiving them.
If not, this task is the original 4-product setup with no archive step.

## Files to Create/Modify
`docs/STRIPE-SETUP.md`

## Implementation Requirements

Document the manual Stripe Dashboard configuration steps:

1. Create 2 products: "Author Plan" and "Publisher Plan"
2. For each product, create 2 prices (monthly + annual). **Lifetime prices removed
   2026-05-06 per Decision #29 revision; do NOT create lifetime prices.**
3. Result: **4 price IDs** (was 6 in original spec):
   - `author_monthly` ($29/mo)
   - `author_annual` ($313.20/year, equiv. ~$26.10/mo with 10% annual discount)
   - `publisher_monthly` ($79/mo)
   - `publisher_annual` ($853.20/year)
4. Configure webhook endpoint URL pointing to `/api/stripe/webhook`
5. Subscribe webhook to events: `customer.subscription.created`, `customer.subscription.updated`,
   `customer.subscription.deleted`, `invoice.payment_succeeded`, `invoice.payment_failed`.
   `checkout.session.completed` is NOT needed (no one-time-payment SKUs remain).
6. Copy webhook signing secret to `STRIPE_WEBHOOK_SECRET` env var.
7. **(Deletion gate — confirm before executing)** If lifetime products/prices were
   previously created in Stripe (e.g., during pre-revision setup), archive them in
   the Stripe Dashboard. Surface the product names and price IDs to the operator
   before archiving; wait for explicit "confirm deletion" reply.

## Tests Required
AT-040: 4 price IDs documented. AT-041: Webhook events list does not include
`checkout.session.completed`. AT-042: No lifetime products active in Stripe (mechanical
check via Stripe API).

## Session Notes
_(Filled by Claude Code during implementation)_
