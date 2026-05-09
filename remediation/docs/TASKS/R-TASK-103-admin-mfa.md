<!-- APPLY: CREATE -->
# R-TASK-103: Admin MFA Enrollment & Enforcement

## Status: NOT STARTED
## Priority: CRITICAL
## Phase: 11
## Estimated Sessions: 2
## Dependencies: TASK-006, TASK-010
## Resolves Gaps: GAP-017
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

- `app/account/security/page.tsx` — MFA enrollment page (TOTP via Supabase Auth MFA)
- `components/MFAEnrollment.tsx` — QR code display + verification challenge UI
- `components/MFAChallenge.tsx` — challenge prompt during signin (when MFA enrolled)
- `lib/mfa.ts` — wrapper around Supabase MFA API: `enrollFactor`, `verifyFactor`, `unenrollFactor`, `requireMFAForRole`

## Files to Modify

- `lib/api-auth.ts` (TASK-006) — add `assertMFAVerified(user)` function. For admin routes, this must be called after `verifyToken` and before any business logic. Returns 403 with body `{error: 'mfa_required', enroll_url: '/account/security'}` if admin user has no enrolled factors OR has factors but current session has no AAL2 token.
- `components/AdminGuard.tsx` (TASK-010) — if user is admin AND `aal !== 'aal2'`, redirect to MFA challenge page before allowing access to `/admin/*`
- `app/api/admin/metrics/route.ts`, `app/api/admin/genres/route.ts`, `app/api/admin/users/route.ts` (TASK-049, 050, 051) — add `assertMFAVerified` after `verifyToken`
- `app/(auth)/signin/page.tsx` (TASK-009) — handle Supabase MFA challenge response (when user has factors enrolled, signin returns `aal: 'aal1'`; UI prompts for second factor and elevates to `aal2`)

## Implementation Requirements

### Supabase Auth MFA setup

Supabase Auth supports TOTP (Time-based One-Time Password) factors out of the box. Enable in Supabase Dashboard → Authentication → Providers → MFA.

### Enrollment flow (admin user, first time)

1. Admin signs in with email + password. Session has `aal='aal1'`.
2. AdminGuard detects role=admin + aal=aal1; redirects to `/account/security`
3. Page calls `supabase.auth.mfa.enroll({factorType: 'totp'})` — returns QR code URI + secret
4. Admin scans QR with Authenticator app (1Password, Authy, Google Authenticator)
5. Admin enters 6-digit code; page calls `supabase.auth.mfa.challenge` then `supabase.auth.mfa.verify`
6. On verify success, factor moves from `unverified` to `verified`. Session elevates to `aal=aal2`.
7. Admin can now access `/admin/*`

### Challenge flow (admin user, subsequent signins)

1. Admin signs in. Session has `aal=aal1` because MFA factor exists but isn't yet challenged for this session.
2. AdminGuard sees aal=aal1 + factors exist; renders MFAChallenge component
3. User enters 6-digit code; page calls `supabase.auth.mfa.challengeAndVerify({factorId})`
4. Session elevates to `aal=aal2`; admin proceeds to `/admin`

### Recovery codes

Supabase Auth does not provide TOTP recovery codes natively. Workaround:
- On enroll, generate 10 random 8-char alphanumeric recovery codes (operator-side, store hashed in `mfa_recovery_codes` table)
- Each code single-use; recovery flow consumes one and re-issues a fresh batch
- Display once after enrollment with "Save these somewhere safe" warning

### `mfa_recovery_codes` table

```sql
CREATE TABLE mfa_recovery_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  code_hash TEXT NOT NULL,
  consumed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_mfa_recovery_user ON mfa_recovery_codes(user_id) WHERE consumed_at IS NULL;
ALTER TABLE mfa_recovery_codes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users see own recovery codes" ON mfa_recovery_codes
  FOR SELECT USING (auth.uid() = user_id);
-- Insert/update via service role only (in /api/account/security/recovery/route.ts)
```

### Tier-based MFA policy

For now, MFA is **required** for admin role only. Paying users (Author, Publisher) can **opt in** via `/account/security` page. Lifetime tier customers should be **strongly encouraged** to enable MFA — surface the prompt in the lifetime confirmation email (R-TASK-135).

### Operator bootstrap procedure

The first admin (Steve Macurdy) needs to enroll MFA before any other admin work proceeds:
1. Sign in to live site with `steve@woulfgroup.com`
2. Navigate to `/account/security`
3. Enroll TOTP via 1Password or similar
4. Save recovery codes in 1Password
5. Sign out, sign back in, verify challenge works
6. Document in `docs/runbooks/admin-mfa-enrollment.md` (created by R-TASK-139)

<!-- ADR-004 cross-binding paragraph removed 2026-05-06: ADR-004 voided when lifetime tier was eliminated. This task still ships for the non-lifetime reasons originally documented above. -->
## Tests Required

- AT-103-1: Admin sign-in with no MFA enrolled redirects to `/account/security`
- AT-103-2: Admin can enroll TOTP factor; verify code accepted; session elevates to aal2
- AT-103-3: Admin sign-in with MFA enrolled requires challenge; after correct code, /admin accessible
- AT-103-4: Admin sign-in with wrong MFA code returns error; /admin remains inaccessible
- AT-103-5: Recovery code consumes on first use; second use of same code rejected
- AT-103-6: Non-admin user can navigate to /account/security and enroll MFA optionally
- AT-103-7: API call to /api/admin/metrics with aal=aal1 token returns 403 mfa_required
- AT-103-8: API call to /api/admin/metrics with aal=aal2 token returns metrics

## Notes

- MFA factor enrollment + verification adds ~30s to first admin sign-in
- The `aal` claim is part of the Supabase JWT; `verifyToken` in `lib/api-auth.ts` already has access via `data.aal`
- For paying users opting in, the experience is identical — they enroll once, challenge each session

## Session Notes
_(Filled by Claude Code during implementation)_
