<!-- APPLY: REPLACE -->
<!-- Target: docs/TASKS/TASK-007-middleware.md (in original mybsn package) -->
<!-- Backup: docs/EXPANDED-TASKS/backups/TASK-007-middleware.pre-expansion-backup.md -->
<!-- Expanded 2026-05-06 from 76 words to ~900 words via PATCH-3 sub-deliverable B.3. -->

# TASK-007: Next.js Middleware (auth refresh + public-route whitelist)

## Status: NOT STARTED
## Priority: CRITICAL
## Phase: 2
## Estimated Sessions: 1
## Dependencies: TASK-004, TASK-006
## Requirements Covered: R2
## Spec Reference: Section 2.2

## Inference Summary

This expanded task replaces the original 76-word TASK-007. Each addition is sourced as follows:

| Addition | Source |
|---|---|
| Edge Runtime + `@supabase/ssr` cookie refresh | Decision #18 (HTTP-only cookie session); Next.js 14 middleware conventions |
| Public routes whitelist | Q-2.4 operator-answer (use default) + R-TASK-119 legal manifest |
| Rate-limit lives in middleware for global/per-IP limits | Q-2.3 + Q-2.5 operator-answers; R-TASK-104 |
| User-id header forwarding NOT done (re-auth in routes) | Q-2.6 operator-answer (use default — re-auth in routes for security) |
| Edge Runtime + Upstash compatibility | Q-2.5 confirmed |
| Redirect-to-signin with `returnTo` param | standard SaaS pattern + Q-2.4 default |

Operator confirmed all questions on 2026-05-06.

## Pre-flight: re-read current state

- View `middleware.ts` if present. If it already does cookie refresh but lacks rate-limiting or whitelist enforcement, scope this task to the deltas.
- View `lib/ratelimit.ts` — must exist (per R-TASK-104). If R-104 hasn't shipped yet, this task ships without rate-limit calls and a follow-up integrates them.
- Confirm `@supabase/ssr` is installed.

## Files to Create/Modify

- `middleware.ts` (NEW; lives at the project root, not under `app/`)
- `lib/middleware-helpers.ts` (NEW; small helpers for whitelist matching)

## Implementation Requirements

### Public routes whitelist (Q-2.4 default)

```typescript
// lib/middleware-helpers.ts
const PUBLIC_PATH_PREFIXES = [
  '/',                      // landing
  '/pricing',
  '/tour',
  '/signin',
  '/signup',
  '/forgot-password',
  '/reset-password',
  '/terms',                 // ToS (TASK-057)
  '/privacy',               // Privacy Policy (TASK-057)
  '/aup',                   // Acceptable Use Policy (R-TASK-119; AUP also summarized inline in ToS per Q-8.4 = (a))
  '/refunds',               // (R-TASK-119)
  '/cookies',               // (R-TASK-119)
  '/dmca',                  // (R-TASK-119)
  '/ai-disclosure',         // (R-TASK-119)
  '/vuln-disclosure',       // (R-TASK-119)
  '/a11y-statement',        // (R-TASK-119)
  '/api/health',            // PATCH-003
  '/api/stripe/webhook',    // signature-verified by Stripe; not session-auth
];

export function isPublicPath(pathname: string): boolean {
  // Exact match for `/` only; everything else is prefix match
  if (pathname === '/') return true;
  return PUBLIC_PATH_PREFIXES.some((p) => p !== '/' && (pathname === p || pathname.startsWith(p + '/')));
}
```

Future: when R-TASK-104 wires per-route rate-limit policies, this whitelist is extended with rate-limit metadata (e.g., `/api/ai` = 5/min/user, `/api/signup` = 3/hour/IP).

### `middleware.ts` — Edge-Runtime-compatible

```typescript
import { NextResponse, type NextRequest } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { isPublicPath } from '@/lib/middleware-helpers';
import { ipRateLimit } from '@/lib/ratelimit';  // R-TASK-104

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // 1. Per-IP rate limit (only on a few high-abuse paths to avoid unnecessary Redis calls).
  // Per Q-2.3 default, route-level per-user limits live in the route handler, not here.
  if (pathname === '/signup' || pathname === '/api/signup' || pathname === '/api/signin') {
    const allowed = await ipRateLimit(req.ip ?? 'unknown', `route:${pathname}`);
    if (!allowed) return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
  }

  // 2. Public path → no auth check
  if (isPublicPath(pathname)) {
    return NextResponse.next();
  }

  // 3. Auth check + cookie refresh via @supabase/ssr
  const res = NextResponse.next();
  const sb = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get: (name) => req.cookies.get(name)?.value,
        set: (name, value, opts) => res.cookies.set({ name, value, ...opts }),
        remove: (name, opts) => res.cookies.set({ name, value: '', ...opts }),
      },
    },
  );
  const { data: { user } } = await sb.auth.getUser();

  // 4. Unauthenticated → redirect to /signin with returnTo
  if (!user) {
    const url = req.nextUrl.clone();
    url.pathname = '/signin';
    url.searchParams.set('returnTo', pathname);
    return NextResponse.redirect(url);
  }

  // 5. Authenticated. Per Q-2.6, no header forwarding — routes re-call verifyToken.
  return res;
}

export const config = {
  matcher: [
    // Run middleware on everything except static assets and the Next.js internals.
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|css|js|ico)$).*)',
  ],
};
```

### Edge Runtime constraint (Q-2.5 confirmed)

The middleware runs on Vercel's Edge Runtime, which forbids Node.js-only modules (`fs`, `path`, `crypto.createHash` etc.). `@supabase/ssr` is Edge-compatible. `@upstash/ratelimit` is Edge-compatible (uses fetch-based REST API). If a future helper needs Node-only APIs, it cannot live here — it has to move to a route handler with `runtime = 'nodejs'`.

Verify this concretely on first deploy: deploy to a Vercel preview environment and confirm the middleware bundle size is under Vercel's Edge Function limit (1 MB compressed; the typical bundle for this middleware is ~200 KB).

### Why no header forwarding (Q-2.6)

Some patterns set `x-user-id` and `x-user-role` headers in middleware after auth, then trust those headers in route handlers. This skips a profile fetch per route (~5–10 ms saved). However:

- Headers are spoofable inside the app if any code path bypasses middleware (rare but exists — direct route invocation in tests, internal fetch calls)
- The performance gain is small and disappears once R-TASK-104's caching layer lands
- The trust boundary is cleaner if every route independently re-validates

Per Q-2.6 default, **routes re-call `verifyToken`**. Middleware does session refresh and gates static pages; routes do final auth.

### What this task does NOT do

- Does NOT enforce admin-only routes — that's `verifyAdmin` in API routes and `<AdminGuard>` in app pages (TASK-010)
- Does NOT enforce subscription-tier gating — that's `lib/subscription.ts` checks in route handlers (TASK-016)
- Does NOT enforce MFA — `verifyAdmin` in TASK-006 returns 403 'mfa_required' for admin routes; middleware just keeps you authenticated

## Tests Required

- AT-014: Public path (`/`, `/pricing`, `/api/health`) returns 200 without authorization header
- AT-015: Protected path (`/app`, `/account`, `/admin`) without session redirects to `/signin?returnTo=...`
- AT-016: Protected path with valid session returns 200
- AT-017: 4 requests in 60 seconds to `/signup` from same IP — 4th returns 429 (rate limit)
- AT-018: Middleware bundle size in Vercel preview is under 1 MB compressed

## Session Notes
_(Filled by Claude Code during implementation)_
