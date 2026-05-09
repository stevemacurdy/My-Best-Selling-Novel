<!-- APPLY: REPLACE -->
<!-- Target: docs/TASKS/TASK-055-upgrade-email.md (in original mybsn package) -->

# TASK-055: Upgrade Confirmation Email

## Status: NOT STARTED
## Priority: MEDIUM
## Phase: 8
## Estimated Sessions: 1
## Dependencies: TASK-005, TASK-024
## Requirements Covered: R31
## Spec Reference: Section 8.2

## Pre-flight: re-read current state

If `emails/upgrade-confirmation.tsx` already exists, view it. Confirm: (a) lifetime
variant is removed (per Decision #29 revision 2026-05-06; was originally going to
have a distinct lifetime template per ADR-004 surrounding controls). Scope to remaining
work.

## Files to Create/Modify
`emails/upgrade-confirmation.tsx`

## Implementation Requirements

React Email template sent on `customer.subscription.created` webhook event. Contains:
- Welcome to {tier} message
- Summary of features unlocked
- Link to /account/billing
- Link to /help
- Unsubscribe footer (commercial email, CAN-SPAM compliant per R-TASK-135 / GAP-080)

**Removed 2026-05-06:** lifetime confirmation variant. R-TASK-135 specifies the email
template suite at 7 templates (was 8 — lifetime confirmation removed when lifetime
tier eliminated). The single upgrade-confirmation template handles both monthly and
annual upgrades; tier prop differentiates copy.

Triggered from webhook handler (TASK-024) on subscription.created event.

## Tests Required
AT-095: Renders correctly with tier='author' and tier='publisher' props. AT-096: Renders
with cycle='monthly' and cycle='annual'. AT-097: Does NOT render with cycle='lifetime'
— prop type rejects this value (TypeScript compile-time check).

## Session Notes
_(Filled by Claude Code during implementation)_
