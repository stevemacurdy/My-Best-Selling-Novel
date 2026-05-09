<!-- APPLY: REPLACE -->
<!-- Target: docs/ENGINEERING_DECISIONS.md (in original mybsn package) -->
<!-- Backup: docs/PATCHES-TO-ORIGINAL/backups/ENGINEERING_DECISIONS.pre-modification-backup.md -->

# ENGINEERING DECISION LOG
## My Best Selling Novel — All Decisions Approved
## April 2026 (revised May 2026 for lifetime tier elimination)

---

## Revisions log

- **2026-05-05** — Decision #7: removed "2 team seats" per R-TASK-101 Path A (team seats deferred to v2).
- **2026-05-05** — Decision #11: split into 11a (AI prompt strings frozen verbatim) + 11b (JSX coding conventions modernizable behind golden-output behavioral tests) per ADR-003 approval.
- **2026-05-06** — Decision #29: lifetime tier eliminated entirely. Stripe price IDs reduced from 6 to 4. Operator decision; rationale: long-tail liability of "lifetime of product" SKU outweighed revenue. ADR-004 (lifetime surrounding-controls dependency) voided as a consequence.
- **2026-05-06** — Decision #33: revised. Terms of Service still required; "lifetime = lifetime of product" language struck (no lifetime SKU exists). Privacy Policy still required.

---

## APPROVED AS ORIGINALLY PROPOSED (21 decisions)

