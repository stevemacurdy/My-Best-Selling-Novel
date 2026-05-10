# TASK-015: Migration: subscriptions + usage

## Status: NOT STARTED
## Priority: HIGH
## Phase: 3
## Estimated Sessions: 1
## Dependencies: TASK-011
## Requirements Covered: R4,R20
## Spec Reference: Section 3.5

## Files to Create/Modify
supabase/migrations/005_subscriptions.sql, 006_ai_usage_logs.sql

## Implementation Requirements
subscriptions table: id TEXT PK (Stripe sub ID), user_id, stripe_customer_id, stripe_price_id, tier CHECK, status CHECK, current_period_start/end, cancel_at_period_end, canceled_at. ai_usage_logs: id UUID PK, user_id, book_id, step_name, function_name, input/output/total_tokens, model, latency_ms, success, error_message. RPC increment_ai_usage(p_user_id UUID) as SECURITY DEFINER.

## Tests Required
AT-032: Both tables create. AT-033: RPC increments counter atomically.

## Session Notes
_(Filled by Claude Code during implementation)_
