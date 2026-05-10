# TASK-024: Stripe Webhook Handler

## Status: NOT STARTED
## Priority: CRITICAL
## Phase: 4
## Estimated Sessions: 2
## Dependencies: TASK-005,TASK-016
## Requirements Covered: R4,R7
## Spec Reference: Section 4.5

## Files to Create/Modify
app/api/stripe/webhook/route.ts

## Implementation Requirements
POST: read raw body, verify signature with STRIPE_WEBHOOK_SECRET, use service role Supabase client. Handle: customer.subscription.created/updated (upsert subscriptions, update profiles.subscription_tier), customer.subscription.deleted (downgrade to explorer), checkout.session.completed for lifetime payments (set tier + subscription_status='lifetime'). This route does NOT use verifyToken — it uses Stripe signature verification.

## Tests Required
AT-053: Subscription webhook updates tier. AT-054: Lifetime payment sets status='lifetime'. AT-055: Invalid signature returns 400.

## Session Notes
_(Filled by Claude Code during implementation)_
