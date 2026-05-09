<!-- APPLY: CREATE -->
# REMEDIATION OVERVIEW
## My Best Selling Novel — Audit Remediation Packet
## Generated 2026-05-04 | Source: AUDIT_REPORT.md (106 gaps, 6 observations)
## Decisions Locked 2026-05-05

---

## Locked decisions (operator-approved 2026-05-05)

1. **R-TASK-101 — Path A**. Team seats deferred to v2. Migration `007_team_memberships.sql` neutralized to `.vnext` suffix. Marketing copy must be updated; v1 RLS contract is single-user-per-account.
2. **ADR-003 — Approved**. Decision #11 split into 11a (AI prompts frozen, verbatim) and 11b (JSX modernizable behind golden-output behavioral tests). Five gated tasks unblocked: R-TASK-109, R-TASK-110, R-TASK-126, R-TASK-127, R-TASK-128.
3. **ADR-004 — Confirmed**. Lifetime tier remains gated behind `NEXT_PUBLIC_LIFETIME_ENABLED=false` until R-TASK-119, R-TASK-120, R-TASK-135 (lifetime variant), R-TASK-103, PATCH-002, and R-TASK-107 all ship. Pre-launch checklist (R-TASK-141) must verify all six before flag flip.

These decisions are now binding inputs to Claude Code for Phase 11 and Phase 12 work. The packet contains no remaining open decisions.

---

## How this packet integrates with your existing build

This packet does NOT replace your 68 existing TASK files. It ADDS:
- **2 new phases** (Phase 11 — Production Readiness, Phase 12 — Launch Operations) appended after your existing Phase 10
- **Patch instructions** that modify specific existing TASK files (TASK-021, TASK-024, TASK-011, etc.) with additions — not rewrites
- **New supporting files** (SQL migrations 007-012, new `lib/` modules, new email templates, runbooks, ADRs)
- **An updated PROGRESS.md** that threads new task IDs into existing phase order
- **An updated BUILD_STRATEGY.md** reflecting the added phases and dependency reordering

**Total new artifacts: 41 task files + 6 SQL migrations + 8 supporting files + 4 runbooks + 3 ADRs**

**Sequencing principle:** the patch tasks fix things in their original phase (e.g., maxDuration on /api/ai is patched in Phase 4 before launch). The new phases handle additions that don't fit existing phases (production-readiness infrastructure, launch operations setup). New phases run AFTER Phase 10 because they require the system to exist before instrumenting it — except where explicitly noted (e.g., Sentry SDK install runs in Phase 1 patch so it captures errors from day one of the build).

---

## Gap → Remediation map (all 106 gaps)

### CRITICAL gaps (9 → 8 remediation files)

| Gap ID | Gap title | Remediation file(s) | Phase |
|---|---|---|---|
| GAP-011 | Team seats marketed but not designed | R-TASK-101 (Path A LOCKED — defer to v2; remove copy) | Phase 11 |
| GAP-013 | Invitation flow (paired with GAP-011) | R-TASK-101 (Path A LOCKED — N/A in v1) | Phase 11 |
| GAP-015 | No account-deletion flow | R-TASK-102: Account deletion flow + cross-system fan-out | Phase 11 |
| GAP-029 | No data-deletion path across systems | R-TASK-102 (clustered) | Phase 11 |
| GAP-017 | No MFA on admin role | R-TASK-103: Admin MFA enrollment + enforcement | Phase 11 |
| GAP-021 | No rate limiting on /api/ai | R-TASK-104: Rate limiting (Upstash Redis) on cost + auth endpoints | Phase 11 |
| GAP-041 | No DPAs with vendors | R-TASK-105: Vendor DPA acquisition + tracking | Phase 12 |
| GAP-053 | No error tracking | R-TASK-106: Sentry integration (server + client + agent) | Phase 1 patch |
| GAP-086 | Vercel function timeout vs Claude response time | PATCH-001: TASK-021 — add maxDuration + streaming | Phase 4 patch |
| GAP-095 | No support inbox | R-TASK-107: Support inbox + footer/email/help routing | Phase 12 |

### HIGH gaps (36 → 22 remediation files)

