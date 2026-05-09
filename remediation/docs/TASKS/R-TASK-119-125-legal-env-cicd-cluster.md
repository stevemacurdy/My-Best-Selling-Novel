<!-- APPLY: CREATE -->
# R-TASK-119 through R-TASK-125: Legal, Environment & CI/CD Cluster

This file batches 7 related HIGH-priority tasks.

## Pre-flight: re-read current state

Before making any change, read the current state of every file listed in "Files to Modify" below. Verify the gap(s) addressed by this task are still present in the current code. Specifically:

- For each file in "Files to Modify": view the file and confirm the condition the audit observed (e.g., "no rate limiting on /api/ai") still applies.
- For each gap in "Resolves Gaps": confirm the gap remains open. The audit was conducted on 2026-05-04; if the codebase changed since, the gap may have been partially or fully addressed.
- If a gap is no longer present, report this finding in PROGRESS.md, mark this task as superseded, and stop. Do not make changes.
- If a gap is partially addressed, scope this task to the remaining work and document in this file's Session Notes what was already addressed and skipped.
- If the gap is still fully present as the audit described, proceed with the rest of this task.

This pre-flight catches the case where the codebase changed between audit and remediation — exactly the failure mode that produces silent overwrites of unrelated work.

**Cluster files only:** Each sub-task in this cluster MUST run its own pre-flight against the files it touches before that sub-task begins. Do not batch the pre-flights.

---

## R-TASK-119: Legal Compliance Manifest Expansion

**Status:** NOT STARTED · **Phase:** 11 · **Sessions:** 2 · **Resolves:** GAP-037
**Dependencies:** TASK-057

### Files to Create
- `app/aup/page.tsx` — Acceptable Use Policy
- `app/refunds/page.tsx` — Refund Policy (with explicit lifetime tier language)
- `app/cookies/page.tsx` — Cookie Policy (lists every cookie set; pairs with R-TASK-134 consent banner)
- `app/dmca/page.tsx` — DMCA Takedown Policy
- `app/ai-disclosure/page.tsx` — AI/ML Content Disclosure
- `app/security/page.tsx` — Vulnerability Disclosure / responsible disclosure contact (security@mybestsellingnovel.com)
- `app/accessibility-statement/page.tsx` — Accessibility Statement (per R-TASK-110 baseline + agent gap acknowledgment)

### Files to Modify
- `app/page.tsx` (TASK-043) — footer: link to all 7 new pages alongside Terms/Privacy
- `app/(auth)/signup/page.tsx` (TASK-008) — checkbox "I agree to Terms, Privacy, and AUP" (recorded by R-TASK-120)
- `emails/welcome.tsx` (TASK-054) — link to AUP

### Each policy's required content (skeleton — full text drafted with legal counsel before launch)

**AUP** must list banned content categories:
- Sexual content involving minors (CSAM and CSAM-adjacent)
- Defamatory content targeting identifiable people
- Mass copyright infringement (not protected by AUP from "fair use" claims, but blocks scaled scraping)
- Content directing actual violence
- Content used to harass identified individuals
- Operating the service in ways that bypass tier limits or abuse the AI proxy
- Reselling AI generations as a service to third parties

**Refund Policy** for lifetime tier (the key liability):
- 14-day full refund window from purchase
- After 14 days: no refund except in cases of product unavailability >30 days
- "Lifetime of product" defined as: minimum 5 years from purchase date OR until product shutdown announcement (whichever is later)
- Product shutdown commitment: 90 days written notice + opportunity for full data export
- Pro-rated refund of remaining lifetime value if shutdown occurs before 5-year minimum

**AI/ML Disclosure** (Anthropic-mandated language):
- Your prompts and AI outputs are processed by Anthropic's API
- We do NOT use your manuscript content to train AI models
- Anthropic's standard tier API does not train on customer data
- AI-generated content is not copyrighted by us; you retain copyright in your manuscript
- AI may produce inaccurate information; review all output before use

### Tests Required
- AT-119-1: All 7 new policy pages render
- AT-119-2: Footer links present on every public page
- AT-119-3: Signup form requires explicit acceptance checkbox

<!-- ADR-004 cross-binding paragraph removed 2026-05-06: ADR-004 voided when lifetime tier was eliminated. This task still ships for the non-lifetime reasons originally documented above. -->
---

## R-TASK-120: TOS/Privacy Acceptance Recording + Re-Acceptance Flow

