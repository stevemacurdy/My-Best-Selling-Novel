<!-- APPLY: CREATE -->
# Remediation Packet — My Best Selling Novel

This packet contains the audit remediation deliverables from the AUDIT_REPORT.md run on 2026-05-04. It addresses all 106 gaps and the 6 architectural observations raised during the audit.

**Decisions locked 2026-05-05** by Steve Macurdy:
1. **R-TASK-101 — Path A.** Team seats deferred to v2; marketing copy must be updated.
2. **ADR-003 — Approved.** Decision #11 split into 11a (prompts frozen) and 11b (JSX modernizable behind golden-output tests). Five gated tasks unblocked.
3. **ADR-004 — Voided 2026-05-06.** Lifetime tier was eliminated entirely on 2026-05-06 (operator decision, PATCH-3 sub-deliverable A.3); ADR-004's surrounding-controls dependency declaration is no longer applicable.

Claude Code can now begin Phase 11 work without further operator decisions.

## What's in this packet

```
remediation/
├── REMEDIATION_OVERVIEW.md                  ← gap-to-task index; READ FIRST
├── README.md                                ← you are here
├── docs/
│   ├── PROGRESS.md                          ← updated tracker w/ 112 total tasks
│   ├── BUILD_STRATEGY_ADDENDUM.md           ← Phases 11 + 12 added
│   ├── architecture/
│   │   ├── ADR-001-supabase-triple-bind.md
│   │   ├── ADR-002-chapter-grain.md
│   │   ├── ADR-003-verbatim-port-split.md   ← APPROVED 2026-05-05
│   │   └── ADR-004-005-006.md               ← ADR-004 VOIDED 2026-05-06 (lifetime tier eliminated)
│   └── TASKS/
│       ├── PATCH-001-task021-maxduration-streaming.md
│       ├── PATCH-002-task024-webhook-idempotency.md
│       ├── PATCH-003-health-endpoint.md
│       ├── R-TASK-101-team-seats-decision.md      ← Path A LOCKED — defer to v2
│       ├── R-TASK-102-account-deletion.md
│       ├── R-TASK-103-admin-mfa.md
│       ├── R-TASK-104-rate-limiting.md
│       ├── R-TASK-105-vendor-dpas.md              ← START FIRST (calendar)
│       ├── R-TASK-106-sentry-integration.md       ← PHASE 1 PATCH
│       ├── R-TASK-107-support-inbox.md
│       ├── R-TASK-108-brand-contrast-rule.md
│       ├── R-TASK-109-contrast-lint.md
│       ├── R-TASK-110-a11y-baseline.md
│       ├── R-TASK-111-audit-event-log.md
│       ├── R-TASK-112-118-operations-cluster.md   ← 7 tasks bundled
│       ├── R-TASK-119-125-legal-env-cicd-cluster.md ← 7 tasks bundled
│       ├── R-TASK-126-133-observability-testing-cluster.md ← 8 tasks bundled
│       ├── R-TASK-134-141-content-launchops-cluster.md ← 8 tasks bundled
│       ├── R-TASK-142-148-medium-cluster.md       ← 7 tasks bundled
│       └── R-TASK-149-153-final-cluster.md        ← 5 tasks bundled
└── supabase/
    └── migrations/
        ├── 007_team_memberships.sql.vnext        ← NEUTRALIZED (Path A — DO NOT APPLY)
        ├── 009_deletion_requests.sql             ← R-102
        ├── 010_stripe_webhook_events.sql         ← PATCH-002
        ├── 012_audit_event_log.sql               ← R-111
        ├── 013_role_super_admin_and_mfa_recovery.sql ← R-103, R-113
        ├── 014_document_acceptances.sql          ← R-120
        └── 015_soft_delete_columns.sql           ← R-144
```

## How to integrate this into your existing build package

This packet is **additive** to your existing `mybestsellingnovel_build_package.zip`. It does NOT replace existing TASK files. It does NOT replace BUILD_STRATEGY.md or PROGRESS.md.

### Step 1 — Decisions are locked (recorded 2026-05-05)

The three architectural decisions that previously gated Phase 11 are now resolved:

1. **R-TASK-101 → Path A.** Team seats deferred to v2.
   - First Phase 11 work item is to update marketing copy: remove "2 team seats" from `app/pricing/page.tsx`, update Stripe Publisher product description (manual operator step in Stripe Dashboard), revise Decision #7 in `docs/ENGINEERING_DECISIONS.md`, append v2 design notes to `docs/DEFERRED_TO_VNEXT.md`.
   - Migration `007_team_memberships.sql` ships in this packet with `.vnext` suffix and a deferral header. Do not remove the suffix without re-opening R-TASK-101.
   - All downstream tasks (R-102 deletion, R-111 audit, R-133 RLS isolation tests) treat the v1 RLS contract as single-user-per-account.

