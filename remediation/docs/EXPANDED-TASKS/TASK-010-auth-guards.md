<!-- APPLY: REPLACE -->
<!-- Target: docs/TASKS/TASK-010-auth-guards.md (in original mybsn package) -->
<!-- Backup: docs/EXPANDED-TASKS/backups/TASK-010-auth-guards.pre-expansion-backup.md -->
<!-- Expanded 2026-05-06 from 93 words to ~970 words via PATCH-3 sub-deliverable B.3. -->

# TASK-010: Authentication & Authorization Guards

## Status: NOT STARTED
## Priority: CRITICAL
## Phase: 2
## Estimated Sessions: 1
## Dependencies: TASK-006, TASK-007
## Requirements Covered: R2, R10
## Spec Reference: Section 2.4

## Inference Summary

This expanded task replaces the original 93-word TASK-010. Each addition is sourced as follows:

| Addition | Source |
|---|---|
| Single `AdminGuard` with `requireSuperAdmin` prop | Q-2.13 operator-answer (use default) |
| AdminGuard auto-enforces MFA-verified | Q-2.14 operator-answer (use default) |
| Both client and server enforcement layers | Q-2.15 operator-answer (use default) |
| Layout-skeleton loading UX | Q-2.16 operator-answer (use default) |
| Server helpers (`requireAuth`, `requireAdmin`, `requireSuperAdmin`) live in `lib/api-auth.ts` | TASK-006 expansion + WoulfAI rule 12 |
| super_admin role definition | R-TASK-113 |
| MFA enrollment redirect target `/account/mfa` | R-TASK-103 |

Operator confirmed all questions on 2026-05-06.

## Pre-flight: re-read current state

- View `components/AuthGuard.tsx` and `components/AdminGuard.tsx` if present. If they already exist but lack the `requireSuperAdmin` prop or MFA-verified enforcement, scope this task to the deltas.
- View `app/(app)/layout.tsx` and `app/admin/layout.tsx` to confirm whether guards are already wired.
- Confirm `lib/api-auth.ts` (TASK-006) has `verifyAdmin` and `verifySuperAdmin` helpers in place.

## Files to Create/Modify

- `components/AuthGuard.tsx` (NEW)
- `components/AdminGuard.tsx` (NEW)
- `components/guards/Skeleton.tsx` (NEW; shared loading-state skeleton)
- `lib/api-auth.ts` (MODIFY; add `requireAuth`, `requireAdmin`, `requireSuperAdmin` server helpers if not already present from TASK-006)

## Implementation Requirements

### `<AuthGuard>` — client wrapper for protected layouts

```tsx
'use client';
import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { createBrowserClient } from '@supabase/ssr';
import Skeleton from './guards/Skeleton';

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<'loading' | 'authenticated' | 'unauthenticated'>('loading');
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const sb = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    );
    sb.auth.getUser().then(({ data: { user } }) => {
      if (user) setState('authenticated');
      else {
        setState('unauthenticated');
        router.replace(`/signin?returnTo=${encodeURIComponent(pathname)}`);
      }
    });
    const { data: { subscription } } = sb.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_OUT') {
        router.replace(`/signin?returnTo=${encodeURIComponent(pathname)}`);
      }
    });
    return () => subscription.unsubscribe();
  }, [router, pathname]);

  if (state === 'loading') return <Skeleton />;
  if (state === 'unauthenticated') return null; // redirect in flight
  return <>{children}</>;
}
```

`<AuthGuard>` wraps `app/(app)/layout.tsx` and `app/account/layout.tsx`. The skeleton shows the header + sidebar shell with placeholder content blocks; less jarring than a full-page spinner per Q-2.16.

### `<AdminGuard>` — admin or super_admin, with MFA enforcement

```tsx
'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createBrowserClient } from '@supabase/ssr';
import Skeleton from './guards/Skeleton';

interface AdminGuardProps {
  children: React.ReactNode;
  requireSuperAdmin?: boolean;
}

export default function AdminGuard({ children, requireSuperAdmin = false }: AdminGuardProps) {
  const [state, setState] = useState<'loading' | 'allowed' | 'redirect'>('loading');
  const router = useRouter();

  useEffect(() => {
    const sb = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    );
    sb.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) { router.replace('/signin'); setState('redirect'); return; }
      // MFA enforcement (Q-2.14): admins require aal2
      if (user.aal !== 'aal2') { router.replace('/account/mfa'); setState('redirect'); return; }
      // Role check
      const { data: profile } = await sb.from('profiles').select('role').eq('id', user.id).single();
      const role = profile?.role;
      if (requireSuperAdmin && role !== 'super_admin') { router.replace('/'); setState('redirect'); return; }
      if (!requireSuperAdmin && role !== 'admin' && role !== 'super_admin') { router.replace('/'); setState('redirect'); return; }
      setState('allowed');
    });
  }, [router, requireSuperAdmin]);

  if (state === 'loading') return <Skeleton />;
  if (state === 'redirect') return null;
  return <>{children}</>;
}
```

