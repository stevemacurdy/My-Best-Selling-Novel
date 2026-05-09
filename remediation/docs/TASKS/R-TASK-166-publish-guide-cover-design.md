<!-- APPLY: CREATE -->
# R-TASK-166: Cover Design Guide (`app/publish/cover-design/page.tsx`)

## Status: NOT STARTED
## Priority: HIGH
## Phase: 6
## Estimated Sessions: 1 (page shell) + ~3,000 words of operator-authored content
## Dependencies: TASK-002 (brand store), R-TASK-160 (`lib/markdown.ts`), R-TASK-165 (`<GuideTOC>` and `<ComingSoonBadge>` components)
## Cluster: PATCH-3 round 2 v1 content cluster

## Inference Summary

| Addition | Source |
|---|---|
| Long-form guide structure mirroring R-TASK-165 | Sibling guide consistency |
| Cross-binds to agent S10 cover step (TASK-041) | ADR-003 verbatim port + agent's existing capability |
| Includes "DIY vs hire" decision framework | Standard self-pub content; operator commits |
| Includes example covers gallery | Visual reference improves comprehension; ~6-12 example images operator licenses or commissions |
| Covers genre-specific conventions | Cross-binds to R-TASK-161 `/genres` page |

## Pre-flight: re-read current state

- Confirm R-TASK-165 has shipped — `<GuideTOC>` and `<ComingSoonBadge>` come from there.
- Confirm `/publish/cover-design` in middleware public-routes whitelist.
- Operator decides ship state per Q-G commitment.

## Files to Create

- `app/publish/cover-design/page.tsx` — server component
- `content/publish/cover-design.md` — operator-authored guide content
- `public/publish/covers/example-*.jpg` — 6-12 example cover images (operator commissions or licenses; otherwise omits gallery section)

## Implementation Requirements

### Page structure

Hero:
- Heading: "Cover Design — The 3-Second Pitch"
- Subheading: "Your cover is the only marketing 95% of buyers will ever see. Here's how to make it earn the click."

Body — 7 sections:

1. **Why covers matter more than copy** — the 3-second decision; thumbnail-first design; mobile-first reality
2. **Genre conventions you can't ignore** — Romance pinks/clinches, Thriller dark/foreboding, Fantasy ornate/symbolic; cross-link to R-TASK-161 `/genres` for genre browsing
3. **DIY or hire — the honest framework** — when DIY works (you have design instincts + Photoshop + 6 hours), when to hire ($300-$1,500 range; what changes at each price point)
4. **If you DIY: tools and templates** — Canva (entry), BookBolt (KDP-specific), Photoshop/Affinity (pro). Cross-binds to agent S10 step which provides AI-generated cover concepts as a starting point.
5. **If you hire: how to pick a designer** — Reedsy, 99designs, direct hire from Behance/Dribbble; what to ask for; how to brief; the genre-mismatch risk
6. **Technical specs that matter** — KDP ebook (1,600×2,560 minimum, 72 DPI fine), KDP paperback (with bleed + spine width formula), audiobook (square 2,400×2,400 minimum); cross-binds to R-TASK-165 for KDP submission
7. **Testing your cover before launch** — thumbnail test (does it work at 100×160?), genre-shelf test (does it look like the genre?), 5-stranger test (do they guess the genre right?)

Optional gallery section: 6-12 example covers operator licenses or commissions, with brief annotations ("Note how the typography signals literary fiction") under each.

Closing:
- Pull-quote (italic, brand-gold): something like "Your cover doesn't have to be the best on Amazon. It has to look like it belongs with the bestsellers in your genre."
- CTA: "Start Chapter One →" (the agent will help with cover ideation in S10)

### Cross-bind to agent S10

In Section 4, include a callout block: "If you want a starting point, the My Best Selling Novel agent generates cover concepts in step 10 based on your manuscript's genre, mood, and key visual hooks. You can then take that concept to a designer or use it as inspiration for DIY."

### Operator content commitment

`content/publish/cover-design.md`. Recommended length: ~3,000 words. Voice consistent with R-TASK-165. The DIY-vs-hire framework is the section most likely to drive newsletter signups — invest the wordcount there.

If shipping with placeholder: same `<ComingSoonBadge>` pattern as R-TASK-165.

### Brand styling

- Same long-form patterns as R-TASK-165 (prose-invert, sticky TOC at lg+, brand-gold inline links)
- Example cover gallery: `grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4`
- Each example: `aspect-[2/3] bg-brand-navyLight rounded shadow ring-1 ring-brand-gold/20 hover:ring-brand-gold/60`
- Annotation under each: `text-sm text-brand-textMuted mt-2`

### SEO

- Page title: "Book Cover Design — DIY or Hire? Genre Conventions, Specs, and Tools"
- Meta description: Operator-authored ~150 chars
- OG image: `/og-images/publish-cover-design.png`
- Schema.org `HowTo` for the 7 sections

## Tests Required

- AT-166-1: `/publish/cover-design` returns 200 OK without authentication
- AT-166-2: All 7 section anchors exist
- AT-166-3: Cross-link to R-TASK-161 `/genres` and R-TASK-165 KDP guide present
- AT-166-4: Agent S10 callout in Section 4 renders
- AT-166-5: If gallery present, all images load (no broken refs); if absent, gallery section omitted (not broken)
- AT-166-6: `<ComingSoonBadge>` renders correctly when shipping placeholder
- AT-166-7: Mobile renders single-column

## Session Notes
_(Filled by Claude Code during implementation)_
