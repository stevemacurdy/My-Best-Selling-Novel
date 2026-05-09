<!-- APPLY: REPLACE -->
<!-- Target: docs/TASKS/TASK-019-audio-api.md (in original mybsn package) -->
<!-- Backup: docs/EXPANDED-TASKS/backups/TASK-019-audio-api.pre-expansion-backup.md -->
<!-- Expanded 2026-05-08 from 118 words to ~880 words via PATCH-3 sub-deliverable B.3. -->

# TASK-019: Audio Upload + Retrieval API (`app/api/audio/*`)

## Status: NOT STARTED
## Priority: HIGH
## Phase: 3
## Estimated Sessions: 1
## Dependencies: TASK-006, TASK-014, TASK-016, TASK-018
## Requirements Covered: R5, R6
## Spec Reference: Section 3.7

## Inference Summary

| Addition | Source |
|---|---|
| Accept webm + mp4 (Safari MediaRecorder produces mp4) | Q-3.10 operator-answer (use default) |
| Storage path matches content-type extension | Q-3.11 operator-answer (use default) |
| 1-hour signed URL TTL on GET | Q-3.12 operator-answer (use default) |
| 50MB file size limit; 413 if exceeded | Q-3.13 operator-answer (use default) |
| Best-effort delete with Sentry warning on failure | Q-3.14 operator-answer (use default) |
| `canPerform('upload_audio', ...)` tier gate | TASK-016 expansion |
| Storage path `{userId}/{bookId}/chapter_{idx}.{ext}` | original TASK-019 + Q-3.11 default |

Operator confirmed all questions on 2026-05-08.

## Pre-flight: re-read current state

- View `app/api/audio/[bookId]/[index]/route.ts` if present.
- Confirm migration TASK-014 (audio_chunks table) is applied: `id`, `book_id`, `chapter_index`, `storage_path`, `duration_seconds`, `file_size_bytes`, `mime_type`, `created_at`. Foreign key on `(book_id, chapter_index)` with `ON DELETE CASCADE` to chapters.
- Confirm Supabase Storage bucket `audio` exists with **private** access (signed URLs only). Create via Supabase Dashboard if missing.
- Confirm bucket-level upload size limit configured to 50MB on Supabase side as a redundant guard.

## Files to Create/Modify

- `app/api/audio/[bookId]/[index]/route.ts` — POST (upload) + GET (signed URL) + DELETE (single)

## Implementation Requirements

### POST `/api/audio/[bookId]/[index]` — upload audio chunk

Accepts multipart/form-data with a single file field. Validates content-type (webm or mp4 per Q-3.10), size (≤50MB per Q-3.13), tier (`upload_audio` action via TASK-016).

```typescript
const ALLOWED_TYPES = new Map<string, string>([
  ['audio/webm', 'webm'],
  ['audio/mp4', 'mp4'],     // Safari's MediaRecorder produces mp4
  ['audio/mpeg', 'mp4'],    // some Safari variants report this for mp4 audio
]);
const MAX_BYTES = 50 * 1024 * 1024;  // 50MB

export async function POST(req: NextRequest, { params }: { params: { bookId: string; index: string } }) {
  const user = await verifyToken(req);
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  // Tier gate per TASK-016
  const ctx = { tier: user.subscription_tier, status: user.subscription_status, current_book_count: 0, ai_calls_this_month: 0 };
  const gate = canPerform('upload_audio', ctx);
  if (!gate.allowed) return NextResponse.json({ error: gate.reason }, { status: 403 });

  const chapterIndex = parseInt(params.index, 10);
  if (Number.isNaN(chapterIndex) || chapterIndex < 0) {
    return NextResponse.json({ error: 'invalid_index' }, { status: 400 });
  }

  const sb = createClient();

  // Ownership gate (book belongs to user, chapter exists)
  const { data: chapter } = await sb
    .from('chapters')
    .select('book_id, books!inner(user_id)')
    .eq('book_id', params.bookId)
    .eq('chapter_index', chapterIndex)
    .single();
  if (!chapter || chapter.books.user_id !== user.id) {
    return NextResponse.json({ error: 'not_found' }, { status: 404 });
  }

  const formData = await req.formData();
  const file = formData.get('file') as File | null;
  if (!file) return NextResponse.json({ error: 'file_required' }, { status: 400 });

  const ext = ALLOWED_TYPES.get(file.type);
  if (!ext) return NextResponse.json({ error: 'unsupported_type' }, { status: 415 });

  if (file.size > MAX_BYTES) {
    return NextResponse.json({ error: 'file_too_large', max_bytes: MAX_BYTES }, { status: 413 });
  }

  // Per Q-3.11: storage path uses extension matching content-type
  const path = `${user.id}/${params.bookId}/chapter_${chapterIndex}.${ext}`;

  // Replace existing chunk if present (single-chunk-per-chapter model)
  const { error: uploadError } = await sb.storage
    .from('audio')
    .upload(path, file, { contentType: file.type, upsert: true });
  if (uploadError) return NextResponse.json({ error: 'upload_failed' }, { status: 500 });

  // Estimate duration from file size — accurate enough for UX (precise duration computed client-side from MediaRecorder timestamp)
  const durationSeconds = formData.get('duration_seconds');
  const dur = typeof durationSeconds === 'string' ? parseFloat(durationSeconds) : null;

  await sb.from('audio_chunks').upsert({
    book_id: params.bookId,
    chapter_index: chapterIndex,
    storage_path: path,
    file_size_bytes: file.size,
    mime_type: file.type,
    duration_seconds: dur && Number.isFinite(dur) ? dur : null,
  }, { onConflict: 'book_id,chapter_index' });

  return NextResponse.json({ ok: true, storage_path: path, file_size_bytes: file.size });
}
```