| Gap ID | Gap title | Remediation file(s) | Phase |
|---|---|---|---|
| GAP-004 | Stark-contrast rule absent | R-TASK-108: Brand contrast rule + canonical store | Phase 11 |
| GAP-068 | Contrast lint required | R-TASK-109: Contrast lint script + CI integration | Phase 11 |
| GAP-067 | WCAG conformance level | R-TASK-110: Accessibility baseline (WCAG 2.2 AA target) | Phase 11 |
| GAP-069 | Keyboard navigation + screen reader | R-TASK-110 (clustered) | Phase 11 |
| GAP-010 | No audit event log | R-TASK-111: Audit event log table + helper + admin-read recording | Phase 11 |
| GAP-012 | Tenancy offboarding policy | R-TASK-112: Offboarding & retention policy + scheduled purge | Phase 11 |
| GAP-014 | Role-change flow | R-TASK-113: Admin role grant/revoke flow | Phase 11 |
| GAP-016 | Password policy | R-TASK-114: Password policy hardening + breach-list check | Phase 11 |
| GAP-022 | Stripe webhook idempotency | PATCH-002: TASK-024 — event.id dedup + uniqueness constraints | Phase 4 patch |
| GAP-026 | Key rotation cadence | R-TASK-115: Key rotation procedure + tracker | Phase 12 |
| GAP-027 | Off-Supabase backup | R-TASK-116: Off-Supabase backup (Cloudflare R2) + restore drill | Phase 12 |
| GAP-030 | User data export | R-TASK-117: Data export endpoint + admin tool | Phase 11 |
| GAP-031 | Data residency | R-TASK-118: Region pinning (Supabase + Vercel + Resend) + residency doc | Phase 11 |
| GAP-037 | Legal compliance manifest | R-TASK-119: Legal manifest expansion (AUP, Refund, Cookie, DMCA, AI/ML, Vuln, A11y) | Phase 11 |
| GAP-039 | TOS/Privacy acceptance recording | R-TASK-120: Acceptance recording schema + middleware | Phase 11 |
| GAP-040 | TOS re-acceptance flow | R-TASK-120 (clustered) | Phase 11 |
| GAP-045 | Subprocessor disclosure cadence | R-TASK-121: Subprocessor list + change notification flow | Phase 12 |
| GAP-047 | Staging environment | R-TASK-122: Staging environment (Supabase project + Vercel branch + Stripe test mode) | Phase 11 |
| GAP-048 | DR/failover plan | R-TASK-123: DR plan + RTO/RPO documentation + drill | Phase 12 |
| GAP-050 | CI/CD pipeline | R-TASK-124: GitHub Actions CI (lint + typecheck + test + secret scan) | Phase 11 |
| GAP-051 | Security scans | R-TASK-124 (clustered, includes Gitleaks + Dependabot + CodeQL) | Phase 11 |
| GAP-052 | Deploy strategy / rollback | R-TASK-125: Deploy procedure + rollback runbook | Phase 12 |
| GAP-054 | Centralized logging | R-TASK-126: Structured logging (Axiom or Logtail) + requestId | Phase 11 |
| GAP-055 | System metrics | R-TASK-127: Metrics dashboard (latency, error rate, queue) | Phase 11 |
| GAP-057 | Alert thresholds | R-TASK-128: Alerting rules + on-call routing | Phase 12 |
| GAP-059 | Uptime monitoring | R-TASK-129: External uptime monitor (Better Stack) on /api/health | Phase 12 |
| GAP-060 | Health check endpoint | PATCH-003: Add /api/health route | Phase 11 patch |
| GAP-061 | Unit-test coverage floor | R-TASK-130: Vitest setup + lib/ unit tests | Phase 11 |
| GAP-063 | E2E framework | R-TASK-131: Playwright setup + smoke tests (auth, billing, agent S0) | Phase 11 |
| GAP-064 | Stripe contract test | R-TASK-132: Stripe webhook contract tests + fixture library | Phase 11 |
| GAP-065 | RLS isolation test | R-TASK-133: Automated RLS isolation test suite | Phase 11 |
| GAP-078 | EU cookie consent | R-TASK-134: Cookie consent banner (Klaro or built) | Phase 11 |
| GAP-079 | Email templates (8 missing) | R-TASK-135: Email template suite (verification, reset, renewal, dunning, cancel, lifetime, receipt, downgrade) | Phase 11 |
| GAP-081 | Email deliverability (SPF/DKIM/DMARC) | R-TASK-136: DNS records for mybestsellingnovel.com email auth | Phase 12 |
| GAP-091 | Failure mode specs (zero exist) | R-TASK-137: Failure mode catalog for all 30 features | Phase 11 |
| GAP-094 | Migration testing | R-TASK-138: Migration CI test (fresh + seeded) + staging dry-run procedure | Phase 11 |
| GAP-096 | On-call rotation | R-TASK-139: On-call rotation + Better Stack incident management | Phase 12 |
| GAP-099 | Public status page | R-TASK-140: Public status page (Better Stack) + incident comms template | Phase 12 |
| GAP-103 | Post-launch monitoring window | R-TASK-141: First-48h watch plan + rollback triggers | Phase 12 |

### MEDIUM gaps (42 → 9 remediation files)

