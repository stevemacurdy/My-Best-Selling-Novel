<!-- APPLY: REPLACE -->
# PROGRESS TRACKER — My Best Selling Novel
## Updated 2026-05-04 — includes audit remediation tasks (R-TASK-101 through R-TASK-153)

> **Packet version note (2026-05-05):** Packet patched 2026-05-05 to address Phase 3.14.4 (pre-flight), Phase 3.14.2 (apply-mode markers), and Rule 15 (cross-binding integrity) gaps. See REMEDIATION_OVERVIEW.md changelog for details. No task scope, severity, or estimate was modified by the patches — only structural compliance items (pre-flight preambles, APPLY markers, cross-binding paragraphs, deletion gates, and a corrected gap count: 106 not 104).

## Summary

| Metric | Value |
|--------|-------|
| Total Tasks | 68 original + 41 remediation + 3 patches = **112** |
| Completed | 0 |
| In Progress | 0 |
| Tests Passing | 0 |
| LOC | 0 |
| Phases | 12 (was 10; added 11=Production Readiness, 12=Launch Operations) |

---

## Phase 1 — Foundation (Tasks 001-005 + R-TASK-106)
- [ ] TASK-001: Project Initialization  *(expanded 2026-05-06, operator-confirmed; see docs/EXPANDED-TASKS/)*
- [ ] **R-TASK-106: Sentry Integration** ← run alongside TASK-001
- [ ] TASK-002: Global Styles and Layout  *(expanded 2026-05-06, operator-confirmed; see docs/EXPANDED-TASKS/)*
- [ ] TASK-003: Environment Configuration  *(modified 2026-05-06 by PATCH-3 A.3; see docs/PATCHES-TO-ORIGINAL/)*
- [ ] TASK-004: Supabase Client Library  *(thin spec — Claude Code may ask questions during execution per option C deferral; see REMEDIATION_OVERVIEW.md changelog)*
- [ ] TASK-005: Lazy SDK Clients  *(thin spec — Claude Code may ask questions during execution per option C deferral; see REMEDIATION_OVERVIEW.md changelog)*

## Phase 2 — Authentication (Tasks 006-010)
- [ ] TASK-006: Auth Verification Library  *(expanded 2026-05-06, operator-confirmed; see docs/EXPANDED-TASKS/)*
- [ ] TASK-007: Next.js Middleware  *(expanded 2026-05-06, operator-confirmed; see docs/EXPANDED-TASKS/)*
- [ ] TASK-008: Signup Page  *(expanded 2026-05-06, operator-confirmed; see docs/EXPANDED-TASKS/)*
- [ ] TASK-009: Signin + Forgot Password  *(thin spec — Claude Code may ask questions during execution per option C deferral; see REMEDIATION_OVERVIEW.md changelog)*
- [ ] TASK-010: AuthGuard + AdminGuard  *(expanded 2026-05-06, operator-confirmed; see docs/EXPANDED-TASKS/)*

## Phase 3 — Database & API Core (Tasks 011-019)
- [ ] TASK-011: Migration: profiles  *(thin spec — Claude Code may ask questions during execution per option C deferral; see REMEDIATION_OVERVIEW.md changelog)*
- [ ] TASK-012: Migration: books  *(thin spec — Claude Code may ask questions during execution per option C deferral; see REMEDIATION_OVERVIEW.md changelog)*
- [ ] TASK-013: Migration: chapters  *(thin spec — Claude Code may ask questions during execution per option C deferral; see REMEDIATION_OVERVIEW.md changelog)*
- [ ] TASK-014: Migration: audio_chunks  *(thin spec — Claude Code may ask questions during execution per option C deferral; see REMEDIATION_OVERVIEW.md changelog)*
- [ ] TASK-015: Migration: subscriptions + usage  *(thin spec — Claude Code may ask questions during execution per option C deferral; see REMEDIATION_OVERVIEW.md changelog)*
- [ ] TASK-016: Subscription Gating Logic  *(expanded 2026-05-06, operator-confirmed; see docs/EXPANDED-TASKS/)*
- [ ] TASK-017: Books CRUD API  *(thin spec — Claude Code may ask questions during execution per option C deferral; see REMEDIATION_OVERVIEW.md changelog)*
- [ ] TASK-018: Chapters API  *(thin spec — Claude Code may ask questions during execution per option C deferral; see REMEDIATION_OVERVIEW.md changelog)*
- [ ] TASK-019: Audio Upload/Retrieve/Delete API  *(thin spec — Claude Code may ask questions during execution per option C deferral; see REMEDIATION_OVERVIEW.md changelog)*

