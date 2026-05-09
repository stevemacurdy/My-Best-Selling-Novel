<!-- APPLY: REPLACE -->
<!-- Target: docs/TASKS/TASK-026-billing-integration.md (in original mybsn package) -->

# TASK-026: Billing Integration UI

## Status: NOT STARTED
## Priority: HIGH
## Phase: 4
## Estimated Sessions: 1
## Dependencies: TASK-022, TASK-023
## Requirements Covered: R7
## Spec Reference: Section 4.6

## Pre-flight: re-read current state

If `components/UpgradeButton.tsx` already exists, view it. Confirm whether lifetime
purchase UI is present. Scope this task to removing it if present.

## Files to Create/Modify
`components/UpgradeButton.tsx`, `app/account/billing/page.tsx`

## Implementation Requirements

`UpgradeButton` component takes `tier` ('author'|'publisher') and `cycle`
('monthly'|'annual') props. Renders the price + CTA. On click, POST to
`/api/stripe/checkout` with the corresponding price ID; redirect to returned URL.

**Removed 2026-05-06:** lifetime purchase buttons + cycle prop value `'lifetime'`.
The `cycle` prop accepts only `'monthly'` or `'annual'`. Lifetime tier eliminated;
billing page does not show lifetime CTAs.

`/account/billing/page.tsx` shows current subscription status, renewal date,
upgrade/downgrade buttons, and "Manage in Stripe Portal" link. The "Lifetime: never
expires" status row is removed; only `active`, `past_due`, `cancelled`, `free` statuses
are rendered.

## Tests Required
AT-054: UpgradeButton renders with monthly + annual variants for both tiers (4 total).
AT-055: Clicking button POSTs to /api/stripe/checkout with correct price ID. AT-056:
Billing page does not contain string "lifetime" anywhere.

## Session Notes
_(Filled by Claude Code during implementation)_
