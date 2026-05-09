<!-- APPLY: REPLACE -->
<!-- Target: docs/TASKS/TASK-058-google-analytics.md (in original mybsn package) -->
<!-- Backup: docs/EXPANDED-TASKS/backups/TASK-058-google-analytics.pre-expansion-backup.md -->
<!-- Expanded 2026-05-09 from 121 words to ~1290 words via PATCH-3 sub-deliverable B.3.
     Categorized MIXED — substantive operator-input question (Q-9.2 event taxonomy), but operator
     accepted my proposed 10-event matrix as default. Lifetime tier removed from event property values. -->

# TASK-058: Google Analytics 4 (`components/Analytics.tsx` + `lib/analytics.ts`)

## Status: NOT STARTED
## Priority: HIGH
## Phase: 9
## Estimated Sessions: 2
## Dependencies: TASK-002, TASK-007 (consent gate path), R-TASK-119 (privacy disclosures), R-TASK-105 (GA4 vendor disclosure in DPA)
## Requirements Covered: R29
## Spec Reference: Section 9.1

## Inference Summary

| Addition | Source |
|---|---|
| Cookie-based GA4 standard with consent gate | Q-9.1 operator-answer (use default) |
| 10-event taxonomy locked | Q-9.2 operator-answer (use default — accepted my proposed matrix) |
| User_id binding post-signup | Q-9.3 operator-answer (use default) |
| IP anonymization confirmed (GA4 default) | Q-9.4 operator-answer (use default) |
| Hybrid client + server-side (server-side for `subscription_purchase`) | Q-9.5 operator-answer (use default) |
| Cluster events added: `genre_view`, `genre_cta_click`, `lead_magnet_view`, `lead_magnet_submit`, `affiliate_waitlist_view`, `affiliate_waitlist_submit`, `sample_chapter_view`, `how_it_works_view`, `how_it_works_to_tour`, `legal_index_view`, `legal_page_click` | v1 content cluster R-TASK additions |
| Lifetime SKU removed from event property values | A.3 cascade |

Operator confirmed all questions on 2026-05-08.

## Pre-flight: re-read current state

- View existing GA4 integration if present.
- Confirm `NEXT_PUBLIC_GA_MEASUREMENT_ID` is set (TASK-003 expansion).
- Confirm consent banner from R-TASK-119 / R-TASK-129 cookies/privacy is in place — GA tag must NOT load until user consents.
- View `lib/cookies-consent.ts` (if exists) — exposes the consent state for GA gating.

## Files to Create/Modify

- `components/Analytics.tsx` — Google Tag Manager / GA4 script loader gated by consent
- `lib/analytics.ts` — typed `gtag` event helpers
- `app/layout.tsx` — mounts `<Analytics />` once at root
- `app/api/ga/track/route.ts` — server-side event endpoint for `subscription_purchase` (called from webhook)

## Implementation Requirements

### `<Analytics />` component (consent-gated)

```tsx
'use client';
import { useEffect, useState } from 'react';
import Script from 'next/script';
import { useCookieConsent } from '@/lib/cookies-consent';

export function Analytics() {
  const { consent } = useCookieConsent();  // 'accepted' | 'rejected' | 'pending'
  if (consent !== 'accepted') return null;

  const id = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;
  if (!id) return null;

  return (
    <>
      <Script src={`https://www.googletagmanager.com/gtag/js?id=${id}`} strategy="afterInteractive" />
      <Script id="ga-init" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', '${id}', {
            anonymize_ip: true,             // Q-9.4 — GA4 default + explicit
            send_page_view: true,
            cookie_flags: 'SameSite=Lax;Secure',
          });
        `}
      </Script>
    </>
  );
}
```

Gated by consent banner state. Per Q-9.1: GA does NOT load until user clicks Accept on the cookies banner. R-TASK-119 cookies policy discloses GA usage.

### Event taxonomy — `lib/analytics.ts`

