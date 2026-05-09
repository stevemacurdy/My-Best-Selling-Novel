-- APPLY: CREATE
-- Migration: 010_stripe_webhook_events.sql
-- Author: Steve
-- Date: 2026-05-04
-- Purpose: Idempotency table for Stripe webhook events (PATCH-002, GAP-022)
-- Rollback: DROP TABLE stripe_webhook_events CASCADE
-- Locks: None (new table)
-- Online/Offline: Online
-- Destructive: No

CREATE TABLE stripe_webhook_events (
  event_id TEXT PRIMARY KEY,
  event_type TEXT NOT NULL,
  api_version TEXT,
  livemode BOOLEAN NOT NULL,
  received_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  processed_at TIMESTAMPTZ,
  processing_status TEXT NOT NULL DEFAULT 'received'
    CHECK (processing_status IN ('received', 'processing', 'processed', 'failed')),
  failure_reason TEXT,
  retry_count INT NOT NULL DEFAULT 0,
  payload JSONB NOT NULL
);

CREATE INDEX idx_stripe_webhook_events_received ON stripe_webhook_events(received_at DESC);
CREATE INDEX idx_stripe_webhook_events_status ON stripe_webhook_events(processing_status)
  WHERE processing_status IN ('received', 'failed');
CREATE INDEX idx_stripe_webhook_events_type ON stripe_webhook_events(event_type, received_at DESC);

ALTER TABLE stripe_webhook_events ENABLE ROW LEVEL SECURITY;

-- Admins read for debugging; no user reads
CREATE POLICY "Admins read webhook events" ON stripe_webhook_events
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'super_admin'))
  );

-- Add stripe_session_id column to subscriptions for lifetime payment dedup
ALTER TABLE subscriptions
  ADD COLUMN IF NOT EXISTS stripe_session_id TEXT;

-- Unique constraint allows NULL (subscriptions don't have session_ids)
-- but enforces uniqueness on lifetime rows
ALTER TABLE subscriptions
  ADD CONSTRAINT subscriptions_session_unique UNIQUE (stripe_session_id);

CREATE INDEX idx_subscriptions_session ON subscriptions(stripe_session_id)
  WHERE stripe_session_id IS NOT NULL;
