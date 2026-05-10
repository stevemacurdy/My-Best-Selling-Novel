# TASK-032: S0 Genre Scanner

## Status: NOT STARTED
## Priority: CRITICAL
## Phase: 5
## Estimated Sessions: 1
## Dependencies: TASK-028,TASK-030
## Requirements Covered: R12
## Spec Reference: Section 5.6

## Files to Create/Modify
components/agent/S0_GenreScanner.tsx

## Implementation Requirements
Port function S0 verbatim. Replace ai() call with useAI() hook. Preserve all 12 fallback genres, Show 12 More logic, custom genre input, genre color mapping.

## Tests Required
AT-032: All features described above work as specified. npm run build passes.

## Session Notes
_(Filled by Claude Code during implementation)_
