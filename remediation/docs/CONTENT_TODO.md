# CONTENT_TODO.md — Content debt aggregator

**Purpose:** Single list of operator-content commitments tracked across the v1 build. Every R-TASK or original-task expansion that says "operator commits X words" or "Coming soon badge if prose unfinished" lands here. Operator works through this list at launch and post-launch.

**Last updated:** 2026-05-09 (PATCH-3 round 2 v1 cluster delivery).

---

## Tier A — Required at v1 launch (no Coming-soon-badge acceptable)

These pages need real content shipped at launch. "Coming soon" is not viable here because they're either part of the conversion funnel or legally required.

| Path | Owner | Content needed | Status |
|---|---|---|---|
| `/` (TASK-043 hero) | Operator | Hero copy LOCKED 2026-05-08 — verbatim "Stop calling yourself an aspiring author." | ✅ done |
| `/` (TASK-043 footer) | Operator | Footer copy LOCKED 2026-05-08 — closing CTA, 4 columns, newsletter copy, legal strip, footnote | ✅ done |
| `/pricing` (TASK-045) | Operator | Tier feature lists LOCKED via `lib/tier-features.ts` (single source of truth) | ✅ done |
| `/legal` aggregator (R-TASK-174) | Operator | 9 policy descriptions (1-2 sentences each) | ⬜ writing required |
| `/terms`, `/privacy`, `/refunds`, `/aup`, `/cookies`, `/dmca`, `/ai-disclosure`, `/vuln-disclosure`, `/a11y-statement` | Operator + counsel | Full policy text per R-TASK-119 + TASK-057 | ⬜ legal review required |
| Welcome email body (TASK-054) | Claude drafted in voice | Full body text drafted 2026-05-09; operator reviews + accepts/edits | 🟡 drafted; awaiting operator review |
| Upgrade email bodies (TASK-055) | Claude drafted in voice | Author + Publisher variants drafted 2026-05-09 | 🟡 drafted; awaiting operator review |
| Welcome email subject "You showed up. Now the work." | Claude drafted | Voice match; operator approves or overrides | 🟡 drafted |
| `/sample-chapter` (R-TASK-160) prose | Operator | ~1,500-2,000 words original chapter content | ⬜ Coming-soon-badge acceptable v1; commit within 30 days post-launch |

---

## Tier B — Coming-soon-badged at v1 launch acceptable (per operator preference)

Operator stated 2026-05-08: "the comming soon badges will remind me to make sure and add them." These render with `<ComingSoonBadge>` until operator commits content.

