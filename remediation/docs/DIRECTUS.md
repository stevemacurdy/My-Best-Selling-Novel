# DIRECTUS.md — Operator runbook for the operational data tool

**Purpose:** Step-by-step setup + daily-use workflows for Directus Cloud, the operator-only operational data view that complements the curated `/admin` dashboard.

**Last updated:** 2026-05-09 (created in PATCH-3 round 2 per R-TASK-176).

**Cross-reference:** R-TASK-176 task spec; companion to (not replacement for) the custom `/admin` dashboard built in TASK-049 through TASK-053.

---

## Why Directus exists alongside `/admin`

Two distinct uses:

- **`/admin`** = curated daily-glance dashboard. Charts that matter (MRR, signups by tier, AI usage top-20, genre distribution). Polished UX. Sanctioned mutations route through here so they hit `audit_event_log` (TASK-051 super_admin PATCH endpoint).
- **Directus** = power-user operational tool. Browse any table, run ad-hoc queries, edit rows directly, export CSVs. Generic CRUD UI on the existing Postgres schema. Operator-only — never exposed publicly.

Use `/admin` for the daily "how's the business doing?" glance. Use Directus for "let me look up this specific user's row, investigate this webhook misfire, run a one-off query."

---

## Section 1 — Provisioning Directus Cloud

