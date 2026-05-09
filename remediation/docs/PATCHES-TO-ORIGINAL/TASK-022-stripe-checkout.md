<!-- APPLY: REPLACE -->
<!-- Target: docs/TASKS/TASK-022-stripe-checkout.md (in original mybsn package) -->

# TASK-022: Stripe Checkout Session

## Status: NOT STARTED
## Priority: HIGH
## Phase: 4
## Estimated Sessions: 1
## Dependencies: TASK-006, TASK-020
## Requirements Covered: R7
## Spec Reference: Section 4.3

## Pre-flight: re-read current state

If `app/api/stripe/checkout/route.ts` already exists, view it and confirm whether
lifetime checkout handling is present. If absent, build per below. If present, scope
this task to removing the lifetime path.

## Files to Create/Modify
`app/api/stripe/checkout/route.ts`

## Implementation Requirements

POST handler creates Stripe Checkout Session for tier upgrade. Auth via
`verifyToken`. Extract `priceId` from request body; validate it is one of the
**4 valid recurring price IDs** (env-checked: must equal one of
`STRIPE_PRICE_AUTHOR_MONTHLY`, `STRIPE_PRICE_AUTHOR_ANNUAL`,
`STRIPE_PRICE_PUBLISHER_MONTHLY`, `STRIPE_PRICE_PUBLISHER_ANNUAL`).

**No `mode: 'payment'` branch** — all sessions use `mode: 'subscription'`. Lifetime
SKUs removed 2026-05-06. If a lifetime price ID is somehow submitted (replay attack,
old client cached, etc.), reject with 400 "Invalid price ID."

```typescript
const VALID_PRICES = new Set([
  process.env.STRIPE_PRICE_AUTHOR_MONTHLY!,
  process.env.STRIPE_PRICE_AUTHOR_ANNUAL!,
  process.env.STRIPE_PRICE_PUBLISHER_MONTHLY!,
  process.env.STRIPE_PRICE_PUBLISHER_ANNUAL!,
]);
if (!VALID_PRICES.has(priceId)) {
  return NextResponse.json({ error: 'Invalid price ID' }, { status: 400 });
}

const session = await stripe.checkout.sessions.create({
  mode: 'subscription',
  line_items: [{ price: priceId, quantity: 1 }],
  customer_email: user.email,
  client_reference_id: user.id,
  success_url: `\${process.env.NEXT_PUBLIC_SITE_URL}/account?upgraded=true`,
  cancel_url: `\${process.env.NEXT_PUBLIC_SITE_URL}/pricing`,
  // No payment_intent_data — only used for one-time payments
});
```

## Tests Required
AT-046: Valid price IDs return Checkout Session URL. AT-047: Invalid price ID returns 400.
AT-048: Lifetime price ID (if forged into request) returns 400.

## Session Notes
_(Filled by Claude Code during implementation)_
