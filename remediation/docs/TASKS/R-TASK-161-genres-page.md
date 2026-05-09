<!-- APPLY: CREATE -->
# R-TASK-161: Genres We Support Page (`app/genres/page.tsx`)

## Status: NOT STARTED
## Priority: HIGH
## Phase: 6
## Estimated Sessions: 1
## Dependencies: TASK-053 (admin genre analytics, ships `lib/genre-scores.ts`), TASK-002 (brand store)
## Cluster: PATCH-3 round 2 v1 content cluster

## Inference Summary

| Addition | Source |
|---|---|
| Renders the curated genre list from `lib/genre-scores.ts` | TASK-053 expansion (canonical genre store; agent S0 verbatim per ADR-003) |
| Public marketing page; no auth | TASK-007 public-routes whitelist |
| Surfaces demand/competition/opportunity scores PUBLICLY | Operator footer spec ("Genres We Support") + Decision #32 marketing intelligence |
| Sort: opportunity DESC by default; allow demand DESC, alphabetical | Standard data-table marketing UX |
| Single CTA per genre tile: "Start your [Genre] novel" | Operator's CTA pattern; each genre routes to /signup with a `source=genre_<name>` param |
| GA event `genre_view` and `genre_cta_click` | Q-9.2 GA taxonomy + new event for this page |

## Pre-flight: re-read current state

- Confirm TASK-053 has shipped — without it, `lib/genre-scores.ts` doesn't exist and this page has no data source. If R-TASK-161 ships before TASK-053, it can either (a) inline a temporary copy of the scores from agent source, or (b) wait. Recommend (b).
- View `lib/genre-scores.ts` to confirm shape: `{ genre: string; demand: number; competition: number; opportunity: number }[]`. Adjust this task if the schema differs.
- Confirm `/genres` is in middleware public-routes whitelist.

## Files to Create

- `app/genres/page.tsx` — server component, renders from `lib/genre-scores.ts`
- `components/marketing/GenreTile.tsx` — single tile with score bar visualizations and CTA

## Implementation Requirements

### Page structure

Hero:
- Heading: "Every genre. We probably support yours."
- Subheading: "These are the genres our agent has been trained against, with our market-research take on demand and competition. Pick one to start writing — all included in every plan."

Body — grid of `<GenreTile>`:
- Responsive grid: 4 columns at lg+, 2 at md, 1 at sm
- Each tile shows:
  - Genre name (h3 in Crimson Pro)
  - Three small horizontal bar charts: Demand (10), Competition (10), Opportunity (10)
  - Brief 1-sentence editorial gloss (operator-written or AI-generated; ~12-20 words)
  - CTA: "Start your [Genre] novel →" linking to `/signup?source=genre_<genre>`

Sort/filter strip above grid:
- Sort dropdown: Opportunity (default), Demand, Alphabetical
- No filtering in v1 — keep simple; expand in v1.1 if user feedback wants categories (Fiction / Non-Fiction / Children's / etc.)

### Score visualization

Three small horizontal bars per tile. Bar fill = brand-gold proportional to score; track = brand-navyLight. Numeric value shown at right of bar. Use SVG or pure Tailwind for bars; no charting library needed (recharts is heavyweight for this).

```tsx
function ScoreBar({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex items-center gap-2 text-sm">
      <span className="w-24 text-brand-textMuted">{label}</span>
      <div className="flex-1 h-2 bg-brand-navyLight rounded">
        <div className="h-full bg-brand-gold rounded" style={{ width: `${value * 10}%` }} />
      </div>
      <span className="w-6 text-brand-white">{value}</span>
    </div>
  );
}
```

### Editorial glosses

For each genre in `GENRE_SCORES`, operator writes a 12-20-word editorial line. Examples:
- Fantasy: "The biggest fish, with the biggest pond. Stand out with structural craft."
- Romance: "The genre that prints money. If you nail tropes and pacing."
- Mystery: "Underserved at the cozy/police-procedural intersection. Worth a serious look."

Glosses live in a sibling file: `lib/genre-glosses.ts` exporting `Record<string, string>`. Operator commits.

### Brand styling

- Page background `bg-brand-navy`
- Tile background `bg-brand-navyLight`, hover `bg-brand-navyLight/80` with `shadow-md ring-1 ring-brand-gold/20`
- CTA button `bg-brand-gold text-brand-navy hover:bg-brand-goldDim`

### Analytics

- `genre_view` fires on page load with `genre_count` property (number of genres rendered)
- `genre_cta_click` fires on tile CTA click with `genre` property

### SEO

- Page title: "Genres We Support — Every fiction and non-fiction category"
- Meta description: "From Fantasy to Westerns. Browse the full list with demand and competition data, then start writing in any genre — all included in every plan."

## Tests Required

- AT-161-1: `/genres` returns 200 OK without authentication
- AT-161-2: Page renders one tile per row in `GENRE_SCORES` (verify count matches)
- AT-161-3: Sort dropdown changes order (Opportunity DESC default; switching to Alphabetical produces A-Z)
- AT-161-4: Each CTA links to `/signup?source=genre_<lowercased_dash_separated_genre>`
- AT-161-5: GA `genre_cta_click` event fires with correct `genre` property
- AT-161-6: Score bars render proportionally (genre with demand=9 has 90% bar fill)
- AT-161-7: `/genres` is in middleware public-routes whitelist
- AT-161-8: Mobile (375px) renders single-column tiles with full-width bars

## Session Notes
_(Filled by Claude Code during implementation)_
