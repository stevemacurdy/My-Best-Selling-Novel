-- TASK-011: profiles table
-- Per spec: id PK→auth.users, email UNIQUE, full_name, role CHECK('user','admin'),
-- subscription_tier CHECK('explorer','author','publisher'), subscription_status,
-- subscription_period_end, ai_calls_this_month, ai_calls_reset_at, stripe_customer_id UNIQUE,
-- onboarded_at. Trigger handle_new_user. RLS read/update own. Indexes on stripe_customer_id, email.
--
-- Cross-binds:
--   - role CHECK is widened to include 'super_admin' by remediation R-TASK migration 013
--     (013_role_super_admin_and_mfa_recovery.sql). Until that runs, lib/api-auth.ts's
--     UserRole = 'user'|'admin'|'super_admin' tolerates the narrower DB value.
--   - subscription_status values match lib/api-auth.ts AuthUser shape ('free'|'active'|
--     'past_due'|'cancelled').

CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL UNIQUE,
  full_name TEXT,
  role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'admin')),
  subscription_tier TEXT NOT NULL DEFAULT 'explorer'
    CHECK (subscription_tier IN ('explorer', 'author', 'publisher')),
  subscription_status TEXT NOT NULL DEFAULT 'free'
    CHECK (subscription_status IN ('free', 'active', 'past_due', 'cancelled')),
  subscription_period_end TIMESTAMPTZ,
  ai_calls_this_month INT NOT NULL DEFAULT 0,
  ai_calls_reset_at TIMESTAMPTZ,
  stripe_customer_id TEXT UNIQUE,
  onboarded_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_profiles_stripe_customer_id ON profiles(stripe_customer_id)
  WHERE stripe_customer_id IS NOT NULL;
CREATE INDEX idx_profiles_email ON profiles(email);

-- Trigger: auto-create profile row on auth.users insert.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth, pg_temp
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name')
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- updated_at maintenance trigger (reused by other migrations).
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

CREATE TRIGGER profiles_set_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- RLS: users read/update own profile.
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY profiles_select_own ON profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY profiles_update_own ON profiles
  FOR UPDATE USING (auth.uid() = id) WITH CHECK (auth.uid() = id);
