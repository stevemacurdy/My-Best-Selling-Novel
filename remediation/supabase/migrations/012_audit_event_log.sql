-- APPLY: CREATE
-- Migration: 012_audit_event_log.sql
-- Author: Steve
-- Date: 2026-05-04
-- Purpose: System-wide audit event log (R-TASK-111, GAP-010)
-- Rollback: DROP TABLE audit_event_log CASCADE
-- Locks: None
-- Online/Offline: Online
-- Destructive: No
-- Retention: 7 years (rows survive actor deletion via actor_id_snapshot)

CREATE TABLE audit_event_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  occurred_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Actor (who did the thing)
  actor_id UUID,
  actor_id_snapshot TEXT NOT NULL,        -- string copy that survives actor profile deletion
  actor_email_snapshot TEXT,
  actor_role_snapshot TEXT,

  -- Action vocabulary (controlled by regex CHECK)
  action TEXT NOT NULL CHECK (action ~ '^[a-z]+(\.[a-z_]+)+$'),

  -- Target
  target_type TEXT,
  target_id TEXT,

  -- Context
  ip_address INET,
  user_agent TEXT,
  request_id TEXT,
  metadata JSONB DEFAULT '{}'::jsonb
);

CREATE INDEX idx_audit_actor ON audit_event_log(actor_id, occurred_at DESC) WHERE actor_id IS NOT NULL;
CREATE INDEX idx_audit_action ON audit_event_log(action, occurred_at DESC);
CREATE INDEX idx_audit_target ON audit_event_log(target_type, target_id) WHERE target_id IS NOT NULL;
CREATE INDEX idx_audit_occurred ON audit_event_log(occurred_at DESC);
CREATE INDEX idx_audit_request ON audit_event_log(request_id) WHERE request_id IS NOT NULL;

ALTER TABLE audit_event_log ENABLE ROW LEVEL SECURITY;

-- Users see events about themselves
CREATE POLICY "Users see own audit events" ON audit_event_log
  FOR SELECT USING (
    target_type = 'profile' AND target_id = auth.uid()::text
  );

-- Admins read all
CREATE POLICY "Admins read all audit events" ON audit_event_log
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'super_admin'))
  );

-- INSERT only via service role from API routes; no user-side insert policy = blocked
