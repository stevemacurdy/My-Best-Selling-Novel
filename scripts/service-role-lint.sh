#!/usr/bin/env bash
# Mechanical guard for AT-013: createServiceRoleClient may only appear in
# - lib/supabase/server.ts (the declaration)
# - app/api/stripe/webhook/route.ts (Decision #3 — webhook owns subscription writes)
# - app/api/cron/*/route.ts (cross-user aggregations)
#
# Any other reference is a security regression — the service-role key bypasses RLS.

set -euo pipefail

# `|| true` keeps grep's "no match" exit-1 from killing the script.
HITS="$(grep -rn "createServiceRoleClient" app/ lib/ 2>/dev/null \
  | grep -v "^lib/supabase/server.ts:" \
  | grep -vE "^app/api/stripe/webhook/route\.ts:|^app/api/cron/[^/]+/route\.ts:" \
  || true)"

if [ -n "$HITS" ]; then
  echo "ERROR: createServiceRoleClient used outside allowed scope:"
  echo "$HITS"
  exit 1
fi

echo "service-role lint: ok"
