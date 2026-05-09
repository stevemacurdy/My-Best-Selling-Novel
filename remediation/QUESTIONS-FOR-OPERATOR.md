<!-- APPLY: CREATE -->
# QUESTIONS-FOR-OPERATOR.md

**PATCH-3 round 2 (option A revised) — 34 expand-eligible tasks, ~144 questions, Pattern 2c (dependency-respecting, single-batch, resumable).**

Operator can answer in any order, in installments. The Progress Tracker below is the canonical state. When you reply with answers, name which questions you're answering (e.g., "Phase 1 + Phase 3 below" or "Q-1.1 through Q-3.5 below" or "all Phase 7 below"). I will mark them complete in the tracker, run an expansion pass on any task whose questions are all answered, and stop again to wait for the next installment.

When all questions for a given task are answered, that task is unblocked for B.3 expansion. Tasks with `[depends on Q-X.Y]` markers wait until the upstream answer arrives before their dependent questions resolve to a final inferred default.

---

## Progress Tracker (update on each round)

**Last updated:** 2026-05-08 (Phase 1+2+3+4+7+10 done; 21 tasks expanded; 13 remaining across Phases 6, 8, 9)

### Phase status
| Phase | Tasks | Questions | Status |
|---|---|---:|---|
| Phase 1 — Foundation | TASK-003, 004, 005 | 12 | ✅ COMPLETE |
| Phase 2 — Auth | TASK-009 | 4 | ✅ COMPLETE |
| Phase 3 — Database & APIs | TASK-017, 018, 019 | 14 | ✅ COMPLETE |
| Phase 4 — Stripe Billing | TASK-020, 022, 023, 026 | 13 | ✅ COMPLETE |
| Phase 6 — Demo & Landing | TASK-043, 044, 045, 046, 047, 048 | 27 | 🟦 NOT STARTED |
| Phase 7 — Admin | TASK-049, 050, 051, 053 | 19 | ✅ COMPLETE |
| Phase 8 — Email | TASK-054, 055, 056 | 14 | 🟦 NOT STARTED (Q-8.5 needs operator) |
| Phase 9 — Analytics & Polish | TASK-058, 059, 060, 062 | 16 | 🟦 NOT STARTED |
| Phase 10 — E2E & Deploy | TASK-063, 064, 065, 066, 067, 068 | 25 | ✅ COMPLETE |
| **Total** | **34 tasks** | **144 questions** | **91 / 144 answered (21 / 34 tasks expanded)** |

### Per-task tracker
**Phase 1:** ✅ TASK-003 ✅ TASK-004 ✅ TASK-005
**Phase 2:** ✅ TASK-009
**Phase 3:** ✅ TASK-017 ✅ TASK-018 ✅ TASK-019
**Phase 4:** ✅ TASK-020 ✅ TASK-022 ✅ TASK-023 ✅ TASK-026
**Phase 6:** ☐ TASK-043 (6Q) ☐ TASK-044 (5Q) ☐ TASK-045 (4Q) ☐ TASK-046 (3Q) ☐ TASK-047 (5Q) ☐ TASK-048 (4Q)
**Phase 7:** ✅ TASK-049 ✅ TASK-050 ✅ TASK-051 ✅ TASK-053
**Phase 8:** ☐ TASK-054 (5Q) ☐ TASK-055 (4Q) ☐ TASK-056 (5Q)
**Phase 9:** ☐ TASK-058 (5Q) ☐ TASK-059 (4Q) ☐ TASK-060 (3Q) ☐ TASK-062 (4Q)
**Phase 10:** ✅ TASK-063 ✅ TASK-064 ✅ TASK-065 ✅ TASK-066 ✅ TASK-067 ✅ TASK-068

### Expanded tasks (cumulative this round)
**Round 1 (Phase 1+2):** TASK-003 (892), TASK-004 (1006), TASK-005 (1061), TASK-009 (1308)
**Round 2 (Phase 3+4):** TASK-017 (1289), TASK-018 (1147), TASK-019 (1050), TASK-020 (1131), TASK-022 (958), TASK-023 (894), TASK-026 (1158)
**Round 3 (Phase 7):** TASK-049 (1221), TASK-050 (918), TASK-051 (1247), TASK-053 (1339; MIXED — agent S0 scores)
**Round 4 (Phase 10):** TASK-063 (959), TASK-064 (888), TASK-065 (888), TASK-066 (1135), TASK-067 (1068), TASK-068 (1108)

### Cross-phase dependencies (Pattern 2c)
| If you change... | Then Q's affected... |
|---|---|
| Q-1.1 (env-var canonical list) | Q-4.1 (Stripe price IDs in env), Q-9.1 (GA env), Q-10.4 (deploy env vars) |
| Q-3.1 (book CRUD shape) | Q-3.2 (chapters API contract), Q-10.2 (e2e books test) |
| Q-4.4 (billing test matrix) | Q-10.3 (e2e billing test) |
| Q-6.1 (landing hero copy) | Q-9.2 (GA event taxonomy for hero CTA) |
| Q-6.6 (account dashboard tier badge) | Q-7.1 (admin metrics tier mapping) |
| Q-7.4 (admin genre algorithm) | Q-6.10 (genre rendering on landing — if any) |
| Q-8.1 (welcome email copy voice) | Q-8.4 (upgrade email copy voice — keep consistent) |
| Q-9.2 (GA event taxonomy) | Q-10.2/3 (e2e tests verify GA events fire) |

---

## Phase 1 — Foundation (TASK-003, 004, 005), 12 questions

### TASK-003 — Environment Configuration

