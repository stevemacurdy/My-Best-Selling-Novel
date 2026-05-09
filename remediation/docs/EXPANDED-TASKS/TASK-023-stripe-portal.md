<!-- APPLY: REPLACE -->
<!-- Target: docs/TASKS/TASK-023-stripe-portal.md (in original mybsn package) -->
<!-- Backup: docs/EXPANDED-TASKS/backups/TASK-023-stripe-portal.pre-expansion-backup.md -->
<!-- Expanded 2026-05-08 from 84 words to ~720 words via PATCH-3 sub-deliverable B.3. -->

# TASK-023: Stripe Customer Portal API (`app/api/stripe/portal/route.ts`)

## Status: NOT STARTED
## Priority: HIGH
## Phase: 4
## Estimated Sessions: 1
## Dependencies: TASK-006, TASK-022
## Requirements Covered: R7
## Spec Reference: Section 4.4

## Inference Summary

| Addition | Source |
|---|---|
| All portal features enabled | Q-4.7 operator-answer (use default); TASK-020 expansion |
| Return URL `/account/billing` | Q-4.8 operator-answer (use default) |
| Brand customization (logo, colors) configured Stripe-side | Q-4.9 operator-answer (use default); configured in TASK-020 |
| Cached `stripe_customer_id` lookup; 404 if user never checked out | TASK-022 expansion |

Operator confirmed all questions on 2026-05-08.

## Pre-flight: re-read current state

- View `app/api/stripe/portal/route.ts` if present.
- Confirm TASK-020 includes Customer Portal configuration (logo upload, brand colors, return URL whitelist). If not, this task can ship but the portal will use Stripe defaults until TASK-020 configures.
- Confirm TASK-022 has shipped — without it, `profiles.stripe_customer_id` is never populated and this endpoint always returns 404.

## Files to Create/Modify

- `app/api/stripe/portal/route.ts` (NEW)

## Implementation Requirements

POST handler. Auth via `verifyToken`. Look up cached `stripe_customer_id`; create Billing Portal Session via Stripe SDK; return the URL for client redirect. The portal handles all subscription self-service per Q-4.7 default (payment method, billing address, cancel, plan change, invoice history).

```typescript
export async function POST(req: NextRequest) {
  const user = await verifyToken(req);
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const sb = createClient();
  const { data: profile } = await sb
    .from('profiles')
    .select('stripe_customer_id')
    .eq('id', user.id)
    .single();

  if (!profile?.stripe_customer_id) {
    // User has never been to Checkout (never paid). The portal is meaningless without
    // a Stripe customer, so direct them to /pricing to upgrade first.
    return NextResponse.json({ error: 'no_stripe_customer', redirect_to: '/pricing' }, { status: 404 });
  }

  const stripe = getStripe();
  const session = await stripe.billingPortal.sessions.create({
    customer: profile.stripe_customer_id,
    // Per Q-4.8: return to /account/billing where the user came from
    return_url: `${process.env.NEXT_PUBLIC_SITE_URL}/account/billing`,
  });

  return NextResponse.json({ url: session.url });
}
```

### What Stripe Customer Portal does

When the user lands at `session.url`, Stripe handles:

| Action | Behavior | Resulting webhook |
|---|---|---|
| Update payment method | Stripe-managed UI; new card stored | (none — local only to Stripe) |
| Update billing address | Stripe-managed UI; address stored on customer | `customer.updated` (we don't subscribe; ignored) |
| Cancel subscription | Sets `cancel_at_period_end=true`; user retains access until period end | `customer.subscription.updated` |
| Switch plan (upgrade/downgrade) | Stripe-managed plan picker; proration computed automatically | `customer.subscription.updated` |
| View invoice history | Stripe-managed UI showing all past invoices with PDF download | (none) |

When the user clicks "Return to My Best Selling Novel", they land at `/account/billing` per the `return_url`. The page (TASK-047 territory) re-fetches subscription data via the next page load.

### Brand customization (Stripe Dashboard, not code)

Per Q-4.9 default, brand customization happens entirely in Stripe Dashboard (configured per TASK-020 Section 3). The portal renders with mybsn logo, brand-gold primary, brand-navy secondary. No code-side customization needed.

If the operator wants to A/B test or modify branding later, the changes are in Stripe Dashboard > Settings > Billing > Customer Portal — no code deploy required.

### Why no `configuration` parameter

Stripe SDK accepts an optional `configuration` parameter that overrides the dashboard-configured portal settings per session. Per Q-4.7 (all features enabled at dashboard level) + Q-4.9 (brand at dashboard level), there's no need to override per session. Keeping the API call minimal also means future Stripe Dashboard changes (e.g., enabling Stripe Tax in v1.1) propagate automatically without code changes.

### Failure modes

| Condition | Response |
|---|---|
| No bearer token | 401 `unauthorized` |
| User has no `stripe_customer_id` (never paid) | 404 `no_stripe_customer` + `redirect_to: '/pricing'` |
| Stripe API down | Stripe SDK throws; route returns 502 (caller retries) |
| Stripe customer was deleted out-of-band (operator manually deleted) | Stripe SDK throws `resource_missing`; clear `stripe_customer_id` from profile + return 404 |

The "deleted out-of-band" case is handled defensively — if it happens, user re-enters `/pricing` flow which creates a fresh customer in TASK-022.

```typescript
try {
  const session = await stripe.billingPortal.sessions.create({...});
  return NextResponse.json({ url: session.url });
} catch (err) {
  if (err instanceof Stripe.errors.StripeInvalidRequestError && err.code === 'resource_missing') {
    // Customer was deleted Stripe-side; clear the stale ref and 404
    await sb.from('profiles').update({ stripe_customer_id: null }).eq('id', user.id);
    return NextResponse.json({ error: 'no_stripe_customer', redirect_to: '/pricing' }, { status: 404 });
  }
  Sentry.captureException(err);
  return NextResponse.json({ error: 'portal_failed' }, { status: 502 });
}
```

## What this task does NOT do

- Does NOT process portal-driven changes — those arrive via webhook (TASK-024)
- Does NOT customize the portal UI in code — branding lives in Stripe Dashboard (Q-4.9)
- Does NOT support multiple subscriptions per user (no plan stacking — single subscription per user enforced by TASK-024)

## Tests Required

- AT-061: Authenticated user with `stripe_customer_id` → 200 + portal URL
- AT-062: Authenticated user without `stripe_customer_id` → 404 `no_stripe_customer` + `redirect_to: '/pricing'`
- AT-063: Stripe API down (mocked 500) → 502 `portal_failed` + Sentry exception
- AT-064: Stripe customer was deleted out-of-band (mocked `resource_missing`) → profile.stripe_customer_id cleared + 404 returned
- AT-065: Portal session URL loads in browser; "Return to My Best Selling Novel" returns to `/account/billing`

## Session Notes
_(Filled by Claude Code during implementation)_