| Gap ID | Gap title | Remediation file(s) | Phase |
|---|---|---|---|
| GAP-001, 028, 089, 084, 085, 087, 088, 090 | Scale targets, RTO/RPO, perf budgets, web vitals, latency, DB query, resource ceilings, load tests | R-TASK-142: Performance & capacity targets document | Phase 11 |
| GAP-005, 006, 007, 008, 019 | Function symbol map, screen states, wiring tables, wizard, auth matrix | R-TASK-143: UI specification document set (function symbols + states + wiring + auth matrix) | Phase 11 |
| GAP-009 | Soft delete policy | R-TASK-144: Soft-delete + undo-delete UX (books, chapters) | Phase 11 |
| GAP-018, 020 | Session lifetime, API versioning | R-TASK-145: Auth + API hardening (session pinning, /v1 prefix on new routes) | Phase 11 |
| GAP-032, 033, 044, 049 | Log scrubbing, prod access audit, vendor exit plans, per-env config | R-TASK-146: Operations baseline (log scrubbing, access roster, exit plans, env config split) | Phase 12 |
| GAP-034 | Canonical store | R-TASK-147: Canonical store (lib/canon.ts) + migration of existing hardcoded values | Phase 11 |
| GAP-038, 042, 043, 046, 056, 058, 062, 066, 070, 072, 075, 076, 077, 080, 082, 092, 093 | Cookie inventory, vendor SLA, cost modeling, vendor change-control, tracing, runbooks, integration tests, perf tests, color independence, text zoom, locale handling, analytics events, event naming, unsubscribe, bounce handling, migration manifest fields, destructive migration review | R-TASK-148: Operational completeness (vendor manifest, runbook seed, analytics events, accessibility additions, migrations metadata) | Phase 11 |
| GAP-104 | Deferred-to-v-next list | R-TASK-149: Definition-of-done expansion (deferred list, required tests, acceptance framing) | Phase 12 |
| GAP-106 | Risk register | R-TASK-150: Risk register document | Phase 12 |

### LOW gaps (19 → 3 remediation files)

| Gap ID | Gap title | Remediation file(s) | Phase |
|---|---|---|---|
| GAP-002, 003, 023, 024, 025, 035, 036, 071, 073, 074, 083 | Brand color additions, logo, PII inventory, encryption doc, TLS pinning, canon CI lint, microcopy starter, motion preference, a11y SLA, i18n future plan, email template versioning | R-TASK-151: Brand + content + accessibility low-effort additions | Phase 11 |
| GAP-097, 098, 100, 105 | Response SLA, changelog URL, feedback channel, scope-expansion threshold | R-TASK-152: Operations & process additions (SLAs, changelog, feedback) | Phase 12 |
| GAP-101, 102 | Acceptance criteria framing, required tests list | R-TASK-153: DoD framing (pass/fail + required tests list) | Phase 12 |

---

## ADRs (Architecture Decision Records) — generated from observations

Architectural observations are NOT remediated as tasks, but each gets an ADR documenting the chosen path forward (and the trade-off accepted).

| ADR ID | Title | Source observation | Status |
|---|---|---|---|
| ADR-001 | Supabase as auth+DB+storage triple-bind: ship v1, document exit plan, tripwire at 5,000 users | OBS-001 | Accepted |
| ADR-002 | Chapters as table grain: defer chapter-versioning to v2; add to v-next list | OBS-002 | Accepted |
| ADR-003 | Verbatim-port directive split into Decision #11a (prompts) and #11b (JSX with mechanical modernization) | OBS-003 | **APPROVED 2026-05-05** |
| ADR-004 | Lifetime tier surrounding-controls dependency declaration | OBS-004 | **CONFIRMED 2026-05-05** |
| ADR-005 | Manual-test pattern: minimum Vitest + Playwright at v1, broader E2E deferred to v1.1 | OBS-005 | Accepted |
| ADR-006 | REST over tRPC at v1 | OBS-006 | Accepted |

---

## Recommended execution order

1. **Phase 1 patch** (run during your existing Phase 1): R-TASK-106 (Sentry SDK install — captures errors from day one of the build)
2. **Phase 4 patches** (run during your existing Phase 4): PATCH-001 (maxDuration on /api/ai), PATCH-002 (Stripe webhook idempotency), PATCH-003 (/api/health endpoint)
3. **Existing Phases 1-10** continue per BUILD_STRATEGY.md — but now with patches in place
4. **Phase 11** (Production Readiness): R-TASK-101 through R-TASK-148 sequenced — security tasks first, observability second, testing third, accessibility fourth, content fifth
5. **Phase 12** (Launch Operations): R-TASK-105, R-TASK-115, R-TASK-116, R-TASK-118-129, R-TASK-136, R-TASK-139-153 — runbooks, on-call, status page, DR drill, DPAs, deliverability DNS, deferred-to-v-next list

**Hard launch gate:** Phase 11 + Phase 12 must complete before public launch. The system_prompt's "ready to launch as a SaaS product at scale" intent makes these phases non-optional under target scope = product.

---

## What this packet does NOT include

