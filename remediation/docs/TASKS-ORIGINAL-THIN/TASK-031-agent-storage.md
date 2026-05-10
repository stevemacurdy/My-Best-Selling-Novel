# TASK-031: Agent Storage with Smart Diff

## Status: NOT STARTED
## Priority: CRITICAL
## Phase: 5
## Estimated Sessions: 2
## Dependencies: TASK-017,TASK-018
## Requirements Covered: R23,R24
## Spec Reference: Section 5.5

## Files to Create/Modify
components/agent/storage.ts

## Implementation Requirements
Create saveB that tracks which top-level book state keys changed since last save, sends only changed fields via PUT /api/books/[id]. Chapter content changes go to PUT /api/chapters/[bookId]/[index]. Create loadB that fetches book + chapters and assembles into agent's expected state shape. Create loadLib for book list.

## Tests Required
AT-031: All features described above work as specified. npm run build passes.

## Session Notes
_(Filled by Claude Code during implementation)_
