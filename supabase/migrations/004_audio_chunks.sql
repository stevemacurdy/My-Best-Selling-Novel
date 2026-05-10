-- TASK-014: audio_chunks table + book-audio storage bucket + storage RLS
-- Per spec: id PK, book_id FK→books ON DELETE CASCADE, user_id FK→profiles,
-- chapter_index INT, storage_path TEXT NOT NULL, mime_type, duration_seconds,
-- file_size_bytes BIGINT, UNIQUE(book_id, chapter_index).
-- Storage: 'book-audio' bucket (private). RLS: scope by storage.foldername(name)[1] = auth.uid()::text.
--
-- Cross-binds:
--   - storage RLS uses auth.uid() folder convention; client must upload at
--     {auth_uid}/{book_id}/{chapter_index}.{ext}
--   - book_id ON DELETE CASCADE removes audio_chunks rows but does NOT delete
--     storage objects; cleanup is handled by the application layer (or a future
--     storage trigger / soft-delete job)

CREATE TABLE audio_chunks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  book_id UUID NOT NULL REFERENCES books(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  chapter_index INT NOT NULL,
  storage_path TEXT NOT NULL,
  mime_type TEXT,
  duration_seconds INT,
  file_size_bytes BIGINT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (book_id, chapter_index)
);

CREATE INDEX idx_audio_chunks_book ON audio_chunks(book_id);

ALTER TABLE audio_chunks ENABLE ROW LEVEL SECURITY;

CREATE POLICY audio_chunks_select_own ON audio_chunks
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY audio_chunks_insert_own ON audio_chunks
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY audio_chunks_update_own ON audio_chunks
  FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY audio_chunks_delete_own ON audio_chunks
  FOR DELETE USING (auth.uid() = user_id);

-- Storage bucket: private, owner-scoped.
INSERT INTO storage.buckets (id, name, public)
VALUES ('book-audio', 'book-audio', false)
ON CONFLICT (id) DO NOTHING;

-- Storage RLS: convention is {auth_uid}/<rest>. storage.foldername(name)[1]
-- returns the first folder segment of the object path.
CREATE POLICY book_audio_select_own ON storage.objects
  FOR SELECT TO authenticated
  USING (
    bucket_id = 'book-audio'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY book_audio_insert_own ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'book-audio'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY book_audio_update_own ON storage.objects
  FOR UPDATE TO authenticated
  USING (
    bucket_id = 'book-audio'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY book_audio_delete_own ON storage.objects
  FOR DELETE TO authenticated
  USING (
    bucket_id = 'book-audio'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );
