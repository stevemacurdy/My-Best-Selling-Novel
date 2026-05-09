<!-- APPLY: CREATE -->
# PATCH-002: TASK-024 — Stripe Webhook Event Deduplication & Uniqueness

## Status: NOT STARTED
## Priority: HIGH
## Phase: 4 patch (run as part of TASK-024 implementation)
## Estimated Sessions: 0.5 (folded into TASK-024)
## Dependencies: TASK-024
## Resolves Gaps: GAP-022
## Spec Reference: AUDIT_REPORT.md HIGH section

## Pre-flight: re-read current state

Before making any change, read the current state of every file listed in "Files to Modify" below. Verify the gap(s) addressed by this task are still present in the current code. Specifically:

- For each file in "Files to Modify": view the file and confirm the condition the audit observed (e.g., "no rate limiting on /api/ai") still applies.
- For each gap in "Resolves Gaps": confirm the gap remains open. The audit was conducted on 2026-05-04; if the codebase changed since, the gap may have been partially or fully addressed.
- If a gap is no longer present, report this finding in PROGRESS.md, mark this task as superseded, and stop. Do not make changes.
- If a gap is partially addressed, scope this task to the remaining work and document in this file's Session Notes what was already addressed and skipped.
- If the gap is still fully present as the audit described, proceed with the rest of this task.

This pre-flight catches the case where the codebase changed between audit and remediation — exactly the failure mode that produces silent overwrites of unrelated work.

## What this patch changes

The original TASK-024 verifies the Stripe webhook signature and dispatches on `event.type`, but does NOT deduplicate by `event.id`. Stripe officially retries webhook deliveries up to 3 days on non-2xx responses, and occasionally re-delivers events that succeeded due to internal restarts. Without dedup, the same event can update the database twice. For idempotent updates this is harmless; for INSERTs (subscriptions table on prior lifetime payment design, or future one-time-payment SKUs) it would create duplicate rows. With lifetime tier eliminated 2026-05-06, the dedup is currently preventing the same recurring `subscription.created` event from being processed twice — still high-value protection.

## Files to Create

- `supabase/migrations/010_stripe_webhook_events.sql` — event-id table for dedup (and audit trail of every webhook received)

## Files to Modify

- `app/api/stripe/webhook/route.ts` (created by TASK-024)

## SQL — `010_stripe_webhook_events.sql`

```sql
-- Tracks every Stripe webhook event received, enabling idempotency by event.id
CREATE TABLE stripe_webhook_events (
  event_id TEXT PRIMARY KEY,
  event_type TEXT NOT NULL,
  api_version TEXT,
  livemode BOOLEAN NOT NULL,
  received_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  processed_at TIMESTAMPTZ,
  processing_status TEXT NOT NULL DEFAULT 'received'
    CHECK (processing_status IN ('received', 'processing', 'processed', 'failed')),
  failure_reason TEXT,
  retry_count INT NOT NULL DEFAULT 0,
  payload JSONB NOT NULL
);

CREATE INDEX idx_stripe_webhook_events_received ON stripe_webhook_events(received_at DESC);
CREATE INDEX idx_stripe_webhook_events_status ON stripe_webhook_events(processing_status)
  WHERE processing_status IN ('received', 'failed');

-- No RLS — webhook handler uses service role
ALTER TABLE stripe_webhook_events ENABLE ROW LEVEL SECURITY;
-- Admins can read for debugging
CREATE POLICY "Admins read webhook events" ON stripe_webhook_events
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );
```

Add unique constraint on `subscriptions` Stripe IDs to prevent duplicate inserts:

```sql
-- Lives in a new migration `011_subscriptions_unique.sql` (additive; do not edit historical migration 005).
-- subscriptions.id is already PRIMARY KEY (Stripe sub ID), so dedup is implicit for subscription events.
-- Originally added 2026-05-05 to dedup lifetime one-time payments. Lifetime tier eliminated 2026-05-06,
-- but constraint preserved as defense-in-depth for any future one-time-payment SKU. Constraint allows
-- NULL so it's a no-op for current recurring-only SKUs.

ALTER TABLE subscriptions
  ADD COLUMN IF NOT EXISTS stripe_session_id TEXT;
ALTER TABLE subscriptions
  ADD CONSTRAINT subscriptions_session_unique UNIQUE (stripe_session_id);
-- (Allows NULL for subscription rows; UNIQUE on non-null lifetime session_ids)
```

## Webhook handler addition

