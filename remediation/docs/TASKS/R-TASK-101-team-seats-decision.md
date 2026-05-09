<!-- APPLY: CREATE -->
# R-TASK-101: Team Seats — Deferred to v2 (Path A LOCKED)

## Status: DECISION LOCKED — Path A
## Priority: CRITICAL
## Phase: 11
## Estimated Sessions: 1 (copy + decisions log update)
## Dependencies: None
## Resolves Gaps: GAP-011, GAP-013
## Spec Reference: AUDIT_REPORT.md CRITICAL section
## Decision Date: 2026-05-05
## Decision By: Steve Macurdy

## Pre-flight: re-read current state

Before making any change, read the current state of every file listed in "Files to Modify" below. Verify the gap(s) addressed by this task are still present in the current code. Specifically:

- For each file in "Files to Modify": view the file and confirm the condition the audit observed (e.g., "no rate limiting on /api/ai") still applies.
- For each gap in "Resolves Gaps": confirm the gap remains open. The audit was conducted on 2026-05-04; if the codebase changed since, the gap may have been partially or fully addressed.
- If a gap is no longer present, report this finding in PROGRESS.md, mark this task as superseded, and stop. Do not make changes.
- If a gap is partially addressed, scope this task to the remaining work and document in this file's Session Notes what was already addressed and skipped.
- If the gap is still fully present as the audit described, proceed with the rest of this task.

This pre-flight catches the case where the codebase changed between audit and remediation — exactly the failure mode that produces silent overwrites of unrelated work.

## Locked Decision

**Path A — defer team seats to v2.** Confirmed 2026-05-05.

Path B (design + ship team seats in v1) is NOT to be implemented. The design notes below are preserved for v2 reference only — Claude Code must not implement Path B.

## Path A — Execution Plan (this is the work)

> **Deletion confirmation required (consolidated for steps 1, 2, 3, and 7):** Steps 1, 2, 3, and 7 below each remove operator-authored content from the codebase or from external systems (Stripe Dashboard) or from sibling task files. Before executing each, surface the exact text/code being removed to the operator (Steve Macurdy) and wait for explicit "confirm deletion" reply before proceeding. Log each confirmation in this task's Session Notes section, including the timestamp and the four-character hash of the content removed. Steps 4, 5, 6 are additive and do not require deletion confirmation.

1. **(Deletion gate — confirm before executing)** Update Decision #7 in `docs/ENGINEERING_DECISIONS.md` — remove "2 team seats" from Publisher tier marketing copy. Add revision note: "2026-05-05: Team seats deferred to v2 per R-TASK-101 Path A."
2. **(Deletion gate — confirm before executing)** Update `app/pricing/page.tsx` (TASK-045 file) to remove team-seat language. Replace the "2 team seats" line item with a Publisher-only feature that has shipped — recommend "Priority email support" or "Advanced analytics" depending on which other v1 features land.
3. **(Deletion gate — confirm before executing)** Update Stripe product description for Publisher tier in Stripe Dashboard (manual operator action — Claude Code cannot do this). Match pricing page exactly.
4. Update `CLAUDE.md` persona for "Elena, indie romance author" — strike the collaboration use case for v1, mark as v2.
5. Add to `docs/DEFERRED_TO_VNEXT.md` (created by R-TASK-149) with the full Path B design notes preserved below for v2 reference.
6. **DO NOT** create `supabase/migrations/007_team_memberships.sql` for v1. The migration file shipped in this remediation packet is preserved as a v2 reference but must not be applied to the v1 database. Move it to `supabase/migrations-vnext/` or rename it `007_team_memberships.sql.vnext` so Supabase migration runner does not pick it up.
7. **(Deletion gate — confirm before executing)** Strike all team-seat scaffolding from R-TASK-102 (account deletion), R-TASK-111 (audit log), R-TASK-133 (RLS isolation tests). Single-user-per-account is the v1 RLS contract.

**Files to modify:** `app/pricing/page.tsx`, `docs/ENGINEERING_DECISIONS.md`, `CLAUDE.md`, `docs/DEFERRED_TO_VNEXT.md`

**File to neutralize (do NOT apply):** `supabase/migrations/007_team_memberships.sql` — rename to `.vnext` suffix or move to `migrations-vnext/`

