-- APPLY: CREATE
-- Migration: 014_document_acceptances.sql
-- Author: Steve
-- Date: 2026-05-04
-- Purpose: TOS/Privacy/AUP/Cookie acceptance recording (R-TASK-120, GAP-039, GAP-040)
-- Rollback: DROP TABLE document_acceptances CASCADE; DROP TABLE document_versions CASCADE
-- Locks: None
-- Online/Offline: Online
-- Destructive: No

CREATE TABLE document_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document TEXT NOT NULL CHECK (document IN ('tos', 'privacy', 'aup', 'cookies')),
  version TEXT NOT NULL,
  effective_at TIMESTAMPTZ NOT NULL,
  superseded_at TIMESTAMPTZ,
  content_url TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(document, version)
);

CREATE INDEX idx_document_versions_current ON document_versions(document)
  WHERE superseded_at IS NULL;

CREATE TABLE document_acceptances (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  document_version_id UUID NOT NULL REFERENCES document_versions(id),
  accepted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ip_address INET,
  user_agent TEXT,
  UNIQUE(user_id, document_version_id)  -- one acceptance per user per version
);

CREATE INDEX idx_doc_accept_user ON document_acceptances(user_id);
CREATE INDEX idx_doc_accept_version ON document_acceptances(document_version_id);

ALTER TABLE document_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_acceptances ENABLE ROW LEVEL SECURITY;

-- All users (including anonymous) read versions
CREATE POLICY "All read versions" ON document_versions
  FOR SELECT USING (true);

-- Users see own acceptances
CREATE POLICY "Users see own acceptances" ON document_acceptances
  FOR SELECT USING (auth.uid() = user_id);

-- Users insert own acceptances
CREATE POLICY "Users insert own acceptances" ON document_acceptances
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Admins read all
CREATE POLICY "Admins read all acceptances" ON document_acceptances
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'super_admin'))
  );

-- Seed initial document versions
INSERT INTO document_versions (document, version, effective_at, content_url) VALUES
  ('tos',     '2026-05-04', NOW(), '/terms/v/2026-05-04'),
  ('privacy', '2026-05-04', NOW(), '/privacy/v/2026-05-04'),
  ('aup',     '2026-05-04', NOW(), '/aup/v/2026-05-04'),
  ('cookies', '2026-05-04', NOW(), '/cookies/v/2026-05-04');