Per Q-9.2 default, the locked 10-event matrix plus cluster additions:

```typescript
type EventName =
  // Core flows
  | 'page_view'
  | 'sign_up'
  | 'subscription_purchase'   // server-side from webhook
  | 'tour_complete'
  | 'tour_complete_to_signup'
  | 'book_created'
  | 'chapter_written'
  | 'signup_modal_opened'
  | 'ai_call'
  | 'export_initiated'
  // v1 content cluster additions (R-TASK-160 through R-TASK-176)
  | 'sample_chapter_view'
  | 'genre_view'
  | 'genre_cta_click'
  | 'lead_magnet_view'
  | 'lead_magnet_submit'
  | 'affiliate_waitlist_view'
  | 'affiliate_waitlist_submit'
  | 'how_it_works_view'
  | 'how_it_works_to_tour'
  | 'legal_index_view'
  | 'legal_page_click'
  | 'pricing_toggle_change'
  | 'newsletter_subscribe_submit';

interface EventParams {
  page_view: { path: string; referrer?: string };
  sign_up: { tier: 'explorer'; source: string };  // tier always 'explorer' at signup per Q-2.9
  subscription_purchase: { tier: 'author' | 'publisher'; interval: 'monthly' | 'annual'; value_usd: number };  // NO 'lifetime' post-A.3
  tour_complete: { duration_seconds: number };
  tour_complete_to_signup: Record<string, never>;
  book_created: { tier: 'explorer' | 'author' | 'publisher' };
  chapter_written: { book_id: string; chapter_index: number; word_count_delta: number };
  signup_modal_opened: { source: string };
  ai_call: { step: number; function_name: string; tokens: number; latency_ms: number };
  export_initiated: { format: 'pdf' | 'epub' | 'docx' };
  sample_chapter_view: { source?: string };
  genre_view: { genre_count: number };
  genre_cta_click: { genre: string };
  lead_magnet_view: Record<string, never>;
  lead_magnet_submit: { subscribed_newsletter: boolean };
  affiliate_waitlist_view: Record<string, never>;
  affiliate_waitlist_submit: { channel?: string };
  how_it_works_view: Record<string, never>;
  how_it_works_to_tour: Record<string, never>;
  legal_index_view: Record<string, never>;
  legal_page_click: { policy_slug: string };
  pricing_toggle_change: { from: 'monthly' | 'annual'; to: 'monthly' | 'annual' };
  newsletter_subscribe_submit: { source: 'footer' | 'lead_magnet' };
}

export function track<E extends EventName>(event: E, params: EventParams[E]) {
  if (typeof window === 'undefined') return;
  if (typeof window.gtag !== 'function') return;  // not loaded (consent rejected)
  window.gtag('event', event, params);
}
```

**Conversion events** designated in GA4 Admin (operator does this manually in GA4 dashboard):
- `sign_up`
- `subscription_purchase`
- `lead_magnet_submit`
- `affiliate_waitlist_submit`
- `newsletter_subscribe_submit`

### User_id binding (Q-9.3)

Post-signup, set GA `user_id` to the user's Supabase user_id (UUID, no PII):

```typescript
import { createClient } from '@/lib/supabase/client';

export async function bindAnalyticsUser() {
  if (typeof window === 'undefined' || typeof window.gtag !== 'function') return;
  const sb = createClient();
  const { data: { user } } = await sb.auth.getUser();
  if (user?.id) {
    window.gtag('config', process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID!, {
      user_id: user.id,
    });
  }
}
```

Called from `app/(app)/layout.tsx` on mount (after AuthGuard confirms user). Lets GA correlate signup → purchase → engagement across sessions and devices.

### Server-side events (Q-9.5)

`subscription_purchase` fires server-side from the Stripe webhook handler (TASK-024) via GA Measurement Protocol — the user may have closed their tab or be on a different device when the webhook lands. Client-side fire would miss conversions.

