<!-- APPLY: CREATE -->
# R-TASK-112 through R-TASK-118: Operations & Data Protection Cluster

This file batches 7 related HIGH-priority tasks. Each section is a discrete task with its own status tracking — Claude Code completes them in order, marking each section complete in PROGRESS.md.

## Pre-flight: re-read current state

Before making any change, read the current state of every file listed in "Files to Modify" below. Verify the gap(s) addressed by this task are still present in the current code. Specifically:

- For each file in "Files to Modify": view the file and confirm the condition the audit observed (e.g., "no rate limiting on /api/ai") still applies.
- For each gap in "Resolves Gaps": confirm the gap remains open. The audit was conducted on 2026-05-04; if the codebase changed since, the gap may have been partially or fully addressed.
- If a gap is no longer present, report this finding in PROGRESS.md, mark this task as superseded, and stop. Do not make changes.
- If a gap is partially addressed, scope this task to the remaining work and document in this file's Session Notes what was already addressed and skipped.
- If the gap is still fully present as the audit described, proceed with the rest of this task.

This pre-flight catches the case where the codebase changed between audit and remediation — exactly the failure mode that produces silent overwrites of unrelated work.

**Cluster files only:** Each sub-task in this cluster MUST run its own pre-flight against the files it touches before that sub-task begins. Do not batch the pre-flights.

---

## R-TASK-112: Tenancy Offboarding & Retention Policy

**Status:** NOT STARTED · **Phase:** 11 · **Sessions:** 1 · **Resolves:** GAP-012
**Dependencies:** TASK-024, R-TASK-102, R-TASK-111

### Files to Create
- `docs/legal/RETENTION_POLICY.md` — public-facing retention statement (linked from /privacy)
- `lib/retention.ts` — purge helpers
- `app/api/admin/retention/run/route.ts` — admin-triggered or cron-triggered retention pass

### Files to Modify
- `vercel.json` — add daily cron at 04:00 UTC: `/api/admin/retention/run`
- `app/privacy/page.tsx` (TASK-057) — link to RETENTION_POLICY.md

### Retention rules

| Data class | Active account | Subscription expired | Account deleted |
|---|---|---|---|
| Profile | retain | retain (downgraded to Explorer) | hard delete via R-TASK-102 |
| Books, chapters | retain | retain | hard delete via R-TASK-102 |
| Audio chunks | retain | retain (90-day grace, then archive) | hard delete via R-TASK-102 |
| AI usage logs | retain (24mo rolling) | retain (24mo rolling) | hard delete via R-TASK-102 |
| Stripe subscription rows | retain | retain (status='canceled') | retain anonymized (financial record) |
| Audit event log | retain 7yr | retain 7yr | retain with actor_id=null, actor_id_snapshot intact |
| Webhook events | retain 90 days | retain 90 days | retain (system data) |

### Subscription-expired flow
- When `subscription.deleted` webhook fires: profile downgraded to Explorer (TASK-024 already does)
- After 90 days at Explorer with no re-subscribe: email user "Your books are still here. Want to keep them?" with upgrade CTA
- After 180 days: email "We'll move audio files to cold storage; reactivate to restore"
- After 365 days: audio files moved from book-audio bucket to cold-archive bucket; book metadata + chapters retained
- User can re-subscribe at any time; first action restores audio

### Tests Required
- AT-112-1: Daily cron runs retention pass without error
- AT-112-2: Account-deleted user's audit log entries retain `actor_id_snapshot`
- AT-112-3: Stripe subscription rows persist after delete with status='canceled'

---

## R-TASK-113: Admin Role Grant/Revoke Flow

**Status:** NOT STARTED · **Phase:** 11 · **Sessions:** 1 · **Resolves:** GAP-014
**Dependencies:** TASK-006, TASK-051, R-TASK-111

### Files to Create
- `app/api/admin/users/[id]/role/route.ts` — PATCH: grant/revoke admin role
- `app/admin/users/[id]/page.tsx` — user detail page with role management UI (admin-only)

