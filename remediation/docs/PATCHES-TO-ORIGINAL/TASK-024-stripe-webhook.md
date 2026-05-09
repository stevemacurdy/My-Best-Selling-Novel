<!-- APPLY: REPLACE -->
<!-- Target: docs/TASKS/TASK-024-stripe-webhook.md (in original mybsn package) -->

# TASK-024: Stripe Webhook Handler

## Status: NOT STARTED
## Priority: CRITICAL
## Phase: 4
## Estimated Sessions: 2
## Dependencies: TASK-004, TASK-006, TASK-015
## Requirements Covered: R8
## Spec Reference: Section 4.5

## Pre-flight: re-read current state

If `app/api/stripe/webhook/route.ts` already exists, view it and check for: (a) lifetime
checkout-session handling, (b) PATCH-002 idempotency (event-id dedup + UNIQUE constraint
on stripe_session_id), (c) signature verification. Scope this task to whatever is missing.

## Files to Create/Modify
`app/api/stripe/webhook/route.ts`

## Implementation Requirements

POST handler for Stripe webhooks. Verifies signature using `stripe.webhooks.constructEvent`.
**Idempotency:** check `stripe_webhook_events` table for prior `event.id`; if present,
return 200 without reprocessing (per PATCH-002 + migration 010). On new event, INSERT
into `stripe_webhook_events` then process.

**Handled events (5):**
1. `customer.subscription.created` — set `subscriptions.tier`, `status='active'`,
   `current_period_end`
2. `customer.subscription.updated` — update tier, status, period_end
3. `customer.subscription.deleted` — set `status='cancelled'`, keep period_end so user
   retains access until period ends
4. `invoice.payment_succeeded` — log to `ai_usage_logs` for renewal tracking
5. `invoice.payment_failed` — set `status='past_due'`; trigger dunning email per R-TASK-135

**Removed 2026-05-06: `checkout.session.completed`** handling. With lifetime tier eliminated,
no one-time-payment flow exists; checkout.session.completed events should not arrive
(no `mode: 'payment'` sessions are created per TASK-022). If the event somehow arrives
anyway (forged, replayed from old data), log a Sentry warning and return 200 without
processing.

Use service-role Supabase client (per TASK-004). Webhook is the SOLE source of truth
for subscription tier (Decision #3).

## Tests Required
AT-049: Valid webhook signature processes successfully. AT-050: Invalid signature returns
400. AT-051: Duplicate event.id is no-op (per PATCH-002). AT-052: `checkout.session.completed`
event arriving in production is logged but not processed.

## Session Notes
_(Filled by Claude Code during implementation)_