```typescript
// app/api/ga/track/route.ts (called server-side from webhook)
import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  // Internal-only — verify request comes from webhook handler
  const internalSecret = req.headers.get('x-internal-secret');
  if (internalSecret !== process.env.INTERNAL_SECRET) {
    return NextResponse.json({ error: 'forbidden' }, { status: 403 });
  }

  const body = await req.json();
  const { event, params, user_id, client_id } = body;

  // GA4 Measurement Protocol
  await fetch(`https://www.google-analytics.com/mp/collect?measurement_id=${process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID}&api_secret=${process.env.GA_API_SECRET}`, {
    method: 'POST',
    body: JSON.stringify({
      client_id: client_id ?? user_id,  // GA requires client_id; user_id as fallback
      user_id,
      events: [{ name: event, params }],
    }),
  });

  return NextResponse.json({ ok: true });
}
```

Adds 2 new env vars: `INTERNAL_SECRET` (for internal API gating) and `GA_API_SECRET` (created in GA4 Admin > Data Streams > Measurement Protocol API secrets). Total v1 env vars: 22 (was 20). Document in B.5 changelog.

Webhook handler (TASK-024) calls this endpoint after `subscription.created`:

```typescript
// In webhook
await fetch(`${baseUrl}/api/ga/track`, {
  method: 'POST',
  headers: { 'x-internal-secret': process.env.INTERNAL_SECRET!, 'Content-Type': 'application/json' },
  body: JSON.stringify({
    event: 'subscription_purchase',
    params: { tier, interval, value_usd: amountTotal / 100 },
    user_id: profile.id,
  }),
}).catch((err) => Sentry.captureException(err));
```

### IP anonymization (Q-9.4)

GA4 anonymizes IP by default; explicit `anonymize_ip: true` in the gtag config block reaffirms. Disclosed in TASK-057 Privacy Policy.

### Cookies banner integration

Per R-TASK-119 cookies policy + R-TASK-129, the consent banner provides three states: pending (default; banner visible; GA not loaded), accepted (banner dismissed; GA loaded), rejected (banner dismissed; GA never loads). State stored in `localStorage.cookies_consent`.

`<Analytics />` component reads consent state via `useCookieConsent()` hook and conditionally mounts the GA scripts. State change from rejected → accepted requires page reload to load GA (acceptable v1 behavior).

### What this task does NOT do

- Does NOT include cookieless GA mode (Q-9.1 alternative path; defer to v1.1 if EU regulation tightens)
- Does NOT include Resend webhooks for email tracking (Q-8.14 deferred)
- Does NOT track events server-side except `subscription_purchase` (other webhook-only events like `payment_failed` not currently in taxonomy; add in v1.1 if dunning analytics matter)
- Does NOT include alternative analytics platforms (Plausible, Fathom) — GA4 only per Decision #29

## Tests Required

- AT-242: GA scripts NOT present in DOM when consent state is `pending` or `rejected`
- AT-243: GA scripts mount when user clicks Accept on cookies banner
- AT-244: `track('sign_up', { tier: 'explorer', source: 'landing_hero' })` calls `window.gtag('event', 'sign_up', ...)`
- AT-245: User_id binding fires on `/app` mount for authenticated user
- AT-246: Server-side `subscription_purchase` event arrives in GA4 Real-Time view after Stripe webhook
- AT-247: `/api/ga/track` returns 403 without `x-internal-secret` header
- AT-248: All cluster events (genre_view, lead_magnet_submit, etc.) typed correctly per `EventParams` map
- AT-249: Mechanical: `'lifetime'` does not appear as a possible value of `subscription_purchase.tier`
- AT-250: GA4 Admin shows `sign_up`, `subscription_purchase`, `lead_magnet_submit`, `affiliate_waitlist_submit`, `newsletter_subscribe_submit` marked as conversion events

## Session Notes
_(Filled by Claude Code during implementation)_