**Tests required:**
- AT-101A-1: Pricing page does not contain the strings "team seat", "team seats", "seats", "invite", "collaborator", or "team member" anywhere
- AT-101A-2: Stripe Publisher product description matches pricing page word-for-word (manual operator check, screenshot in PR)
- AT-101A-3: Decisions log Decision #7 has revision note dated 2026-05-05
- AT-101A-4: `grep -r "team_membership\|team_seats\|invite" app/ lib/ components/ --include='*.tsx' --include='*.ts'` returns zero matches in v1 code
- AT-101A-5: Migration runner (e.g., `supabase db push --dry-run`) does not pick up `007_team_memberships.sql`

## Path B — DEFERRED TO v2 (preserved for reference only — DO NOT IMPLEMENT)

> **Migration deferral note (per Path A locked 2026-05-05):** Migration 007 (`007_team_memberships.sql`) and migration 008 (`008_books_rls_team.sql`) are both deferred to v2. Migration 007 ships in this packet with the `.vnext` suffix. Migration 008 is **not** to be created in v1. Both files together implement the team-seat surface area; one without the other is incomplete. If v2 reintroduces team seats, both migrations land together.

If chosen:
1. Create migration `007_team_memberships.sql` (see `supabase/migrations/007_team_memberships.sql` in this packet)
2. Add `lib/team.ts` with seat enforcement helpers (resolveActiveTeam, canAccessBook, listTeamMembers)
3. Add invitation flow:
   - `app/api/team/invite/route.ts` — POST: create invitation row, send Resend email
   - `app/api/team/accept/[token]/route.ts` — GET: render accept page; POST: bind to invited user's profile
   - `app/team/invitations/page.tsx` — pending invitations UI
4. Modify book CRUD (TASK-017) to query through team membership, not just user_id
5. Update RLS policies on `books`, `chapters`, `audio_chunks` to allow access via team membership (not only owner)
6. Add team-switcher UI component (analogous to WoulfAI CompanySwitcher pattern referenced in WoulfAI standing orders, though not used here)
7. Add seat-count enforcement in `lib/subscription.ts` — reject invitations beyond `TIER_LIMITS[tier].team_seats`
8. New Stripe webhook handling: when subscription downgrades, downgrade extra seats (block writes from removed seats, don't delete data)

Files to create: `supabase/migrations/007_team_memberships.sql`, `lib/team.ts`, `app/api/team/invite/route.ts`, `app/api/team/accept/[token]/route.ts`, `app/team/invitations/page.tsx`, `components/TeamSwitcher.tsx`, `emails/team-invitation.tsx`

Files to modify: `app/api/books/route.ts`, `app/api/books/[id]/route.ts`, `app/api/chapters/[bookId]/route.ts`, `app/api/audio/[bookId]/[chapterIdx]/route.ts`, `lib/subscription.ts`, `lib/api-auth.ts` (add `effectiveBookOwnerId(user, bookId)` helper), `supabase/migrations/002_books.sql` (RLS policy update — write a separate migration `008_books_rls_team.sql` rather than editing migration 002)

Tests required:
- AT-101B-1: Owner can invite up to 1 additional seat (Publisher tier 2 seats = owner + 1 invited)
- AT-101B-2: Invited user can read/edit owner's books after accepting
- AT-101B-3: Invited user cannot read books from other owners (RLS still scoped per-team)
- AT-101B-4: Downgrade to Author tier removes seat access (book remains, additional seat user blocked from edit)
- AT-101B-5: Invitation email delivers and accept link works
- AT-101B-6: User can decline invitation; invitation_status='declined'

## Decision Record

**Locked 2026-05-05** by Steve Macurdy. Path A — defer team seats to v2.

Rationale (preserved): team seats add ~6 sessions of work, double the surface area of every book/chapter/audio API route, and the "Elena, indie romance author publishing 4 books/year" persona analysis does not strongly require collaboration in v1. Removing the marketing claim is a 30-minute change that closes the gap. Implementing team seats in v1 would also raise the cost of every other Phase 11 task because RLS isolation tests (R-TASK-133), audit logging (R-TASK-111), and account deletion (R-TASK-102) would each need to handle the multi-actor case.

This decision can be revisited for v2 after v1 launch metrics are collected. The Path B design above is the starting point for that v2 work.

## Session Notes
2026-05-05: Path A locked. Steve Macurdy. Awaiting Phase 11 task pickup by Claude Code.
