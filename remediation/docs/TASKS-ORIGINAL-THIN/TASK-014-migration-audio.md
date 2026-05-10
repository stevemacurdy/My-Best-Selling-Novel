# TASK-014: Migration: audio_chunks

## Status: NOT STARTED
## Priority: HIGH
## Phase: 3
## Estimated Sessions: 1
## Dependencies: TASK-012
## Requirements Covered: R10
## Spec Reference: Section 3.4

## Files to Create/Modify
supabase/migrations/004_audio_chunks.sql

## Implementation Requirements
CREATE TABLE audio_chunks with: id UUID PK, book_id UUID references books ON DELETE CASCADE, user_id UUID references profiles, chapter_index INT, storage_path TEXT NOT NULL, mime_type TEXT, duration_seconds INT, file_size_bytes BIGINT, UNIQUE(book_id, chapter_index). Create storage bucket 'book-audio' (private). Create storage RLS policies for user-scoped upload/read/delete using storage.foldername(name)[1] = auth.uid()::text.

## Tests Required
AT-030: Table + bucket create. AT-031: Storage RLS scopes to user folder.

## Session Notes
_(Filled by Claude Code during implementation)_