## Phase 4 — Stripe Billing (Tasks 020-026 + 3 patches)
- [ ] TASK-020: Stripe Products Setup Guide  *(modified 2026-05-06 by PATCH-3 A.3; see docs/PATCHES-TO-ORIGINAL/)*
- [ ] TASK-021: Claude AI Proxy Route + **PATCH-001 (maxDuration + streaming)**
- [ ] TASK-022: Stripe Checkout Route  *(modified 2026-05-06 by PATCH-3 A.3; see docs/PATCHES-TO-ORIGINAL/)*
- [ ] TASK-023: Stripe Portal Route  *(thin spec — Claude Code may ask questions during execution per option C deferral; see REMEDIATION_OVERVIEW.md changelog)*
- [ ] TASK-024: Stripe Webhook Handler + **PATCH-002 (idempotency)**  *(modified 2026-05-06 by PATCH-3 A.3; see docs/PATCHES-TO-ORIGINAL/)*
- [~] TASK-025: Lifetime Payment Handling — **DELETED 2026-05-06** per Decision #29 revision; lifetime tier eliminated. See PATCHES-TO-ORIGINAL/TASK-025-lifetime-handling.md.
- [ ] TASK-026: Billing Integration Test  *(modified 2026-05-06 by PATCH-3 A.3; see docs/PATCHES-TO-ORIGINAL/)*

## Phase 5 — Agent Port (Tasks 027-042)
- [ ] TASK-027: Types and Constants  *(thin spec — Claude Code may ask questions during execution per option C deferral; see REMEDIATION_OVERVIEW.md changelog)*
- [ ] TASK-028: Shared UI Primitives  *(thin spec — Claude Code may ask questions during execution per option C deferral; see REMEDIATION_OVERVIEW.md changelog)*
- [ ] TASK-029: Agent Helper Functions  *(thin spec — Claude Code may ask questions during execution per option C deferral; see REMEDIATION_OVERVIEW.md changelog)*
- [ ] TASK-030: Agent AI Caller (touched by PATCH-001 SSE refactor)  *(thin spec — Claude Code may ask questions during execution per option C deferral; see REMEDIATION_OVERVIEW.md changelog)*
- [ ] TASK-031: Agent Storage with Smart Diff  *(thin spec — Claude Code may ask questions during execution per option C deferral; see REMEDIATION_OVERVIEW.md changelog)*
- [ ] TASK-032: S0 Genre Scanner  *(thin spec — Claude Code may ask questions during execution per option C deferral; see REMEDIATION_OVERVIEW.md changelog)*
- [ ] TASK-033: S1 Book Setup  *(thin spec — Claude Code may ask questions during execution per option C deferral; see REMEDIATION_OVERVIEW.md changelog)*
- [ ] TASK-034: S2 Upload & Organize  *(thin spec — Claude Code may ask questions during execution per option C deferral; see REMEDIATION_OVERVIEW.md changelog)*
- [ ] TASK-035: S3 Outline Builder  *(thin spec — Claude Code may ask questions during execution per option C deferral; see REMEDIATION_OVERVIEW.md changelog)*
- [ ] TASK-036: S4 Front & Back Matter  *(thin spec — Claude Code may ask questions during execution per option C deferral; see REMEDIATION_OVERVIEW.md changelog)*
- [ ] TASK-037: S5 Chapter Guide  *(thin spec — Claude Code may ask questions during execution per option C deferral; see REMEDIATION_OVERVIEW.md changelog)*
- [ ] TASK-038: S6 Write & Record  *(thin spec — Claude Code may ask questions during execution per option C deferral; see REMEDIATION_OVERVIEW.md changelog)*
- [ ] TASK-039: S7 Review + S8 Description  *(thin spec — Claude Code may ask questions during execution per option C deferral; see REMEDIATION_OVERVIEW.md changelog)*
- [ ] TASK-040: S9 Publishing Setup  *(thin spec — Claude Code may ask questions during execution per option C deferral; see REMEDIATION_OVERVIEW.md changelog)*
- [ ] TASK-041: S10 Cover + S11 Launch  *(thin spec — Claude Code may ask questions during execution per option C deferral; see REMEDIATION_OVERVIEW.md changelog)*
- [ ] TASK-042: Library + Agent Shell  *(thin spec — Claude Code may ask questions during execution per option C deferral; see REMEDIATION_OVERVIEW.md changelog)*