### Files to Modify
- `lib/api-auth.ts` — add `assertSuperAdmin(user)` helper (super_admin can grant role; first-tier admin cannot self-promote others)

### Schema addition

> **Deletion gate — confirm before executing:** The SQL block below contains `DROP CONSTRAINT IF EXISTS profiles_role_check` — this removes the existing role CHECK constraint on the `profiles` table to widen it for the new `super_admin` value. Surface the existing constraint text (queryable via `\d profiles` in psql, or `SELECT pg_get_constraintdef(oid) FROM pg_constraint WHERE conname='profiles_role_check'`) to the operator before running this migration. Wait for explicit "confirm deletion" reply before applying. Log confirmation in this sub-task's Session Notes including the pre-DROP constraint definition for the audit trail.

```sql
-- Migration 013_role_super_admin.sql
ALTER TABLE profiles
  DROP CONSTRAINT IF EXISTS profiles_role_check;
ALTER TABLE profiles
  ADD CONSTRAINT profiles_role_check CHECK (role IN ('user', 'admin', 'super_admin'));
```

`super_admin` is the role that can grant/revoke `admin`. Bootstrap: Steve Macurdy is the initial super_admin, set via SQL one-time:

```sql
UPDATE profiles SET role='super_admin' WHERE email='steve@woulfgroup.com';
```

`ADMIN_EMAILS` env var becomes seed-only (loads first super_admin on profile creation if email matches). After bootstrap, all role changes go through the API.

### API behavior
- PATCH /api/admin/users/[id]/role with body `{role: 'user' | 'admin'}`
- Requires actor.role === 'super_admin'
- Records audit event `role.granted` or `role.revoked` (depending on transition)
- Sends email notification to affected user

### Tests Required
- AT-113-1: super_admin can grant admin to another user
- AT-113-2: admin cannot grant admin to another user (403)
- AT-113-3: admin cannot self-promote to super_admin (403)
- AT-113-4: Role change recorded in audit log
- AT-113-5: Affected user receives email notification

---

## R-TASK-114: Password Policy Hardening + Breach-List Check

**Status:** NOT STARTED · **Phase:** 11 · **Sessions:** 1 · **Resolves:** GAP-016
**Dependencies:** TASK-008, TASK-009

### Files to Create
- `lib/password.ts` — validation: minimum 12 chars, mixed case + digit, breach-list check via HIBP k-anonymity API

### Files to Modify
- `app/(auth)/signup/page.tsx` (TASK-008) — client-side validation + server-side validation
- `app/(auth)/forgot/page.tsx` (TASK-009) — same on password reset
- `app/account/security/page.tsx` (R-TASK-103) — same on change-password
- Supabase Auth settings (Dashboard → Auth → Settings) — set min length to 12 (Supabase enforces server-side)

### Password rules
- Minimum 12 characters
- Must include at least one uppercase, one lowercase, one digit (no special-char requirement — fights memorability)
- Must NOT appear in HaveIBeenPwned breach list (check via k-anonymity API: send first 5 chars of SHA-1 hash, get list of full hashes back, compare locally — never sends password)
- Cannot match user's email or first part of email

### HIBP check

