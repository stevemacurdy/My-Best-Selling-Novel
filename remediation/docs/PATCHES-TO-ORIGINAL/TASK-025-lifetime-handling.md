<!-- APPLY: REPLACE -->
<!-- Target: docs/TASKS/TASK-025-lifetime-handling.md (in original mybsn package) -->

# TASK-025: Lifetime Handling — DELETED 2026-05-06

## Status: DELETED — DO NOT IMPLEMENT
## Priority: N/A
## Phase: N/A
## Dependencies: N/A

## Reason for deletion

The lifetime tier was eliminated entirely on 2026-05-06 per operator decision (PATCH-3
Q-8.2). With no lifetime SKU in the product, this task has no implementation target.

The original task content is preserved at:
`docs/PATCHES-TO-ORIGINAL/backups/TASK-025-lifetime-handling.pre-modification-backup.md`

**Do not implement this task. Do not restore this task without first reactivating the
lifetime tier in `ENGINEERING_DECISIONS.md` Decision #29.**

## Cascade documentation

Code that would have been written for TASK-025 is no longer needed:
- `lib/lifetime.ts` — N/A (no lifetime status to detect)
- `subscription_status='lifetime'` enum value — removed from migration 015 if present
- "Lifetime" tier label in UI — removed from TASK-045 pricing-page
- Lifetime confirmation email — removed from R-TASK-135 email suite (7 templates not 8)
- `NEXT_PUBLIC_LIFETIME_ENABLED` env var — removed from TASK-003

## Tests Required

None. Mechanical anti-test: a grep for "lifetime" across `lib/`, `app/`, and `components/`
should return zero matches in production code. Comments and revision-log entries are
permitted.

## Session Notes

Claude Code: when this task is encountered, mark complete with "Deleted per Decision #29
revision; no implementation required." Move on to TASK-026.