- **Code modifications inside existing 1,917-line agent JSX.** Per Decision #11a (AI prompt strings, frozen verbatim per ADR-003 approved 2026-05-05). JSX coding conventions are now modernizable per Decision #11b provided golden-output behavioral tests pass. The five previously-gated tasks (R-TASK-109, R-TASK-110, R-TASK-126, R-TASK-127, R-TASK-128) are unblocked. Agent-internal accessibility work proceeds in v1.1 because the agent component refactor itself is the prerequisite (golden-output suite must exist first).
- **Architectural changes** (auth provider swap, storage migration, chapter versioning). All gated as observations and ADRs.
- **Implementation of remediation tasks themselves.** The packet is ready-to-execute task files; Claude Code runs them.
- **Cost estimates in dollars.** Some remediation introduces vendor costs (Sentry $26/mo team, Better Stack $30/mo, Upstash Redis $0-10/mo, Cloudflare R2 ~$0.015/GB-mo, Klaro free, Axiom free tier 500GB/mo). Assume +$80-120/mo in vendor costs at v1 scale; +$200-400/mo at 1,000-paying-user scale.

---

## Post-remediation gap state

After all 41 R-TASK files and 3 PATCH files complete, the audit-against-target = product re-run should yield:

| Severity | Before | After |
|---|---|---|
| CRITICAL | 9 | 0 |
| HIGH | 36 | ≤2 (DPAs depend on vendor signature, may take weeks to close formally) |
| MEDIUM | 42 | ≤6 (some require post-launch operational data) |
| LOW | 19 | ≤4 (cosmetic; can defer indefinitely) |

The 6 architectural observations remain — those are not "fixable" by remediation, only documentable via ADRs (which this packet does generate).

---

## Changelog

### 2026-05-05 — Phase 3.14 compliance patch (10 patches applied)

Surfaced via mechanical re-verification of the original packet against Phase 3.14 requirements (pre-flight discipline, apply-mode markers, cross-binding integrity). The packet was re-issued with the following changes; no audit content, no task scope, and no severity ratings were modified.

1. **Patch 1 (audit trail):** `docs/AUDIT_REPORT.md` added inside packet (CREATE marker; sourced from MyBSN AUDIT_REPORT.md, the canonical 2026-05-04 audit). Phase 3.14.3 satisfied.
2. **Patch 2 (pre-flight preamble):** `## Pre-flight: re-read current state` section inserted in 14 single-task files and 6 cluster files (cluster files additionally carry a "no-batching" directive). Phase 3.14.4 satisfied.
3. **Patch 3 (apply-mode markers):** APPLY marker added to all 37 files. 35 CREATE, 1 REPLACE (PROGRESS.md), 1 AUGMENT (BUILD_STRATEGY_ADDENDUM.md), per README Step 2 source of truth. Phase 3.14.2 satisfied.
4. **Patch 4 (ADR-004 cross-binding):** Cross-binding paragraph added to 4 files at 6 insertion points covering all 6 lifetime-tier surrounding controls. Rule 15 cross-binding integrity satisfied for the lifetime gate.
5. **Patch 5 (ADR-003 cross-binding):** R-TASK-128 alerting cluster gained the ADR-003 unblocking note matching the four sibling unblocked tasks.
6. **Patch 6 (gap count reconciliation):** README + REMEDIATION_OVERVIEW updated from "104 gaps" to "106 gaps". Severity counts corrected (HIGH 35→36, LOW 18→19; CRITICAL 9 and MEDIUM 42 were already correct). Verified by direct grep of unique GAP IDs in MyBSN AUDIT_REPORT.md (range GAP-001…GAP-106, no skips). The original "104" was a transcription error in packet-generation, not a count drift in the audit.
7. **Patch 7 (PATCH-file test coverage):** PATCH-002 gained AT-024-PATCH-6 (missing-event-id rejection); PATCH-003 gained AT-PATCH-003-5 (p99 envelope) and AT-PATCH-003-6 (response-shape contract). PATCH-001 had complete coverage versus the directive's proposed list and was not modified. Naming convention preserved per option (c) — existing AT- numbered tests retained with their original names.
8. **Patch 8 (migration 008 deferral):** R-TASK-101 Path B section gained an inline deferral note clarifying that `008_books_rls_team.sql` is also v2-deferred and must not be created in v1 (matching `007_team_memberships.sql.vnext` neutralization).
9. **Patch 9 (migration 011 split):** New migration `011_subscriptions_unique.sql` created in `supabase/migrations/`. PATCH-002 SQL block intro and footer references updated to reference only migration 011 (no more "or migration 005" conditional). Preserves the additive-only convention used throughout the packet.
10. **Patch 10 (deletion confirmation gates):** 7 deletion confirmation gates inserted across 4 files (R-101, R-106, R-112-118, R-126-133) where the directive's classification criterion identified genuine operator-content removal. 48 of 56 delete/remove/drop instances classified benign (SQL keywords in new schemas, descriptive references in new test files, lifecycle-event names, cross-references). Inline rule citation dropped — "**Deletion confirmation required:**" is the inserted phrase rather than the directive's "Per Rule 16" since WoulfAI Rule 16 governs wire-up discipline, not deletion confirmation.

