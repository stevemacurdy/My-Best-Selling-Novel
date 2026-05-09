<!-- APPLY: CREATE -->
# R-TASK-163: Founder's Note Page (`app/founders-note/page.tsx`)

## Status: NOT STARTED
## Priority: MEDIUM
## Phase: 6
## Estimated Sessions: 1
## Dependencies: R-TASK-160 (`lib/markdown.ts`), TASK-002 (brand store)
## Cluster: PATCH-3 round 2 v1 content cluster

## Inference Summary

| Addition | Source |
|---|---|
| Static prose page; markdown source committed | Same pattern as R-TASK-162 (about) |
| Distinct from /about — first-person, signed | Operator footer spec (Column 4: "Our Story" + "Founder's Note" listed separately) |
| First-person voice in italics or block-quoted | Editorial convention for founder essays |
| Operator-authored (~400-800 words) | Personal essay; shorter than /about |
| Photo of Steve (optional) | Operator decision; placeholder OK |

## Pre-flight: re-read current state

- Confirm `lib/markdown.ts` exists (R-TASK-160 dependency).
- Confirm `/founders-note` in middleware public-routes whitelist.
- This task ships a shell. Operator commits to writing the essay.

## Files to Create

- `app/founders-note/page.tsx` — server component
- `content/founders-note.md` — operator-authored essay
- `public/founder-photo.jpg` — optional photo asset (operator provides; otherwise ship without photo)

## Implementation Requirements

### Page structure

Top:
- Heading: "A Note From Steve" (or operator's preferred framing)
- Subheading or dateline: "Grantsville, Utah — May 2026"
- Optional photo: small (160x160), rounded, brand-gold ring, top-right or above heading

Body:
- Render `content/founders-note.md`. Wrap in `<article class="prose prose-invert max-w-[680px] mx-auto">` — slightly narrower than /about for intimate feel.
- First-person voice. Recommended structure for a founder's note:
  1. The moment that started it ("I got tired of...")
  2. The realization ("I noticed that every writing tool treats authors like they're broken")
  3. The decision ("So I built the thing I wished existed")
  4. The promise ("This product gets better when you use it. Tell me what's broken.")
- Word count: 400-800. Personal, brief, scannable.

Closing:
- Signature: "— Steve Macurdy" italicized, brand-gold
- Optional: contact line — "Reach me directly: steve@mybestsellingnovel.com" (operator decision)
- CTA: "Start Chapter One →"

### Distinction from /about

- `/about` is the company's story (third-person, institutional)
- `/founders-note` is Steve's voice directly (first-person, personal)
- Both link from footer Column 4 separately
- Cross-link: `/about` may end with "Want a more personal take? Read [Steve's note](/founders-note)" and vice versa

### Brand styling

- Background `bg-brand-navy`
- Body text `text-brand-white` Crimson Pro 18px
- Italic pull-quotes / signature: `text-brand-gold italic`
- Photo (if used): `rounded-full ring-4 ring-brand-gold/40`

### Operator content commitment

Operator writes `content/founders-note.md` before launch. If shipping with placeholder: "Steve is writing this note. He's slow. — The Footer."  with same CTA structure. Self-deprecating placeholder maintains the literary footer voice. Track in `docs/CONTENT_TODO.md`.

### SEO

- Page title: "A Note From Steve — My Best Selling Novel"
- Meta description: First sentence of the note, ~150 chars.
- OG image: founder photo or brand OG fallback
- Schema.org: `Article` with `author` = Steve Macurdy

## Tests Required

- AT-163-1: `/founders-note` returns 200 OK without authentication
- AT-163-2: Markdown renders cleanly
- AT-163-3: Signature line is italic and brand-gold
- AT-163-4: CTA links to `/signup`
- AT-163-5: Cross-link to `/about` (and back) renders if present in markdown source
- AT-163-6: `/founders-note` in middleware public-routes whitelist
- AT-163-7: Mobile renders with reduced typography per TASK-061

## Session Notes
_(Filled by Claude Code during implementation)_
