<!-- APPLY: REPLACE -->
<!-- Target: docs/TASKS/TASK-049-admin-metrics-api.md (in original mybsn package) -->
<!-- Backup: docs/EXPANDED-TASKS/backups/TASK-049-admin-metrics-api.pre-expansion-backup.md -->
<!-- Expanded 2026-05-08 from 117 words to ~1080 words via PATCH-3 sub-deliverable B.3. -->

# TASK-049: Admin Metrics API (`app/api/admin/metrics/route.ts`)

## Status: NOT STARTED
## Priority: HIGH
## Phase: 7
## Estimated Sessions: 2
## Dependencies: TASK-006, TASK-052
## Requirements Covered: R20
## Spec Reference: Section 7.2

## Inference Summary

| Addition | Source |
|---|---|
| Response shape with new_signups, active_subs_by_tier (4 SKUs), MRR, AI usage | Q-7.1 operator-answer (use default); A.3 cascade (4 SKUs not 6) |
| 60s in-memory cache per Vercel function instance | Q-7.2 operator-answer (use default) |
| All 5 ranges (7d/30d/90d/ytd/all) in single nested response | Q-7.3 operator-answer (use default) |
| `verifyAdmin` gate (admin or super_admin) | Q-7.4 operator-answer (confirmed) |
| Top 20 by AI usage (matches TASK-052 expansion) | Q-7.5 operator-answer (use default) |
| MRR computation (annual price ÷ 12 added to MRR) | TASK-052 expansion + Decision #29 monthly/annual |
| Lifetime tier excluded from active_subs_by_tier | A.3 cascade |

Operator confirmed all questions on 2026-05-08.

## Pre-flight: re-read current state

- View `app/api/admin/metrics/route.ts` if present.
- Confirm `lib/api-auth.ts` (TASK-006) has `verifyAdmin` helper available.
- Confirm `subscriptions`, `profiles`, `ai_usage_logs`, `books` tables exist with expected columns from migrations TASK-011 through TASK-015.
- Confirm any post-A.3 stale references (e.g., `subscription_status='lifetime'`) are absent — A.3 cascade should have eliminated.

## Files to Create/Modify

- `app/api/admin/metrics/route.ts` (NEW)

## Implementation Requirements

### GET `/api/admin/metrics` — full snapshot

Single endpoint returning all 5 time ranges in a nested response per Q-7.3 default. No query params for range — admin client picks which to display from the response. Cache TTL 60s per Q-7.2 default; second-by-second admins still see fresh-ish data without hammering the DB on every poll tick.

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { verifyAdmin } from '@/lib/api-auth';
import { createServiceRoleClient } from '@/lib/supabase/server';

// In-memory cache — per Vercel function instance (Q-7.2 default).
// Stale across cold starts; that's fine — first cold-start request pays full DB cost,
// subsequent requests within 60s reuse. With TASK-052 polling at 60s the cache hit
// rate is high during active admin sessions.
type CacheEntry = { data: unknown; expires_at: number };
let _cache: CacheEntry | null = null;
const CACHE_TTL_MS = 60_000;

export async function GET(req: NextRequest) {
  const result = await verifyAdmin(req);
  if (!result.authorized) {
    return NextResponse.json({ error: result.error }, { status: result.status });
  }

  if (_cache && _cache.expires_at > Date.now()) {
    return NextResponse.json(_cache.data);
  }

  const sb = createServiceRoleClient();  // service-role bypasses RLS for cross-user aggregates
  const data = await computeMetrics(sb);
  _cache = { data, expires_at: Date.now() + CACHE_TTL_MS };
  return NextResponse.json(data);
}

