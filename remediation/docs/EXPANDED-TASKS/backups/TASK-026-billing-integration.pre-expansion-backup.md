# TASK-026: Billing Integration Test

## Status: NOT STARTED
## Priority: HIGH
## Phase: 4
## Estimated Sessions: 1
## Dependencies: TASK-024,TASK-025
## Requirements Covered: R5
## Spec Reference: Section 4.7

## Files to Create/Modify
Manual testing checklist

## Implementation Requirements
Test with Stripe CLI: stripe listen --forward-to localhost:3000/api/stripe/webhook. Test card 4242424242424242. Verify: monthly checkout → webhook → tier update, annual checkout → webhook → tier update, lifetime payment → webhook → tier='author' + status='lifetime', portal opens, cancel sets cancel_at_period_end, deletion downgrades to explorer.

## Tests Required
AT-058: Full billing lifecycle passes for all 6 payment types.

## Session Notes
_(Filled by Claude Code during implementation)_
