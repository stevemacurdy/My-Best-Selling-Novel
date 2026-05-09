# CLAUDE.md

Standing instructions for Claude Code sessions in this repo. Read at the start of every session.

## Commit conventions

- **No AI trailers.** Plain commit messages only — subject line plus optional body. Never append `Co-Authored-By: Claude...` or `🤖 Generated with Claude Code` trailers, even though Claude Code's defaults emit them. This overrides the default behavior. Standing rule from operator (2026-05-09).
- Conventional-commit prefixes are in use: `feat:`, `fix:`, `docs:`, `chore:`, optionally with a scope (e.g., `fix(brand):`).
- One logical change per commit. TASK-NNN deliverables get their own commits.

## Env-var ownership convention

R-TASK env-var additions are owned by their R-TASK spec, not patched into TASK-003. TASK-003's expanded spec defines the **runtime contract** (22 vars at v1). R-TASKs that add build-time or feature-specific vars (e.g., R-TASK-106 adds `SENTRY_AUTH_TOKEN`, `SENTRY_ORG`, `SENTRY_PROJECT`) own those additions in their own spec.

`.env.local.example` is the **unified runtime+buildtime surface** where both sets coexist. Its header count may exceed TASK-003's runtime count; this is expected, not drift. Do not back-patch R-TASK-introduced vars into the TASK-003 spec.

When adding a new env var: update the owning task's spec, add the var to `.env.local.example` with a `# Phase N — TASK-ID` inline comment, and update the file's header count. Don't touch TASK-003 unless a v1 runtime var is being added or removed.

## Build spec

The canonical build spec lives in `remediation/`. Start with `remediation/REMEDIATION_OVERVIEW.md` (v4 changelog at the bottom is the most current state). Decisions locked 2026-05-05; ADR-004 voided 2026-05-06 (lifetime tier eliminated).

- 68 original tasks (`remediation/docs/EXPANDED-TASKS/TASK-001..068`) plus 41 R-TASKs and 3 PATCHes (`remediation/docs/TASKS/`)
- Phase order is dictated by `remediation/docs/PROGRESS.md`
- Ship vendor accounts ahead of their owning phase per the inline phase comments in `.env.local.example`
