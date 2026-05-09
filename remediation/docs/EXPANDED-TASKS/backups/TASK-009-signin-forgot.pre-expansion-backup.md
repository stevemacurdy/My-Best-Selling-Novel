# TASK-009: Signin and Forgot Password

## Status: NOT STARTED
## Priority: CRITICAL
## Phase: 2
## Estimated Sessions: 2
## Dependencies: TASK-004,TASK-002
## Requirements Covered: R2
## Spec Reference: Section 2.4

## Files to Create/Modify
app/(auth)/signin/page.tsx, app/(auth)/forgot/page.tsx

## Implementation Requirements
Signin: email + password form, call sb.auth.signInWithPassword, redirect to /app on success, show errors inline, link to /signup and /forgot. Forgot: email field, call sb.auth.resetPasswordForEmail, show confirmation message, link back to /signin.

## Tests Required
AT-017: Signin authenticates valid credentials. AT-018: Forgot password sends reset email.

## Session Notes
_(Filled by Claude Code during implementation)_