**Status:** NOT STARTED · **Phase:** 11 · **Sessions:** 1.5 · **Resolves:** GAP-039, GAP-040
**Dependencies:** TASK-008, R-TASK-119

### Files to Create
- `supabase/migrations/014_document_acceptances.sql`
- `lib/acceptance.ts` — record + check helpers
- `app/api/account/accept-terms/route.ts` — POST: record current acceptance
- `components/AcceptanceWall.tsx` — full-screen modal blocking app access until acceptance recorded for current versions

### SQL — `014_document_acceptances.sql`

```sql
CREATE TABLE document_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document TEXT NOT NULL CHECK (document IN ('tos', 'privacy', 'aup', 'cookies')),
  version TEXT NOT NULL,
  effective_at TIMESTAMPTZ NOT NULL,
  superseded_at TIMESTAMPTZ,
  content_url TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(document, version)
);

CREATE TABLE document_acceptances (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  document_version_id UUID NOT NULL REFERENCES document_versions(id),
  accepted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ip_address INET,
  user_agent TEXT
);

CREATE INDEX idx_doc_accept_user ON document_acceptances(user_id);
CREATE INDEX idx_doc_accept_version ON document_acceptances(document_version_id);

ALTER TABLE document_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_acceptances ENABLE ROW LEVEL SECURITY;
CREATE POLICY "All read versions" ON document_versions FOR SELECT USING (true);
CREATE POLICY "Users see own acceptances" ON document_acceptances
  FOR SELECT USING (auth.uid() = user_id);
```

### Initial seed (SQL run after migration)

```sql
INSERT INTO document_versions (document, version, effective_at, content_url) VALUES
  ('tos', '2026-05-04', NOW(), '/terms/v/2026-05-04'),
  ('privacy', '2026-05-04', NOW(), '/privacy/v/2026-05-04'),
  ('aup', '2026-05-04', NOW(), '/aup/v/2026-05-04'),
  ('cookies', '2026-05-04', NOW(), '/cookies/v/2026-05-04');
```

### Re-acceptance flow

`AcceptanceWall.tsx` runs on every authenticated page load. It checks:
1. For each `document` (tos, privacy, aup, cookies) → find the current effective version
2. For each, check whether the user has accepted that version's id
3. If any are missing, show modal with summary + "I accept" button per document
4. Block app interaction (overlay + dimmer) until all are accepted

Each acceptance triggers POST `/api/account/accept-terms` which inserts into `document_acceptances`.

### Tests Required
- AT-120-1: New signup creates 4 document_acceptance rows automatically
- AT-120-2: Inserting new TOS version triggers acceptance wall on next user load
- AT-120-3: After acceptance wall completes, user sees app normally
- AT-120-4: User cannot use API endpoints if acceptance wall is unsatisfied (server-side check)
- AT-120-5: ip_address + user_agent recorded on every acceptance

<!-- ADR-004 cross-binding paragraph removed 2026-05-06: ADR-004 voided when lifetime tier was eliminated. This task still ships for the non-lifetime reasons originally documented above. -->
---

## R-TASK-121: Subprocessor Change Notification Flow

**Status:** NOT STARTED · **Phase:** 12 · **Sessions:** 0.5 · **Resolves:** GAP-045
**Dependencies:** R-TASK-105

### Files to Create
- `docs/legal/SUBPROCESSOR_LIST.md` — single source of truth, updated when vendors change
- `emails/subprocessor-notice.tsx` — email template for change notifications
- `scripts/notify-subprocessor-change.ts` — operator runs when changing subprocessor; sends email to all customers

### Files to Modify
- `app/privacy/page.tsx` — embed `SUBPROCESSOR_LIST.md` content (or link)

### Procedure
- Subprocessor change is a 30-day-notice event
- Operator updates `SUBPROCESSOR_LIST.md` with new entry + effective date 30 days out
- Operator runs `npm run notify:subprocessor-change -- --change "Adding XYZ Inc. as data analytics subprocessor effective 2026-06-15"`
- Script sends email to all profiles.email values using Resend bulk send
- Records notification in `audit_event_log` action='subprocessor.notification.sent'

### Tests Required
- AT-121-1: Script sends notification email to test user; arrives within 1 minute
- AT-121-2: Audit log entry created
- AT-121-3: SUBPROCESSOR_LIST.md content matches Privacy Policy embed

---

## R-TASK-122: Staging Environment

