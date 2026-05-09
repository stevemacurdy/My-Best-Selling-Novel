<!-- APPLY: REPLACE -->
<!-- Target: docs/TASKS/TASK-043-landing-page.md (in original mybsn package) -->
<!-- Backup: docs/EXPANDED-TASKS/backups/TASK-043-landing-page.pre-expansion-backup.md -->
<!-- Expanded 2026-05-08 from 119 words to ~1740 words via PATCH-3 sub-deliverable B.3.
     This task changed scope substantially during PATCH-3 round 2 because operator's footer copy
     spec (2026-05-08) introduced the 17-task v1 content cluster (R-TASK-160 through R-TASK-176).
     Footer integration is now the largest portion of this task's surface area. -->

# TASK-043: Landing Page (`app/page.tsx`)

## Status: NOT STARTED
## Priority: CRITICAL
## Phase: 6
## Estimated Sessions: 3 (hero + stats + feature cards = 1; footer with cluster integration = 1.5; testing + SEO + analytics = 0.5)
## Dependencies: TASK-002, TASK-007, TASK-046 (signup modal CTAs), TASK-053 (genre scores for Column 1 link), R-TASK-160 through R-TASK-176 (entire v1 content cluster)
## Requirements Covered: R12, R30
## Spec Reference: Section 6.1

## Inference Summary

| Addition | Source |
|---|---|
| **Hero copy locked verbatim** ("Stop calling yourself an aspiring author.") | Q-6.1 operator-answer 2026-05-08 |
| **Hero body** ("walks you from outline to published novel in as little as six weeks…") | Q-6.1 operator-answer 2026-05-08 |
| **Primary CTA "Start Chapter One →" mirrored across 4 surfaces** | Q-6.1 + cascade decision (TASK-046 modal, TASK-044 tour final stop, header, hero) |
| Stats bar 4 numbers: "12 Steps · ~85 Functions · 200K+ Words · 6 Formats" | Q-6.2 operator-answer (use default — verify against reality at v1 launch) |
| 4 feature preview cards from `bestseller_demo.jsx` source | Q-6.3 operator-answer (use default) |
| 6 feature highlight cards from `bestseller_demo.jsx` source | Q-6.4 operator-answer (use default) |
| **Footer copy locked verbatim** (closing CTA, 4 columns, newsletter capture, legal strip, rotating quote, footnote) | Q-6.5 operator-answer 2026-05-08 |
| **Coming-soon badges on unbuilt links per operator preference** ("the badges remind me to build them") | Operator answer 2026-05-08 |
| Brand search-replace deferred sitewide to TASK-062 | Q-6.6 operator-answer (use default) |
| Footer Column 2 retains all 5 publish-guide entries with badges where prose unfinished | Operator preference + Q-G keep-all-5 |
| Audiobook label drops "Add-On" suffix | R-TASK-169 Pre-flight flag + Q-D (capability not separate product) |
| WoulfAI attribution: "Legal · Built by WoulfAI" footnote line below © | Q-H operator-answer (option 1) 2026-05-08 |

Operator confirmed all questions on 2026-05-08.

## Pre-flight: re-read current state

Before touching `app/page.tsx`:

- View existing `app/page.tsx` and any prior demo-source migration. If parts of `bestseller_demo.jsx` were ported in a prior session, do NOT re-port — augment.
- View `lib/brand.ts` (TASK-002) for color tokens, typography scale.
- View the cluster R-TASKs to understand which links go where:
  - R-TASK-160 → `/sample-chapter`
  - R-TASK-161 → `/genres`
  - R-TASK-162 → `/about` (Our Story)
  - R-TASK-163 → `/founders-note`
  - R-TASK-164 → `/press`
  - R-TASK-165 → `/publish/kdp-setup`
  - R-TASK-166 → `/publish/cover-design`
  - R-TASK-167 → `/publish/isbn-copyright`
  - R-TASK-168 → `/publish/print-on-demand`
  - R-TASK-169 → `/publish/audiobook` (NOT "Audiobook Add-On")
  - R-TASK-170 → newsletter capture component (`<NewsletterCapture variant="footer" />`)
  - R-TASK-171 → `/resources/outline-template` (lead magnet)
  - R-TASK-172 → `/affiliate`
  - R-TASK-173 → `/how-it-works`
  - R-TASK-174 → `/legal` (aggregator, footnote-line link)
  - R-TASK-175 → `<RotatingQuote />` (rendered above legal strip)
  - R-TASK-176 → Directus (no public link; operator-only tool)
