<!-- APPLY: CREATE -->
# PATCH-003: Add /api/health Endpoint

## Status: NOT STARTED
## Priority: HIGH
## Phase: 11 (small enough to be a patch; pre-req for R-TASK-129 uptime monitoring)
## Estimated Sessions: 0.5
## Dependencies: TASK-004
## Resolves Gaps: GAP-060
## Spec Reference: AUDIT_REPORT.md HIGH section

## Pre-flight: re-read current state

Before making any change, read the current state of every file listed in "Files to Modify" below. Verify the gap(s) addressed by this task are still present in the current code. Specifically:

- For each file in "Files to Modify": view the file and confirm the condition the audit observed (e.g., "no rate limiting on /api/ai") still applies.
- For each gap in "Resolves Gaps": confirm the gap remains open. The audit was conducted on 2026-05-04; if the codebase changed since, the gap may have been partially or fully addressed.
- If a gap is no longer present, report this finding in PROGRESS.md, mark this task as superseded, and stop. Do not make changes.
- If a gap is partially addressed, scope this task to the remaining work and document in this file's Session Notes what was already addressed and skipped.
- If the gap is still fully present as the audit described, proceed with the rest of this task.

This pre-flight catches the case where the codebase changed between audit and remediation — exactly the failure mode that produces silent overwrites of unrelated work.

## Files to Create

- `app/api/health/route.ts`

## Implementation

```typescript
// app/api/health/route.ts
import { NextResponse } from 'next/server';
import { getServiceRoleSupabase } from '@/lib/supabase/server';

export const runtime = 'nodejs';
export const maxDuration = 5;
export const dynamic = 'force-dynamic';

interface HealthCheck {
  status: 'ok' | 'degraded' | 'down';
  version: string;
  timestamp: string;
  checks: {
    database: 'ok' | 'down';
    auth: 'ok' | 'down';
  };
  duration_ms: number;
}

export async function GET() {
  const started = Date.now();
  const sb = getServiceRoleSupabase();
  const checks: HealthCheck['checks'] = { database: 'down', auth: 'down' };

  // Database check — minimal query
  try {
    const { error } = await sb.from('profiles').select('id').limit(1);
    if (!error) checks.database = 'ok';
  } catch {}

  // Auth check — verify we can talk to auth subsystem
  try {
    const { error } = await sb.auth.admin.listUsers({ perPage: 1 });
    if (!error) checks.auth = 'ok';
  } catch {}

  const allOk = Object.values(checks).every(v => v === 'ok');
  const status: HealthCheck['status'] = allOk ? 'ok' : 'degraded';

  const body: HealthCheck = {
    status,
    version: process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 7) ?? 'unknown',
    timestamp: new Date().toISOString(),
    checks,
    duration_ms: Date.now() - started,
  };

  return NextResponse.json(body, {
    status: allOk ? 200 : 503,
    headers: { 'Cache-Control': 'no-store' },
  });
}
```

## Why minimal

This endpoint is hit by external uptime monitors (R-TASK-129 / Better Stack) every 1 minute. It must:
- Be cheap (don't burn DB resources or Anthropic budget)
- Return 200 quickly when healthy, 503 when not
- NOT require auth (uptime monitors aren't authenticated)
- NOT leak info (no internal error messages, no DB schema details)

The two checks (DB query + auth API call) catch the two most common Supabase outage modes. We deliberately do NOT include checks for Stripe, Anthropic, or Resend — those would each fail independently and would either (a) take down /health when unrelated services are degraded, or (b) over-report uptime. External monitors should hit Stripe/Anthropic separately.

## Why no rate limiting on /health

The endpoint must be hit frequently by external monitors. Bot abuse is mitigated by being cheap (no DB writes, minimal reads).

## Tests Required

- AT-PATCH-003-1: GET /api/health returns 200 with `{status:'ok', checks:{database:'ok', auth:'ok'}}` when system healthy
- AT-PATCH-003-2: GET /api/health duration is < 500ms p95
- AT-PATCH-003-3: GET /api/health does not require Authorization header
- AT-PATCH-003-4: When SUPABASE_SERVICE_ROLE_KEY is invalid (simulate by changing env), endpoint returns 503
- AT-PATCH-003-5: GET /api/health duration is < 1500ms p99 (envelope on the p95 budget; catches occasional cold-start outliers that would still alarm a 60s monitor with retries)
- AT-PATCH-003-6: Response body always contains `checks.database` AND `checks.auth` keys (regardless of value), so external monitors and dashboards can assert against a stable shape without parsing implementation-specific text. Note: Redis, Stripe, Anthropic, and Resend are deliberately NOT in the response shape per the design rationale in "Why minimal" — those vendors are checked by independent external monitors. A test asserting Redis-in-shape would contradict the design and is intentionally omitted.

## Pairs with R-TASK-129 (uptime monitoring)

Better Stack monitor configuration:
- URL: https://mybestsellingnovel.com/api/health
- Interval: 60 seconds
- Expected: 200 status code
- Expected: response body matches `"status":"ok"` (regex assertion)
- Alert: 2 consecutive failures → SMS + email per R-TASK-128

## Session Notes
_(Filled by Claude Code during implementation)_
