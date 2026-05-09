<!-- APPLY: REPLACE -->
<!-- Target: docs/TASKS/TASK-018-chapters-api.md (in original mybsn package) -->
<!-- Backup: docs/EXPANDED-TASKS/backups/TASK-018-chapters-api.pre-expansion-backup.md -->
<!-- Expanded 2026-05-08 from 112 words to ~860 words via PATCH-3 sub-deliverable B.3. -->

# TASK-018: Chapters CRUD API (`app/api/chapters/*`)

## Status: NOT STARTED
## Priority: CRITICAL
## Phase: 3
## Estimated Sessions: 1
## Dependencies: TASK-006, TASK-013, TASK-017
## Requirements Covered: R5
## Spec Reference: Section 3.6

## Inference Summary

| Addition | Source |
|---|---|
| Smart-diff PUT accepts partial chapter object | Q-3.6 operator-answer (use default; Decision #24 smart diff) |
| Reorder via dedicated POST endpoint | Q-3.7 operator-answer (use default) |
| Last-write-wins concurrent edits | Q-3.8 operator-answer (use default; R-TASK-101 Path A single-user assumption) |
| Audio chunk cascade on chapter DELETE | Q-3.9 operator-answer (use default); TASK-014 ON DELETE CASCADE |
| `word_count` and `chapter_count` denormalization writes through to `books` table | TASK-017 expansion + Decision #22 chapter split |

Operator confirmed all questions on 2026-05-08.

## Pre-flight: re-read current state

- View `app/api/chapters/[bookId]/[index]/route.ts` and `app/api/chapters/[bookId]/route.ts` if present.
- Confirm migration TASK-013 (chapters table) is applied: `id`, `book_id`, `chapter_index`, `title`, `content` (TEXT), `word_count`, `created_at`, `updated_at`. PRIMARY KEY on `(book_id, chapter_index)`.
- Confirm `audio_chunks` foreign key uses `ON DELETE CASCADE` on `(book_id, chapter_index)` (TASK-014).
- Confirm migration TASK-012 has `word_count_total INT DEFAULT 0` and `chapter_count INT DEFAULT 0` columns on `books` (added per TASK-017 expansion's denormalization model).

## Files to Create/Modify

- `app/api/chapters/[bookId]/route.ts` — GET (list chapters of a book) + POST `/reorder`
- `app/api/chapters/[bookId]/[index]/route.ts` — GET (one) + PUT (smart-diff update) + DELETE

## Implementation Requirements

### GET `/api/chapters/[bookId]` — list all chapters of one book

```typescript
const sb = createClient();
const { data: book } = await sb.from('books').select('id').eq('id', params.bookId).eq('user_id', user.id).single();
if (!book) return NextResponse.json({ error: 'not_found' }, { status: 404 });

const { data, error } = await sb
  .from('chapters')
  .select('chapter_index, title, content, word_count, updated_at')
  .eq('book_id', params.bookId)
  .order('chapter_index', { ascending: true });

if (error) return NextResponse.json({ error: 'fetch_failed' }, { status: 500 });
return NextResponse.json({ chapters: data });
```

The book-ownership check before chapters fetch is belt-and-suspenders against RLS. Returning 404 (not 403) for unauthorized access is intentional — leaks no information about whether the book exists.

### PUT `/api/chapters/[bookId]/[index]` — smart-diff upsert

Per Q-3.6 default, PUT accepts a partial chapter object: only the fields that changed since the client's last load. Server upserts using merge semantics.

```typescript
export async function PUT(req: NextRequest, { params }: { params: { bookId: string; index: string } }) {
  const user = await verifyToken(req);
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const sb = createClient();
  const chapterIndex = parseInt(params.index, 10);
  if (Number.isNaN(chapterIndex) || chapterIndex < 0) return NextResponse.json({ error: 'invalid_index' }, { status: 400 });

  // Ownership gate
  const { data: book } = await sb.from('books').select('id').eq('id', params.bookId).eq('user_id', user.id).single();
  if (!book) return NextResponse.json({ error: 'not_found' }, { status: 404 });

  const body = await req.json();
  const { title, content } = body;  // partial; either or both

  // Compute word_count if content was sent
  const wordCount = typeof content === 'string'
    ? content.trim().split(/\s+/).filter(Boolean).length
    : undefined;

  // Upsert with merge: existing row's columns retained for fields not in payload
  const updates: Record<string, unknown> = { book_id: params.bookId, chapter_index: chapterIndex, updated_at: new Date().toISOString() };
  if (title !== undefined) updates.title = title;
  if (content !== undefined) {
    updates.content = content;
    updates.word_count = wordCount ?? 0;
  }

  const { error } = await sb.from('chapters').upsert(updates, { onConflict: 'book_id,chapter_index' });
  if (error) return NextResponse.json({ error: 'save_failed' }, { status: 500 });

  // Denormalization: recompute book.word_count_total + chapter_count
  await refreshBookCounts(sb, params.bookId);

  return NextResponse.json({ ok: true, word_count: wordCount });
}

async function refreshBookCounts(sb: SupabaseClient, bookId: string) {
  const { data } = await sb.from('chapters').select('word_count').eq('book_id', bookId);
  const total = (data ?? []).reduce((sum, c) => sum + (c.word_count ?? 0), 0);
  const count = data?.length ?? 0;
  await sb.from('books').update({ word_count_total: total, chapter_count: count, updated_at: new Date().toISOString() }).eq('id', bookId);
}
```

Per Q-3.8 default, **last-write-wins** on concurrent edits. Two tabs each editing the same chapter race on the upsert; the second write overwrites the first. Acceptable in v1 because R-TASK-101 Path A locks the product to single-user accounts (no team seats). Add ETag / `If-Match` conflict detection in v2 if user-feedback shows lost-work tickets.

### POST `/api/chapters/[bookId]/reorder` — atomic reorder

Per Q-3.7 default, reorder is a dedicated endpoint accepting `{ order: [oldIndex, ...] }`. Atomic update of all `chapter_index` values in one transaction.

```typescript
export async function POST(req: NextRequest, { params }: { params: { bookId: string } }) {
  const user = await verifyToken(req);
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const sb = createClient();
  // Ownership gate (omitted for brevity)

  const body = await req.json();
  const { order } = body as { order: number[] };
  if (!Array.isArray(order) || order.some(n => !Number.isInteger(n) || n < 0)) {
    return NextResponse.json({ error: 'invalid_order' }, { status: 400 });
  }

  // Atomic transaction via Postgres function:
  //   reorder_chapters(book_id UUID, new_order INT[]) — moves rows, updates audio_chunks FK refs.
  // Defined in migration alongside this task.
  const { error } = await sb.rpc('reorder_chapters', { p_book_id: params.bookId, p_order: order });
  if (error) return NextResponse.json({ error: 'reorder_failed' }, { status: 500 });

  return NextResponse.json({ ok: true });
}
```

The Postgres function uses a temporary high-numbered sequence (`chapter_index = 1000 + i`) for the first pass, then swaps to the final indices in a second pass — avoiding the unique-constraint violation that a direct swap would cause. SQL goes in a new migration file (this task adds it; a migration `015b_reorder_chapters_fn.sql` or similar).

### DELETE `/api/chapters/[bookId]/[index]` — single chapter

```typescript
const { error } = await sb.from('chapters').delete().eq('book_id', params.bookId).eq('chapter_index', chapterIndex);
// Audio chunk cascade per Q-3.9 (foreign key ON DELETE CASCADE in migration TASK-014)
await refreshBookCounts(sb, params.bookId);
return NextResponse.json({ ok: true });
```

The `audio_chunks` table's foreign key on `(book_id, chapter_index)` with `ON DELETE CASCADE` handles audio cleanup at the row level. Storage-level audio file cleanup happens in TASK-019 (DELETE on `/api/audio/[bookId]/[index]` is the explicit path; this DELETE leaves storage orphans for R-TASK-112 to sweep).

## What this task does NOT do

- Does NOT clean up Supabase Storage on chapter delete — orphaned audio files persist until R-TASK-112 cron sweeps them or the parent book is deleted (TASK-017 cleans storage in that path)
- Does NOT support concurrent edit conflict detection — last-write-wins per Q-3.8
- Does NOT support diff at sub-chapter granularity (e.g., per-paragraph) — full chapter content is the unit of upsert

## Tests Required

- AT-034: PUT with `{ title }` only updates title; existing content preserved
- AT-035: PUT with `{ content }` only updates content + word_count + book.word_count_total
- AT-036: POST `/reorder` swaps chapter indices atomically; audio_chunks reference correct chapters after
- AT-037: DELETE chapter cascades to audio_chunks row (verify via SELECT count after)
- AT-038: Two PUT requests racing → second wins (last-write-wins behavior)
- AT-039: PUT for chapter on a book the user doesn't own → 404 (not 403, leak prevention)

## Session Notes
_(Filled by Claude Code during implementation)_
