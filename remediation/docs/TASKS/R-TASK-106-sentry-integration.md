<!-- APPLY: CREATE -->
# R-TASK-106: Sentry Integration (Server + Client + Agent)

## Status: NOT STARTED
## Priority: CRITICAL
## Phase: 1 patch (run during existing Phase 1 setup)
## Estimated Sessions: 1
## Dependencies: TASK-001
## Resolves Gaps: GAP-053
## Spec Reference: AUDIT_REPORT.md CRITICAL section

## Pre-flight: re-read current state

Before making any change, read the current state of every file listed in "Files to Modify" below. Verify the gap(s) addressed by this task are still present in the current code. Specifically:

- For each file in "Files to Modify": view the file and confirm the condition the audit observed (e.g., "no rate limiting on /api/ai") still applies.
- For each gap in "Resolves Gaps": confirm the gap remains open. The audit was conducted on 2026-05-04; if the codebase changed since, the gap may have been partially or fully addressed.
- If a gap is no longer present, report this finding in PROGRESS.md, mark this task as superseded, and stop. Do not make changes.
- If a gap is partially addressed, scope this task to the remaining work and document in this file's Session Notes what was already addressed and skipped.
- If the gap is still fully present as the audit described, proceed with the rest of this task.

This pre-flight catches the case where the codebase changed between audit and remediation — exactly the failure mode that produces silent overwrites of unrelated work.

## Why this is a Phase 1 patch, not Phase 11

Sentry integrated at Phase 1 captures errors during the build itself, not just post-launch. Every TASK-027 through TASK-068 implementation session will be instrumented from the start. The cost is one extra TASK in Phase 1; the benefit is that Claude Code's bugs are visible in Sentry the moment they occur in your dev environment.

## Files to Create

- `sentry.client.config.ts`
- `sentry.server.config.ts`
- `sentry.edge.config.ts`
- `instrumentation.ts` (Next.js 15+ instrumentation hook; for 14 use `register()` in same file)
- `app/global-error.tsx` — Sentry-instrumented error boundary at root
- `lib/sentry.ts` — wrapper helpers: `captureException`, `addBreadcrumb`, `setUser`, `setTag`

## Files to Modify

- `package.json` (TASK-001) — add `@sentry/nextjs`
- `next.config.js` (TASK-001) — wrap with `withSentryConfig`
- `.env.local.example` (TASK-003) — add `SENTRY_DSN`, `SENTRY_AUTH_TOKEN`, `NEXT_PUBLIC_SENTRY_DSN`, `SENTRY_ORG`, `SENTRY_PROJECT`
- `app/api/ai/route.ts` (TASK-021) — wrap Claude call in try/catch with Sentry capture
- `app/api/stripe/webhook/route.ts` (TASK-024) — capture every error before returning 500
- **(Deletion gate — confirm before executing)** `components/ErrorBoundary.tsx` (TASK-059) — replace `console.error` with `Sentry.captureException`; preserve UI fallback. Surface the existing `console.error` line(s) to the operator before removal; wait for explicit "confirm deletion" reply before proceeding. Log confirmation in this task's Session Notes.
- `components/agent/ai.ts` (TASK-030) — capture API failures before throwing

## Implementation Requirements

### Vendor choice

