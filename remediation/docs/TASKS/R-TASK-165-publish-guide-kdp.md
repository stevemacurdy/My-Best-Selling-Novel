<!-- APPLY: CREATE -->
# R-TASK-165: KDP Setup Guide (`app/publish/kdp-setup/page.tsx`)

## Status: NOT STARTED
## Priority: HIGH
## Phase: 6
## Estimated Sessions: 1 (page shell) + ~3,000 words of operator-authored content
## Dependencies: TASK-002 (brand store), R-TASK-160 (`lib/markdown.ts`)
## Cluster: PATCH-3 round 2 v1 content cluster

## Inference Summary

| Addition | Source |
|---|---|
| Long-form guide page; markdown source committed to repo | Operator's "MDX in repo" preference for one-time-write content |
| Public route, no auth | TASK-007 public-routes whitelist |
| 8-section structural skeleton for self-publishing on Amazon KDP | Standard self-publishing content structure; operator commits ~3,000 words of prose |
| Sticky table of contents on desktop | Long-form guide UX convention |
| Cross-binds to R-TASK-167 (ISBN/copyright) and R-TASK-166 (cover) | Operator footer Column 2 cluster |
| Page badged "Coming soon" if prose not ready at launch | Operator Q-G commitment + footer dead-link tolerance |

## Pre-flight: re-read current state

- Confirm `lib/markdown.ts` exists (R-TASK-160 dependency).
- Confirm `/publish/kdp-setup` in middleware public-routes whitelist.
- View `lib/brand.ts` to confirm typography tokens for long-form prose.
- Operator decides ship state: (a) shell + full prose at launch, or (b) shell + "Coming soon" badge with prose committed within 30 days post-launch.

## Files to Create

- `app/publish/kdp-setup/page.tsx` — server component
- `content/publish/kdp-setup.md` — operator-authored guide content
- `components/marketing/GuideTOC.tsx` — shared sticky table of contents (also used by R-TASK-166, 167, 168, 169 — create here, reuse)
- `components/marketing/ComingSoonBadge.tsx` — shared badge component (used across publish guides + footer columns) — create here, reuse

## Implementation Requirements

### Page structure

Hero:
- Heading: "Self-Publishing on Amazon KDP — Everything You Need"
- Subheading: "From manuscript file to 'Buy on Amazon' button. The exact process, with the gotchas."

Body — 8 sections (operator writes content per section):

1. **What KDP is and why most authors start here**
2. **Setting up your KDP account** — tax interview (US/non-US), payment method, identity verification
3. **Preparing your manuscript** — KPF format vs DOCX, formatting checklist, common rejection reasons
4. **Cover design requirements** — dimensions, bleed, DPI; cross-link to R-TASK-166 cover design guide
5. **Metadata that ranks** — title + subtitle craft, description (the 4,000-character pitch), categories (the 2-of-N picker), keywords (Amazon's algorithm shortcut)
6. **Pricing and royalties** — 35% vs 70% bands, the $9.99 cliff, KDP Select trade-offs (exclusivity vs Kindle Unlimited reach)
7. **Distribution territories** — defaults, exclusions, why this matters less than people think
8. **First 30 days post-publish** — Amazon's "honeymoon" algorithm, review-gathering ethics, BookBub strategy

Closing:
- Pull-quote or punchline (italic, brand-gold)
- CTA: "Start Chapter One →"

### Table of contents

`<GuideTOC>` component renders a sticky sidebar at lg+ breakpoint listing the 8 section headings with anchor links. Below lg, collapsed `<details>` element above the article. Each section has an `id` attribute generated from its heading. Smooth-scroll on anchor click; respects `prefers-reduced-motion`.

### Operator content commitment

Operator writes `content/publish/kdp-setup.md`. Recommended length: ~3,000 words across the 8 sections. Voice consistent with the literary footer ("Made for writers, by writers...") — specific, opinionated, light on jargon, generous with concrete numbers (royalty %, file size limits, Amazon's actual button labels).

If shipping with placeholder: render hero + section headings only, each section body replaced with `<ComingSoonBadge />` and a 1-sentence teaser ("This section will cover [topic] — coming soon"). Track in `docs/CONTENT_TODO.md`.

### Brand styling

- Page background `bg-brand-navy`
- Article body in `prose prose-invert max-w-[720px]` Crimson Pro 18px
- Section headings (h2): `text-h2 mt-12 mb-4 border-b border-brand-navyLight pb-2`
- Inline links: `text-brand-gold hover:text-brand-goldDim`
- Pull-quotes: `border-l-4 border-brand-gold pl-4 italic text-brand-gold`
- TOC sidebar at lg+: `sticky top-8 ml-12 max-w-[260px] text-sm`

### SEO

- Page title: "How to Publish on Amazon KDP — Step-by-Step Guide"
- Meta description: Operator-authored ~150 chars summarizing the guide
- OG image: `/og-images/publish-kdp.png` (operator generates) or fallback
- Schema.org `HowTo` markup with the 8 sections as `step` entities

### `<ComingSoonBadge />` component (created here, reused)

Small inline badge: `bg-brand-gold/20 text-brand-gold text-xs font-medium px-2 py-0.5 rounded uppercase tracking-wide`. Text: "Coming soon".

Also used in:
- Footer column links for unbuilt pages (per operator's "the badges remind me to build them" preference)
- Other publish guides at launch
- "Recent coverage" section of `/press` (R-TASK-164)

## Tests Required

- AT-165-1: `/publish/kdp-setup` returns 200 OK without authentication
- AT-165-2: All 8 section anchors exist (`#section-1` through `#section-8`)
- AT-165-3: TOC sidebar visible at lg+; collapsed `<details>` below lg
- AT-165-4: Cross-link to R-TASK-166 cover design guide present
- AT-165-5: `/publish/kdp-setup` in middleware public-routes whitelist
- AT-165-6: If shipping with placeholder, `<ComingSoonBadge>` renders in each section
- AT-165-7: Mobile renders single-column with collapsed TOC
- AT-165-8: `<ComingSoonBadge>` component exported from `components/marketing/ComingSoonBadge.tsx` for reuse

## Session Notes
_(Filled by Claude Code during implementation)_
