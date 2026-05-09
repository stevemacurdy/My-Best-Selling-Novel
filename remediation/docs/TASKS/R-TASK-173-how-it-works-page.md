<!-- APPLY: CREATE -->
# R-TASK-173: How It Works Page (`app/how-it-works/page.tsx`)

## Status: NOT STARTED
## Priority: HIGH
## Phase: 6
## Estimated Sessions: 1
## Dependencies: TASK-002 (brand store), TASK-044 (/tour — receives the click-through), R-TASK-160 (`lib/markdown.ts`)
## Cluster: PATCH-3 round 2 v1 content cluster

## Inference Summary

| Addition | Source |
|---|---|
| Static high-level overview page | Q-E operator-answer (use default — two pages, linked: `/how-it-works` → CTA → `/tour`) |
| 12-step visual summary | Mirrors agent's S0-S11 step structure |
| Public route, no auth | TASK-007 public-routes whitelist |
| Distinct from `/tour` (which is the interactive 14-stop guided tour from `bestseller_demo.jsx`) | Q-E |
| Single primary CTA: "Take the interactive tour →" linking to `/tour` | Q-E |

## Pre-flight: re-read current state

- Confirm TASK-044 `/tour` page is in plan or shipped — without it, the primary CTA dead-ends.
- Confirm `/how-it-works` in middleware public-routes whitelist.
- This page is operator-content-light: most of the prose is descriptive of existing agent steps. Operator commits ~400-700 words.

## Files to Create

- `app/how-it-works/page.tsx` — server component
- `content/how-it-works.md` — operator-authored prose (small)
- `components/marketing/StepsTimeline.tsx` — 12-step visual component (shared, may reuse in /tour)

## Implementation Requirements

### Page structure

Hero:
- Heading: "Outline to published novel in 12 steps"
- Subheading: "Here's the path. Pick any step to see what happens there."

Body:

**1. Brief framing (~150 words):** Operator-written intro. Recommended angle: how the agent compresses the typical 6-month novel-development arc into 6 weeks (matches hero copy's "six weeks" claim) by doing the structural work that authors get stuck on, leaving the writer free to do the parts only humans can do.

**2. The 12 steps (visual timeline):**
Render `<StepsTimeline>` showing all 12 steps (S0-S11) with:
- Step number
- Step name
- 1-sentence description
- Optional: small icon

Steps to render (verify exact names against agent source per ADR-003 verbatim port):
- S0 — Genre Scanner ("Find the genre your story actually wants to be")
- S1 — Book Setup ("Title, audience, tone, target length")
- S2 — Upload & Organize ("Bring an existing manuscript or start fresh")
- S3 — Outline Builder ("Chapter-by-chapter structure")
- S4 — Front & Back Matter ("Dedication, acknowledgments, foreword")
- S5 — Chapter Guide & Avoid System ("Plot logic that doesn't repeat itself")
- S6 — Write & Record ("Generate prose, record narration")
- S7 — AI Review ("Continuity, pacing, weak-spot detection")
- S8 — Description ("The 4,000-character pitch that ranks on Amazon")
- S9 — Publishing Setup ("ISBN, categories, keywords")
- S10 — Cover ("Concept, design, upload")
- S11 — Export ("PDF, EPUB, DOCX, audiobook-ready files")

Each step is clickable — anchor links to `/tour#step-{N}` for users who want the deep dive.

**3. Closing block:**
- Single line: "That's the whole thing. Six weeks if you're moving fast. Three months at a writer's pace. Ten years if you keep telling yourself you'll start tomorrow."
- Primary CTA: **"Take the interactive tour →"** → `/tour`
- Secondary CTA: "Or just start: **Start Chapter One →**" → `/signup`

### `<StepsTimeline>` component

Vertical timeline at sm-md breakpoints; horizontal step indicator at lg+. Each step:
- Numbered circle (brand-gold border, brand-navy fill, brand-white number)
- Step name in Crimson Pro h3
- One-sentence description in body text
- Hover state: card lifts slightly, brand-gold ring intensifies
- Click: anchors to `/tour#step-{N}` (same-tab navigation)

Reusable in `/tour` final summary slide if helpful.

### Brand styling

- Page background `bg-brand-navy`
- Body wrapped in `prose prose-invert max-w-[720px] mx-auto` for prose sections
- StepsTimeline: own grid layout outside prose container

### SEO

- Page title: "How It Works — From Outline to Published Novel in 12 Steps"
- Meta description: "12 steps. 6 weeks. Here's exactly how the My Best Selling Novel agent walks you from blank page to published book."
- OG image: timeline visual rendered to PNG (operator generates) or default brand OG
- Schema.org `HowTo` with the 12 steps as `step` entities

### Analytics

- GA event `how_it_works_view` on page load
- GA event `how_it_works_to_tour` on primary CTA click (Q-9.2 taxonomy extension)

## Tests Required

- AT-173-1: `/how-it-works` returns 200 OK without authentication
- AT-173-2: All 12 steps render with names matching the agent source verbatim (per ADR-003)
- AT-173-3: Each step's anchor link goes to `/tour#step-{N}`
- AT-173-4: Primary CTA goes to `/tour`; secondary CTA goes to `/signup`
- AT-173-5: GA `how_it_works_to_tour` event fires on primary CTA click
- AT-173-6: `/how-it-works` in middleware public-routes whitelist
- AT-173-7: Mobile renders vertical timeline; desktop renders horizontal

## Session Notes
_(Filled by Claude Code during implementation)_
