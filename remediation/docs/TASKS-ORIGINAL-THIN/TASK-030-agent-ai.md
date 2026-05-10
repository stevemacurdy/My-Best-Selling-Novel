# TASK-030: Agent AI Caller

## Status: NOT STARTED
## Priority: CRITICAL
## Phase: 5
## Estimated Sessions: 1
## Dependencies: TASK-006
## Requirements Covered: R9,R14
## Spec Reference: Section 5.4

## Files to Create/Modify
components/agent/ai.ts

## Implementation Requirements
Create useAI hook that gets Supabase session, calls fetch('/api/ai') with Bearer token, handles UsageLimitError (403), returns content string. This replaces the direct Claude API fetch in the original agent.

## Tests Required
AT-030: All features described above work as specified. npm run build passes.

## Session Notes
_(Filled by Claude Code during implementation)_
