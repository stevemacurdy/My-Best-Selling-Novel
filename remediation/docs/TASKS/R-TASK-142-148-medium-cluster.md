<!-- APPLY: CREATE -->
# R-TASK-142 through R-TASK-148: Medium-Priority Cluster

This file batches 7 MEDIUM-priority tasks. These represent technical-debt prevention — not launch-blockers individually, but compound risk if all skipped.

## Pre-flight: re-read current state

Before making any change, read the current state of every file listed in "Files to Modify" below. Verify the gap(s) addressed by this task are still present in the current code. Specifically:

- For each file in "Files to Modify": view the file and confirm the condition the audit observed (e.g., "no rate limiting on /api/ai") still applies.
- For each gap in "Resolves Gaps": confirm the gap remains open. The audit was conducted on 2026-05-04; if the codebase changed since, the gap may have been partially or fully addressed.
- If a gap is no longer present, report this finding in PROGRESS.md, mark this task as superseded, and stop. Do not make changes.
- If a gap is partially addressed, scope this task to the remaining work and document in this file's Session Notes what was already addressed and skipped.
- If the gap is still fully present as the audit described, proceed with the rest of this task.

This pre-flight catches the case where the codebase changed between audit and remediation — exactly the failure mode that produces silent overwrites of unrelated work.

**Cluster files only:** Each sub-task in this cluster MUST run its own pre-flight against the files it touches before that sub-task begins. Do not batch the pre-flights.

---

## R-TASK-142: Performance & Capacity Targets Document

**Status:** NOT STARTED · **Phase:** 11 · **Sessions:** 1 · **Resolves:** GAP-001, GAP-028, GAP-084, GAP-085, GAP-087, GAP-088, GAP-089, GAP-090

### Files to Create
- `docs/architecture/PERFORMANCE_TARGETS.md`

### Content (templated)

```markdown
## Scale targets at 24 months
- Active accounts: 10,000 (assuming 1,000 paying conversion)
- Monthly active users (MAU): 4,000
- Concurrent users at peak: 200
- Books in DB: 30,000 (~3 per active account)
- Chapters: 600,000 (~20 per book)
- Audio chunks: 600,000 (1 per chapter)
- Storage: 600 GB (audio is dominant)
- AI calls/month: 200,000 (200/active user/month avg)
- Anthropic budget at scale: ~$3,000/mo

## Web Vitals targets (per Lighthouse)
- LCP: < 2.5s (good); aim < 2.0s
- CLS: < 0.1
- INP: < 200ms
- TBT: < 200ms (Lighthouse-only)
- Cold start budget: < 1s for first byte (Vercel Edge)

## API latency budgets (p95)
- /api/health — 200ms
- /api/books (GET) — 500ms
- /api/books (POST) — 800ms
- /api/chapters/[bookId] (GET) — 500ms
- /api/chapters/[bookId] (PUT, save) — 800ms
- /api/audio/[bookId]/[chapterIdx] (PUT, upload) — 5s (depends on file size)
- /api/ai (POST, streaming TTFB) — 3s
- /api/stripe/checkout — 1.5s
- /api/admin/users — 1s
- /api/admin/metrics — 2s

## DB query budgets
- Most queries: < 100ms p95
- Admin metrics aggregation: < 500ms (uses materialized view if exceeded)
- ai_usage_logs aggregations: < 500ms (indexed by user_id, created_at)

## Resource ceilings
- Vercel function memory: 1024 MB default; 3008 MB for /api/upload (large DOCX)
- Vercel function maxDuration: 60s for /api/ai; 30s for /api/upload; 10s default
- Anthropic max_tokens: 16,384 (per Decision #25)
- Storage upload: 4.5 MB body limit per Vercel; chunk audio if exceeded

## RTO/RPO (paired with R-TASK-123)
- RTO: 4 hours for Supabase outage
- RPO: 24 hours (last nightly backup)

## Load test thresholds (paired with R-TASK-148 perf tests)
- 100 concurrent users issuing read queries: < 1s p95 latency, < 1% error rate
- 50 concurrent users issuing /api/ai calls: success rate > 95%
- 10 concurrent uploads: all complete within 30s
```

### Tests Required
- AT-142-1: PERFORMANCE_TARGETS.md exists; all targets numerical and specific
- AT-142-2: Lighthouse run on production /pricing meets LCP target
- AT-142-3: Web Vitals visible in metrics dashboard

---

## R-TASK-143: UI Specification Document Set

**Status:** NOT STARTED · **Phase:** 11 · **Sessions:** 2 · **Resolves:** GAP-005, GAP-006, GAP-007, GAP-008, GAP-019

