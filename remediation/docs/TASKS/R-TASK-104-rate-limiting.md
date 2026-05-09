<!-- APPLY: CREATE -->
# R-TASK-104: Rate Limiting (Upstash Redis) on Cost + Auth Endpoints

## Status: NOT STARTED
## Priority: CRITICAL
## Phase: 11
## Estimated Sessions: 2
## Dependencies: TASK-005, TASK-006
## Resolves Gaps: GAP-021
## Spec Reference: AUDIT_REPORT.md CRITICAL section

## Pre-flight: re-read current state

Before making any change, read the current state of every file listed in "Files to Modify" below. Verify the gap(s) addressed by this task are still present in the current code. Specifically:

- For each file in "Files to Modify": view the file and confirm the condition the audit observed (e.g., "no rate limiting on /api/ai") still applies.
- For each gap in "Resolves Gaps": confirm the gap remains open. The audit was conducted on 2026-05-04; if the codebase changed since, the gap may have been partially or fully addressed.
- If a gap is no longer present, report this finding in PROGRESS.md, mark this task as superseded, and stop. Do not make changes.
- If a gap is partially addressed, scope this task to the remaining work and document in this file's Session Notes what was already addressed and skipped.
- If the gap is still fully present as the audit described, proceed with the rest of this task.

This pre-flight catches the case where the codebase changed between audit and remediation — exactly the failure mode that produces silent overwrites of unrelated work.

## Files to Create

- `lib/ratelimit.ts` — wrapper around `@upstash/ratelimit` with per-route limit definitions
- `lib/redis.ts` — lazy Upstash Redis client
- `docs/runbooks/rate-limit-tuning.md` — how to adjust limits as traffic shapes emerge

## Files to Modify

- `app/api/ai/route.ts` (TASK-021) — add rate limit check at top: 10 calls/min/user, 60 calls/hr/user
- `app/api/stripe/checkout/route.ts` (TASK-022) — add rate limit: 5 checkouts/hr/user
- `app/api/books/route.ts` (TASK-017) — POST: add rate limit 30 books/day/user (prevents accidental loop creation)
- `app/api/audio/[bookId]/[chapterIdx]/route.ts` (TASK-019) — PUT: add rate limit 60 uploads/hr/user
- `middleware.ts` (TASK-007) — add rate limit on auth endpoints: signup 3/hr/IP, signin 10/min/IP, password reset 5/hr/IP
- `.env.local.example` (TASK-003) — add UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN
- `package.json` (TASK-001) — add `@upstash/redis` and `@upstash/ratelimit`

## Implementation Requirements

### Vendor choice