## Phase 6 — Demo & Landing (Tasks 043-048)
- [ ] TASK-043: Landing Page  *(thin spec — Claude Code may ask questions during execution per option C deferral; see REMEDIATION_OVERVIEW.md changelog)*
- [ ] TASK-044: Guided Tour  *(thin spec — Claude Code may ask questions during execution per option C deferral; see REMEDIATION_OVERVIEW.md changelog)*
- [ ] TASK-045: Pricing Page  *(modified 2026-05-06 by PATCH-3 A.3; see docs/PATCHES-TO-ORIGINAL/)*
- [ ] TASK-046: Signup Modal Integration  *(thin spec — Claude Code may ask questions during execution per option C deferral; see REMEDIATION_OVERVIEW.md changelog)*
- [ ] TASK-047: Account Dashboard  *(thin spec — Claude Code may ask questions during execution per option C deferral; see REMEDIATION_OVERVIEW.md changelog)*
- [ ] TASK-048: Help Page  *(thin spec — Claude Code may ask questions during execution per option C deferral; see REMEDIATION_OVERVIEW.md changelog)*

## Phase 7 — Admin Dashboard (Tasks 049-053)
- [ ] TASK-049: Admin Metrics API  *(thin spec — Claude Code may ask questions during execution per option C deferral; see REMEDIATION_OVERVIEW.md changelog)*
- [ ] TASK-050: Admin Genres API  *(thin spec — Claude Code may ask questions during execution per option C deferral; see REMEDIATION_OVERVIEW.md changelog)*
- [ ] TASK-051: Admin Users API  *(thin spec — Claude Code may ask questions during execution per option C deferral; see REMEDIATION_OVERVIEW.md changelog)*
- [ ] TASK-052: Admin Dashboard UI  *(expanded 2026-05-06, operator-confirmed; see docs/EXPANDED-TASKS/)*
- [ ] TASK-053: Admin Genre Analytics  *(thin spec — Claude Code may ask questions during execution per option C deferral; see REMEDIATION_OVERVIEW.md changelog)*

## Phase 8 — Email & Legal (Tasks 054-057)
- [ ] TASK-054: Welcome Email Template  *(thin spec — Claude Code may ask questions during execution per option C deferral; see REMEDIATION_OVERVIEW.md changelog)*
- [ ] TASK-055: Upgrade Email Template  *(modified 2026-05-06 by PATCH-3 A.3; see docs/PATCHES-TO-ORIGINAL/)*
- [ ] TASK-056: Email API and Wiring  *(thin spec — Claude Code may ask questions during execution per option C deferral; see REMEDIATION_OVERVIEW.md changelog)*
- [ ] TASK-057: Terms of Service and Privacy Policy  *(expanded 2026-05-06, operator-confirmed; see docs/EXPANDED-TASKS/)*

## Phase 9 — Analytics & Polish (Tasks 058-062)
- [ ] TASK-058: Google Analytics Integration  *(thin spec — Claude Code may ask questions during execution per option C deferral; see REMEDIATION_OVERVIEW.md changelog)*
- [ ] TASK-059: Error Boundaries  *(thin spec — Claude Code may ask questions during execution per option C deferral; see REMEDIATION_OVERVIEW.md changelog)*
- [ ] TASK-060: Loading States  *(thin spec — Claude Code may ask questions during execution per option C deferral; see REMEDIATION_OVERVIEW.md changelog)*
- [ ] TASK-061: Mobile Responsiveness  *(expanded 2026-05-06, operator-confirmed; see docs/EXPANDED-TASKS/)*
- [ ] TASK-062: Brand Consistency Pass  *(thin spec — Claude Code may ask questions during execution per option C deferral; see REMEDIATION_OVERVIEW.md changelog)*

