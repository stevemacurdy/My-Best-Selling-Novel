<!-- APPLY: REPLACE -->
<!-- Target: docs/TASKS/TASK-063-e2e-auth.md (in original mybsn package) -->
<!-- Backup: docs/EXPANDED-TASKS/backups/TASK-063-e2e-auth.pre-expansion-backup.md -->
<!-- Expanded 2026-05-08 from 94 words to ~860 words via PATCH-3 sub-deliverable B.3. -->

# TASK-063: E2E Authentication Test (`docs/manual-tests/auth.md`)

## Status: NOT STARTED
## Priority: HIGH
## Phase: 10
## Estimated Sessions: 1
## Dependencies: TASK-008, TASK-009, TASK-010
## Requirements Covered: R2
## Spec Reference: Section 10.1

## Inference Summary

| Addition | Source |
|---|---|
| Manual checklist in v1; Playwright migration in R-TASK-130 | Q-10.1 operator-answer (use default) |
| 8 base test cases | Q-10.2 operator-answer (use default) |
| HIBP breached-password rejection (case 9) | Q-10.3 operator-answer (use default); TASK-008 expansion |
| MFA banner dismissal flow (case 10) | Q-10.4 operator-answer (use default); TASK-008 + Q-2.10 |
| Open-redirect protection on `returnTo` | TASK-009 expansion |

Operator confirmed all questions on 2026-05-08.

## Pre-flight: re-read current state

- View `docs/manual-tests/auth.md` if present.
- Confirm TASK-008 (signup), TASK-009 (signin/forgot), TASK-010 (auth-guards) have shipped — TASK-063 exercises their behavior.
- Confirm `RESEND_TEST_INBOX` (or equivalent) is configured per Q-8.13 — reset emails go to a test inbox in dev/staging.
- Confirm `lib/hibp.ts` (TASK-008) is in place for case 9.

## Files to Create/Modify

- `docs/manual-tests/auth.md` (NEW)

## Implementation Requirements

The doc is a 10-case checklist run by the operator before any auth-related deploy, and again after the deploy in test mode against staging. Each case specifies setup, action, and expected outcomes.

### Setup (run once before scenarios)

```bash
# Terminal — start dev server
npm run dev

# Configure RESEND_FROM_EMAIL to a test inbox or use Resend "Test" mode
# Verify by triggering /forgot and confirming email arrives
```

Test users used:
- New email per case to avoid pollution: `e2e+auth-{caseN}-{timestamp}@example.com`
- Persistent test password: `TestPass1234!@#$` (12 chars, not in HIBP breach corpus per local check)

### Case 1 — Successful signup

**Action:** Visit `/signup`, fill all fields, accept all 3 checkboxes (per Q-8.4=a inline AUP in ToS), submit.

**Expected:**
- ☐ POST `/signup` returns redirect to `/app`
- ☐ `auth.users` row exists with `email_confirmed_at IS NULL` (soft gate per Q-2.11)
- ☐ `profiles` row exists with `subscription_tier='explorer'`, `subscription_status='free'`
- ☐ `document_acceptances` has **3 rows** (ToS+AUP combined per Q-8.4=a, Privacy, Refunds)
- ☐ `/app` renders with Skeleton (TASK-010), then content
- ☐ MFA banner visible at top of `/app` (per Q-2.10 default)

### Case 2 — Signin (valid credentials)

**Setup:** existing account from Case 1.

**Action:** Visit `/signin`, enter credentials, submit.

**Expected:**
- ☐ Redirect to `/app`
- ☐ Session cookie set (visible in DevTools > Application > Cookies > `sb-<ref>-auth-token`)
- ☐ Refreshing `/app` keeps the session

### Case 3 — Signin (invalid credentials)

**Action:** Visit `/signin`, enter wrong password.

**Expected:**
- ☐ Stays on `/signin`
- ☐ Generic error: "Invalid email or password." (no enumeration leak — same message for "email doesn't exist" and "wrong password")
- ☐ No session cookie set

