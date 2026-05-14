# MyBSN v4.2 Recovery Packet — Agent Source Artifacts

## What this is

The three agent source files from the original 68-task package that are required for Phase 5 (TASK-027 through TASK-042) verbatim ports per ADR-003. Missing from both the v4 packet and the v4.1 recovery packet.

## Files

- **`bestseller_book_agent.jsx`** (169KB) — The main agent source. Contains all 12 step components (S0 through S11), shared UI primitives, helper functions, AI call wrappers, storage helpers, type definitions, and the top-level agent shell. This is what TASK-027 through TASK-042 port FROM.

- **`bestseller_agent_tutorial.md`** (13KB) — Agent design documentation and tutorial. Explains the 12-step writing workflow at a conceptual level. Useful context for understanding the agent's intent before porting individual steps.

- **`bestseller_demo.jsx`** (33KB) — Demo/example file showing the agent in use. May contain integration patterns useful for TASK-042 (agent shell wiring).

## Where to put these files

Unzip this packet at the **root of your `My-Best-Selling-Novel` repo**. It will create:

```
remediation/source/
  bestseller_book_agent.jsx
  bestseller_agent_tutorial.md
  bestseller_demo.jsx
```

This sits as a sibling to `remediation/docs/`, `remediation/supabase/`, etc. The TASK-027-042 specs in `remediation/docs/TASKS-ORIGINAL-THIN/` reference these source files by relative path.

## How to install

From your repo root (`~/code/My-Best-Selling-Novel`):

```bash
# Drop the zip in the repo root, then:
unzip mybsn_v4_2_agent_source_recovery.zip
rm mybsn_v4_2_agent_source_recovery.zip

# Verify
ls -la remediation/source/
# Should show all 3 files totaling ~215KB

# Commit
git add remediation/source/
git commit -m "docs(spec): v4.2 recovery — agent source JSX + tutorial for Phase 5 verbatim ports"
git push
```

## What to tell Claude Code after install

```
Agent source artifacts landed at remediation/source/. The three files are:
- bestseller_book_agent.jsx (169KB; the full agent source, S0-S11 + shell + utilities)
- bestseller_agent_tutorial.md (13KB; agent design documentation)
- bestseller_demo.jsx (33KB; demo/integration example)

Resume with Phase 5 — Agent ports. Per ADR-003 these are VERBATIM ports of `remediation/source/bestseller_book_agent.jsx` split into the 16 task files at `remediation/docs/TASKS-ORIGINAL-THIN/TASK-027-*.md` through `TASK-042-*.md`.

Sequence:
1. Start with TASK-027 (agent-types). Read the spec + the source JSX, port the type definitions to the file path the spec specifies. Most types should already exist in `types/supabase.ts` from Phase 3; cross-reference rather than duplicate.
2. Then TASK-028 (shared UI) → 029 (helpers) → 030 (AI call wrappers) → 031 (storage helpers) in order. These are the foundation utilities the step components import.
3. Then TASK-032 through TASK-041 — the actual S0-S11 step components.
4. Finally TASK-042 — the agent shell that orchestrates everything.

Strict verbatim port per ADR-003: don't redesign the agent, don't optimize, don't refactor patterns. Move working code into the production codebase with minimal change so we can validate end-to-end and iterate later.

Halt after every 2-3 tasks for operator review. Phase 5 is 16 tasks; we won't land all of them in one session.

Cross-binds to verify before each port:
- lib/anthropic.ts exists from TASK-005 — agent AI calls go through this
- lib/api-auth.ts from TASK-006 — for any agent endpoints that need auth
- supabase/migrations/ has the books/chapters/audio_chunks tables — agent state persists here
- ai_usage_logs table + increment_ai_usage RPC from migration 006 — agent calls instrument through these

Begin TASK-027. After your spec read + source read, summarize what's about to be ported and halt for greenlight before writing code.
```

## Why this happened (post-mortem)

The v4 packet bundled the `remediation/` tree but omitted the `source/` subdirectory because the build script was written before the source artifacts were considered part of the deliverable surface — they were thought of as "reference materials already in the original 68-task package." The v4.1 recovery added the thin task specs but didn't add the source artifacts they reference. v4.2 closes the loop.

After install, your packet surface is finally complete:
- 44 expanded task specs at `remediation/docs/EXPANDED-TASKS/`
- 24 thin original task specs at `remediation/docs/TASKS-ORIGINAL-THIN/`
- 34 R-TASKs and PATCHes at `remediation/docs/TASKS/`
- 3 agent source artifacts at `remediation/source/`
- All migrations, ADRs, decisions, audits, and supporting docs unchanged

This is the complete spec surface for the v4.x family.

---

*Recovery packet v4.2 generated 2026-05-14 against operator's My-Best-Selling-Novel repo at GitHub stevemacurdy/My-Best-Selling-Novel.*
