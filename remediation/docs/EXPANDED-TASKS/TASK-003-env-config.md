<!-- APPLY: REPLACE -->
<!-- Target: docs/TASKS/TASK-003-env-config.md (in original mybsn package) -->
<!-- Backup: docs/EXPANDED-TASKS/backups/TASK-003-env-config.pre-expansion-backup.md -->
<!-- Expanded 2026-05-08 from 87 words to ~830 words via PATCH-3 sub-deliverable B.3.
     Supersedes the A.3 patch at docs/PATCHES-TO-ORIGINAL/TASK-003-env-config.md by folding the lifetime-elimination semantics into the expansion. -->

# TASK-003: Environment Configuration

## Status: NOT STARTED
## Priority: CRITICAL
## Phase: 1
## Estimated Sessions: 1
## Dependencies: TASK-001
## Requirements Covered: R3, R25
## Spec Reference: Section 1.3

## Inference Summary

This expanded task replaces the original 87-word TASK-003. Each addition is sourced as follows:

| Addition | Source |
|---|---|
| 17-var canonical list | Q-1.1 operator-answer (use default; 16 base vars) + Q-1.11 operator-answer (use default; +RESEND_FROM_EMAIL = 17 total) |
| Sentry vars (`SENTRY_DSN`, `NEXT_PUBLIC_SENTRY_DSN`) included from Phase 1 | Q-1.2 operator-answer (use default — include from Phase 1, not deferred to R-TASK-106) |
| "Where to retrieve" inline comments only | Q-1.3 operator-answer (use default) |
| Filename `.env.local.example` | Q-1.4 operator-answer (use default) |
| 4 Stripe price IDs (no lifetime variants) | A.3 cascade 2026-05-06 (Decision #29 revision; lifetime tier eliminated) |
| Removed vars documented (lifetime trio + ADMIN_EMAILS) | A.3 cascade + audit-trail discipline |

Operator confirmed all questions on 2026-05-08. No `[INFERRED-BY-CLAUDE]` content remains.

> **Note on env-var count drift:** The A.3 cascade narrative referenced "16 env vars (was 19, now 16)." With Q-1.11's default keeping `RESEND_FROM_EMAIL` as an env var, the final count is 17. REMEDIATION_OVERVIEW.md changelog entry will be updated in B.5 packet rebuild to read "17 env vars (was 19, now 17 — 3 lifetime vars removed; ADMIN_EMAILS legacy var removed; SENTRY_DSN + NEXT_PUBLIC_SENTRY_DSN added per R-TASK-106)."

## Pre-flight: re-read current state

- View the current `.env.local.example` if it exists. If it contains any of `STRIPE_PRICE_AUTHOR_LIFETIME`, `STRIPE_PRICE_PUBLISHER_LIFETIME`, `NEXT_PUBLIC_LIFETIME_ENABLED`, or `ADMIN_EMAILS`, those are stale (pre-A.3 / pre-RBAC) and must be removed.
- View `.gitignore` and confirm `.env.local`, `.env*.local` are listed (created in TASK-001) so the actual values never get committed.
- If both `.env.local.example` (template, committed) and `.env.local` (actual, gitignored) exist, scope this task to only `.env.local.example`. Do not touch `.env.local`.
- Verify TASK-001 has shipped (project initialized) — this task depends on having a Next.js project to drop the file into.

## Files to Create/Modify

- `.env.local.example` (project root)

## Implementation Requirements

Create `.env.local.example` listing all 17 environment variables required by the v1 application. Group by category for scanability. Each variable gets a `# Where to retrieve` comment per Q-1.3 default — comments document where the operator goes to obtain the value, not what the variable does (the latter belongs in CLAUDE.md and inline code documentation).

```bash
# .env.local.example
#
# Copy this file to .env.local for local development.
# In production (Vercel), set these in Project Settings > Environment Variables.
# Never commit .env.local — it is in .gitignore.
#
# Total: 17 environment variables (revised 2026-05-06 from original 19;
# 3 lifetime variables and ADMIN_EMAILS removed; SENTRY_DSN + NEXT_PUBLIC_SENTRY_DSN
# added per R-TASK-106).

# ─── Site ──────────────────────────────────────────────────────────────────
# Where to retrieve: your deployed site URL (Vercel domain or custom domain)
NEXT_PUBLIC_SITE_URL=https://mybestsellingnovel.com

# Where to retrieve: GA4 Admin > Data Streams > Web Stream Details > Measurement ID
NEXT_PUBLIC_GA_MEASUREMENT_ID=G-XXXXXXXXXX

# ─── Supabase ──────────────────────────────────────────────────────────────
# Where to retrieve: Supabase Dashboard > Project Settings > API > Project URL
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co

# Where to retrieve: Supabase Dashboard > Project Settings > API > anon public
NEXT_PUBLIC_SUPABASE_ANON_KEY=

# Where to retrieve: Supabase Dashboard > Project Settings > API > service_role secret
# WARNING: server-side only; NEVER expose to client. Used by Stripe webhook handler only.
SUPABASE_SERVICE_ROLE_KEY=

# ─── Stripe (4 price IDs — lifetime variants removed 2026-05-06 per Decision #29) ─
# Where to retrieve: Stripe Dashboard > Developers > API keys
STRIPE_SECRET_KEY=sk_test_or_sk_live_...
STRIPE_PUBLISHABLE_KEY=pk_test_or_pk_live_...

# Where to retrieve: Stripe Dashboard > Developers > Webhooks > [your endpoint] > Signing secret
STRIPE_WEBHOOK_SECRET=whsec_...

# Where to retrieve: Stripe Dashboard > Products > [Author Plan] > Pricing
STRIPE_PRICE_AUTHOR_MONTHLY=price_...
STRIPE_PRICE_AUTHOR_ANNUAL=price_...

# Where to retrieve: Stripe Dashboard > Products > [Publisher Plan] > Pricing
STRIPE_PRICE_PUBLISHER_MONTHLY=price_...
STRIPE_PRICE_PUBLISHER_ANNUAL=price_...

# ─── Anthropic ─────────────────────────────────────────────────────────────
# Where to retrieve: console.anthropic.com > Settings > API Keys
ANTHROPIC_API_KEY=sk-ant-...

# ─── Resend ────────────────────────────────────────────────────────────────
# Where to retrieve: resend.com > API Keys
RESEND_API_KEY=re_...

# Where to retrieve: literal value; matches Decision #28 brand domain
RESEND_FROM_EMAIL=noreply@mybestsellingnovel.com

# ─── Sentry (per R-TASK-106; values empty until R-TASK-106 ships) ──────────
# Where to retrieve: sentry.io > Settings > Projects > [your project] > Client Keys (DSN)
# Same DSN value goes in both vars; the NEXT_PUBLIC_ variant is exposed to the client SDK.
SENTRY_DSN=https://...@sentry.io/...
NEXT_PUBLIC_SENTRY_DSN=https://...@sentry.io/...
```

## What is intentionally NOT here

The following variables existed in the original TASK-003 spec but are removed:

- `STRIPE_PRICE_AUTHOR_LIFETIME` — removed 2026-05-06 (A.3; lifetime tier eliminated)
- `STRIPE_PRICE_PUBLISHER_LIFETIME` — removed 2026-05-06 (A.3)
- `NEXT_PUBLIC_LIFETIME_ENABLED` — removed 2026-05-06 (A.3; ADR-004 voided, no flag needed)
- `ADMIN_EMAILS` — removed 2026-05-06 (legacy admin-by-email-allowlist pattern; replaced by `profiles.role` per Decision #31 + R-TASK-113)

If a future v2 SKU uses one-time payments again, add the relevant `STRIPE_PRICE_*` var at that time. Migration 011's UNIQUE constraint on `subscriptions.stripe_session_id` is preserved as defense-in-depth for that future case.

## Tests Required

- AT-005: `.env.local.example` exists at project root with all 17 variables present
- AT-006: Mechanical: no occurrences of `LIFETIME` or `ADMIN_EMAILS` in the file (`grep -E "LIFETIME|ADMIN_EMAILS" .env.local.example` returns zero matches)
- AT-007: Each variable has a "Where to retrieve" comment immediately preceding it
- AT-008: File is ASCII-only; no Unicode quote characters that break shell parsing

## Session Notes
_(Filled by Claude Code during implementation)_
