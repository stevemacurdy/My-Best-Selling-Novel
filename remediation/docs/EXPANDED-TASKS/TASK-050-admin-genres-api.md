<!-- APPLY: REPLACE -->
<!-- Target: docs/TASKS/TASK-050-admin-genres-api.md (in original mybsn package) -->
<!-- Backup: docs/EXPANDED-TASKS/backups/TASK-050-admin-genres-api.pre-expansion-backup.md -->
<!-- Expanded 2026-05-08 from 92 words to ~770 words via PATCH-3 sub-deliverable B.3. -->

# TASK-050: Admin Genres Distribution API (`app/api/admin/genres/route.ts`)

## Status: NOT STARTED
## Priority: HIGH
## Phase: 7
## Estimated Sessions: 1
## Dependencies: TASK-006, TASK-049
## Requirements Covered: R23
## Spec Reference: Section 7.3

## Inference Summary

| Addition | Source |
|---|---|
| Response shape: `{ genre, count, pct }[]` sorted DESC, NULL excluded | Q-7.6 operator-answer (use default) |
| Top 20 + "Other" rollup | Q-7.6 + Decision #32 marketing intelligence |
| 60s in-memory cache (same as TASK-049) | Q-7.7 operator-answer (use default) |
| Genre normalization at write time (agent S0/S1), not at read time | Q-7.8 operator-answer (use default) |
| Service-role client for cross-user aggregates | TASK-049 expansion (admin lint whitelist established) |

Operator confirmed all questions on 2026-05-08.

## Pre-flight: re-read current state

- View `app/api/admin/genres/route.ts` if present.
- Confirm migration TASK-012 (books table) has `genre TEXT NULLABLE` column.
- Confirm `verifyAdmin` from `lib/api-auth.ts` is available.
- Verify the agent's S0 Genre Scanner step (TASK-032) writes `books.genre` from a controlled vocabulary (not freeform). Per Q-7.8 default, normalization is the agent's responsibility at write time. If S0 freeform-writes, Q-7.8 needs revisit.

## Files to Create/Modify

- `app/api/admin/genres/route.ts` (NEW)

## Implementation Requirements

### GET `/api/admin/genres` — distribution snapshot

Single endpoint returning the full distribution. Top 20 genres explicitly named; everything else aggregated under `"Other"`. NULL genres excluded (books in agent S0/S1 step where genre hasn't been set yet).

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { verifyAdmin } from '@/lib/api-auth';
import { createServiceRoleClient } from '@/lib/supabase/server';

type CacheEntry = { data: GenreDistribution[]; expires_at: number };
let _cache: CacheEntry | null = null;
const CACHE_TTL_MS = 60_000;

interface GenreDistribution {
  genre: string;
  count: number;
  pct: number;
}

export async function GET(req: NextRequest) {
  const result = await verifyAdmin(req);
  if (!result.authorized) return NextResponse.json({ error: result.error }, { status: result.status });

  if (_cache && _cache.expires_at > Date.now()) {
    return NextResponse.json({ genres: _cache.data });
  }

  const sb = createServiceRoleClient();
  const dist = await computeDistribution(sb);
  _cache = { data: dist, expires_at: Date.now() + CACHE_TTL_MS };
  return NextResponse.json({ genres: dist });
}

async function computeDistribution(sb: ReturnType<typeof createServiceRoleClient>): Promise<GenreDistribution[]> {
  // Aggregate via Postgres function — avoids fetching every book row to JS.
  // Function returns: { genre, count } sorted DESC, NULL excluded.
  const { data: rows } = await sb.rpc('genre_distribution');
  // [{genre: 'Fantasy', count: 450}, {genre: 'Romance', count: 380}, ...]

  const total = (rows ?? []).reduce((s, r) => s + Number(r.count), 0);
  if (total === 0) return [];

  // Top 20 explicit + Other rollup
  const top = (rows ?? []).slice(0, 20);
  const otherCount = (rows ?? []).slice(20).reduce((s, r) => s + Number(r.count), 0);

  const result: GenreDistribution[] = top.map((r) => ({
    genre: r.genre,
    count: Number(r.count),
    pct: Math.round((Number(r.count) / total) * 1000) / 10,  // 1 decimal place
  }));

  if (otherCount > 0) {
    result.push({
      genre: 'Other',
      count: otherCount,
      pct: Math.round((otherCount / total) * 1000) / 10,
    });
  }

  return result;
}
```

### Postgres function (alongside this task)

```sql
-- migration alongside this task: 015d_genre_distribution_fn.sql
CREATE OR REPLACE FUNCTION genre_distribution()
RETURNS TABLE(genre TEXT, count BIGINT)
LANGUAGE SQL
STABLE
AS $$
  SELECT b.genre, COUNT(*) AS count
  FROM books b
  WHERE b.genre IS NOT NULL AND b.genre != ''
  GROUP BY b.genre
  ORDER BY count DESC;
$$;
```

The function lives in the database for two reasons: (1) the GROUP BY + ORDER BY runs server-side, avoiding shipping every row to the JS process; (2) other surfaces (TASK-053 admin genre analytics, future genre-based marketing reports) can call the same function without re-implementing the aggregation.

### Genre normalization (Q-7.8 default — at write time)

Per Q-7.8 default, genre values written by the agent come from a controlled vocabulary (not freeform user text). The agent's S0 Genre Scanner shows users a list of pre-defined genres ("Fantasy", "Romance", "Mystery", "Thriller", etc.) and writes the canonical string to `books.genre`. Variations like "Sci-fi" vs "Science Fiction" are deduplicated by the agent's pick-list before reaching the DB.

This task does NOT do read-time normalization — that would need a mapping table and a fuzzy-match step, both adding complexity for marginal v1 value. If user data shows divergence (e.g., agent writes "Romance" but legacy imports have "romance"), add a write-time `LOWER(genre)` normalization in a follow-up migration.

### Caching strategy

60s TTL matches TASK-049's pattern. Genre distributions change slowly — even at 100 new books per day, top-20 ranking shifts on the order of weeks. The cache could be much longer (5-10 minutes) but the 60s value matches TASK-052 dashboard polling cadence and keeps mental-model parity across admin endpoints.

## What this task does NOT do

- Does NOT compute trends (genre growth over time) — that's TASK-053
- Does NOT filter by date range — full distribution always; date-range filters add complexity for marginal value at v1 scale
- Does NOT support genre-by-tier breakdowns — admin user list (TASK-051) handles per-user genre filtering instead

## Tests Required

- AT-079: Authenticated admin → 200 + sorted distribution
- AT-080: Top-20 result includes `pct` summing to ≤ 100 (with possible "Other" row to reach 100%)
- AT-081: NULL/empty genres excluded (verify by inserting a book with `genre=NULL` and confirming it's not in response)
- AT-082: Database function `genre_distribution()` exists and is STABLE-marked
- AT-083: With ≤20 distinct genres, no "Other" row appears
- AT-084: With >20 distinct genres, "Other" row appears at index 20 with cumulative count

## Session Notes
_(Filled by Claude Code during implementation)_
