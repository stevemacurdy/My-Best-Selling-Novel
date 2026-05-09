# TASK-007: Next.js Middleware

## Status: NOT STARTED
## Priority: CRITICAL
## Phase: 2
## Estimated Sessions: 1
## Dependencies: TASK-004
## Requirements Covered: R19
## Spec Reference: Section 2.2

## Files to Create/Modify
middleware.ts

## Implementation Requirements
Root middleware.ts using createServerClient from @supabase/ssr. Cookie handlers for get/set/remove. Call await supabase.auth.getUser() to refresh session. Export config.matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'].

## Tests Required
AT-013: Middleware refreshes session on every navigation.

## Session Notes
_(Filled by Claude Code during implementation)_
