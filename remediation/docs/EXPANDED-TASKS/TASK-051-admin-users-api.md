<!-- APPLY: REPLACE -->
<!-- Target: docs/TASKS/TASK-051-admin-users-api.md (in original mybsn package) -->
<!-- Backup: docs/EXPANDED-TASKS/backups/TASK-051-admin-users-api.pre-expansion-backup.md -->
<!-- Expanded 2026-05-08 from 91 words to ~960 words via PATCH-3 sub-deliverable B.3. -->

# TASK-051: Admin Users API (`app/api/admin/users/route.ts`, `app/api/admin/users/[id]/route.ts`)

## Status: NOT STARTED
## Priority: HIGH
## Phase: 7
## Estimated Sessions: 2
## Dependencies: TASK-006, TASK-049, TASK-052
## Requirements Covered: R20, R23
## Spec Reference: Section 7.4

## Inference Summary

| Addition | Source |
|---|---|
| Response shape with profile + tier + counts + last_active_at | Q-7.9 operator-answer (use default) |
| Search: email prefix OR full_name substring (ILIKE) | Q-7.10 operator-answer (use default) |
| Filters: tier, status, role (stackable) | Q-7.11 operator-answer (use default) |
| `last_active_at` from `auth.users.last_sign_in_at` | Q-7.12 operator-answer (use default) |
| Pagination default 50; capped at 200 | Q-7.13 operator-answer (use default) |
| Detail endpoint includes audit-log slice | TASK-052 expansion (Q-7.3 drill-down) + R-TASK-111 |
| Mutation gating to super_admin | Q-7.5 operator-answer (super_admin-only mutations); R-TASK-113 |

Operator confirmed all questions on 2026-05-08.

## Pre-flight: re-read current state

