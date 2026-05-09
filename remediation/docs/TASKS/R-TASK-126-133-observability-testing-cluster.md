<!-- APPLY: CREATE -->
# R-TASK-126 through R-TASK-133: Observability & Testing Cluster

This file batches 8 related HIGH-priority tasks.

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

## R-TASK-126: Structured Logging (Axiom or Logtail)

**Status:** NOT STARTED · **Phase:** 11 · **Sessions:** 1 · **Resolves:** GAP-054
**Dependencies:** TASK-005

### Files to Create
- `lib/log.ts` — structured logger with requestId, userId, timestamp; ships to Axiom

### Vendor choice
**Axiom** (https://axiom.co) — free tier 500GB/mo. Native Vercel integration. Searchable, structured queries.

Alternatives: Logtail/Better Stack (similar; same vendor as uptime monitor in R-TASK-129; logical to consolidate), Datadog (overkill at v1 cost).

Recommendation: Axiom for v1 (free tier covers it). At >500GB/mo, evaluate consolidating into Better Stack for unified observability.

### Files to Modify
- **(Deletion gate — confirm before executing)** `app/api/*/route.ts` — replace `console.log` and `console.error` with `log.info`, `log.warn`, `log.error` from `lib/log.ts`. This touches every API route file. Surface the list of affected files plus a sample of existing `console.*` lines (one per file) to the operator before removal. Wait for explicit "confirm deletion" reply naming each file path before proceeding. Log per-file confirmations in this sub-task's Session Notes.
- `next.config.js` — install `@axiomhq/nextjs` middleware
- `.env.local.example` — add `AXIOM_TOKEN`, `AXIOM_DATASET=mybsn-logs`

### `lib/log.ts`
```typescript
import { Logger } from '@axiomhq/logging';
import { nextAdapter } from '@axiomhq/nextjs';

const baseLogger = new Logger({
  token: process.env.AXIOM_TOKEN!,
  dataset: process.env.AXIOM_DATASET ?? 'mybsn-logs',
  adapter: nextAdapter(),
});

export function logWithContext(ctx: { requestId?: string; userId?: string; route?: string }) {
  return baseLogger.with(ctx);
}

export const log = baseLogger;
```

### Required log fields per request
- `request_id` — generated in middleware, attached to every log line in the request
- `user_id` — when authenticated
- `route` — pathname
- `method`
- `status` — response code
- `duration_ms`
- `level` — info / warn / error

### PII rules
Same as Sentry (R-TASK-106): NEVER log manuscript content, NEVER log passwords, NEVER log full Authorization headers. Log user_id only (never email).

### Tests Required
- AT-126-1: API call generates a log line in Axiom dataset within 30s
- AT-126-2: Log line contains request_id, user_id, route, status, duration_ms
- AT-126-3: Searching Axiom by user_id returns only that user's events

---

## R-TASK-127: Metrics Dashboard

**Status:** NOT STARTED · **Phase:** 11 · **Sessions:** 1 · **Resolves:** GAP-055
**Dependencies:** R-TASK-126

### Files to Create
- `docs/architecture/METRICS.md` — defined metrics + their queries

### Approach
Axiom dashboards (or Better Stack if consolidated) — pre-built queries against the log dataset.

### Required dashboards
1. **API health**
   - p50/p95/p99 latency by route (especially /api/ai)
   - Error rate (5xx / total) by route, last 1h / 24h / 7d
   - Request rate by route
2. **AI usage**
   - Total Anthropic calls today / this month
   - Token consumption (input + output)
   - Estimated cost (input × $0.003/1K + output × $0.015/1K)
   - Top 10 users by call count (potential abuse signal)
3. **Auth health**
   - Sign-in success rate
   - Failed sign-in burst detection (>10 from same IP in 5 min)
   - Sign-up rate per day
4. **Subscription health**
   - Active subscriptions by tier
   - MRR (computed from subscription rows)
   - Churn (subscription_deleted events / active)
   - Stripe webhook success/failure ratio

### Tests Required
- AT-127-1: Each dashboard loads within 5s
- AT-127-2: AI cost estimate matches Anthropic billing within 5%
- AT-127-3: Documented dashboard URLs in METRICS.md

---

## R-TASK-128: Alerting Rules + On-Call Routing

**Status:** NOT STARTED · **Phase:** 12 · **Sessions:** 1 · **Resolves:** GAP-057
**Dependencies:** R-TASK-127, R-TASK-129, R-TASK-139

**ADR-003 unblocking note:** Decision #11 split (approved 2026-05-05) means agent error rates from `components/agent/` are now in scope for alerting once the golden-output suite (per ADR-003) exists. Pre-Phase-11 alerting can target server routes, billing webhooks, and rate-limit hits; agent-internal alerts come online after the golden-output suite ships.

### Files to Create
- `docs/runbooks/alerting-rules.md` — defined alerts and their thresholds

### Required alerts (all route to on-call per R-TASK-139)

| Alert | Threshold | Severity | Channel |
|---|---|---|---|
| /api/health 503 | 2 consecutive failures | P1 | SMS + email |
| /api/ai 5xx | error rate > 5% over 10 min | P1 | SMS + email |
| Stripe webhook 5xx | any failure | P2 | email |
| Sentry error rate spike | > 10x baseline over 1h | P2 | email |
| Anthropic API 5xx | > 1% of calls over 30 min | P2 | email |
| Failed sign-in burst | > 50 from same IP in 5 min | P2 | email |
| Disk space (Supabase) | > 85% usage | P3 | email |
| AI monthly budget | > 80% of $X budget | P3 | email |

### Channels
- Better Stack incident management for P1 (SMS to on-call phone + email + status page auto-posts "investigating")
- Email to support@mybestsellingnovel.com for P2/P3

### Acknowledgement SLA
- P1: 15 minutes
- P2: 4 hours business
- P3: next business day

### Tests Required
- AT-128-1: Trigger /api/health 503 in staging — receive SMS within 5 min
- AT-128-2: All alerts have a defined runbook entry pointing to resolution steps

---

## R-TASK-129: External Uptime Monitoring (Better Stack)

**Status:** NOT STARTED · **Phase:** 12 · **Sessions:** 0.5 · **Resolves:** GAP-059
**Dependencies:** PATCH-003 (health endpoint)

### Setup
Better Stack (https://betterstack.com) — $30/mo for full uptime monitor + status page + incident management combo.

### Monitors
- https://mybestsellingnovel.com/api/health — every 60s, expect 200 + body matches `"status":"ok"`
- https://mybestsellingnovel.com/ — every 5 min, expect 200
- https://mybestsellingnovel.com/pricing — every 5 min, expect 200
- https://mybestsellingnovel.com/api/ai (HEAD) — every 5 min, expect 401 (unauthenticated; proves route exists)

### Tests Required
- AT-129-1: Better Stack dashboard shows all monitors green
- AT-129-2: Disable production briefly (revoke Vercel deployment) — receive SMS within 5 min, status page reflects outage

---

## R-TASK-130: Vitest Setup + Lib Unit Tests

**Status:** NOT STARTED · **Phase:** 11 · **Sessions:** 2 · **Resolves:** GAP-061
**Dependencies:** TASK-001

### Files to Create
- `vitest.config.ts`
- `lib/__tests__/subscription.test.ts`
- `lib/__tests__/api-auth.test.ts`
- `lib/__tests__/password.test.ts` (paired with R-TASK-114)
- `lib/__tests__/ratelimit.test.ts` (paired with R-TASK-104; mocks Upstash)
- `lib/__tests__/audit.test.ts` (paired with R-TASK-111)
- `lib/__tests__/brand.test.ts` — assert allowedPairings ratios meet 4.5:1
- `__mocks__/supabase.ts` — Supabase client mock factory

### Coverage floor
- Initial: 0% (just establishes the framework)
- Phase 11 exit: 60% on `lib/` (excluding components)
- v1.1: 80% on `lib/`

### Files to Modify
- `package.json` — add `vitest`, `@vitest/coverage-v8`, scripts: `test`, `test:watch`, `test:coverage`, `test:ci`
- `.github/workflows/ci.yml` (R-TASK-124) — `npm run test:ci` step

### Sample test (`lib/__tests__/subscription.test.ts`)
```typescript
import { describe, expect, it } from 'vitest';
import { TIER_LIMITS, canMakeAICall } from '../subscription';

describe('TIER_LIMITS', () => {
  it('Explorer has 25 calls/mo', () => {
    expect(TIER_LIMITS.explorer.ai_calls_per_month).toBe(25);
  });
  it('Author has 500 calls/mo', () => {
    expect(TIER_LIMITS.author.ai_calls_per_month).toBe(500);
  });
  it('Publisher has 2000 calls/mo', () => {
    expect(TIER_LIMITS.publisher.ai_calls_per_month).toBe(2000);
  });
});

describe('canMakeAICall', () => {
  it('blocks at limit', () => {
    expect(canMakeAICall('explorer', 25)).toBe(false);
  });
  it('allows at limit-1', () => {
    expect(canMakeAICall('explorer', 24)).toBe(true);
  });
});
```

### Tests Required
- AT-130-1: `npm test` runs all unit tests, all pass
- AT-130-2: Coverage report generated; `lib/` coverage ≥ 60%
- AT-130-3: CI fails when a test fails

---

## R-TASK-131: Playwright Smoke Tests

**Status:** NOT STARTED · **Phase:** 11 · **Sessions:** 2 · **Resolves:** GAP-063
**Dependencies:** R-TASK-122 (staging environment)

### Files to Create
- `playwright.config.ts`
- `e2e/auth.spec.ts` — sign up → email verify → sign in → sign out
- `e2e/billing.spec.ts` — sign in → /pricing → checkout test card → verify tier upgraded
- `e2e/agent-s0.spec.ts` — sign in → /app → S0 step completes
- `e2e/account.spec.ts` — sign in → /account → MFA enroll → password change

### Approach
- Playwright runs against staging.mybestsellingnovel.com
- Uses dedicated test user `playwright-bot@woulfgroup.com` with rotating throwaway password
- Stripe test cards: 4242424242424242 (success), 4000000000000341 (auth fail)

### Files to Modify
- `package.json` — add `@playwright/test`, scripts: `test:e2e`, `test:e2e:ci`
- `.github/workflows/ci.yml` — add E2E job (runs on PRs to main only, against staging)

### Coverage at v1
- Auth flow ✅
- Billing flow ✅
- Agent step S0 ✅ (full agent flow deferred to v1.1 — too brittle for v1 with verbatim-port directive)
- Account management ✅

### Tests Required
- AT-131-1: `npm run test:e2e` against staging passes all 4 specs
- AT-131-2: Test runtime < 5 minutes
- AT-131-3: CI runs E2E on PRs targeting main; failures block merge

---

## R-TASK-132: Stripe Webhook Contract Tests + Fixtures

**Status:** NOT STARTED · **Phase:** 11 · **Sessions:** 1 · **Resolves:** GAP-064
**Dependencies:** TASK-024, PATCH-002

### Files to Create
- `e2e/stripe-fixtures/` — JSON fixtures of historical Stripe events
  - `subscription-created.json`
  - `subscription-updated-tier-change.json`
  - `subscription-deleted.json`
  - `checkout-completed-subscription.json`
  - `checkout-completed-lifetime.json`
  - `invoice-payment-failed.json`
- `lib/__tests__/stripe-webhook.test.ts` — runs each fixture through handler, verifies DB writes

### Approach
- Capture real Stripe webhook events via `stripe trigger` (test mode)
- Save sanitized JSON (replace customer IDs with constants) to fixtures
- Test runs handler against fixture; asserts DB writes match expected

### Sample fixture loop
```typescript
import fixtures from './stripe-fixtures';

for (const [name, fixture] of Object.entries(fixtures)) {
  test(`webhook handles ${name}`, async () => {
    const result = await handleWebhook(fixture);
    expect(result.ok).toBe(true);
    // Assert specific DB writes per fixture's expected behavior
  });
}
```

### Tests Required
- AT-132-1: All 6 fixtures process without error
- AT-132-2: Lifetime fixture creates exactly one subscription row (PATCH-002 idempotency)
- AT-132-3: Subscription-deleted fixture downgrades profile to 'explorer'
- AT-132-4: Replay (same event_id twice) processes once (PATCH-002)

---

## R-TASK-133: Automated RLS Isolation Test Suite

**Status:** NOT STARTED · **Phase:** 11 · **Sessions:** 1.5 · **Resolves:** GAP-065
**Dependencies:** TASK-013, TASK-014, R-TASK-122

### Files to Create
- `e2e/rls-isolation.spec.ts`
- `scripts/seed-test-users.ts` — creates user A and user B with sample books in staging

### Approach
For each user-scoped table (profiles, books, chapters, audio_chunks, subscriptions, ai_usage_logs, deletion_requests, mfa_recovery_codes, audit_event_log, document_acceptances):
*(Per R-TASK-101 Path A locked: `team_memberships` deferred to v2 and not part of v1 RLS surface.)*
1. Create user A and user B with each their own row(s)
2. Sign in as user A; attempt all CRUD operations on user B's rows
3. Assert all return 0 rows / 403 / RLS-blocked

### Sample test
```typescript
test('user A cannot read user B books', async () => {
  const userA = await signInAs('userA@test.com', 'pwA');
  const userBBookId = await getKnownBookOwnedByUserB();
  const res = await userA.client.from('books').select('*').eq('id', userBBookId);
  expect(res.data).toHaveLength(0);  // RLS filtered
});

test('user A cannot delete user B books', async () => {
  const userA = await signInAs('userA@test.com', 'pwA');
  const userBBookId = await getKnownBookOwnedByUserB();
  const res = await userA.client.from('books').delete().eq('id', userBBookId);
  expect(res.error).toBeNull();  // delete returns success but...
  const stillThere = await getKnownBookOwnedByUserB();
  expect(stillThere).toBe(userBBookId);  // ...row still exists
});
```

### Run cadence
- Every PR (CI)
- Catches regressions if RLS policy gets dropped or modified incorrectly

### Tests Required
- AT-133-1: All 11 tables × 4 operations (SELECT/INSERT/UPDATE/DELETE) cross-user tests pass
- AT-133-2: Test fails (correctly) when RLS policy is removed (verified via mutation test)
- AT-133-3: Suite runs in < 2 minutes

---

*End of R-TASK-126 through R-TASK-133 cluster*