Sources of truth used for tie-breaking:
- Canonical gap count: AUDIT_REPORT.md (now `docs/AUDIT_REPORT.md` in the packet) → 106 gaps
- Canonical apply-mode classification: README Step 2 → 1 REPLACE, 1 AUGMENT, all others CREATE
- Canonical decision dates: 2026-05-05 for all three locked decisions (Path A, ADR-003 approved, ADR-004 confirmed)

The patches do not introduce new tasks, do not change severity ratings, and do not alter the 60-vs-110 session estimate or the Phase 11/12 gating.

---

### 2026-05-06 — PATCH-3 (selective retroactive under-spec expansion + cleanup, option C)

Operator-initiated round addressing four sub-deliverables.

**Sub-deliverable A.1 — Forward references resolved.**
- R-TASK-122 → R-TASK-105: real dependency. R-105 phase tag relocated from Phase 12 to "Phase 11 (kickoff) — calendar tail extends into Phase 12 for vendor signatures." PROGRESS.md, BUILD_STRATEGY_ADDENDUM.md, R-149-153 cluster Phase 11/12 lists updated to match.
- R-TASK-102 → R-TASK-115: spurious. The original draft listed "R-TASK-115 (Resend)" but R-115 is Key Rotation Procedure, not Resend. Mislabel removed; Resend client comes from original 68-task plan (TASK-005 lazy-sdks). Inline correction note added to R-102.

**Sub-deliverable A.2 — AUDIT_REPORT.md summary table reconciled.**
- Header table corrected from 9/35/42/18=104 to 9/36/42/19=106. Methodology line "collapsed to 104 distinct gaps" updated to "collapsed to 106." Footer metadata `gap_count_by_severity` updated. Reconciliation note added: original 104 was a transcription error in the table; body has always contained 106 canonical gap entries (verified by GAP-ID enumeration GAP-001…GAP-106).

**Sub-deliverable A.3 — Lifetime tier eliminated entirely.**

Operator decision (Q-8.2): the long-tail liability of a $3,456.78 "lifetime of product" SKU outweighed its revenue contribution. Lifetime tier removed from product. ADR-004 voided as a consequence; original ADR-004 text preserved in `ADR-004-005-006.md` for audit trail.

Cascade applied across 21 files:

| File | Change |
|---|---|
| `ADR-004-005-006.md` | Status changed to VOIDED 2026-05-06; original content preserved as "Original Context" with full operator-decision record |
| `R-TASK-103-admin-mfa.md` | ADR-004 cross-binding paragraph removed |
| `R-TASK-107-support-inbox.md` | ADR-004 cross-binding paragraph removed |
| `R-TASK-119-125-legal-env-cicd-cluster.md` | 2 ADR-004 cross-binding paragraphs removed (R-119 + R-120) |
| `R-TASK-134-141-content-launchops-cluster.md` | ADR-004 cross-binding paragraph removed; R-135 email suite reduced 8→7 (lifetime-confirmation.tsx removed); AT-135-4 (lifetime confirmation test) removed; downgrade-notification re-described |
| `PATCH-002-task024-webhook-idempotency.md` | ADR-004 cross-binding paragraph removed; `handleCheckoutCompleted` lifetime grant logic stripped; AT-024-PATCH-2 updated; SQL block intro comment updated; opening prose updated |
| `supabase/migrations/011_subscriptions_unique.sql` | Purpose comment updated; constraint preserved as defense-in-depth for future one-time-payment SKUs |
| `README.md` | ADR-004 line in locked-decisions header changed to "Voided"; file-tree comment updated; Step 1 ADR-004 paragraph rewritten with cascade summary; `NEXT_PUBLIC_LIFETIME_ENABLED` removed from env-list; pre-launch checklist no longer references flag flip |
| `BUILD_STRATEGY_ADDENDUM.md` | Locked-decisions header updated; R-135 row updated; Phase-12 exit-gate item removed; build-order rule 11 retired |
| `PROGRESS.md` | TASK-025 marked DELETED; ADR-004 row updated to VOIDED; Tier-1 launch checklist no longer references flag |
| `PATCHES-TO-ORIGINAL/ENGINEERING_DECISIONS.md` | NEW — REPLACE-mode override of original Decision #7 (already revised), #29 (lifetime removed), #33 (lifetime language struck); pricing table updated; env var count 19→16 |
| `PATCHES-TO-ORIGINAL/TASK-003-env-config.md` | NEW — REPLACE-mode override; 16 env vars (was 19) |
| `PATCHES-TO-ORIGINAL/TASK-020-stripe-setup-doc.md` | NEW — REPLACE-mode override; 4 price IDs (was 6); webhook events list excludes checkout.session.completed |
| `PATCHES-TO-ORIGINAL/TASK-022-stripe-checkout.md` | NEW — REPLACE-mode override; only mode='subscription' Checkout Sessions; rejects lifetime price IDs |
| `PATCHES-TO-ORIGINAL/TASK-024-stripe-webhook.md` | NEW — REPLACE-mode override; 5 events handled (no checkout.session.completed) |
| `PATCHES-TO-ORIGINAL/TASK-025-lifetime-handling.md` | NEW — REPLACE-mode stub: task DELETED with cascade documentation |
| `PATCHES-TO-ORIGINAL/TASK-026-billing-integration.md` | NEW — REPLACE-mode override; UpgradeButton cycle prop accepts only monthly/annual |
| `PATCHES-TO-ORIGINAL/TASK-045-pricing-page.md` | NEW — REPLACE-mode override; monthly/annual toggle only; no lifetime CTAs |
| `PATCHES-TO-ORIGINAL/TASK-055-upgrade-email.md` | NEW — REPLACE-mode override; single template handles monthly + annual; no lifetime variant |
| `PATCHES-TO-ORIGINAL/backups/*.pre-modification-backup.md` | 9 backup files preserving the originals being replaced (audit trail) |