2. **ADR-003 → Approved.** Decision #11 is split.
   - Decision #11a: AI prompt strings stay frozen verbatim. The agent's prompt strings cannot be edited; behavioral tests enforce.
   - Decision #11b: JSX coding conventions are modernizable provided golden-output behavioral tests pass. `var`, `function(){}`, inline handlers, and the 1,917-line single-file structure can be refactored under test.
   - Phase 11 first session must update Decision #11 in `docs/ENGINEERING_DECISIONS.md` to record the split, citing ADR-003.
   - Five tasks unblocked: R-TASK-109 (contrast lint can include `components/agent/`), R-TASK-110 (a11y baseline can include the agent), R-TASK-126 (structured logging can wrap agent), R-TASK-127 (metrics can include agent latency), R-TASK-128 (alerting can fire on agent errors).
   - Golden-output suite (specified in ADR-003) is a hard prerequisite for any agent JSX refactor — Phase 11 builds the suite first, then refactor work begins.

3. **ADR-004 → Voided.** Lifetime tier eliminated entirely.
   - Operator decision 2026-05-06 (PATCH-3 sub-deliverable A.3): the long-tail liability of a $3,456.78 "lifetime of product" SKU outweighed its revenue contribution. Lifetime tier removed from product entirely.
   - Stripe price IDs reduced from 6 to 4 (no `author_lifetime`, no `publisher_lifetime`).
   - `NEXT_PUBLIC_LIFETIME_ENABLED` env var deleted from `.env.local.example` (3 env vars removed total; was 19, now 16).
   - 7 email templates in R-TASK-135 (was 8 — `lifetime-confirmation.tsx` removed).
   - TASK-025 (lifetime-handling) deleted entirely; replaced with deletion-marker stub.
   - The 6 surrounding controls originally identified by ADR-004 (R-TASK-119 refund policy, R-TASK-120 acceptance recording, R-TASK-135 templates, R-TASK-103 MFA, PATCH-002 webhook idempotency, R-TASK-107 support inbox) all still ship for non-lifetime reasons. They are no longer linked to a "flag flip" gate; each ships on its own merits.
   - Pre-launch checklist (R-TASK-141) no longer needs to verify a lifetime gate.

### Step 2 — Merge files into your build package

```bash
# Merge into your existing repo's docs/ folder
cp -r remediation/docs/architecture/    docs/architecture/
cp -r remediation/docs/TASKS/           docs/TASKS-REMEDIATION/  # keep separate from existing TASKS/
cp    remediation/docs/PROGRESS.md      docs/PROGRESS.md          # REPLACES old PROGRESS

# Append BUILD_STRATEGY addendum
cat remediation/docs/BUILD_STRATEGY_ADDENDUM.md >> docs/BUILD_STRATEGY.md

# Add new migrations
cp remediation/supabase/migrations/* supabase/migrations/

# Keep the overview at repo root for reference
cp remediation/REMEDIATION_OVERVIEW.md docs/REMEDIATION_OVERVIEW.md
```

The original `docs/TASKS/` folder is unchanged — original TASK-001 through TASK-068 remain. The new `docs/TASKS-REMEDIATION/` (or merge into existing TASKS/ if you prefer single-folder) holds R-TASK-* and PATCH-* files.

### Step 3 — Add new vendor accounts (start of Phase 11)

Before any Phase 11 work, create accounts:
1. **Sentry** (R-TASK-106) — sentry.io; create projects `mybestsellingnovel-prod` and `mybestsellingnovel-staging`
2. **Upstash** (R-TASK-104) — upstash.com; create Redis database
3. **Cloudflare R2** (R-TASK-116) — Cloudflare account; create bucket `mybsn-backups`
4. **Better Stack** (R-TASK-129, 139, 140) — betterstack.com; $30/mo combined plan
5. **Axiom** (R-TASK-126) — axiom.co; free tier; create dataset `mybsn-logs`

Add env vars to Vercel and `.env.local.example`:
```
SENTRY_DSN=
SENTRY_AUTH_TOKEN=
NEXT_PUBLIC_SENTRY_DSN=
SENTRY_ORG=
SENTRY_PROJECT=
UPSTASH_REDIS_REST_URL=
UPSTASH_REDIS_REST_TOKEN=
R2_ACCOUNT_ID=
R2_ACCESS_KEY_ID=
R2_SECRET_ACCESS_KEY=
R2_BUCKET=
AXIOM_TOKEN=
AXIOM_DATASET=mybsn-logs
CRON_SECRET=  # random; for Vercel Cron auth
```

<!-- Removed 2026-05-06: NEXT_PUBLIC_LIFETIME_ENABLED env var. Lifetime tier eliminated; flag no longer needed. -->

### Step 4 — Initiate vendor DPAs (calendar-bound)

R-TASK-105 has long calendar time. Email these vendors AS SOON AS YOU READ THIS:
- privacy@anthropic.com — DPA request (longest review)
- support@supabase.io — DPA request
- legal@resend.com — DPA request

