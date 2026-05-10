-- APPLY: CREATE
-- Migration: 013_role_super_admin.sql
-- Author: Steve
-- Date: 2026-05-04
-- Purpose: Add super_admin role for role-grant authority (R-TASK-113, GAP-014)
-- Rollback: ALTER TABLE profiles DROP CONSTRAINT profiles_role_check; ALTER TABLE profiles ADD CONSTRAINT profiles_role_check CHECK (role IN ('user', 'admin'));
-- Locks: AccessExclusiveLock briefly on profiles (CHECK constraint swap)
-- Online/Offline: Online (constraint validation runs over existing rows)
-- Destructive: No

-- Drop existing constraint
ALTER TABLE profiles
  DROP CONSTRAINT IF EXISTS profiles_role_check;

-- Add new constraint with super_admin
ALTER TABLE profiles
  ADD CONSTRAINT profiles_role_check
  CHECK (role IN ('user', 'admin', 'super_admin'));

-- Bootstrap: promote initial super_admin (Steve)
-- This is idempotent — only updates if not already super_admin
UPDATE profiles
  SET role = 'super_admin'
  WHERE email = 'steve@woulfgroup.com' AND role != 'super_admin';

-- Add MFA recovery codes table (paired with R-TASK-103)
CREATE TABLE mfa_recovery_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  code_hash TEXT NOT NULL,
  consumed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_mfa_recovery_user ON mfa_recovery_codes(user_id) WHERE consumed_at IS NULL;

ALTER TABLE mfa_recovery_codes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users see own recovery codes" ON mfa_recovery_codes
  FOR SELECT USING (auth.uid() = user_id);
-- Inserts/updates via service role only