**Sentry** (https://sentry.io) — industry standard. Team plan $26/mo (50K errors/mo, 14-day retention) is appropriate for SaaS-at-scale launch. Free tier exists (5K errors/mo) for pre-launch.

Alternatives considered:
- Honeybadger — solid alternative, similar pricing
- Bugsnag — similar
- Self-hosted GlitchTip (Sentry-compatible) — works on Fly.io for $5/mo, lower features

### Sentry organization setup

1. Create Sentry account; create project named `mybestsellingnovel-prod` (Next.js platform)
2. Create separate project `mybestsellingnovel-staging` for the staging environment created by R-TASK-122
3. Generate auth token at Settings → Auth Tokens with scopes: `project:releases`, `project:read`, `org:read`
4. Set environment variables on Vercel project (Production + Preview): SENTRY_DSN, SENTRY_AUTH_TOKEN, NEXT_PUBLIC_SENTRY_DSN, SENTRY_ORG=woulfai, SENTRY_PROJECT=mybestsellingnovel-prod

### Sentry config (server, client, edge)

```typescript
// sentry.server.config.ts
import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.VERCEL_ENV ?? 'development',
  tracesSampleRate: 0.1,
  // Strip PII before send — manuscript content must never reach Sentry
  beforeSend(event, hint) {
    // Remove request body — may contain manuscript text
    if (event.request) {
      delete event.request.data;
      delete event.request.cookies;
    }
    // Remove user email; keep user.id only
    if (event.user) {
      delete event.user.email;
      delete event.user.username;
    }
    return event;
  },
  // Don't send breadcrumbs that include manuscript snippets
  beforeBreadcrumb(breadcrumb) {
    if (breadcrumb.category === 'fetch' && breadcrumb.data?.url?.includes('/api/ai')) {
      delete breadcrumb.data.body;
    }
    return breadcrumb;
  },
});
```

```typescript
// sentry.client.config.ts (analogous, with Replay disabled — Replay would capture manuscript text)
import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  environment: process.env.NEXT_PUBLIC_VERCEL_ENV ?? 'development',
  tracesSampleRate: 0.1,
  // Replay DISABLED — would capture user's draft manuscripts
  replaysSessionSampleRate: 0,
  replaysOnErrorSampleRate: 0,
  beforeSend(event) {
    if (event.request) delete event.request.data;
    if (event.user) {
      delete event.user.email;
      delete event.user.username;
    }
    return event;
  },
});
```

### PII scrubbing — critical for this product

Manuscripts are user IP. They must NEVER reach Sentry. The `beforeSend` hooks above:
- Strip request bodies (which may include /api/ai prompt = manuscript context)
- Strip user email (keep only user.id for correlation)
- Strip cookies (Supabase session token)
- Disable Session Replay entirely (would record DOM containing draft text)

### User tagging

In `lib/sentry.ts`:
```typescript
import * as Sentry from '@sentry/nextjs';

export function tagSentryUser(user: { id: string; tier?: string; role?: string }) {
  Sentry.setUser({ id: user.id });
  if (user.tier) Sentry.setTag('tier', user.tier);
  if (user.role) Sentry.setTag('role', user.role);
}

export function captureWithContext(error: unknown, context: Record<string, unknown>) {
  Sentry.withScope(scope => {
    Object.entries(context).forEach(([k, v]) => scope.setExtra(k, v));
    Sentry.captureException(error);
  });
}
```

Call `tagSentryUser` after `verifyToken` in API routes and after auth state hydration in client.

### Source maps

Vercel build with `withSentryConfig` automatically uploads source maps to Sentry on each deploy (using SENTRY_AUTH_TOKEN). Stack traces in Sentry will show original TypeScript filenames + line numbers, not minified bundle output.

### Release tracking

Vercel deploy ID becomes Sentry release name. In `next.config.js`:
```javascript
const { withSentryConfig } = require('@sentry/nextjs');

module.exports = withSentryConfig({
  // existing next config
}, {
  org: 'woulfai',
  project: 'mybestsellingnovel-prod',
  silent: !process.env.CI,
  release: process.env.VERCEL_GIT_COMMIT_SHA,
});
```

## Tests Required

- AT-106-1: Throw a test error in /api/ai route handler; verify it appears in Sentry within 60 seconds
- AT-106-2: Trigger a client React error; verify it appears in Sentry with stack trace pointing to TS source (not minified)
- AT-106-3: Submit a /api/ai request with manuscript text in body; trigger error; verify Sentry event does NOT include the body
- AT-106-4: Verify Sentry event includes `user.id` but not `user.email`
- AT-106-5: Verify Sentry release name matches `VERCEL_GIT_COMMIT_SHA`
- AT-106-6: Configure Sentry alert: error rate > 10/hour → email steve@woulfgroup.com (later, route through on-call per R-TASK-128)

## PII scrubbing audit checklist

After implementation, run a manual audit by:
1. Triggering a known error in /api/ai with a real manuscript paragraph in the prompt
2. Inspect the Sentry event in dashboard
3. Search the event payload for any text from the manuscript
4. If found: tighten beforeSend; do not ship until clean

## Session Notes
_(Filled by Claude Code during implementation)_
