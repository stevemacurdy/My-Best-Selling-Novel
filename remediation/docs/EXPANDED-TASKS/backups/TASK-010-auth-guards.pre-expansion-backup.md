# TASK-010: AuthGuard and AdminGuard

## Status: NOT STARTED
## Priority: HIGH
## Phase: 2
## Estimated Sessions: 1
## Dependencies: TASK-004
## Requirements Covered: R18
## Spec Reference: Section 2.5

## Files to Create/Modify
components/AuthGuard.tsx, components/AdminGuard.tsx

## Implementation Requirements
AuthGuard: client component, calls sb.auth.getUser(), redirects to /signin if null, shows loading spinner while checking. AdminGuard: extends AuthGuard, additionally checks profiles.role === 'admin', redirects to /app if not admin.

## Tests Required
AT-019: Unauthenticated users redirected to /signin. AT-020: Non-admin users redirected from /admin.

## Session Notes
_(Filled by Claude Code during implementation)_
