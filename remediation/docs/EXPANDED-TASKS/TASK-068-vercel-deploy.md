<!-- APPLY: REPLACE -->
<!-- Target: docs/TASKS/TASK-068-vercel-deploy.md (in original mybsn package) -->
<!-- Backup: docs/EXPANDED-TASKS/backups/TASK-068-vercel-deploy.pre-expansion-backup.md -->
<!-- Expanded 2026-05-08 from 99 words to ~890 words via PATCH-3 sub-deliverable B.3.
     Per directive guidance, deploy tasks examined critically — TASK-068 expanded to add the explicit smoke-test runbook missing from R-TASK-141 wider checklist. -->

# TASK-068: Production Deployment (`docs/DEPLOY.md`)

## Status: NOT STARTED
## Priority: CRITICAL
## Phase: 10
## Estimated Sessions: 1
## Dependencies: All prior tasks
## Requirements Covered: R34
## Spec Reference: Section 10.6

## Inference Summary

| Addition | Source |
|---|---|
| Single Vercel project with branch-based environments | Q-10.22 operator-answer (use default) |
| Vercel dashboard for prod env vars; CLI for staging | Q-10.23 operator-answer (use default); R-TASK-115 |
| Cloudflare DNS + Vercel SSL | Q-10.24 operator-answer (use default) |
| 9-step post-deploy smoke test | Q-10.25 operator-answer (use default); PATCH-003 health endpoint |
| Cross-binding to R-TASK-141 (full pre-launch checklist) | BUILD_STRATEGY_ADDENDUM Phase 12 |

Operator confirmed all questions on 2026-05-08.

## Pre-flight: re-read current state

