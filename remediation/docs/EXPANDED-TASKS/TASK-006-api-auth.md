<!-- APPLY: REPLACE -->
<!-- Target: docs/TASKS/TASK-006-api-auth.md (in original mybsn package) -->
<!-- Backup: docs/EXPANDED-TASKS/backups/TASK-006-api-auth.pre-expansion-backup.md -->
<!-- Expanded 2026-05-06 from 123 words to ~1050 words via PATCH-3 sub-deliverable B.3. -->

# TASK-006: API Authentication Library (`lib/api-auth.ts`)

## Status: NOT STARTED
## Priority: CRITICAL
## Phase: 2
## Estimated Sessions: 2
## Dependencies: TASK-004
## Requirements Covered: R2, R10
## Spec Reference: Section 2.1

## Inference Summary

This expanded task replaces the original 123-word TASK-006. Each addition is sourced as follows:

| Addition | Source |
|---|---|
| Single shared `verifyToken` | ENGINEERING_DECISIONS Decision #9 |
| Bearer token from Authorization header | Decision #2 stack (Supabase) |
| `AuthUser` shape with profile fields | Decision #16 RLS + neighboring TASK-011 (profiles migration) |
| `mfa_verified` field on AuthUser | Q-2.1 operator-answer (use default — return AuthUser with mfa_verified, route handlers decide) |
| Audit logging policy (sensitive actions only) | Q-2.2 operator-answer (use default); R-TASK-111 |
| Rate-limit lives outside verifyToken | Q-2.3 operator-answer (use default); R-TASK-104 |
| Profile-not-found race handling | WoulfAI rule 12 (centralize auth helpers) |
| Service-role client usage rules | TASK-004 spec; Decision #3 (webhook only) |

Operator confirmed all questions on 2026-05-06.

## Pre-flight: re-read current state

Before making any change:
- View `lib/api-auth.ts` if present. If it already contains `verifyToken`, scope this task to whatever helpers are missing (e.g., `verifyAdmin`, `requireSuperAdmin`).
- View 2-3 files in `app/api/*/route.ts` to confirm whether routes are currently calling a helper from this lib or duplicating auth logic locally. Per WoulfAI Rule 12, duplicates are strictly forbidden — if any duplicates exist, this task includes consolidating them.
- Confirm `@supabase/ssr` and `@supabase/supabase-js` are installed (TASK-004 dependency).

## Files to Create/Modify

- `lib/api-auth.ts` (NEW)
- Optional: `__tests__/lib/api-auth.test.ts` (deferred to R-TASK-130 testing baseline if Vitest not yet installed)

## Implementation Requirements

### Public API surface

```typescript
// lib/api-auth.ts

export type UserRole = 'user' | 'admin' | 'super_admin';

export interface AuthUser {
  id: string;
  email: string;
  full_name: string | null;
  role: UserRole;
  mfa_verified: boolean;
  subscription_tier: 'explorer' | 'author' | 'publisher';
  subscription_status: 'free' | 'active' | 'past_due' | 'cancelled';
}

export async function verifyToken(req: NextRequest): Promise<AuthUser | null>;
export async function verifyAdmin(req: NextRequest): Promise<{ authorized: true; user: AuthUser } | { authorized: false; error: string; status: number }>;
export async function verifySuperAdmin(req: NextRequest): Promise<{ authorized: true; user: AuthUser } | { authorized: false; error: string; status: number }>;
```

### `verifyToken` implementation