**Upstash Redis** (https://upstash.com) — serverless Redis with HTTP API; works inside Vercel Edge functions; free tier covers 10,000 commands/day. At 1,000 paying users averaging 100 AI calls/month, you're at ~3,300 daily commands — comfortably free. Above 10K commands/day, $0.20/100K commands.

Alternatives considered:
- Vercel KV (now Upstash-backed; same vendor, different billing wrapper) — fine, slightly more expensive at scale
- DIY with Postgres advisory locks — works but adds DB pressure and rate-limit becomes correlated with DB outages
- Cloudflare D1 + Workers — best at edge but introduces a second platform

### Limit definitions

```typescript
// lib/ratelimit.ts
import { Ratelimit } from '@upstash/ratelimit';
import { getRedis } from '@/lib/redis';

export const limits = {
  ai_per_minute: new Ratelimit({
    redis: getRedis(),
    limiter: Ratelimit.slidingWindow(10, '1 m'),
    analytics: true,
    prefix: 'rl:ai:min',
  }),
  ai_per_hour: new Ratelimit({
    redis: getRedis(),
    limiter: Ratelimit.slidingWindow(60, '1 h'),
    analytics: true,
    prefix: 'rl:ai:hr',
  }),
  checkout: new Ratelimit({
    redis: getRedis(),
    limiter: Ratelimit.slidingWindow(5, '1 h'),
    analytics: true,
    prefix: 'rl:co',
  }),
  books_create: new Ratelimit({
    redis: getRedis(),
    limiter: Ratelimit.slidingWindow(30, '1 d'),
    analytics: true,
    prefix: 'rl:books',
  }),
  audio_upload: new Ratelimit({
    redis: getRedis(),
    limiter: Ratelimit.slidingWindow(60, '1 h'),
    analytics: true,
    prefix: 'rl:audio',
  }),
  signup: new Ratelimit({
    redis: getRedis(),
    limiter: Ratelimit.slidingWindow(3, '1 h'),
    analytics: true,
    prefix: 'rl:signup',
  }),
  signin: new Ratelimit({
    redis: getRedis(),
    limiter: Ratelimit.slidingWindow(10, '1 m'),
    analytics: true,
    prefix: 'rl:signin',
  }),
  password_reset: new Ratelimit({
    redis: getRedis(),
    limiter: Ratelimit.slidingWindow(5, '1 h'),
    analytics: true,
    prefix: 'rl:pwreset',
  }),
};

export async function checkLimit(
  limit: Ratelimit,
  identifier: string
): Promise<{ ok: boolean; remaining: number; reset: number; limit: number }> {
  const result = await limit.limit(identifier);
  return {
    ok: result.success,
    remaining: result.remaining,
    reset: result.reset,
    limit: result.limit,
  };
}
```

### Per-route integration pattern

```typescript
// app/api/ai/route.ts (PATCH addition near top of POST handler)
import { limits, checkLimit } from '@/lib/ratelimit';

export async function POST(req: NextRequest) {
  const user = await verifyToken(req);
  if (!user) return unauthorized();

  // Rate limit BEFORE counting toward monthly quota
  const minCheck = await checkLimit(limits.ai_per_minute, user.id);
  if (!minCheck.ok) {
    return NextResponse.json(
      { error: 'rate_limit_exceeded', scope: 'minute', retry_after_seconds: Math.ceil((minCheck.reset - Date.now()) / 1000) },
      { status: 429, headers: { 'Retry-After': String(Math.ceil((minCheck.reset - Date.now()) / 1000)) } }
    );
  }
  const hrCheck = await checkLimit(limits.ai_per_hour, user.id);
  if (!hrCheck.ok) {
    return NextResponse.json(
      { error: 'rate_limit_exceeded', scope: 'hour', retry_after_seconds: Math.ceil((hrCheck.reset - Date.now()) / 1000) },
      { status: 429, headers: { 'Retry-After': String(Math.ceil((hrCheck.reset - Date.now()) / 1000)) } }
    );
  }

  // ... existing tier limit check, body parse, Claude call, log, increment
}
```

### IP-based limits for unauthenticated routes

For signup, signin, password reset — there is no user.id. Use `request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown'` as the identifier. Vercel sets x-forwarded-for; the first entry is the client IP. Note that this is spoof-able at the application layer — for serious abuse, layer on a Vercel WAF rule (paid Vercel feature) or Cloudflare in front.

### Headers returned

Per RFC 6585, every response from a rate-limited route should include:
- `X-RateLimit-Limit: 10`
- `X-RateLimit-Remaining: 7`
- `X-RateLimit-Reset: 1714867200` (Unix timestamp)

Add these headers via response middleware or directly in the route handler.

### Client-side handling

Modify `components/agent/ai.ts` to handle 429 specifically:
```typescript
if (response.status === 429) {
  const retry = parseInt(response.headers.get('Retry-After') ?? '60', 10);
  throw new RateLimitError(`Slow down — try again in ${retry} seconds`, retry);
}
```

The agent UI should show this message inline in the relevant step instead of a generic error.

## Tests Required

- AT-104-1: 11th /api/ai call within 60 seconds returns 429 with Retry-After header
- AT-104-2: Wait beyond Retry-After period; next call succeeds
- AT-104-3: User A's rate limit doesn't affect user B (per-user identifier verified)
- AT-104-4: Signup attempts from same IP exceed 3/hr → 429
- AT-104-5: Headers include X-RateLimit-Limit/Remaining/Reset on success and 429
- AT-104-6: Upstash analytics dashboard shows rate-limit hits

## Tuning Notes

After 30 days post-launch, review Upstash analytics. Tune limits based on:
- Median user's actual call rate (set limit at p99 + 50% margin)
- Abuse patterns (any user hitting limits frequently → investigate)
- Cost: each rate-limit check is 1 Redis command; at 100K daily calls, $0.20/day extra

## Session Notes
_(Filled by Claude Code during implementation)_
