<!-- APPLY: CREATE -->
# R-TASK-175: Rotating Literary Quote System (`lib/literary-quotes.ts` + `<RotatingQuote>` component)

## Status: NOT STARTED
## Priority: MEDIUM
## Phase: 6
## Estimated Sessions: 1
## Dependencies: TASK-002 (brand store), TASK-043 (footer expansion that consumes this), R-TASK-110 (a11y baseline)
## Cluster: PATCH-3 round 2 v1 content cluster

## Inference Summary

| Addition | Source |
|---|---|
| Hardcoded curated list of ~15 quotes (no CMS) | Path B v1 scope (Sanity deferred); operator footer copy spec ("rotate weekly") |
| Rotation by week-of-year mod N for deterministic per-week quote | Standard server-rendered rotation pattern; no JS state needed |
| Italicized muted text above legal strip in footer | Operator footer copy spec |
| Avoid clichés ("write drunk, edit sober" — exhausted, misattributed) | Operator footer copy spec |
| Curated authors: Atwood, King, Le Guin, Vonnegut, Didion + others | Operator footer copy spec |
| Optional `(probably)` attribution where source is uncertain | Operator footer copy spec — Hemingway example |

Operator footer copy spec from 2026-05-08.

## Pre-flight: re-read current state

- Confirm TASK-043 expansion is in plan — this task ships the data + component, TASK-043 integrates into the footer.
- Verify the rendering surface: per operator footer copy, the rotating quote sits **directly above the legal strip** (which sits at the very bottom of the footer). Italic, muted color, small type.

## Files to Create

- `lib/literary-quotes.ts` — exports `LITERARY_QUOTES` array
- `components/marketing/RotatingQuote.tsx` — server component selecting current week's quote
- `lib/week-of-year.ts` — small utility (if not already present in repo) for ISO week calculation

## Implementation Requirements

### `lib/literary-quotes.ts`

```typescript
export interface LiteraryQuote {
  text: string;
  author: string;
  source?: string;        // book/essay if known
  uncertain?: boolean;    // appends "(probably)" to attribution
}

export const LITERARY_QUOTES: LiteraryQuote[] = [
  // ~15-20 entries operator commits — examples below; operator finalizes with care to avoid clichés
  { text: "The first draft of anything is shit.", author: "Hemingway", uncertain: true },
  { text: "I write entirely to find out what I'm thinking, what I'm looking at, what I see and what it means.", author: "Joan Didion", source: "Why I Write" },
  { text: "You can, you should, and if you're brave enough to start, you will.", author: "Stephen King", source: "On Writing" },
  { text: "The trouble is that once you see it, you can't unsee it. And once you've seen it, keeping quiet, saying nothing, becomes as political an act as speaking out.", author: "Arundhati Roy", source: "The Algebra of Infinite Justice" },
  { text: "There is no greater agony than bearing an untold story inside you.", author: "Maya Angelou", source: "I Know Why the Caged Bird Sings" },
  { text: "Easy reading is damn hard writing.", author: "Nathaniel Hawthorne" },
  { text: "Make your characters want something right away — even if it's only a glass of water.", author: "Kurt Vonnegut", source: "Bagombo Snuff Box, introduction" },
  { text: "The artist is nothing without the gift, but the gift is nothing without work.", author: "Émile Zola" },
  { text: "If a story is in you, it has to come out.", author: "William Faulkner" },
  { text: "We tell ourselves stories in order to live.", author: "Joan Didion", source: "The White Album" },
  { text: "What I look for in novels is not so much the writer's voice, but the voice of an age, of a culture, of a historical moment.", author: "Salman Rushdie" },
  { text: "A word after a word after a word is power.", author: "Margaret Atwood" },
  { text: "It is by sitting down to write every morning that one becomes a writer.", author: "Gerald Brenan" },
  { text: "Stories are compasses and architecture; we navigate by them, we build our sanctuaries and our prisons out of them.", author: "Rebecca Solnit", source: "The Faraway Nearby" },
  { text: "Don't tell me the moon is shining; show me the glint of light on broken glass.", author: "Anton Chekhov" },
  // Operator commits final list before launch; aim for 15-20.
  // Avoid: "Write drunk, edit sober" (Peter De Vries, frequently misattributed to Hemingway), "Show, don't tell" (cliché),
  //        and any quote that's been through 50 SaaS landing pages already.
];
```

