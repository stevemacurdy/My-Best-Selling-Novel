# TASK-004: Supabase Client Library

## Status: NOT STARTED
## Priority: HIGH
## Phase: 1
## Estimated Sessions: 2
## Dependencies: TASK-001
## Requirements Covered: R2,R9
## Spec Reference: Section 1.4

## Files to Create/Modify
lib/supabase/client.ts, lib/supabase/server.ts

## Implementation Requirements
Browser client: createBrowserClient from @supabase/ssr using NEXT_PUBLIC env vars. Server client: createServerClient with cookie get/set/remove handlers from next/headers. Accept optional { service: boolean } param — when true, use SUPABASE_SERVICE_ROLE_KEY instead of anon key. This is ONLY used by the Stripe webhook handler.

## Tests Required
AT-006: Browser client creates without error. AT-007: Server client handles cookies correctly.

## Session Notes
_(Filled by Claude Code during implementation)_