| Path | Owner | Content needed | Status |
|---|---|---|---|
| `/about` (R-TASK-162) | Operator | ~600-1,200 word "Our Story" essay | ⬜ |
| `/founders-note` (R-TASK-163) | Operator | ~400-800 word first-person essay (Steve's voice) | ⬜ |
| `/press` (R-TASK-164) — boilerplate | Operator | ~200-400 word institutional boilerplate | ⬜ |
| `/press` — assets | Operator | 3 logo variants (SVG), 4 product screenshots (1920×1080), 1 founder photo (2400×2400) | ⬜ |
| `/press` — recent coverage | Operator | List of articles/podcasts as they accumulate | ⬜ ongoing |
| `/publish/kdp-setup` (R-TASK-165) | Operator | ~3,000 words across 8 sections | ⬜ |
| `/publish/cover-design` (R-TASK-166) | Operator | ~3,000 words across 7 sections + optional 6-12 example covers | ⬜ |
| `/publish/isbn-copyright` (R-TASK-167) | Operator + counsel review | ~3,000 words across 6 sections; legal disclaimer banner already wired | ⬜ |
| `/publish/print-on-demand` (R-TASK-168) | Operator | ~3,000 words across 7 sections | ⬜ |
| `/publish/audiobook` (R-TASK-169) | Operator | ~3,000 words across 7 sections | ⬜ |
| `/genres` (R-TASK-161) — editorial glosses | Operator | 12-20 words per genre in `lib/genre-glosses.ts` | ⬜ |
| `/resources/outline-template` (R-TASK-171) — PDF | Operator | ~10-page outline-template PDF; brand-aligned design | ⬜ |
| `/affiliate` (R-TASK-172) — body copy | Operator | "What you get" + "What you'll need to do" sections; commission % final number | ⬜ |
| Rotating literary quotes (R-TASK-175) | Operator | Final curated 15-20 quote list in `lib/literary-quotes.ts` | ⬜ |
| `/help` tutorial (TASK-048) | Operator | 15-section walkthrough; port from `bestseller_agent_tutorial.md` if present, else write fresh | ⬜ |

**Total operator content commitment for v1.0 launch + first 30 days:** approximately **17,000-20,000 words** + 1 PDF + 1 founder photo + 3 logo variants + 4 product screenshots.

---

## Tier C — v1.1 deferred (no v1 ship implication)

Confirmed deferred per Path B + A.3 + Q-A:

- Sanity setup + blog/prompts/interviews infrastructure (deferred per Path B)
- Affiliate tracking infrastructure (cookies, attribution, payouts) — Q-A defers to v1.1
- Audiobook as separate paid service (Q-D — currently markets existing agent S6 capability)
- Stripe Tax (Q-4.3 deferred)
- Resend webhook integration for email delivery tracking (Q-8.14 deferred)
- Pentest + bug bounty program (Q-10.20, 10.21 — deferred to scale gate: 1000 customers / $50K MRR)
- Hardcover-only POD specifics (R-TASK-168 covers basics)

---

## Workflow for working through this list

1. Pick the next Tier A or Tier B item by priority
2. Write the content
3. Commit to repo (markdown for prose; assets to `public/`)
4. Verify the page renders with content (not the Coming-soon-badge)
5. Update this file: change ⬜ to ✅
6. Optional: announce in newsletter / social

If a Tier B item gets stuck for more than 60 days, consider whether to defer to v1.1 or simplify.

---

## Operator manual setup actions

One-time operator actions that gate Phase-2 flows. Some run BEFORE first signup (project-level Supabase settings); some run AFTER first signup (require an authenticated row to exist).

- [ ] Verify Supabase URL Configuration
  When: BEFORE first production signup. Email verification links and OAuth callbacks fail silently or redirect to the wrong host if these values aren't set. Hard prerequisite for the email-verification flow (entry below) to work end-to-end.
  How: Supabase Dashboard → Authentication → URL Configuration. Set:
    - Site URL: http://localhost:3000 for current dev work; change to https://mybestsellingnovel.com at deploy.
    - Redirect URLs (allowlist) — add all three patterns:
      • http://localhost:3000/**
      • https://mybestsellingnovel.com/**
      • https://*.vercel.app/**            (for Vercel preview deploys)
    The /** wildcard form matches the /auth/callback path the signup flow uses.
  Verify: trigger a test signup with an email you control; click the verification link in the resulting email; confirm the browser lands on /auth/callback?code=... on the correct host (localhost during dev, deployed host in prod). If the link bounces to Supabase's default fallback or an unfamiliar host, an entry is missing from the allowlist.
  Why this can't be automated: project-level auth setting in the Supabase Dashboard, not exposed through the SDK or any env var.

- [ ] Verify Supabase email-confirmation setting is ON (locked v1 posture)
  When: BEFORE first production signup. Hard-gate email verification is the v1 production posture and is durable — not "until we measure conversion."
  How: Supabase Dashboard → Authentication → Sign In / Providers → Email provider → confirm "Confirm email" toggle is ON. This is Supabase's default; the toggle should already be ON unless explicitly disabled earlier.
  Verify: trigger a test signup; inspect auth.users:
    SELECT email, email_confirmed_at IS NOT NULL AS auto_confirmed FROM auth.users ORDER BY created_at DESC LIMIT 1;
    With the setting ON, auto_confirmed should be false until the user clicks the verification link. Alternate proof: signupAction's auth.signUp call returns data.session === null and SignupForm renders the "Check your inbox" interstitial rather than redirecting.
  Locked v1 posture — do NOT toggle OFF without a specific reason and a written decision record. Reasons:
    1. Supabase production-default behavior.
    2. Bot/abuse defense for an AI-quota-protected service.
    3. Password reset recovery requires a deliverable email — a typo at signup creates an unrecoverable account otherwise.
    4. CAN-SPAM and GDPR compliance for contact-by-email obligations.
  Why this can't be automated: project-level auth setting in the Supabase Dashboard, not exposed through the SDK or any env var.

- [ ] Promote operator to super_admin role
  When: Immediately after Steve completes signup at /signup
  How: Run in Supabase SQL Editor:
    UPDATE profiles SET role = 'super_admin' WHERE email = 'steve@woulfgroup.com';
  Verify: SELECT id, email, role FROM profiles WHERE email = 'steve@woulfgroup.com';
    Should show role = 'super_admin'.
  Alternative: Use the Directus operational tool once R-TASK-176 lands; navigate to profiles, locate the row, change role field.
  Why this can't be automated: super_admin bootstrap requires writing to a row that doesn't exist until the trigger fires on signup. No deterministic point in the build to inject this beyond "after first signup".

---

## Spec follow-ups

Deferred prerequisites that will become unblocked when their owning phase ships.

- [ ] Phase 5 prerequisite: add profiles.mfa_banner_dismissed BOOLEAN DEFAULT FALSE column via new migration. Required by R-TASK-103 MFA banner dismissal UX in /app.

---

## v4 packet corrections (discovered during Phase 3 application 2026-05-09)

The following R-TASK migrations in `remediation/supabase/migrations/` have issues that were patched locally in `supabase/migrations/` during application. Future packet rebuilds (v4.2+) should land these fixes in the canonical:

- [ ] `010_stripe_webhook_events.sql` — no local change; flagged for context. 010 contains an `ADD CONSTRAINT subscriptions_session_unique UNIQUE (stripe_session_id)` on the subscriptions table that is duplicated in 011. We patched 011 in this build (idempotency wrap), leaving 010 untouched. The design question for v4.2: should the constraint be removed from 010 (since 010's purpose is creating `stripe_webhook_events`, not modifying `subscriptions`) and stay in 011 alone, or should 011 be deleted entirely and 010 keep its constraint? Either resolution is valid; the choice should be made deliberately, not by accident.
- [ ] `011_subscriptions_unique.sql` — header self-labels as paired with 010; `ADD CONSTRAINT` is not idempotent. Fix applied locally: wrap in DO block checking `pg_constraint`. Canonical fix options: align with the 010 resolution above (remove from 010, keep idempotent in 011; or delete 011 entirely).
- [ ] `015_soft_delete_columns.sql` — policy DROP statements use title-case names (`Users see own books`, `Users see own chapters`) that don't match base migrations 002+003 (which use snake_case `books_select_own`, `chapters_select_own`). Fix applied locally: add `DROP POLICY IF EXISTS` for the snake_case names alongside the canonical title-case ones. Canonical fix: align policy DROPs with the snake_case naming convention used by base migrations.
- [ ] `015_soft_delete_columns.sql` (separate item) — only updates the SELECT policy. The pre-existing INSERT/UPDATE/DELETE policies on books and chapters still don't filter by `deleted_at`, so a user can still update or delete a soft-deleted row. The soft-delete contract is partial. Canonical fix: add `AND deleted_at IS NULL` (or equivalent) to the WITH CHECK / USING clauses of the *_update_own and *_delete_own policies, or replace them with new ones.
- [ ] `014_document_acceptances.sql` — `document_versions` CHECK constraint omits `'refunds'` from the document type enum, but TASK-008 spec (Q-8.4 acceptance checkboxes) includes Refunds policy as a third required acceptance. Local fix: `016_refunds_doc_type.sql` widens the CHECK and seeds the refunds version. Future v4.2 packet rebuild should fold the fix into 014 directly so greenfield consumers don't need the 016 patch.
- [ ] `014_document_acceptances.sql` (separate item) — seed uses `effective_at = NOW()` so each row's `effective_at` reflects the migration's apply time rather than the version field's stable date (e.g., version='2026-05-04' but effective_at='2026-05-10 17:00:56' in this build). Canonical fix: change seed to a fixed timestamp matching the version (`effective_at = '2026-05-04 00:00:00+00'`). Versions that pretend to have always existed produce a cleaner audit trail than versions that materialize on whatever date the migration happened to run.
- [ ] R-TASK-105 (DPA outreach) — instructed sending email to legal@resend.com which is not a valid Resend address; mail bounced. Reality: Resend uses click-through DPA model (no email outreach needed; DPA auto-binds via ToS acceptance). R-TASK-105 spec patched in this session (line 61 + 95). Future v4.2 packet rebuild should fold the fix into the canonical spec source.