**Status:** NOT STARTED · **Phase:** 11 · **Sessions:** 1 · **Resolves:** GAP-047
**Dependencies:** R-TASK-105 (DPAs with Supabase needed for second project)

### Provisioning steps (manual operator + Claude Code)

1. **Supabase Staging Project**
   - Create new Supabase project: `mybestsellingnovel-staging`
   - Same region as prod (us-east-1)
   - Pro plan ($25/mo additional)
   - Run all migrations in order
   - Seed with synthetic test data (no real user data ever)

2. **Vercel Branch Deploys**
   - Configure `staging` branch in GitHub
   - Vercel: production branch = `main`, preview branches include `staging`
   - Custom domain: `staging.mybestsellingnovel.com` mapped to staging branch deployments
   - Staging env vars: separate Stripe test-mode keys, separate Supabase URLs/keys, separate Anthropic API key (or test workspace), separate Sentry project

3. **Stripe Test Mode**
   - Use Stripe Dashboard → Test Mode (toggle in top-right)
   - Create 6 test-mode price IDs matching production (different IDs)
   - Webhook endpoint: `https://staging.mybestsellingnovel.com/api/stripe/webhook`
   - Test webhook secret different from prod

4. **Resend Sandbox**
   - Resend has test mode that prevents emails from actually being delivered
   - Configure staging RESEND_API_KEY to test-mode key
   - Or: configure staging to send only to `@woulfgroup.com` addresses

### Files to Create
- `docs/architecture/STAGING_ENVIRONMENT.md` — how to use staging, what's different from prod
- `.env.staging.example` — template for staging env vars

### Promotion procedure (paired with R-TASK-125)
- Push to `staging` branch → auto-deploy to staging
- Test in staging
- PR `staging` → `main` → merge → auto-deploy to prod

### Tests Required
- AT-122-1: staging.mybestsellingnovel.com loads
- AT-122-2: Test card 4242 in staging completes a checkout; subscription appears in staging Supabase
- AT-122-3: Migration applied to staging first, then prod (manual procedure verified)

---

## R-TASK-123: DR Plan + RTO/RPO Documentation + Drill

**Status:** NOT STARTED · **Phase:** 12 · **Sessions:** 1 + drill · **Resolves:** GAP-048, GAP-028
**Dependencies:** R-TASK-116

### Files to Create
- `docs/runbooks/disaster-recovery.md` — DR plan with RTO/RPO commitments
- `docs/runbooks/dr-drills/` — drill log directory

### Recovery objectives

| Scenario | RTO (recovery time) | RPO (data loss) |
|---|---|---|
| Vercel function platform down | < 1 hour (no data loss; serverless restores when Vercel recovers) | 0 |
| Supabase region down (us-east-1) | < 4 hours (using offshore backup R-TASK-116) | < 24 hours (last nightly backup) |
| Anthropic API down | full degraded mode (agent reads/writes work; AI features paused) | 0 |
| Stripe down | new signups blocked; existing users unaffected | 0 (Stripe retries webhooks for 3 days) |
| All-systems regional outage (AWS us-east-1) | < 8 hours (manual restore to alternate region) | < 24 hours |

### DR drill procedure (run quarterly)

1. **Drill 1: Simulated Supabase outage**
   - Pick a maintenance window
   - Restore last R2 backup to fresh Supabase project (different name)
   - Update env vars on Vercel preview environment to point to restored project
   - Verify app loads, sample books readable
   - Document time-to-recover in `docs/runbooks/dr-drills/YYYY-Q-N.md`
   - Discard restored project; switch env vars back

2. **Drill 2: Webhook idempotency under retry storm**
   - Use Stripe CLI to replay 100 webhook events to staging
   - Verify subscriptions table has correct count (no duplicates due to PATCH-002)

### Tests Required
- AT-123-1: docs/runbooks/disaster-recovery.md exists with RTO/RPO table
- AT-123-2: First DR drill completed; recovery time within RTO
- AT-123-3: Drill log committed to repo

---

## R-TASK-124: GitHub Actions CI Pipeline + Security Scans

**Status:** NOT STARTED · **Phase:** 11 · **Sessions:** 1 · **Resolves:** GAP-050, GAP-051
**Dependencies:** TASK-001

