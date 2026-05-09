# TASK-049: Admin Metrics API

## Status: NOT STARTED
## Priority: HIGH
## Phase: 7
## Estimated Sessions: 2
## Dependencies: TASK-006,TASK-015
## Requirements Covered: R20,R30
## Spec Reference: Section 7.1

## Files to Create/Modify
app/api/admin/metrics/route.ts

## Implementation Requirements
GET: verifyToken + check role=admin. Aggregate queries: total users (COUNT profiles), new signups (COUNT WHERE created_at > intervals), active subscriptions by tier (GROUP BY subscription_tier WHERE status IN active/trialing/lifetime), MRR (sum monthly equivalent), total AI calls (SUM ai_calls_this_month), AI cost estimate (total_tokens * $0.003/1K), total books (COUNT books), top 10 users by AI usage.

## Tests Required
AT-049: All features described above work as specified. npm run build passes.

## Session Notes
_(Filled by Claude Code during implementation)_
