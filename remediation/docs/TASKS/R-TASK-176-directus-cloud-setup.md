<!-- APPLY: CREATE -->
# R-TASK-176: Directus Cloud Setup + Supabase Connection (`docs/DIRECTUS.md`)

## Status: NOT STARTED
## Priority: HIGH
## Phase: 11
## Estimated Sessions: 2 (provisioning + collection config + role permissions + documentation)
## Dependencies: TASK-011-015 (migrations applied to production Supabase), R-TASK-115 (key rotation procedure), TASK-049-053 (custom admin remains the curated dashboard)
## Cluster: PATCH-3 round 2 v1 content cluster

## Inference Summary

| Addition | Source |
|---|---|
| Directus Cloud free tier | Operator answer 2026-05-08 |
| Connects to Supabase Postgres via DATABASE_URL | Operator answer; Supabase exposes direct Postgres connection per project |
| Read-only role recommended for safety; full role optional for power-edit | WoulfAI rule 10 + Decision #16 (RLS-by-default discipline) |
| Complementary to /admin custom dashboard, NOT replacement | Operator answer 2026-05-08 ("Two distinct uses: /admin = curated; Directus = deep-dive") |
| Mutations (grant_role, force_mfa_reset, soft_delete) stay in /admin custom for audit-trail integrity | Operator answer 2026-05-08 |
| Audit-log discipline: ad-hoc Directus edits not logged in app's audit_event_log | Documented limitation; mitigated by Directus's own activity log |
| Two new env vars: `DIRECTUS_URL`, `DIRECTUS_TOKEN` | Standard Directus integration; NOT exposed to client |

Operator confirmed Q-B (Sanity for marketing) + Directus split on 2026-05-08.

## Pre-flight: re-read current state

- Confirm production Supabase project is provisioned (TASK-068 deploy ships first OR before this task in launch sequence).
- Confirm migrations TASK-011 through TASK-015 are applied — Directus reads the existing schema; if migrations haven't run, the collections discovery step finds nothing useful.
- Verify Directus Cloud free tier limits as of TASK-176 ship time (currently: 1 project, 25 users, 50K items/month). If exceeded, evaluate paid tier ($15/mo for Team) or self-host.
- Verify Supabase Postgres connection string format and confirm direct connection is enabled (Supabase > Project Settings > Database > Connection string > URI). Use the **transaction pooler** connection URL for Directus — connection pooling matters for the long-lived Directus connection.

## Files to Create

- `docs/DIRECTUS.md` — operator runbook for Directus setup + daily-use workflows
- `.env.local.example` — additive: `DIRECTUS_URL`, `DIRECTUS_TOKEN` (or noted as Cloud-managed; see below)

This task is **primarily configuration documentation, not code**. The "build" is following the runbook in `docs/DIRECTUS.md` to provision the Cloud project and connect it to Supabase.

## Implementation Requirements

The runbook in `docs/DIRECTUS.md` walks the operator through provisioning, configuration, and daily-use patterns. Six sections:

### Section 1 — Provisioning Directus Cloud

