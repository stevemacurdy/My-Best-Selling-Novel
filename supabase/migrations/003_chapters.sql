-- TASK-013: chapters table (per ADR-002 chapter grain split)
-- Per spec: id PK, book_id FK→books ON DELETE CASCADE, user_id FK→profiles,
-- chapter_index INT, title TEXT, content TEXT DEFAULT '', purpose TEXT,
-- key_points TEXT, word_count INT DEFAULT 0, created_at, updated_at.
-- UNIQUE(book_id, chapter_index). RLS: users manage own chapters.
-- Index on book_id.
--
-- Cross-binds:
--   - R-TASK migration 015_soft_delete_columns.sql later adds deleted_at
--   - book_id ON DELETE CASCADE — deleting a book removes all its chapters
--   - user_id is denormalized from books.user_id so RLS can scope without a join

CREATE TABLE chapters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  book_id UUID NOT NULL REFERENCES books(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  chapter_index INT NOT NULL,
  title TEXT,
  content TEXT NOT NULL DEFAULT '',
  purpose TEXT,
  key_points TEXT,
  word_count INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (book_id, chapter_index)
);

CREATE INDEX idx_chapters_book ON chapters(book_id);

CREATE TRIGGER chapters_set_updated_at
  BEFORE UPDATE ON chapters
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE chapters ENABLE ROW LEVEL SECURITY;

CREATE POLICY chapters_select_own ON chapters
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY chapters_insert_own ON chapters
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY chapters_update_own ON chapters
  FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY chapters_delete_own ON chapters
  FOR DELETE USING (auth.uid() = user_id);
