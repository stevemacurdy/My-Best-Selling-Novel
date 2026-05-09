<!-- APPLY: REPLACE -->
<!-- Target: docs/TASKS/TASK-045-pricing-page.md (in original mybsn package) -->
<!-- Backup: docs/EXPANDED-TASKS/backups/TASK-045-pricing-page.pre-expansion-backup.md -->
<!-- Expanded 2026-05-09 from 113 words to ~1100 words via PATCH-3 sub-deliverable B.3.
     Folds A.3 lifetime-elimination cascade — 4 SKUs, 2 cards (Author + Publisher above Explorer free tier). -->

# TASK-045: Pricing Page (`app/pricing/page.tsx`)

## Status: NOT STARTED
## Priority: HIGH
## Phase: 6
## Estimated Sessions: 1
## Dependencies: TASK-002, TASK-007, TASK-022 (Stripe Checkout), TASK-046 (signup modal for unauth flow), R-TASK-119 (refunds policy)
## Requirements Covered: R12, R31
## Spec Reference: Section 6.3

## Inference Summary

| Addition | Source |
|---|---|
| Annual selected by default on monthly/annual toggle | Q-6.12 operator-answer (use default — biases toward lower-churn commitment) |
| Tier feature lists per Q-6.13 (post-A.3 — 4 SKUs only; no lifetime) | Q-6.13 operator-answer (use default); A.3 cascade |
| Author tier highlighted as "Recommended" | Q-6.14 operator-answer (use default); standard SaaS conversion sweet spot |
| 14-day guarantee surfaced once below all tiers, prominent | Q-6.15 operator-answer (use default); R-TASK-119 cross-bind |
| Lifetime SKU eliminated entirely | A.3 cascade 2026-05-06 |
| Genre intelligence replaces removed Publisher feature | Q-6.13 + TASK-053 cross-bind |

Operator confirmed all questions on 2026-05-08.

## Pre-flight: re-read current state

- View `app/pricing/page.tsx` if present.
- Confirm `lib/stripe-prices.ts` (or wherever the 4 price IDs are exposed to the client) is in plan; never expose `STRIPE_SECRET_KEY` to client.
- Confirm `/pricing` in middleware public-routes whitelist.
- Confirm TASK-022 (Stripe Checkout API) has shipped — pricing page CTAs POST to `/api/stripe/checkout`.

## Files to Create/Modify

- `app/pricing/page.tsx` — server component shell with client-state child for toggle + checkout
- `components/pricing/PricingToggle.tsx` — monthly/annual toggle (client)
- `components/pricing/TierCard.tsx` — single tier card (client; receives current toggle state)

## Implementation Requirements

### Page structure

Hero:
- Heading: "Simple pricing. Built for indie authors."
- Subheading: "Three plans. Two billing cadences. No tricks."

Toggle:
- Monthly / Annual switch, brand-gold pill on brand-navyLight track
- Annual selected by default per Q-6.12
- "Save 10%" badge next to "Annual" label

Three cards in a grid (Explorer, Author, Publisher):

**Explorer (Free)**
- Heading: "Explorer"
- Subheading: "Free forever"
- Price: $0/mo (regardless of toggle)
- Feature bullets per Q-6.13:
  - 1 book
  - 25 AI calls/month
  - Basic agent access (steps 0–7)
  - Community support via /help
- CTA: "Start for free →" → `/signup` (or signup modal)

**Author (Recommended badge)**
- Heading: "Author"
- "RECOMMENDED" badge top-right, brand-gold pill
- Price: $29/mo (monthly) or $313.20/yr (annual; ~$26.10/mo equivalent)
- Feature bullets per Q-6.13:
  - Unlimited books
  - 500 AI calls/month
  - Full agent access (all 12 steps + Library)
  - Audio recording + playback
  - Export PDF/EPUB/DOCX
  - Priority email support
  - Priority queue (faster AI responses)
- CTA: "Start Chapter One →" → `/api/stripe/checkout` with appropriate price ID (per toggle state)

**Publisher**
- Heading: "Publisher"
- Subheading: "For prolific authors and small-press publishers"
- Price: $79/mo (monthly) or $853.20/yr (annual; ~$71.10/mo equivalent)
- Feature bullets per Q-6.13:
  - Everything in Author
  - 2,000 AI calls/month
  - Folder upload (entire manuscript drag-drop)
  - Advanced analytics
  - Genre intelligence
- CTA: "Start Chapter One →" → `/api/stripe/checkout` with appropriate price ID

### Tier card styling