- Confirm `<ComingSoonBadge />` from R-TASK-165 exists for unbuilt-link decoration.
- Confirm `lib/legal-pages.ts` (R-TASK-174) is in place if any of the 9 legal pages are linked individually from the © legal strip.

If any R-TASK in the cluster has not yet shipped at TASK-043 expansion time, render its link with `<ComingSoonBadge />`. Operator's stated preference: dead links with badges are acceptable as self-reminders to ship the missing content.

## Files to Create/Modify

- `app/page.tsx` (NEW or MODIFY; the landing page)
- `components/marketing/Hero.tsx` (NEW)
- `components/marketing/StatsBar.tsx` (NEW)
- `components/marketing/FeaturePreviewCards.tsx` (NEW; 4 cards)
- `components/marketing/FeatureHighlightCards.tsx` (NEW; 6 cards)
- `components/marketing/Footer.tsx` (NEW; the heavy one — 4 columns + newsletter + quote + legal + footnote)

## Implementation Requirements

### Hero block

Verbatim copy (locked):

```
[H1, Crimson Pro, 64/72 desktop / 40/48 mobile, brand-white, max-width 800px]
Stop calling yourself an aspiring author.

[Body, 20/30 brand-white/85, max-width 720px]
mybestsellingnovel.com walks you from outline to published novel in as
little as six weeks — whether it's your first book or your fifteenth.

[Primary CTA, brand-gold filled button, brand-navy text, 16/24 medium]
Start Chapter One →
```

CTA links to `/signup` (or opens `<SignupModal>` per TASK-046 with `source="landing_hero"`). GA event `signup_modal_opened` with `source: 'landing_hero'` per Q-6.18 + Q-9.2.

Background: `bg-brand-navy`. Optional subtle radial gradient to brand-navyLight. No hero image at v1 — typography carries it. (Operator may add hero illustration in v1.1; flagged in `docs/CONTENT_TODO.md`.)

### Stats bar

Below hero, before feature cards. 4 stats as inline-flex group with brand-gold separators:

```
12 Steps · ~85 Functions · 200K+ Words · 6 Formats
```

