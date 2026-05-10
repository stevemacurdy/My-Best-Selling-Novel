-- TASK-015 (part 2/2): ai_usage_logs + increment_ai_usage RPC
-- Per spec: id UUID PK, user_id, book_id, step_name, function_name,
-- input/output/total_tokens, model, latency_ms, success, error_message.
-- RPC increment_ai_usage(p_user_id UUID) as SECURITY DEFINER.
--
-- Cross-binds:
--   - book_id is nullable; some AI calls aren't book-scoped (e.g., S0 genre scan)
--   - increment_ai_usage bumps profiles.ai_calls_this_month atomically.
--     Reset of the monthly counter is handled elsewhere (cron / webhook),
--     not by this RPC.
--   - RLS: users SELECT their own logs; INSERT happens via the API route
--     using the user's auth context (no service-role required for the log
--     itself — the AI call is what consumes the quota)

CREATE TABLE ai_usage_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  book_id UUID REFERENCES books(id) ON DELETE SET NULL,
  step_name TEXT,
  function_name TEXT,
  input_tokens INT,
  output_tokens INT,
  total_tokens INT,
  model TEXT,
  latency_ms INT,
  success BOOLEAN NOT NULL DEFAULT true,
  error_message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_ai_usage_user_created ON ai_usage_logs(user_id, created_at DESC);
CREATE INDEX idx_ai_usage_book ON ai_usage_logs(book_id) WHERE book_id IS NOT NULL;

ALTER TABLE ai_usage_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY ai_usage_logs_select_own ON ai_usage_logs
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY ai_usage_logs_insert_own ON ai_usage_logs
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- RPC: atomically bump the monthly counter for a user.
-- SECURITY DEFINER + locked search_path; callers may only pass their own UUID
-- (enforced by the WHERE clause matching p_user_id).
CREATE OR REPLACE FUNCTION public.increment_ai_usage(p_user_id UUID)
RETURNS INT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  new_count INT;
BEGIN
  -- Belt-and-suspenders: SECURITY DEFINER means the function would otherwise
  -- happily increment any user's counter; require the caller's auth.uid() to
  -- match the target.
  IF p_user_id IS DISTINCT FROM auth.uid() THEN
    RAISE EXCEPTION 'increment_ai_usage: caller % cannot bump counter for %', auth.uid(), p_user_id
      USING ERRCODE = 'insufficient_privilege';
  END IF;

  UPDATE profiles
  SET ai_calls_this_month = ai_calls_this_month + 1
  WHERE id = p_user_id
  RETURNING ai_calls_this_month INTO new_count;

  IF new_count IS NULL THEN
    RAISE EXCEPTION 'profile not found for user_id %', p_user_id;
  END IF;

  RETURN new_count;
END;
$$;

-- Lock down: only authenticated users can call it (RLS-equivalent at the function level).
REVOKE ALL ON FUNCTION public.increment_ai_usage(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.increment_ai_usage(UUID) TO authenticated;