- View `docs/DEPLOY.md` if present.
- Confirm Vercel account exists and is linked to the GitHub repo.
- Confirm domain `mybestsellingnovel.com` registered (operator's responsibility).
- Confirm Cloudflare account configured (operator's responsibility — free tier covers v1 scale).
- Confirm R-TASK-115 (Key Rotation Procedure) and R-TASK-141 (Pre-launch Checklist) are scheduled for Phase 12 — TASK-068 references both.
- Confirm PATCH-003 (`/api/health` endpoint) shipped — smoke test uses it.

## Files to Create/Modify

- `docs/DEPLOY.md` (NEW)

## Implementation Requirements

The doc is a procedural runbook. Operator follows from top to bottom on first deploy; subsequent deploys mostly skip Sections 1-3 and run Sections 4-5 (smoke test + announce).

### Section 1 — Vercel project setup

Create one Vercel project linked to the GitHub repo (`stevemacurdy/ai-agent-platform` or whatever the mybsn repo path is at deploy time). Vercel auto-creates:

- **Production deployments** from `main` branch
- **Preview deployments** from feature branches and pull requests
- **Staging deployment** from a long-lived `staging` branch (custom subdomain `staging.mybestsellingnovel.com` per Q-10.22)

Per Q-10.22 default, **single Vercel project** — separate projects would force duplicate env vars and config. Branch-based environments share secrets via Vercel's "Production / Preview / Development" env-var scoping.

```
Vercel Dashboard > Project Settings > Git
  - Production Branch: main
  - Deploy Preview: enabled for all branches
  - Comment on Pull Requests: enabled
```

### Section 2 — Environment variables (production)

Per Q-10.23 default, set production env vars **via Vercel Dashboard**, never committed to repo.

```
Vercel Dashboard > Project Settings > Environment Variables
```

Set all 17 vars from `.env.local.example` (TASK-003 expansion):

| Variable | Production value | Preview value | Notes |
|---|---|---|---|
| NEXT_PUBLIC_SITE_URL | https://mybestsellingnovel.com | (auto-set by Vercel preview deploy) | |
| NEXT_PUBLIC_GA_MEASUREMENT_ID | G-XXX (live GA4 stream) | G-YYY (separate test stream) | |
| Supabase URL/anon/service_role | Production project | Staging project (per R-TASK-122) | Separate Supabase projects |
| Stripe keys | sk_live_*, pk_live_*, whsec_live_* | sk_test_*, pk_test_*, whsec_test_* | LIVE for production only |
| 4 Stripe price IDs | LIVE-mode price IDs | TEST-mode price IDs | Created in TASK-020 |
| ANTHROPIC_API_KEY | Same key | Same key | Anthropic doesn't separate test/prod |
| RESEND_API_KEY | Same key | Test inbox redirect (R-TASK-122) | |
| RESEND_FROM_EMAIL | noreply@mybestsellingnovel.com | noreply@staging.mybestsellingnovel.com | |
| SENTRY_DSN, NEXT_PUBLIC_SENTRY_DSN | Production Sentry project | Staging Sentry project (or same with environment tag) | |

For staging branch deployments, use Vercel CLI:
```bash
vercel env add STRIPE_SECRET_KEY preview staging
# (paste value when prompted)
```

R-TASK-115 (Key Rotation Procedure) governs how/when to rotate; this doc references it.

### Section 3 — Custom domain DNS

Per Q-10.24 default, **Cloudflare for DNS + Vercel for SSL**.

1. Cloudflare Dashboard > Add site `mybestsellingnovel.com`
2. Update domain registrar's nameservers to Cloudflare's
3. Wait 24h for propagation (or until Cloudflare confirms active)
4. Cloudflare Dashboard > DNS > Add records:
   - `A @ → 76.76.21.21` (Vercel anycast IP)
   - `CNAME www → cname.vercel-dns.com` (Vercel managed)
   - `CNAME staging → cname.vercel-dns.com` (for staging branch domain)
5. Vercel Dashboard > Project > Domains > Add `mybestsellingnovel.com` and `www.mybestsellingnovel.com`
6. Vercel auto-provisions SSL certificate via Let's Encrypt; auto-renews
7. Cloudflare > SSL/TLS > set to "Full (strict)" — Cloudflare→Vercel encryption verifies Vercel's cert
8. Cloudflare > SSL/TLS > Always Use HTTPS: on
9. Cloudflare > Security > Bot Fight Mode: on (free tier)

### Section 4 — Deploy

```bash
git checkout main
git pull
git push  # triggers Vercel build
# OR via Vercel CLI:
vercel --prod
```

Vercel build runs:
1. `npm install` (uses lockfile)
2. `npm run build` — must pass with zero warnings
3. `npm run lint:contrast` (R-TASK-109) — CI gate
4. `npm run type-check` (TASK-001 expansion script)
5. Deploy to production

If any CI gate fails, deploy aborts. Operator fixes, re-pushes.

### Section 5 — Post-deploy smoke test (9 steps)

Per Q-10.25 default, sequential checks immediately after deploy. R-TASK-141 covers the broader pre-launch checklist; this section is the **immediate post-deploy** subset.

1. **Site loads:** `curl -sI https://mybestsellingnovel.com` → 200 OK with valid TLS cert
2. **Health endpoint:** `curl https://mybestsellingnovel.com/api/health` → `{"status":"ok"}` (per PATCH-003)
3. **Signup works:** create an account with operator's test email; receive welcome email within 60s
4. **Book creation works:** sign in, create book, verify in Supabase Dashboard
5. **AI call works:** trigger any agent step that calls AI; response within 30s
6. **Stripe Checkout opens:** click pricing → Stripe-hosted page loads
7. **Webhook fires:** subscribe with test card → verify webhook event in Stripe Dashboard → verify `subscriptions` row in DB
8. **GA4 records page_view:** open `/`, then check Google Analytics Real-Time view → operator's session visible
9. **Sentry captures test error:** trigger a known error (e.g., visit `/api/test-error` if dev exposed it; otherwise wait for organic error) → Sentry receives within 60s

If any step fails, halt — do NOT announce publicly. Investigate, fix, redeploy, retry smoke test from step 1.

### Section 6 — Announce

Only after R-TASK-141 full pre-launch checklist passes AND Section 5 above all green:

- Announce on operator's chosen channels (newsletter, social, etc.)
- Tag deploy with version: `git tag v1.0.0 && git push --tags`
- Save deploy timestamp to operator's records

### What this task does NOT do

- Does NOT cover the broader pre-launch checklist (R-TASK-141 owns)
- Does NOT cover Cloudflare DDoS configuration beyond Bot Fight Mode (defer to scale gate)
- Does NOT cover incident response procedures (R-TASK-141 + R-TASK-128 alerting)

## Tests Required (meta)

- AT-119: `docs/DEPLOY.md` exists with all 6 sections
- AT-120: Section 2 enumerates all 17 production env vars per TASK-003 expansion
- AT-121: Section 5 has all 9 smoke-test steps in correct order
- AT-122: Cross-binding references to R-TASK-115 + R-TASK-141 + PATCH-003 present

## Session Notes
_(Filled by Claude Code during implementation)_