**Sub-deliverable B — Selective retroactive under-spec expansion (option C).**

10 high-cascade tasks expanded: TASK-001 (project-init), TASK-002 (global-styles), TASK-006 (api-auth), TASK-007 (middleware), TASK-008 (signup-page — added per B.1.5), TASK-010 (auth-guards), TASK-016 (subscription-logic), TASK-052 (admin-dashboard-ui), TASK-057 (legal-pages), TASK-061 (mobile-responsive). 47 operator questions delivered Pattern 2c; answer round complete 2026-05-06; expansion executed.

The 58 unexpanded original tasks remain at their current density (76–123 words each, average 97). They will be expanded in flight by Claude Code if depth is needed during execution. See "Option C deferral list" section below.

**Operator answers locked into Inference Summary blocks.** Each expanded task's top-of-file Inference Summary table records the source of every implementation decision: CLAUDE.md / TASK-XXX / ADR-NNN / ENGINEERING_DECISIONS.md / R-TASK-NNN / Q-N.M operator-answer. No `[INFERRED-BY-CLAUDE]` content remains. Originals backed up as `<filename>.pre-expansion-backup.md`.

**Q-8.1 jurisdiction:** Utah, Tooele County (governing law + exclusive venue). Locked into TASK-057 expansion.
**Q-8.4 AUP scope:** option (a) — inline summary in ToS, full AUP at /aup as supplementary; signup gets 3 acceptance checkboxes (ToS+AUP combined, Privacy, Refunds); R-TASK-120 records 3 rows.
**Q-8.7 manuscript retention:** 90 days after deletion request (overrode 30-day default from R-TASK-102; R-102 updated to match).
**Q-8.5 limitation of liability:** standard 12-month fees-paid cap (no lifetime SKU, so the lifetime carveout is moot).

---

## Option C deferral list (58 unexpanded original tasks)

These tasks remain at their current density. Claude Code may ask for clarification during execution; if it does, capture the answer in the task's Session Notes for future reference. Word counts and inferred categorization (had they been expanded) below for forward-planning if any need expansion later.

