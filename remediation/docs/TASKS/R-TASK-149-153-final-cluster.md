<!-- APPLY: CREATE -->
# R-TASK-149 through R-TASK-153: Final Cluster (LOW + Process)

This file batches the remaining LOW-priority and process-completion tasks.

## Pre-flight: re-read current state

Before making any change, read the current state of every file listed in "Files to Modify" below. Verify the gap(s) addressed by this task are still present in the current code. Specifically:

- For each file in "Files to Modify": view the file and confirm the condition the audit observed (e.g., "no rate limiting on /api/ai") still applies.
- For each gap in "Resolves Gaps": confirm the gap remains open. The audit was conducted on 2026-05-04; if the codebase changed since, the gap may have been partially or fully addressed.
- If a gap is no longer present, report this finding in PROGRESS.md, mark this task as superseded, and stop. Do not make changes.
- If a gap is partially addressed, scope this task to the remaining work and document in this file's Session Notes what was already addressed and skipped.
- If the gap is still fully present as the audit described, proceed with the rest of this task.

This pre-flight catches the case where the codebase changed between audit and remediation — exactly the failure mode that produces silent overwrites of unrelated work.

**Cluster files only:** Each sub-task in this cluster MUST run its own pre-flight against the files it touches before that sub-task begins. Do not batch the pre-flights.

---

## R-TASK-149: Definition-of-Done Expansion (Deferred-to-V-Next List)

**Status:** NOT STARTED · **Phase:** 12 · **Sessions:** 0.5 · **Resolves:** GAP-104

### Files to Create
- `docs/DEFERRED_TO_VNEXT.md` — explicit registry of items deferred from v1 to v1.1 or later

### Required entries (from this audit)
- **Team seats** (if Path A chosen on R-TASK-101) — collaborative editing, invitation flow, seat-aware RLS, multi-user audit. Targeted: v1.1.
- **Chapter versioning** (per OBS-002) — version history table, rollback UI. Targeted: v2.
- **Full agent E2E test coverage** (per R-TASK-131 limited scope) — Playwright covers S0 only at v1; full S0-S11 in v1.1
- **Agent accessibility refactor** (per ADR-003) — keyboard navigation in agent interactive components; full WCAG 2.2 AA conformance for agent. Targeted: v1.1.
- **EU-resident infrastructure** (per R-TASK-118) — Supabase EU region project; data residency option for EU customers. Targeted: v2.
- **Multi-language UI + content** (per GAP-075) — Spanish, French. Targeted: v2.
- **Mobile native apps** — iOS, Android. Targeted: v2.
- **Public API for third-party integrations** — currently REST routes for own consumption only. Targeted: v2.
- **Automated rollback on alert** (currently manual) — Vercel revert triggered by Sentry threshold. Targeted: v1.1.
- **Auth provider extraction** (per OBS-001) — split auth from Supabase to dedicated provider at 5,000-user tripwire. Targeted: when triggered.

### Format per entry
```markdown
## Team seats
**Deferred to:** v1.1 (target: 6 months post v1 launch)
**Why deferred:** doubles complexity of every book/chapter API route; adds ~6 sessions of work; persona analysis doesn't strongly require for v1
**Reactivation trigger:** customer-driven (3+ customers requesting), or 1-year mark
**v1 commitment:** marketing copy on /pricing does not mention "team seats" until shipped
**v1.1 design:** see R-TASK-101 Path B
```

### Tests Required
- AT-149-1: DEFERRED_TO_VNEXT.md exists with all 10 entries documented
- AT-149-2: Each entry has: deferred-to, why, reactivation trigger, v1 commitment, design notes

---

## R-TASK-150: Risk Register

**Status:** NOT STARTED · **Phase:** 12 · **Sessions:** 0.5 · **Resolves:** GAP-106

### Files to Create
- `docs/architecture/RISK_REGISTER.md`

### Format
| Risk | Category | Likelihood | Impact | Mitigation | Owner | Review |
|---|---|---|---|---|---|---|
| Anthropic API outage | vendor | Medium | High (no AI features) | degraded mode (R-TASK-148 vendor manifest); status page | Steve | quarterly |
| Supabase region outage | vendor | Low-Medium | Critical (full down) | DR plan (R-TASK-123); off-Supabase backup (R-TASK-116) | Steve | quarterly |
| Stripe chargeback ratio above 0.75% | financial | Low | Critical (Stripe processor probation) | refund policy (R-TASK-119); support inbox (R-TASK-107); MFA on lifetime (R-TASK-103) | Steve | monthly |
| Manuscript leaked from compromised admin | security | Low | Catastrophic | MFA required (R-TASK-103); audit log (R-TASK-111); admin role grant via API only (R-TASK-113) | Steve | quarterly |
| EU regulator inquiry | legal | Low | High | DPAs (R-TASK-105); cookie consent (R-TASK-134); residency doc (R-TASK-118) | Steve | annual |
| AI cost spike from compromised account | financial | Medium | Medium ($1,000s/mo) | rate limiting (R-TASK-104); per-user monthly cap (existing); alerts (R-TASK-128) | Steve | quarterly |
| Vercel function timeout regression | technical | Low | High (AI features broken) | maxDuration config (PATCH-001); Sentry alerts (R-TASK-128) | Steve | quarterly |
| Deletion request unfulfillable (regulatory window missed) | legal | Low | High | 7-day grace + daily cron (R-TASK-102) | Steve | quarterly |
| Lifetime tier liability — early shutdown | business | Low | High | refund policy commitment (R-TASK-119); 5-year minimum guarantee | Steve | annual |
| Single point of failure in operator (Steve only on-call) | operations | Medium | High | hire second on-call by 100-customer mark | Steve | as scheduled |