```typescript
// lib/password.ts
import { createHash } from 'crypto';

export async function isPasswordBreached(password: string): Promise<boolean> {
  const hash = createHash('sha1').update(password).digest('hex').toUpperCase();
  const prefix = hash.slice(0, 5);
  const suffix = hash.slice(5);
  try {
    const res = await fetch(`https://api.pwnedpasswords.com/range/${prefix}`, {
      headers: { 'User-Agent': 'mybestsellingnovel-password-check' },
    });
    if (!res.ok) return false; // fail open — don't block signup if HIBP is down
    const text = await res.text();
    return text.split('\n').some(line => line.split(':')[0]?.trim() === suffix);
  } catch {
    return false; // fail open
  }
}
```

### Tests Required
- AT-114-1: Signup with "password" rejected (too short, breached)
- AT-114-2: Signup with "MyN0velAuthor2026!" accepted
- AT-114-3: Signup with HIBP-listed password (e.g., "Password123!") rejected with breach message
- AT-114-4: HIBP API down → password validation falls through (doesn't block signup)
- AT-114-5: Password matching email rejected

---

## R-TASK-115: Key Rotation Procedure & Tracker

**Status:** NOT STARTED · **Phase:** 12 · **Sessions:** 0.5 · **Resolves:** GAP-026
**Dependencies:** None

### Files to Create
- `docs/runbooks/key-rotation.md` — step-by-step procedure per secret
- `docs/legal/secrets-rotation-tracker.md` — table of last-rotated dates per secret

### Rotation cadence
| Secret | Cadence | Next due |
|---|---|---|
| ANTHROPIC_API_KEY | quarterly | (set at first rotation) |
| STRIPE_SECRET_KEY | annually (or on incident) | — |
| STRIPE_WEBHOOK_SECRET | annually (or on endpoint change) | — |
| SUPABASE_SERVICE_ROLE_KEY | annually | — |
| RESEND_API_KEY | annually | — |
| UPSTASH_REDIS_REST_TOKEN | annually | — |
| SENTRY_AUTH_TOKEN | annually | — |

### Rotation procedure (template per secret)

```markdown
## Rotating ANTHROPIC_API_KEY

