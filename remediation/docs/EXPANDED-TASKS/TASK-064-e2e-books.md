<!-- APPLY: REPLACE -->
<!-- Target: docs/TASKS/TASK-064-e2e-books.md (in original mybsn package) -->
<!-- Backup: docs/EXPANDED-TASKS/backups/TASK-064-e2e-books.pre-expansion-backup.md -->
<!-- Expanded 2026-05-08 from 98 words to ~830 words via PATCH-3 sub-deliverable B.3. -->

# TASK-064: E2E Books CRUD Test (`docs/manual-tests/books.md`)

## Status: NOT STARTED
## Priority: HIGH
## Phase: 10
## Estimated Sessions: 1
## Dependencies: TASK-016, TASK-017, TASK-018, TASK-019
## Requirements Covered: R5, R6
## Spec Reference: Section 10.2

## Inference Summary

| Addition | Source |
|---|---|
| 6 base test cases | Q-10.5 operator-answer (use default) |
| Tier-transition case (Explorer→Author re-enables creation) | Q-10.6 operator-answer (use default); Q-3.4 |
| Audio cascade case | Q-10.7 operator-answer (use default); Q-3.9 |
| Concurrent edit test skipped in v1 | Q-10.8 operator-answer (use default); R-TASK-101 Path A |
| Smart-diff verification via Network tab | TASK-018 expansion |

Operator confirmed all questions on 2026-05-08.

## Pre-flight: re-read current state

- View `docs/manual-tests/books.md` if present.
- Confirm TASK-017 (books-api), TASK-018 (chapters-api), TASK-019 (audio-api), TASK-016 (subscription-logic) have all shipped.
- Confirm migrations TASK-012 (books) and TASK-013 (chapters) and TASK-014 (audio_chunks) applied with foreign-key cascades.

## Files to Create/Modify

- `docs/manual-tests/books.md` (NEW)

## Implementation Requirements

The doc is an 8-case checklist run by the operator before any books-related deploy. Cases 1-6 cover happy-path CRUD; case 7 verifies tier transitions; case 8 verifies cascade deletes through to storage.

### Setup

```bash
npm run dev
# Sign in with test account at Author tier (or upgrade Explorer first)
```

Test data:
- Test book title: `E2E Test Book {timestamp}`
- Sample chapter content: a short paragraph (~50 words) for fast iteration

### Case 1 — Create book

**Action:** `/app` → "New Book" button → name "Test Book Alpha" → submit.

**Expected:**
- ☐ POST `/api/books` returns 201 + book object with id
- ☐ Navigated to `/app/[bookId]`
- ☐ `books` table has new row: `user_id=current_user`, `title='Test Book Alpha'`, `status='draft'`, `chapter_count=0`, `word_count_total=0`
- ☐ Agent renders S0 (Genre Scanner) as the starting step

### Case 2 — Add chapters via agent

**Action:** Progress through agent S5/S6 to outline chapters. Add 3 chapters with titles "Ch1", "Ch2", "Ch3" and ~50 words each.

**Expected:**
- ☐ PUT `/api/chapters/[bookId]/0`, `/1`, `/2` succeed
- ☐ `chapters` table has 3 rows with `chapter_index = 0, 1, 2`
- ☐ `books.word_count_total` reflects sum of chapter word counts
- ☐ `books.chapter_count = 3`

### Case 3 — Smart-diff save

**Action:** Open DevTools > Network. Edit Ch1's content (add a paragraph). Verify auto-save fires.

**Expected:**
- ☐ Network tab shows PUT `/api/chapters/[bookId]/0` request
- ☐ Request payload contains ONLY `content` field (per Q-3.6 default — partial chapter object) — does NOT contain `title` or other unchanged fields
- ☐ Response 200 + word_count
- ☐ Refresh page — change persisted

### Case 4 — Close tab and reopen — data restored

**Action:** Close `/app/[bookId]` tab. Reopen by navigating to `/app/[bookId]` from `/account`.

**Expected:**
- ☐ All 3 chapters present with correct content
- ☐ Agent restored to last-active step (book_data persisted via TASK-017 PUT on agent state changes)

### Case 5 — Delete book → cascade deletes chapters + audio

**Setup:** Add audio recording to Ch1 via agent S6. Verify `audio_chunks` row exists with `storage_path` pointing to a Supabase Storage file.

**Action:** From `/account` book list, click delete on "Test Book Alpha", confirm modal.

**Expected:**
- ☐ DELETE `/api/books/[bookId]` returns 200
- ☐ `books` row deleted
- ☐ `chapters` rows for this book deleted (cascade via foreign key per TASK-013)
- ☐ `audio_chunks` rows for this book deleted (cascade via foreign key per TASK-014)
- ☐ Storage file at `{userId}/{bookId}/chapter_0.webm` removed (best-effort per Q-3.14)
- ☐ If storage delete failed (simulate by mocking 500 from Storage API), DB row still removed AND Sentry warning logged (R-TASK-106)

### Case 6 — Explorer tier 2nd book → blocked at API

**Setup:** Test account is Explorer tier with exactly 1 book.

**Action:** Try to POST `/api/books` with new title.

**Expected:**
- ☐ 403 `book_limit_reached` (per TASK-016 `canPerform('create_book', ...)`)
- ☐ UI surfaces: "Upgrade to Author for unlimited books" with link to `/pricing`
- ☐ No new book row created

### Case 7 — Tier transition unblocks Explorer

**Setup:** Explorer at limit (Case 6).

**Action:** Visit `/pricing`, subscribe Author Monthly. Wait for webhook (3-5s in dev). Return to `/app` and click "New Book."

**Expected:**
- ☐ Webhook (`subscription.created`) updates `profiles.subscription_tier='author'`, `subscription_status='active'`
- ☐ Per Q-3.4 default, quota raises immediately at upgrade
- ☐ Second book POST succeeds (no `book_limit_reached`)
- ☐ User can now create a 3rd, 4th, etc. (Author = unlimited per Decision #6)

### Case 8 — Audio cascade on chapter delete

**Setup:** Book with 3 chapters, audio attached to Ch2.

**Action:** Delete Ch2 via agent S6 "Remove chapter" button (or DELETE `/api/chapters/[bookId]/1`).

**Expected:**
- ☐ `chapters` row for index 1 deleted
- ☐ `audio_chunks` row for `(book_id, chapter_index=1)` deleted via cascade (per Q-3.9 + TASK-014)
- ☐ Remaining chapters: indices 0 and 2 (NOT auto-renumbered — that's the reorder endpoint's job, separate)

### Concurrent edit (skipped per Q-10.8 default)

**Status:** Last-write-wins behavior is documented in `docs/known-limitations.md` (per Q-3.8). No e2e test in v1.

## What this task does NOT do

- Does NOT exercise the AI generation flow (covered in TASK-066 e2e-agent)
- Does NOT exercise export (covered separately by agent S11)
- Does NOT exercise concurrent edit (per Q-10.8)

## Tests Required (meta — verifying the doc itself)

- AT-104: `docs/manual-tests/books.md` exists with all 8 cases
- AT-105: Tier transition case explicitly verifies upgrade unblocks book creation
- AT-106: Audio cascade case verifies both chapter delete and book delete trigger appropriate audio cleanup

## Session Notes
_(Filled by Claude Code during implementation)_