| Task | Words | If expanded, would have been |
|---|---:|---|
| TASK-003 env-config | 87 | APPROPRIATELY-THIN (covered by A.3 PATCHES-TO-ORIGINAL override) |
| TASK-004 supabase-clients | 106 | APPROPRIATELY-THIN (canonical refs sufficient) |
| TASK-005 lazy-sdks | 110 | UNDER-SPECIFIED (decisions derivable from ENGINEERING_DECISIONS #10) |
| TASK-009 signin-forgot | 96 | UNDER-SPECIFIED |
| TASK-011–015 migrations | 99–118 | APPROPRIATELY-THIN (single-file migrations, rule 2 of categorization) |
| TASK-017–019 books/chapters/audio APIs | 112–126 | UNDER-SPECIFIED |
| TASK-020 stripe-setup-doc | 95 | APPROPRIATELY-THIN (covered by A.3 PATCHES-TO-ORIGINAL override) |
| TASK-021 ai-proxy | 110 | APPROPRIATELY-THIN (PATCH-001 adds the missing density) |
| TASK-022 stripe-checkout | 92 | APPROPRIATELY-THIN (covered by A.3 PATCHES-TO-ORIGINAL override) |
| TASK-023 stripe-portal | 84 | UNDER-SPECIFIED |
| TASK-024 stripe-webhook | 108 | APPROPRIATELY-THIN (PATCH-002 + A.3 override add density) |
| TASK-025 lifetime-handling | 103 | DELETED 2026-05-06 (A.3) |
| TASK-026 billing-integration | 100 | APPROPRIATELY-THIN (covered by A.3 override) |
| TASK-027–042 agent-port group (16 tasks) | 81–111 | APPROPRIATELY-THIN (ADR-003 governs verbatim port; rule 1 of categorization) |
| TASK-043 landing-page | 98 | UNDER-SPECIFIED |
| TASK-044 guided-tour | 84 | UNDER-SPECIFIED |
| TASK-045 pricing-page | 86 | APPROPRIATELY-THIN (covered by A.3 override) |
| TASK-046 signup-modal | 83 | UNDER-SPECIFIED (overlaps with TASK-008 expansion) |
| TASK-047 account-dashboard | 87 | UNDER-SPECIFIED |
| TASK-048 help-page | 80 | UNDER-SPECIFIED |
| TASK-049–051 admin APIs | 91–117 | UNDER-SPECIFIED |
| TASK-053 admin-genre-analytics | 89 | UNDER-SPECIFIED |
| TASK-054 welcome-email | 92 | UNDER-SPECIFIED |
| TASK-055 upgrade-email | 80 | APPROPRIATELY-THIN (covered by A.3 override) |
| TASK-056 email-wiring | 92 | UNDER-SPECIFIED |
| TASK-058 google-analytics | 85 | UNDER-SPECIFIED |
| TASK-059 error-boundaries | 87 | UNDER-SPECIFIED |
| TASK-060 loading-states | 91 | UNDER-SPECIFIED |
| TASK-062 brand-consistency | 96 | UNDER-SPECIFIED |
| TASK-063–066 e2e tests | 94–101 | UNDER-SPECIFIED |
| TASK-067 security-audit | 96 | NEEDS-OPERATOR-INPUT (scope decisions) |
| TASK-068 vercel-deploy | 99 | APPROPRIATELY-THIN (R-TASK-141 adds density via pre-launch checklist) |

**In-flight expansion trigger:** when Claude Code begins one of the 58 deferred tasks, it should re-read the task and ask the operator for clarification ONLY if the missing decisions cannot be derived from the canonical sources (CLAUDE.md, ENGINEERING_DECISIONS.md, ADRs, neighboring expanded tasks, R-TASK files, AUDIT_REPORT.md). If derivable, expand inline with Inference Summary; if not, halt and ask.

---

## v4 changelog (2026-05-09)

### What changed since v3

**1. All 44 expand-eligible original tasks now expanded.**

The "in-flight expansion trigger" from v3 turned out to be unnecessary — Claude expanded all 34 remaining UNDER-SPECIFIED + MIXED + APPROPRIATELY-THIN-but-A.3-cascade tasks via PATCH-3 round 2. The 24 remaining at appropriately-thin status are: 16 agent-port tasks (TASK-027–042) per ADR-003 verbatim, 5 migrations (TASK-011–015), 2 patch-covered (TASK-021/024 → PATCH-001/002), 1 deleted (TASK-025 lifetime per A.3).

| Round | Phase | Tasks | Approach |
|---|---|---|---|
| 1 (5/8) | Phase 1+2 | TASK-003, 004, 005, 009 | All defaults |
| 2 (5/8) | Phase 3+4 | TASK-017, 018, 019, 020, 022, 023, 026 | All defaults |
| 3 (5/8) | Phase 7 | TASK-049, 050, 051, 053 | All defaults; TASK-053 MIXED resolved (agent S0 scores) |
| 4 (5/8) | Phase 10 | TASK-063, 064, 065, 066, 067, 068 | All defaults |
| 5A (5/8–9) | Phase 6 | TASK-043, 044 | TASK-043 absorbs full 17-task cluster integration |
| 5B (5/9) | Phase 6 | TASK-045, 046, 047, 048 | All defaults |
| 6 (5/9) | Phase 8 | TASK-054, 055, 056 | Operator-voice email copy drafted per directive |
| 7 (5/9) | Phase 9 | TASK-058, 059, 060, 062 | All defaults; TASK-058 MIXED resolved |

**2. v1 content cluster delivered — 17 new R-TASKs (R-TASK-160 through R-TASK-176).**

Operator scope expansion 2026-05-08 introduced footer copy with a 4-column structure referencing pages and features outside the original spec. Path B (newsletter-first) chosen with overrides:
- Keep all 5 publish guides at v1 (R-TASK-165–169) with Coming-soon badges where prose unfinished
- Directus Cloud free tier in v1 for operational data view (R-TASK-176)
- Coming-soon badges on unbuilt links accepted by operator as self-reminder mechanism

Cluster breakdown:
- Light marketing pages: R-TASK-160 (sample-chapter), 161 (genres), 162 (about), 163 (founders-note), 164 (press)
- Publish guides: R-TASK-165 (KDP), 166 (cover-design), 167 (ISBN/copyright), 168 (POD), 169 (audiobook)
- Funnel: R-TASK-170 (newsletter via Resend Broadcasts), 171 (lead-magnet outline template), 172 (affiliate waitlist)
- Platform extras: R-TASK-173 (how-it-works), 174 (legal aggregator), 175 (rotating literary quote), 176 (Directus)

**3. Operator-voice email copy drafted.**

Per operator directive 2026-05-09 ("escalate where weaker default would produce weaker artifact"), TASK-054 welcome email and TASK-055 upgrade email shipped with full body copy drafted in the operator's established literary footer voice — not generic SaaS defaults. Examples:
- Welcome subject: "You showed up. Now the work."
- Upgrade subject: "Welcome to Author." / "Welcome to Publisher." (period, not exclamation)
- Body opens "Hey [firstName, or 'writer']", closes "— Steve"
- Shared `lib/emails/_layout.tsx` carries CAN-SPAM-required postal address `1068 Industrial Park Circle, Grantsville, UT 84029` per Q-8.5 lock

**4. Env-var count drift — final v1 count is 22 (was reported as 17 in v3 packet).**

Drift accumulated through PATCH-3 round 2 expansions:
- v3 baseline post-A.3: 17 (16 from Q-1.1 + RESEND_FROM_EMAIL from Q-1.11)
- R-TASK-170 newsletter: +2 (RESEND_AUDIENCE_ID, NEWSLETTER_TOKEN_SECRET) → 19
- R-TASK-172 affiliate: +1 (RESEND_AFFILIATE_AUDIENCE_ID) → 20
- TASK-058 GA server-side: +2 (INTERNAL_SECRET, GA_API_SECRET) → **22**

R-TASK-176 (Directus) does NOT add env vars to the Next.js app — Directus is operator-only at directus.app domain; only adds env vars (`DIRECTUS_URL`, `DIRECTUS_TOKEN`) if the app itself queries Directus, which is not in v1 scope.

Final count for `.env.local.example` per TASK-003 expansion: **22 environment variables**. The 5-var drift correction needs a follow-up minor patch to TASK-003's expanded file in v5; this is not blocking and is documented here for the next round.

**5. Side-deliverable docs created.**

Five new docs added to `docs/`:
- `CONTENT_TODO.md` — content-debt aggregator (Tier A required at launch / Tier B Coming-soon-acceptable / Tier C v1.1 deferred)
- `CONTENT_REVIEW_SCHEDULE.md` — 6-month and 12-month review cycles for time-sensitive content
- `EMAIL_COMPLIANCE.md` — CAN-SPAM stance, opt-in policy, EU-stricter toggle path
- `AFFILIATE_v1_1_PLAN.md` — placeholder for v1.1 affiliate tracking infrastructure design decisions
- `DIRECTUS.md` — operator runbook for the operational data tool

**6. Locked operator decisions during PATCH-3 round 2:**

| Decision | Source date | Lock |
|---|---|---|
| Hero copy | 2026-05-08 | "Stop calling yourself an aspiring author." + body |
| Footer copy | 2026-05-08 | Full footer spec (4 columns, newsletter capture, legal strip, footnote) |
| CTA mirroring | 2026-05-08 | "Start Chapter One →" across hero, footer closing CTA, signup modal, tour final stop |
| Postal address (CAN-SPAM) | 2026-05-08 | 1068 Industrial Park Circle, Grantsville, UT 84029 |
| WoulfAI placement | 2026-05-08 | Footnote line below ©: "Legal · Built by WoulfAI" |
| Path | 2026-05-09 | Path B (newsletter-first) with overrides (keep 5 publish guides, Directus Cloud) |
| Q-B sub-choice | 2026-05-09 | Sanity for marketing content + Directus for operational data; Sanity deferred to v1.1 per Path B |

### Operator residuals to address before deploy

- 22 env vars in production Vercel (TASK-068 deploy doc lists all; this round's drift correction needs final pass)
- Operator-content commitments per `docs/CONTENT_TODO.md` (~17,000-20,000 words across Tier A + Tier B)
- Welcome/upgrade email copy review (drafted by Claude in voice; operator approves or overrides specific lines)
- Postal address verification (still 1068 Industrial Park Circle, Grantsville, UT 84029 at deploy?)
- Press-kit assets: 3 logos, 4 screenshots, 1 founder photo
- Outline-template PDF for lead magnet
- 15-20 curated literary quotes for `lib/literary-quotes.ts`

### What's NOT done in v4

- Original tasks TASK-027–042 (16 agent ports) — appropriately thin per ADR-003 verbatim port; Claude Code reads agent source at execution time
- Migrations TASK-011–015 — appropriately thin; SQL is the artifact
- TASK-021 (covered by PATCH-001), TASK-024 (covered by PATCH-002)
- TASK-025 (deleted 2026-05-06 per A.3)
- Sanity infrastructure (deferred to v1.1 per Path B)
- Blog/prompts/interviews content infrastructure (deferred to v1.1)
- Affiliate tracking infrastructure (deferred to v1.1 per Q-A)

---

*End of REMEDIATION_OVERVIEW.md (v4)*
