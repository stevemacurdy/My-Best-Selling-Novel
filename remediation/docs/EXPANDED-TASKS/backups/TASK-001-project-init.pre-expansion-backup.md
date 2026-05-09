# TASK-001: Project Initialization

## Status: NOT STARTED
## Priority: CRITICAL
## Phase: 1
## Estimated Sessions: 2
## Dependencies: None
## Requirements Covered: R1,R25
## Spec Reference: Section 1.1

## Files to Create/Modify
package.json, tsconfig.json, next.config.js, .gitignore

## Implementation Requirements
Install exact dependencies: next@14.2.15, react@18.3.1, @supabase/ssr@0.5.2, @supabase/supabase-js@2.47.10, stripe@17.5.0, @anthropic-ai/sdk@0.32.1, resend@4.0.1, mammoth@1.8.0. Create tsconfig.json with path alias @/*. Create next.config.js with Supabase image remote patterns. Run npm run build to verify clean project.

## Tests Required
AT-001: npm run build passes with zero errors. AT-002: All dependencies in package.json match pinned versions.

## Session Notes
_(Filled by Claude Code during implementation)_
