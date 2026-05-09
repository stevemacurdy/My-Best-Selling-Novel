<!-- APPLY: CREATE -->
# R-TASK-111: Audit Event Log Table + Helper + Admin-Read Recording

## Status: NOT STARTED
## Priority: HIGH
## Phase: 11
## Estimated Sessions: 1.5
## Dependencies: TASK-011 (profiles)
## Resolves Gaps: GAP-010
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

- `supabase/migrations/012_audit_event_log.sql`
- `lib/audit.ts` — single helper `recordAuditEvent({actor_id, action, target_type, target_id, metadata})`

## Files to Modify

- `app/api/admin/users/route.ts` (TASK-051) — record `action='admin.user.read'` on every paginated read
- `app/api/admin/metrics/route.ts` (TASK-049) — record `action='admin.metrics.read'`
- `app/api/admin/genres/route.ts` (TASK-050) — record `action='admin.genres.read'`
- Any future admin route that reads user data — record before returning
- `app/api/stripe/webhook/route.ts` (TASK-024) — record tier changes with `action='subscription.tier_changed'`
- `app/api/account/delete/*` (R-TASK-102) — record deletion lifecycle events
- `app/api/team/invite/route.ts` (R-TASK-101 path B) — record invitation events
- Role-change endpoint (R-TASK-113) — record `action='role.granted'` and `action='role.revoked'`

## SQL — `012_audit_event_log.sql`

```sql
CREATE TABLE audit_event_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  occurred_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Actor (who did the thing); use snapshot text in case actor is later deleted
  actor_id UUID,                          -- profile id at time of event (may be null for system events)
  actor_id_snapshot TEXT NOT NULL,        -- string copy that survives profile deletion
  actor_email_snapshot TEXT,              -- email at time of event
  actor_role_snapshot TEXT,               -- 'user' | 'admin' | 'system'

  -- Action vocabulary (controlled by enum-like CHECK)
  action TEXT NOT NULL CHECK (action ~ '^[a-z]+(\.[a-z_]+)+$'),
    -- Examples: 'admin.user.read', 'admin.metrics.read', 'subscription.tier_changed',
    --   'account.delete.requested', 'account.delete.confirmed', 'account.delete.executed',
    --   'role.granted', 'role.revoked', 'team.invitation.sent', 'team.invitation.accepted',
    --   'auth.signin', 'auth.password_changed', 'auth.mfa.enrolled', 'auth.mfa.unenrolled',
    --   'webhook.processed', 'webhook.failed'

  -- Target (what was acted upon)
  target_type TEXT,                       -- 'profile' | 'book' | 'chapter' | 'subscription' | 'webhook_event' | etc
  target_id TEXT,                         -- string for cross-table compatibility

  -- Context
  ip_address INET,
  user_agent TEXT,
  request_id TEXT,                        -- correlate with logs/tracing
  metadata JSONB DEFAULT '{}'::jsonb      -- action-specific extra data
);

CREATE INDEX idx_audit_actor ON audit_event_log(actor_id, occurred_at DESC) WHERE actor_id IS NOT NULL;
CREATE INDEX idx_audit_action ON audit_event_log(action, occurred_at DESC);
CREATE INDEX idx_audit_target ON audit_event_log(target_type, target_id) WHERE target_id IS NOT NULL;
CREATE INDEX idx_audit_occurred ON audit_event_log(occurred_at DESC);

ALTER TABLE audit_event_log ENABLE ROW LEVEL SECURITY;

-- Users can read events about themselves (target_id = their id, target_type = 'profile')
CREATE POLICY "Users see own audit events" ON audit_event_log
  FOR SELECT USING (
    target_type = 'profile' AND target_id = auth.uid()::text
  );

-- Admins can read all
CREATE POLICY "Admins read all audit events" ON audit_event_log
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- INSERTs only via service role from API routes; no direct user inserts
-- (no INSERT policy → blocked under RLS; service role bypasses)
```

## `lib/audit.ts` helper

