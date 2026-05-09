# TASK-058: Google Analytics Integration

## Status: NOT STARTED
## Priority: MEDIUM
## Phase: 9
## Estimated Sessions: 1
## Dependencies: TASK-002
## Requirements Covered: R26
## Spec Reference: Section 9.1

## Files to Create/Modify
app/layout.tsx, lib/analytics.ts

## Implementation Requirements
Add GA4 script tag in layout.tsx using NEXT_PUBLIC_GA_MEASUREMENT_ID. Create lib/analytics.ts with trackEvent(name, params) helper. Track: page_view, sign_up, subscription_purchase, tour_complete, book_created, chapter_written.

## Tests Required
AT-058: All features described above work as specified. npm run build passes.

## Session Notes
_(Filled by Claude Code during implementation)_