### Files to Create
- `.github/workflows/ci.yml` — main CI: typecheck + lint + test + build
- `.github/workflows/security.yml` — secret scan (Gitleaks) + dependency audit
- `.github/workflows/contrast.yml` (or merge into ci.yml) — contrast lint per R-TASK-109
- `.github/dependabot.yml` — weekly dependency updates
- `.gitleaks.toml` — Gitleaks config

### Files to Modify
- `package.json` — add scripts: `test`, `test:ci`, `lint:contrast`, `lint:all` (aggregates)

### `ci.yml` structure

```yaml
name: CI
on:
  pull_request:
  push:
    branches: [main, staging]

jobs:
  typecheck:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: '20', cache: 'npm' }
      - run: npm ci
      - run: npx tsc --noEmit

  lint:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: '20', cache: 'npm' }
      - run: npm ci
      - run: npm run lint
      - run: npm run lint:contrast

  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: '20', cache: 'npm' }
      - run: npm ci
      - run: npm run test:ci

  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: '20', cache: 'npm' }
      - run: npm ci
      - run: npm run build
        env:
          # Build-time env vars (test values)
          NEXT_PUBLIC_SUPABASE_URL: https://test.supabase.co
          NEXT_PUBLIC_SUPABASE_ANON_KEY: dummy
          # ... other build-required vars
```

### Vercel deploy gating

- Vercel auto-deploys on push to main
- Configure Vercel: deploy ONLY if GitHub Actions check named "build" passes
- Vercel Dashboard → Project → Settings → Git → "Required Status Checks" — add `build`

### `security.yml`

```yaml
name: Security
on:
  pull_request:
  schedule:
    - cron: '0 6 * * 1'   # weekly Mondays

jobs:
  secret-scan:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with: { fetch-depth: 0 }
      - uses: gitleaks/gitleaks-action@v2
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}

  dep-audit:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: '20' }
      - run: npm audit --audit-level=high
```

### Dependabot

```yaml
# .github/dependabot.yml
version: 2
updates:
  - package-ecosystem: npm
    directory: /
    schedule: { interval: weekly }
    open-pull-requests-limit: 5
    labels: [dependencies]
```

### Tests Required
- AT-124-1: PR with type error fails typecheck job
- AT-124-2: PR with secret in code fails secret-scan job
- AT-124-3: PR with high-severity dependency CVE fails dep-audit job
- AT-124-4: Push to main doesn't deploy if `build` check fails
- AT-124-5: Dependabot opens weekly PR with grouped updates

---

## R-TASK-125: Deploy Procedure + Rollback Runbook

**Status:** NOT STARTED · **Phase:** 12 · **Sessions:** 0.5 · **Resolves:** GAP-052
**Dependencies:** R-TASK-122, R-TASK-124

### Files to Create
- `docs/runbooks/deploy-procedure.md` — standard deploy steps
- `docs/runbooks/rollback.md` — when and how to roll back

### Standard deploy procedure

```markdown
## Standard Deploy

1. PR opened against `staging` from feature branch
2. CI runs (typecheck, lint, contrast lint, test, build) — all must pass
3. Merge to `staging` → auto-deploys to staging.mybestsellingnovel.com
4. Manual smoke test in staging:
   - Sign in
   - Navigate /pricing → checkout test card → verify webhook → verify tier
   - Navigate /app → write 1 chapter → trigger 1 AI call
   - Sign out
5. PR opened against `main` from `staging`
6. CI re-runs
7. Merge to `main` → auto-deploys to prod
8. Watch Sentry for 30 minutes for new error spikes
9. Watch Better Stack for /api/health uptime
10. Update CHANGELOG.md (R-TASK-152)
```

### Rollback procedure

```markdown
## Rollback

### When to roll back
- Sentry shows >10x normal error rate within 30 min of deploy
- /api/health returning 503 after deploy
- Stripe webhook 5xx rate > 1% (visible in Stripe Dashboard)
- Customer-reported bug confirming production-only regression

### How
1. Vercel Dashboard → Project → Deployments → find previous successful deploy
2. Click "..." → "Promote to Production"
3. Confirm — promotes prior deploy as current
4. Tweet/post to status page (R-TASK-140) about brief instability
5. Open issue documenting what happened
6. Do NOT redeploy main until root cause fixed in a follow-up PR
```

### Tests Required
- AT-125-1: Deploy procedure runbook exists
- AT-125-2: Rollback drill: deploy a known-bad version to staging, then practice the rollback steps, document time-to-recover

---

*End of R-TASK-119 through R-TASK-125 cluster*