- Card background: `bg-brand-navyLight rounded-lg p-8`
- Recommended card: `ring-2 ring-brand-gold relative` with badge positioned top-right
- Heading: Crimson Pro h2, brand-white
- Price: large numeric (48px) with "/mo" or "/yr" suffix in brand-textMuted
- Feature bullets: brand-gold checkmark icons; brand-white body text
- CTA: brand-gold filled button (Recommended) or brand-navy outlined (others)

### 14-day guarantee block (Q-6.15 default)

Below the three cards, full-width centered:
```
14-day money-back guarantee on all paid plans.
[Read refund policy →](/refunds)
```
Style: 16/24 brand-white/80 italic, brand-gold link. Cross-binds to R-TASK-119 refunds policy.

### Toggle state management

Client component with `useState<'monthly'|'annual'>('annual')`. Passes state to all three TierCard children. Card price + CTA price ID re-render on toggle change.

```typescript
const PRICE_IDS = {
  author_monthly: process.env.NEXT_PUBLIC_STRIPE_PRICE_AUTHOR_MONTHLY,
  author_annual: process.env.NEXT_PUBLIC_STRIPE_PRICE_AUTHOR_ANNUAL,
  publisher_monthly: process.env.NEXT_PUBLIC_STRIPE_PRICE_PUBLISHER_MONTHLY,
  publisher_annual: process.env.NEXT_PUBLIC_STRIPE_PRICE_PUBLISHER_ANNUAL,
} as const;
```

The 4 price IDs are exposed to the client via `NEXT_PUBLIC_*` env vars (the public Stripe price IDs are not secret — they're identifiers). Verify these are added to `.env.local.example` (TASK-003 expansion may need additive update; flag for B.5 packet rebuild).

### Checkout flow

CTA click → POST `/api/stripe/checkout` (TASK-022) with appropriate `priceId`. Redirects user to Stripe-hosted Checkout. Success URL contains `?upgraded=true&tier=...&interval=...` per TASK-022 Q-4.4.

If user is unauthenticated, the CTA opens `<SignupModal>` (TASK-046) instead, with `source="pricing_<tier>_<interval>"`. After signup completes, redirect to checkout flow with stored intent.

### Comparison table (optional, below cards)

For desktop lg+ viewports, render a feature-by-feature comparison table below the 3 cards. Rows = features; columns = tiers. Checkmarks for included; em-dash for not included; numeric for limits. Helps users who want to compare side-by-side. Skip on mobile (cards already convey the same info).

### SEO

- Page title: "Pricing — My Best Selling Novel"
- Meta description: "Simple pricing: free Explorer tier with 1 book + 25 AI calls, or upgrade to Author ($29/mo) for unlimited books. 14-day money-back guarantee."
- OG image: pricing-themed brand OG
- Schema.org `Product` with `Offer` per tier (price, currency, availability)

### Analytics (Q-9.2 cross-bind)

- `page_view` on load
- `pricing_toggle_change` on toggle (monthly ↔ annual)
- `signup_modal_opened` with `source: 'pricing_author_annual'` etc. on CTA click (unauth path)
- `subscription_purchase_initiated` with tier + interval on CTA click (auth path; conversion event when webhook fires)

### Mobile

- Cards stack vertically; full-width on sm
- Toggle remains at top, sticky if scroll-distance to first card is significant
- Recommended card retains gold ring; positioned middle of stack

## What this task does NOT do

- Does NOT process payments — TASK-022 Checkout handles
- Does NOT handle subscription management — TASK-023 Customer Portal handles
- Does NOT include lifetime-tier card — eliminated A.3
- Does NOT include team-seats card — R-TASK-101 Path A; deferred to v2

## Tests Required

- AT-179 (renumbered from original): `/pricing` returns 200 OK without authentication
- AT-180: Annual toggle is default-selected on initial render
- AT-181: Toggling monthly ↔ annual updates all 3 card prices and price IDs without page reload
- AT-182: Author card has "Recommended" badge; others do not
- AT-183: 14-day guarantee block renders below cards with link to `/refunds`
- AT-184: Authenticated user clicking Author Annual CTA → POST `/api/stripe/checkout` with `STRIPE_PRICE_AUTHOR_ANNUAL`
- AT-185: Unauthenticated user clicking same CTA → opens `<SignupModal>` with `source="pricing_author_annual"`
- AT-186: Mechanical: zero occurrences of "lifetime" or "Lifetime" in the page (post-A.3)
- AT-187: Mobile renders single-column with sticky toggle

## Session Notes
_(Filled by Claude Code during implementation)_
