<!-- APPLY: REPLACE -->
<!-- Target: docs/TASKS/TASK-003-env-config.md (in original mybsn package) -->
<!-- Backup: docs/PATCHES-TO-ORIGINAL/backups/TASK-003-env-config.pre-modification-backup.md -->

# TASK-003: Environment Configuration

## Status: NOT STARTED
## Priority: CRITICAL
## Phase: 1
## Estimated Sessions: 1
## Dependencies: TASK-001
## Requirements Covered: R3
## Spec Reference: Section 1.3

## Pre-flight: re-read current state

Before making any change, view the current `.env.local.example` and confirm whether
any of the lifetime-related env vars (`NEXT_PUBLIC_LIFETIME_ENABLED`, `STRIPE_PRICE_AUTHOR_LIFETIME`,
`STRIPE_PRICE_PUBLISHER_LIFETIME`) have already been removed. If they are already removed,
mark this task as superseded and stop. If only some are removed, scope this task to the
remaining work.

## Files to Create/Modify
`.env.local.example`

## Implementation Requirements

Document **16 environment variables** required (revised 2026-05-06 from 19 — three lifetime-related
env vars removed when lifetime tier was eliminated per Decision #29 revision):

```
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# Stripe
STRIPE_SECRET_KEY=
STRIPE_PUBLISHABLE_KEY=
STRIPE_WEBHOOK_SECRET=
STRIPE_PRICE_AUTHOR_MONTHLY=
STRIPE_PRICE_AUTHOR_ANNUAL=
STRIPE_PRICE_PUBLISHER_MONTHLY=
STRIPE_PRICE_PUBLISHER_ANNUAL=

# Anthropic
ANTHROPIC_API_KEY=

# Resend
RESEND_API_KEY=

# Site
NEXT_PUBLIC_SITE_URL=
NEXT_PUBLIC_GA_MEASUREMENT_ID=

# Sentry (per R-TASK-106)
SENTRY_DSN=
NEXT_PUBLIC_SENTRY_DSN=
```

**Removed 2026-05-06 (do NOT add to env file):**
- `NEXT_PUBLIC_LIFETIME_ENABLED` — feature flag for lifetime tier; tier no longer exists
- `STRIPE_PRICE_AUTHOR_LIFETIME` — Stripe price ID for lifetime Author SKU; SKU no longer exists
- `STRIPE_PRICE_PUBLISHER_LIFETIME` — Stripe price ID for lifetime Publisher SKU; SKU no longer exists

## Tests Required
AT-008: All 16 env vars present in `.env.local.example`. AT-009: No lifetime-related
env vars present (mechanical grep for "LIFETIME" should return zero matches).

## Session Notes
_(Filled by Claude Code during implementation)_