Operator commits the final curated list before launch. Each quote should be:
- Pulled from a verifiable source where possible (book + page-number if rigorous)
- Marked `uncertain: true` if attribution is contested (renders with " (probably)" suffix)
- Specific to writing/storytelling/creativity (not generic motivation)

### `<RotatingQuote>` component

```tsx
import { LITERARY_QUOTES } from '@/lib/literary-quotes';
import { getISOWeek } from '@/lib/week-of-year';

export function RotatingQuote() {
  const week = getISOWeek(new Date());
  const quote = LITERARY_QUOTES[week % LITERARY_QUOTES.length];
  const attribution = quote.uncertain ? `${quote.author} (probably)` : quote.author;

  return (
    <p className="text-sm italic text-brand-textMuted text-center my-4">
      &ldquo;{quote.text}&rdquo; &mdash; {attribution}
    </p>
  );
}
```

Server-rendered. Same quote for all visitors during a given ISO week. Rotates automatically Monday at 00:00 UTC. No client-side JS, no state, no API call. Cache-friendly.

### `lib/week-of-year.ts`

```typescript
export function getISOWeek(date: Date): number {
  // ISO 8601 week number (1-53)
  const target = new Date(date.valueOf());
  const dayNumber = (date.getUTCDay() + 6) % 7;
  target.setUTCDate(target.getUTCDate() - dayNumber + 3);
  const firstThursday = target.valueOf();
  target.setUTCMonth(0, 1);
  if (target.getUTCDay() !== 4) {
    target.setUTCMonth(0, 1 + ((4 - target.getUTCDay()) + 7) % 7);
  }
  return 1 + Math.ceil((firstThursday - target.valueOf()) / (7 * 24 * 3600 * 1000));
}
```

Standard ISO week algorithm. No external dependency.

### Integration into TASK-043 footer

In the footer's bottom section, the rendering order from top to bottom is:

1. (4-column structure)
2. (Newsletter capture in its own block)
3. `<RotatingQuote />`  ← rendered here
4. © legal strip line: "© 2026 mybestsellingnovel.com — Made for writers, by writers who got tired of waiting. [Privacy] [Terms] [Refund Policy] [Contact]"
5. Footnote line: "Legal · Built by WoulfAI" (per Q-H operator-answer)

Cross-bind documented in TASK-043 Pre-flight when that expands.

### Brand styling

- Quote text: `text-sm italic text-brand-textMuted`
- Attribution: same line, em-dash separator
- Centered alignment
- Small vertical margin (`my-4`)
- No animation (per R-TASK-110 a11y baseline; static text rotation per week is the entire UX)

### Accessibility

- Quote rendered as `<p>` not `<blockquote>` — short fragment, not a quoted passage
- Curly quotes via HTML entities (`&ldquo;`, `&rdquo;`); em-dash via `&mdash;`
- Sufficient contrast at brand-textMuted on brand-navy background — verify with R-TASK-109 contrast lint at TASK-043 expansion

### Operator content commitment

Operator finalizes `LITERARY_QUOTES` array before launch. ~15-20 quotes. No additional updates needed for v1 (rotation is automatic). Add to `docs/CONTENT_REVIEW_SCHEDULE.md` for annual review (refresh quotes once per year to keep the list current).

## Tests Required

- AT-175-1: `lib/literary-quotes.ts` exports `LITERARY_QUOTES` array with at least 15 entries
- AT-175-2: Each entry has `text` and `author` fields; `uncertain` and `source` are optional
- AT-175-3: `<RotatingQuote>` renders a quote with attribution
- AT-175-4: Same quote rendered for all visitors during a given ISO week (verify by mocking date and re-rendering)
- AT-175-5: Quote rotates Monday 00:00 UTC (verify by mocking Sunday → Monday transition)
- AT-175-6: Quote with `uncertain: true` renders attribution with " (probably)" suffix
- AT-175-7: Curly quotes and em-dash render correctly (no raw `&ldquo;` text)
- AT-175-8: Component is server-rendered (no `'use client'` directive)
- AT-175-9: Contrast passes R-TASK-109 lint (brand-textMuted on brand-navy ≥ 4.5:1)

## Session Notes
_(Filled by Claude Code during implementation)_
