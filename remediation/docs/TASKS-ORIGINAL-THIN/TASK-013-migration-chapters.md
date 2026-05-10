# TASK-013: Migration: chapters

## Status: NOT STARTED
## Priority: CRITICAL
## Phase: 3
## Estimated Sessions: 1
## Dependencies: TASK-012
## Requirements Covered: R22
## Spec Reference: Section 3.3

## Files to Create/Modify
supabase/migrations/003_chapters.sql

## Implementation Requirements
CREATE TABLE chapters with: id UUID PK, book_id UUID references books ON DELETE CASCADE, user_id UUID references profiles, chapter_index INT, title TEXT, content TEXT DEFAULT '', purpose TEXT, key_points TEXT, word_count INT DEFAULT 0, created_at, updated_at. UNIQUE(book_id, chapter_index). RLS: users manage own chapters. Index on book_id.

## Tests Required
AT-027: Table creates. AT-028: Unique constraint on (book_id, chapter_index). AT-029: CASCADE delete works.

## Session Notes
_(Filled by Claude Code during implementation)_
