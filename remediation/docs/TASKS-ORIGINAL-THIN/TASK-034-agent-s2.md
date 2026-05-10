# TASK-034: S2 Upload & Organize

## Status: NOT STARTED
## Priority: CRITICAL
## Phase: 5
## Estimated Sessions: 2
## Dependencies: TASK-028,TASK-030
## Requirements Covered: R12
## Spec Reference: Section 5.8

## Files to Create/Modify
components/agent/S2_UploadOrganize.tsx

## Implementation Requirements
Port function S2 verbatim — THREE-PATH system (blob, outline, written). Preserve chunked blob analysis, 12-tone chapter selector, local regex chapter splitter with all 6 heading patterns, voice analysis, large file display (>50K words), PDF/DOCX/TXT parsing. This is the largest component (~300 lines).

## Tests Required
AT-034: All features described above work as specified. npm run build passes.

## Session Notes
_(Filled by Claude Code during implementation)_
