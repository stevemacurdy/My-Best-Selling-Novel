# TASK-022: Stripe Checkout Route

## Status: NOT STARTED
## Priority: CRITICAL
## Phase: 4
## Estimated Sessions: 1
## Dependencies: TASK-005,TASK-006
## Requirements Covered: R5
## Spec Reference: Section 4.3

## Files to Create/Modify
app/api/stripe/checkout/route.ts

## Implementation Requirements
POST: verifyToken, parse {tier, interval} where interval is 'monthly'|'annual'|'lifetime'. Look up correct STRIPE_PRICE_* env var. Get/create Stripe customer. For lifetime: mode='payment' with payment_intent_data.metadata. For monthly/annual: mode='subscription'. Return session.url.

## Tests Required
AT-049: Monthly checkout creates subscription session. AT-050: Lifetime checkout creates one-time payment session.

## Session Notes
_(Filled by Claude Code during implementation)_
