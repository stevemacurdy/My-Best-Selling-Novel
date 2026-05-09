# ENGINEERING DECISION LOG
## My Best Selling Novel — All Decisions Approved
## April 2026

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
| 7 | Publisher: unlimited books, 2,000 AI calls/mo, folder upload, 2 team seats | ✅ Approved |
| 8 | All Claude API calls proxied through /api/ai — key never exposed to browser | ✅ Approved |
| 9 | Single shared verifyToken() in lib/api-auth.ts — no duplicate auth functions | ✅ Approved |
| 10 | Lazy SDK initialization for Stripe, Claude, Resend | ✅ Approved |
| 11 | Agent ported verbatim — var/function() syntax preserved, not modernized | ✅ Approved |
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
| 29 | Monthly billing only | **Monthly + Annual (10% off) + Lifetime** | More pricing options for different buyer types |
| 30 | No admin dashboard | **Full admin dashboard** with charts, filters, genre analytics | Need metrics to run the business and dial in marketing |
| 31 | No admin role | **role column in profiles** ('user' \| 'admin') — admin access to /admin | Admin dashboard access control |
| 32 | No genre analytics | **Genre tracking across all books** for marketing intelligence | Know which genres are hot to target ads |
| 33 | Basic legal pages not discussed | **Generate Terms of Service + Privacy Policy** with "lifetime = lifetime of product" language | Stripe compliance + lifetime tier legal protection |

---

## COMPLETE PRICING TABLE

| Tier | Monthly | Annual (10% off) | Lifetime (one-time) |
|------|---------|-------------------|---------------------|
| Explorer | Free | — | — |
| Author | $29/mo | $313.20/year | $567.89 |
| Publisher | $79/mo | $853.20/year | $3,456.78 |

**Lifetime terms:**
- Same monthly AI call limits as regular subscribers (resets monthly)
- Access lasts for the lifetime of the product
- If the product shuts down, lifetime access ends
- Must be stated in Terms of Service

**Stripe configuration needed:**
- 6 price IDs: author_monthly, author_annual, author_lifetime, publisher_monthly, publisher_annual, publisher_lifetime
- Lifetime uses Stripe one-time payment mode (not subscription)
- Pricing page needs monthly/annual/lifetime toggle

---

## NEW DATABASE SCHEMA ADDITIONS

### profiles table — add role column
```sql
ALTER TABLE profiles ADD COLUMN role TEXT NOT NULL DEFAULT 'user'
  CHECK (role IN ('user', 'admin'));
```

### New chapters table (replaces JSONB chapterContent)
```sql
CREATE TABLE chapters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  book_id UUID NOT NULL REFERENCES books(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  chapter_index INT NOT NULL,
  title TEXT,
  content TEXT DEFAULT '',
  purpose TEXT,
  word_count INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(book_id, chapter_index)
);

CREATE INDEX idx_chapters_book ON chapters(book_id);
ALTER TABLE chapters ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own chapters" ON chapters FOR ALL USING (auth.uid() = user_id);
```

### Admin dashboard API routes
- GET /api/admin/metrics — total users, signups by period, subscriptions by tier, MRR, AI usage, books count
- GET /api/admin/genres — genre distribution across all books for marketing
- GET /api/admin/users — user list with usage stats (paginated)
- All admin routes: verifyToken + check role === 'admin'

---

## TECH STACK SUMMARY (Final)

| Layer | Technology | Version/Plan |
|-------|-----------|-------------|
| Framework | Next.js App Router | 14.2.15 |
| Language | TypeScript | 5.7.2 |
| Database | Supabase PostgreSQL | Pro ($25/mo) |
| Auth | Supabase Auth | Email/password |
| Storage | Supabase Storage | 100GB (Pro) |
| Payments | Stripe | Checkout + Portal + Webhooks |
| AI | Claude Sonnet 4 | via @anthropic-ai/sdk 0.32.1 |
| Email | Resend | Transactional |
| Analytics | Google Analytics | GA4 |
| Hosting | Vercel | Auto-deploy from GitHub |
| Domain | mybestsellingnovel.com | Custom domain on Vercel |
| Font | Crimson Pro | Google Fonts CDN |
| Theme | Gold #D4A853 / Navy #0f1b33 | Preserved from agent |

---

## COMPLETE FILE/TABLE COUNT

| Category | Count |
|----------|-------|
| Database tables | 6 (profiles, books, chapters, audio_chunks, subscriptions, ai_usage_logs) |
| Storage buckets | 2 (book-audio, book-covers) |
| API routes | 11 (books, books/[id], ai, audio/[bookId]/[idx], stripe/checkout, stripe/portal, stripe/webhook, admin/metrics, admin/genres, admin/users, emails/welcome) |
| Agent components | 14 (S0-S11 + Library + AgentShell) |
| Pages | 10 (/, /demo, /app, /pricing, /signin, /signup, /forgot, /account, /admin, /help) |
| Stripe price IDs | 6 (author monthly/annual/lifetime, publisher monthly/annual/lifetime) |
| Environment variables | 19 (original 16 + GA_MEASUREMENT_ID + STRIPE_PRICE_AUTHOR_ANNUAL + STRIPE_PRICE_AUTHOR_LIFETIME + STRIPE_PRICE_PUBLISHER_ANNUAL + STRIPE_PRICE_PUBLISHER_LIFETIME) |

---

*Decision log finalized April 2026 — all 33 decisions approved by Steve Macurdy*
