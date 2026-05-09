# TASK-051: Admin Users API

## Status: NOT STARTED
## Priority: HIGH
## Phase: 7
## Estimated Sessions: 1
## Dependencies: TASK-006,TASK-011
## Requirements Covered: R30
## Spec Reference: Section 7.3

## Files to Create/Modify
app/api/admin/users/route.ts

## Implementation Requirements
GET: verifyToken + check role=admin. Paginated user list: profiles joined with book count and AI usage. Support search by email. Support filter by tier. Return 50 per page.

## Tests Required
AT-051: All features described above work as specified. npm run build passes.

## Session Notes
_(Filled by Claude Code during implementation)_
