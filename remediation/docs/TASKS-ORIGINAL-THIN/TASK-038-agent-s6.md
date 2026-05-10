# TASK-038: S6 Write & Record

## Status: NOT STARTED
## Priority: CRITICAL
## Phase: 5
## Estimated Sessions: 2
## Dependencies: TASK-028,TASK-030,TASK-019
## Requirements Covered: R12,R10
## Spec Reference: Section 5.12

## Files to Create/Modify
components/agent/S6_WriteRecord.tsx

## Implementation Requirements
Port function S6 verbatim. Write mode: AI Write with 16384 max_tokens, voice matching, anti-scrambling. Record mode: upload audio via /api/audio routes (replacing window.storage), play/replace/delete, ACX checklist, recording tips.

## Tests Required
AT-038: All features described above work as specified. npm run build passes.

## Session Notes
_(Filled by Claude Code during implementation)_