1. Visit [directus.cloud](https://directus.cloud) and sign up with operator's email
2. Create new project: name `mybsn-ops`
3. Region: pick closest to Supabase region (probably us-east or us-west)
4. Plan: **Free tier** (25 users, 50K items/month, 1 project)
5. Wait for provisioning (~2 minutes); note the Cloud project URL (e.g., `https://mybsn-ops.directus.app`)

### Section 2 — Connecting to Supabase Postgres

Directus Cloud projects come with a default included Postgres instance. To use Supabase as the data source instead, connect via custom database configuration:

1. Supabase Dashboard > Project Settings > Database > Connection string > URI (use the **session pooler** for Directus — it handles long-lived connections better than transaction pooler for an admin tool)
2. Format: `postgresql://postgres.[ref]:[password]@aws-0-[region].pooler.supabase.com:5432/postgres`
3. Directus Cloud > Settings > Database Connection > Switch to External Postgres
4. Paste connection string; test connection
5. Set SSL mode: `require`

**Permissions consideration:** the connection user has full access by default. For tighter v1 security, create a dedicated read-only Postgres role in Supabase:

```sql
-- Run in Supabase SQL Editor
CREATE ROLE directus_readonly LOGIN PASSWORD '[strong-random-password]';
GRANT CONNECT ON DATABASE postgres TO directus_readonly;
GRANT USAGE ON SCHEMA public TO directus_readonly;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO directus_readonly;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT ON TABLES TO directus_readonly;
```

Use `directus_readonly` credentials in the Directus connection string. Operator can later upgrade to a write-capable role if Directus-driven mutations become a workflow.

### Section 3 — Collection configuration

Directus auto-discovers tables. Operator confirms which collections to expose:

**Expose for daily use:**
- `profiles` — user records, tier, status, role
- `books` — created books, word counts, status
- `chapters` — chapter content (read-only recommended; mutations via API only)
- `subscriptions` — Stripe subscription state
- `ai_usage_logs` — for cost analysis and rate-limit investigations
- `audit_event_log` — admin actions trail (read-only; never edit)
- `document_acceptances` — ToS/Privacy/Refunds acceptance records (read-only; legal evidence)

**Hide from Directus UI** (still in DB; just not exposed to admin browsing):
- `audio_chunks` — large blob references; not useful in admin UI
- `stripe_webhook_events` — PATCH-002 idempotency table; rarely needed
- `rate_limit_*` tables (R-TASK-104) — operational; not for admin browsing
- Any v1.1 user-private tables added later

For each exposed collection: configure default fields shown in list view, single-row icon, sort defaults. Document operator's chosen defaults in `docs/DIRECTUS.md`.

### Section 4 — Role and permissions

Default role hierarchy in Directus Cloud:

- **Administrator** — operator (Steve) only
- **Editor** — future team members; can view + edit on a configured subset
- **Public** — disabled (Directus is operator-only; no public access)

For v1 with single operator: Steve as Administrator. No Editor role configured yet.

When operator hires customer support / ops: create Editor role with permissions limited to:
- `profiles` — read all; edit name/role only (NOT email/auth fields)
- `books`, `chapters` — read-only
- `subscriptions` — read-only
- `ai_usage_logs` — read-only
- `audit_event_log` — read-only

### Section 5 — Daily-use workflows

The runbook documents common operator tasks:

**"Look up a customer who emailed support":**
1. Open Directus
2. Collections → profiles
3. Filter by email → find user
4. Cross-reference subscriptions, books, ai_usage_logs from the user's row

**"Investigate a webhook misfire":**
1. Open `subscriptions` filtered by `user_id` of the affected user
2. Verify status, current_period_end, stripe_price_id
3. If row state is wrong: do NOT edit in Directus. Instead, replay the Stripe event in Stripe Dashboard so PATCH-002 idempotency + audit-trail flow handles it cleanly

**"Pull a list of users who signed up last week":**
1. Open `profiles`, filter `created_at > [date]`, export to CSV

**"Check whose AI usage is highest this month":**
1. Use the custom `/admin` dashboard's top-20 widget (TASK-049/052) — that's the curated view
2. For deeper analysis: Directus → ai_usage_logs grouped by user_id; export to CSV; analyze in spreadsheet

### Section 6 — What NOT to do in Directus

To preserve audit-trail integrity per WoulfAI rule 10:

- **Don't grant role mutations via Directus.** Use `/admin` UI's super_admin PATCH endpoint (TASK-051 expansion) — that writes to `audit_event_log`.
- **Don't soft-delete users via Directus.** Use `/admin` UI — same reason.
- **Don't manually flip subscription tier.** Replay the Stripe webhook event instead.
- **Don't edit `audit_event_log` rows.** Ever. Make a new row if a correction is needed.
- **Don't expose Directus URL publicly.** Add to `robots.txt` deny list. Even though Directus has its own auth, no need to advertise the surface.

### env vars

`.env.local.example` additions:
```bash
# Directus Cloud (operator-only admin tool — NOT exposed to client)
DIRECTUS_URL=https://mybsn-ops.directus.app
DIRECTUS_TOKEN=  # static token for any backend integration; leave blank if not needed
```

Note: Directus Cloud handles authentication at the directus.app domain — these env vars are only needed if the app itself queries Directus (e.g., a custom dashboard that pulls saved-query results). For pure admin UI use, no env vars are needed in the Next.js app at all. Operator confirms whether app integration is needed at v1 ship.

If app integration is NOT needed, drop these env vars and the count stays at 20 (after R-TASK-170/172 additions). If integration IS needed, count goes to 22. Document in B.5 packet rebuild changelog.

## Tests Required

- AT-176-1: `docs/DIRECTUS.md` exists with all 6 sections per spec
- AT-176-2: Directus Cloud project provisioned at `mybsn-ops` URL
- AT-176-3: Database connection from Directus to Supabase succeeds (test query: `SELECT count(*) FROM profiles`)
- AT-176-4: 7 collections exposed (profiles, books, chapters, subscriptions, ai_usage_logs, audit_event_log, document_acceptances)
- AT-176-5: 4+ collections hidden (audio_chunks, stripe_webhook_events, rate-limit tables)
- AT-176-6: Operator can log in and view a sample row from `profiles`
- AT-176-7: `directus_readonly` Postgres role exists in Supabase if read-only path chosen; granted SELECT on public schema
- AT-176-8: `robots.txt` includes `Disallow: /` directive for the Directus subdomain (or operator skips robots.txt as Directus serves its own)
- AT-176-9: Operator workflow runbook is followed end-to-end in a test session: lookup customer → cross-reference subscription → export CSV

## Session Notes
_(Filled by Claude Code during implementation)_
