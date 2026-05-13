#!/usr/bin/env bash
# Mechanical guard for AT-013: createServiceRoleClient may only appear in
# - lib/supabase/server.ts (the declaration; skipped by this lint)
# - app/api/stripe/webhook/route.ts (Decision #3 — webhook owns subscription writes; path-allowed)
# - app/api/cron/*/route.ts (cross-user aggregations; path-allowed)
# - any other file where the call is annotated with a marker comment on the
#   same line or the immediately preceding line:
#     // service-role-allowlisted: <one-sentence reason>
#
# The marker convention exists so per-call deliberate exceptions (e.g., the
# post-signup acceptance recording in app/(auth)/signup/actions.ts) are
# visible at the call site and grep-able in code review — without blanket-
# allowing the whole file. Adding a file to the path allowlist is reserved
# for files whose entire purpose is service-role-bearing (webhook + cron).
#
# Any reference not covered by one of the above is a security regression —
# the service-role key bypasses RLS.

set -euo pipefail

# Match call sites (`createServiceRoleClient(`), not bare references like imports.
ALL="$(grep -rn "createServiceRoleClient(" app/ lib/ 2>/dev/null | grep -v "^lib/supabase/server.ts:" || true)"

BAD=""
while IFS= read -r hit; do
  [ -z "$hit" ] && continue

  file="$(echo "$hit" | cut -d: -f1)"
  lineno="$(echo "$hit" | cut -d: -f2)"
  rest="$(echo "$hit" | cut -d: -f3-)"

  # Path allowlist: whole-file allowed for webhook + cron route handlers.
  case "$file" in
    app/api/stripe/webhook/route.ts) continue ;;
    app/api/cron/*/route.ts)         continue ;;
  esac

  # Marker on same line.
  if printf '%s' "$rest" | grep -q "service-role-allowlisted:"; then continue; fi

  # Marker on previous line.
  if [ "$lineno" -gt 1 ]; then
    prev_line="$(sed -n "$((lineno - 1))p" "$file")"
    if printf '%s' "$prev_line" | grep -q "service-role-allowlisted:"; then continue; fi
  fi

  BAD="${BAD}${hit}"$'\n'
done <<< "$ALL"

if [ -n "$BAD" ]; then
  echo "ERROR: createServiceRoleClient used outside allowed scope."
  echo "Add a marker comment (// service-role-allowlisted: <reason>) on the call's"
  echo "line or the line immediately above, or move the call to webhook/cron."
  echo
  echo "Violations:"
  printf '%s' "$BAD"
  exit 1
fi

echo "service-role lint: ok"
