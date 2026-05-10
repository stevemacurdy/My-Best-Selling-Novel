# TASK-025: Lifetime Payment Handling

## Status: NOT STARTED
## Priority: HIGH
## Phase: 4
## Estimated Sessions: 1
## Dependencies: TASK-024
## Requirements Covered: R29
## Spec Reference: Section 4.6

## Files to Create/Modify
Updates to webhook + subscription logic

## Implementation Requirements
In webhook: detect checkout.session.completed with mode='payment' and metadata.tier. Insert into subscriptions with status='lifetime'. Update profiles: subscription_tier=tier, subscription_status='lifetime', subscription_period_end=NULL (no expiry). In lib/subscription.ts: isLifetime() returns true when status='lifetime'. Monthly limits still apply and reset.

## Tests Required
AT-056: Lifetime purchase sets correct tier. AT-057: Lifetime users retain access after monthly reset.

## Session Notes
_(Filled by Claude Code during implementation)_
