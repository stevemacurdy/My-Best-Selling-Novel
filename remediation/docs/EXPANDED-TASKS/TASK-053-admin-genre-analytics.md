<!-- APPLY: REPLACE -->
<!-- Target: docs/TASKS/TASK-053-admin-genre-analytics.md (in original mybsn package) -->
<!-- Backup: docs/EXPANDED-TASKS/backups/TASK-053-admin-genre-analytics.pre-expansion-backup.md -->
<!-- Expanded 2026-05-08 from 89 words to ~1240 words via PATCH-3 sub-deliverable B.3.
     Categorized MIXED — 5 confirmation questions + 1 substantive operator-input question (Q-7.16 genre algorithm).
     Operator chose "use default" on Q-7.16 → algorithm uses agent's S0 Genre Scanner scores. -->

# TASK-053: Admin Genre Analytics Page (`app/admin/genres/page.tsx`)

## Status: NOT STARTED
## Priority: HIGH
## Phase: 7
## Estimated Sessions: 2
## Dependencies: TASK-010, TASK-049, TASK-050, TASK-052
## Requirements Covered: R23
## Spec Reference: Section 7.5

## Inference Summary

| Addition | Source |
|---|---|
| Chart in both `/admin` (top-8 + Other) and dedicated `/admin/genres` (full distribution + trend + recommendations) | Q-7.14 operator-answer (use default) |
| Trend = MoM book-creation rate per genre | Q-7.15 operator-answer (use default) |
| **High-demand low-competition uses agent's S0 Genre Scanner scores** | Q-7.16 operator-answer (use default — derive from agent S0 source) |
| Click-through filters user list by genre | Q-7.17 operator-answer (use default) |
| Recommendation refresh via 60s metrics cache | Q-7.18 operator-answer (use default); TASK-049 expansion |
| Admin-visible (not super_admin only) | Q-7.19 operator-answer (use default) |
| ADR-003 governs S0 Genre Scanner — scores read from agent source, not redefined | ADR-003 |

Operator confirmed all questions on 2026-05-08.

## Pre-flight: re-read current state

- View `app/admin/genres/page.tsx` if present.
- View the agent's S0 Genre Scanner step source (TASK-032 / `bestseller_book_agent.jsx`) and locate the `demand`, `competition`, `opportunity` fields per genre. These are the scores this task uses; per ADR-003 the agent source is verbatim-port and the scores must be read from there as the authoritative source.
- Confirm TASK-049 (metrics) and TASK-050 (genres distribution) have shipped. This task composes their data.
- Confirm `/admin` already wraps with `<AdminGuard>` (TASK-052 expansion); add `<AdminGuard>` to `/admin/genres` too.

## Files to Create/Modify

- `app/admin/genres/page.tsx` (NEW) — server component with `<AdminGuard>` client wrapper
- `app/api/admin/genre-analytics/route.ts` (NEW) — endpoint serving distribution + trend + recommendations
- `lib/genre-scores.ts` (NEW) — extract S0 Genre Scanner scores into a typed constant for cross-use
- `components/admin/GenreTrendChart.tsx`, `components/admin/GenreRecommendations.tsx` (NEW)

## Implementation Requirements

### `lib/genre-scores.ts` — extract S0 scores

Per ADR-003, the agent source is verbatim-port. The genre scores live in the agent's S0 Genre Scanner step (TASK-032 / `bestseller_book_agent.jsx`). To use them in admin analytics without modifying agent code, extract the scores into a separate constants file imported by both the agent and admin layers.

```typescript
// lib/genre-scores.ts
//
// Source of truth for genre demand/competition/opportunity scores. Values copied
// verbatim from the agent's S0 Genre Scanner step (bestseller_book_agent.jsx).
// Do NOT modify here without also modifying the agent — ADR-003 verbatim-port
// applies. If scores are updated based on new market research, update both
// locations and bump a version constant for tracking.

export const GENRE_SCORES_VERSION = '2026-05';

export interface GenreScore {
  genre: string;
  demand: number;       // 1-10
  competition: number;  // 1-10 (higher = more competitive)
  opportunity: number;  // 1-10 (derived: high demand + low competition = high opportunity)
}

export const GENRE_SCORES: GenreScore[] = [
  // ... copied verbatim from agent source ...
  // Example shape (placeholder values — verify against agent source at task ship time):
  { genre: 'Fantasy',         demand: 9, competition: 8, opportunity: 5 },
  { genre: 'Romance',         demand: 9, competition: 9, opportunity: 4 },
  { genre: 'Mystery',         demand: 8, competition: 6, opportunity: 7 },
  { genre: 'Thriller',        demand: 8, competition: 7, opportunity: 6 },
  { genre: 'Sci-Fi',          demand: 7, competition: 6, opportunity: 6 },
  { genre: 'Horror',          demand: 7, competition: 4, opportunity: 8 },
  { genre: 'Westerns',        demand: 6, competition: 3, opportunity: 8 },
  { genre: 'Historical',      demand: 7, competition: 5, opportunity: 7 },
  // ... etc — full list per agent source
];

export function getGenreScore(genre: string): GenreScore | null {
  return GENRE_SCORES.find(g => g.genre === genre) ?? null;
}
```

When TASK-053 ships, the operator (or Claude Code at execution time) opens the agent source, locates the scores, and copies them verbatim into this file. The "verbatim-port" rule applies — no transformation, no opinion-injection.

### Endpoint: `app/api/admin/genre-analytics/route.ts`

