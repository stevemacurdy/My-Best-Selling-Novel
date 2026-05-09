# TASK-017: Books CRUD API

## Status: NOT STARTED
## Priority: CRITICAL
## Phase: 3
## Estimated Sessions: 2
## Dependencies: TASK-006,TASK-012
## Requirements Covered: R11
## Spec Reference: Section 3.7

## Files to Create/Modify
app/api/books/route.ts, app/api/books/[id]/route.ts

## Implementation Requirements
GET /api/books: verifyToken, select metadata fields (not full book_data) ordered by updated_at DESC. POST /api/books: verifyToken, check tier max_books, insert new book. GET /api/books/[id]: verifyToken, select full row including book_data, scoped to user_id. PUT /api/books/[id]: verifyToken, accept partial updates, strip audioRecordings/coverFiles from book_data. DELETE /api/books/[id]: verifyToken, delete storage audio files first, then delete book (CASCADE handles chapters + audio_chunks rows).

## Tests Required
AT-036: CRUD operations work. AT-037: Tier limit enforced on POST. AT-038: DELETE cascades correctly.

## Session Notes
_(Filled by Claude Code during implementation)_
