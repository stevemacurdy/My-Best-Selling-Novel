# TASK-023: Stripe Portal Route

## Status: NOT STARTED
## Priority: HIGH
## Phase: 4
## Estimated Sessions: 1
## Dependencies: TASK-005,TASK-006
## Requirements Covered: R6
## Spec Reference: Section 4.4

## Files to Create/Modify
app/api/stripe/portal/route.ts

## Implementation Requirements
POST: verifyToken, get stripe_customer_id from profile, create billingPortal session with return_url, return session.url. Return 400 if no stripe_customer_id.

## Tests Required
AT-051: Portal URL returns for subscribed users. AT-052: 400 returned for users without Stripe customer.

## Session Notes
_(Filled by Claude Code during implementation)_
