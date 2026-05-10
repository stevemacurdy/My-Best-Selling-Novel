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

## Spec follow-ups

- [ ] After Phase 3 migrations apply, regenerate types/supabase.ts with 'npm run db:types' (TASK-004 follow-up).
