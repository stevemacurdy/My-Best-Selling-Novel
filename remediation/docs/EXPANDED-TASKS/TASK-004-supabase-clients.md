<!-- APPLY: REPLACE -->
<!-- Target: docs/TASKS/TASK-004-supabase-clients.md (in original mybsn package) -->
<!-- Backup: docs/EXPANDED-TASKS/backups/TASK-004-supabase-clients.pre-expansion-backup.md -->
<!-- Expanded 2026-05-08 from 106 words to ~880 words via PATCH-3 sub-deliverable B.3. -->

# TASK-004: Supabase Client Library (`lib/supabase/client.ts`, `lib/supabase/server.ts`)

## Status: NOT STARTED
## Priority: CRITICAL
## Phase: 1
## Estimated Sessions: 1
## Dependencies: TASK-001, TASK-003
## Requirements Covered: R2, R9
## Spec Reference: Section 1.4

## Inference Summary

This expanded task replaces the original 106-word TASK-004. Each addition is sourced as follows:

| Addition | Source |
|---|---|
| `@supabase/ssr` for browser + server | Decision #2 stack + Decision #18 (HTTP-only cookie session); current Supabase recommendation |
| Default cookie names (`sb-<project-ref>-auth-token`) | Q-1.5 operator-answer (use default) |
| Service-role exported as `createServiceRoleClient()` | Q-1.6 operator-answer (use default) |
| Re-export `SupabaseClient` type | Q-1.7 operator-answer (use default) |
| Generated types via `supabase gen types typescript` | Q-1.8 operator-answer (use default) |
| `npm run db:types` script | Q-1.8 + TASK-001 npm scripts list |
| Service-role client locked to webhook + cron use only | Decision #3 (webhook is sole source of truth) + WoulfAI rule 10 |

Operator confirmed all questions on 2026-05-08.

## Pre-flight: re-read current state

- View `lib/supabase/client.ts` and `lib/supabase/server.ts` if present from earlier work. If they use the deprecated `@supabase/auth-helpers-nextjs` pattern, this task migrates to `@supabase/ssr` (the current recommendation).
- View `package.json` to confirm `@supabase/ssr` is installed; if only `@supabase/supabase-js` is present, install `@supabase/ssr` first.
- View `types/supabase.ts` — if it doesn't exist, this task includes generating it via `npm run db:types`. The script requires migrations TASK-011 through TASK-015 to have been applied to a Supabase project (local or remote).

## Files to Create/Modify

- `lib/supabase/client.ts` (NEW; browser-side client)
- `lib/supabase/server.ts` (NEW; server-side client + service-role variant)
- `types/supabase.ts` (NEW or REGENERATE; auto-generated from DB schema)
- `package.json` (MODIFY; add `db:types` script if missing)

## Implementation Requirements

### `lib/supabase/client.ts` — browser client

Used in client components (`'use client'`). Authenticates via the session cookie set by middleware (TASK-007). Default cookie names per Q-1.5; no customization.

```typescript
'use client';
import { createBrowserClient } from '@supabase/ssr';
import type { Database } from '@/types/supabase';

export function createClient() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}
```

The factory is called per component-render that needs DB access. `@supabase/ssr` internally handles cookie sync; multiple `createClient()` calls share the underlying session state via the cookie.

### `lib/supabase/server.ts` — server client + service-role variant

Used in server components, route handlers, and server actions. Two factories:

```typescript
import { createServerClient } from '@supabase/ssr';
import { createClient as createBareClient, type SupabaseClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';
import type { Database } from '@/types/supabase';

// Re-export type per Q-1.7 default; consumers import `SupabaseClient` from this file
// rather than `@supabase/supabase-js` directly.
export type { SupabaseClient } from '@supabase/supabase-js';

export function createClient() {
  const cookieStore = cookies();
  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) { return cookieStore.get(name)?.value; },
        set(name: string, value: string, options) {
          try { cookieStore.set({ name, value, ...options }); } catch { /* server component: no-op; middleware refreshes the cookie */ }
        },
        remove(name: string, options) {
          try { cookieStore.set({ name, value: '', ...options }); } catch { /* see set */ }
        },
      },
    },
  );
}

/**
 * Service-role client. Bypasses RLS — bypasses every per-user check.
 * USE ONLY in:
 *   - app/api/stripe/webhook/route.ts (Decision #3 — webhook is sole source of truth for tier)
 *   - app/api/cron/* (cron jobs that aggregate across users, e.g. period-end-rollover)
 * NEVER use in:
 *   - any user-facing route (use createClient() instead so RLS protects user data)
 *   - any client component
 * Surfacing `SUPABASE_SERVICE_ROLE_KEY` to the client bundle bypasses every security
 * boundary in the system.
 */
export function createServiceRoleClient(): SupabaseClient<Database> {
  return createBareClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } },
  );
}
```

The `try/catch` around cookie writes is per `@supabase/ssr` documentation: server components can't write cookies (Next.js limitation), but middleware refreshes the cookie on each request, so the no-op is safe in practice.

### Database type generation

Generate `types/supabase.ts` once migrations 011–015 (TASK-011 through TASK-015) have been applied:

```bash
# Add to package.json scripts:
"db:types": "supabase gen types typescript --project-id YOUR_PROJECT_REF > types/supabase.ts"
```

Run after every migration to keep types in sync. CI gates can include `npm run db:types && git diff --exit-code types/supabase.ts` to prevent the schema and types from drifting.

For local development against `supabase start` instead of remote:

```bash
"db:types:local": "supabase gen types typescript --local > types/supabase.ts"
```

The generated file declares a `Database` interface; both `createBrowserClient<Database>(...)` and `createServerClient<Database>(...)` consume it for compile-time table/column safety.

### Service-role enforcement (mechanical)

Per WoulfAI rule 10 + Decision #3, `createServiceRoleClient()` should appear in only two places: the Stripe webhook handler and cron job route handlers. Add a CI lint to catch drift:

```bash
# Custom lint script — call from npm run lint:service-role
grep -rn "createServiceRoleClient" app/ lib/ \
  | grep -v "lib/supabase/server.ts" \
  | grep -vE "app/api/stripe/webhook/route.ts|app/api/cron/" \
  && echo "ERROR: createServiceRoleClient used outside allowed scope" && exit 1
exit 0
```

Wire the lint into the npm scripts list and run from CI.

## What this task does NOT do

- Does NOT implement `verifyToken` or `verifyAdmin` — those live in `lib/api-auth.ts` (TASK-006, already expanded)
- Does NOT instantiate clients at module level — every export is a factory; matches Decision #10 lazy SDK pattern
- Does NOT cache clients across requests — each request creates a fresh client to ensure cookie state is current

## Tests Required

- AT-009: `import { createClient } from '@/lib/supabase/client'` returns a client without throwing
- AT-010: `import { createClient } from '@/lib/supabase/server'` returns a client; cookie reads work in a server component
- AT-011: `createServiceRoleClient()` returns a client with admin scope (can SELECT from a row that RLS would otherwise block)
- AT-012: `types/supabase.ts` exists and exports a `Database` type with all current tables (profiles, books, chapters, audio_chunks, subscriptions, ai_usage_logs, etc.)
- AT-013: Mechanical service-role lint: `createServiceRoleClient` referenced only in `lib/supabase/server.ts` (declaration), `app/api/stripe/webhook/route.ts`, and `app/api/cron/*/route.ts` (zero other references)

## Session Notes
_(Filled by Claude Code during implementation)_

<!-- v4.1 spec correction 2026-05-09: lib/supabase/server.ts patched off deprecated { get, set, remove } cookie API onto current { getAll, setAll } pattern, matching TASK-007 middleware. -->