```typescript
// lib/audit.ts
import { getServiceRoleSupabase } from '@/lib/supabase/server';

interface AuditEventInput {
  actor_id?: string | null;
  actor_email?: string | null;
  actor_role?: 'user' | 'admin' | 'system';
  action: string;
  target_type?: string;
  target_id?: string;
  ip_address?: string;
  user_agent?: string;
  request_id?: string;
  metadata?: Record<string, unknown>;
}

export async function recordAuditEvent(input: AuditEventInput): Promise<void> {
  const sb = getServiceRoleSupabase();
  const { error } = await sb.from('audit_event_log').insert({
    actor_id: input.actor_id ?? null,
    actor_id_snapshot: input.actor_id ?? 'system',
    actor_email_snapshot: input.actor_email ?? null,
    actor_role_snapshot: input.actor_role ?? 'system',
    action: input.action,
    target_type: input.target_type ?? null,
    target_id: input.target_id ?? null,
    ip_address: input.ip_address ?? null,
    user_agent: input.user_agent ?? null,
    request_id: input.request_id ?? null,
    metadata: input.metadata ?? {},
  });
  if (error) {
    // Audit log failures must NEVER block the originating request,
    // but we capture in Sentry so we know audit is being lost.
    console.error('[audit] failed to record event', input.action, error);
    // Sentry capture (lazy import to avoid circular)
    const { captureException } = await import('@sentry/nextjs');
    captureException(new Error(`Audit record failed: ${input.action}`), {
      extra: { input, supabaseError: error },
    });
  }
}
```

## Usage pattern in admin routes

```typescript
// app/api/admin/users/route.ts (addition near top of GET handler)
import { recordAuditEvent } from '@/lib/audit';

export async function GET(req: NextRequest) {
  const user = await verifyToken(req);
  if (!user || user.role !== 'admin') return forbidden('admin only');
  await assertMFAVerified(user);

  // ... existing pagination params extraction ...

  await recordAuditEvent({
    actor_id: user.id,
    actor_email: user.email,
    actor_role: 'admin',
    action: 'admin.user.read',
    target_type: 'profile_list',
    metadata: { page, page_size, search, tier_filter },
    ip_address: req.headers.get('x-forwarded-for')?.split(',')[0]?.trim(),
    user_agent: req.headers.get('user-agent') ?? undefined,
  });

  // ... existing query + return ...
}
```

## Action vocabulary (`docs/architecture/AUDIT_ACTION_VOCABULARY.md`)

Maintain a registry of valid action strings. New actions added here as they're introduced.

```markdown
| Action | Trigger | Actor | Target |
|---|---|---|---|
| auth.signin | successful sign-in | user | profile (self) |
| auth.signout | sign-out | user | profile (self) |
| auth.password_changed | password reset completed | user | profile (self) |
| auth.mfa.enrolled | MFA factor verified | user | profile (self) |
| auth.mfa.unenrolled | MFA factor removed | user | profile (self) |
| account.delete.requested | deletion form submitted | user | profile (self) |
| account.delete.confirmed | confirm email link clicked | user | profile (self) |
| account.delete.executed | scheduled deletion ran | system | profile (target user) |
| account.delete.cancelled | user cancelled before grace expired | user | profile (self) |
| subscription.tier_changed | webhook updated subscription_tier | system | profile (subscriber) |
| subscription.lifetime_granted | lifetime payment processed | system | profile (subscriber) |
| role.granted | admin role assigned | admin | profile (granted to) |
| role.revoked | admin role removed | admin | profile (revoked from) |
| team.invitation.sent | seat invitation email sent | user | profile (invited) |
| team.invitation.accepted | invitation accepted | user | team_membership |
| admin.user.read | admin viewed user list or detail | admin | profile or profile_list |
| admin.metrics.read | admin viewed metrics dashboard | admin | metrics |
| admin.genres.read | admin viewed genres dashboard | admin | genres |
| admin.book.read | admin opened a user's book | admin | book |
| webhook.processed | Stripe webhook successfully handled | system | webhook_event |
| webhook.failed | Stripe webhook handler errored | system | webhook_event |
```

## User-facing audit log view

`app/account/activity/page.tsx` — list events where `target_type = 'profile' AND target_id = self` for the past 90 days. Lets users see "we read your data on date X" for transparency.

## Retention policy

Audit log entries retained 7 years (SOX-style retention; defensive). At 1,000 paying users with average 50 events/user/month, that's 600K rows/year, 4.2M rows over 7 years — comfortably handled by Postgres with the indexes above. If storage becomes an issue, archive >2-year-old rows to Cloudflare R2 cold storage via R-TASK-116.

## Tests Required

- AT-111-1: Migration applies; table exists with all columns + indexes
- AT-111-2: recordAuditEvent inserts a row visible by admin
- AT-111-3: User can read own audit entries via /account/activity
- AT-111-4: User cannot read another user's audit entries (RLS enforced)
- AT-111-5: When actor profile is deleted, audit row persists with actor_id_snapshot intact
- AT-111-6: Admin route /api/admin/users records 'admin.user.read' on every call
- AT-111-7: Audit failure does NOT cause originating request to fail (test by simulating DB error)

## Session Notes
_(Filled by Claude Code during implementation)_