#### Q-1.1 — Final canonical env-var list
**Question:** Confirm the canonical 16-env-var list for `.env.local.example` post-A.3 elimination of lifetime tier:
```
# Site
NEXT_PUBLIC_SITE_URL, NEXT_PUBLIC_GA_MEASUREMENT_ID
# Supabase
NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY
# Stripe (4 price IDs not 6 — lifetime removed)
STRIPE_SECRET_KEY, STRIPE_PUBLISHABLE_KEY, STRIPE_WEBHOOK_SECRET,
STRIPE_PRICE_AUTHOR_MONTHLY, STRIPE_PRICE_AUTHOR_ANNUAL,
STRIPE_PRICE_PUBLISHER_MONTHLY, STRIPE_PRICE_PUBLISHER_ANNUAL
# Anthropic
ANTHROPIC_API_KEY
# Resend
RESEND_API_KEY
# Sentry (R-TASK-106)
SENTRY_DSN, NEXT_PUBLIC_SENTRY_DSN
```
**Why this matters:** TASK-003, TASK-068 deploy, and CI all consume from this list. One source of truth prevents drift.
**Inferred default:** Above list. [INFERRED-FROM: A.3 cascade post-Decision #29 revision; R-TASK-106 Sentry; original TASK-003]
**Expected answer:** "use default" or specify additions/removals.

#### Q-1.2 — Sentry env vars in v1?
**Question:** R-TASK-106 (Sentry integration) is a Phase 11 task that ships before public launch. Should `SENTRY_DSN` and `NEXT_PUBLIC_SENTRY_DSN` be in `.env.local.example` from Phase 1 (TASK-003), or added later when R-TASK-106 ships?
**Why this matters:** If from Phase 1, the env file is complete on first commit. If later, the file gets updated by R-TASK-106 Pre-flight.
**Inferred default:** Add from Phase 1 (TASK-003). The empty values in `.env.local.example` are harmless until R-TASK-106 actually wires Sentry; meanwhile, Vercel and CI already see the variable names. [INFERRED-FROM: standard SaaS pattern + R-TASK-106]
**Expected answer:** "use default" or "later, in R-TASK-106."

#### Q-1.3 — Inline source comments format
**Question:** Original TASK-003 says "each with source comment." How verbose? Examples: `# Get from Supabase Dashboard > Settings > API` (where to retrieve) vs `# Anon key for client-side queries` (what it does) vs both?
**Inferred default:** "where to retrieve" only — lower noise, more useful for an operator setting up a fresh repo. Documentation-style comments live in `docs/STRIPE_SETUP.md` (TASK-020) and CLAUDE.md, not in env files. [INFERRED-FROM: standard SaaS pattern]
**Expected answer:** "use default", "what it does only", or "both."

#### Q-1.4 — `.env.local.example` versus `.env.example`
**Question:** File name: `.env.local.example` (Next.js convention) or `.env.example` (general convention)?
**Inferred default:** `.env.local.example` to match Next.js's `.env.local` for local dev. [INFERRED-FROM: Next.js 14 docs]
**Expected answer:** "use default" or specify.

### TASK-004 — Supabase Clients (`lib/supabase/client.ts`, `lib/supabase/server.ts`)

#### Q-1.5 — Cookie name for SSR session
**Question:** `@supabase/ssr` lets you customize cookie names. Use defaults (`sb-<project-ref>-auth-token`) or specify a branded name (e.g., `mybsn-auth`)?
**Inferred default:** Use defaults. Custom names provide no security benefit and break Supabase Dashboard tooling for inspecting sessions. [INFERRED-FROM: @supabase/ssr docs + Decision #18]
**Expected answer:** "use default" or specify.

#### Q-1.6 — Service-role client function name
**Question:** `lib/supabase/server.ts` exports both anon-key (`createServerClient`) and service-role variants. Service-role exported as `createServiceRoleClient()` or `getServiceSupabase()` or `serviceClient()`?
**Inferred default:** `createServiceRoleClient()` — explicit, matches `createServerClient` casing pattern. [INFERRED-FROM: naming consistency]
**Expected answer:** "use default" or specify.

#### Q-1.7 — Type exports
**Question:** Does `lib/supabase/server.ts` export the `SupabaseClient` type for use in other files?
**Inferred default:** Yes. Other files (lib/api-auth, route handlers) need to type their `sb` parameters; re-exporting prevents every file from importing `@supabase/supabase-js` directly. [INFERRED-FROM: TypeScript best practice]
**Expected answer:** "use default" or specify.

#### Q-1.8 — Database type generation
**Question:** Use Supabase CLI's `supabase gen types typescript` to generate `types/supabase.ts` and use it as the generic in `createClient<Database>(...)`? Or hand-type as `any` for v1?
**Inferred default:** Generate types. The `db:types` npm script (`npm run db:types`) regenerates after each migration. Adds compile-time safety on every query. [INFERRED-FROM: Supabase docs + TypeScript best practice + Decision #2 stack]
**Expected answer:** "use default" or "any-typed for v1, generate later."

### TASK-005 — Lazy SDK Clients (`lib/stripe.ts`, `lib/claude.ts`, `lib/resend.ts`)

#### Q-1.9 — Stripe API version
**Question:** Pin Stripe API version to `2024-11-20.acacia` (per original TASK-005 spec) or pick the latest 2026-* version at TASK-005 ship time?
**Why this matters:** Pinning protects against breaking changes; floating means the latest features are available.
**Inferred default:** Pin to the latest stable as of TASK-005 ship date. Stripe's API is backwards-compatible within a major version, but pinning makes regressions diagnosable. Document the chosen version in CLAUDE.md. [INFERRED-FROM: Stripe API best practice + Decision #10 lazy init]
**Expected answer:** "use default", specify a version, or "use whatever's latest at ship time."

#### Q-1.10 — Anthropic SDK model pinning
**Question:** Pin Claude model identifier in `lib/claude.ts`'s wrapper, or pass model as parameter on every call from `app/api/ai/route.ts`?
**Inferred default:** Pass as parameter from route. The `claude.ts` lib is just the lazy SDK init; routes specify the model. The model used is `claude-sonnet-4-5` (latest GA Sonnet as of audit date 2026-05-04) — but PATCH-001 / R-TASK-106 / future model upgrades will adjust this without touching `lib/claude.ts`. [INFERRED-FROM: PATCH-001 + Decision #2]
**Expected answer:** "use default" or specify.

#### Q-1.11 — Resend "from" address
**Question:** `RESEND_FROM_EMAIL` was in original TASK-003's env list. Use `noreply@mybestsellingnovel.com` (per Decision #28 brand domain) hardcoded in `lib/resend.ts`, or keep as env var?
**Inferred default:** Env var. Easier to swap for staging (`noreply@staging.mybestsellingnovel.com`) without touching code. Add `RESEND_FROM_EMAIL` back to the env list as the 17th env var. [INFERRED-FROM: Decision #28 + R-TASK-122 staging environment]
**Expected answer:** "use default (env var)" or "hardcoded in lib/resend.ts."

**Depends on:** Q-1.1 (env list — if env var, gets added)

#### Q-1.12 — SDK timeout settings
**Question:** Set timeouts on the SDK clients? Anthropic supports `timeout: <ms>` parameter; Stripe and Resend have similar options.
**Inferred default:** Anthropic 60s (matches PATCH-001 maxDuration). Stripe 30s. Resend 30s. Document in `lib/<sdk>.ts` comments. [INFERRED-FROM: PATCH-001 + standard SaaS]
**Expected answer:** "use default" or specify.

---

## Phase 2 — Auth (TASK-009), 4 questions

### TASK-009 — Sign-in + Forgot Password Pages

#### Q-2.1 — Signin form layout consistency with TASK-008
**Question:** TASK-008 signup page (already expanded) uses card-style form on navy background, brand-gold CTA, error states with brand-error color. Confirm TASK-009 signin + forgot pages match this exactly?
**Inferred default:** Yes, match TASK-008 styling exactly. Same card width (480px), same field heights, same focus rings. [INFERRED-FROM: TASK-008 expansion + TASK-002 brand store]
**Expected answer:** "use default" or specify deviations.

#### Q-2.2 — Signin "remember me" checkbox?
**Question:** Show a "remember me" checkbox on signin? Supabase sessions are persistent by default (cookie-based per Decision #18).
**Inferred default:** No checkbox — session always persists; signing out is the explicit way to end the session. Adding the checkbox would create a confusing UX where users don't know what "remember me" off means in a cookie-based system. [INFERRED-FROM: Decision #18 + standard SaaS]
**Expected answer:** "use default" or specify.

#### Q-2.3 — Forgot password rate-limit
**Question:** Per R-TASK-104, signup is rate-limited (3/hour/IP). Apply same rate-limit to `/forgot` (the password reset email endpoint)? Or use a tighter limit since reset emails can be used for harassment?
**Inferred default:** 3/hour/IP, matching signup. Not tighter because legitimate users sometimes need 2-3 tries (typo'd email). Email itself is throttled by Supabase Auth's internal rate-limit on `auth.resetPasswordForEmail`. [INFERRED-FROM: R-TASK-104 + Supabase docs]
**Expected answer:** "use default" or specify limit.

#### Q-2.4 — Reset link expiry
**Question:** Supabase password reset links default to 24-hour expiry. Override?
**Inferred default:** Supabase default (24h). Tighter expiry creates support tickets ("the link expired"); looser creates security exposure. [INFERRED-FROM: Supabase Auth defaults]
**Expected answer:** "use default" or specify TTL.

---

## Phase 3 — Database & APIs (TASK-017, 018, 019), 14 questions

### TASK-017 — Books CRUD API

#### Q-3.1 — Book metadata fields returned by GET list endpoint
**Question:** Original task says GET /api/books returns "metadata fields (not full book_data)." Specify which fields:
**Inferred default:** `id, title, genre, status (draft|in_progress|complete|published), cover_url, word_count_total, chapter_count, created_at, updated_at`. [INFERRED-FROM: TASK-018 chapters API + landing/account UI needs + audit GAP-064 about partial-data shapes]
**Expected answer:** "use default" or specify.

#### Q-3.2 — Sort + pagination on GET /api/books
**Question:** Default sort is `updated_at DESC`. Add pagination (offset/limit) or return all?
**Inferred default:** Default sort `updated_at DESC` confirmed. **Pagination:** return all for v1 (Author tier has no book limit but realistic max is ~50 books per user). Add pagination only when a user hits 100+ books. [INFERRED-FROM: tier limits + cost discipline]
**Expected answer:** "use default" or specify (e.g., add `?limit=50&offset=0`).

#### Q-3.3 — DELETE confirmation
**Question:** DELETE /api/books/[id] — does the API itself require a confirmation token (e.g., `?confirm=true` query param), or is confirmation purely client-side modal UX?
**Inferred default:** Confirmation is purely client-side UX (the modal). API trusts that the client confirmed. [INFERRED-FROM: standard REST patterns + WoulfAI rule 10 (security via auth, not double-confirm)]
**Expected answer:** "use default" or specify.

#### Q-3.4 — book_data field strip on PUT
**Question:** PUT strips `audioRecordings` and `coverFiles` from `book_data` to keep the JSONB blob small. Anything else worth stripping (e.g., raw uploaded manuscript text once parsed into chapters)?
**Inferred default:** Strip `audioRecordings`, `coverFiles`, and `originalUploadedText` (the raw blob from upload — once chapters are populated, the blob is redundant). Keep all other agent state. [INFERRED-FROM: Decision #22 chapters split + audit GAP-022/030 around storage size]
**Expected answer:** "use default" or specify.

#### Q-3.5 — Soft delete vs hard delete
**Question:** R-TASK-144 (soft-delete UX, Phase 11) introduces soft-delete. Until R-144 ships, is DELETE /api/books/[id] hard-delete (immediate removal) or already soft-delete from day one?
**Inferred default:** Hard-delete in v1 Phase 1-10 (TASK-017's first ship); R-TASK-144 converts to soft-delete in Phase 11. The conversion involves adding a `deleted_at` column and updating queries; surfaced by R-144 Pre-flight. [INFERRED-FROM: R-TASK-144 + migration 015 soft-delete columns]
**Expected answer:** "use default" or specify.

### TASK-018 — Chapters API

#### Q-3.6 — Smart-diff payload format
**Question:** PUT /api/chapters/[bookId]/[index] accepts what payload shape? (a) Full chapter object every time, (b) JSON-Patch RFC 6902 deltas, (c) custom diff format with only changed fields.
**Inferred default:** **(c) Custom — partial chapter object with only changed fields**, matching Decision #24 smart diff. Server upserts using `merge` strategy. JSON-Patch is over-engineered for chapter-level granularity; full-object every time defeats the diff. [INFERRED-FROM: Decision #24]
**Expected answer:** "use default" or specify.

#### Q-3.7 — Chapter index reordering
**Question:** Does the API support reordering chapters (drag-and-drop in agent S3 outline)? If so, is reordering a special endpoint (POST /api/chapters/[bookId]/reorder) or a general PUT with the full ordered list?
**Inferred default:** Special endpoint POST /api/chapters/[bookId]/reorder accepting `{ order: [chapterIndex, ...] }` — atomic update of all `chapter_index` values in one transaction. General PUT can't easily express "swap chapter 3 and chapter 7." [INFERRED-FROM: agent S3 outline UI]
**Expected answer:** "use default", specify alternative, or "no reordering API in v1."

#### Q-3.8 — Concurrent edit handling
**Question:** Two browser tabs open on same chapter, both edit and save. Last-write-wins, or conflict detection via `updated_at` ETag check?
**Inferred default:** Last-write-wins for v1. Single-user-per-account (per R-TASK-101 Path A) means concurrent edits are rare and reflect the user's own intent. Add ETag conflict detection in v2 if user feedback shows "I lost my work" tickets. [INFERRED-FROM: R-TASK-101 Path A]
**Expected answer:** "use default" or specify.

#### Q-3.9 — Chapter delete cascade
**Question:** DELETE /api/chapters/[bookId]/[index] — single chapter only. Does it cascade delete the chapter's audio chunk?
**Inferred default:** Yes. Audio chunk is keyed by `(book_id, chapter_index)`; orphaning it on chapter delete creates dangling storage. The cascade is in the migration's foreign key (`ON DELETE CASCADE` on `audio_chunks.chapter_index`). [INFERRED-FROM: TASK-014 migration-audio]
**Expected answer:** "use default" or specify.

### TASK-019 — Audio API

#### Q-3.10 — Audio formats supported
**Question:** Original task names `webm`. Support other formats (mp3, wav, m4a) for users uploading from desktop tools?
**Inferred default:** **webm only** for browser MediaRecorder uploads. Add mp3 + m4a in v1.1 if user feedback shows desktop-recording use cases. The bestseller agent's source uses MediaRecorder, which produces webm in Chrome/Edge/Firefox, mp4 in Safari. So accept both `audio/webm` and `audio/mp4` content-types but store with the original extension. [INFERRED-FROM: agent source code + browser MediaRecorder support]
**Expected answer:** "use default", "webm only strict", or "expand to mp3/m4a/wav."

#### Q-3.11 — Storage path structure
**Question:** Original task says `{userId}/{bookId}/chapter_{idx}.webm`. Confirm; if Safari uploads mp4, file path uses `.mp4` extension?
**Inferred default:** Confirm structure. Extension matches actual content-type (webm or mp4). DB column `audio_chunks.storage_path` stores the full path with extension so retrieval works regardless. [INFERRED-FROM: agent source + Q-3.10 default]
**Expected answer:** "confirm" or specify.

#### Q-3.12 — Signed URL TTL
**Question:** Confirm 1-hour signed URLs for GET? Or shorter (15 min — tighter security)? Or longer (24h — fewer re-fetches if user keeps tab open all day)?
**Inferred default:** 1-hour confirmed. Long enough for normal listening sessions; short enough that a leaked URL has limited blast radius. [INFERRED-FROM: original TASK-019 + Supabase Storage best practices]
**Expected answer:** "confirm" or specify TTL.

#### Q-3.13 — File size limit
**Question:** Confirm 50MB max per chapter audio? At ~96kbps webm, that's ~70 minutes of audio — generous for a chapter but sets DB row size implications.
**Inferred default:** **50MB confirmed.** A 70-minute chapter is unusual but the limit prevents abuse; smaller users (5-15 min chapters) won't hit it. The limit is enforced at the route handler before upload, returning 413 if exceeded. [INFERRED-FROM: original TASK-019]
**Expected answer:** "confirm" or specify size.

#### Q-3.14 — Storage cleanup on book DELETE
**Question:** TASK-017 says DELETE /api/books/[id] deletes storage audio files first, then deletes book. What if storage delete fails partway through (network blip)?
**Inferred default:** **Best-effort delete with audit logging.** Loop through audio files; failures are logged to Sentry (per R-TASK-106) but do not block the book DELETE. Orphaned storage files are cleaned up by R-TASK-112's offboarding cron job. The book row goes away regardless so the user's "delete" intent is honored. [INFERRED-FROM: R-TASK-112 + R-TASK-106 + standard distributed-systems pattern]
**Expected answer:** "use default" or specify (e.g., "all-or-nothing with rollback").

---

## Phase 4 — Stripe Billing (TASK-020, 022, 023, 026), 13 questions

### TASK-020 — Stripe Setup Documentation

#### Q-4.1 — STRIPE_SETUP.md depth
**Question:** Original task is mostly an A.3 patch (4 price IDs, webhook events, customer portal). Expand to include: tax-collection setup (Stripe Tax), product image upload, customer-facing description copy, statement-descriptor configuration?
**Inferred default:** **Yes, expand.** Operator runs through this doc once when setting up Stripe; comprehensive reduces support-ticket-to-self. Sections: 1) Create products + prices, 2) Configure tax (off in v1; deferred to v1.1), 3) Configure customer portal, 4) Configure webhooks, 5) Set statement descriptor "MYBSN.COM" (or similar), 6) Test mode → live mode checklist. [INFERRED-FROM: A.3 patch baseline + R-TASK-105 vendor DPAs + standard SaaS]
**Expected answer:** "use default", "minimal (just A.3 patch content)", or specify additions.

#### Q-4.2 — Statement descriptor
**Question:** Stripe statement descriptor (what users see on their credit-card statement). Max 22 chars. Examples: `MYBSN.COM`, `BESTSELLINGNOVEL`, `MYBSN AUTHOR`.
**Inferred default:** `MYBSN.COM` (9 chars) — short, recognizable, matches domain. [INFERRED-FROM: Decision #26 brand domain]
**Expected answer:** "use default" or specify (max 22 chars, no special characters except space, comma, period, hyphen).

#### Q-4.3 — Stripe Tax in v1?
**Question:** Stripe Tax automatically calculates VAT/sales tax for customers based on their country/state. Costs 0.5% of transactions. Defer to v1.1?
**Inferred default:** **Defer to v1.1.** Adds setup complexity (tax registrations, address collection) and customer friction. v1 sells without sales-tax line — operator handles tax remittance manually for any US-state nexus. R-TASK-119 refunds policy + Decision #29 monthly/annual covers the v1 tax disclosure language. [INFERRED-FROM: cost discipline + R-TASK-119]
**Expected answer:** "use default (defer)" or "enable Stripe Tax in v1."

### TASK-022 — Stripe Checkout Session

#### Q-4.4 — Checkout success/cancel URL params
**Question:** Original task uses `?upgraded=true` on success URL. Encode the new tier in the URL too (e.g., `?upgraded=true&tier=publisher`) for analytics + GA conversion event?
**Inferred default:** **Encode tier and interval:** `?upgraded=true&tier=author&interval=annual`. This lets the success page render personalized confirmation ("Welcome to Author Annual") and lets GA4 (per Q-9.2) record the conversion event with proper labels. [INFERRED-FROM: Q-9.2 GA event taxonomy + standard SaaS]
**Expected answer:** "use default" or specify.

#### Q-4.5 — Customer ID reuse
**Question:** Original task says "Get/create Stripe customer." When does it get vs create? On every checkout call, or cached on profile?
**Inferred default:** Cache `stripe_customer_id` on the `profiles` row. First checkout creates the customer + writes ID; subsequent checkouts reuse. Webhook handler ensures this column is always populated post-`subscription.created`. [INFERRED-FROM: TASK-024 webhook + Decision #3 webhook is source of truth]
**Expected answer:** "use default" or specify.

#### Q-4.6 — Trial period?
**Question:** Offer a free trial (e.g., 7 days Author tier) at checkout?
**Inferred default:** **No trial in v1.** Explorer tier IS the free trial (1 book + 25 AI calls). Adding a Stripe-managed trial increases churn (users sign up for free trial, forget to cancel, dispute the charge). [INFERRED-FROM: Decision #4 tier structure]
**Expected answer:** "use default (no trial)" or specify trial length.

### TASK-023 — Stripe Customer Portal

#### Q-4.7 — Portal features enabled
**Question:** Stripe Customer Portal lets you toggle which features users can self-serve: payment method update, billing address update, subscription cancel, plan change (upgrade/downgrade), invoice history. Enable all?
**Inferred default:** **Enable all.** Reduces support-ticket load. Cancel-via-portal sets `cancel_at_period_end=true` (TASK-024 webhook handles). Plan change via portal triggers `subscription.updated` webhook with proration. [INFERRED-FROM: TASK-024 + Decision #3]
**Expected answer:** "use default" or specify exclusions.

#### Q-4.8 — Portal return URL
**Question:** After portal session ends (user clicks "Return to MyBestSellingNovel"), where do they land?
**Inferred default:** `/account/billing` — the page they came from. The original `return_url` in the portal session is set to this. [INFERRED-FROM: original TASK-023 + standard pattern]
**Expected answer:** "use default" or specify.

#### Q-4.9 — Portal customization (logo, colors)
**Question:** Stripe Customer Portal lets you upload your logo + set primary color. Configure to match brand, or leave Stripe-default?
**Inferred default:** **Configure brand.** Logo from `lib/brand.ts`, primary color = brand-gold `#D4A853`, secondary = brand-navy `#0f1b33`. Documented in TASK-020's STRIPE_SETUP.md. [INFERRED-FROM: TASK-002 brand store + Decision #27]
**Expected answer:** "use default (configure brand)" or "leave Stripe-default."

### TASK-026 — Billing Integration Manual Test

#### Q-4.10 — Test scenarios matrix
**Question:** Given lifetime tier eliminated (A.3), the test matrix is now 4 SKUs (author monthly/annual, publisher monthly/annual). Specify the test cases:
**Inferred default:** Per SKU: 1) Checkout success → webhook → tier updates correctly; 2) Cancel via portal → webhook → cancel_at_period_end=true; 3) Period-end cron → tier downgrades to explorer/status=free; 4) Plan change author→publisher → webhook proration handled; 5) `payment_failed` event → status=past_due + dunning email (R-TASK-135). Plus: 6) Webhook idempotency (PATCH-002): replay same event.id → no double-grant. [INFERRED-FROM: TASK-024 webhook events + PATCH-002 + A.3 cascade]
**Expected answer:** "use default" or specify.

#### Q-4.11 — Test card numbers
**Question:** Use Stripe's test card `4242 4242 4242 4242` only, or include the full Stripe test deck (3D Secure required `4000 0027 6000 3184`, declined `4000 0000 0000 0002`, etc.)?
**Inferred default:** **Full test deck** — at least success card + 3DS-required card + decline card. Catches edge cases that the happy-path card misses. [INFERRED-FROM: Stripe testing docs]
**Expected answer:** "use default" or specify.

#### Q-4.12 — Tax/address collection during test
**Question:** Per Q-4.3 default (defer Stripe Tax), tests don't need to verify tax collection. But Checkout still asks for billing address — do tests verify the address gets stored on the customer?
**Inferred default:** Yes — verify `stripe_customer.address` is populated after Checkout. Useful for future Stripe Tax enablement and for fraud-prevention checks. [INFERRED-FROM: Q-4.3]
**Expected answer:** "use default" or specify.

#### Q-4.13 — Manual or automated?
**Question:** Original task says "Manual testing checklist." Does R-TASK-130 (testing baseline, Phase 11) automate any of this with Playwright + Stripe Test Mode?
**Inferred default:** Manual in v1; R-TASK-130 / TASK-065 e2e-billing automates the happy-path SKUs in a follow-up. The manual checklist remains useful for edge cases (3DS, declines, refunds via Stripe Dashboard). [INFERRED-FROM: R-TASK-130 + TASK-065]
**Expected answer:** "use default" or specify.

---

## Phase 6 — Demo & Landing (TASK-043, 044, 045, 046, 047, 048), 27 questions

### TASK-043 — Landing Page (`app/page.tsx`) — MIXED

#### Q-6.1 — Final hero tagline
**Question:** Original demo source has "From Blank Page to Bestseller List." Use as-is, or refine?
**Why this matters:** This is the first thing every visitor sees. Operator-input territory; no useful default beyond what the demo source has.
**Inferred default:** Use as-is from `bestseller_demo.jsx`. [INFERRED-FROM: bestseller_demo.jsx source]
**Expected answer:** "use default" or specify a refined tagline (≤8 words ideally, to fit in the hero card).

#### Q-6.2 — Stats bar numbers
**Question:** Demo source's stats bar: "12 Steps, 85 Functions, 200K+ Words, 6 Formats." Are these accurate as marketing claims? Update for v1 launch?
**Inferred default:** Update to reality at v1 launch. "12 Steps" stays. "85 Functions" — verify with `grep`; if v1 has more or fewer, adjust. "200K+ Words" — verify the upload chunked-analysis path works at 200K+ words. "6 Formats" — verify exports include 6 formats (PDF, EPUB, MOBI, DOCX, audiobook, social-card?). [INFERRED-FROM: bestseller_complete_audit.md numbers]
**Expected answer:** "use default" or specify the numbers.

#### Q-6.3 — Feature preview cards (4 of them)
**Question:** Demo source has 4 preview cards (Genre Scanner, 3-path upload, Avoid System, Audio). Keep these 4? Reorder? Replace one with a higher-leverage feature for the launch demographic?
**Inferred default:** Keep all 4 in original order — they showcase the most differentiated capabilities per `bestseller_complete_audit.md`'s "world class" list. [INFERRED-FROM: bestseller_complete_audit.md + bestseller_demo.jsx]
**Expected answer:** "use default" or specify.

#### Q-6.4 — Feature highlight cards (6 of them)
**Question:** Demo source has 6 feature highlights below the preview. Same content for v1, or refine?
**Inferred default:** Use as-is from demo source. Verify the copy matches v1 reality (e.g., if a feature was deferred, strike it). [INFERRED-FROM: bestseller_demo.jsx]
**Expected answer:** "use default" or specify.

#### Q-6.5 — Footer copy
**Question:** Demo source footer says "Built by WoulfAI" (per Decision #21). Anything else in the footer? Links to Terms / Privacy / Refunds (per Q-2.4 default whitelist)? Social links? Email?
**Inferred default:** Required: "Built by WoulfAI" + links to /terms, /privacy, /refunds, /aup, /cookies, /dmca, /ai-disclosure, /vuln-disclosure, /a11y-statement (all 9 legal pages per R-TASK-119). Optional: support email link to /help. No social links in v1 (no live social presence). [INFERRED-FROM: Decision #21 + R-TASK-119 + R-TASK-107]
**Expected answer:** "use default" or specify.

#### Q-6.6 — Brand search-replace scope
**Question:** Original task says "Replace all 'Bestseller Book Agent' references." Done as part of TASK-043 specifically, or deferred to TASK-062 brand-consistency (which does sitewide)?
**Inferred default:** TASK-043 does it for the landing page (its scope); TASK-062 does the sitewide sweep including emails, meta descriptions, page titles. Avoids double-work. [INFERRED-FROM: TASK-062 scope]
**Expected answer:** "use default" or specify.

### TASK-044 — Guided Tour (`app/demo/page.tsx`)

#### Q-6.7 — Tour copy verbatim from demo source?
**Question:** All 14 tour stops have copy in `bestseller_demo.jsx`. Use verbatim?
**Inferred default:** Verbatim from source. The audit (`bestseller_complete_audit.md`) flagged the copy as "complete and accurate." [INFERRED-FROM: bestseller_complete_audit.md verdict]
**Expected answer:** "use default" or specify.

#### Q-6.8 — Tour interactive demos (3 of 14 stops)
**Question:** Demo source has 3 interactive demos (GenreDemo, UploadDemo, AvoidDemo). Keep all 3? Add more?
**Inferred default:** Keep 3 only. Audit says: "9 tour stops have descriptions only, no interactive demo. This is acceptable — the descriptions are detailed and the 3 demos that exist showcase the most unique features." [INFERRED-FROM: bestseller_complete_audit.md]
**Expected answer:** "use default" or specify additions.

#### Q-6.9 — Tour to signup conversion CTA
**Question:** Demo source's final stop has "Get Started" → opens signup modal. Track this as GA4 conversion event?
**Inferred default:** Yes. GA event name `tour_complete_to_signup` (per Q-9.2 taxonomy). Fires when user clicks "Get Started" on stop 14. [INFERRED-FROM: Q-9.2 + Decision #29 GA4]
**Expected answer:** "use default" or specify event name.

#### Q-6.10 — Tour: persistent navigation header?
**Question:** During the tour, does the main site header (logo, signup CTA) stay visible, or hidden for immersion?
**Inferred default:** Visible. Sticky header lets users sign up at any point. [INFERRED-FROM: bestseller_demo.jsx + standard SaaS funnel]
**Expected answer:** "use default" or specify.

#### Q-6.11 — Tour: progress bar style
**Question:** Demo source has a horizontal progress bar at top + clickable dots at bottom. Keep both?
**Inferred default:** Keep both. Progress bar is glanceable; dots allow non-linear navigation. [INFERRED-FROM: bestseller_demo.jsx]
**Expected answer:** "use default" or specify.

### TASK-045 — Pricing Page (`app/pricing/page.tsx`)

#### Q-6.12 — Pricing toggle default state
**Question:** Monthly/annual toggle: which is selected on first visit?
**Inferred default:** **Annual** (it's the cheaper-per-month option, biases users toward higher commitment + lower churn). [INFERRED-FROM: standard SaaS pricing UX + Decision #29 monthly/annual]
**Expected answer:** "use default", "monthly", or specify A/B-test approach.

#### Q-6.13 — Tier feature lists (post-A.3)
**Question:** Confirm the per-tier feature list reads as follows:

**Explorer (Free):**
- 1 book
- 25 AI calls/month
- Basic agent access (steps 0-7)
- Community support via /help

**Author ($29/mo or $313.20/yr):**
- Unlimited books
- 500 AI calls/month
- Full agent access (all 12 steps + Library)
- Audio recording + playback
- Export PDF/EPUB/DOCX
- Priority email support
- Priority queue (faster AI responses)

**Publisher ($79/mo or $853.20/yr):**
- Everything in Author
- 2,000 AI calls/month
- Folder upload (entire manuscript drag-drop)
- Advanced analytics
- Genre intelligence

**Inferred default:** Above. Removed "2 team seats" (R-TASK-101 Path A) and lifetime tier (A.3). Replaced removed Publisher feature with "Genre intelligence" — the genre analytics surface (TASK-053). [INFERRED-FROM: Decisions #4-7 (post-revision) + R-TASK-101 + A.3]
**Expected answer:** "use default" or specify.

#### Q-6.14 — Recommended/highlighted tier
**Question:** Demo source highlights Author as "Recommended." Keep this? Switch to Publisher (higher ARPU)?
**Inferred default:** Keep Author highlighted. It's the conversion sweet spot for the "indie author publishing 1-3 books/year" persona. Highlighting Publisher would feel pushy. [INFERRED-FROM: bestseller_demo.jsx + persona analysis in CLAUDE.md]
**Expected answer:** "use default", "Publisher", or "neither (no highlight)."

#### Q-6.15 — 14-day guarantee note placement
**Question:** Per R-TASK-119 refund policy (14-day window for all tiers), does the pricing page surface this directly under each tier card, or once below all tiers, or hidden until checkout?
**Inferred default:** **Once below all tiers, prominent.** "14-day money-back guarantee on all paid plans. [Read refund policy](/refunds)." Cross-binds R-TASK-119 to the pricing page so refund expectations match what's signed up for. [INFERRED-FROM: R-TASK-119 + standard SaaS]
**Expected answer:** "use default" or specify.

### TASK-046 — Signup Modal (`components/SignupModal.tsx`)

#### Q-6.16 — Cross-reference TASK-008
**Question:** TASK-046 modal vs TASK-008 dedicated /signup page. Both must exist (modal for landing/pricing/tour CTAs; dedicated page for direct /signup links). Confirm they share the same form logic + acceptance recording from TASK-008?
**Inferred default:** **Yes — extract the signup form into a shared `<SignupForm>` component used by both surfaces.** TASK-008 expanded form logic (HIBP, 3-checkbox acceptance per Q-8.4=a, MFA banner) is reused in the modal. The modal is a wrapper that opens/closes; the form internals are identical. [INFERRED-FROM: TASK-008 expansion + DRY principle]
**Expected answer:** "use default" or specify.

**Depends on:** TASK-008 expansion (already shipped in v3)

#### Q-6.17 — Modal close behavior
**Question:** Modal closes on: backdrop click, ESC key, X button. Confirm? Or include partial state preservation (if user closes mid-fill, restore on re-open)?
**Inferred default:** Backdrop click + ESC + X button all close. **No state preservation** — closing means user is opting out; re-opening starts fresh. (Preservation would require sessionStorage which is banned in artifact context but allowed in production code; even so, simplicity wins for v1.) [INFERRED-FROM: standard modal UX]
**Expected answer:** "use default" or specify.

#### Q-6.18 — Modal triggers tracked in GA?
**Question:** GA event on modal open (tracking which CTA opened it: "from landing hero", "from pricing Author tier", "from tour stop 14")?
**Inferred default:** Yes. Event `signup_modal_opened` with `source` param (`landing_hero | pricing_author | pricing_publisher | tour_complete | other`). Per Q-9.2 taxonomy. [INFERRED-FROM: Q-9.2 + Decision #29]
**Expected answer:** "use default" or specify.

### TASK-047 — Account Dashboard (`app/account/page.tsx`)

#### Q-6.19 — Tier badge styling
**Question:** Tier badge: text-only, icon+text, color-coded by tier? Lifetime badge is GONE per A.3.
**Inferred default:** Color-coded text-only:
- Explorer = brand-textMuted (grey)
- Author = brand-gold
- Publisher = brand-gold + crown icon (small visual lift)
[INFERRED-FROM: lib/brand.ts tokens + A.3 lifetime elimination]
**Expected answer:** "use default" or specify.

#### Q-6.20 — Subscription status display
**Question:** What status values does the page render copy for? `active | past_due | cancelled | free`. Lifetime status removed per A.3.
**Inferred default:**
- `active`: "Active — renews Jan 15, 2027"
- `past_due`: "Payment failed. [Update billing]" with brand-warning color + Stripe portal link
- `cancelled`: "Cancellation scheduled — access until Jan 15, 2027" (cancel_at_period_end=true)
- `free`: "Explorer tier — [upgrade to Author]" with brand-gold link
[INFERRED-FROM: TASK-016 status enum + R-TASK-119 cancel UX]
**Expected answer:** "use default" or specify per status.

#### Q-6.21 — AI calls used/limit display
**Question:** Original task says "AI calls used/limit." Format: bar chart, "5 / 25 (20%)", warning at 80%/90%/100%?
**Inferred default:** Format `5 / 25 calls used this month` with a horizontal progress bar (brand-gold fill, brand-navyLight track). Brand-warning color at ≥80% used. Brand-error at 100%. [INFERRED-FROM: standard SaaS usage UI + lib/brand.ts]
**Expected answer:** "use default" or specify.

#### Q-6.22 — Book count display
**Question:** Format: `3 books` plain text, or `3 / unlimited` for paid tiers, or `3 / 1 (LIMIT)` for Explorer when at limit?
**Inferred default:**
- Explorer: `1 / 1 book` (or `1 / 1 — upgrade for unlimited` if at limit)
- Author/Publisher: `3 books`
[INFERRED-FROM: TASK-016 tier limits + UX clarity]
**Expected answer:** "use default" or specify.

#### Q-6.23 — Stripe portal button copy
**Question:** Button label: "Manage Subscription", "Manage Billing", "Open Customer Portal"?
**Inferred default:** "Manage Subscription". Most user-friendly. [INFERRED-FROM: standard SaaS]
**Expected answer:** "use default" or specify.

### TASK-048 — Help Page (`app/help/page.tsx`)

#### Q-6.24 — Tutorial source rendering
**Question:** Original task says "Render bestseller_agent_tutorial.md content." Render as: (a) static page with markdown-to-HTML at build time, (b) MDX with React components inline, (c) fetched from Supabase storage at request time?
**Inferred default:** **(a) Static page, markdown-to-HTML at build.** `bestseller_agent_tutorial.md` lives in the repo at `docs/help/tutorial.md`; build process compiles to HTML. Fastest load, no runtime fetch. MDX is overkill for prose. [INFERRED-FROM: Decision #2 stack + tutorial nature]
**Expected answer:** "use default" or specify.

#### Q-6.25 — Table of contents
**Question:** TOC: sticky sidebar (desktop), collapsed dropdown (mobile)? Anchor links per section?
**Inferred default:** Sticky sidebar at lg+ breakpoint (per Q-9.1 Tailwind defaults), collapsed `<details>` element below lg. Anchor links auto-generated from heading IDs. [INFERRED-FROM: TASK-061 mobile-responsive + standard docs UI]
**Expected answer:** "use default" or specify.

#### Q-6.26 — Search?
**Question:** Add in-page search (e.g., simple JS filter on section text)?
**Inferred default:** **No search in v1.** 15 sections is small enough to browse. Add Algolia or similar in v1.1 if user feedback requests. [INFERRED-FROM: scope discipline]
**Expected answer:** "use default" or specify.

#### Q-6.27 — Help → support inbox link
**Question:** R-TASK-107 ships /help@ inbox. Surface "Still stuck? Email help@..." at the bottom of the tutorial?
**Inferred default:** Yes. Bottom of /help page: "Didn't find what you needed? [Email support](/help/contact) or [help@mybestsellingnovel.com](mailto:help@mybestsellingnovel.com)." [INFERRED-FROM: R-TASK-107]
**Expected answer:** "use default" or specify.

---

## Phase 7 — Admin (TASK-049, 050, 051, 053), 19 questions

### TASK-049 — Admin Metrics API

#### Q-7.1 — Metrics endpoint shape
**Question:** Confirm the shape of GET /api/admin/metrics response, post-A.3:
```json
{
  "total_users": 4321,
  "new_signups": { "7d": 50, "30d": 180, "90d": 520, "ytd": 1200, "all": 4321 },
  "active_subs_by_tier": {
    "author_monthly": 120,
    "author_annual": 80,
    "publisher_monthly": 30,
    "publisher_annual": 12
  },
  "mrr_usd": 9842.50,
  "ai_calls_total": 145000,
  "ai_cost_estimate_usd": 435.00,
  "total_books": 2100,
  "top_users_by_ai": [{ "user_id": "...", "email": "...", "ai_calls": 480 }, ...]
}
```
**Inferred default:** Above. **Lifetime tier removed from `active_subs_by_tier` per A.3**; the 4 SKU keys cover the entire product line. MRR is normalized monthly equivalent (annual price ÷ 12 added to MRR). [INFERRED-FROM: Decision #4-7 (revised) + A.3]
**Expected answer:** "use default" or specify.

#### Q-7.2 — Caching strategy
**Question:** Aggregations are expensive. Cache at API level? With what TTL?
**Inferred default:** **Cache for 60 seconds** in-memory per Vercel function instance. Aggregations re-run on demand if cache miss. R-TASK-128 alerting and TASK-052 dashboard polling at 60s intervals match this naturally. No Redis cache (would require separate Upstash key per metric — overhead exceeds benefit at v1 scale). [INFERRED-FROM: Q-7.6 default in TASK-052 + cost discipline]
**Expected answer:** "use default", specify TTL, or "no cache (always fresh)."

#### Q-7.3 — Date range filter
**Question:** Endpoint accepts `?range=7d|30d|90d|ytd|all` query param? Or compute all five every call?
**Inferred default:** Endpoint computes ALL 5 ranges every call and returns them in nested `new_signups.{7d,30d,90d,ytd,all}` shape. Client picks which to display. [INFERRED-FROM: Q-7.1 default shape]
**Expected answer:** "use default" or specify.

#### Q-7.4 — Admin role check
**Question:** Confirm: route uses `verifyAdmin` (admin OR super_admin). Per Q-7.5 default, `/admin` charts visible to both; mutations to super_admin only.
**Inferred default:** Confirmed — `verifyAdmin` is the gate. [INFERRED-FROM: TASK-006 expansion + TASK-052 expansion + R-TASK-113]
**Expected answer:** "confirm" or specify.

#### Q-7.5 — Top-N user count
**Question:** Original task says "top 10." TASK-052 expansion (already shipped) renders "top 20." Reconcile: 20?
**Inferred default:** **20.** Match TASK-052 expansion. [INFERRED-FROM: TASK-052 expansion]
**Expected answer:** "use default", "10", or specify N.

### TASK-050 — Admin Genres API

#### Q-7.6 — Endpoint shape
**Question:** Confirm GET /api/admin/genres returns:
```json
[
  { "genre": "Fantasy", "count": 450, "pct": 21.4 },
  { "genre": "Romance", "count": 380, "pct": 18.1 },
  ...
]
```
Sorted by count DESC. NULL genres excluded. Top 20 + "Other" rolls up the rest if more than 20 distinct genres.
**Inferred default:** Above. **Top 20 + Other**. [INFERRED-FROM: Decision #32 + standard analytics UI]
**Expected answer:** "use default" or specify.

#### Q-7.7 — Caching
**Question:** Same 60s in-memory cache as Q-7.2?
**Inferred default:** Yes. Genre distributions change slowly. [INFERRED-FROM: Q-7.2]
**Expected answer:** "confirm" or specify.

#### Q-7.8 — Genre normalization
**Question:** User-entered genre strings can vary ("Sci-fi", "Sci Fi", "Science Fiction"). Normalize before counting, or treat as distinct?
**Inferred default:** Normalize at write time (TASK-038 agent S6 setup writes normalized genre to `books.genre` from a controlled vocabulary). For v1, accept whatever the agent writes. Add normalization layer in v1.1 if data shows divergence. [INFERRED-FROM: agent source + scope discipline]
**Expected answer:** "use default" or specify.

### TASK-051 — Admin Users API

#### Q-7.9 — Endpoint shape
**Question:** Confirm GET /api/admin/users returns:
```json
{
  "users": [
    {
      "id": "...", "email": "...", "full_name": "...", "role": "user",
      "subscription_tier": "author", "subscription_status": "active",
      "book_count": 3, "ai_calls_this_month": 240,
      "created_at": "2026-04-12T...", "last_active_at": "..."
    }, ...
  ],
  "page": 1, "page_size": 50, "total": 4321
}
```
**Inferred default:** Above. [INFERRED-FROM: TASK-052 expansion + R-TASK-111 audit log]
**Expected answer:** "use default" or specify.

#### Q-7.10 — Search semantics
**Question:** `?search=...` query param. Match on email exact, email prefix, email full-text, full_name, or all?
**Inferred default:** **Match on email prefix (case-insensitive) OR full_name substring.** Email exact-match misses typos; full-text adds complexity for v1. Use Postgres `ILIKE 'prefix%'` for email and `ILIKE '%substring%'` for name. [INFERRED-FROM: standard admin UX]
**Expected answer:** "use default" or specify.

#### Q-7.11 — Filter params
**Question:** Filters: tier (`?tier=author`), status (`?status=active`), role (`?role=admin`)?
**Inferred default:** All three filters. Stackable. Default = all users. [INFERRED-FROM: TASK-052 admin user-detail UX]
**Expected answer:** "use default" or specify.

#### Q-7.12 — last_active_at definition
**Question:** "Last active" — based on what? Last sign-in (`auth.users.last_sign_in_at`)? Last AI call (`ai_usage_logs.created_at`)? Last book write?
**Inferred default:** **Last sign-in** from `auth.users.last_sign_in_at`. Most reliable, least query-expensive. AI/book activity correlates with sign-in for engaged users. [INFERRED-FROM: Supabase Auth schema + cost discipline]
**Expected answer:** "use default" or specify.

#### Q-7.13 — Page size override
**Question:** Original task says 50/page. Allow `?page_size=...` override (capped at 200)?
**Inferred default:** Yes — `?page_size=50` (default), capped at 200 to prevent abuse. [INFERRED-FROM: standard REST]
**Expected answer:** "use default" or specify.

### TASK-053 — Admin Genre Analytics — MIXED

#### Q-7.14 — Genre breakdown chart placement
**Question:** Genre breakdown bar chart: on the main `/admin` view (already specified in TASK-052 expansion as one of the 5 charts), or on a dedicated `/admin/genres` page?
**Inferred default:** **Both.** Main `/admin` shows top-8 + Other (donut, per TASK-052 Q-7.1). Dedicated `/admin/genres` shows full distribution + trend lines + recommendation surface (this task's deeper UI). Click-to-filter from main view to dedicated page. [INFERRED-FROM: TASK-052 expansion + Decision #32]
**Expected answer:** "use default" or specify.

#### Q-7.15 — Genre trend over time — definition of "trend"
**Question:** "Genre trend over time (which genres are growing)" — define growing how? (a) MoM book-creation rate increase, (b) fastest-rising in last 30 days, (c) absolute book-count change?
**Inferred default:** **(a) MoM book-creation rate.** Compare `books_created_this_month / books_created_last_month` per genre. Sort by ratio. Genres with <5 books/month total excluded as noise. [INFERRED-FROM: standard growth analytics]
**Expected answer:** "use default" or specify.

#### Q-7.16 — "High-demand low-competition" thresholds — OPERATOR INPUT NEEDED
**Question:** "Marketing recommendation text based on high-demand low-competition genres." Define:
- **High demand** = ?
- **Low competition** = ?
- **Recommendation surface** = ?

**Why this matters:** This is the MIXED part of TASK-053. The agent's S0 Genre Scanner has demand/competition/opportunity scores per genre (in the agent source code, derived from market research data baked in). Should `/admin/genres` recommendations USE those same scores, or define new ones from the platform's own data?

**Inferred default:** **Use the agent's S0 Genre Scanner scores as the authoritative source.** "High demand" = agent's `demand` score ≥ 7/10. "Low competition" = agent's `competition` score ≤ 4/10. Recommendation: surface genres meeting both criteria, sorted by `opportunity` score (already a derived field in the agent). Display as: "Top 3 underserved genres: Mystery (demand 8, comp 3), Westerns (demand 7, comp 2), Horror (demand 9, comp 4)."
[INFERRED-FROM: bestseller_book_agent.jsx S0 Genre Scanner source]

**Expected answer:** "use default" or specify thresholds + recommendation logic.

#### Q-7.17 — Genre filter clickthrough behavior
**Question:** "Click-to-filter" on genre breakdown chart — clicking a genre filters which view? Top-users-table? Books table? Something else?
**Inferred default:** **Filter the user list** (`/admin/users?tier_filter=...&genre_filter=Fantasy`). Useful for admin to see who's writing in which genre — ties to user lifecycle research and genre-targeted comms. [INFERRED-FROM: TASK-051 user list + Decision #32 marketing intelligence]
**Expected answer:** "use default" or specify.

#### Q-7.18 — Genre recommendation refresh cadence
**Question:** Recommendations re-compute on every page load, or daily cron, or real-time?
**Inferred default:** **Cached with Q-7.7's 60s TTL on the metrics endpoint.** Real-time would query the genres distribution every page load — wasteful at 60s polling intervals. [INFERRED-FROM: Q-7.7]
**Expected answer:** "use default" or specify.

#### Q-7.19 — Super-admin only?
**Question:** Per Q-7.5 (TASK-052 expansion), super-admin-only views are: audit log, user mutations, billing. Is genre analytics super-admin or admin-visible?
**Inferred default:** **Admin-visible** (both admin and super_admin). Genre analytics is read-only intelligence; no risk to surface to admins. [INFERRED-FROM: TASK-052 Q-7.5 default]
**Expected answer:** "use default" or specify.

---

## Phase 8 — Email (TASK-054, 055, 056), 14 questions

### TASK-054 — Welcome Email — MIXED

#### Q-8.1 — Subject line
**Question:** Welcome email subject line. Operator-input territory.
**Inferred default:** "Welcome to My Best Selling Novel!" — friendly, plain, scannable in inbox preview. [INFERRED-FROM: Decision #27 brand]
**Expected answer:** "use default" or specify.

#### Q-8.2 — Sender display name
**Question:** "From" name in email client: "My Best Selling Novel", "MyBSN Team", "Steve at My Best Selling Novel"?
**Inferred default:** "My Best Selling Novel" — brand-first, no fake-personal. [INFERRED-FROM: Decision #27 + standard SaaS]
**Expected answer:** "use default" or specify.

#### Q-8.3 — Body content
**Question:** Original task says: greeting with name, link to /app, link to /demo, brand. Anything else?
**Inferred default:** Plus: a 1-line value reminder ("Your AI-powered novel-writing assistant is ready"), CTA button to /app, secondary CTA to /demo, footer with /help link + unsubscribe (R-TASK-119 + R-TASK-135 CAN-SPAM compliance) + physical address (CAN-SPAM requirement). [INFERRED-FROM: R-TASK-119 + R-TASK-135 + CAN-SPAM Act]
**Expected answer:** "use default" or specify.

#### Q-8.4 — Copy voice
**Question:** Friendly-casual ("Hey Sarah! Welcome aboard..."), professional-warm ("Hi Sarah, welcome to..."), or formal ("Dear Sarah, Thank you for...")?
**Inferred default:** **Professional-warm.** Casual feels off-brand for a writing-tool serving authors who are typically detail-oriented; formal feels distant. [INFERRED-FROM: Crimson Pro brand voice + persona analysis]
**Expected answer:** "use default" or specify.

#### Q-8.5 — Physical address (CAN-SPAM)
**Question:** CAN-SPAM Act requires a valid physical postal address in commercial emails. What address?
**Why this matters:** This is a real legal requirement that operator must answer. Cannot be inferred.
**Inferred default:** No useful default. Likely operator's Grantsville, UT business address or a registered-agent address. **Operator MUST answer.**
**Expected answer:** Specify physical address (e.g., "PO Box 123, Grantsville, UT 84029").

### TASK-055 — Upgrade Email

#### Q-8.6 — Upgrade email subject + variations
**Question:** Single subject for all upgrades, or tier-specific ("Welcome to Author!", "Welcome to Publisher!")?
**Inferred default:** Tier-specific. Better personalization, ~5min more work. "Welcome to Author!" / "Welcome to Publisher!". [INFERRED-FROM: Q-8.1 voice + standard SaaS]
**Expected answer:** "use default" or specify.

#### Q-8.7 — Features-unlocked list
**Question:** List features unlocked at the new tier? Or just confirm the upgrade?
**Inferred default:** List features unlocked. Reinforces value of upgrade ("here's what you just got access to"). For Author: 6-bullet list per Q-6.13. For Publisher: 4-bullet list of Publisher-extras above Author. [INFERRED-FROM: Q-6.13 tier features]
**Expected answer:** "use default" or specify.

#### Q-8.8 — Receipt vs upgrade email
**Question:** Stripe sends a receipt automatically. Does this upgrade email duplicate that, or only contain upgrade-specific content?
**Inferred default:** **Upgrade-specific only.** Don't duplicate Stripe's receipt. The email focuses on "you're upgraded, here's what you got, here's how to use it." Mention "Stripe sent your receipt separately" with a small note. [INFERRED-FROM: Stripe + R-TASK-135 receipt template]
**Expected answer:** "use default" or specify.

#### Q-8.9 — Annual vs monthly variation
**Question:** Different copy for annual upgraders ("You saved 10% with annual!") vs monthly?
**Inferred default:** Yes — one extra line for annual. "Smart move — you saved 10% by going annual." [INFERRED-FROM: Decision #29]
**Expected answer:** "use default" or specify.

### TASK-056 — Email Wiring

#### Q-8.10 — Welcome email trigger point
**Question:** When does welcome email fire — on `auth.signUp` success, or on first sign-in (after email verification)?
**Inferred default:** On `auth.signUp` success (immediately). Even if user hasn't verified email yet, the welcome email IS the verification-prompt-with-context. [INFERRED-FROM: TASK-008 expansion + Q-2.11 soft email gate]
**Expected answer:** "use default" or specify.

#### Q-8.11 — Upgrade email trigger point
**Question:** Fires from `subscription.created` webhook handler (TASK-024). Confirm timing: synchronous in webhook, or queued for async fire-and-forget?
**Inferred default:** **Async fire-and-forget.** Webhook handler returns 200 fast (per Stripe best practice — handlers >10s get retried). Email queued via simple `Promise.resolve().then(sendUpgradeEmail).catch(logToSentry)` pattern. R-TASK-104 doesn't apply (this isn't user-facing). [INFERRED-FROM: Stripe webhook best practice + original TASK-056 "fire-and-forget"]
**Expected answer:** "use default" or specify.

#### Q-8.12 — Failure handling
**Question:** Resend send fails (API down, rate-limit). Retry, log-and-drop, or queue for retry?
**Inferred default:** **Log-and-drop with Sentry warning.** Resend has 99.9% uptime SLA; failures are rare and the user already signed up successfully (welcome email is nice-to-have, not flow-critical). For paid upgrades, the receipt from Stripe still arrives independently. R-TASK-107 support inbox catches the rare "I never got my welcome email" ticket. [INFERRED-FROM: cost discipline + R-TASK-106 Sentry + R-TASK-107]
**Expected answer:** "use default" or specify (e.g., "queue for retry via Vercel Cron").

#### Q-8.13 — Test environment behavior
**Question:** In dev/staging, do emails actually send to real addresses, or get redirected to a test inbox?
**Inferred default:** **Redirect to a test inbox** in dev + staging. Use Resend's "Test" mode or hard-code `RESEND_TEST_INBOX` env var that intercepts all emails in non-production. Production sends real emails. [INFERRED-FROM: standard SaaS dev/prod separation + R-TASK-122 staging]
**Expected answer:** "use default" or specify.

#### Q-8.14 — Resend webhook for delivery status?
**Question:** Subscribe to Resend's delivery webhooks (delivered, bounced, complained) to track email health?
**Inferred default:** **Defer to v1.1.** Adds complexity for marginal v1 value. Bounced emails surface as Sentry warnings via Q-8.12 anyway. [INFERRED-FROM: cost discipline]
**Expected answer:** "use default", "implement in v1", or specify.

---

## Phase 9 — Analytics & Polish (TASK-058, 059, 060, 062), 16 questions

### TASK-058 — Google Analytics 4 — MIXED

#### Q-9.1 — GA4 measurement strategy
**Question:** Cookie-based standard GA4, or cookieless mode (privacy-first)?
**Inferred default:** **Cookie-based standard GA4 with consent gate** (per R-TASK-119 cookies/privacy). GA tag does NOT load until user accepts cookies in consent banner. Cookieless mode is more aggressive about privacy but loses signup attribution. [INFERRED-FROM: Decision #29 + R-TASK-119]
**Expected answer:** "use default" or specify.

#### Q-9.2 — GA event taxonomy — OPERATOR INPUT NEEDED
**Question:** Confirm or refine the event taxonomy:

| Event | When fires | Properties |
|---|---|---|
| `page_view` | Every route change | path, referrer |
| `sign_up` | Successful signup completes | tier (always 'explorer' at signup per Q-2.9), source (landing\|pricing\|tour\|other) |
| `subscription_purchase` | webhook subscription.created | tier (author\|publisher), interval (monthly\|annual), value_usd |
| `tour_complete` | User reaches tour stop 14 | duration_seconds |
| `book_created` | First book POST /api/books success | tier (current user tier) |
| `chapter_written` | Chapter PUT with non-empty content | book_id, chapter_index, word_count_delta |
| `signup_modal_opened` (per Q-6.18) | Modal open | source |
| `tour_complete_to_signup` (per Q-6.9) | Tour stop 14 → signup CTA click | (none) |
| `ai_call` | /api/ai success | step (0-11), function_name, tokens, latency_ms |
| `export_initiated` | Export click | format (pdf\|epub\|docx) |

**Conversion events (designated in GA4 admin):** `sign_up`, `subscription_purchase`.

**Inferred default:** Above table. [INFERRED-FROM: Decision #29 + Q-6.9 + Q-6.18 + standard GA4 SaaS taxonomy]
**Expected answer:** "use default" or specify modifications.

#### Q-9.3 — User_id binding
**Question:** GA4's User-ID feature lets you bind events to authenticated users. Enable?
**Inferred default:** **Enable post-signup.** Set GA `user_id` to the user's Supabase user_id (already a UUID, no PII) on every page view after sign-in. Lets you analyze signup-to-purchase funnels per user across sessions/devices. [INFERRED-FROM: Decision #29 + standard GA4]
**Expected answer:** "use default" or specify.

#### Q-9.4 — IP anonymization
**Question:** GA4 anonymizes IP by default. Confirm + document in privacy policy?
**Inferred default:** **Confirmed.** GA4 default behavior + already disclosed in TASK-057 Privacy Policy data-categories enumeration (Q-8.6). [INFERRED-FROM: GA4 defaults + TASK-057 expansion]
**Expected answer:** "confirm" or specify.

#### Q-9.5 — Server-side GA?
**Question:** Send some events server-side (e.g., `subscription_purchase` from webhook) for accuracy, or client-side only?
**Inferred default:** **Hybrid.** Most events client-side (page_view, sign_up, tour_complete, etc.). Webhook-driven events (`subscription_purchase`) sent server-side via GA Measurement Protocol — client may be closed or on a different device when Stripe webhook fires. [INFERRED-FROM: Decision #29 + Stripe webhook timing]
**Expected answer:** "use default" or specify.

### TASK-059 — Error Boundaries

#### Q-9.6 — ErrorBoundary scope
**Question:** Original task says "wrap AgentShell, admin dashboard, demo pages." Add: account dashboard, signup/signin pages, /app book detail?
**Inferred default:** Wrap top-level layouts: `app/(app)/layout.tsx`, `app/(auth)/layout.tsx`, `app/admin/layout.tsx`, `app/account/layout.tsx`, `app/demo/page.tsx`. Plus `AgentShell` specifically (it's a heavy single component). Public marketing pages (/, /pricing, /terms, etc.) don't need it — minimal JS, low crash risk. [INFERRED-FROM: original + R-TASK-106 Sentry]
**Expected answer:** "use default" or specify.

#### Q-9.7 — Error UI design
**Question:** Generic "Something went wrong, [Retry]" or context-specific copy per boundary?
**Inferred default:** **Generic with optional context prop.** `<ErrorBoundary context="agent">` lets the boundary show "Something went wrong while loading the writing agent. [Retry]" — retry triggers `window.location.reload()`. Context-less boundaries show generic copy. Sentry captures full stack regardless. [INFERRED-FROM: original + R-TASK-106]
**Expected answer:** "use default" or specify.

#### Q-9.8 — Sentry capture timing
**Question:** R-TASK-106 replaces `console.error` with `Sentry.captureException`. In ErrorBoundary `componentDidCatch`, Sentry is called. What about the `errorInfo` (component stack)?
**Inferred default:** Pass `errorInfo` as Sentry extras: `Sentry.captureException(error, { extra: { componentStack: errorInfo.componentStack } })`. Lets Sentry surface React component tree on the error event for faster debugging. [INFERRED-FROM: R-TASK-106 + Sentry React docs]
**Expected answer:** "use default" or specify.

#### Q-9.9 — Reset behavior
**Question:** "Retry" button — does it reset the boundary's error state (try to re-render the same children) or trigger full page reload?
**Inferred default:** **Full page reload (`window.location.reload()`).** Resetting the boundary's state often re-hits the same error. Page reload re-fetches data and restarts cleanly; user loses unsaved work but unsaved-work loss is already a known UX limitation pre-R-TASK-144. [INFERRED-FROM: standard React error UX]
**Expected answer:** "use default" or specify.

### TASK-060 — Loading States

#### Q-9.10 — Spin component design
**Question:** Single `<Spin>` component used everywhere, or page-specific skeletons?
**Inferred default:** **Both.** Generic `<Spin>` for short waits (<500ms), page-specific skeletons (matching layout) for longer waits. TASK-010 already created `<Skeleton>` for guards; reuse it. [INFERRED-FROM: TASK-010 expansion + standard React UX]
**Expected answer:** "use default" or specify.

#### Q-9.11 — Loading UX targets
**Question:** Confirm pages requiring loading states: library page (loading books), agent steps (loading book data), admin dashboard (loading metrics), account page (loading profile).
**Inferred default:** Confirmed. Plus: pricing page during Checkout-session creation (button shows "Loading..."), help page during markdown render (only on first SSR). [INFERRED-FROM: original + Q-9.10]
**Expected answer:** "confirm" or specify additions.

#### Q-9.12 — Skeleton vs spinner choice rule
**Question:** When to use skeleton vs spinner — formal rule?
**Inferred default:** **Spinner if expected duration <500ms or layout unknown. Skeleton if expected ≥500ms AND layout is known (matches the rendered shape).** Auth-loading uses skeleton (TASK-010); book list uses skeleton; chapter content load uses spinner inline. [INFERRED-FROM: TASK-010 + standard React UX]
**Expected answer:** "use default" or specify.

### TASK-062 — Brand Consistency

#### Q-9.13 — Search-replace targets
**Question:** Beyond "Bestseller Book Agent" → "My Best Selling Novel", any other historical names to replace?
**Inferred default:** Search-replace targets:
- "Bestseller Book Agent" → "My Best Selling Novel"
- "bestseller_book_agent" (file/component refs) → keep as-is in agent files per ADR-003 (verbatim port forbids renames there); replace in non-agent code
- "books.woulfai.com" → "mybestsellingnovel.com" (Decision #26)
- "Book Agent" (standalone, not "Bestseller Book Agent") → "My Best Selling Novel"
- Any "MyBSN" stylings (uppercase) — keep as occasional shorthand in dev docs but never user-facing
[INFERRED-FROM: Decisions #26-28 + ADR-003 + audit history]
**Expected answer:** "use default" or specify.

#### Q-9.14 — Meta description per page
**Question:** Each page gets a unique meta description? Or shared site-wide meta?
**Inferred default:** **Per page.** Specific descriptions improve search snippets:
- `/`: "AI-powered novel writing for indie authors. From blank page to bestseller list — guided 12-step agent, three-path manuscript intake, and built-in marketing intelligence."
- `/pricing`: "Simple pricing: free Explorer tier with 1 book + 25 AI calls, or upgrade to Author ($29/mo) for unlimited books."
- `/tour`: "See how My Best Selling Novel works — 14-stop guided tour with hands-on demos."
- `/help`: "Step-by-step tutorial covering all 12 steps of the My Best Selling Novel writing agent."
- `/terms`, `/privacy`, etc.: simple descriptions like "Terms of Service for My Best Selling Novel."
[INFERRED-FROM: SEO best practice + R-TASK-119 legal pages]
**Expected answer:** "use default" or specify.

#### Q-9.15 — Open Graph + Twitter Card?
**Question:** Add OG tags + Twitter Card meta for social sharing?
**Inferred default:** **Yes.** OG image = brand-gold/navy banner with "My Best Selling Novel" + tagline. Twitter Card = `summary_large_image`. Same image at `/public/og-image.png`. [INFERRED-FROM: standard SaaS + Decision #27]
**Expected answer:** "use default" or specify.

#### Q-9.16 — Favicon set
**Question:** Beyond `favicon.ico`, generate apple-touch-icon, manifest.json icons, etc.?
**Inferred default:** Yes — full favicon set generated from brand-gold pen icon: `favicon.ico`, `apple-touch-icon.png` (180x180), `icon-192.png`, `icon-512.png`, `manifest.json` (basic PWA descriptor — no full PWA in v1). [INFERRED-FROM: standard SaaS]
**Expected answer:** "use default" or specify.

---

## Phase 10 — E2E & Deploy (TASK-063, 064, 065, 066, 067, 068), 25 questions

### TASK-063 — E2E Auth Test

#### Q-10.1 — Manual or Playwright?
**Question:** Original task says "Manual test." Per R-TASK-130 (testing baseline), is this implemented in Playwright now or manual?
**Inferred default:** **Manual checklist in v1, Playwright migration in R-TASK-130.** TASK-063 ships as a markdown checklist in `docs/manual-tests/auth.md`. R-TASK-130 expansion (Phase 11) converts to `e2e/auth.spec.ts`. Both coexist for some time. [INFERRED-FROM: R-TASK-130 + ADR-005 manual-test pattern]
**Expected answer:** "use default" or specify (e.g., "Playwright from day one").

#### Q-10.2 — Test cases — confirm matrix
**Question:** Confirm the 8 test cases:
1. Signup with new email → profile.tier=explorer + 3 acceptance rows (per TASK-008 expansion)
2. Signin (valid credentials) → /app loads with skeleton then content
3. Signin (invalid) → error message, stays on /signin
4. Signout → redirects to / and AuthGuard blocks /app
5. Forgot password → reset email arrives in test inbox
6. Reset link → password reset succeeds, signin works with new password
7. AuthGuard redirect when signed out → /app → /signin?returnTo=/app
8. Session persists across page refreshes (cookie-based per Decision #18)

**Inferred default:** Above 8 cases. [INFERRED-FROM: TASK-008 + TASK-009 expansions + TASK-007 middleware + Decision #18]
**Expected answer:** "use default" or specify.

#### Q-10.3 — HIBP test path
**Question:** Test signup with a known-breached password (e.g., "password123456") to verify HIBP rejection per TASK-008?
**Inferred default:** Yes. Add as case 9: "Signup with breached password → 'password_breached' error displayed, no account created." [INFERRED-FROM: TASK-008 expansion]
**Expected answer:** "use default" or specify.

#### Q-10.4 — MFA banner test
**Question:** Test the post-signup MFA banner per Q-2.10 default (option d, dismissable)?
**Inferred default:** Yes. Add as case 10: "First /app load post-signup → MFA banner visible. Click Dismiss → banner gone, profile.mfa_banner_dismissed=true. Refresh → banner stays gone." [INFERRED-FROM: TASK-008 expansion + Q-2.10]
**Expected answer:** "use default" or specify.

### TASK-064 — E2E Books Test

#### Q-10.5 — Test cases matrix
**Question:** Confirm cases:
1. Create book → POST /api/books, navigate to /app/[bookId]
2. Add chapters via agent → upserts via PUT /api/chapters/[bookId]/[index]
3. Smart-diff save → only changed chapter sent (verify Network panel)
4. Close tab, reopen → data restored
5. Delete book → confirmation modal → cascade deletes chapters + audio
6. Explorer tier 2nd book → blocked at API (POST returns 'book_limit_reached')

**Inferred default:** Above 6. [INFERRED-FROM: TASK-017 + TASK-018 + TASK-016 + Decision #24]
**Expected answer:** "use default" or specify.

#### Q-10.6 — Tier transition test
**Question:** Test: Explorer creates book 1 → upgrades to Author → can now create books 2+?
**Inferred default:** Yes — case 7. Per Q-3.4 status transition default, upgrade quota raises immediately. [INFERRED-FROM: Q-3.4 + TASK-016 expansion]
**Expected answer:** "use default" or specify.

#### Q-10.7 — Audio cascade test
**Question:** Delete chapter that has audio → audio also deleted (per Q-3.9)?
**Inferred default:** Yes — case 8. [INFERRED-FROM: Q-3.9]
**Expected answer:** "use default" or specify.

#### Q-10.8 — Concurrent edit test
**Question:** Test the last-write-wins behavior per Q-3.8?
**Inferred default:** **Skip in v1 e2e.** Single-user scenario means concurrent edits are uncommon and not differentiating; also harder to script reliably. Document the behavior in `docs/known-limitations.md` instead. [INFERRED-FROM: Q-3.8 + scope discipline]
**Expected answer:** "use default" or specify.

### TASK-065 — E2E Billing Test

#### Q-10.9 — Test cases matrix (post-A.3 — 4 SKUs not 6)
**Question:** Confirm cases per Q-4.10:
1. Explorer → Author monthly checkout → webhook → tier=author, status=active
2. Author monthly → Publisher annual upgrade via portal → webhook → tier=publisher (Stripe pro-rates)
3. Publisher annual → cancel via portal → webhook → cancel_at_period_end=true, tier still publisher
4. Wait/simulate period_end → cron → tier=explorer, status=free
5. payment_failed → webhook → status=past_due + dunning email
6. Webhook idempotency (PATCH-002): submit same event.id twice → only processed once

**Inferred default:** Above 6 cases. **No lifetime test** (eliminated A.3). [INFERRED-FROM: Q-4.10 + A.3 + PATCH-002]
**Expected answer:** "use default" or specify.

#### Q-10.10 — Stripe CLI vs production
**Question:** Test in dev with `stripe listen --forward-to localhost:3000/api/stripe/webhook`, or in staging/preview Vercel env?
**Inferred default:** Stripe CLI for dev (TASK-026 manual checklist already specifies this). R-TASK-130 / Phase 11 migrates to staging env tests via R-TASK-122 staging environment. [INFERRED-FROM: TASK-026 + R-TASK-122]
**Expected answer:** "use default" or specify.

#### Q-10.11 — 3DS card test
**Question:** Per Q-4.11 (full test deck), include 3D Secure card test?
**Inferred default:** Yes — case 7: "Subscribe with 3DS-required card `4000 0027 6000 3184` → 3DS challenge → on success, webhook fires, tier updates." [INFERRED-FROM: Q-4.11]
**Expected answer:** "use default" or specify.

#### Q-10.12 — Refund test
**Question:** Test the 14-day refund window? (Trigger via Stripe Dashboard → refund → webhook → status updates?)
**Inferred default:** Yes — case 8: "Refund issued via Stripe Dashboard within 14d window → webhook → status updates appropriately, user retains access until refund processes (or doesn't, depending on Stripe Dashboard refund toggle)." Document the exact behavior observed for the operator's reference. [INFERRED-FROM: R-TASK-119 refund policy + Q-8.2 14-day window]
**Expected answer:** "use default" or specify.

### TASK-066 — E2E Agent Test

#### Q-10.13 — Test scope
**Question:** "Full agent flow" — every step (0-11) plus library? Or sample subset?
**Inferred default:** **Full flow per original task spec.** Genre scan → setup → upload → organize → outline → front/back matter → chapter guide → write → AI review → description → publishing setup → cover upload → export. Plus library round-trip (close, reopen, edit). [INFERRED-FROM: original task]
**Expected answer:** "use default" or specify.

#### Q-10.14 — AI call verification
**Question:** Per ADR-003 golden-output suite (R-TASK-126), every AI call returns expected output structure. Is TASK-066 the test that validates this, or does R-TASK-126 own that validation?
**Inferred default:** **R-TASK-126 owns golden-output validation** (the regression suite for the agent). TASK-066 verifies user-facing flow (agent UI works, AI responses arrive, save, export). The two are complementary. [INFERRED-FROM: ADR-003 + R-TASK-126]
**Expected answer:** "use default" or specify.

#### Q-10.15 — Test data
**Question:** Test with: a real fictional manuscript (e.g., "The God in You" cover example operator already has), a synthetic short test ("Once upon a time, there was..."), or both?
**Inferred default:** **Both.** Synthetic short for fast smoke test (~2 min); real manuscript for stress test (~30 min, run weekly not per-PR). [INFERRED-FROM: standard E2E patterns]
**Expected answer:** "use default" or specify.

#### Q-10.16 — Audio recording mocked?
**Question:** Mic access doesn't work in headless test environments. Mock the audio with a pre-recorded webm file?
**Inferred default:** Yes. `e2e/fixtures/sample-chapter.webm` (10 seconds, ~50KB) uploaded via `POST /api/audio` directly, bypassing the MediaRecorder UI. The MediaRecorder UI itself is exercised manually. [INFERRED-FROM: bestseller_complete_audit.md "Microphone recording blocked in artifact sandbox"]
**Expected answer:** "use default" or specify.

#### Q-10.17 — ADR-003 golden-output dependency
**Question:** TASK-066 ships before or after R-TASK-126 (golden-output suite)?
**Inferred default:** **Before.** TASK-066 in Phase 10 (Integration Testing). R-TASK-126 in Phase 11 (Production Readiness). TASK-066 establishes the user-flow tests; R-TASK-126 adds golden-output rigor on top. [INFERRED-FROM: BUILD_STRATEGY_ADDENDUM phase ordering]
**Expected answer:** "use default" or specify.

### TASK-067 — Security Audit

#### Q-10.18 — Audit checklist scope
**Question:** Confirm 6 checks per original task:
1. Unauth API call → 401
2. User A can't access user B's books/audio/chapters → 403 / 0 rows
3. Webhook rejects invalid signatures
4. ANTHROPIC_API_KEY not in client bundle
5. SUPABASE_SERVICE_ROLE_KEY not in client bundle
6. Admin routes reject non-admin users

**Inferred default:** Above 6, plus expansions:
7. Rate-limit triggers per R-TASK-104 (4 signups in 60s from same IP → 429)
8. HIBP password breach rejection per Q-10.3
9. MFA enforcement on /admin per Q-2.14
10. CSRF protection on state-changing routes (Next.js form actions provide this; verify)
11. SQL injection probe on search params (e.g., `?email=admin'--` returns no error, just no match)
12. XSS probe on user-content (book titles, chapter content) — render-time escaping verified
[INFERRED-FROM: original + R-TASK-104 + R-TASK-103 + WoulfAI rule 10]
**Expected answer:** "use default" or specify.

#### Q-10.19 — Bundle inspection method
**Question:** How to verify keys aren't in client bundle? Manual `grep` of `.next/static/chunks/*.js`? Automated check?
**Inferred default:** Both. Manual grep documented in `docs/manual-tests/security.md`. R-TASK-130 testing baseline can add a mechanical CI check (`grep -r "sk_live\|service_role" .next/static/` returning zero matches as a CI gate). [INFERRED-FROM: standard SaaS security + R-TASK-130]
**Expected answer:** "use default" or specify.

#### Q-10.20 — Penetration testing scope
**Question:** Hire a third-party pentest before public launch?
**Inferred default:** **Defer to post-launch / 1000-paying-customer milestone.** v1 is small surface area; in-house audit (TASK-067) plus R-TASK-104/106/119/130 controls cover the major risks. Pentest at scale gate (1000 customers or $50K MRR, whichever first). [INFERRED-FROM: cost discipline + risk register R-150]
**Expected answer:** "use default" or specify.

#### Q-10.21 — Bug bounty program
**Question:** Establish a public bug bounty (e.g., HackerOne) at launch?
**Inferred default:** **No bounty program at v1 launch.** R-TASK-119 specifies a Vulnerability Disclosure Policy (`/vuln-disclosure`) with email-based responsible disclosure — adequate for v1 scale. Bounty program at the same scale gate as pentest (Q-10.20). [INFERRED-FROM: R-TASK-119 + cost discipline]
**Expected answer:** "use default" or specify.

### TASK-068 — Production Deploy

#### Q-10.22 — Vercel project settings
**Question:** Single Vercel project (production + preview branches), or separate Vercel projects (production vs staging)?
**Inferred default:** **Single Vercel project** — Vercel auto-creates preview deployments per branch/PR; staging is a long-lived `staging` branch on its own subdomain (`staging.mybestsellingnovel.com`). R-TASK-122 handles staging Supabase project pairing. [INFERRED-FROM: Vercel best practice + R-TASK-122]
**Expected answer:** "use default" or specify.

#### Q-10.23 — Environment variable management
**Question:** Vercel env vars set via dashboard, CLI (`vercel env add`), or `.env.production` file committed encrypted?
**Inferred default:** **Vercel dashboard for production**, CLI for staging/preview. Never commit env files (even encrypted) — keys rotate via R-TASK-115 procedure. Document in `docs/STRIPE_SETUP.md` (TASK-020) which 16 vars need to be set. [INFERRED-FROM: Vercel best practice + R-TASK-115]
**Expected answer:** "use default" or specify.

#### Q-10.24 — Custom domain DNS
**Question:** Domain `mybestsellingnovel.com` — DNS managed by domain registrar, Cloudflare, Vercel?
**Inferred default:** **Cloudflare** for DNS (DDoS protection at the edge, free tier covers v1 scale). Vercel A/CNAME records pointed via Cloudflare. SSL handled by Vercel (auto-renew). [INFERRED-FROM: standard SaaS infrastructure]
**Expected answer:** "use default" or specify.

#### Q-10.25 — Smoke test post-deploy
**Question:** After production deploy, what's the immediate smoke test before announcing?
**Inferred default:** Sequential checks (R-TASK-141 covers full pre-launch checklist; this is the immediate post-deploy subset):
1. https://mybestsellingnovel.com loads (200 status)
2. /api/health returns `{status:'ok'}` (PATCH-003)
3. Signup with operator's test account → succeeds + welcome email arrives
4. Create book → succeeds
5. Trigger AI call → response within 30s
6. Open Stripe Checkout → loads
7. Subscribe with test card → webhook fires → tier updates
8. GA4 page_view event arrives in GA Real-Time view
9. Sentry test error captured

**Inferred default:** Above 9-step smoke. [INFERRED-FROM: original TASK-068 + R-TASK-141 + PATCH-003]
**Expected answer:** "use default" or specify.

---

## End of QUESTIONS-FOR-OPERATOR.md

**Total: 144 questions across 9 phases.**

When you reply with answers, name which questions are being answered. I will:
1. Update the Progress Tracker
2. Run a B.3 expansion pass on every task whose questions are all answered
3. Surface any RESIDUAL-QUESTIONS-ROUND-N.md if expansion can't complete without more input
4. Stop and wait for the next installment

Suggested first installment for fastest progress to expansion: **Phase 1 + Phase 2 (16 questions, mostly "use default" candidates)** — unblocks 4 task expansions immediately.

The Phase 8 questions include one operator-must-answer (Q-8.5 physical address for CAN-SPAM). Don't skip that one when you get to Phase 8 — it's the only legal-compliance hard requirement in this batch.