```typescript
import { verifyAdmin } from '@/lib/api-auth';
import { createServiceRoleClient } from '@/lib/supabase/server';
import { GENRE_SCORES, getGenreScore } from '@/lib/genre-scores';

export async function GET(req: NextRequest) {
  const result = await verifyAdmin(req);
  if (!result.authorized) return NextResponse.json({ error: result.error }, { status: result.status });

  // [60s in-memory cache pattern from TASK-049/050 — omitted for brevity]

  const sb = createServiceRoleClient();

  // 1. Full distribution (reuse genre_distribution() function from TASK-050)
  const { data: distRows } = await sb.rpc('genre_distribution');

  // 2. Trend — MoM book-creation rate per genre (Q-7.15 default)
  // Compare books created this calendar month vs last calendar month, by genre.
  const now = new Date();
  const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
  const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString();

  const { data: thisMonth } = await sb.rpc('genre_distribution_since', { p_since: thisMonthStart });
  const { data: lastMonth } = await sb.rpc('genre_distribution_since', { p_since: lastMonthStart });

  // Per Q-7.15 default: skip genres with <5 books last month as noise
  const trends = (thisMonth ?? []).map((cur) => {
    const prev = lastMonth?.find(p => p.genre === cur.genre);
    const prevCount = Number(prev?.count ?? 0);
    const curCount = Number(cur.count);
    if (prevCount < 5) return null;
    const ratio = curCount / prevCount;
    return { genre: cur.genre, this_month: curCount, last_month: prevCount, ratio };
  }).filter(Boolean).sort((a, b) => b!.ratio - a!.ratio);

  // 3. Recommendations — high-demand low-competition per Q-7.16 default
  // High demand = score.demand >= 7
  // Low competition = score.competition <= 4
  // Sort by opportunity DESC; surface top 3
  const recommended = GENRE_SCORES
    .filter(s => s.demand >= 7 && s.competition <= 4)
    .sort((a, b) => b.opportunity - a.opportunity)
    .slice(0, 3);

  return NextResponse.json({
    distribution: distRows ?? [],
    trends,
    recommendations: {
      version: '2026-05',
      criteria: { high_demand_threshold: 7, low_competition_threshold: 4 },
      genres: recommended,
    },
  });
}
```

The genre algorithm (Q-7.16) **uses the agent's S0 Genre Scanner scores as the authoritative source**. Thresholds are documented in the response (`criteria`) so admins reading the recommendation know what "high demand" and "low competition" mean. Top 3 surfaced; rest available via the full GENRE_SCORES table if the admin wants to drill in.

The `genre_distribution_since(p_since TIMESTAMPTZ)` Postgres function is a parametrized variant of TASK-050's `genre_distribution()` — date-bounded counting. Defined in the migration alongside this task.

### Page: `app/admin/genres/page.tsx`

```tsx
import AdminGuard from '@/components/AdminGuard';
import GenreTrendChart from '@/components/admin/GenreTrendChart';
import GenreRecommendations from '@/components/admin/GenreRecommendations';
import { GenreDistributionDonut } from '@/components/admin/GenreDistributionDonut';

export default function GenreAnalyticsPage() {
  return (
    <AdminGuard>
      <div className="p-8 space-y-8">
        <h1 className="text-h1">Genre Analytics</h1>
        <section>
          <h2 className="text-h3 mb-4">Distribution</h2>
          {/* Same chart used in /admin top-8+Other, here showing full top-20+Other */}
          <GenreDistributionDonut topN={20} />
        </section>
        <section>
          <h2 className="text-h3 mb-4">Month-over-month growth</h2>
          <GenreTrendChart />
        </section>
        <section>
          <h2 className="text-h3 mb-4">Underserved genres (recommendations)</h2>
          <GenreRecommendations />
        </section>
      </div>
    </AdminGuard>
  );
}
```

`<AdminGuard>` wraps (per Q-7.19 default — admin-visible, not super_admin-only). Page uses `lib/brand.ts` tokens via Tailwind utility classes.

### Click-through filter (Q-7.17 default)

Clicking a genre on the distribution chart navigates to `/admin/users?genre_filter=Fantasy`. This requires extending TASK-051's user list endpoint to accept a `genre_filter` query param that joins `books` and filters users who have at least one book in the selected genre. Add to TASK-051 in a follow-up if the user-list endpoint hasn't been built with this in mind.

## What this task does NOT do

- Does NOT redefine the agent's S0 Genre Scanner scores — those are the authoritative source per ADR-003 verbatim-port
- Does NOT compute genre scores from platform usage — Q-7.16 default uses agent's pre-baked market research scores
- Does NOT export genre analytics as CSV/PDF — defer to v1.1 if admin requests
- Does NOT show per-user genre preferences — that's user-list filtering territory

## Tests Required

- AT-093: `/admin/genres` page renders for admin role; super_admin not required
- AT-094: Distribution shows top-20 + Other rollup (consistent with TASK-050)
- AT-095: Trend chart shows ratio-sorted MoM growth; genres with <5 prior-month books excluded
- AT-096: Recommendations panel shows top-3 high-demand-low-competition genres from `GENRE_SCORES`
- AT-097: `lib/genre-scores.ts` `GENRE_SCORES` array matches the agent source exactly (mechanical diff or maintained checklist)
- AT-098: Click on distribution genre → navigates to `/admin/users?genre_filter=...`
- AT-099: Recommendation criteria thresholds (`high_demand_threshold: 7, low_competition_threshold: 4`) appear in API response

## Session Notes
_(Filled by Claude Code during implementation)_
