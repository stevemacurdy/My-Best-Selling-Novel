-- APPLY: CREATE
-- Migration: 015_soft_delete_columns.sql
-- Author: Steve
-- Date: 2026-05-04
-- Purpose: Soft delete for books and chapters (R-TASK-144, GAP-009)
-- Rollback: ALTER TABLE books DROP COLUMN deleted_at; ALTER TABLE chapters DROP COLUMN deleted_at
-- Locks: AccessExclusiveLock briefly (column add)
-- Online/Offline: Online
-- Destructive: No
--
-- LOCAL DIVERGENCE FROM CANONICAL (2026-05-09): the canonical
-- remediation/supabase/migrations/015_soft_delete_columns.sql DROPs policies
-- named "Users see own books" and "Users see own chapters", which never
-- existed in this build — base migrations 002/003 created them as
-- books_select_own and chapters_select_own (snake_case). Without this fix,
-- canonical 015's IF EXISTS DROPs no-op silently, leaving the original
-- non-deleted-at-filtering SELECT policies in place. Postgres ORs RLS
-- policies, so users would see both deleted and non-deleted rows — soft
-- delete becomes a no-op. This local copy adds DROPs for the actual
-- snake_case names; the original title-case DROPs are preserved (they
-- still no-op safely under IF EXISTS) so the migration matches the
-- canonical's intent against either naming convention.
--
-- KNOWN LIMITATION (canonical, not local): this migration only updates
-- the SELECT policy. UPDATE/DELETE policies on books/chapters still don't
-- filter by deleted_at, so a user can still update or delete a soft-deleted
-- row. Tracked in CONTENT_TODO.md under "v4 packet corrections".

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

-- Update existing RLS policies to filter soft-deleted rows for normal SELECTs.
-- Note: this REPLACES the existing book/chapter SELECT policies.
-- Both the canonical title-case names (no-op) and the actual snake_case names
-- (from 002/003) are dropped to be robust against either naming convention.

DROP POLICY IF EXISTS "Users see own books" ON books;       -- canonical name; no-op here
DROP POLICY IF EXISTS books_select_own ON books;            -- actual name from migration 002

CREATE POLICY "Users see own non-deleted books" ON books
  FOR SELECT USING (auth.uid() = user_id AND deleted_at IS NULL);

CREATE POLICY "Users see own deleted books for restore" ON books
  FOR SELECT USING (auth.uid() = user_id AND deleted_at IS NOT NULL)
  -- This policy is invoked when the /account/library "Recently deleted" tab queries
  -- with explicit filter `deleted_at IS NOT NULL`.
  ;

DROP POLICY IF EXISTS "Users see own chapters" ON chapters; -- canonical name; no-op here
DROP POLICY IF EXISTS chapters_select_own ON chapters;      -- actual name from migration 003

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
