<!-- APPLY: CREATE -->
# R-TASK-168: Print on Demand Guide (`app/publish/print-on-demand/page.tsx`)

## Status: NOT STARTED
## Priority: HIGH
## Phase: 6
## Estimated Sessions: 1 (page shell) + ~3,000 words of operator-authored content
## Dependencies: TASK-002, R-TASK-160 (`lib/markdown.ts`), R-TASK-165 (`<GuideTOC>` + `<ComingSoonBadge>`), R-TASK-167 (ISBN cross-bind)
## Cluster: PATCH-3 round 2 v1 content cluster

## Inference Summary

| Addition | Source |
|---|---|
| Long-form guide structure mirroring sibling guides | Sibling consistency (R-TASK-165, 166, 167, 169) |
| Cross-binds to R-TASK-167 (your-own-ISBN required for non-Amazon distribution) | R-TASK-167 + standard self-pub flow |
| Cross-binds to R-TASK-165 (KDP Print integrated with KDP submission) | R-TASK-165 |
| KDP Print + IngramSpark + alternatives matrix | Standard self-pub POD content |
| Trim size + cover-wrap calculator details | Operator commits accurate specs |
| Hardcover discussion | Available since KDP Print 2023+; IngramSpark always |

## Pre-flight: re-read current state

- Confirm R-TASK-165 has shipped (`<GuideTOC>` + `<ComingSoonBadge>`).
- Confirm `/publish/print-on-demand` in middleware public-routes whitelist.
- Confirm R-TASK-167 (ISBN/copyright) is in plan — Section 6 cross-references it.

## Files to Create

- `app/publish/print-on-demand/page.tsx` — server component
- `content/publish/print-on-demand.md` — operator-authored guide content

## Implementation Requirements

### Page structure

Hero:
- Heading: "Print on Demand — Paperback and Hardcover Without Inventory"
- Subheading: "How indie authors get physical books on Amazon, in stores, and into libraries — without ever boxing one up themselves."

Body — 7 sections:

1. **What POD is and why it changed everything** — historical context (POD made indie paperback viable around 2010; brick-and-mortar parity arrived ~2018; hardcover via KDP Print arrived 2023)
2. **KDP Print — Amazon's POD** — integrated with your KDP ebook listing; one-click "expand to paperback"; royalty math (60% list price minus print cost minus 40% Amazon cut); distribution to Amazon only by default; expanded distribution to Barnes & Noble + libraries via Amazon's network (small additional reach, lower royalty)
3. **IngramSpark — the bookstore play** — broader distribution (40,000+ retailers, libraries, schools); higher upfront cost (~$49 setup per title or free with their print-on-demand toggle); requires your own ISBN (cross-link to R-TASK-167); higher quality printing for hardcover; honest take: required if you want bookstore returnability and library orders, optional otherwise
4. **The dual-channel strategy** — most successful indie paperbacks are on BOTH KDP Print (for Amazon's algorithm/momentum) AND IngramSpark (for everywhere else); how to set up without conflicts; the "expanded distribution" toggle to turn off in KDP Print when you're using IngramSpark for non-Amazon
5. **Trim sizes that signal genre** — 5×8 (mass-market literary), 6×9 (thrillers, sci-fi, fantasy), 5.25×8 (romance), 6×9 hardcover (premium positioning); how trim size affects page count and therefore print cost
6. **Interior file specs** — PDF/X-1a (most reliable), embedded fonts (always), exact margins (gutter +0.125" inner, 0.5" outer minimum, 0.75" top/bottom), bleed (none for typical interiors, 0.125" if you have full-bleed images); page count must be a multiple of 2 for KDP, 4 for IngramSpark
7. **Cover wrap math** — spine width = (page count × paper-thickness-factor) + cover bleed all sides; KDP and IngramSpark have free spine calculators; the most common rejection reason is wrong spine width or insufficient bleed

Closing:
- Pull-quote: something like "POD turned 'I wrote a book' into a thing you can hold. Use it."
- CTA: "Start Chapter One →"

### Cross-binds

Section 3 — IngramSpark requires your own ISBN: link to R-TASK-167 Section 3 (Bowker vs Amazon free ISBN trade-off).
Section 2 — KDP Print integrates with your KDP ebook submission: link to R-TASK-165 Section 1.
Section 5 — trim size by genre: link to R-TASK-161 `/genres` for genre browsing.

### Operator content commitment

`content/publish/print-on-demand.md`. Recommended length: ~3,000 words. The royalty math and IngramSpark setup fee numbers should be verified at write time — these change. Add to `docs/CONTENT_REVIEW_SCHEDULE.md` (created in R-TASK-167).

If shipping with placeholder: same `<ComingSoonBadge>` pattern.

### Brand styling

- Same long-form patterns as siblings

### SEO

- Page title: "Print on Demand for Self-Published Authors — KDP Print, IngramSpark, and the Dual Strategy"
- Meta description: Operator-authored ~150 chars
- OG image: `/og-images/publish-pod.png`
- Schema.org `HowTo` for the 7 sections

## Tests Required

- AT-168-1: `/publish/print-on-demand` returns 200 OK without authentication
- AT-168-2: All 7 section anchors exist
- AT-168-3: Cross-links to R-TASK-167 (ISBN) + R-TASK-165 (KDP) + R-TASK-161 (genres) present
- AT-168-4: `<ComingSoonBadge>` renders correctly in placeholder mode
- AT-168-5: `docs/CONTENT_REVIEW_SCHEDULE.md` includes this guide for 6-month review (royalty math drift)
- AT-168-6: Mobile renders single-column

## Session Notes
_(Filled by Claude Code during implementation)_
