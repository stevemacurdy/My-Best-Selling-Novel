-- TASK-015 (part 1/2): subscriptions table
-- Per spec: id TEXT PK (Stripe sub ID), user_id, stripe_customer_id, stripe_price_id,
-- tier CHECK, status CHECK, current_period_start/end, cancel_at_period_end, canceled_at.
--
-- Cross-binds:
--   - PK is TEXT (Stripe subscription ID like sub_1ABC...) per spec; matches
--     Decision #3 (webhook is sole source of truth — Stripe ID is the natural key)
--   - tier values match profiles.subscription_tier (explorer/author/publisher)
--   - status values use the Stripe subscription status set
--   - R-TASK migration 010_stripe_webhook_events.sql later adds stripe_session_id
--     column + UNIQUE constraint (R-TASK 011 is a no-op duplicate of that ADD;
--     IF NOT EXISTS makes both safe to apply in order)
--   - RLS: only users read their own subscriptions; writes go through the
--     service-role client in the Stripe webhook handler (Decision #3)

CREATE TABLE subscriptions (
  id TEXT PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  stripe_customer_id TEXT NOT NULL,
  stripe_price_id TEXT NOT NULL,
  tier TEXT NOT NULL CHECK (tier IN ('explorer', 'author', 'publisher')),
  status TEXT NOT NULL CHECK (status IN (
    'active', 'past_due', 'canceled', 'incomplete',
    'incomplete_expired', 'trialing', 'unpaid'
  )),
  current_period_start TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,
  cancel_at_period_end BOOLEAN NOT NULL DEFAULT false,
  canceled_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_subscriptions_user ON subscriptions(user_id);
CREATE INDEX idx_subscriptions_stripe_customer ON subscriptions(stripe_customer_id);

CREATE TRIGGER subscriptions_set_updated_at
  BEFORE UPDATE ON subscriptions
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

-- Read-only for users; webhook handler uses service-role client to write
CREATE POLICY subscriptions_select_own ON subscriptions
  FOR SELECT USING (auth.uid() = user_id);