| # | Decision | Status |
|---|----------|--------|
| 1 | Next.js 14 App Router + TypeScript + Vercel deployment | ✅ Approved |
| 2 | Supabase for auth + database + storage | ✅ Approved |
| 3 | Stripe webhook is sole source of truth for subscription tier | ✅ Approved |
| 4 | Three tiers: Explorer (Free), Author ($29/mo), Publisher ($79/mo) | ✅ Approved |
| 5 | Explorer: 1 book, 25 AI calls/mo, no exports, no audio | ✅ Approved |
| 6 | Author: unlimited books, 500 AI calls/mo, all features | ✅ Approved |
| 7 | Publisher: unlimited books, 2,000 AI calls/mo, folder upload | ✅ Approved (revised 2026-05-05: team seats removed per R-TASK-101 Path A) |
| 8 | All Claude API calls proxied through /api/ai — key never exposed to browser | ✅ Approved |
| 9 | Single shared verifyToken() in lib/api-auth.ts — no duplicate auth functions | ✅ Approved |
| 10 | Lazy SDK initialization for Stripe, Claude, Resend | ✅ Approved |
| 11 | Agent ported verbatim — split per ADR-003: 11a (AI prompts frozen) + 11b (JSX modernizable behind golden-output tests) | ✅ Approved (revised 2026-05-05) |
| 12 | No useCallback in agent components (causes stale closures) | ✅ Approved |
| 13 | All AI prompt strings preserved word-for-word including anti-fact-scrambling | ✅ Approved |
| 14 | Chapter splitter: 6 heading formats (Chapter/Ch./Part/Section/Lesson/spelled-out/standalone numbers) | ✅ Approved |
| 15 | Cover storage: small in DB, large in Supabase Storage bucket | ✅ Approved |
| 16 | RLS on every table — users only access own data | ✅ Approved |
| 17 | Tier gating enforced server-side only — client cosmetic only | ✅ Approved |
| 18 | Session via HTTP-only cookies with middleware refresh | ✅ Approved |
| 19 | Gold (#D4A853) / navy (#0f1b33) theme with Crimson Pro font — kept | ✅ Approved |
| 20 | Usage tracking: every AI call logged with tokens, latency, step, function | ✅ Approved |
| 21 | "Built by WoulfAI" in footer | ✅ Approved |

---

## CHANGED FROM ORIGINAL PROPOSAL (12 decisions)

| # | Original Decision | Changed To | Reason |
|---|-------------------|------------|--------|
| 22 | Book content stored as JSONB in books table (~2.5MB for 200K words) | **Split into separate `chapters` table** — one row per chapter with content, title, word_count | Unlimited book size, no row size concerns |
| 23 | Supabase Free plan | **Supabase Pro ($25/mo)** — 100GB storage | Real audiobook storage needs 100GB |
| 24 | Auto-save every 1 second (full book state) | **Smart diff** — only send changed fields | 200K+ word manuscripts would be 2.5MB per save on old approach |
| 25 | AI chapter writing capped at 8,192 tokens (~6K words) | **Raised to 16,384 tokens** (~12K words per chapter) | Authors need longer chapters in single generation |
| 26 | Domain: books.woulfai.com | **mybestsellingnovel.com** | Its own brand, separate from WoulfAI platform |
| 27 | Brand: "Bestseller Book Agent" under WoulfAI | **"My Best Selling Novel"** — standalone brand | Own identity, own domain, own marketing |
| 28 | Email: noreply@mail.woulfai.com | **noreply@mybestsellingnovel.com** | Matches new brand domain |
| 29 | Monthly billing only | **Monthly + Annual (10% off)** | Two pricing options for different buyer types. **Lifetime tier eliminated 2026-05-06 per operator decision (PATCH-3 Q-8.2); long-tail liability of one-time-payment "lifetime of product" SKU outweighed revenue. ADR-004 voided as consequence.** |
| 30 | No admin dashboard | **Full admin dashboard** with charts, filters, genre analytics | Need metrics to run the business and dial in marketing |
| 31 | No admin role | **role column in profiles** ('user' \| 'admin' \| 'super_admin') — admin access to /admin | Admin dashboard access control. Super_admin added 2026-05-05 per R-TASK-113 |
| 32 | No genre analytics | **Genre tracking across all books** for marketing intelligence | Know which genres are hot to target ads |
| 33 | Basic legal pages not discussed | **Generate Terms of Service + Privacy Policy** | Stripe compliance + general SaaS legal hygiene. Original "lifetime = lifetime of product" language struck 2026-05-06 with elimination of lifetime tier; remaining legal manifest expanded to 9 pages per R-TASK-119 (ToS, Privacy, Refunds, AUP-as-section-of-ToS, Cookies, DMCA, AI/ML disclosure, Vuln Disclosure, A11y Statement) |

---

## COMPLETE PRICING TABLE (revised 2026-05-06)

| Tier | Monthly | Annual (10% off) |
|------|---------|-------------------|
| Explorer | Free | — |
| Author | $29/mo | $313.20/year |
| Publisher | $79/mo | $853.20/year |

**Stripe configuration needed:**
- **4 price IDs:** `author_monthly`, `author_annual`, `publisher_monthly`, `publisher_annual` (was 6; `author_lifetime` and `publisher_lifetime` removed 2026-05-06)
- All recurring; no Stripe one-time payment mode used
- Pricing page needs monthly/annual toggle (was monthly/annual/lifetime)

---

## NEW DATABASE SCHEMA ADDITIONS

(Original schema additions section unchanged — see backup file for full content if needed. The `subscription_status` enum no longer needs `'lifetime'` value; valid values: `'active' | 'past_due' | 'cancelled' | 'free'`.)

---

## ADMIN DASHBOARD SPEC

(Unchanged — see backup file. Note: tier-distribution chart shows 5 segments not 6 — Explorer / Author-Monthly / Author-Annual / Publisher-Monthly / Publisher-Annual; lifetime segments removed.)

---

## ENVIRONMENT VARIABLE COUNT

Updated 2026-05-06: **16 environment variables** (was 19; removed `NEXT_PUBLIC_LIFETIME_ENABLED`, `STRIPE_PRICE_AUTHOR_LIFETIME`, `STRIPE_PRICE_PUBLISHER_LIFETIME`).

| Category | Variables |
|---|---|
| Stripe price IDs | 4 (author monthly/annual, publisher monthly/annual) |
| Environment variables | 16 (original 13 + GA_MEASUREMENT_ID + STRIPE_PRICE_AUTHOR_ANNUAL + STRIPE_PRICE_PUBLISHER_ANNUAL) |

---

## Apply this patch

This file replaces `docs/ENGINEERING_DECISIONS.md` in the original 68-task mybsn package. Original is preserved at `docs/PATCHES-TO-ORIGINAL/backups/ENGINEERING_DECISIONS.pre-modification-backup.md`.

**Deletion confirmation required:** before applying, surface the diff (specifically the changes to Decision #29, #33, and the pricing/env var sections) to the operator. Wait for explicit "confirm deletion" reply before overwriting. Log confirmation in PROGRESS.md.