### Tests Required
- AT-150-1: RISK_REGISTER.md exists with all 10+ risks
- AT-150-2: Each risk has owner and review cadence
- AT-150-3: First quarterly review scheduled in calendar

---

## R-TASK-151: Brand + Content + Accessibility Low-Effort Additions

**Status:** NOT STARTED · **Phase:** 11 · **Sessions:** 0.5 · **Resolves:** GAP-002, GAP-003, GAP-023, GAP-024, GAP-025, GAP-035, GAP-036, GAP-071, GAP-073, GAP-074, GAP-083

### One-line / one-section additions

- **GAP-002 Error/destructive color**: already added to `lib/brand.ts` (R-TASK-108) as `colors.danger = '#C0392B'`
- **GAP-003 Logo**: operator supplies SVG; place in `public/logo.svg` and `public/logo-mark.svg` (favicon-style); update `app/layout.tsx` favicon link
- **GAP-023 PII inventory**: append to `docs/architecture/DATA_RESIDENCY.md` (R-TASK-118) — table of every PII field stored
- **GAP-024 Encryption-at-rest documented**: append to `docs/architecture/DATA_RESIDENCY.md` — "All data is encrypted at rest using Supabase's default AES-256 encryption (managed by AWS KMS)"
- **GAP-025 TLS 1.3 pinned**: Vercel default supports TLS 1.2+; document in `docs/architecture/DATA_RESIDENCY.md` — "All connections use TLS 1.3 (preferred) or TLS 1.2 (fallback)"
- **GAP-035 CI grep-lint for canon**: implemented as `scripts/canon-lint.ts` in R-TASK-147; this gap closes when that ships
- **GAP-036 Microcopy catalog**: `docs/content/MICROCOPY.md` — initial entries (welcome email body, upgrade email body, error messages from R-TASK-137, button labels)
- **GAP-071 prefers-reduced-motion**: implemented in `globals.css` per R-TASK-110; this gap closes when that ships
- **GAP-073 A11y issue SLA**: documented in `docs/architecture/A11Y_BASELINE.md` per R-TASK-110; closed when that ships
- **GAP-074 i18n future v2**: single line in `docs/DEFERRED_TO_VNEXT.md` (R-TASK-149)
- **GAP-083 Email template versioning**: each template file has `export const VERSION` constant (per R-TASK-135); `docs/content/EMAIL_VERSION_LOG.md` tracks changes

### Tests Required
- AT-151-1: All 11 gaps have their one-line documentation in place
- AT-151-2: Logo files in /public; rendered in header

---

## R-TASK-152: Operations & Process Additions

**Status:** NOT STARTED · **Phase:** 12 · **Sessions:** 0.5 · **Resolves:** GAP-097, GAP-098, GAP-100, GAP-105

### Files to Create
- `docs/SLA.md` — response and resolution SLAs
- `docs/CHANGELOG.md` (or use the existing READ.md if conventional) — public changelog

### SLA (GAP-097)
```markdown
## Service Level Agreement

### Response time
- Critical (data loss, billing dispute): 1 business day
- High (feature unavailable): 2 business days
- Standard: 3-5 business days

### Uptime target
- 99.5% monthly (≤ 3.6 hours of downtime per month)
- Status page at status.mybestsellingnovel.com tracks actual uptime

### Resolution time targets
- Critical: 7 days
- High: 30 days
- Standard: best effort
```

### Changelog (GAP-098)
- Public URL: https://mybestsellingnovel.com/changelog
- Updated on every prod deploy
- Format: `2026-MM-DD — short description; affected: [audience]`

### Feedback channel (GAP-100)
- Pin a "Have feedback?" link in /account → goes to mailto:feedback@mybestsellingnovel.com
- Or: simple form at /feedback → /api/contact (R-TASK-107) with topic=feedback

### Scope-expansion threshold (GAP-105)
Documented in CLAUDE.md as Rule 11 addition:
- "Adding a feature requires only a TASK file if scope is < 5 files. Beyond 5 files, scope is escalated to a Phase block with discrete TASK files per file."

### Tests Required
- AT-152-1: SLA.md exists; linked from /help
- AT-152-2: /changelog page renders; entries dated
- AT-152-3: Feedback channel reachable from /account

---

## R-TASK-153: DoD Framing (Pass/Fail + Required Tests List)

