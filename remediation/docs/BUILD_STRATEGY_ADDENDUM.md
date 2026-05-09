<!-- APPLY: AUGMENT -->
# BUILD STRATEGY — ADDENDUM (Phases 11 + 12)
## Updated 2026-05-04 by audit remediation packet

This file ADDS to the original `docs/BUILD_STRATEGY.md`. Do not replace the original — append this content after the existing "Phase 10 — Integration Testing" section but BEFORE the "Build Order Rules" section.

---

## Phase 11 — Production Readiness (Tasks R-101 through R-148, R-151; PATCH-003)

**Hard gate:** under target scope = product ("ready to launch as a SaaS at scale"), Phase 11 + 12 must complete before Phase 10's TASK-068 (production deploy). The original Phase 10 verifies functional flows; Phase 11 verifies the system is fit for paying customers; Phase 12 verifies operations are in place to support them.

The three decision tasks that previously gated Phase 11 are LOCKED (2026-05-05):
- **R-TASK-101 → Path A** (team seats deferred to v2)
- **ADR-003 → Approved** (Decision #11 split into 11a prompts/11b JSX)
- **ADR-004 → Voided 2026-05-06** (lifetime tier eliminated entirely; surrounding controls all still ship for non-lifetime reasons)

Within each subgroup (security / data protection / observability / testing / a11y / content / specs), tasks are mostly independent and can be parallelized.

| Task | Name | Sessions | Description |
|------|------|----------|-------------|
| R-101 | Team seats — Path A locked | 1 | Update copy: pricing page, Stripe Publisher description, Decision #7, CLAUDE.md persona; create DEFERRED_TO_VNEXT.md; rename migration 007 to .vnext |
| ADR-003 | Decision #11 split (approved) | 0.5 | Update Decision #11 in ENGINEERING_DECISIONS.md to record 11a (prompts frozen) + 11b (JSX modernizable under golden-output tests) |
| PATCH-003 | /api/health endpoint | 0.5 | Cheap healthcheck for uptime monitor |
| R-103 | Admin MFA | 2 | TOTP enrollment via Supabase Auth; recovery codes; AdminGuard MFA enforcement |
| R-104 | Rate limiting | 2 | Upstash Redis with per-route limits on AI, checkout, signup, signin |
| R-108 | Brand contrast rule | 1 | lib/brand.ts canonical store, Tailwind tokens, allowed/forbidden pairings |
| R-109 | Contrast lint | 1 | scripts/contrast-lint.ts + CI integration (per ADR-003: agent included once golden-output tests exist) |
| R-110 | A11y baseline (WCAG 2.2 AA) | 2 | Skip-to-main, focus rings, reduced-motion, live regions, keyboard nav (per ADR-003: agent included once golden-output tests exist) |
| R-111 | Audit event log | 1.5 | Migration 012 + lib/audit.ts; recordAuditEvent in admin routes |
| R-112 | Offboarding policy | 1 | Retention rules, scheduled purge, downgrade lifecycle |
| R-113 | Role grant/revoke flow | 1 | super_admin role; admin role granted via API not env |
| R-114 | Password policy | 1 | 12+ chars, HIBP breach check, validation in signup/reset/change |
| R-117 | User data export | 1 | /api/account/export, async zip generation, signed URL |
| R-118 | Data residency | 0.5 | DATA_RESIDENCY.md, region pinning verification |
| R-119 | Legal manifest expansion | 2 | AUP, Refunds, Cookies, DMCA, AI/ML, Vuln Disclosure, A11y Statement pages |
| R-120 | TOS acceptance recording | 1.5 | Migration 014 + AcceptanceWall component; re-acceptance flow |
| R-122 | Staging environment | 1 | Second Supabase project, staging branch on Vercel, Stripe test mode |
| R-124 | GitHub Actions CI | 1 | Typecheck, lint, contrast-lint, test, build; Gitleaks; Dependabot |
| R-126 | Structured logging | 1 | Axiom integration; lib/log.ts; PII scrubbing |
| R-127 | Metrics dashboard | 1 | Axiom dashboards: API health, AI usage, auth, subscription |
| R-130 | Vitest unit tests | 2 | lib/__tests__/* with 60% coverage floor on lib/ |
| R-131 | Playwright smoke | 2 | Auth flow, billing flow, agent S0 against staging |
| R-132 | Stripe contract tests | 1 | 6 webhook event fixtures; replay tests |
| R-133 | RLS isolation tests | 1.5 | Cross-user access tests for all 11 user-scoped tables |
| R-134 | Cookie consent | 1 | Klaro banner; gates GA4 in EU |
| R-135 | Email templates (7) | 2 | Verification, reset, renewal, dunning, cancel, receipt, downgrade (lifetime-confirmation removed 2026-05-06 per Decision #29 revision) |
| R-137 | Failure mode catalog | 2 | Per-feature failure modes table for all 30 features |
| R-138 | Migration CI test | 1 | GitHub Actions runs migrations against ephemeral Postgres |
| R-142 | Performance targets | 1 | Scale targets, Web Vitals, latency budgets, resource ceilings |
| R-143 | UI specs | 2 | Function symbol map, screen states, wiring tables, auth matrix, first-run wizard |
| R-144 | Soft-delete UX | 1 | Migration 015; books/chapters get deleted_at; Recently Deleted tab |
| R-145 | Auth + API hardening | 0.5 | Session lifetime doc, /v1/ versioning policy |
| R-147 | Canonical store | 1 | lib/canon.ts: prices, tier limits, product names; CI grep-lint |
| R-148 | Operational completeness | 2 | Cookie inventory, vendor manifest, tracing doc, runbook index, color independence, locale, GA events, unsubscribe, bounce |
| R-151 | Low-effort additions | 0.5 | Logo, PII inventory, encryption doc, TLS pinning, microcopy starter, i18n future plan, email versioning |

**Phase 11 exit gate:**
- All R-TASK Phase 11 tests pass
- Lighthouse Accessibility ≥ 95 on /, /pricing, /signup, /signin, /account
- Sentry, Axiom, Upstash, Better Stack accounts configured (still pre-launch but instrumentation working in staging)
- Staging environment fully operational; smoke test passes
- `npm run build` + `npm run test:ci` + `npm run lint:contrast` all pass

---

## Phase 12 — Launch Operations (Tasks R-115, R-116, R-121, R-123, R-125, R-128, R-129, R-136, R-139, R-140, R-141, R-146, R-149, R-150, R-152, R-153)

Phase 12 is operational setup that requires the system to exist (Phase 11 complete) before it can be configured. Some tasks have long calendar time but short work time — vendor DPAs in particular take 1-3 weeks of waiting for vendor signature, so initiate R-TASK-105 at the START of Phase 11 in parallel.

| Task | Name | Sessions | Calendar | Description |
|------|------|----------|----------|-------------|
| R-105 | Vendor DPAs | 1 (kickoff) | 1-3 weeks | START FIRST. Email/sign DPAs with Supabase, Anthropic, Stripe, Resend, Vercel, GA |
| R-115 | Key rotation procedure | 0.5 | — | Runbook + tracker; calendar reminders for cadence |
| R-116 | Off-Supabase backup | 1.5 | — | Cloudflare R2; nightly cron; restore drill |
| R-121 | Subprocessor change flow | 0.5 | — | SUBPROCESSOR_LIST.md + notification template |
| R-123 | DR plan + drill | 1 + drill | — | RTO/RPO doc; first quarterly drill |
| R-125 | Deploy procedure | 0.5 | — | Standard deploy + rollback runbook |
| R-128 | Alerting rules | 1 | — | Better Stack alert rules; SMS for P1 |
| R-129 | Uptime monitoring | 0.5 | — | Better Stack monitors on /api/health and key URLs |
| R-136 | Email DNS | 0.5 | 24h DNS propagation | SPF, DKIM, DMARC; verify with mxtoolbox |
| R-139 | On-call rotation | 0.5 | — | Better Stack incident management; runbook |
| R-140 | Status page | 0.5 | — | status.mybestsellingnovel.com; incident comms templates |
| R-141 | First-48h watch plan | 0.5 | — | launch-watch.md; rollback triggers |
| R-146 | Operations baseline | 1 | — | Log scrubbing rules, prod access roster, vendor exit plans, env config |
| R-149 | Deferred-to-v-next | 0.5 | — | DEFERRED_TO_VNEXT.md with all 10 entries |
| R-150 | Risk register | 0.5 | — | RISK_REGISTER.md with 10+ risks |
| R-152 | Process additions | 0.5 | — | SLA, changelog, feedback channel |
| R-153 | DoD framing | 0.5 | — | Pass/fail criteria in CLAUDE.md |

**Phase 12 exit gate / final pre-launch checklist:**
- All 6 vendor DPAs signed (R-105)
- DR drill #1 completed; recovery within RTO (R-123)
- On-call SMS test successful (R-139)
- Status page reachable at status.mybestsellingnovel.com (R-140)
- Better Stack uptime monitor green for 7 consecutive days against staging (R-129)
- Stripe webhook idempotency verified by replay (PATCH-002)
- Email DKIM passes mxtoolbox check (R-136)
- Test welcome email arrives in Gmail/Outlook with SPF=pass DKIM=pass DMARC=pass headers
- Risk register reviewed; first quarterly review scheduled (R-150)

**TASK-068 (production deploy) only proceeds after Phase 12 exit gate is met.**

---

## Updated Build Order Rules (additions to original)

8. **R-TASK-105 (vendor DPAs) starts at Phase 11 kickoff** — calendar time is the bottleneck; engineering work runs in parallel
9. **ADR-003 split is APPROVED (2026-05-05)** — Decision #11 splits into 11a (prompts frozen) + 11b (JSX modernizable behind golden-output tests). R-TASK-110 a11y scope includes the agent once the golden-output suite exists. PATCH-001 streaming refactor is permitted under 11b.
10. **R-TASK-101 LOCKED to Path A (2026-05-05)** — team seats deferred to v2. Migration 007 is neutralized to `.vnext` and must not be applied. All v1 RLS work assumes single-user-per-account. Team-related code paths (book sharing, invitations) are explicitly out-of-scope for v1.
11. **Lifetime tier eliminated 2026-05-06 (Decision #29 revision; ADR-004 voided)** — no flag, no surrounding-controls gate. The 6 controls originally identified by ADR-004 (R-119 refund, R-120 acceptance, R-135 templates, R-103 MFA, PATCH-002 idempotency, R-107 support) all still ship for non-lifetime reasons; they are no longer linked to a single gate. R-TASK-141 pre-launch checklist no longer references a flag flip.
12. **No public launch announcement until Phase 12 exit gate met** — even if TASK-068 deploys, treat as "internal beta" until checklist clears

## Updated Critical Path

Original: Phase 1 → 2 → 3 → 5 → 10
Updated: Phase 1+R-106 → 2 → 3 → 4+PATCH-001+PATCH-002 → 5 → 6-9 → 10 → **11 → 12** → TASK-068

Phase 11 + 12 add ~30 sessions of engineering plus 1-3 weeks of vendor calendar time. Plan accordingly.

---

## v4 addendum (2026-05-09) — v1 content cluster phase placement

The 17-task v1 content cluster (R-TASK-160 through R-TASK-176) added 2026-05-08 distributes across existing phases as follows:

### Phase 6 placement (15 of 17 R-TASKs)

These are marketing/content surfaces that ship alongside the landing page (TASK-043) and pricing (TASK-045):

- R-TASK-160 sample-chapter
- R-TASK-161 genres
- R-TASK-162 about (Our Story)
- R-TASK-163 founders-note
- R-TASK-164 press kit
- R-TASK-165 KDP setup guide
- R-TASK-166 cover design guide
- R-TASK-167 ISBN/copyright guide
- R-TASK-168 print-on-demand guide
- R-TASK-169 audiobook guide
- R-TASK-171 lead-magnet outline template
- R-TASK-172 affiliate waitlist
- R-TASK-173 how-it-works
- R-TASK-175 rotating literary quote system

Plus R-TASK-160's `<ComingSoonBadge>` and `<GuideTOC>` shared components, ship-date dependency: R-TASK-160 ships first to seed those components, then R-TASKs 165–169 import them.

### Phase 8 placement (2 of 17 R-TASKs)

- R-TASK-170 newsletter infrastructure (Resend Broadcasts + subscribe + Sunday cron + welcome flow)
- R-TASK-174 legal aggregator `/legal` page

R-TASK-170 builds on TASK-005's `lib/resend.ts` and crosses with TASK-054/055/056 email infrastructure.

### Phase 11 placement (1 of 17 R-TASKs)

- R-TASK-176 Directus Cloud setup

Operator-only operational tool; ships in Phase 11 alongside production readiness work. Complements (does not replace) the curated `/admin` dashboard from TASK-049–053.

### Updated phase ordering with cluster

```
Phase 1 — Foundation + R-TASK-106 (Sentry)
Phase 2 — Auth + R-TASK-103 (admin MFA), R-TASK-104 (rate-limiting), R-TASK-114 (HIBP)
Phase 3 — Database + APIs
Phase 4 — Stripe Billing + PATCH-001 streaming + PATCH-002 webhook idempotency
Phase 5 — Agent (verbatim port per ADR-003)
Phase 6 — Demo + Landing + 14 of 17 cluster R-TASKs
Phase 7 — Admin
Phase 8 — Email + R-TASK-170 newsletter + R-TASK-174 legal aggregator + TASK-057 legal pages
Phase 9 — Analytics + Polish
Phase 10 — E2E + Deploy
Phase 11 — Production Readiness + R-TASK-176 Directus + R-TASK-126 golden-output suite + R-TASK-128 alerting
Phase 12 — Pre-launch checklist exit gate (R-TASK-141)
```

Cluster adds approximately **4 weeks of build effort** to the original phase 6 + 8 timeline, plus ~17,000-20,000 words of operator-authored content (Tier A + Tier B per `docs/CONTENT_TODO.md`).

### Risk: Coming-soon badge proliferation

Operator chose to ship cluster R-TASKs with `<ComingSoonBadge>` decorations on unfinished prose rather than hiding the links entirely. This is a deliberate self-reminder mechanism per operator preference 2026-05-08. Risk: if too many badges remain visible at launch, the site signals incompleteness rather than active development.

**Mitigation:** track badged links in `docs/CONTENT_TODO.md`; commit to clearing Tier B items within 60 days post-launch; if any remain after 90 days, re-evaluate whether to defer to v1.1 (and remove from footer) or simplify.
