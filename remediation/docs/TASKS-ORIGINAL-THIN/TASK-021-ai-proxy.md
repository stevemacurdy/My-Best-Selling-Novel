# TASK-021: Claude AI Proxy Route

## Status: NOT STARTED
## Priority: CRITICAL
## Phase: 4
## Estimated Sessions: 2
## Dependencies: TASK-006,TASK-016
## Requirements Covered: R9,R24
## Spec Reference: Section 4.2

## Files to Create/Modify
app/api/ai/route.ts

## Implementation Requirements
POST: verifyToken, check ai_calls_this_month < TIER_LIMITS[tier].ai_calls_per_month, parse body {prompt, system, max_tokens, step_name, function_name, book_id}, call getClaude().messages.create with model claude-sonnet-4-20250514 and max_tokens capped at 16384, extract text from content blocks, log to ai_usage_logs (fire-and-forget), call sb.rpc('increment_ai_usage'), return {content, usage}. On 403 return limit message.

## Tests Required
AT-046: Valid calls return AI content. AT-047: Over-limit calls return 403. AT-048: Usage counter increments.

## Session Notes
_(Filled by Claude Code during implementation)_