**Status:** NOT STARTED · **Phase:** 12 · **Sessions:** 0.5 · **Resolves:** GAP-101, GAP-102

### Files to Modify
- `CLAUDE.md` — Success Metrics section gets pass/fail framing

### Pass/fail framing for CLAUDE.md success metrics

```markdown
## Success Metrics — Pass/Fail Criteria

### v1 Launch (after Phase 12 complete)
- [ ] **AI call success rate ≥ 98%** — measured 7 days post-launch via Axiom dashboard (R-TASK-127); pass = green
- [ ] **Time to first AI output ≤ 15 seconds (TTFB)** — pass at p95
- [ ] **Test card 4242 produces a working subscription within 60 seconds** — verified via E2E (R-TASK-131)
- [ ] **/api/health uptime ≥ 99.5%** in first 30 days — Better Stack
- [ ] **Sentry error rate < 5/hour at steady state** — first 30 days
- [ ] **Lighthouse Accessibility score ≥ 95** on all in-scope pages — verified pre-launch

### Required tests list (referenced in BUILD_STRATEGY.md Phase 11/12)
1. AT-101 (team seats decision documented)
2. AT-102-{1..10} (account deletion flow)
3. AT-103-{1..8} (admin MFA)
4. AT-104-{1..6} (rate limiting)
[... full enumeration of all R-TASK acceptance tests ...]

### Test pass criteria
- All ATs marked ✅ in PROGRESS.md before launch
- Any AT marked 🟡 (partial) requires written justification + ADR
- Any AT marked ❌ (failed) blocks launch unless explicitly waived by operator
```

### Tests Required
- AT-153-1: CLAUDE.md updated with pass/fail criteria
- AT-153-2: Required tests list in BUILD_STRATEGY.md references all R-TASK ATs
- AT-153-3: PROGRESS.md tracks AT completion

---

*End of R-TASK-149 through R-TASK-153 cluster*

---

# REMEDIATION TASK INDEX (complete)

## Phase 1 patches (run during existing Phase 1)
- R-TASK-106: Sentry integration

## Phase 4 patches (run during existing Phase 4)
- PATCH-001: TASK-021 maxDuration + streaming
- PATCH-002: TASK-024 webhook idempotency
- PATCH-003: /api/health endpoint

## Phase 11 — Production Readiness (run after Phase 10)
- R-TASK-101: Team seats — Path A LOCKED (defer to v2; copy + decisions log update only)
- R-TASK-102: Account deletion + cross-system fan-out
- R-TASK-103: Admin MFA enrollment + enforcement
- R-TASK-104: Rate limiting (Upstash Redis)
- R-TASK-108: Brand contrast rule + canonical store
- R-TASK-109: Contrast lint script + CI integration
- R-TASK-110: Accessibility baseline (WCAG 2.2 AA)
- R-TASK-111: Audit event log
- R-TASK-112: Tenancy offboarding policy
- R-TASK-113: Admin role grant/revoke
- R-TASK-114: Password policy hardening
- R-TASK-117: User data export
- R-TASK-118: Data residency
- R-TASK-119: Legal compliance manifest expansion
- R-TASK-120: TOS/Privacy acceptance recording
- R-TASK-122: Staging environment
- R-TASK-124: GitHub Actions CI + security scans
- R-TASK-126: Structured logging
- R-TASK-127: Metrics dashboard
- R-TASK-130: Vitest setup + lib unit tests
- R-TASK-131: Playwright smoke tests
- R-TASK-132: Stripe webhook contract tests
- R-TASK-133: Automated RLS isolation tests
- R-TASK-134: EU cookie consent banner
- R-TASK-135: Email template suite
- R-TASK-137: Failure mode catalog
- R-TASK-138: Migration CI test
- R-TASK-142: Performance & capacity targets
- R-TASK-143: UI specification document set
- R-TASK-144: Soft-delete + undo-delete UX
- R-TASK-145: Auth + API hardening
- R-TASK-147: Canonical store
- R-TASK-148: Operational completeness
- R-TASK-151: Brand + content + a11y low-effort additions
- R-TASK-105: Vendor DPAs (kickoff; engineering work in Phase 11, vendor-signature calendar tail extends into Phase 12)

## Phase 12 — Launch Operations (run after Phase 11)
- R-TASK-115: Key rotation procedure
- R-TASK-116: Off-Supabase backup
- R-TASK-121: Subprocessor change notification
- R-TASK-123: DR plan + drill
- R-TASK-125: Deploy procedure + rollback runbook
- R-TASK-128: Alerting rules + on-call routing
- R-TASK-129: External uptime monitoring
- R-TASK-136: Email deliverability DNS
- R-TASK-139: On-call rotation + Better Stack incident
- R-TASK-140: Public status page
- R-TASK-141: First-48h watch plan
- R-TASK-146: Operations baseline
- R-TASK-149: Deferred-to-v-next list
- R-TASK-150: Risk register
- R-TASK-152: Operations & process additions
- R-TASK-153: DoD framing

**Total: 41 R-TASK files + 3 PATCH files = 44 remediation deliverables.**
