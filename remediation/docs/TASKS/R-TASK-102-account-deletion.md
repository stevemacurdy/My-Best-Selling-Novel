<!-- APPLY: CREATE -->
# R-TASK-102: Account Deletion & Cross-System Data Deletion

## Status: NOT STARTED
## Priority: CRITICAL
## Phase: 11
## Estimated Sessions: 3
## Dependencies: TASK-006, TASK-024, R-TASK-111 (audit log)
<!-- Mislabel correction (2026-05-06): the original R-TASK-102 draft listed "R-TASK-115 (Resend)" as a dependency. R-TASK-115 is Key Rotation Procedure, not Resend. The Resend client is provisioned by the original 68-task plan (TASK-005 lazy-sdks) and is in place by Phase 1. No remediation-task dependency required. -->
## Resolves Gaps: GAP-015, GAP-029
## Spec Reference: AUDIT_REPORT.md CRITICAL section

## Pre-flight: re-read current state

Before making any change, read the current state of every file listed in "Files to Modify" below. Verify the gap(s) addressed by this task are still present in the current code. Specifically:

- For each file in "Files to Modify": view the file and confirm the condition the audit observed (e.g., "no rate limiting on /api/ai") still applies.
- For each gap in "Resolves Gaps": confirm the gap remains open. The audit was conducted on 2026-05-04; if the codebase changed since, the gap may have been partially or fully addressed.
- If a gap is no longer present, report this finding in PROGRESS.md, mark this task as superseded, and stop. Do not make changes.
- If a gap is partially addressed, scope this task to the remaining work and document in this file's Session Notes what was already addressed and skipped.
- If the gap is still fully present as the audit described, proceed with the rest of this task.

This pre-flight catches the case where the codebase changed between audit and remediation — exactly the failure mode that produces silent overwrites of unrelated work.

## Files to Create

- `app/api/account/delete/route.ts` — POST: initiates deletion request
- `app/api/account/delete/confirm/route.ts` — POST: confirms with re-typed email + active password
- `app/account/delete/page.tsx` — UI for self-service deletion
- `lib/deletion.ts` — orchestrator: cascades deletion across DB, Storage, Stripe, Resend, GA pseudo-IDs, Vercel logs
- `emails/account-deletion-confirmation.tsx` — Resend template
- `emails/deletion-receipt.tsx` — issued after completion
- `supabase/migrations/009_deletion_requests.sql` — `deletion_requests` table for tracking pending deletions through the regulatory window
- `docs/runbooks/data-deletion.md` — manual operator procedure for edge cases

## Files to Modify

- `app/account/page.tsx` (TASK-047) — add "Delete Account" link in danger zone section
- `app/api/stripe/webhook/route.ts` (TASK-024) — handle the case where a customer with active subscription requests deletion; cancel subscription + initiate deletion together
- `lib/api-auth.ts` (TASK-006) — add `assertNotPendingDeletion(user)` guard for routes that should block during pending-deletion window

## Implementation Requirements

### Deletion lifecycle (3 stages)

