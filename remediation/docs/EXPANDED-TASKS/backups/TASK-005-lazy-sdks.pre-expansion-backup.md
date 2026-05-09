# TASK-005: Lazy SDK Clients

## Status: NOT STARTED
## Priority: HIGH
## Phase: 1
## Estimated Sessions: 1
## Dependencies: TASK-001
## Requirements Covered: R7,R20
## Spec Reference: Section 1.5

## Files to Create/Modify
lib/stripe.ts, lib/claude.ts, lib/resend.ts

## Implementation Requirements
Each file follows identical pattern: let _client: Type | null = null; export function getClient(): Type { if (!_client) _client = new Type(process.env.KEY!); return _client; }. Stripe uses apiVersion '2024-11-20.acacia'. Claude uses Anthropic SDK. Resend uses Resend class. NEVER instantiate at module level.

## Tests Required
AT-008: All three getters return valid clients. AT-009: No SDK instantiated at import time.

## Session Notes
_(Filled by Claude Code during implementation)_