### Files to Create
- `docs/architecture/UI_FUNCTION_SYMBOLS.md` — canonical handler/symbol naming
- `docs/architecture/UI_SCREEN_STATES.md` — loading/empty/error/success per screen
- `docs/architecture/UI_WIRING_TABLE.md` — control → handler → service → endpoint per screen
- `docs/architecture/AUTH_MATRIX.md` — auth/authz/rate-limit/audit-log per route
- `app/onboarding/wizard.tsx` — first-run wizard component (paired with TASK-046 modal flow)

### Function symbol map
Define canonical names for handlers used across the app:
- `handleSubmit` — form submission
- `handleSignOut` — sign-out
- `handleUpgrade` — start checkout
- `handleDelete{Resource}` — delete (e.g., handleDeleteBook)
- `handleCreate{Resource}` — create
- `useAccount()` — hook returning current user + tier
- `useBooks()` — hook returning user's books
- `useAIClient()` — hook returning the AI caller from R-TASK-104

When Claude Code generates components in any TASK file, name handlers per this map.

### Screen states matrix
For each screen (auth pages, /account, /admin/*, /app, etc.):

| Screen | Loading state | Empty state | Error state | Success state |
|---|---|---|---|---|
| /account/library | skeleton card grid | "No books yet" + CTA | toast + retry | renders books |
| /admin/users | skeleton table rows | "No users match filter" | inline error message | renders pagination |
| (etc) |

### Wiring table
For each screen, table of:
| Control | Symbol | Handler | Service | Endpoint |
|---|---|---|---|---|
| "New Book" button | newBookBtn | handleCreateBook | createBook | POST /api/books |

### Auth matrix
For each route in `app/api/`:
| Route | Auth required | Role | Rate limit | Audit log action |
|---|---|---|---|---|
| GET /api/health | no | — | none | — |
| POST /api/ai | yes | any | 10/min/user | — |
| GET /api/admin/users | yes | admin | none | admin.user.read |

### First-run wizard
After first signup, modal flow:
1. "Welcome — let's get you started"
2. "What kind of book are you working on?" → pre-fills S1 in agent
3. "Want a quick tour?" → highlights agent step indicators
4. "You're set. Let's begin."

### Tests Required
- AT-143-1: All 4 docs exist
- AT-143-2: Auth matrix lists all 11+ routes
- AT-143-3: Wiring table covers /account/library minimum
- AT-143-4: First-run wizard appears for first signup; doesn't appear after
- AT-143-5: Function symbol map followed in TASK-027+ generated code

---

## R-TASK-144: Soft-Delete + Undo-Delete UX

**Status:** NOT STARTED · **Phase:** 11 · **Sessions:** 1 · **Resolves:** GAP-009

### Files to Modify
- `supabase/migrations/015_soft_delete_columns.sql` — add `deleted_at TIMESTAMPTZ` to `books`, `chapters`
- `app/api/books/[id]/route.ts` (TASK-017) — DELETE marks `deleted_at = NOW()` instead of cascade-deleting
- All SELECT queries on books/chapters — add `WHERE deleted_at IS NULL`
- Update RLS policies to filter `deleted_at IS NULL` for SELECT
- `app/account/library/page.tsx` (TASK-047) — show "Recently deleted (7 days)" tab; restore button
- `vercel.json` — daily cron `/api/admin/purge-soft-deleted` purges after 7 days

### Behavior
- DELETE button: confirms; soft-deletes; toast with "Undo" button visible 30s
- "Recently deleted" view: lists soft-deleted books for 7 days
- Restore: sets `deleted_at = NULL`
- After 7 days: hard-purged via cron

### Tests Required
- AT-144-1: Delete a book; reappears in "Recently deleted" tab
- AT-144-2: Restore from "Recently deleted" within 7 days; book returns
- AT-144-3: After 7 days, soft-deleted books removed by cron

---

## R-TASK-145: Auth + API Hardening

**Status:** NOT STARTED · **Phase:** 11 · **Sessions:** 0.5 · **Resolves:** GAP-018, GAP-020

### Files to Create
- `docs/architecture/SESSION_LIFETIME.md` — documented session policy
- `docs/architecture/API_VERSIONING.md` — versioning strategy

### Session lifetime (Supabase Auth defaults documented)
- Access token: 1 hour
- Refresh token: 30 days
- Inactivity timeout: 30 days
- "Remember me" not exposed (always 30-day refresh)
- Document in user-facing privacy policy

### API versioning strategy
- All current routes remain unversioned (backward compat)
- New API surfaces (post v1) prefixed `/api/v1/`, `/api/v2/`
- Breaking changes: bump version; old version deprecated 6 months before removal
- Deprecation: route returns response with `X-Deprecated: true` and `X-Sunset: 2026-12-31` headers
- Document in API_VERSIONING.md

### Tests Required
- AT-145-1: SESSION_LIFETIME.md exists with current Supabase defaults documented
- AT-145-2: API_VERSIONING.md exists with policy
- AT-145-3: New routes added in Phase 11+ use `/v1/` prefix

---

## R-TASK-146: Operations Baseline

**Status:** NOT STARTED · **Phase:** 12 · **Sessions:** 1 · **Resolves:** GAP-032, GAP-033, GAP-044, GAP-049

### Files to Create
- `docs/architecture/LOG_SCRUBBING_RULES.md` — what never to log
- `docs/legal/PROD_ACCESS_ROSTER.md` — who has prod access; reviewed quarterly
- `docs/architecture/VENDOR_EXIT_PLANS.md` — exit plan per major vendor
- `docs/architecture/ENV_CONFIG.md` — local/staging/prod config split

### Log scrubbing rules
- NEVER log: passwords, API keys, full Authorization headers, manuscript text, prompt content, audio data
- Log: user_id (never email), request_id, route, status, duration, PII-free error messages
- If log lines are accidentally too verbose: scrub before send via `lib/log.ts` redaction config

### Prod access roster
| Person | Role | Access | Reviewed |
|---|---|---|---|
| Steve Macurdy | super_admin | Full | 2026-05-04 |

### Vendor exit plans (1-page each)
- **Supabase exit:** if needed, migrate to self-managed Postgres + dedicated auth (Clerk/WorkOS) + Cloudflare R2 storage. Estimated: 4-8 weeks at 1k users; 12+ weeks at 10k users.
- **Anthropic exit:** swap to OpenAI GPT-4o or Mistral Large via /api/ai abstraction layer. Decision #11 (verbatim AI prompts) protects portability — same prompts work cross-provider with minor tuning. Estimated: 1 week.
- **Stripe exit:** swap to Lemon Squeezy or Paddle. ~2 weeks of work; Stripe-specific schema in subscriptions table refactored.
- **Resend exit:** swap to Postmark or SendGrid; same Email lib abstraction. ~3 days.
- **Vercel exit:** Next.js works on Cloudflare Pages, Netlify, AWS Amplify, self-hosted. Migration ~1-2 weeks.

### Env config matrix (paired with R-TASK-122 staging)
- `.env.local` — dev only (gitignored)
- `.env.staging` — Vercel env vars on staging branch (Stripe test mode, separate Supabase project)
- `.env.production` — Vercel env vars on prod (live keys)

### Tests Required
- AT-146-1: All 4 docs exist
- AT-146-2: Quarterly review checkbox in PROD_ACCESS_ROSTER.md
- AT-146-3: Log scrubbing audit finds no PII in last 1000 log lines

---

## R-TASK-147: Canonical Store (`lib/canon.ts`)

**Status:** NOT STARTED · **Phase:** 11 · **Sessions:** 1 · **Resolves:** GAP-034

### Files to Create
- `lib/canon.ts` — single source of truth for: tier metadata, prices, product names, public URLs, marketing copy that appears in multiple places

### Files to Modify
- `app/pricing/page.tsx` (TASK-045) — read prices from canon
- `lib/subscription.ts` (TASK-005) — read TIER_LIMITS from canon
- `emails/welcome.tsx`, `emails/upgrade.tsx`, `emails/lifetime-confirmation.tsx` — read tier names + prices from canon
- `SESSION_PROMPT_TEMPLATE.md` — single line: "Pricing/tier facts in lib/canon.ts. Don't hardcode."
- `CLAUDE.md` — same callout

### `lib/canon.ts`
```typescript
// SINGLE SOURCE OF TRUTH for pricing, tier limits, product names.
// Never hardcode these values elsewhere. Always import from here.

export const PRODUCT_NAME = 'My Best Selling Novel';
export const PRODUCT_DOMAIN = 'mybestsellingnovel.com';
export const PRODUCT_FULL_URL = 'https://mybestsellingnovel.com';
export const SUPPORT_EMAIL = 'support@mybestsellingnovel.com';
export const NOREPLY_EMAIL = 'noreply@mybestsellingnovel.com';
export const SECURITY_EMAIL = 'security@mybestsellingnovel.com';
export const STATUS_URL = 'https://status.mybestsellingnovel.com';

export const TIERS = {
  explorer: {
    name: 'Explorer',
    monthly_price_usd: 0,
    annual_price_usd: 0,
    lifetime_price_usd: null,
    ai_calls_per_month: 25,
    book_limit: 1,
    chapter_limit_per_book: 5,
    storage_mb: 100,
    description: 'Try the platform with limited usage.',
  },
  author: {
    name: 'Author',
    monthly_price_usd: 29,
    annual_price_usd: 313.20,    // 29 * 12 * 0.9
    lifetime_price_usd: 567.89,
    ai_calls_per_month: 500,
    book_limit: 5,
    chapter_limit_per_book: null,  // unlimited
    storage_mb: 5_000,
    description: 'For authors actively publishing.',
  },
  publisher: {
    name: 'Publisher',
    monthly_price_usd: 79,
    annual_price_usd: 853.20,    // 79 * 12 * 0.9
    lifetime_price_usd: 3456.78,
    ai_calls_per_month: 2_000,
    book_limit: null,  // unlimited
    chapter_limit_per_book: null,
    storage_mb: 100_000,
    team_seats: 2,  // marketed but per R-TASK-101 may be deferred
    description: 'For prolific authors and small publishing operations.',
  },
} as const;

export type TierKey = keyof typeof TIERS;
```

### CI grep-lint (also satisfies GAP-035)
`scripts/canon-lint.ts` — fails if hardcoded `$29`, `$79`, `$3,456.78`, `$313.20`, `25 AI calls`, etc., appear in any file other than `lib/canon.ts`.

### Tests Required
- AT-147-1: All hardcoded prices migrated to lib/canon.ts; grep-lint passes
- AT-147-2: Pricing page renders prices from canon (verify by editing canon, observing page)
- AT-147-3: Welcome email pulls tier name from canon

---

## R-TASK-148: Operational Completeness

**Status:** NOT STARTED · **Phase:** 11 · **Sessions:** 2 · **Resolves:** GAP-038, GAP-042, GAP-043, GAP-046, GAP-056, GAP-058, GAP-062, GAP-066, GAP-070, GAP-072, GAP-075, GAP-076, GAP-077, GAP-080, GAP-082, GAP-092, GAP-093

This task is a "completeness sweep" — many small additions that close MEDIUM gaps efficiently.

### Files to Create
- `docs/architecture/COOKIE_INVENTORY.md` (GAP-038) — every cookie set, purpose, retention
- `docs/architecture/VENDOR_MANIFEST.md` (GAP-042, GAP-043, GAP-046) — per-vendor: SLA, breaks_on_down, degraded mode, fallback, cost, change-control process
- `docs/architecture/TRACING.md` (GAP-056) — distributed-tracing strategy (Sentry traces; future Datadog APM)
- `docs/runbooks/INDEX.md` (GAP-058) — index of all runbooks
- `e2e/integration/` (GAP-062) — automated integration tests for full Phase 10 manual procedures
- `scripts/load-test.ts` (GAP-066) — k6 or Artillery script
- `docs/architecture/COLOR_INDEPENDENCE.md` (GAP-070) — genre map gets icon + label not just color
- `docs/architecture/TEXT_ZOOM_TESTING.md` (GAP-072) — manual checklist
- `docs/architecture/LOCALE_HANDLING.md` (GAP-075) — single-language v1; future plan
- `docs/architecture/ANALYTICS_EVENTS.md` (GAP-076, GAP-077) — manifest of GA4 events; PII rules
- `docs/architecture/UNSUBSCRIBE_POLICY.md` (GAP-080) — every commercial email has unsubscribe link
- `docs/architecture/BOUNCE_HANDLING.md` (GAP-082) — Resend bounce webhook → mark email_bounced=true
- Migration manifest comments (GAP-092) — applied to existing migrations
- `docs/runbooks/destructive-migration-review.md` (GAP-093) — checklist before applying ALTER TABLE DROP

### Tests Required
- AT-148-1: All listed docs exist
- AT-148-2: Genre tag UI renders icon AND label not just color (visible to color-blind users)
- AT-148-3: Browser zoom to 200%; layout doesn't break
- AT-148-4: Resend bounce webhook configured; bounced address gets `email_bounced=true` flag
- AT-148-5: GA4 events: signup_completed, upgrade_started, upgrade_completed, ai_call, agent_step_completed (S0-S11) — verify firing in GA4 DebugView
- AT-148-6: All commercial emails (welcome, upgrade, renewal-reminder, dunning, lifetime-confirmation) include unsubscribe link

---

*End of R-TASK-142 through R-TASK-148 cluster*
