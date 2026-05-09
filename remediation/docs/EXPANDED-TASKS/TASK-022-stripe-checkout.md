<!-- APPLY: REPLACE -->
<!-- Target: docs/TASKS/TASK-022-stripe-checkout.md (in original mybsn package) -->
<!-- Backup: docs/EXPANDED-TASKS/backups/TASK-022-stripe-checkout.pre-expansion-backup.md -->
<!-- Expanded 2026-05-08 from 92 words to ~830 words via PATCH-3 sub-deliverable B.3.
     Supersedes A.3 patch at docs/PATCHES-TO-ORIGINAL/TASK-022-stripe-checkout.md by folding lifetime-elimination semantics. -->

# TASK-022: Stripe Checkout Session API (`app/api/stripe/checkout/route.ts`)

## Status: NOT STARTED
## Priority: HIGH
## Phase: 4
## Estimated Sessions: 1
## Dependencies: TASK-006, TASK-020
## Requirements Covered: R7
## Spec Reference: Section 4.3

## Inference Summary

| Addition | Source |
|---|---|
| Encode `tier` and `interval` on success URL | Q-4.4 operator-answer (use default) |
| Cache `stripe_customer_id` on profile | Q-4.5 operator-answer (use default) |
| No trial period in v1 | Q-4.6 operator-answer (use default) |
| Validate price ID against 4-SKU whitelist | A.3 cascade + Q-4.6 |
| Reject lifetime price IDs (defense-in-depth) | A.3 |
| `mode: 'subscription'` only (no `mode: 'payment'`) | A.3 + Decision #29 revision |
| Verified-email gate | TASK-008 expansion (Q-2.11) + Stripe policy |

Operator confirmed all questions on 2026-05-08.

## Pre-flight: re-read current state

- View `app/api/stripe/checkout/route.ts` if present.
- Confirm `getStripe()` from `lib/stripe.ts` (TASK-005) is available.
- Confirm `verifyToken` from `lib/api-auth.ts` (TASK-006) is available.
- Confirm migration TASK-011 (profiles) has `stripe_customer_id TEXT` column. If not, add via additive migration.
- Confirm `auth.users.email_confirmed_at` is checked (or `email_verified` claim on user) per TASK-008's soft-gate behavior — Stripe Checkout requires verified email at the API level.

## Files to Create/Modify

- `app/api/stripe/checkout/route.ts` (NEW)

## Implementation Requirements

POST handler. Auth via `verifyToken`. Validate the requested `priceId` against the 4-SKU whitelist; create or reuse Stripe customer; create Checkout Session in `mode: 'subscription'`; return the session URL for client redirect.

