-- APPLY: CREATE
-- Migration: 009_deletion_requests.sql
-- Author: Steve
-- Date: 2026-05-04
-- Purpose: Account deletion lifecycle tracking (R-TASK-102)
-- Rollback: DROP TABLE deletion_requests CASCADE
-- Locks: None (new table)
-- Online/Offline: Online
-- Destructive: No

CREATE TABLE deletion_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  requested_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  confirm_token TEXT NOT NULL UNIQUE,
  confirm_token_expires_at TIMESTAMPTZ NOT NULL,
  confirmed_at TIMESTAMPTZ,
  scheduled_deletion_at TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'pending_confirm'
    CHECK (status IN ('pending_confirm', 'confirmed', 'cancelled', 'executing', 'completed', 'failed')),
  cancellation_reason TEXT,
  failure_reason TEXT,
  refund_eligible BOOLEAN NOT NULL DEFAULT FALSE,
  executed_at TIMESTAMPTZ,
  metadata JSONB DEFAULT '{}'::jsonb
);

CREATE INDEX idx_deletion_requests_user ON deletion_requests(user_id);
CREATE INDEX idx_deletion_requests_scheduled ON deletion_requests(scheduled_deletion_at)
  WHERE status = 'confirmed';
CREATE INDEX idx_deletion_requests_token ON deletion_requests(confirm_token)
  WHERE status = 'pending_confirm';

ALTER TABLE deletion_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users see own deletion requests" ON deletion_requests
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users create own deletion requests" ON deletion_requests
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users cancel own deletion requests" ON deletion_requests
  FOR UPDATE USING (
    auth.uid() = user_id
    AND status IN ('pending_confirm', 'confirmed')
  );
