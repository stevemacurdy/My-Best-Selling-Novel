<!-- APPLY: REPLACE -->
<!-- Target: docs/TASKS/TASK-048-help-page.md (in original mybsn package) -->
<!-- Backup: docs/EXPANDED-TASKS/backups/TASK-048-help-page.pre-expansion-backup.md -->
<!-- Expanded 2026-05-09 from 100 words to ~880 words via PATCH-3 sub-deliverable B.3. -->

# TASK-048: Help Page (`app/help/page.tsx`)

## Status: NOT STARTED
## Priority: HIGH
## Phase: 6
## Estimated Sessions: 1
## Dependencies: TASK-002, TASK-007 (public-routes whitelist), R-TASK-107 (support inbox), R-TASK-160 (`lib/markdown.ts`)
## Requirements Covered: R12, R33
## Spec Reference: Section 6.6

## Inference Summary

| Addition | Source |
|---|---|
| Static page; markdown compiled at build time | Q-6.24 operator-answer (use default — fastest load, no runtime fetch) |
| Tutorial source: `bestseller_agent_tutorial.md` from agent docs | Original task spec |
| Sticky sidebar TOC at lg+; collapsed `<details>` below lg | Q-6.25 operator-answer (use default) |
| No in-page search in v1 | Q-6.26 operator-answer (use default — 15 sections is browsable) |
| "Email support" link to R-TASK-107 inbox at bottom | Q-6.27 operator-answer (use default) |
| Public route, no auth | TASK-007 |

Operator confirmed all questions on 2026-05-08.

## Pre-flight: re-read current state

- View `docs/help/tutorial.md` if present in repo. If missing, this task ships with operator-committed tutorial content. Source content can be ported from `bestseller_agent_tutorial.md` (per ADR-003 verbatim port for the agent itself; tutorial copy is documentation, port is acceptable).
- Confirm `lib/markdown.ts` (R-TASK-160) is in place — used to render the tutorial markdown to HTML at build time.
- Confirm `/help` in middleware public-routes whitelist (TASK-007).
- Confirm R-TASK-107 (support inbox) is in plan or shipped; the bottom-of-page email CTA references its `help@mybestsellingnovel.com` address.

## Files to Create/Modify

- `app/help/page.tsx` — server component; rendered statically
- `docs/help/tutorial.md` — tutorial source (port from `bestseller_agent_tutorial.md` or operator-authored update)
- `components/marketing/HelpSidebarTOC.tsx` — sticky TOC component (auto-generates from heading IDs)

## Implementation Requirements

### Page structure

Hero (light, not full-screen):
- Heading: "Help & Tutorial"
- Subheading: "Step-by-step walkthrough covering all 12 steps of the My Best Selling Novel agent."

Body — two-column layout at lg+:

**Left sidebar (sticky at lg+):**
`<HelpSidebarTOC>` — auto-generates from h2 elements in the rendered tutorial. Sticky with `top-24` offset to clear sticky header. Anchor links jump to corresponding section. Smooth-scroll respects `prefers-reduced-motion`.

**Right column (article):**
Rendered tutorial markdown. Wrapped in `<article class="prose prose-invert max-w-[760px]">`.