- View `app/api/admin/users/route.ts` and `app/api/admin/users/[id]/route.ts` if present.
- Confirm `lib/api-auth.ts` has `verifyAdmin` and `verifySuperAdmin`.
- Confirm `audit_event_log` table exists (R-TASK-111).
- Confirm `profiles.role` column accepts `'user' | 'admin' | 'super_admin'` (Decision #31 + R-TASK-113).

## Files to Create/Modify

- `app/api/admin/users/route.ts` — GET (list with filters)
- `app/api/admin/users/[id]/route.ts` — GET (detail) + PATCH (mutations: super_admin-only)

## Implementation Requirements

### GET `/api/admin/users` — paginated list with search + filters

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { verifyAdmin } from '@/lib/api-auth';
import { createServiceRoleClient } from '@/lib/supabase/server';

export async function GET(req: NextRequest) {
  const result = await verifyAdmin(req);
  if (!result.authorized) return NextResponse.json({ error: result.error }, { status: result.status });

  const url = new URL(req.url);
  const search = url.searchParams.get('search')?.trim() ?? '';
  const tier = url.searchParams.get('tier');           // 'explorer'|'author'|'publisher'
  const status = url.searchParams.get('status');       // 'free'|'active'|'past_due'|'cancelled'
  const role = url.searchParams.get('role');           // 'user'|'admin'|'super_admin'
  const page = Math.max(1, parseInt(url.searchParams.get('page') ?? '1', 10));
  const pageSizeRaw = parseInt(url.searchParams.get('page_size') ?? '50', 10);
  const pageSize = Math.min(200, Math.max(1, Number.isFinite(pageSizeRaw) ? pageSizeRaw : 50));  // Q-7.13 cap

  const sb = createServiceRoleClient();
  // Build query with stackable filters per Q-7.11
  let query = sb
    .from('profiles')
    .select('id, email, full_name, role, subscription_tier, subscription_status, created_at, last_sign_in_at', { count: 'exact' })
    .order('created_at', { ascending: false });

  if (search) {
    // Q-7.10 default: email prefix OR full_name substring
    // Postgres OR via .or() with ILIKE
    query = query.or(`email.ilike.${escapeIlike(search)}%,full_name.ilike.%${escapeIlike(search)}%`);
  }
  if (tier) query = query.eq('subscription_tier', tier);
  if (status) query = query.eq('subscription_status', status);
  if (role) query = query.eq('role', role);

  // Pagination
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;
  query = query.range(from, to);

  const { data: rows, count, error } = await query;
  if (error) return NextResponse.json({ error: 'fetch_failed' }, { status: 500 });

  // Per Q-7.12: last_active_at from auth.users.last_sign_in_at (mirrored to profiles.last_sign_in_at
  // by a trigger that runs on auth state change). The mirror exists because querying auth.users
  // from a route handler requires service-role + cross-schema query; mirrored column is simpler.

  // Per-row enrichment: book_count + ai_calls_this_month
  // Run as parallel COUNTs to avoid N+1 — service-role can do this efficiently
  const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString();
  const enriched = await Promise.all((rows ?? []).map(async (row) => {
    const [{ count: bookCount }, { count: aiCount }] = await Promise.all([
      sb.from('books').select('id', { count: 'exact', head: true }).eq('user_id', row.id),
      sb.from('ai_usage_logs').select('id', { count: 'exact', head: true }).eq('user_id', row.id).gte('created_at', monthStart),
    ]);
    return {
      id: row.id,
      email: row.email,
      full_name: row.full_name,
      role: row.role,
      subscription_tier: row.subscription_tier,
      subscription_status: row.subscription_status,
      book_count: bookCount ?? 0,
      ai_calls_this_month: aiCount ?? 0,
      created_at: row.created_at,
      last_active_at: row.last_sign_in_at,
    };
  }));

  return NextResponse.json({
    users: enriched,
    page,
    page_size: pageSize,
    total: count ?? 0,
  });
}

function escapeIlike(s: string): string {
  // Escape ILIKE wildcards in user input; users can search literal `%` and `_`
  return s.replace(/[%_\\]/g, '\\$&');
}
```

The N parallel COUNT queries for book_count + ai_calls_this_month are bounded by `pageSize` (default 50, max 200). At max 200 users per page × 2 counts = 400 queries — Postgres handles easily, and they run in parallel via `Promise.all`. If admin user-count grows to 100K+ and admin frequently uses page_size=200, denormalize these counters onto `profiles` via triggers.

### GET `/api/admin/users/[id]` — detail with audit slice

```typescript
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const result = await verifyAdmin(req);
  if (!result.authorized) return NextResponse.json({ error: result.error }, { status: result.status });

  const sb = createServiceRoleClient();
  const { data: user } = await sb.from('profiles').select('*').eq('id', params.id).single();
  if (!user) return NextResponse.json({ error: 'not_found' }, { status: 404 });

  // Subscription history
  const { data: subs } = await sb.from('subscriptions').select('*').eq('user_id', params.id).order('created_at', { ascending: false });

  // AI usage timeline (last 30 days)
  const since = new Date(Date.now() - 30 * 86400 * 1000).toISOString();
  const { data: ai } = await sb.from('ai_usage_logs').select('created_at, step, function_name, tokens_in, tokens_out, latency_ms').eq('user_id', params.id).gte('created_at', since).order('created_at', { ascending: false });

  // Audit-log slice — events where this user was the actor or the target (latest 50)
  const { data: audit } = await sb.from('audit_event_log').select('*').or(`actor_user_id.eq.${params.id},target_user_id.eq.${params.id}`).order('created_at', { ascending: false }).limit(50);

  return NextResponse.json({ user, subscriptions: subs ?? [], ai_usage: ai ?? [], audit_events: audit ?? [] });
}
```

### PATCH `/api/admin/users/[id]` — super_admin mutations

Per Q-7.5 default (TASK-052 expansion), user mutations are super_admin-only. Allowed actions: grant role, force MFA reset, soft-delete account.

```typescript
import { verifySuperAdmin } from '@/lib/api-auth';

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const result = await verifySuperAdmin(req);
  if (!result.authorized) return NextResponse.json({ error: result.error }, { status: result.status });

  const body = await req.json();
  const { action, payload } = body as { action: string; payload?: Record<string, unknown> };

  const sb = createServiceRoleClient();

  switch (action) {
    case 'grant_role': {
      const newRole = payload?.role as 'user'|'admin'|'super_admin'|undefined;
      if (!newRole || !['user','admin','super_admin'].includes(newRole)) {
        return NextResponse.json({ error: 'invalid_role' }, { status: 400 });
      }
      await sb.from('profiles').update({ role: newRole }).eq('id', params.id);
      await recordAuditEvent(sb, { event_type: 'admin.user.grant_role', actor_user_id: result.user.id, target_user_id: params.id, metadata: { new_role: newRole } });
      return NextResponse.json({ ok: true });
    }
    case 'force_mfa_reset': {
      // Calls Supabase admin API to invalidate user's MFA factors
      // (implementation depends on Supabase Auth admin SDK)
      // ... omitted for brevity ...
      await recordAuditEvent(sb, { event_type: 'admin.user.force_mfa_reset', actor_user_id: result.user.id, target_user_id: params.id });
      return NextResponse.json({ ok: true });
    }
    case 'soft_delete': {
      // Marks profile as soft-deleted; R-TASK-102 deletion lifecycle takes over
      await sb.from('profiles').update({ deleted_at: new Date().toISOString() }).eq('id', params.id);
      await recordAuditEvent(sb, { event_type: 'admin.user.soft_delete', actor_user_id: result.user.id, target_user_id: params.id });
      return NextResponse.json({ ok: true });
    }
    default:
      return NextResponse.json({ error: 'unknown_action' }, { status: 400 });
  }
}
```

Every mutation writes to `audit_event_log` with `actor_user_id = the super_admin` and `target_user_id = the user being modified`. R-TASK-111's audit log surface displays these in `/admin/audit`.

## What this task does NOT do

- Does NOT support DELETE method — soft-delete only (full erase per R-TASK-102 lifecycle)
- Does NOT support fuzzy/full-text search — ILIKE prefix/substring only per Q-7.10
- Does NOT compute filters server-side that aren't backed by indexed columns — `tier`, `status`, `role` all have indices (verified via migration TASK-011)

## Tests Required

- AT-085: Admin GET returns paginated user list; default page=1, page_size=50
- AT-086: page_size=500 capped at 200
- AT-087: Search `?search=alice` matches `alice@...` (email prefix) and "Alice Walker" (full_name substring)
- AT-088: Filters stackable: `?tier=author&status=active` returns intersection
- AT-089: Detail endpoint returns user + subs + ai_usage + audit_events arrays
- AT-090: Admin PATCH (without super_admin role) → 403 `forbidden`
- AT-091: Super_admin PATCH grant_role writes audit event
- AT-092: Mechanical: `last_active_at` field present on every list row

## Session Notes
_(Filled by Claude Code during implementation)_
