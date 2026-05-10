-- TASK-012: books table
-- Per spec: id PK, user_id FK→profiles, created_at, updated_at (auto-trigger),
-- title, subtitle, author_name, genre, book_type, word_count, health_score,
-- last_step, book_data JSONB DEFAULT '{}', cover_url, cover_storage_path.
-- RLS: users manage own books. Index on (user_id, updated_at DESC).
--
-- Cross-binds:
--   - R-TASK migration 015_soft_delete_columns.sql later adds deleted_at
--   - book_data JSONB stays after ADR-002 chapter split because chapters
--     still hang miscellaneous metadata off the parent book

CREATE TABLE books (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title TEXT,
  subtitle TEXT,
  author_name TEXT,
  genre TEXT,
  book_type TEXT,
  word_count INT NOT NULL DEFAULT 0,
  health_score INT,
  last_step INT NOT NULL DEFAULT 0,
  book_data JSONB NOT NULL DEFAULT '{}'::jsonb,
  cover_url TEXT,
  cover_storage_path TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_books_user_updated ON books(user_id, updated_at DESC);

CREATE TRIGGER books_set_updated_at
  BEFORE UPDATE ON books
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE books ENABLE ROW LEVEL SECURITY;

CREATE POLICY books_select_own ON books
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY books_insert_own ON books
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY books_update_own ON books
  FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY books_delete_own ON books
  FOR DELETE USING (auth.uid() = user_id);