The other 3 (Stripe, Vercel, Google Analytics) are self-serve. Save the signed PDFs to `docs/legal/dpas/`.

### Step 5 — Execute remediation in phase order

Follow `docs/PROGRESS.md`. Sequence:
1. Phase 1 + R-TASK-106 (Sentry) at the same time
2. Phases 2-4 with PATCH-001, PATCH-002 inline
3. Phases 5-10 as originally planned
4. Phase 11 (Production Readiness) — ~30 sessions
5. Phase 12 (Launch Operations) — ~10 sessions plus calendar wait
6. TASK-068 production deploy ONLY after Phase 12 exit gate

## Estimated total effort

| Phase | Sessions | Calendar |
|---|---|---|
| Phases 1-10 (original) | ~70 sessions | ~3-4 weeks intensive |
| Phase 11 (new) | ~30 sessions | ~2 weeks intensive |
| Phase 12 (new) | ~10 sessions + 1-3 weeks DPAs | ~3 weeks |
| **Total** | **~110 sessions** | **~8-10 weeks** |

(For reference: original CLAUDE.md estimated ~60 sessions for 68 tasks. Adding 41 R-TASKs + 3 PATCHes ~= 44 sessions of additional work, but several are cluster-bundled in single sessions.)

## Vendor cost summary

| Vendor | At launch | At 1,000 paying users |
|---|---|---|
| Supabase Pro | $25/mo | $25/mo (or Team at $599) |
| Vercel Pro | $20/mo | $20/mo |
| Stripe | per-transaction (2.9% + $0.30) | same |
| Anthropic | usage-based | ~$3,000/mo at projected scale |
| Resend | $20/mo | $20/mo |
| Sentry Team | $26/mo | $26/mo |
| Better Stack | $30/mo | $30/mo |
| Upstash Redis | free | $10/mo |
| Cloudflare R2 | $0.015/GB | $1-2/mo |
| Axiom | free | free or upgrade |
| **Subtotal infra** | **~$120/mo** | **~$3,200/mo (mostly Anthropic)** |

## Final pre-launch checklist

Before announcing publicly:

- [ ] All 9 CRITICAL audit gaps resolved
- [ ] All HIGH gaps in Phase 11 + 12 resolved
- [ ] All 6 vendor DPAs signed and filed in `docs/legal/dpas/`
- [ ] DR drill #1 completed; documented in `docs/runbooks/dr-drills/`
- [ ] First on-call SMS test passed
- [ ] Status page live at status.mybestsellingnovel.com
- [ ] Sentry alerts firing on test triggers in staging
- [ ] /api/health returning 200 for 7 consecutive days in staging
- [ ] Email deliverability verified (mxtoolbox SPF/DKIM/DMARC pass)
- [ ] Lighthouse Accessibility score ≥ 95 on /, /pricing, /signup, /signin, /account
- [ ] Risk register reviewed; quarterly review scheduled
- [ ] Pre-launch watch plan rehearsed; on-call channel pinned

## Questions / clarifications

The audit and this remediation packet are documentation. Implementation runs in Claude Code sessions. Each R-TASK file is structured to be self-contained for a single Claude Code session pick-up.

If a task seems unclear, the source of truth is:
1. The task file's "Implementation Requirements" section
2. The audit's GAP entry (in AUDIT_REPORT.md) for the underlying rationale
3. The spec packet's CLAUDE.md and ENGINEERING_DECISIONS.md for project conventions

If conflicts arise during implementation (e.g., a task references a function Claude Code didn't implement yet), preserve the original spec's intent and note the deviation in PROGRESS.md.

---

## v4 status (2026-05-09)

This is the v4 remediation packet. Key changes from v3:

- **All 44 expand-eligible original tasks now expanded** (v3 left 34 deferred)
- **17-task v1 content cluster added** (R-TASK-160 through R-TASK-176) — operator scope expansion 2026-05-08 driven by footer copy spec
- **Path B chosen** (newsletter-first; Sanity + blog/prompts/interviews deferred to v1.1)
- **Operator-voice email copy drafted** for welcome + upgrade emails
- **Operator's hero + footer + CAN-SPAM postal address LOCKED** — see REMEDIATION_OVERVIEW.md changelog
- **Final v1 env-var count: 22** (up from 17 in v3 due to R-TASK-170/172 + TASK-058 server-side GA additions)
- **5 new side-deliverable docs** in `docs/`: CONTENT_TODO, CONTENT_REVIEW_SCHEDULE, EMAIL_COMPLIANCE, AFFILIATE_v1_1_PLAN, DIRECTUS

See `REMEDIATION_OVERVIEW.md` for full v4 changelog.

---

*Generated 2026-05-04 by audit remediation system v2.0; v4 PATCH-3 round 2 update 2026-05-09.*
