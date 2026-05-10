-- APPLY: CREATE
-- Migration: 011_subscriptions_unique.sql
-- Author: Steve
-- Date: 2026-05-05 (purpose revised 2026-05-06)
-- Purpose: Add stripe_session_id column + UNIQUE constraint to subscriptions table.
--          Originally added (2026-05-05) as a second-line defense against duplicate
--          lifetime grants. Lifetime tier eliminated 2026-05-06 (Decision #29 revision);
--          constraint preserved as defense-in-depth for any future one-time-payment
--          SKU. Allows NULL, so no-op for current recurring-only SKUs.
-- Pairs with: PATCH-002 (Stripe webhook idempotency) and migration 010
--             (010_stripe_webhook_events.sql)
-- Locks: Brief AccessExclusiveLock on subscriptions while constraint is added.
--        Negligible at v1 scale; if subscriptions has grown large in production,
--        run this with `SET lock_timeout = '5s'` and retry.
-- Online/Offline: Online — additive; ADD COLUMN IF NOT EXISTS is idempotent.
-- Destructive: No
-- Rollback: 011_subscriptions_unique_rollback.sql (drops constraint + column)
--
-- LOCAL DIVERGENCE FROM CANONICAL (2026-05-09): the canonical
-- remediation/supabase/migrations/011_subscriptions_unique.sql adds the same
-- subscriptions_session_unique UNIQUE constraint that migration 010 already
-- added. Postgres has no IF NOT EXISTS clause for ADD CONSTRAINT UNIQUE, so
-- canonical 011 errors on application against a schema where 010 already ran.
-- This local copy wraps the ADD CONSTRAINT in a DO block that checks
-- pg_constraint first, making 011 a true no-op when 010 is already applied.
-- The COLUMN ADD already uses IF NOT EXISTS and needs no change.

-- subscriptions.id is already PRIMARY KEY (Stripe sub ID), so dedup is implicit
-- for recurring subscription events. The stripe_session_id column was originally
-- added for the now-eliminated lifetime tier. With lifetime gone, the column and
-- constraint are inactive (NULL on every row) but preserved for future SKUs.

ALTER TABLE subscriptions
  ADD COLUMN IF NOT EXISTS stripe_session_id TEXT;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'subscriptions_session_unique'
  ) THEN
    ALTER TABLE subscriptions
      ADD CONSTRAINT subscriptions_session_unique UNIQUE (stripe_session_id);
  END IF;
END;
$$;

-- NULL is allowed (recurring-subscription rows do not populate this column).
-- UNIQUE on a nullable column applies only to non-NULL values in PostgreSQL,
-- so this does not block multiple recurring subscriptions sharing NULL.

COMMENT ON COLUMN subscriptions.stripe_session_id IS
  'Stripe checkout.session.id for one-time payments. NULL for recurring subscriptions and currently NULL on all rows (lifetime tier eliminated 2026-05-06). Preserved as defense-in-depth for future one-time-payment SKUs.';
