# TASK-042: Library + Agent Shell

## Status: NOT STARTED
## Priority: CRITICAL
## Phase: 5
## Estimated Sessions: 2
## Dependencies: TASK-032 through TASK-041
## Requirements Covered: R12,R23
## Spec Reference: Section 5.16

## Files to Create/Modify
components/agent/Library.tsx, components/agent/AgentShell.tsx, app/app/page.tsx

## Implementation Requirements
Port Library (multi-book cards, delete confirm, new book) and BestsellerBookAgent (step navigation, book state, auto-save effect with smart diff). Create app/app/page.tsx wrapping AgentShell in AuthGuard. Wire all 12 step components.

## Tests Required
AT-042: All features described above work as specified. npm run build passes.

## Session Notes
_(Filled by Claude Code during implementation)_
