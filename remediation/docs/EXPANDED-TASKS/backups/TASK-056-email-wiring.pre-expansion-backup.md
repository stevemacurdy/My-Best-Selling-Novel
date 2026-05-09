# TASK-056: Email API and Wiring

## Status: NOT STARTED
## Priority: MEDIUM
## Phase: 8
## Estimated Sessions: 1
## Dependencies: TASK-054,TASK-055
## Requirements Covered: R22
## Spec Reference: Section 8.3

## Files to Create/Modify
Updates to signup and webhook

## Implementation Requirements
Wire welcome email send into signup success flow. Wire upgrade email send into webhook subscription.created handler. Both fire-and-forget (do not block the main flow).

## Tests Required
AT-056: All features described above work as specified. npm run build passes.

## Session Notes
_(Filled by Claude Code during implementation)_
