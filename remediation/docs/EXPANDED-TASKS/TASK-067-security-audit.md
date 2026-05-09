<!-- APPLY: REPLACE -->
<!-- Target: docs/TASKS/TASK-067-security-audit.md (in original mybsn package) -->
<!-- Backup: docs/EXPANDED-TASKS/backups/TASK-067-security-audit.pre-expansion-backup.md -->
<!-- Expanded 2026-05-08 from 96 words to ~970 words via PATCH-3 sub-deliverable B.3. -->

# TASK-067: Pre-Launch Security Audit (`docs/manual-tests/security.md`)

## Status: NOT STARTED
## Priority: CRITICAL
## Phase: 10
## Estimated Sessions: 2
## Dependencies: TASK-006, TASK-007, TASK-010, TASK-104, TASK-103
## Requirements Covered: R10
## Spec Reference: Section 10.5

## Inference Summary

| Addition | Source |
|---|---|
| 6 base + 6 expanded checks (12 total) | Q-10.18 operator-answer (use default) |
| Manual grep + R-TASK-130 CI mechanical check | Q-10.19 operator-answer (use default) |
| Pentest deferred to scale gate (1000 customers / $50K MRR) | Q-10.20 operator-answer (use default); R-TASK-150 risk register |
| No bug bounty in v1; Vuln Disclosure Policy via R-TASK-119 | Q-10.21 operator-answer (use default) |

Operator confirmed all questions on 2026-05-08.

## Pre-flight: re-read current state

- View `docs/manual-tests/security.md` if present.
- Confirm dependencies: TASK-006 (api-auth), TASK-007 (middleware), TASK-010 (auth-guards), R-TASK-104 (rate-limiting), R-TASK-103 (admin MFA) all shipped.
- Confirm `npm run build` produces `.next/static/chunks/*.js` accessible for inspection.

## Files to Create/Modify

- `docs/manual-tests/security.md` (NEW)

## Implementation Requirements

12 checks. Run before any production deploy and as part of pre-launch checklist (R-TASK-141). If any check fails, deploy is blocked until fixed.

### Setup

```bash
npm run build  # produce production bundle for grep
# Use Postman/curl for API probes
# Sign in two test users in different browsers (User A admin, User B regular)
```

### Check 1 — Unauthenticated API call → 401

**Action:** `curl -s http://localhost:3000/api/books` (no Authorization header).

**Expected:** HTTP 401 + `{"error": "unauthorized"}`. Never 200, never 500.

Run for 3-5 representative protected endpoints: `/api/books`, `/api/chapters/[id]/0`, `/api/admin/metrics`, `/api/audio/[id]/0`.

### Check 2 — Cross-user RLS isolation

**Setup:** User A signed in. User B signed in (different browser).

