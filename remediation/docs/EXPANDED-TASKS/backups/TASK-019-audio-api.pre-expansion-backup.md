# TASK-019: Audio Upload/Retrieve/Delete API

## Status: NOT STARTED
## Priority: HIGH
## Phase: 3
## Estimated Sessions: 2
## Dependencies: TASK-006,TASK-014
## Requirements Covered: R10
## Spec Reference: Section 3.9

## Files to Create/Modify
app/api/audio/[bookId]/[chapterIdx]/route.ts

## Implementation Requirements
POST: verifyToken, check can_upload_audio, accept FormData with 'audio' field, verify book ownership, upload to storage at {userId}/{bookId}/chapter_{idx}.webm with upsert:true, upsert audio_chunks row, return signed URL. GET: verifyToken, lookup audio_chunks, create 1-hour signed URL. DELETE: verifyToken, delete storage file + DB row. Max file size: 50MB.

## Tests Required
AT-042: Upload stores file and creates DB row. AT-043: GET returns playable signed URL. AT-044: DELETE cleans up both storage and DB.

## Session Notes
_(Filled by Claude Code during implementation)_
