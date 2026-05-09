# TASK-018: Chapters API

## Status: NOT STARTED
## Priority: CRITICAL
## Phase: 3
## Estimated Sessions: 2
## Dependencies: TASK-006,TASK-013
## Requirements Covered: R22
## Spec Reference: Section 3.8

## Files to Create/Modify
app/api/chapters/[bookId]/route.ts, app/api/chapters/[bookId]/[index]/route.ts

## Implementation Requirements
GET /api/chapters/[bookId]: return all chapters for book, ordered by chapter_index. PUT /api/chapters/[bookId]/[index]: upsert chapter content, title, purpose, word_count — this is the smart diff target (client sends only changed chapter, not entire book). DELETE /api/chapters/[bookId]/[index]: delete single chapter. All routes: verifyToken, verify book belongs to user.

## Tests Required
AT-039: GET returns ordered chapters. AT-040: PUT upserts correctly. AT-041: Smart diff sends only changed data.

## Session Notes
_(Filled by Claude Code during implementation)_
