<!-- APPLY: REPLACE -->
<!-- Target: docs/TASKS/TASK-045-pricing-page.md (in original mybsn package) -->

# TASK-045: Pricing Page

## Status: NOT STARTED
## Priority: HIGH
## Phase: 6
## Estimated Sessions: 1
## Dependencies: TASK-002, TASK-026
## Requirements Covered: R7
## Spec Reference: Section 6.3

## Pre-flight: re-read current state

If `app/pricing/page.tsx` already exists, view it. Confirm: (a) team-seats language
is removed (per R-TASK-101 Path A), (b) lifetime CTAs are removed (per Decision #29
revision 2026-05-06). Scope this task to whatever cleanup remains.

## Files to Create/Modify
`app/pricing/page.tsx`

## Implementation Requirements

Public pricing page displaying Explorer (Free) / Author / Publisher tiers with
**monthly/annual toggle** (was monthly/annual/lifetime; lifetime removed 2026-05-06).

**Tier feature lists:**
- Explorer: 1 book, 25 AI calls/mo, no exports, no audio
- Author: unlimited books, 500 AI calls/mo, all features (was originally listed
  as having team seats — removed per R-TASK-101 Path A 2026-05-05)
- Publisher: unlimited books, 2,000 AI calls/mo, folder upload (team seats removed
  per R-TASK-101 Path A 2026-05-05)

Annual prices show "10% off" badge. Toggle defaults to "monthly" view; user can
switch to "annual."

**Removed 2026-05-06:** lifetime toggle option, lifetime price display ($567.89 /
$3,456.78), "Pay once, access forever" copy. Pricing page does not reference lifetime
in any form. The `NEXT_PUBLIC_LIFETIME_ENABLED` flag check (originally added per
ADR-004) is removed entirely — no flag to check.

CTA buttons route to /signup if logged out, or POST to /api/stripe/checkout if logged
in.

## Tests Required
AT-070: Pricing page renders 3 tier cards with monthly/annual toggle. AT-071: No
"lifetime" string anywhere in page. AT-072: No "team seats" string anywhere in page
(per R-TASK-101). AT-073: Toggle switches between monthly + annual prices correctly.

## Session Notes
_(Filled by Claude Code during implementation)_
