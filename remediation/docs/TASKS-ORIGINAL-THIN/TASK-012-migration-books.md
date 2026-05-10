# TASK-012: Migration: books

## Status: NOT STARTED
## Priority: CRITICAL
## Phase: 3
## Estimated Sessions: 1
## Dependencies: TASK-011
## Requirements Covered: R22
## Spec Reference: Section 3.2

## Files to Create/Modify
supabase/migrations/002_books.sql

## Implementation Requirements
CREATE TABLE books with: id UUID PK, user_id UUID references profiles, created_at, updated_at (auto-trigger), title TEXT, subtitle, author_name, genre, book_type, word_count INT, health_score INT, last_step INT, book_data JSONB DEFAULT '{}', cover_url, cover_storage_path. RLS: users manage own books. Index on (user_id, updated_at DESC).

## Tests Required
AT-024: Table creates. AT-025: updated_at auto-updates. AT-026: RLS enforced.

## Session Notes
_(Filled by Claude Code during implementation)_