### Case 4 — Signout flow

**Setup:** signed in.

**Action:** Click signout (header menu) → confirm.

**Expected:**
- ☐ Session cookie cleared
- ☐ Redirected to `/`
- ☐ Visiting `/app` redirects to `/signin?returnTo=/app` (TASK-007 middleware)

### Case 5 — Forgot password (email arrives)

**Action:** `/forgot`, enter email of existing account, submit.

**Expected:**
- ☐ Confirmation banner: "If an account exists for that email, a reset link has been sent."
- ☐ Same banner shown for non-existent email (no enumeration leak)
- ☐ Reset email arrives in test inbox within 30s (Supabase Auth uses internal mail server)
- ☐ Email link points to `${NEXT_PUBLIC_SITE_URL}/reset-password?token=...`

### Case 6 — Reset password (link works)

**Setup:** Case 5 reset email in inbox.

**Action:** Click link → `/reset-password` form → enter new password (`TestPass5678!@#$`) twice → submit.

**Expected:**
- ☐ Password updated; redirect to `/signin?reset=true`
- ☐ Success banner shown
- ☐ Signin with new password succeeds (Case 2 with new credentials)
- ☐ Old password no longer works

### Case 7 — AuthGuard redirect when signed out

**Setup:** signed out.

**Action:** Navigate directly to `/app/some-book-id`, `/account`, `/admin`.

**Expected per route:**
- ☐ `/app/...` → redirect to `/signin?returnTo=/app/some-book-id`
- ☐ `/account` → redirect to `/signin?returnTo=/account`
- ☐ `/admin` → redirect to `/signin?returnTo=/admin`

### Case 8 — Session persistence

**Setup:** signed in.

**Action:** Refresh page (F5), close tab + reopen, restart browser.

**Expected:**
- ☐ Session persists across refresh
- ☐ Session persists across tab close/reopen
- ☐ Session persists across browser restart (cookie has appropriate TTL)
- ☐ Session expires after Supabase TTL (default 1 hour for access token; refresh-token rotation extends transparently)

### Case 9 — HIBP breached-password rejection

**Setup:** none.

**Action:** `/signup`, fill fields with the **known-breached password** `password123456` (this password is in HIBP's top breach corpus).

**Expected:**
- ☐ Submit returns error: "This password appears in known data breaches. Please choose a different one." (per TASK-008 / Q-2.7 default)
- ☐ No `auth.users` row created
- ☐ No `document_acceptances` rows created
- ☐ Form remains on `/signup` for retry with a new password

### Case 10 — MFA banner dismissal flow

**Setup:** signed in as a fresh user from Case 1.

**Action:** Visit `/app`. Banner appears: "Recommended: Add two-factor authentication." Click "Dismiss forever."

**Expected:**
- ☐ Banner disappears
- ☐ `profiles.mfa_banner_dismissed = true` in DB
- ☐ Refresh `/app` — banner stays gone
- ☐ Sign out + sign in — banner stays gone

### Bonus check — open-redirect protection

**Action:** Visit `/signin?returnTo=//evil.example.com/steal`. Sign in.

**Expected:**
- ☐ Redirected to `/app` (NOT `//evil.example.com/...`); per TASK-009 expansion, `returnTo` must start with `/` and not `//` to be honored

## What this task does NOT do

- Does NOT exercise admin role flows — that's covered in TASK-067 security audit cases 1-2-6
- Does NOT exercise tier-gated flows — that's TASK-064 books / TASK-065 billing
- Does NOT automate; R-TASK-130 / Phase 11 owns automation in `e2e/auth.spec.ts`

## Tests Required (meta — verifying the doc itself)

- AT-100: `docs/manual-tests/auth.md` exists with all 10 cases
- AT-101: Each case has setup + action + expected outcomes documented
- AT-102: HIBP-breach case explicitly references `password123456` as the test password
- AT-103: Open-redirect case uses `//evil.example.com` to verify protection

## Session Notes
_(Filled by Claude Code during implementation)_
