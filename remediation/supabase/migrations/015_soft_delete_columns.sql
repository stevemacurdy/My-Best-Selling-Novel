-- APPLY: CREATE
-- Migration: 015_soft_delete_columns.sql
-- Author: Steve
-- Date: 2026-05-04
-- Purpose: Soft delete for books and chapters (R-TASK-144, GAP-009)
-- Rollback: ALTER TABLE books DROP COLUMN deleted_at; ALTER TABLE chapters DROP COLUMN deleted_at
-- Locks: AccessExclusiveLock briefly (column add)
-- Online/Offline: Online
-- Destructive: No

ALTER TABLE books
  ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;

ALTER TABLE chapters
  ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;

CREATE INDEX idx_books_active ON books(user_id, updated_at DESC)
  WHERE deleted_at IS NULL;

CREATE INDEX idx_books_recently_deleted ON books(user_id, deleted_at DESC)
  WHERE deleted_at IS NOT NULL;

CREATE INDEX idx_chapters_active ON chapters(book_id, chapter_index)
  WHERE deleted_at IS NULL;

-- Update existing RLS policies to filter soft-deleted rows for normal SELECTs
-- Note: this REPLACES the existing book/chapter SELECT policies.
-- The original policies (in migrations 002, 003) used `auth.uid() = user_id` only.

DROP POLICY IF EXISTS "Users see own books" ON books;
CREATE POLICY "Users see own non-deleted books" ON books
  FOR SELECT USING (auth.uid() = user_id AND deleted_at IS NULL);

CREATE POLICY "Users see own deleted books for restore" ON books
  FOR SELECT USING (auth.uid() = user_id AND deleted_at IS NOT NULL)
  -- This policy is invoked when the /account/library "Recently deleted" tab queries
  -- with explicit filter `deleted_at IS NOT NULL`.
  ;

DROP POLICY IF EXISTS "Users see own chapters" ON chapters;
CREATE POLICY "Users see own non-deleted chapters" ON chapters
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM books
      WHERE books.id = chapters.book_id
        AND books.user_id = auth.uid()
        AND books.deleted_at IS NULL
    )
    AND chapters.deleted_at IS NULL
  );
