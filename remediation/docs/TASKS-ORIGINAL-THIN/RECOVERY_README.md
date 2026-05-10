# MyBSN v4.1 Recovery Packet — Original Thin Task Specs

## What this is

The 24 original task specs that were **NOT included** in the v4 remediation packet (`mybsn_remediation_packet_v4.zip`).

The v4 packet shipped with **44 expanded** task specs at `remediation/docs/EXPANDED-TASKS/` plus 17 v1 content cluster R-TASKs and supporting docs. The remaining 24 original task specs were marked "appropriately thin per protocol" — meaning the prose/SQL/code in the spec is the artifact, no expansion needed. The protocol assumed those thin originals would be merged in alongside the v4 packet from the original 68-task package (`mybestsellingnovel_build_package.zip`). That merge never happened on the operator's local repo because the original package was never delivered to the operator separately.

This recovery packet closes that gap.

## Where to put these files

Unzip this packet at the **root of your `My-Best-Selling-Novel` repo**. It will create a new directory:

```
remediation/docs/TASKS-ORIGINAL-THIN/
  TASK-011-migration-profiles.md
  TASK-012-migration-books.md
  ...
  TASK-042-agent-shell.md
```

This sits as a sibling to the existing `remediation/docs/EXPANDED-TASKS/` and `remediation/docs/TASKS/` directories. Three task-spec directories with distinct purposes:

| Directory | Purpose | Count |
|---|---|---|
| `EXPANDED-TASKS/` | Original tasks that were expanded into detailed specs | 44 |
| `TASKS/` | R-TASKs (additions/refinements) and PATCHes | 34 |
| `TASKS-ORIGINAL-THIN/` (new) | Original thin specs that don't need expansion | 24 |

Total task specs in the repo after recovery: 102.

## What's in this packet

### Phase 3 — Migrations (5 specs, needed NOW)
- `TASK-011-migration-profiles.md` — profiles table + handle_new_user trigger
- `TASK-012-migration-books.md` — books table + RLS
- `TASK-013-migration-chapters.md` — chapters table (per ADR-002 split from books-as-JSONB)
- `TASK-014-migration-audio.md` — audio_chunks table + storage bucket + storage RLS
- `TASK-015-migration-subs-usage.md` — subscriptions + ai_usage_logs + increment_ai_usage RPC

### Phase 4 — Patch-covered or deleted (3 specs, mostly reference)
- `TASK-021-ai-proxy.md` — covered by PATCH-001 (streaming + maxDuration); spec preserved for context
- `TASK-024-stripe-webhook.md` — covered by PATCH-002 (idempotency); spec preserved for context
- `TASK-025-lifetime-handling.md` — DELETED per A.3 cascade 2026-05-06; spec preserved as historical record

### Phase 5 — Agent ports (16 specs, ADR-003 verbatim port)
- `TASK-027-agent-types.md` — type definitions
- `TASK-028-agent-shared-ui.md` — shared UI primitives
- `TASK-029-agent-helpers.md` — helper functions
- `TASK-030-agent-ai.md` — AI call wrappers
- `TASK-031-agent-storage.md` — storage helpers
- `TASK-032` through `TASK-041` — Steps S0 through S11 (one or two steps per task file)
- `TASK-042-agent-shell.md` — top-level agent shell

Per ADR-003 (verbatim port), these specs are minimal because the source of truth is the original `bestseller_book_agent.jsx` file. Claude Code reads the source artifact and ports modules verbatim per ADR-003 splitting strategy.

## How to install

From your repo root (`~/code/My-Best-Selling-Novel`):

```bash
# Drop the zip in the repo root, then:
unzip mybsn_v4_1_recovery_packet.zip
rm mybsn_v4_1_recovery_packet.zip

# Verify
ls remediation/docs/TASKS-ORIGINAL-THIN/ | wc -l
# Should print 24

# Commit
git add remediation/docs/TASKS-ORIGINAL-THIN/
git commit -m "docs(spec): v4.1 recovery — 24 thin original task specs missing from v4 packet"
git push
```

## What to tell Claude Code after install

```
Recovery packet landed at remediation/docs/TASKS-ORIGINAL-THIN/. The 5 Phase 3 migration specs are TASK-011 through TASK-015 in that directory. Begin Phase 3.

For each migration:
1. Read the spec at remediation/docs/TASKS-ORIGINAL-THIN/TASK-NNN-*.md
2. Cross-reference with ENGINEERING_DECISIONS.md, ADR-002 (chapter grain), AUDIT_REPORT.md, lib/api-auth.ts (for actual column references), and the existing R-TASK migrations at remediation/supabase/migrations/ (009-015) which reference these base tables via FK
3. Write the migration SQL at supabase/migrations/00N_name.sql per the spec's "Files to Create/Modify" line
4. Apply via Supabase (npx supabase db push or the project's preferred apply mechanism)
5. Run npm run db:types after each migration to keep types/supabase.ts current
6. Commit with message: feat: TASK-0NN migration <name>

Land all 5 migrations in sequence (TASK-011 first because others FK to profiles). Stop and confirm after all 5 land cleanly + db:types regeneration completes.

After Phase 3 lands, return to TASK-008 (signup-page) for Phase 2 resumption.
```

## Why this happened (post-mortem in one paragraph)

The v4 packet was assembled from `/home/claude/mybsn/mbsn/` in the previous Claude session's container. The build script copied the EXPANDED-TASKS, TASKS (R-TASKs), and supporting docs into the zip. The original thin task specs were considered "preserved by reference" because they were part of the assumed-merged-in original 68-task package. They were not preserved as files in the v4 zip. The operator's local repo therefore had no record of TASK-011..015's existence, even though those specs were canonical and needed for Phase 3 implementation. Caught at Phase 3 start; recovered cleanly.

## Status going forward

After recovery installation, the v4.1 packet state is:
- 44 expanded original tasks at `remediation/docs/EXPANDED-TASKS/`
- 24 thin original tasks at `remediation/docs/TASKS-ORIGINAL-THIN/` (this packet)
- 34 R-TASKs and PATCHes at `remediation/docs/TASKS/`
- All other v4 deliverables (ADRs, side docs, migrations, audit report) unchanged

This is the complete spec surface. Future packet rebuilds (v5+) should preserve all three task-spec directories.

---

*Recovery packet generated 2026-05-09 against operator's My-Best-Selling-Novel repo at GitHub stevemacurdy/My-Best-Selling-Novel.*
