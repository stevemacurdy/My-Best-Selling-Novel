<!-- APPLY: REPLACE -->
<!-- Target: docs/TASKS/TASK-017-books-api.md (in original mybsn package) -->
<!-- Backup: docs/EXPANDED-TASKS/backups/TASK-017-books-api.pre-expansion-backup.md -->
<!-- Expanded 2026-05-08 from 126 words to ~970 words via PATCH-3 sub-deliverable B.3. -->

# TASK-017: Books CRUD API (`app/api/books/*`)

## Status: NOT STARTED
## Priority: CRITICAL
## Phase: 3
## Estimated Sessions: 2
## Dependencies: TASK-006, TASK-012, TASK-016
## Requirements Covered: R5, R10
## Spec Reference: Section 3.5

## Inference Summary

| Addition | Source |
|---|---|
| Metadata field list on GET (id, title, genre, status, cover_url, word_count_total, chapter_count, created_at, updated_at) | Q-3.1 operator-answer (use default) |
| Sort `updated_at DESC`, no pagination in v1 | Q-3.2 operator-answer (use default) |
| Client-side delete confirmation only (no API confirmation token) | Q-3.3 operator-answer (use default) |
| Strip `audioRecordings`, `coverFiles`, `originalUploadedText` from book_data on PUT | Q-3.4 operator-answer (use default) |
| Hard-delete in v1; R-TASK-144 converts to soft-delete in Phase 11 | Q-3.5 operator-answer (use default) |
| Storage cleanup on book DELETE | TASK-019 storage paths + Q-3.14 best-effort default |
| `canPerform('create_book', ...)` gate on POST | TASK-016 expansion |
| RLS-backed; verifyToken on every route | Decision #16 + TASK-006 |

Operator confirmed all questions on 2026-05-08.

## Pre-flight: re-read current state

- View `app/api/books/route.ts` and `app/api/books/[id]/route.ts` if present.
- Confirm migration TASK-012 (books table) is applied: `id`, `user_id`, `title`, `genre`, `status`, `cover_url`, `book_data` (JSONB), `created_at`, `updated_at`.
- Confirm `lib/api-auth.ts` (TASK-006) and `lib/subscription.ts` (TASK-016) ship.
- Confirm `lib/supabase/server.ts` (TASK-004) ships.

## Files to Create/Modify

- `app/api/books/route.ts` — GET (list) + POST (create)
- `app/api/books/[id]/route.ts` — GET (one) + PUT (update) + DELETE

## Implementation Requirements

### GET `/api/books` — list user's books

```typescript
export async function GET(req: NextRequest) {
  const user = await verifyToken(req);
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const sb = createClient();
  // Per Q-3.1: metadata only, not full book_data. Per Q-3.2: sort updated_at DESC, no pagination.
  const { data, error } = await sb
    .from('books')
    .select('id, title, genre, status, cover_url, word_count_total, chapter_count, created_at, updated_at')
    .eq('user_id', user.id)  // RLS belt-and-suspenders; the policy already enforces this
    .order('updated_at', { ascending: false });

  if (error) return NextResponse.json({ error: 'fetch_failed' }, { status: 500 });
  return NextResponse.json({ books: data });
}
```

`word_count_total` and `chapter_count` are denormalized columns on `books` (added in migration TASK-012); incremented by chapter writes (TASK-018). Computing on-the-fly via SQL aggregation would require joining `chapters` per row — too expensive for a list view that may render 50 cards.

### POST `/api/books` — create book

```typescript
export async function POST(req: NextRequest) {
  const user = await verifyToken(req);
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  // Tier gate per TASK-016
  const sb = createClient();
  const { data: existing } = await sb.from('books').select('id', { count: 'exact', head: true }).eq('user_id', user.id);
  const ctx = { tier: user.subscription_tier, status: user.subscription_status, current_book_count: existing?.length ?? 0, ai_calls_this_month: 0 };
  const gate = canPerform('create_book', ctx);
  if (!gate.allowed) return NextResponse.json({ error: gate.reason }, { status: 403 });

  const body = await req.json();
  const { title, genre } = body;
  if (!title?.trim()) return NextResponse.json({ error: 'title_required' }, { status: 400 });

  const { data, error } = await sb
    .from('books')
    .insert({ user_id: user.id, title: title.trim(), genre: genre ?? null, status: 'draft', book_data: {} })
    .select()
    .single();

  if (error) return NextResponse.json({ error: 'create_failed' }, { status: 500 });
  return NextResponse.json({ book: data });
}
```

### GET `/api/books/[id]` — full book including agent state

Returns the full `book_data` JSONB (which holds all agent step state: genre scan results, outline, characters, etc.). Used by `/app/[bookId]` page on initial load.

```typescript
const { data, error } = await sb.from('books').select('*').eq('id', params.id).eq('user_id', user.id).single();
if (error || !data) return NextResponse.json({ error: 'not_found' }, { status: 404 });
return NextResponse.json({ book: data });
```

