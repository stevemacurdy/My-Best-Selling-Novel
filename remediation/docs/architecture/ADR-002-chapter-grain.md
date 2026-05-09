<!-- APPLY: CREATE -->
# ADR-002: Chapters as table rows; defer versioning to v2

## Status
Accepted (2026-05-04)

## Context

Per audit OBSERVATION-002 (LIKELY-MISMATCH), Decision #22 split book content from a single JSONB column into a `chapters` table — one row per chapter with `content TEXT` and `UNIQUE(book_id, chapter_index)`. This is correct for v1.

However, chapters at scale present challenges:
- Some chapters can be 12,000+ words (~80KB of text per row)
- Smart-diff auto-save during active writing produces high write rates against a single row
- Without versioning, the "I lost 30 minutes of work" support tickets cannot be resolved beyond Supabase 7-day PITR
- Team-seat collaborative editing (R-TASK-101 Path B, deferred to v2) would introduce concurrent writes to the same chapter — relevant when team seats are revisited

Alternative grains considered:
- Chapter-with-versioning: separate `chapter_versions` table; `chapters.content` stores current; versions accumulate as edits are made
- Paragraph-level chunking: each paragraph is a row; smart-diff operates at paragraph level; better for collaborative editing

## Decision

**Keep chapters-as-rows for v1.** Add `chapter_versions` to `docs/DEFERRED_TO_VNEXT.md` (R-TASK-149) with target = v2 (paired with team-seat reintroduction per R-TASK-101 Path A locked).

## Rationale

For v1 (single-user editing, no collaboration):
- The chapter-row grain works fine
- Smart-diff against a single row is straightforward
- "Lost work" tickets are rare at v1 customer counts; PITR resolves them when they occur
- Adding versioning at v1 doubles the data footprint and adds complexity without solving a real problem

For v1.1 / v2 (when collaboration ships):
- Versioning becomes necessary to resolve "who overwrote whose change" and "I lost X minutes of work" cleanly
- Migration from current grain to versioned grain is mechanical: move current `content` to `chapter_versions` row with `is_current=true`, keep `chapters.content` as denormalized cache of the current version

## Consequences

**Positive:**
- v1 keeps simple data model
- No engineering cost for versioning before customer demand

**Negative (accepted):**
- "I lost work" tickets at v1 resolved only via PITR (operator-driven, slow)
- Collaboration in v1.1 requires the versioning migration before shipping team-edit features

## Migration trigger

Initiate `chapter_versions` migration when **either**:
- Team seats are reintroduced post-v1 (R-TASK-101 Path A is locked for v1; if v2 reintroduces team seats, this trigger fires)
- A meaningful number of "lost work" tickets accumulate (>5/month indicates pattern, not noise)

## Related

- OBSERVATION-002 (audit)
- R-TASK-101 (team seats decision)
- R-TASK-149 (deferred-to-vnext list)