**Action:**
1. User A creates book; note book_id.
2. User B (with B's auth token): `curl -H "Authorization: Bearer $TOKEN_B" /api/books/$A_BOOK_ID`

**Expected:** 404 `not_found` (per TASK-017 expansion — leak-prevention; 403 would confirm existence). Verify same for `/api/chapters/$A_BOOK_ID/0` and `/api/audio/$A_BOOK_ID/0`.

### Check 3 — Webhook rejects invalid signatures

**Action:**
```bash
curl -X POST http://localhost:3000/api/stripe/webhook \
  -H "Stripe-Signature: t=fake,v1=fake" \
  -d '{"type":"customer.subscription.created"}'
```

**Expected:** HTTP 400 `webhook_signature_invalid` (per TASK-024 expansion). DB unchanged.

### Check 4 — `ANTHROPIC_API_KEY` not in client bundle

**Action:**
```bash
npm run build
grep -r "sk-ant" .next/static/chunks/ 2>/dev/null
```

**Expected:** Zero matches. Per Decision #8, the Claude API key is server-side only.

### Check 5 — `SUPABASE_SERVICE_ROLE_KEY` not in client bundle

**Action:**
```bash
grep -rE "service_role|SUPABASE_SERVICE_ROLE_KEY" .next/static/chunks/ 2>/dev/null
```

**Expected:** Zero matches. Per Decision #16 + WoulfAI rule 10.

### Check 6 — Admin routes reject non-admin users

**Setup:** User B = `role='user'`.

**Action:** `curl -H "Authorization: Bearer $TOKEN_B" /api/admin/metrics`

**Expected:** 403 `forbidden`. Verify same for `/api/admin/users`, `/api/admin/genres`, `/admin/audit` (super_admin-only).

### Check 7 — Rate-limit triggers per R-TASK-104

**Action:** Submit 4 signups in 60 seconds from same IP:
```bash
for i in 1 2 3 4; do
  curl -X POST http://localhost:3000/api/signup \
    -d "email=test$i@example.com&password=TestPass1234!@#$&..."
done
```

**Expected:** 4th request returns 429 `Too many requests` (per Q-2.4 default 3/hour/IP; window per implementation). Verify same on `/forgot`.

### Check 8 — HIBP password breach rejection (per Q-10.3)

**Action:** Attempt signup with breached password `password123456`.

**Expected:** Server-action returns `password_breached` error; no `auth.users` row created.

### Check 9 — MFA enforcement on `/admin` (per R-TASK-103)

**Setup:** Promote User A to admin role: `UPDATE profiles SET role='admin' WHERE id='$USER_A_ID'`. User A has not yet enrolled MFA (`auth.users.aal != 'aal2'`).

**Action:** User A visits `/admin`.

**Expected:** Redirected to `/account/mfa` (per TASK-010 AdminGuard MFA enforcement); cannot access `/admin/*` until MFA enrolled.

### Check 10 — CSRF protection on state-changing routes

**Action:** Attempt cross-origin POST to `/api/books` from a malicious origin (use `curl -H "Origin: https://evil.example.com"`):

**Expected:** Next.js Server Actions enforce same-origin via internal CSRF tokens; cross-origin requests return 403 or are rejected at the framework level. Document the framework's behavior at TASK-067 ship time.

### Check 11 — SQL injection probe

**Action:** Search the user list with malicious params:
```bash
curl -G "http://localhost:3000/api/admin/users" \
  --data-urlencode "search=admin' OR 1=1;--" \
  -H "Authorization: Bearer $TOKEN_ADMIN"
```

**Expected:** Returns no matching users (the literal string `admin' OR 1=1;--` doesn't match any email or full_name). No 500. Postgres parameterized queries via Supabase client prevent injection.

Per TASK-051 expansion `escapeIlike` helper, ILIKE wildcards in user input are escaped. Verify by searching for `%@example.com` and confirming it's treated as a literal `%` character.

### Check 12 — XSS probe on user content

**Setup:** User A creates a book with title `<script>alert(1)</script>Test Book`.

**Action:** View the book in agent UI; view in admin user-detail page; view in account dashboard.

**Expected:**
- ☐ Title renders as literal text `<script>alert(1)</script>Test Book` (escaped at render time by React)
- ☐ No alert pops up
- ☐ Same for chapter content (verify in agent S6 chapter display)
- ☐ Same for genre, audio file metadata, any user-input field

### Pentest and bug bounty (Q-10.20, Q-10.21)

**Pentest:** **Deferred to scale gate (1000 paying customers OR $50K MRR, whichever first).** v1 has small surface area; the 12 checks above plus R-TASK-104/106/119/130 controls cover the major risks. Pentest at scale provides ROI that's not justified pre-launch. Tracked in R-TASK-150 risk register as a forward-action item.

**Bug bounty:** **No bounty program at v1 launch.** R-TASK-119's Vulnerability Disclosure Policy (`/vuln-disclosure`) provides email-based responsible disclosure with a 90-day disclosure timeline. Adequate for v1 scale. Bounty program at the same scale gate as pentest.

### Bundle inspection automation (Q-10.19)

Manual `grep` documented above. R-TASK-130 testing baseline adds a CI gate:

```yaml
# .github/workflows/ci.yml or similar
- name: Verify no secrets in client bundle
  run: |
    npm run build
    if grep -rE "sk-ant|service_role|sk_live|whsec_" .next/static/; then
      echo "ERROR: secret pattern found in client bundle"
      exit 1
    fi
```

This gate runs on every PR; if any check above starts failing, CI blocks the merge.

## What this task does NOT do

- Does NOT include fuzz testing or extensive penetration probing — the 12 checks are pre-launch baseline; broader testing happens at scale gate
- Does NOT cover infrastructure-level security (DDoS protection, firewall rules) — that's Vercel + Cloudflare per TASK-068
- Does NOT cover compliance audits (SOC 2, ISO 27001) — operator responsibility, not in v1 scope

## Tests Required (meta)

- AT-115: `docs/manual-tests/security.md` exists with all 12 checks
- AT-116: Each check has setup + action + expected outcome
- AT-117: Pentest and bug bounty deferral rationale documented
- AT-118: CI mechanical-check yaml snippet included (for R-TASK-130 to wire later)

## Session Notes
_(Filled by Claude Code during implementation)_