```typescript
// app/api/stripe/webhook/route.ts (additions; full file structure from TASK-024)
import { headers } from 'next/headers';
import Stripe from 'stripe';
import { getStripe } from '@/lib/stripe';
import { getServiceRoleSupabase } from '@/lib/supabase/server';

export const runtime = 'nodejs';
export const maxDuration = 30;
export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  const stripe = getStripe();
  const sig = req.headers.get('stripe-signature');
  if (!sig) return new Response('missing signature', { status: 400 });

  const rawBody = await req.text();
  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(rawBody, sig, process.env.STRIPE_WEBHOOK_SECRET!);
  } catch (err) {
    return new Response('invalid signature', { status: 400 });
  }

  const sb = getServiceRoleSupabase();

  // ─── IDEMPOTENCY GUARD ───
  // Try to insert event row; ON CONFLICT means we've seen this event_id before
  const { error: insertErr } = await sb.from('stripe_webhook_events').insert({
    event_id: event.id,
    event_type: event.type,
    api_version: event.api_version,
    livemode: event.livemode,
    payload: event,  // store full payload for replay/debug
  });

  if (insertErr) {
    if (insertErr.code === '23505') {
      // Duplicate event_id — already processed (or in progress); ack with 200
      return new Response('duplicate', { status: 200 });
    }
    // DB error during insert — return 500 so Stripe retries
    captureException(insertErr);
    return new Response('db error', { status: 500 });
  }

  // Mark as processing
  await sb.from('stripe_webhook_events')
    .update({ processing_status: 'processing' })
    .eq('event_id', event.id);

  try {
    // ─── DISPATCH (existing TASK-024 logic) ───
    switch (event.type) {
      case 'customer.subscription.created':
      case 'customer.subscription.updated':
        await handleSubscriptionUpsert(sb, event.data.object as Stripe.Subscription);
        break;
      case 'customer.subscription.deleted':
        await handleSubscriptionCancel(sb, event.data.object as Stripe.Subscription);
        break;
      case 'checkout.session.completed':
        await handleCheckoutCompleted(sb, event.data.object as Stripe.Checkout.Session);
        break;
      case 'invoice.payment_failed':
        await handleInvoiceFailed(sb, event.data.object as Stripe.Invoice);
        break;
      default:
        // Unknown event type — record but don't fail
        break;
    }

    await sb.from('stripe_webhook_events')
      .update({
        processing_status: 'processed',
        processed_at: new Date().toISOString(),
      })
      .eq('event_id', event.id);

    return new Response('ok', { status: 200 });
  } catch (err) {
    captureException(err, { event_id: event.id, event_type: event.type });
    await sb.from('stripe_webhook_events')
      .update({
        processing_status: 'failed',
        failure_reason: err instanceof Error ? err.message : String(err),
        retry_count: sb.raw('retry_count + 1') as any,
      })
      .eq('event_id', event.id);
    // Return 500 so Stripe retries
    return new Response('processing failed', { status: 500 });
  }
}

async function handleCheckoutCompleted(sb: any, session: Stripe.Checkout.Session) {
  // Lifetime tier eliminated 2026-05-06 (Decision #29 revision). No `mode: 'payment'`
  // checkout sessions are created by /api/stripe/checkout. If a checkout.session.completed
  // event arrives with mode='payment' anyway (forged, replayed from old data, or rogue
  // admin), log a Sentry warning and return without processing.
  if (session.mode === 'payment') {
    Sentry.captureMessage('checkout.session.completed with mode=payment received but lifetime tier is eliminated', { level: 'warning', extra: { session_id: session.id } });
    return;
  }
  // mode='subscription' is handled by customer.subscription.* events, not here.
  return;
}
```

## Why dual-protection (event-id table + UNIQUE constraint)

- **Event-id table** catches duplicate webhook deliveries (Stripe retried; same event.id arrives twice). 200 returned, no work performed.
- **UNIQUE constraint on stripe_session_id** in migration 011 — was originally added (2026-05-05) to catch duplicate lifetime grants. With lifetime tier eliminated 2026-05-06, the constraint is preserved as defense-in-depth for any future one-time-payment SKU. Constraint allows NULL, so it's a no-op for the only SKUs that currently exist (recurring subscriptions). See migration 011 comment for full rationale.

Belt-and-suspenders is still appropriate: even with lifetime gone, if a future SKU adds one-time payments, the constraint protects against double-grants without needing schema changes at that future point.

<!-- ADR-004 cross-binding paragraph removed 2026-05-06: ADR-004 voided when lifetime tier was eliminated. This task still ships for the non-lifetime reasons originally documented above. -->
## Tests Required

- AT-024-PATCH-1: Submit identical webhook event twice (same event.id); first returns 200 and processes; second returns 200 with 'duplicate' body and does NOT re-process
- AT-024-PATCH-2: Submit `customer.subscription.created` event; verify exactly one row in subscriptions; submit same event.id again → still one row (event-id dedup catches it). Lifetime checkout test removed 2026-05-06 (no lifetime SKU exists).
- AT-024-PATCH-3: Submit malformed event (missing metadata.tier); processing_status='failed'; failure_reason recorded; Stripe receives 500 (will retry)
- AT-024-PATCH-4: Admin can query stripe_webhook_events table via /api/admin route (after R-TASK-111 audit log)
- AT-024-PATCH-5: 100 concurrent webhook deliveries of same event — only 1 ends up processed (race-condition safe)
- AT-024-PATCH-6: Submit a webhook payload with no `id` field (or `id` = null/empty string); handler rejects the request with 400 and writes nothing to `stripe_webhook_events`; rejection is logged for investigation. Stripe always supplies `id` for legitimate events, so a missing `id` indicates either replay-from-dump or a forged request — fail closed rather than silently process.

## Stripe Dashboard configuration

After webhook deployed:
1. Stripe Dashboard → Developers → Webhooks → endpoint URL = https://mybestsellingnovel.com/api/stripe/webhook
2. Events to send: `customer.subscription.*`, `checkout.session.completed`, `invoice.payment_failed`, `invoice.payment_succeeded`
3. Webhook signing secret → STRIPE_WEBHOOK_SECRET env var on Vercel
4. Use Stripe CLI for local testing: `stripe listen --forward-to localhost:3000/api/stripe/webhook`

## Apply this patch by editing TASK-024 directly

Add to TASK-024's "Implementation Requirements" the contents above. Add to TASK-024's "Tests Required" the AT-024-PATCH-N items. Add migrations 010 (`010_stripe_webhook_events.sql`) and 011 (`011_subscriptions_unique.sql`) to supabase/migrations/.

## Session Notes
_(Filled by Claude Code during TASK-024 implementation)_
