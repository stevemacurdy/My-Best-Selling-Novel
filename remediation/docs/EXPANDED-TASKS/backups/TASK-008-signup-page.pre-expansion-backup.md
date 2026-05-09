# TASK-008: Signup Page

## Status: NOT STARTED
## Priority: CRITICAL
## Phase: 2
## Estimated Sessions: 2
## Dependencies: TASK-004,TASK-002
## Requirements Covered: R2
## Spec Reference: Section 2.3

## Files to Create/Modify
app/(auth)/signup/page.tsx

## Implementation Requirements
Client component with form: Full Name, Email, Password fields. Gold/navy theme styling. Call sb.auth.signUp({ email, password, options: { data: { full_name } } }). Show inline error messages. On success redirect to /app. Include link to /signin. Include Terms of Service checkbox linking to /terms.

## Tests Required
AT-014: Form renders with all fields. AT-015: Signup creates user in Supabase. AT-016: Error displays for duplicate email.

## Session Notes
_(Filled by Claude Code during implementation)_