1. Extract bearer token from `Authorization: Bearer <token>` header. If missing or malformed, return `null`. Do not throw.
2. Create Supabase server client via `createServerClient` from `@supabase/ssr` (per TASK-004), passing the bearer token via the `accessToken` option.
3. Call `sb.auth.getUser()`. If error or no user, return `null`.
4. Fetch profile row: `sb.from('profiles').select('id, email, full_name, role, subscription_tier, subscription_status').eq('id', user.id).single()`.
5. **Profile-not-found race handling:** if profile fetch returns no row but `auth.users` returned a valid user, this is the brief window between `auth.signUp()` succeeding and the profile-creation trigger firing (or a missing migration). Return `null` rather than throwing — caller will see this as "unauthenticated" and the user retries after profile lands. Log to Sentry at `level: 'warning'` (per R-TASK-106) so the operator can investigate sustained occurrences.
6. **MFA verification check:** Supabase Auth's session token records the AAL (Authentication Assurance Level). Read `user.aal` from `getUser()` response; `mfa_verified = (user.aal === 'aal2')` for users who have MFA enrolled. Users without MFA enrolled return `mfa_verified = true` (vacuously — there's no MFA to verify). The boolean represents "did this session pass MFA if MFA was required for this account?"
7. Return composed `AuthUser` object.

`verifyToken` does NOT call rate-limit (Q-2.3) and does NOT write to `audit_event_log` (Q-2.2). Those concerns live in middleware (rate-limit per route) and route handlers (audit log per sensitive action).

### `verifyAdmin` implementation

1. Call `verifyToken(req)`. If null, return `{ authorized: false, error: 'unauthenticated', status: 401 }`.
2. If `user.role !== 'admin' && user.role !== 'super_admin'`, return `{ authorized: false, error: 'forbidden', status: 403 }`.
3. **MFA enforcement (Q-2.14 default):** if `!user.mfa_verified`, return `{ authorized: false, error: 'mfa_required', status: 403 }`. Caller should redirect operator to `/account/mfa` to enroll/challenge.
4. Otherwise return `{ authorized: true, user }`.

### `verifySuperAdmin` implementation

Identical to `verifyAdmin` but requires `user.role === 'super_admin'` exactly (admin role does not pass).

### Profile-fetch performance

The profile fetch happens on every authenticated request. This adds ~5–10 ms per call against Supabase. Acceptable at v1 scale (<5K users). If this becomes a hot path, R-TASK-104 (rate limiting) work introduces an Upstash Redis layer that can also cache profile snapshots; that optimization is out of scope here.

### Service-role client (clarification)

`lib/api-auth.ts` uses the **anon-key client** (the user's access token authenticates the request and RLS is enforced). The service-role client is used **only by `/api/stripe/webhook/route.ts`** per Decision #3 (webhook is sole source of truth for subscription tier and needs to bypass RLS to write `subscriptions`). No other route handler should import the service-role client. If you find another route doing so, surface it as a security concern and refer to R-TASK-145 auth hardening.

### Test fixtures (when R-TASK-130 lands)

When the test suite is built, `lib/api-auth.test.ts` should cover at minimum:
- Valid bearer + valid profile → returns AuthUser
- Missing Authorization header → returns null
- Malformed token → returns null
- Valid bearer + missing profile → returns null and logs to Sentry
- Admin role without MFA → `verifyAdmin` returns `{ status: 403, error: 'mfa_required' }`
- Admin role with MFA → `verifyAdmin` returns `{ authorized: true }`

## Tests Required

- AT-010: `lib/api-auth.ts` exports `verifyToken`, `verifyAdmin`, `verifySuperAdmin`, and `AuthUser` type
- AT-011: Calling `verifyToken` with no Authorization header returns null (not thrown)
- AT-012: Calling `verifyToken` with valid bearer but missing profile row returns null and writes a Sentry warning
- AT-013: Mechanical check: no other file in `app/api/*/route.ts` declares a local `verifyToken` or equivalent helper (per WoulfAI Rule 12). Run: `grep -rn "function verifyToken\|function verifyAdmin\|function isAuth" app/ | grep -v 'lib/api-auth.ts'` — must return zero results.

## Session Notes
_(Filled by Claude Code during implementation)_

<!-- v4.1 spec correction 2026-05-09: AAL is read via auth.mfa.getAuthenticatorAssuranceLevel(), not user.aal field; user.aal does not exist on the SDK User type. Q-2.1 vacuous-true semantics for unenrolled users are preserved. -->