1. Generate new key in Anthropic Console → API Keys → Create Key (label "rotated YYYY-MM-DD")
2. Add new key to Vercel env vars under temporary name `ANTHROPIC_API_KEY_NEW`
3. Deploy to staging (R-TASK-122); verify /api/ai works with new key
4. In `lib/claude.ts`, briefly support both: prefer NEW, fall back to current
5. Promote: rename `ANTHROPIC_API_KEY_NEW` → `ANTHROPIC_API_KEY` (overwrites old value)
6. Deploy to production
7. Wait 24h; verify no 401s in Sentry
8. **(Deletion gate — confirm before executing)** Delete old key in Anthropic Console. This is a destructive action on operator-owned credentials in an external system. Surface the key label (e.g., "rotated 2026-04-15") and last-4 fingerprint of the old key to the operator before deletion. Wait for explicit "confirm deletion" reply before clicking Delete in the Anthropic Console. Log confirmation in this sub-task's Session Notes including the deleted key label and the new key label that replaced it.
9. Update `docs/legal/secrets-rotation-tracker.md` with rotation date + person
```

Calendar reminders set in operator's calendar; no automated rotation enforcement at v1.

### Tests Required
- AT-115-1: Runbook successfully completed for one secret as a drill (record in tracker)

---

## R-TASK-116: Off-Supabase Backup (Cloudflare R2) + Restore Drill

**Status:** NOT STARTED · **Phase:** 12 · **Sessions:** 1.5 · **Resolves:** GAP-027
**Dependencies:** TASK-013, TASK-014

### Files to Create
- `app/api/admin/backup/run/route.ts` — admin or cron-triggered: pg_dump → upload to R2
- `scripts/restore-from-backup.sh` — runbook for restore (manual operator script)
- `docs/runbooks/backup-and-restore.md`

### Files to Modify
- `vercel.json` — add daily cron 02:00 UTC: `/api/admin/backup/run`
- `.env.local.example` — add `R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_BUCKET=mybsn-backups`

### Backup contents (per nightly run)
- Postgres dump of all 6 product tables (profiles, books, chapters, audio_chunks, subscriptions, ai_usage_logs) + 7 audit/system tables — gzipped, encrypted with libsodium key (key stored in 1Password, NOT in env)
- Manifest JSON with row counts per table for verification
- File naming: `YYYY-MM-DD/db-dump.sql.gz.enc` and `YYYY-MM-DD/manifest.json`

### Backup contents (weekly — Sundays)
- Above + tar of book-audio + book-covers Storage buckets

### Retention
- Daily backups: 30 days
- Weekly backups: 12 weeks
- Monthly backups (first of month): 7 years (compliance)

### Restore drill (quarterly)
- Restore most recent backup to a fresh Supabase staging project
- Verify row counts match manifest
- Verify random sample of 10 books reads correctly
- Document drill results in `docs/runbooks/backup-and-restore.md` history section

### Cost
- R2: $0.015/GB-mo storage, $0 egress; 1GB DB at $0.015/mo + ~$1/mo for audio archive at 100GB

### Tests Required
- AT-116-1: Cron-triggered backup completes; file appears in R2 with manifest
- AT-116-2: Manual restore drill completes; row counts match
- AT-116-3: Encryption key in 1Password — operator can locate within 30s

---

## R-TASK-117: User Data Export Endpoint

**Status:** NOT STARTED · **Phase:** 11 · **Sessions:** 1 · **Resolves:** GAP-030
**Dependencies:** TASK-017, TASK-018, TASK-019

### Files to Create
- `app/api/account/export/route.ts` — POST: queue export; GET: download by token
- `app/account/export/page.tsx` — UI: "Export all my data"; shows pending, downloadable, expired
- `lib/export.ts` — assembles user's data into a zip

### Files to Modify
- `app/account/page.tsx` (TASK-047) — add "Export My Data" link
- `app/privacy/page.tsx` (TASK-057) — mention export availability

### Export contents
A zip file containing:
- `profile.json` — profile row (excluding sensitive fields)
- `books/{book_id}/metadata.json` — book row
- `books/{book_id}/chapters.json` — all chapters with content
- `books/{book_id}/audio/{idx}.mp3` — audio files for each chapter
- `books/{book_id}/cover.{ext}` — cover image if uploaded
- `subscription.json` — subscription history
- `ai_usage.csv` — AI usage history (no prompt content; just metadata)
- `README.txt` — explains the export structure

### Generation
- Async (POST returns 202 with job_id; client polls for completion)
- Zip stored in Supabase Storage `book-exports` bucket with signed URL valid for 7 days
- Email sent with download link when ready
- Auto-deleted after 7 days

### Tests Required
- AT-117-1: User triggers export; 30 seconds later receives email with download link
- AT-117-2: Download contains all books, chapters, audio
- AT-117-3: Signed URL expires after 7 days
- AT-117-4: Export rate-limited to 2/day/user

---

## R-TASK-118: Data Residency Documentation & Region Pinning

**Status:** NOT STARTED · **Phase:** 11 · **Sessions:** 0.5 · **Resolves:** GAP-031
**Dependencies:** None

### Files to Create
- `docs/architecture/DATA_RESIDENCY.md` — public statement of where data lives

### Configuration steps (manual)
- Supabase project: created in `us-east-1` (US East / N. Virginia)
- Vercel project: production deploys to `iad1` (US East) by default; configure additional region if needed
- Resend: us-east-1 (default; explicit confirmation)
- Anthropic API: routed to nearest US region by default (no choice on consumer API)
- Cloudflare R2 backups: us-east region

### Public statement (in DATA_RESIDENCY.md)

```markdown
## Where your data lives

My Best Selling Novel stores user data in the United States. Specifically:
- Database (manuscripts, account info): Supabase, AWS us-east-1 (N. Virginia)
- File storage (audio, covers): Supabase Storage, AWS us-east-1
- Backups: Cloudflare R2, US region
- Email delivery: Resend, AWS us-east-1
- Application hosting: Vercel, IAD1 (Washington, DC area)
- Payment processing: Stripe (multi-region; US-primary)
- AI processing: Anthropic API (US-primary infrastructure)

For EU and UK customers: data is transferred to the United States under
Standard Contractual Clauses (SCCs) per the GDPR. We have signed Data
Processing Agreements with all subprocessors listed above.

Data residency choice: we have not adopted EU-resident infrastructure for
v1. EU customers requiring local data residency should not use our service
until v2 introduces this option (no committed timeline).
```

### Tests Required
- AT-118-1: docs/architecture/DATA_RESIDENCY.md exists
- AT-118-2: Linked from /privacy page
- AT-118-3: Supabase project Region setting confirmed in Dashboard

---

*End of R-TASK-112 through R-TASK-118 cluster*