**Stage 1 — Request initiated (synchronous, immediate)**
- User submits POST `/api/account/delete` with current password (re-verified via `supabase.auth.signInWithPassword` to confirm they're the owner)
- System creates row in `deletion_requests` table with: `user_id`, `requested_at`, `confirm_token` (random 32-byte hex), `confirm_token_expires_at` (now + 24h), `status='pending_confirm'`
- System sends email with confirm link (link points to `/account/delete/confirm?token=...`)
- User sees "Check your email to confirm deletion" page
- User retains full account access until Stage 2

**Stage 2 — Confirmation (asynchronous, user-driven)**
- User clicks email link, lands on confirm page, types their email address as final guard
- System validates token (not expired, not consumed), creates `audit_event_log` entry (`action='account.delete.confirmed'`)
- Status moves to `status='confirmed'`, sets `scheduled_deletion_at = now + 7 days` (cancellation grace window)
- User sees "Your account is scheduled for deletion in 7 days. Click here to cancel." in `app/account/page.tsx`

**Stage 3 — Deletion executes (after grace window)**
- Daily cron (Vercel Cron) hits `/api/account/delete/execute` (admin-only, runs deletion for all rows where `scheduled_deletion_at <= now() AND status='confirmed'`)
- Order of operations (each step writes to audit log + on failure: row stays, retry on next cron):
  1. Cancel any active Stripe subscription (`stripe.subscriptions.del`)
  2. Issue Stripe refund for any charges within last 30 days IF `refund_eligible=true` (default false; admin can flag)
  3. Delete all rows in `audio_chunks`, `chapters`, `books`, `ai_usage_logs`, `subscriptions`, `deletion_requests` for the user
  4. Delete all objects in `book-audio` and `book-covers` storage buckets where path includes the user_id prefix
  5. Delete Supabase Auth user (`supabase.auth.admin.deleteUser`)
  6. Remove from Resend audience (`resend.contacts.remove`)
  7. Send `audit_event_log` entry `action='account.deleted'` (this row references user_id which no longer exists in profiles — that's expected, audit log uses `actor_id_snapshot` text field)
  8. GA4: deletion does not propagate automatically; Vercel function fires GA4 deletion request via Measurement Protocol API (best-effort; user_pseudo_id is the join key)
  9. Vercel function logs are NOT scrubbed proactively (30-day retention; entries containing user data age out naturally)
- Deletion-receipt email sent to user's now-deleted email address (last-gasp confirmation)

### `deletion_requests` table schema

```sql
CREATE TABLE deletion_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  requested_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  confirm_token TEXT NOT NULL UNIQUE,
  confirm_token_expires_at TIMESTAMPTZ NOT NULL,
  confirmed_at TIMESTAMPTZ,
  scheduled_deletion_at TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'pending_confirm'
    CHECK (status IN ('pending_confirm', 'confirmed', 'cancelled', 'executing', 'completed', 'failed')),
  cancellation_reason TEXT,
  failure_reason TEXT,
  refund_eligible BOOLEAN NOT NULL DEFAULT FALSE,
  executed_at TIMESTAMPTZ,
  metadata JSONB DEFAULT '{}'::jsonb
);

CREATE INDEX idx_deletion_requests_user ON deletion_requests(user_id);
CREATE INDEX idx_deletion_requests_scheduled ON deletion_requests(scheduled_deletion_at)
  WHERE status = 'confirmed';

ALTER TABLE deletion_requests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users see own deletion requests" ON deletion_requests
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users create own deletion requests" ON deletion_requests
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users cancel own deletion requests" ON deletion_requests
  FOR UPDATE USING (auth.uid() = user_id AND status IN ('pending_confirm', 'confirmed'));
```

### Vercel Cron configuration (`vercel.json`)

```json
{
  "crons": [
    { "path": "/api/account/delete/execute", "schedule": "0 3 * * *" }
  ]
}
```

### Compliance window

- CCPA: 45 days from request to confirmation of completion (with optional 45-day extension on notice)
- GDPR: 1 month from request, extendable to 3 months
- Our 7-day grace window + daily cron = max 8 days from confirmation to executed deletion. Comfortably inside both windows even with 1 retry day.

## Tests Required

- AT-102-1: User can initiate deletion with correct password; rejected with wrong password (re-auth required)
- AT-102-2: Confirmation email arrives within 30 seconds; link works once
- AT-102-3: Cancellation works during grace window; deletion request status moves to 'cancelled'
- AT-102-4: After 7 days, daily cron deletes user; all rows in books/chapters/audio_chunks/ai_usage_logs are gone
- AT-102-5: Storage objects under user_id prefix are deleted from book-audio and book-covers buckets
- AT-102-6: Stripe customer is deleted; subscription is cancelled if active
- AT-102-7: Resend contact is removed
- AT-102-8: Audit log contains the deletion event (actor_id_snapshot preserves user_id as text)
- AT-102-9: Re-attempt to sign in with deleted email returns "no user found"
- AT-102-10: Operator can manually execute deletion via admin route in case cron fails (admin-only, audited)

## Compliance Documentation

After implementation, the following can be claimed in your Privacy Policy:
- "You may delete your account at any time via Account Settings → Danger Zone → Delete Account."
- "Upon confirmation, your data is fully removed from our active systems within 8 days."
- "Backups containing your data age out per our 7-day Point-in-Time Recovery retention; we do not restore deleted account data."
- "Where required by law, we issue a deletion receipt to your email address documenting the action."

## Session Notes
_(Filled by Claude Code during implementation)_