async function computeMetrics(sb: ReturnType<typeof createServiceRoleClient>) {
  const now = new Date();
  const day = 24 * 60 * 60 * 1000;
  const ranges = {
    '7d':  new Date(now.getTime() - 7 * day),
    '30d': new Date(now.getTime() - 30 * day),
    '90d': new Date(now.getTime() - 90 * day),
    'ytd': new Date(now.getFullYear(), 0, 1),
    'all': new Date(2026, 0, 1),  // launch lower bound
  };

  // Total users (single COUNT)
  const { count: totalUsers } = await sb
    .from('profiles')
    .select('id', { count: 'exact', head: true });

  // Signups per range — 5 parallel COUNT(*) WHERE created_at >= boundary
  const signupCounts = await Promise.all(
    Object.entries(ranges).map(async ([key, since]) => {
      const { count } = await sb
        .from('profiles')
        .select('id', { count: 'exact', head: true })
        .gte('created_at', since.toISOString());
      return [key, count ?? 0] as const;
    })
  );
  const new_signups = Object.fromEntries(signupCounts);

  // Active subs grouped by tier + interval (4 SKUs post-A.3; lifetime excluded)
  const { data: subs } = await sb
    .from('subscriptions')
    .select('tier, stripe_price_id')
    .eq('status', 'active');

  const tierKeys = new Map<string, keyof typeof active_subs_by_tier>([
    [process.env.STRIPE_PRICE_AUTHOR_MONTHLY!,    'author_monthly'],
    [process.env.STRIPE_PRICE_AUTHOR_ANNUAL!,     'author_annual'],
    [process.env.STRIPE_PRICE_PUBLISHER_MONTHLY!, 'publisher_monthly'],
    [process.env.STRIPE_PRICE_PUBLISHER_ANNUAL!,  'publisher_annual'],
  ]);
  const active_subs_by_tier = {
    author_monthly: 0, author_annual: 0,
    publisher_monthly: 0, publisher_annual: 0,
  };
  for (const sub of subs ?? []) {
    const key = tierKeys.get(sub.stripe_price_id ?? '');
    if (key) active_subs_by_tier[key]++;
  }

  // MRR — author monthly $29, author annual $313.20/12, publisher monthly $79, publisher annual $853.20/12
  const mrr_usd =
    active_subs_by_tier.author_monthly * 29 +
    active_subs_by_tier.author_annual  * (313.20 / 12) +
    active_subs_by_tier.publisher_monthly * 79 +
    active_subs_by_tier.publisher_annual  * (853.20 / 12);

  // AI usage total (current month) + cost estimate
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
  const { data: usage } = await sb
    .from('ai_usage_logs')
    .select('tokens_in, tokens_out')
    .gte('created_at', monthStart);
  const ai_calls_total = usage?.length ?? 0;
  // Rough cost estimate — Claude Sonnet 4.5 pricing as of audit date 2026-05-04;
  // verify pricing on console.anthropic.com at TASK-049 ship time and adjust if changed.
  const totalIn = (usage ?? []).reduce((s, r) => s + (r.tokens_in ?? 0), 0);
  const totalOut = (usage ?? []).reduce((s, r) => s + (r.tokens_out ?? 0), 0);
  const ai_cost_estimate_usd = (totalIn * 3 / 1_000_000) + (totalOut * 15 / 1_000_000);

  // Total books across the platform
  const { count: total_books } = await sb
    .from('books')
    .select('id', { count: 'exact', head: true });

  // Top 20 users by AI calls this month (Q-7.5 default)
  const { data: topRows } = await sb.rpc('top_users_by_ai', { p_limit: 20, p_since: monthStart });
  // RPC returns: { user_id, email, ai_calls }[]

  return {
    total_users: totalUsers ?? 0,
    new_signups,
    active_subs_by_tier,
    mrr_usd: Math.round(mrr_usd * 100) / 100,
    ai_calls_total,
    ai_cost_estimate_usd: Math.round(ai_cost_estimate_usd * 100) / 100,
    total_books: total_books ?? 0,
    top_users_by_ai: topRows ?? [],
  };
}
```

The `top_users_by_ai` RPC is a Postgres function defined alongside this task — does the JOIN of `ai_usage_logs` and `profiles` server-side rather than fetching every log row to JS:

```sql
-- migration alongside this task: 015c_top_users_by_ai_fn.sql
CREATE OR REPLACE FUNCTION top_users_by_ai(p_limit INT, p_since TIMESTAMPTZ)
RETURNS TABLE(user_id UUID, email TEXT, ai_calls BIGINT)
LANGUAGE SQL
STABLE
AS $$
  SELECT
    l.user_id,
    p.email,
    COUNT(*) AS ai_calls
  FROM ai_usage_logs l
  JOIN profiles p ON p.id = l.user_id
  WHERE l.created_at >= p_since
  GROUP BY l.user_id, p.email
  ORDER BY ai_calls DESC
  LIMIT p_limit;
$$;
```

### Why service-role client

The metrics endpoint aggregates across users (cross-user counts, top-N), which RLS policies block by design. Per WoulfAI rule 10 + Decision #3, service-role usage is restricted to webhook + cron paths — but `/api/admin/metrics` is a third legitimate use case (admin-gated cross-user aggregates). Document this in `lib/supabase/server.ts` JSDoc as the third allowed location alongside the lint script that catches drift.

Update the mechanical service-role lint from TASK-004 to whitelist `app/api/admin/`:

```bash
grep -rn "createServiceRoleClient" app/ lib/ \
  | grep -v "lib/supabase/server.ts" \
  | grep -vE "app/api/(stripe/webhook|cron/|admin/)" \
  && echo "ERROR: createServiceRoleClient used outside allowed scope" && exit 1
```

## What this task does NOT do

- Does NOT cache across Vercel function instances — separate cold starts pay full DB cost; matches Q-7.2 default's "in-memory per instance" choice
- Does NOT include lifetime tier in `active_subs_by_tier` — A.3 elimination
- Does NOT compute genre breakdown — that's TASK-050's territory
- Does NOT compute audit-log surface — that's TASK-052's `/admin/audit` route via R-TASK-111

## Tests Required

- AT-071: Authenticated admin → 200 + full snapshot per Q-7.1 default shape
- AT-072: Authenticated regular user → 403 `forbidden`
- AT-073: Unauthenticated → 401 `unauthorized`
- AT-074: First call computes from DB; second call within 60s returns cached identical bytes (verify via measurable response-time difference and via instrumented cache hit counter)
- AT-075: `active_subs_by_tier` contains exactly 4 keys (no `*_lifetime`)
- AT-076: `top_users_by_ai` array length ≤ 20
- AT-077: Mechanical: response body does not contain string `lifetime` anywhere
- AT-078: Service-role lint includes `app/api/admin/` in whitelist; CI passes

## Session Notes
_(Filled by Claude Code during implementation)_
