<!-- APPLY: CREATE -->
# R-TASK-162: About / Our Story Page (`app/about/page.tsx`)

## Status: NOT STARTED
## Priority: HIGH
## Phase: 6
## Estimated Sessions: 1
## Dependencies: TASK-002 (brand store), TASK-043 (footer column)
## Cluster: PATCH-3 round 2 v1 content cluster

## Inference Summary

| Addition | Source |
|---|---|
| Static prose page; markdown source committed to repo | Operator's "MDX in repo" preference for one-time-write content (Path B / pre-Sanity decision) |
| Public route, no auth | TASK-007 public-routes whitelist |
| Operator-written copy (~600-1200 words) | Operator commits content; not derivable |
| Hero + body + CTA pattern matching `/sample-chapter` | Brand consistency with TASK-160 |
| `Built by WoulfAI` link in body if appropriate | Decision #21 (also in footer per Q-H) |

## Pre-flight: re-read current state

- Confirm `lib/markdown.ts` exists (created by R-TASK-160). If not, this task creates it.
- Confirm public-routes whitelist includes `/about`.
- This task SHIPS A SHELL. Operator commits to writing the prose. If prose isn't ready at v1 launch, ship a "Coming soon" badged placeholder.

## Files to Create

- `app/about/page.tsx` — server component
- `content/about.md` — operator-authored prose

## Implementation Requirements

### Page structure

Hero:
- Heading: "Why we built this"
- Subheading: A single-line teaser pulled from the body's first paragraph

Body:
- Render `content/about.md` to HTML at build time using `lib/markdown.ts`. Wrap in `<article class="prose prose-invert max-w-[720px] mx-auto">`.
- Operator-authored prose. Recommended structure:
  1. The problem ("most authoring tools treat writers like they need to be saved from themselves")
  2. The insight ("an agent that's actually opinionated about novels")
  3. The build (1-2 paragraphs about the ADR-003 verbatim port — agent built then ported, not designed in committee)
  4. The promise ("we don't think AI replaces writers. we think it eliminates the parts of writing that aren't writing")
  5. The team ("Built by Steve Macurdy at Woulf Group" — soft attribution)

Word count: 600-1200. Long-form but not exhausting. The literary footer voice ("Made for writers, by writers who got tired of waiting") sets the tone — extend it across the page.

Closing:
- Pull-quote or a single sentence punchline (italic, brand-gold)
- CTA below: "Start Chapter One →"

### Operator content commitment

Operator writes `content/about.md` before v1 launch. If shipping with a placeholder, render: "We're working on telling our story properly. Until then — the work speaks." with the same hero/CTA structure. Track in `docs/CONTENT_TODO.md` with target date.

### Brand styling

- Page background `bg-brand-navy`
- Article body `text-brand-white` in 18px Crimson Pro per TASK-002 typography scale
- Pull-quotes: `border-l-4 border-brand-gold pl-6 text-brand-gold italic`
- Inline links: `text-brand-gold hover:text-brand-goldDim underline underline-offset-4`

### SEO

- Page title: "Our Story — My Best Selling Novel"
- Meta description: Operator-written; ~150 chars summarizing the founding insight.
- OG image: dedicated `/og-images/about.png` or fallback to default brand OG image
- Schema.org `AboutPage` markup with `mainEntity` referencing the operator/company

### Footer integration

When TASK-043 expansion ships footer Column 4 "Company" with "Our Story" link, ensure it points to `/about`. Cross-binding documented in TASK-043 Pre-flight.

## Tests Required

- AT-162-1: `/about` returns 200 OK without authentication
- AT-162-2: Markdown content renders without raw `# Heading` symbols visible
- AT-162-3: CTA at bottom links to `/signup` (or signup modal per TASK-046)
- AT-162-4: `/about` is in middleware public-routes whitelist
- AT-162-5: If shipping with placeholder, "Coming soon" or equivalent visible; operator follow-up tracked
- AT-162-6: Mobile (375px) renders with reduced typography per TASK-061

## Session Notes
_(Filled by Claude Code during implementation)_