Per Q-2.13 default, **single component with `requireSuperAdmin` prop**, not two separate components. Default behavior (no prop) = admin OR super_admin both pass; with the prop = super_admin only.

Per Q-2.14 default, AdminGuard auto-enforces MFA. The redirect to `/account/mfa` covers both "MFA not enrolled" and "MFA enrolled but not verified this session" — `/account/mfa` route (R-TASK-103) handles both cases.

### Server helpers (in `lib/api-auth.ts` — confirm or add)

TASK-006 already specifies `verifyToken`, `verifyAdmin`, `verifySuperAdmin`. Add convenience wrappers that throw (or return Response) for use in server components and route handlers:

```typescript
export async function requireAuth(req: NextRequest): Promise<AuthUser> {
  const user = await verifyToken(req);
  if (!user) throw new Response(null, { status: 401 });
  return user;
}

export async function requireAdmin(req: NextRequest): Promise<AuthUser> {
  const result = await verifyAdmin(req);
  if (!result.authorized) throw new Response(JSON.stringify({ error: result.error }), { status: result.status });
  return result.user;
}

export async function requireSuperAdmin(req: NextRequest): Promise<AuthUser> {
  const result = await verifySuperAdmin(req);
  if (!result.authorized) throw new Response(JSON.stringify({ error: result.error }), { status: result.status });
  return result.user;
}
```

Server components (e.g., `app/admin/page.tsx`) call `requireAdmin(req)` server-side — the `<AdminGuard>` client wrapper handles the loading/redirect UX, but the server helper enforces the security boundary independently. This is the both-layers approach per Q-2.15.

### `<Skeleton>` shared component

```tsx
export default function Skeleton() {
  return (
    <div className="animate-pulse">
      <div className="h-16 bg-brand-navyLight" /> {/* header */}
      <div className="flex">
        <div className="w-64 h-screen bg-brand-navyDeep" /> {/* sidebar */}
        <div className="flex-1 p-8 space-y-4">
          <div className="h-8 bg-brand-navyLight rounded w-1/3" />
          <div className="h-32 bg-brand-navyLight rounded" />
          <div className="h-32 bg-brand-navyLight rounded" />
        </div>
      </div>
    </div>
  );
}
```

Animation respects `prefers-reduced-motion` via the global CSS rule from TASK-002.

### Route wiring

- `app/(app)/layout.tsx` → wrap children with `<AuthGuard>`
- `app/account/layout.tsx` → wrap with `<AuthGuard>`
- `app/admin/layout.tsx` → wrap with `<AdminGuard>` (no prop = admin or super_admin pass)
- `app/admin/audit/layout.tsx` → wrap with `<AdminGuard requireSuperAdmin>`
- `app/admin/users/[id]/edit/layout.tsx` → wrap with `<AdminGuard requireSuperAdmin>` (per Q-7.5: user mutations are super-admin-only)

Public routes (per TASK-007 whitelist) get NO guard — they're rendered freely.

### What this task does NOT do

- Does NOT enforce subscription tier — that's `lib/subscription.ts` in TASK-016
- Does NOT define a "package access guard" — WoulfAI's `usePackageAccess` hook is platform-specific and not used by mybsn (single-product, not multi-tenant)
- Does NOT replace middleware — middleware (TASK-007) handles session refresh and basic redirect; guards handle role-aware UX

## Tests Required

- AT-022: `<AuthGuard>` redirects unauthenticated user to `/signin?returnTo=...`
- AT-023: `<AdminGuard>` (no prop) allows both admin and super_admin
- AT-024: `<AdminGuard requireSuperAdmin>` allows super_admin only; redirects admin to /
- AT-025: `<AdminGuard>` with MFA-not-verified redirects to `/account/mfa`
- AT-026: Server helper `requireAdmin` throws 401 for missing auth, 403 for non-admin, 403 for MFA-not-verified
- AT-027: Mechanical: no other component implements role-checking logic locally (`grep -rn "role.*admin" components/` should only match AdminGuard)

## Session Notes
_(Filled by Claude Code during implementation)_