1. Visit [directus.cloud](https://directus.cloud) and sign up with the operator's email (steve@…)
2. Create new project: name `mybsn-ops`
3. Region: pick closest to Supabase region (likely us-east or us-west; verify against Supabase project region)
4. Plan: **Free tier** (25 users, 50K items/month, 1 project as of 2026-05). Verify limits at provisioning time — re-evaluate paid tier ($15/mo Team) if exceeded.
5. Wait for provisioning (~2 minutes). Note the Cloud project URL (typically `https://mybsn-ops.directus.app`).

---

## Section 2 — Connecting to Supabase Postgres

Directus Cloud projects come with a default included Postgres instance, but we want to connect to **Supabase** (where production data lives) instead.

### Option A — Read-only role (recommended for v1)

Tighter security; prevents accidental mutations from Directus UI.

1. In Supabase SQL Editor, run:
   ```sql
   CREATE ROLE directus_readonly LOGIN PASSWORD '[generate-strong-random-password]';
   GRANT CONNECT ON DATABASE postgres TO directus_readonly;
   GRANT USAGE ON SCHEMA public TO directus_readonly;
   GRANT SELECT ON ALL TABLES IN SCHEMA public TO directus_readonly;
   ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT ON TABLES TO directus_readonly;
   ```
2. Save the password securely (e.g., 1Password or operator's password manager). Rotate per R-TASK-115 key rotation procedure.

### Option B — Full role (if Directus mutations are workflow)

Operator can flip to read-write later if power-edit becomes a workflow. Caveat: any mutation in Directus does NOT write to `audit_event_log` (R-TASK-176 documents this limitation). For sanctioned mutations, use `/admin`'s super_admin PATCH endpoint instead.

### Connection setup in Directus

1. Get Supabase connection string: Supabase Dashboard > Project Settings > Database > Connection string > **Session pooler** URI (handles long-lived connections better than transaction pooler for an admin tool)
2. Format: `postgresql://postgres.[ref]:[directus_readonly_password]@aws-0-[region].pooler.supabase.com:5432/postgres`
3. Directus Cloud > Settings > Database Connection > Switch to External Postgres
4. Paste connection string; SSL mode: `require`; Test connection
5. Save

---

## Section 3 — Collection configuration

Directus auto-discovers tables. Configure which to expose.

### Expose for daily use

| Collection | Default fields shown | Sort default |
|---|---|---|
| `profiles` | email, full_name, role, subscription_tier, subscription_status, created_at | created_at DESC |
| `books` | title, genre, status, word_count_total, chapter_count, user_id, updated_at | updated_at DESC |
| `chapters` | book_id, chapter_index, title, word_count, updated_at | book_id ASC, chapter_index ASC |
| `subscriptions` | user_id, tier, status, stripe_price_id, current_period_end, cancel_at_period_end | current_period_end DESC |
| `ai_usage_logs` | user_id, step, function_name, tokens_in, tokens_out, latency_ms, created_at | created_at DESC |
| `audit_event_log` | event_type, actor_user_id, target_user_id, created_at | created_at DESC |
| `document_acceptances` | user_id, document_type, accepted_at, ip | accepted_at DESC |

### Hide from Directus UI

| Collection | Why hidden |
|---|---|
| `audio_chunks` | Large blob references; not useful in admin UI |
| `stripe_webhook_events` | PATCH-002 idempotency table; rarely needed |
| `rate_limit_*` (R-TASK-104) | Operational; not for admin browsing |
| Future v1.1 user-private tables | Add as they ship |

### Per-collection icon

Directus lets each collection get an icon for visual scanning. Suggested:
- profiles → user
- books → book
- chapters → file_text
- subscriptions → credit_card
- ai_usage_logs → activity
- audit_event_log → shield
- document_acceptances → check_square

---

## Section 4 — Role and permissions

Directus role hierarchy:

- **Administrator** — operator (Steve) only at v1
- **Editor** — future team member; created when first hire happens
- **Public** — disabled (no public access; this tool is operator-only)

When operator hires customer support / ops, create Editor role with limited permissions:

| Collection | Read | Edit | Delete |
|---|---|---|---|
| `profiles` | ✓ all | ✓ name only (NOT email/auth/role) | ✗ |
| `books`, `chapters` | ✓ | ✗ | ✗ |
| `subscriptions` | ✓ | ✗ | ✗ |
| `ai_usage_logs` | ✓ | ✗ | ✗ |
| `audit_event_log` | ✓ | ✗ | ✗ |

Document each new role's permissions here when added.

---

## Section 5 — Daily-use workflows

### "Look up a customer who emailed support"

1. Open Directus
2. Collections → profiles
3. Filter by email (e.g., `email contains user@example.com`)
4. Click row → cross-reference linked subscriptions, books, ai_usage_logs

### "Investigate a webhook misfire"

1. Open `subscriptions` → filter by `user_id` of affected user
2. Verify status, current_period_end, stripe_price_id match Stripe Dashboard
3. **Do NOT edit in Directus.** Replay the Stripe event in Stripe Dashboard so PATCH-002 idempotency + audit-trail flow handles it cleanly.

### "Pull a list of users who signed up last week"

1. `profiles` → filter `created_at > [date]`
2. Export to CSV

### "Check whose AI usage is highest this month"

1. Use the curated `/admin` dashboard's top-20 widget (TASK-049/052) — that's the curated view
2. For deeper analysis: Directus → `ai_usage_logs` grouped by user_id; export CSV; analyze in spreadsheet

### "Diagnose a stuck signup or auth issue"

1. Open Supabase Dashboard > Auth > Users (Directus does not surface auth.users; that's Supabase's domain)
2. Cross-reference Directus `profiles` row to confirm trigger fired correctly

---

## Section 6 — What NOT to do in Directus

To preserve audit-trail integrity (per WoulfAI rule 10):

- ❌ **Don't grant role mutations.** Use `/admin` UI's super_admin PATCH endpoint (TASK-051) — that writes to `audit_event_log`.
- ❌ **Don't soft-delete users.** Use `/admin` — same reason.
- ❌ **Don't manually flip subscription tier.** Replay the Stripe webhook event instead.
- ❌ **Don't edit `audit_event_log` rows.** Ever. If a correction is needed, write a new audit row referencing the original.
- ❌ **Don't expose Directus URL publicly.** Add to `robots.txt` deny list.

If you find yourself wanting to do any of the above, stop and use the proper path.

---

## Section 7 — Cost monitoring

Free tier limits to watch:

| Limit | Threshold | Action |
|---|---|---|
| 25 users | When operator hires 5+ ops people | Move to Team plan ($15/mo per user above limit) |
| 50K items/month | If reads exceed (unlikely at v1 scale; ~5K queries/month is realistic for a single-operator tool) | Move to Team plan ($15/mo) |
| 1 project | If operator wants separate staging/prod Directus | Add second project ($15/mo each on Team plan) |

Operator reviews monthly; flag in `docs/CONTENT_REVIEW_SCHEDULE.md` 6-month cycle.

---

## Section 8 — Backup + disaster recovery

Directus reads from Supabase Postgres — no separate backup needed. Supabase handles point-in-time recovery on its own backup schedule (free tier: 7 days; paid: 14-30 days).

If Directus Cloud project gets deleted accidentally:
1. Re-provision per Section 1
2. Re-connect to Supabase per Section 2
3. Re-configure collections per Section 3
4. ~1 hour recovery time

No data loss because data lives in Supabase, not in Directus.