Tutorial structure (15 sections, derived from agent's 12 steps + 3 system topics):
1. Getting Started (account creation, first book)
2. Step 0: Genre Scanner
3. Step 1: Book Setup
4. Step 2: Upload & Organize
5. Step 3: Outline Builder
6. Step 4: Front & Back Matter
7. Step 5: Chapter Guide & Avoid System
8. Step 6: Write & Record (includes audio recording walkthrough)
9. Step 7: AI Review
10. Step 8: Description
11. Step 9: Publishing Setup
12. Step 10: Cover
13. Step 11: Export
14. Library: Managing Multiple Books
15. Troubleshooting Common Issues

Each section has an h2 heading with `id` attribute auto-generated from the title (e.g., "step-6-write-record"). Section content is the operator's tutorial prose.

### Markdown rendering at build (Q-6.24 default)

Tutorial markdown source lives at `docs/help/tutorial.md`. At build time:
1. Page reads the markdown file
2. Compiles to HTML via `lib/markdown.ts` (R-TASK-160 helper using markdown-it or similar)
3. Generated HTML embedded in page output
4. Section IDs extracted for TOC generation

Build pipeline:
```typescript
// app/help/page.tsx
import fs from 'node:fs/promises';
import path from 'node:path';
import { renderMarkdown } from '@/lib/markdown';

export default async function HelpPage() {
  const source = await fs.readFile(path.join(process.cwd(), 'docs/help/tutorial.md'), 'utf-8');
  const { html, toc } = renderMarkdown(source);  // toc = [{ id, title, level }]

  return (
    <div className="grid lg:grid-cols-[260px_1fr] gap-12">
      <HelpSidebarTOC items={toc} />
      <article className="prose prose-invert max-w-[760px]" dangerouslySetInnerHTML={{ __html: html }} />
    </div>
  );
}
```

`lib/markdown.ts` (R-TASK-160) extended to return both rendered HTML and TOC array of section headings.

### `<HelpSidebarTOC>` component

Renders TOC as nested list. Auto-highlights current section based on scroll position (Intersection Observer). At sm-md breakpoints, collapsed `<details>` element above the article:

```tsx
<details className="lg:hidden mb-6">
  <summary>Table of Contents</summary>
  <nav>{/* TOC links */}</nav>
</details>
<aside className="hidden lg:block sticky top-24 max-w-[260px]">
  <nav>{/* TOC links */}</nav>
</aside>
```

### Bottom-of-page support CTA (Q-6.27)

After the last tutorial section:

```
Didn't find what you needed?
[ Email support → ]  help@mybestsellingnovel.com  ↗
```

Cross-binds R-TASK-107 (help inbox). The button mailto: link opens user's default email client; the address is also displayed visibly so users can copy or use webmail.

### No in-page search (Q-6.26 default)

15 sections is browsable via TOC. In-page text-filter UI adds complexity for marginal v1 value. Add Algolia or similar in v1.1 if support tickets indicate users can't find what they need.

### SEO

- Page title: "Help & Tutorial — My Best Selling Novel"
- Meta description: "Step-by-step tutorial covering all 12 steps of the My Best Selling Novel agent. From genre scanning to publishing-ready export."
- OG image: brand OG fallback
- Schema.org `HowTo` with section IDs as steps

### Brand styling

- Page background `bg-brand-navy`
- Article body `text-brand-white` Crimson Pro 18px in prose-invert variant
- Section h2: `text-h2 mt-12 mb-4 border-b border-brand-navyLight pb-2`
- TOC links: brand-textMuted hover:brand-gold; current section: brand-gold
- Inline links in tutorial: brand-gold hover:brand-goldDim

### Mobile

- Single column; collapsed `<details>` TOC at top
- Article body uses full width
- Section anchor links work via standard browser behavior

## What this task does NOT do

- Does NOT include in-page search (Q-6.26)
- Does NOT use MDX with React components — pure markdown via `lib/markdown.ts` (Q-6.24 simpler path)
- Does NOT fetch tutorial from runtime source (e.g., Supabase storage) — embedded at build (Q-6.24)
- Does NOT provide contact form on this page — the support CTA is a mailto link; the dedicated `/help/contact` route (R-TASK-107) handles structured contact

## Tests Required

- AT-207: `/help` returns 200 OK without authentication
- AT-208: All 15 tutorial sections render with anchor IDs
- AT-209: TOC sidebar visible at lg+; collapsed `<details>` below lg
- AT-210: TOC links jump to corresponding sections (smooth-scroll with `prefers-reduced-motion` respect)
- AT-211: Current-section highlighting in TOC works on scroll (Intersection Observer)
- AT-212: Bottom support CTA links to `mailto:help@mybestsellingnovel.com`
- AT-213: Markdown source compiled at build time (no runtime fetch; verify by inspecting generated HTML)
- AT-214: `/help` in middleware public-routes whitelist
- AT-215: Mobile renders single-column with collapsed TOC

## Session Notes
_(Filled by Claude Code during implementation)_
