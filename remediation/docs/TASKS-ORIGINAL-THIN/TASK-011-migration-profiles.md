# TASK-011: Migration: profiles

## Status: NOT STARTED
## Priority: CRITICAL
## Phase: 3
## Estimated Sessions: 1
## Dependencies: TASK-004
## Requirements Covered: R2,R31
## Spec Reference: Section 3.1

## Files to Create/Modify
supabase/migrations/001_profiles.sql

## Implementation Requirements
CREATE TABLE profiles with: id UUID PK references auth.users, email TEXT UNIQUE, full_name TEXT, role TEXT DEFAULT 'user' CHECK IN ('user','admin'), subscription_tier TEXT DEFAULT 'explorer' CHECK IN ('explorer','author','publisher'), subscription_status, subscription_period_end, ai_calls_this_month INT DEFAULT 0, ai_calls_reset_at, stripe_customer_id TEXT UNIQUE, onboarded_at. Trigger handle_new_user on auth.users insert. RLS: users read/update own profile. Indexes on stripe_customer_id and email.

## Tests Required
AT-021: Table creates. AT-022: Trigger fires on user creation. AT-023: RLS prevents cross-user reads.

## Session Notes
_(Filled by Claude Code during implementation)_