## Phase 10 — Integration Testing (Tasks 063-068)
- [ ] TASK-063: E2E: Auth Flow  *(thin spec — Claude Code may ask questions during execution per option C deferral; see REMEDIATION_OVERVIEW.md changelog)*
- [ ] TASK-064: E2E: Book Lifecycle  *(thin spec — Claude Code may ask questions during execution per option C deferral; see REMEDIATION_OVERVIEW.md changelog)*
- [ ] TASK-065: E2E: Billing Flow  *(thin spec — Claude Code may ask questions during execution per option C deferral; see REMEDIATION_OVERVIEW.md changelog)*
- [ ] TASK-066: E2E: Agent Workflow  *(thin spec — Claude Code may ask questions during execution per option C deferral; see REMEDIATION_OVERVIEW.md changelog)*
- [ ] TASK-067: Security Audit  *(thin spec — Claude Code may ask questions during execution per option C deferral; see REMEDIATION_OVERVIEW.md changelog)*
- [ ] TASK-068: Production Deployment _(do NOT deploy until Phase 11+12 complete)_  *(thin spec — Claude Code may ask questions during execution per option C deferral; see REMEDIATION_OVERVIEW.md changelog)*

---

## Phase 11 — Production Readiness (NEW — added by audit remediation)

**Hard gate:** all tasks below must complete before public launch under target=product scope.

