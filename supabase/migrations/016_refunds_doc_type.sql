-- APPLY: CREATE
-- Migration: 016_refunds_doc_type.sql
-- Author: Steve
-- Date: 2026-05-10
-- Purpose: Widen document_versions.document CHECK to include 'refunds';
--          seed the v2026-05-04 refunds version. Closes a v4-packet gap
--          discovered during TASK-008 application: the canonical
--          014_document_acceptances.sql omitted 'refunds' from the
--          allowed document types, but TASK-008's three-checkbox
--          acceptance flow (per Q-2.8 / Q-8.4(a)) requires Refunds
--          alongside ToS+AUP and Privacy.
-- Locks: AccessExclusiveLock briefly on document_versions for the
--        CHECK constraint swap.
-- Online/Offline: Online.
-- Destructive: No.
-- Idempotent: Yes — DROP CONSTRAINT IF EXISTS + ADD CONSTRAINT (re-runs
--             reproduce the wider state); seed uses ON CONFLICT DO NOTHING.
-- Rollback: ALTER TABLE document_versions DROP CONSTRAINT
--           document_versions_document_check; ALTER TABLE ... ADD
--           CONSTRAINT ... CHECK (document IN ('tos','privacy','aup','cookies'));
--           DELETE FROM document_versions WHERE document='refunds';
--           (Rollback only safe if no document_acceptances rows reference
--           the refunds version — check first.)
--
-- effective_at uses NOW() to match canonical 014's seed pattern. The
-- existing 4 rows from 014 show effective_at = the migration's apply
-- time (2026-05-10 17:00:56) even though their version field reads
-- '2026-05-04', so this row carries the same drift. Tracked as a
-- separate v4 packet correction in CONTENT_TODO.md.

ALTER TABLE document_versions
  DROP CONSTRAINT IF EXISTS document_versions_document_check;

ALTER TABLE document_versions
  ADD CONSTRAINT document_versions_document_check
  CHECK (document IN ('tos', 'privacy', 'aup', 'cookies', 'refunds'));

INSERT INTO document_versions (document, version, effective_at, content_url) VALUES
  ('refunds', '2026-05-04', NOW(), '/refunds/v/2026-05-04')
ON CONFLICT (document, version) DO NOTHING;
