<!-- APPLY: REPLACE -->
<!-- Target: docs/TASKS/TASK-066-e2e-agent.md (in original mybsn package) -->
<!-- Backup: docs/EXPANDED-TASKS/backups/TASK-066-e2e-agent.pre-expansion-backup.md -->
<!-- Expanded 2026-05-08 from 101 words to ~960 words via PATCH-3 sub-deliverable B.3. -->

# TASK-066: E2E Agent Flow Test (`docs/manual-tests/agent.md`)

## Status: NOT STARTED
## Priority: HIGH
## Phase: 10
## Estimated Sessions: 2
## Dependencies: TASK-027 through TASK-042 (all agent-port tasks)
## Requirements Covered: R3, R4, R5
## Spec Reference: Section 10.4

## Inference Summary

| Addition | Source |
|---|---|
| Full agent flow (S0–S11 + library round-trip) | Q-10.13 operator-answer (use default) |
| User-flow verification only; R-TASK-126 owns golden-output validation | Q-10.14 operator-answer (use default) |
| Both synthetic short and real manuscript test data | Q-10.15 operator-answer (use default) |
| Pre-recorded webm fixture for audio (mic-access workaround) | Q-10.16 operator-answer (use default) |
| Ships before R-TASK-126 in Phase 10 | Q-10.17 operator-answer (use default); BUILD_STRATEGY_ADDENDUM phase ordering |
| ADR-003 governs verbatim port — agent prompts frozen | ADR-003 |

Operator confirmed all questions on 2026-05-08.

## Pre-flight: re-read current state

- View `docs/manual-tests/agent.md` if present.
- Confirm all 16 agent-port tasks (TASK-027 through TASK-042) have shipped per ADR-003.
- Confirm `e2e/fixtures/sample-chapter.webm` exists (10s audio file, ~50KB) — if not, this task creates it as part of setup.
- Confirm test manuscripts exist: a short synthetic ("Once upon a time..." ~500 words) and a longer real fictional manuscript (~50K words). Operator can use the "The God in You" cover example or any other manuscript with rights cleared for testing.

## Files to Create/Modify

- `docs/manual-tests/agent.md` (NEW)
- `e2e/fixtures/sample-chapter.webm` (NEW; 10s of silence or low-amplitude audio for upload tests)
- `e2e/fixtures/synthetic-short.md` (NEW; ~500 word synthetic manuscript)
- Operator separately provides a real manuscript as `e2e/fixtures/real-manuscript.txt` (gitignored)

## Implementation Requirements

The agent flow has 12 steps (S0–S11) plus library round-trip. Each step is verified by user-flow expectations: the UI advances, AI calls succeed, data persists. **Per Q-10.14 default, this task does NOT validate AI output structure** — that's R-TASK-126's golden-output suite responsibility. TASK-066 verifies the wrapper works.

### Setup

```bash
npm run dev
# Sign in as Author tier test user (Explorer can't reach S6+ exports anyway)
# Open DevTools to monitor /api/ai requests during AI-call steps
```

### Test data — 2 runs

**Run A (synthetic short, ~5 min):** uses `e2e/fixtures/synthetic-short.md`. Run on every PR that touches agent code. Fast smoke.

**Run B (real manuscript, ~30 min):** uses operator's real manuscript. Run weekly or pre-launch. Stress test that exercises the chunked-analysis path (Decision #14, 200K+ words).

### Cases (run for each test data set)

#### Case 1 — Library: create new book

**Action:** `/app` → "New Book" → name `E2E Agent Test {timestamp}` → submit.

**Expected:**
- ☐ Land at `/app/[bookId]`, agent at S0
- ☐ Book row created with `status='draft'`

#### Case 2 — S0 Genre Scanner

**Action:** Pick a genre (e.g., "Mystery") from the agent's pre-defined list.

**Expected:**
- ☐ S0 advances to S1
- ☐ `books.genre='Mystery'` written via PUT `/api/books/[id]`
- ☐ Agent's S0 Genre Scanner displays demand/competition/opportunity scores per `lib/genre-scores.ts` (TASK-053)

#### Case 3 — S1 Book Setup

**Action:** Enter title, target word count (e.g., 50,000), audience, tone.

**Expected:**
- ☐ S1 advances to S2
- ☐ `book_data.book_setup` populated

#### Case 4 — S2 Upload & Organize

**Action:** Choose path:
- **Run A (synthetic):** "I have a manuscript" → upload `e2e/fixtures/synthetic-short.md`
- **Run B (real):** Same path with the real manuscript