### 11A — Decisions & ADRs (LOCKED 2026-05-05; recorded here for traceability)
- [x] **R-TASK-101: Team seats — Path A LOCKED (defer to v2)** — first Phase 11 work item is the marketing copy update + migration 007 neutralization
- [x] **ADR-003 APPROVED — split Decision #11 into 11a (prompts frozen) + 11b (JSX modernizable behind golden-output tests)** — unblocks R-TASK-109, R-TASK-110, R-TASK-126, R-TASK-127, R-TASK-128
- [x] **ADR-004 VOIDED 2026-05-06 — lifetime tier eliminated entirely (Decision #29 revision); ADR-004's surrounding-controls dependency declaration no longer applies; the 6 surrounding controls all still ship for non-lifetime reasons**
- [ ] PATCH-003: /api/health endpoint
- [ ] First Phase 11 session: update Decision #11 in `docs/ENGINEERING_DECISIONS.md` to record the 11a/11b split with ADR-003 reference; update Decision #7 to remove team-seats from Publisher tier; create or append `docs/DEFERRED_TO_VNEXT.md` with team-seats v2 design notes; rename `supabase/migrations/007_team_memberships.sql` → `.vnext`
- [ ] **R-TASK-105: Vendor DPAs** (kickoff at Phase 11 start; calendar tail extends into Phase 12; 1-3 wk vendor signature wait runs in parallel with engineering)

### 11B — Security
- [ ] R-TASK-103: Admin MFA enrollment + enforcement
- [ ] R-TASK-104: Rate limiting (Upstash Redis)
- [ ] R-TASK-111: Audit event log
- [ ] R-TASK-113: Admin role grant/revoke flow
- [ ] R-TASK-114: Password policy hardening + HIBP check
- [ ] R-TASK-145: Auth + API hardening (session lifetime, API versioning)

### 11C — Data Protection
- [ ] R-TASK-102: Account deletion + cross-system fan-out
- [ ] R-TASK-112: Tenancy offboarding policy
- [ ] R-TASK-117: User data export
- [ ] R-TASK-118: Data residency documentation
- [ ] R-TASK-144: Soft-delete + undo-delete UX

### 11D — Legal & Compliance
- [ ] R-TASK-119: Legal compliance manifest expansion (AUP, Refunds, Cookies, DMCA, AI/ML, Vuln, A11y)
- [ ] R-TASK-120: TOS/Privacy acceptance recording + re-acceptance flow
- [ ] R-TASK-134: EU cookie consent banner

### 11E — Observability
- [ ] R-TASK-126: Structured logging (Axiom)
- [ ] R-TASK-127: Metrics dashboard

### 11F — Testing
- [ ] R-TASK-130: Vitest setup + lib unit tests
- [ ] R-TASK-131: Playwright smoke tests (auth, billing, agent S0)
- [ ] R-TASK-132: Stripe webhook contract tests
- [ ] R-TASK-133: Automated RLS isolation tests
- [ ] R-TASK-138: Migration CI test

### 11G — Accessibility & Brand
- [ ] R-TASK-108: Brand contrast rule + canonical store
- [ ] R-TASK-109: Contrast lint script + CI integration
- [ ] R-TASK-110: Accessibility baseline (WCAG 2.2 AA)

### 11H — Content & Email
- [ ] R-TASK-135: Email template suite (8 missing templates)
- [ ] R-TASK-137: Failure mode catalog

### 11I — Specs & Documentation
- [ ] R-TASK-142: Performance & capacity targets
- [ ] R-TASK-143: UI specification document set
- [ ] R-TASK-147: Canonical store (lib/canon.ts)
- [ ] R-TASK-148: Operational completeness sweep
- [ ] R-TASK-151: Brand + content + a11y low-effort additions

### 11J — Environment
- [ ] R-TASK-122: Staging environment
- [ ] R-TASK-124: GitHub Actions CI + security scans

---

## Phase 12 — Launch Operations (NEW — added by audit remediation)

**Hard gate:** must complete before public launch.

### 12A — Vendor & Compliance (longest-pole calendar items)
- [ ] R-TASK-121: Subprocessor change notification flow
- [ ] R-TASK-115: Key rotation procedure + tracker

### 12B — Backup & DR
- [ ] R-TASK-116: Off-Supabase backup (Cloudflare R2)
- [ ] R-TASK-123: DR plan + drill

### 12C — Monitoring & Alerting
- [ ] R-TASK-128: Alerting rules + on-call routing
- [ ] R-TASK-129: External uptime monitoring (Better Stack)
- [ ] R-TASK-136: Email deliverability DNS (SPF/DKIM/DMARC)

### 12D — Support & Communications
- [ ] R-TASK-107: Support inbox + footer/email/help routing
- [ ] R-TASK-139: On-call rotation + Better Stack incident management
- [ ] R-TASK-140: Public status page

### 12E — Operations & Process
- [ ] R-TASK-125: Deploy procedure + rollback runbook
- [ ] R-TASK-141: First-48h watch plan
- [ ] R-TASK-146: Operations baseline (log scrubbing, access roster, vendor exit, env config)
- [ ] R-TASK-149: Deferred-to-v-next list
- [ ] R-TASK-150: Risk register
- [ ] R-TASK-152: Operations & process additions (SLA, changelog, feedback)
- [ ] R-TASK-153: DoD framing

---

## Pre-launch checklist (final gate before TASK-068)

**Tier 1 — Cannot launch without:**
- [ ] All 9 CRITICAL audit gaps resolved
- [ ] All R-TASK Phase 11 + Phase 12 items complete
- [ ] All 6 vendor DPAs signed
- [ ] DR drill completed once
- [ ] On-call rotation acknowledged by Steve
- [ ] Status page live
- [ ] Sentry alerts firing on test triggers
- [ ] /api/health green for 7 consecutive days in staging

**Tier 2 — Should-have but not blocker:**
- [ ] Lighthouse Accessibility score ≥ 95 on all in-scope pages
- [ ] At least one bug filed and resolved via Sentry
- [ ] At least one rollback drill completed
- [ ] Welcome email A/B test of subject lines (not required)

---

## How to use this document

- Each session of Claude Code begins by reading PROGRESS.md
- Mark `[x]` when a task is fully complete (all ATs pass)
- Mark `[~]` when in progress (record current state in the task file's Session Notes)
- When all of Phase X complete, append a date stamp: `## Phase 11 — Production Readiness ✅ Completed 2026-MM-DD`

---

## v4 status (2026-05-09)

### Spec readiness summary

- **44 of 44** expand-eligible original tasks expanded (`docs/EXPANDED-TASKS/`); 24 remain appropriately-thin per protocol (16 agent ports, 5 migrations, 2 patch-covered, 1 deleted)
- **17 v1 content cluster R-TASKs** delivered (`docs/TASKS/R-TASK-160-176-*.md`)
- **All previous R-TASKs** preserved (R-TASK-101–159 from v2 packet)
- **3 PATCHES** preserved (PATCH-001 streaming, PATCH-002 webhook idempotency, PATCH-003 health endpoint)
- **9 PATCHES-TO-ORIGINAL** preserved (A.3 lifetime cascade)
- **6 ADRs** preserved (ADR-001 through ADR-006; ADR-004 voided 2026-05-06)

### Spec-readiness phase status (NOT implementation status)

- Phase 1 — Foundation: ✅ specs ready (TASK-001, 002, 003, 004, 005)
- Phase 2 — Auth: ✅ specs ready (TASK-006, 007, 008, 009, 010)
- Phase 3 — Database & APIs: ✅ specs ready (TASK-011–015 thin migrations; TASK-016, 017, 018, 019)
- Phase 4 — Stripe Billing: ✅ specs ready (TASK-020, 022, 023, 026; TASK-021/024 patch-covered; TASK-025 deleted)
- Phase 5 — Agent: ✅ specs ready (TASK-027–042 verbatim port per ADR-003)
- Phase 6 — Demo & Landing: ✅ specs ready (TASK-043–048 expanded; entire 17-task R-TASK content cluster integrated into TASK-043 footer)
- Phase 7 — Admin: ✅ specs ready (TASK-049–053 expanded)
- Phase 8 — Email: ✅ specs ready (TASK-054, 055, 056 expanded with operator-voice copy drafted; TASK-057 legal pages from v3)
- Phase 9 — Analytics & Polish: ✅ specs ready (TASK-058, 059, 060, 062 expanded; TASK-061 mobile-responsive from v3)
- Phase 10 — E2E & Deploy: ✅ specs ready (TASK-063–068 expanded as manual checklists; R-TASK-130 automates in Phase 11)
- Phase 11 — Production Readiness: ✅ R-TASK cluster from v2 packet remains the spec; new R-TASK-176 (Directus) added

### Implementation status

**No implementation work has been started.** Claude Code begins fresh in implementation mode after this v4 packet ships.

When implementation begins, the order is dictated by the existing phase ordering plus the v1 content cluster's phase placement (Phases 6, 8, 11). Recommended implementation sequence post-launch:

1. Phase 1–2 (foundation + auth) — must ship first; everything depends on it
2. Phase 3 (database + APIs) — books, chapters, audio
3. Phase 4 (Stripe billing) — checkout, webhook, portal
4. Phase 5 (agent) — verbatim port; the product itself
5. Phase 6 + Phase 6 R-TASK cluster (R-TASK-160-175) — landing page + content surfaces; Coming-soon badges acceptable on unfinished prose
6. Phase 7 (admin)
7. Phase 8 + Phase 8 R-TASKs (R-TASK-170, 174) — email + newsletter + legal aggregator
8. Phase 9 (analytics + polish)
9. Phase 10 (E2E manual tests; R-TASK-130 automation in Phase 11)
10. Phase 11 (production readiness, including R-TASK-176 Directus setup)

### Outstanding operator residuals

See `docs/CONTENT_TODO.md` for the full list. Highest-priority items:
- ~17,000-20,000 words of operator-authored content (sample chapter, about, founder's note, 5 publish guides, press boilerplate, etc.)
- Welcome + upgrade email copy review (Claude drafted; operator approves or overrides)
- Press-kit assets (3 logos, 4 screenshots, 1 founder photo)
- Outline-template PDF for lead magnet
- 15-20 curated literary quotes for footer rotation
- Operator decision on `legal@` inbox (route to `help@` for v1, recommended)

### Final v1 env-var count: **22**

(Drift from v3's "17" documented in REMEDIATION_OVERVIEW.md changelog.)
