# TASK-006: Auth Verification Library

## Status: NOT STARTED
## Priority: CRITICAL
## Phase: 2
## Estimated Sessions: 1
## Dependencies: TASK-004
## Requirements Covered: R9,R21
## Spec Reference: Section 2.1

## Files to Create/Modify
lib/api-auth.ts

## Implementation Requirements
Export interface AuthUser { id: string; email: string; tier: 'explorer'|'author'|'publisher'; role: 'user'|'admin'; ai_calls_this_month: number; }. Export async function verifyToken(req: NextRequest): Promise<AuthUser|null> — extracts Bearer token from Authorization header, calls sb.auth.getUser(token), joins profiles for tier+role+usage, returns AuthUser or null. Export unauthorized() and forbidden(reason) response helpers. This is the ONLY auth function in the entire codebase.

## Tests Required
AT-010: verifyToken returns AuthUser for valid token. AT-011: verifyToken returns null for invalid/missing token. AT-012: unauthorized() returns 401 JSON.

## Session Notes
_(Filled by Claude Code during implementation)_