**Expected:**
- ☐ Upload completes; chunked analysis runs (per Decision #14 6-heading-format chapter splitter)
- ☐ POST `/api/ai` succeeds; AI suggests chapter splits
- ☐ Chapters parsed into `chapters` table (TASK-018 expansion)
- ☐ `books.chapter_count > 0`

#### Case 5 — S3 Outline Builder

**Action:** Review and edit AI-generated outline.

**Expected:**
- ☐ Outline displays with chapters from S2
- ☐ Drag-and-drop reorder works (TASK-018 reorder endpoint)
- ☐ Reorder POST request fires; chapters' `chapter_index` updated atomically

#### Case 6 — S4 Front & Back Matter

**Action:** Generate dedication, acknowledgments, foreword, etc.

**Expected:**
- ☐ AI calls succeed for each matter type
- ☐ `book_data.front_matter` and `back_matter` populated

#### Case 7 — S5 Chapter Guide / Avoid System

**Action:** Generate chapter-by-chapter guide. Activate "avoid system" by entering plot points or character names that should NOT be repeated.

**Expected:**
- ☐ S5 produces guide with 3-5 bullets per chapter
- ☐ Avoid list persists in `book_data.avoid_terms`

#### Case 8 — S6 Write & Record

**Action:** Pick first chapter, click "Write chapter." AI generates draft. Optionally record audio (Run A) or upload pre-recorded fixture (Run B).

**Expected:**
- ☐ AI generation completes within PATCH-001 60s timeout
- ☐ Streaming response visible in UI (token-by-token render)
- ☐ Generated chapter saves via PUT `/api/chapters/[id]/[index]` with smart-diff (TASK-018)
- ☐ Audio: per Q-10.16 default, **mock audio uploads via direct POST `/api/audio/[bookId]/[index]` with `e2e/fixtures/sample-chapter.webm`** (the MediaRecorder UI exercised manually; audio bytes themselves are pre-recorded)
- ☐ `audio_chunks` row created; signed URL playback works

#### Case 9 — S7-S8 AI Review + Description

**Action:** Run AI review on chapter. Generate book description.

**Expected:**
- ☐ Review surfaces edits and feedback
- ☐ Description written to `book_data.description`

#### Case 10 — S9 Publishing Setup

**Action:** Configure publishing metadata (ISBN, categories, keywords).

**Expected:**
- ☐ `book_data.publishing` populated

#### Case 11 — S10-S11 Cover + Export

**Action:** Upload cover image; export book in 3 formats (PDF, EPUB, DOCX) per Decision #6 author-tier exports.

**Expected:**
- ☐ Cover uploads to Supabase Storage `covers/` bucket
- ☐ `books.cover_url` populated
- ☐ Each export triggers download
- ☐ Files open without errors in respective readers (PDF in Preview, EPUB in Apple Books, DOCX in Word/Pages)

#### Case 12 — Library round-trip

**Action:** Close `/app/[bookId]` tab. Visit `/account` → see book in library. Click "Continue" → reopens at last-active step.

**Expected:**
- ☐ Book appears in library with correct title + cover thumbnail
- ☐ Reopen lands at S11 (last step) or last-saved progress
- ☐ All chapter content preserved
- ☐ Audio recordings preserved (signed URL fetches succeed)

### Why R-TASK-126 owns AI output validation (Q-10.14)

Per ADR-003, agent prompts are frozen verbatim. The "golden-output" suite (R-TASK-126) snapshots expected AI responses for known inputs and regression-tests against them — that's how prompt-side regressions are caught when Anthropic's models update or the prompt strings drift. TASK-066 verifies user-facing wrapper works (UI advances, calls succeed, data persists) but does NOT assert on AI response content.

### Phase ordering (Q-10.17)

TASK-066 ships in Phase 10 (Integration Testing); R-TASK-126 ships in Phase 11 (Production Readiness). Order matters: TASK-066 establishes user-flow tests first; R-126 layers golden-output rigor on top. Both coexist in long-term test suite.

## What this task does NOT do

- Does NOT validate AI response content (Q-10.14; R-TASK-126's job)
- Does NOT exercise Explorer-tier limits (TASK-064 does)
- Does NOT exercise billing flows (TASK-065 does)
- Does NOT modify agent code (ADR-003 verbatim port)

## Tests Required (meta — verifying the doc itself)

- AT-111: `docs/manual-tests/agent.md` exists with all 12 cases
- AT-112: Audio upload case explicitly references the pre-recorded fixture path
- AT-113: Both synthetic and real-manuscript run guidance documented
- AT-114: Phase-ordering note clarifies TASK-066 ships before R-TASK-126

## Session Notes
_(Filled by Claude Code during implementation)_