### PUT `/api/books/[id]` — update book metadata + agent state

```typescript
export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const user = await verifyToken(req);
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const body = await req.json();
  const { title, genre, status, book_data } = body;

  // Per Q-3.4: strip the three known-bloat fields before persisting
  let cleanBookData = book_data;
  if (book_data && typeof book_data === 'object') {
    const { audioRecordings, coverFiles, originalUploadedText, ...rest } = book_data;
    cleanBookData = rest;
  }

  const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (title !== undefined) updates.title = title;
  if (genre !== undefined) updates.genre = genre;
  if (status !== undefined) updates.status = status;  // 'draft' | 'in_progress' | 'complete' | 'published'
  if (cleanBookData !== undefined) updates.book_data = cleanBookData;

  const sb = createClient();
  const { data, error } = await sb.from('books').update(updates).eq('id', params.id).eq('user_id', user.id).select().single();
  if (error || !data) return NextResponse.json({ error: 'update_failed' }, { status: 500 });

  return NextResponse.json({ book: data });
}
```

The three stripped fields:
- `audioRecordings` — old in-memory blob format from agent S6; superseded by `audio_chunks` table (TASK-014, TASK-019)
- `coverFiles` — raw uploaded image bytes; superseded by `cover_url` column referencing Supabase Storage (Decision #15)
- `originalUploadedText` — raw blob from S2 upload; once parsed into `chapters` rows, the blob is redundant (Decision #22 chapter split)

### DELETE `/api/books/[id]` — hard-delete with cascade

Per Q-3.5 default, hard-delete in v1. R-TASK-144 (Phase 11) converts to soft-delete; that conversion adds a `deleted_at` column and updates queries to filter it out, surfaced by R-144's Pre-flight section.

```typescript
export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const user = await verifyToken(req);
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const sb = createClient();

  // Per Q-3.14 default: best-effort storage cleanup; failures logged to Sentry but do not block.
  // List audio chunks for this book and attempt to delete from Supabase Storage.
  const { data: chunks } = await sb.from('audio_chunks').select('storage_path').eq('book_id', params.id);
  if (chunks?.length) {
    const paths = chunks.map(c => c.storage_path).filter(Boolean) as string[];
    const { error: storageError } = await sb.storage.from('audio').remove(paths);
    if (storageError) {
      Sentry.captureMessage('Audio storage cleanup partial-failure on book delete', { level: 'warning', extra: { book_id: params.id, paths, error: storageError } });
      // Continue — orphaned files cleaned by R-TASK-112's offboarding cron
    }
  }

  // Cover image cleanup (Decision #15: large covers in Storage)
  const { data: book } = await sb.from('books').select('cover_url').eq('id', params.id).single();
  if (book?.cover_url) {
    // cover_url is a public URL like https://<project>.supabase.co/storage/v1/object/public/covers/<user_id>/<book_id>.jpg
    const path = book.cover_url.split('/storage/v1/object/public/covers/')[1];
    if (path) await sb.storage.from('covers').remove([path]).catch(() => { /* best-effort */ });
  }

  // Cascade: chapters + audio_chunks rows are removed by ON DELETE CASCADE foreign keys (TASK-013, TASK-014).
  const { error } = await sb.from('books').delete().eq('id', params.id).eq('user_id', user.id);
  if (error) return NextResponse.json({ error: 'delete_failed' }, { status: 500 });

  return NextResponse.json({ ok: true });
}
```

The DB-level cascade (foreign keys with `ON DELETE CASCADE`) handles row deletion atomically; storage cleanup is best-effort because Storage API is a separate system. Per Q-3.3, the API trusts that the client confirmed (no `?confirm=true` token); the modal in `/app` (TASK-026 / TASK-047) handles UX confirmation.

## What this task does NOT do

- Does NOT implement chapter CRUD — that's TASK-018
- Does NOT validate `book_data` shape — JSONB is intentionally schema-less to accommodate evolving agent state
- Does NOT implement export — that's the agent's S11 step (TASK-041)
- Does NOT support multi-user shared books (R-TASK-101 Path A: team seats deferred to v2)

## Tests Required

- AT-027: Authenticated GET returns user's books only; another user's books are excluded by RLS
- AT-028: Explorer tier with 1 book → POST returns 403 `book_limit_reached`
- AT-029: Explorer with 0 books → POST creates book, returns 201
- AT-030: PUT strips `audioRecordings`, `coverFiles`, `originalUploadedText` from book_data
- AT-031: DELETE removes chapters + audio_chunks via cascade; storage files attempted
- AT-032: Storage cleanup partial-failure logs Sentry warning but DELETE still succeeds
- AT-033: Mechanical: GET list response shape matches Q-3.1 default exactly (9 fields, no `book_data`)

## Session Notes
_(Filled by Claude Code during implementation)_