```typescript
export async function POST(req: NextRequest) {
  const user = await verifyToken(req);
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  // Per TASK-008 / Stripe policy: email must be verified before billing
  if (!user.email_verified) {
    return NextResponse.json({ error: 'email_not_verified' }, { status: 403 });
  }

  const body = await req.json();
  const { priceId } = body as { priceId?: string };
  if (!priceId) return NextResponse.json({ error: 'price_id_required' }, { status: 400 });

  // Per A.3 + Q-4.4: 4 valid price IDs only. Lifetime SKUs eliminated.
  const VALID_PRICES = new Set([
    process.env.STRIPE_PRICE_AUTHOR_MONTHLY!,
    process.env.STRIPE_PRICE_AUTHOR_ANNUAL!,
    process.env.STRIPE_PRICE_PUBLISHER_MONTHLY!,
    process.env.STRIPE_PRICE_PUBLISHER_ANNUAL!,
  ]);
  if (!VALID_PRICES.has(priceId)) {
    Sentry.captureMessage('Invalid priceId at /api/stripe/checkout', { level: 'warning', extra: { priceId, user_id: user.id } });
    return NextResponse.json({ error: 'invalid_price_id' }, { status: 400 });
  }

  // Tier + interval derivation from priceId — used in success URL per Q-4.4
  const tierMap: Record<string, { tier: 'author'|'publisher'; interval: 'monthly'|'annual' }> = {
    [process.env.STRIPE_PRICE_AUTHOR_MONTHLY!]:    { tier: 'author', interval: 'monthly' },
    [process.env.STRIPE_PRICE_AUTHOR_ANNUAL!]:     { tier: 'author', interval: 'annual' },
    [process.env.STRIPE_PRICE_PUBLISHER_MONTHLY!]: { tier: 'publisher', interval: 'monthly' },
    [process.env.STRIPE_PRICE_PUBLISHER_ANNUAL!]:  { tier: 'publisher', interval: 'annual' },
  };
  const { tier, interval } = tierMap[priceId];

  // Per Q-4.5: cache stripe_customer_id on profile. First checkout creates customer + writes ID.
  const sb = createClient();
  const { data: profile } = await sb.from('profiles').select('stripe_customer_id').eq('id', user.id).single();
  let customerId = profile?.stripe_customer_id;

  const stripe = getStripe();
  if (!customerId) {
    const customer = await stripe.customers.create({
      email: user.email,
      name: user.full_name ?? undefined,
      metadata: { user_id: user.id },
    });
    customerId = customer.id;
    // Persist immediately so retries / parallel requests don't create duplicate customers
    await sb.from('profiles').update({ stripe_customer_id: customerId }).eq('id', user.id);
  }

  // Per Q-4.6: no trial. Per A.3: mode='subscription' only.
  const session = await stripe.checkout.sessions.create({
    mode: 'subscription',
    customer: customerId,
    client_reference_id: user.id,
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${process.env.NEXT_PUBLIC_SITE_URL}/account?upgraded=true&tier=${tier}&interval=${interval}`,
    cancel_url: `${process.env.NEXT_PUBLIC_SITE_URL}/pricing`,
    allow_promotion_codes: true,
    billing_address_collection: 'auto',
    // No subscription_data.trial_period_days per Q-4.6 default
    // No automatic_tax (Q-4.3 — Stripe Tax deferred to v1.1)
  });

  if (!session.url) return NextResponse.json({ error: 'session_url_missing' }, { status: 500 });
  return NextResponse.json({ url: session.url, session_id: session.id });
}
```

### Why `client_reference_id` AND customer metadata

The `client_reference_id` is set on the Checkout Session for downstream webhook correlation. The customer's `metadata.user_id` is set on the customer object for cases where Stripe events reference customer-id but not session-id (e.g., subsequent invoice events). Two paths to the user-id; webhook handler (TASK-024) tries both.

### Email-verified gate rationale

Per Q-2.11 default in TASK-008, email verification is a **soft gate** for `/app` access (banner only) but a **hard gate** for billing. Two reasons:

1. **Stripe policy:** Stripe applies fraud heuristics that flag unverified-email checkouts. Sending verified emails reduces dispute rates.
2. **Refund deliverability:** if the user requests a refund 13 days post-purchase (within R-TASK-119 14-day window), the operator needs a deliverable email to confirm.

The error `email_not_verified` returned here is caught by `/pricing` and `/account/billing` UI, which surface "Please verify your email first. [Resend verification link]" in place of the upgrade button.

### `allow_promotion_codes`

Set to `true` so users can redeem promo codes Stripe-side. The operator can create promo codes in Stripe Dashboard for marketing campaigns without code changes. No promo codes in v1 launch; the toggle is a future-proofing zero-cost.

## What this task does NOT do

- Does NOT handle the success URL landing page itself — that's `app/account/page.tsx` (TASK-047) reading `?upgraded=true&tier=...&interval=...`
- Does NOT process webhooks — that's TASK-024 (PATCH-002 idempotency)
- Does NOT create one-time-payment sessions — `mode: 'subscription'` only post-A.3
- Does NOT support quantity > 1 (no team seats per R-TASK-101 Path A)

## Tests Required

- AT-053: Valid `priceId` from authenticated verified-email user → 200 + Checkout URL
- AT-054: Invalid `priceId` (e.g., `price_fake`) → 400 `invalid_price_id` + Sentry warning
- AT-055: Lifetime price ID submitted (forged from old client) → 400 `invalid_price_id`
- AT-056: Unverified email → 403 `email_not_verified`
- AT-057: First checkout creates Stripe customer + writes `stripe_customer_id` to profile
- AT-058: Second checkout from same user reuses cached `stripe_customer_id` (no new customer created in Stripe)
- AT-059: Success URL contains `tier=author&interval=annual` query params for Author Annual checkout
- AT-060: Mechanical: route file does not contain `mode: 'payment'` or `trial_period_days` strings

## Session Notes
_(Filled by Claude Code during implementation)_