Per Q-6.2 default — verify each number against reality at v1 launch (the audit's `bestseller_complete_audit.md` provides "85 functions" and "12 steps" as accurate; "200K+ Words" verifies against the chunked-analysis path; "6 Formats" verifies exports include 6 formats — typically PDF, EPUB, MOBI, DOCX, audiobook, social-card; if v1 ships with fewer, adjust to actual count). If any number is off, update `app/page.tsx` to match reality and document in `docs/CONTENT_TODO.md` for next-session correction.

### Feature preview cards (4)

Render verbatim from `bestseller_demo.jsx` per Q-6.3 default. Order:
1. Genre Scanner — "Find the genre your story actually wants to be"
2. 3-Path Upload — "Bring an existing manuscript or start fresh"
3. Avoid System — "Plot logic that doesn't repeat itself"
4. Audio — "Record narration chapter-by-chapter, audiobook-ready"

Each card: brand-navyLight background, brand-gold accent border, Crimson Pro h3 title, body text in 16/24 brand-white/80. Hover: `ring-1 ring-brand-gold/40` shadow lift.

Grid: 4-col at lg, 2-col at md, 1-col at sm.

### Feature highlight cards (6)

Render verbatim from `bestseller_demo.jsx` per Q-6.4 default. Verify copy matches v1 reality (if a feature was deferred, strike or replace). Standard demo-source set:
1. AI-powered chapter generation
2. Chunked-analysis manuscript intake
3. Audio recording + chapter playback
4. Multi-format export (PDF, EPUB, DOCX)
5. Cover design assistance (S10)
6. Publishing-ready metadata (description, keywords, categories)

Same card styling as preview cards, denser grid: 3-col at lg, 2-col at md, 1-col at sm.

### Footer (the heavy section)

Render in this top-to-bottom order, matching operator's footer copy spec verbatim:

**Section 1 — Closing CTA block** (above all columns):
```
[Crimson Pro, 32/40, brand-white, centered, max-width 720px]
The book isn't going to write itself. But with us, it almost will.

[Brand-gold filled button, centered]
Start Chapter One →
```

CTA mirrors hero CTA. GA event `signup_modal_opened` with `source: 'footer_closing_cta'`.

**Section 2 — 4-column structure** (operator's exact labels and entries):

```
Column 1 — Write
- The Process              → /how-it-works
- How It Works             → /how-it-works  (same destination; intentional repetition per operator)
- Pricing                  → /pricing
- Sample Chapter           → /sample-chapter
- Plans                    → /pricing  (alias)
- Genres We Support        → /genres

Column 2 — Publish
- Amazon KDP Setup         → /publish/kdp-setup       [<ComingSoonBadge> if prose unfinished]
- Cover Design             → /publish/cover-design    [<ComingSoonBadge> if prose unfinished]
- ISBN & Copyright         → /publish/isbn-copyright  [<ComingSoonBadge> if prose unfinished]
- Print on Demand          → /publish/print-on-demand [<ComingSoonBadge> if prose unfinished]
- Audiobook                → /publish/audiobook       [NOTE: dropped "Add-On" suffix per R-TASK-169; capability not separate product]

Column 3 — Learn
- The Blog                 → /blog                    [<ComingSoonBadge> — Sanity infra deferred to v1.1]
- Writing Prompts          → /prompts                 [<ComingSoonBadge> — deferred to v1.1]
- Author Interviews        → /interviews              [<ComingSoonBadge> — deferred to v1.1]
- Free Outline Template    → /resources/outline-template
- Newsletter               → (anchor to capture block in same footer; smooth scroll)

Column 4 — Company
- Our Story                → /about
- Founder's Note           → /founders-note
- Contact                  → /help (R-TASK-107)
- Affiliate Program        → /affiliate
- Press                    → /press
```

Column heading style: Crimson Pro 14/20 uppercase letterspaced, brand-gold.
Link style: 16/24 brand-white/80 hover:brand-white. `<ComingSoonBadge>` rendered inline beside link text where applicable.

**Section 3 — Newsletter capture** (right of Column 3 on lg+; full width below grid on sm-md):

Render `<NewsletterCapture variant="footer" />` from R-TASK-170. Component contains operator's exact copy:
```
[Crimson Pro h3, brand-white]
Get one good writing prompt every Sunday morning.

[Body, 16/24 brand-white/70]
No spam, no upsells, no "10 ways to crush your goals." Just a prompt,
a paragraph from a novelist worth reading, and a quiet nudge to write
something this week.

[Email input + Subscribe button — brand-gold submit]
```

POST to `/api/newsletter/subscribe` per R-TASK-170 implementation.

**Section 4 — Rotating literary quote**:

Render `<RotatingQuote />` from R-TASK-175. Italicized brand-textMuted, centered, small type. Rotates weekly automatically (server-rendered via ISO week mod N).

**Section 5 — Legal strip line**:

```
© 2026 mybestsellingnovel.com — Made for writers, by writers who got tired of waiting.   [Privacy] [Terms] [Refund Policy] [Contact]
```

`Privacy` → `/privacy`, `Terms` → `/terms`, `Refund Policy` → `/refunds`, `Contact` → `/help`.
Style: 14/20 brand-textMuted; the © clause on left, the 4 inline links on right (or wraps to second line on mobile).

**Section 6 — Footnote line** (per Q-H operator-answer option 1):

```
Legal · Built by WoulfAI
```

Style: 12/16 brand-textMuted/80, centered. `Legal` → `/legal` (R-TASK-174 aggregator). `Built by WoulfAI` → operator-decided URL (operator commits before launch; default to `https://woulfai.com` with operator override option).

### Coming Soon badge handling

Per operator answer 2026-05-08: **"the comming soon badges will remind me to make sure and add them"**. Therefore:
- Every footer link to a page whose content is unfinished at v1 ship gets `<ComingSoonBadge />` rendered inline beside the link text.
- The link is still navigable — clicking goes to the destination page which itself shows its placeholder/Coming-soon state per the cluster R-TASKs' implementation.
- This is intentional dead-link tolerance, treated as a self-reminder mechanism, not a UX flaw.
- Track all badged links in `docs/CONTENT_TODO.md` (created in B.5 packet rebuild) so operator has a single list to work through post-launch.

### Brand search-replace (Q-6.6)

This task does NOT do the sitewide search-replace from "Bestseller Book Agent" → "My Best Selling Novel". That sweeps in TASK-062 expansion. TASK-043 only ensures the new copy on the landing page reads "My Best Selling Novel" or "mybestsellingnovel.com" (which the operator's hero/footer copy already does). Defer the rest to TASK-062.

### SEO

- Page title: "Stop calling yourself an aspiring author. — My Best Selling Novel"
- Meta description: "Outline to published novel in six weeks. AI-powered novel writing for indie authors. From blank page to bestseller list — guided 12-step agent, three-path manuscript intake, built-in marketing intelligence."
- OG image: brand OG with hero copy embedded; operator generates pre-launch
- Schema.org `WebSite` with `SearchAction` (for sitelinks search box in Google results) + `Organization`

### Analytics (Q-9.2 cross-bind)

- `page_view` on load
- `signup_modal_opened` with `source` on each CTA (hero, closing footer CTA, sticky header if present)
- `tour_complete_to_signup` if user arrived via /tour stop 14
- `feature_card_click` if any feature card is clickable in v1 (currently text-only — flag in v1.1 if operator wants click-through to specific features)

### Mobile responsiveness

- Hero: stacked, larger touch targets, reduced typography
- Stats bar: wraps to 2 lines (2 stats per line) with separators removed
- Feature cards: 1-col grid
- Footer: 4 columns stack to 2 (md) then 1 (sm); newsletter capture moves below columns; rotating quote stays centered; legal strip wraps to 2 lines
- Verify per TASK-061 mobile-responsive tests

## Tests Required

- AT-153 (was AT-153 in original spec, kept for traceability): `app/page.tsx` renders without errors at all breakpoints
- AT-154: Hero copy matches operator-locked text exactly (no paraphrasing or "improvements")
- AT-155: Footer renders all 6 sections in correct top-to-bottom order
- AT-156: All cluster cross-binds resolve (clicking each link from each footer column reaches a destination — even if that destination is a Coming-soon page)
- AT-157: `<ComingSoonBadge />` renders beside links to pages whose content is unfinished
- AT-158: `<NewsletterCapture variant="footer" />` submits successfully (cross-bind to R-TASK-170 AT-170-1)
- AT-159: `<RotatingQuote />` renders with italic muted styling and current-week's quote
- AT-160 (TASK numbering, not R-TASK): "Legal · Built by WoulfAI" footnote line renders below © with both items as links
- AT-161: Mobile breakpoints render without overflow or layout breakage
- AT-162: GA `signup_modal_opened` fires with correct `source` for each CTA invocation
- AT-163: SEO meta tags present (title, description, OG, schema.org)
- AT-164: Mechanical: zero occurrences of "Bestseller Book Agent" string in `app/page.tsx` (TASK-062 will sweep elsewhere)
- AT-165: Mechanical: no `<ComingSoonBadge>` on Privacy / Terms / Refunds / Contact / Pricing / How It Works / Sample Chapter / Genres / Newsletter / Outline Template / About / Founder's Note / Affiliate / Press / Legal links (these all ship with content at launch)
- AT-166: Audiobook footer link reads "Audiobook" (not "Audiobook Add-On"); flag verified per R-TASK-169 Pre-flight

## Session Notes
_(Filled by Claude Code during implementation)_