### GET `/api/audio/[bookId]/[index]` — return signed URL

Per Q-3.12 default, signed URL TTL is **1 hour**. Long enough for normal listening sessions; short enough that a leaked URL has limited blast radius.

```typescript
export async function GET(req: NextRequest, { params }: { params: { bookId: string; index: string } }) {
  const user = await verifyToken(req);
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const sb = createClient();
  const chapterIndex = parseInt(params.index, 10);

  const { data: chunk } = await sb
    .from('audio_chunks')
    .select('storage_path, books!inner(user_id)')
    .eq('book_id', params.bookId)
    .eq('chapter_index', chapterIndex)
    .single();

  if (!chunk || chunk.books.user_id !== user.id) {
    return NextResponse.json({ error: 'not_found' }, { status: 404 });
  }

  const { data, error } = await sb.storage
    .from('audio')
    .createSignedUrl(chunk.storage_path, 60 * 60);  // 1 hour TTL
  if (error || !data) return NextResponse.json({ error: 'sign_failed' }, { status: 500 });

  return NextResponse.json({ url: data.signedUrl, expires_in: 3600 });
}
```

The client polls or re-requests this endpoint when the previous URL expires; not a connection-keepalive scheme.

### DELETE `/api/audio/[bookId]/[index]` — remove single audio chunk

Per Q-3.14 default, best-effort delete. Storage failure → Sentry warning, but DB row still deleted (so cascade orphans are caught by R-TASK-112 sweeper).

```typescript
const { data: chunk } = await sb.from('audio_chunks').select('storage_path').eq('book_id', params.bookId).eq('chapter_index', chapterIndex).single();
if (chunk?.storage_path) {
  const { error } = await sb.storage.from('audio').remove([chunk.storage_path]);
  if (error) {
    Sentry.captureMessage('Audio storage delete failed', { level: 'warning', extra: { path: chunk.storage_path, error } });
    // continue — DB row still removed
  }
}
await sb.from('audio_chunks').delete().eq('book_id', params.bookId).eq('chapter_index', chapterIndex);
return NextResponse.json({ ok: true });
```

## What this task does NOT do

- Does NOT support multi-chunk-per-chapter (chunked upload for large files) — single chunk per chapter, max 50MB
- Does NOT transcode audio formats — bytes stored as uploaded
- Does NOT generate waveforms / visualizations server-side — done client-side from the audio element
- Does NOT enforce duration cap — 50MB byte cap is the only quantitative limit

## Tests Required

- AT-040: Upload webm < 50MB → 200 + audio_chunks row + storage file
- AT-041: Upload mp4 (Safari content-type) → 200, storage path ends `.mp4`
- AT-042: Upload 51MB file → 413 `file_too_large`
- AT-043: Upload `audio/wav` → 415 `unsupported_type`
- AT-044: Explorer tier (no upload_audio) → 403 `audio_requires_paid_tier`
- AT-045: GET returns signed URL with `?token=...` and 1-hour expiry; URL plays back successfully in `<audio>` element
- AT-046: DELETE removes both storage file and DB row
- AT-047: DELETE with simulated storage failure (mock 500 from Storage API) → DB row still removed; Sentry warning logged

## Session Notes
_(Filled by Claude Code during implementation)_
