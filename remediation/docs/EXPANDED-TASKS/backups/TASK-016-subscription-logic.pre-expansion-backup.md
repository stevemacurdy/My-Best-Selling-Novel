# TASK-016: Subscription Gating Logic

## Status: NOT STARTED
## Priority: HIGH
## Phase: 3
## Estimated Sessions: 1
## Dependencies: TASK-015
## Requirements Covered: R8,R17
## Spec Reference: Section 3.6

## Files to Create/Modify
lib/subscription.ts

## Implementation Requirements
Export TIER_LIMITS constant with explorer/author/publisher limits (max_books, ai_calls_per_month, can_export, can_upload_audio, can_use_folder_upload, priority_queue, team_seats). Export canPerform(tier, action) function. Export isLifetime(status) helper. Lifetime users have subscription_status = 'lifetime' and same monthly limits that reset.

## Tests Required
AT-034: TIER_LIMITS has all three tiers. AT-035: canPerform returns correct boolean for each tier/action combo.

## Session Notes
_(Filled by Claude Code during implementation)_
