<!-- APPLY: CREATE -->
# R-TASK-134 through R-TASK-141: Content, Email & Launch Operations Cluster

This file batches 8 related HIGH-priority tasks.

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

## R-TASK-134: EU Cookie Consent Banner

**Status:** NOT STARTED · **Phase:** 11 · **Sessions:** 1 · **Resolves:** GAP-078
**Dependencies:** R-TASK-119

### Files to Create
- `components/CookieConsent.tsx` — consent banner with categories
- `lib/cookies.ts` — consent state management; gates GA4, Stripe analytics

### Vendor choice
**Klaro** (https://klaro.org) — open-source, EU-compliant, free. Lightweight (~30KB).

Alternatives: OneTrust ($), Cookiebot ($/mo).

### Files to Modify
- `app/layout.tsx` — render `<CookieConsent />` at root
- `app/(analytics)/ga.tsx` (TASK-058) — read consent state; only fire GA4 if consent given for `analytics` category
- `app/cookies/page.tsx` (R-TASK-119) — full cookie inventory + consent management UI

### Categories
1. **Strictly necessary** (always on, no consent prompt)
   - Supabase auth session cookie (`sb-access-token`, `sb-refresh-token`)
   - CSRF token
2. **Analytics** (default off in EU; opt-in)
   - GA4 cookies (`_ga`, `_ga_*`)
3. **Functional** (default off; not currently used)
   - reserved for future feature flags

Stripe Checkout cookies are set on Stripe's domain during the checkout iframe — disclosed in Cookie Policy but not gated by our banner (we don't control Stripe's domain).

### Behavior
- First EU/UK visit: banner appears at bottom; "Accept all", "Reject all", "Manage preferences"
- Choice stored in `localStorage` (technically allowed without consent because it's necessary for the consent mechanism itself)
- Consent state revisitable via /cookies page
- Non-EU users: banner does NOT appear (geo-detection via Vercel Geo headers)

### Tests Required
- AT-134-1: Visiting from EU IP shows banner
- AT-134-2: "Reject all" prevents GA4 from firing
- AT-134-3: "Accept all" enables GA4
- AT-134-4: Choice persists across page loads
- AT-134-5: /cookies page allows revoking previously-given consent

---

## R-TASK-135: Email Template Suite

**Status:** NOT STARTED · **Phase:** 11 · **Sessions:** 2 · **Resolves:** GAP-079
**Dependencies:** TASK-053, TASK-054, TASK-055

### Files to Create (7 templates beyond TASK-054 welcome and TASK-055 upgrade — was 8; lifetime-confirmation removed 2026-05-06)

1. `emails/email-verification.tsx` — sent on signup; click link to verify
2. `emails/password-reset-branded.tsx` — replaces Supabase default; branded
3. `emails/renewal-reminder.tsx` — sent 7 days before annual subscription renews
4. `emails/dunning.tsx` — sent on `invoice.payment_failed`; "your card failed; update billing"
5. `emails/cancellation-confirmation.tsx` — sent on `subscription.deleted`
6. `emails/receipt.tsx` — sent on every successful invoice payment (custom invoice from your domain rather than Stripe-only)
7. `emails/downgrade-notification.tsx` — sent when tier reduces (cancel takes effect at period_end)

<!-- Removed 2026-05-06: emails/lifetime-confirmation.tsx (template #6 in original suite). Lifetime tier eliminated per Decision #29 revision; no lifetime checkout event to trigger this template. Not implemented. -->

### Files to Modify
- `lib/email.ts` (TASK-053) — add helpers for each new template
- `app/api/stripe/webhook/route.ts` (TASK-024) — invoke right templates on right events
- `vercel.json` — daily cron for renewal reminders: `/api/cron/renewal-reminders`

### Renewal reminder cron
```typescript
// app/api/cron/renewal-reminders/route.ts
export async function GET(req: Request) {
  // Authenticate via header secret (Vercel Cron sets x-vercel-cron-job)
  if (req.headers.get('authorization') !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response('unauthorized', { status: 401 });
  }
  const sb = getServiceRoleSupabase();
  const target = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  // Find annual subscriptions renewing in ~7 days
  const { data } = await sb.from('subscriptions')
    .select('user_id, tier, current_period_end, profiles(email)')
    .eq('status', 'active')
    .gte('current_period_end', new Date(target.getTime() - 12*60*60*1000).toISOString())
    .lt('current_period_end', new Date(target.getTime() + 12*60*60*1000).toISOString());
  for (const sub of data ?? []) {
    await sendRenewalReminder(sub);
  }
  return Response.json({ sent: data?.length ?? 0 });
}
```

### Versioning (also satisfies GAP-083)
Each template has a `version` constant in its file (e.g., `export const VERSION = '2026-05-04'`). Email-template change tracker doc tracks which version was active when.

### Tests Required
- AT-135-1: Each of the 7 templates renders with sample props in test
- AT-135-2: Renewal reminder cron sends to correct subset of users
- AT-135-3: All templates include unsubscribe link (commercial emails per CAN-SPAM; satisfies GAP-080)

<!-- ADR-004 cross-binding paragraph removed 2026-05-06: ADR-004 voided when lifetime tier was eliminated. This task still ships for the non-lifetime reasons originally documented above. -->
---

## R-TASK-136: Email Deliverability — SPF/DKIM/DMARC DNS

**Status:** NOT STARTED · **Phase:** 12 · **Sessions:** 0.5 · **Resolves:** GAP-081

### DNS records (manual setup at your DNS provider for mybestsellingnovel.com)

```
; SPF — authorize Resend to send on your behalf
mybestsellingnovel.com.   3600  IN  TXT  "v=spf1 include:_spf.resend.com ~all"

; DKIM — Resend provides this on their dashboard; replace [token] with provided value
resend._domainkey.mybestsellingnovel.com.  3600  IN  TXT  "v=DKIM1; k=rsa; p=[token]"

; DMARC — start with quarantine; can tighten to reject after 30 days clean
_dmarc.mybestsellingnovel.com.  3600  IN  TXT  "v=DMARC1; p=quarantine; rua=mailto:dmarc-reports@mybestsellingnovel.com; pct=100; aspf=r; adkim=r"

; MX (for receiving support@) — Cloudflare Email Routing
mybestsellingnovel.com.  3600  IN  MX  10  isaac.mx.cloudflare.net.
mybestsellingnovel.com.  3600  IN  MX  20  linda.mx.cloudflare.net.
mybestsellingnovel.com.  3600  IN  MX  30  amir.mx.cloudflare.net.
```

(Cloudflare Email Routing MX values are subject to change; pull current values from Cloudflare dashboard at setup time.)

### Verification
1. Resend Dashboard → Domains → mybestsellingnovel.com — should show "Verified" green checks for SPF, DKIM
2. https://mxtoolbox.com — check SPF, DKIM, DMARC all return success
3. Send test email; check headers in receiving Gmail/Outlook for `Authentication-Results: ... spf=pass dkim=pass dmarc=pass`

### Tighten DMARC after 30 days
- Once DMARC reports show 100% pass for 30 days, tighten to `p=reject; pct=100`

### Tests Required
- AT-136-1: mxtoolbox SPF check passes
- AT-136-2: Test email from production (welcome email to test address) shows SPF=pass DKIM=pass DMARC=pass in headers
- AT-136-3: DMARC aggregate reports begin arriving at dmarc-reports@ inbox

---

## R-TASK-137: Failure Mode Catalog

**Status:** NOT STARTED · **Phase:** 11 · **Sessions:** 2 · **Resolves:** GAP-091
**Dependencies:** R-TASK-126, R-TASK-127

### Files to Create
- `docs/architecture/FAILURE_MODES.md` — per-feature failure mode table

### Format
Per major feature (signup, signin, /api/ai, audio upload, audio playback, book CRUD, chapter CRUD, agent step S0-S11 individually, /pricing checkout, account deletion, MFA challenge):

| Failure | Trigger | User-visible | What system does | Recovery |
|---|---|---|---|---|
| Anthropic 529 (overloaded) | external | "AI is overloaded; try again in 60s" toast | Sentry capture; usage NOT incremented; retry-after suggested | user retries; if persistent, status page reflects |
| Anthropic 401 (key invalid) | env misconfig / rotation | "AI temporarily unavailable" + page-level banner | Sentry alert P1; on-call paged | rotate per R-TASK-115 |
| Vercel function timeout (60s exceeded) | rare on streaming with PATCH-001 | "Generation took too long; try shorter chapter" | Sentry capture; partial response NOT saved | user retries with smaller max_tokens |
| Supabase auth down | external | "Cannot sign in; please try again" | uptime monitor alerts; status page reflects | wait for Supabase recovery |
| Supabase DB down | external | All routes 503 | /api/health 503; on-call paged P1 | wait or fail to backup region (manual) |
| /api/audio body > 4.5MB | user uploads big file | "File too large; max 4MB per chapter chunk" 413 | enforce client-side first | user splits or compresses |
| /api/upload DOCX > 10MB | S2 step | "Manuscript file too large for direct upload" | enforce client-side; suggest copy-paste | user reduces or uses paste path |
| Stripe webhook signature invalid | misconfig or attack | none (silent 400 to caller) | Sentry alert P2 | check STRIPE_WEBHOOK_SECRET env |
| Stripe checkout fails (card declined) | user's card | "Payment failed: [Stripe message]" | no record created | user tries different card |
| Smart-diff merge conflict | concurrent edits in v2 with team seats | "Your changes couldn't be saved automatically" | last-write-wins for v1 | manual reconcile |
| Storage quota exceeded | Supabase plan limit | upload returns 507 | Sentry P1; on-call | upgrade plan or purge |

(catalog continues for all 30 features)

### Tests Required
- AT-137-1: FAILURE_MODES.md catalog covers all 30 features per CLAUDE.md
- AT-137-2: Each failure has UI-visible message verified manually or via Playwright
- AT-137-3: Each P1/P2 failure has corresponding alert in R-TASK-128

---

## R-TASK-138: Migration CI Test + Staging Dry-Run

**Status:** NOT STARTED · **Phase:** 11 · **Sessions:** 1 · **Resolves:** GAP-094
**Dependencies:** R-TASK-122, R-TASK-124

### Files to Create
- `.github/workflows/migrations.yml` — runs all migrations against ephemeral Postgres
- `scripts/test-migrations.sh` — boots local Postgres in Docker, runs all migrations in order, asserts no errors
- `docs/runbooks/migration-procedure.md` — manual deploy procedure to staging then prod

### Migration CI workflow
```yaml
name: Migrations
on:
  pull_request:
    paths: [supabase/migrations/**]

jobs:
  test-migrations:
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:15
        env: { POSTGRES_PASSWORD: test, POSTGRES_DB: test }
        ports: [5432:5432]
        options: --health-cmd pg_isready
    steps:
      - uses: actions/checkout@v4
      - run: |
          for f in supabase/migrations/*.sql; do
            echo "Applying $f"
            PGPASSWORD=test psql -h localhost -U postgres -d test -f "$f" || exit 1
          done
      # Repeat against a seeded copy
      - run: |
          PGPASSWORD=test psql -h localhost -U postgres -d test -f scripts/seed-test-data.sql
          # Re-run new migration; assert seed data still readable
```

### Manual deploy procedure to prod
1. PR includes only the new migration file under supabase/migrations/
2. CI passes (migrations apply cleanly to fresh + seeded)
3. Apply to staging Supabase via Dashboard SQL Editor
4. Run smoke test in staging
5. Apply to prod Supabase via Dashboard SQL Editor
6. Watch Sentry for 30 minutes

### Migration manifest (also satisfies GAP-092)
Each migration file front-matter:
```sql
-- Migration: 015_some_change.sql
-- Author: Steve
-- Date: 2026-05-15
-- Rollback: 015_some_change_rollback.sql
-- Locks: AccessExclusiveLock on table_x for ~50ms
-- Online/Offline: Online (no app downtime needed)
-- Destructive: No
```

### Tests Required
- AT-138-1: Migration CI passes for all current migrations
- AT-138-2: Adding a deliberately-broken migration fails CI
- AT-138-3: Procedure runbook exists with checklist

---

## R-TASK-139: On-Call Rotation + Better Stack Incident Management

**Status:** NOT STARTED · **Phase:** 12 · **Sessions:** 0.5 · **Resolves:** GAP-096

### Setup
1. Better Stack → Incidents → configure on-call rotation
2. Initial rotation: Steve Macurdy (sole on-call at v1)
3. Configure Better Stack to call/SMS Steve's phone number on P1 alerts
4. Acknowledgment SLA: 15 minutes for P1, 4 hours for P2

### Future-state
When second on-call person hired: weekly rotation Mon-Sun

### Files to Create
- `docs/runbooks/oncall.md` — what's on-call expected to do; what's escalation path

### Oncall responsibilities
- Acknowledge P1 alerts within 15 minutes
- Triage: real incident vs noise (false positive)
- Resolve or escalate (escalation path: rollback per R-TASK-125, or vendor support escalation, or post status page update)
- Post-incident: write a 1-page note in `docs/runbooks/incidents/YYYY-MM-DD-shortname.md`

### Tests Required
- AT-139-1: Test alert sent during business hours; SMS arrives, ack works
- AT-139-2: Off-hours test alert sent; SMS arrives within 5 minutes

---

## R-TASK-140: Public Status Page + Incident Comms Template

**Status:** NOT STARTED · **Phase:** 12 · **Sessions:** 0.5 · **Resolves:** GAP-099

### Setup
1. Better Stack Status Page (included with $30/mo plan)
2. Public URL: https://status.mybestsellingnovel.com (CNAME to Better Stack)
3. Components: API, AI Generation, Authentication, Database, File Storage, Email Delivery
4. Auto-incident creation: when uptime monitor (R-TASK-129) flags a component, status page auto-posts

### Files to Create
- `docs/templates/incident-comms.md` — pre-written templates for status page updates

### Comms templates
- **Investigating** — "We're investigating reports of [feature] not working"
- **Identified** — "We've identified the cause: [vendor/internal] [brief description]"
- **Monitoring** — "A fix has been deployed; we're monitoring"
- **Resolved** — "Resolved at [time]. Postmortem to follow."

### Files to Modify
- `app/page.tsx` (TASK-043) — footer mention "status: status.mybestsellingnovel.com"
- All emails footers — same

### Tests Required
- AT-140-1: status.mybestsellingnovel.com loads
- AT-140-2: Test incident posted; visible to public
- AT-140-3: Auto-incident creation works (triggered by uptime monitor failure)

---

## R-TASK-141: First-48h Watch Plan + Rollback Triggers

**Status:** NOT STARTED · **Phase:** 12 · **Sessions:** 0.5 · **Resolves:** GAP-103

### Files to Create
- `docs/runbooks/launch-watch.md`

### First-48h plan
**Hour 0:** announce launch on status page; tweet/post; first paying customer expected within 24h
**Hours 0-2:** active watch — Steve at computer; Sentry + Better Stack open; new sign-ups manually checked
**Hours 2-12:** check Sentry hourly; check Better Stack uptime
**Hours 12-24:** check 3x daily
**Hours 24-48:** check 2x daily
**After 48h:** standard on-call mode

### Rollback triggers
Roll back deployment immediately if any:
- /api/health returns 503 for > 5 min
- Sentry error rate > 50/hour (vs baseline ~5)
- Stripe webhook 5xx > 5% sustained
- Customer reports of data loss (paid manual investigation)

### Watch-specific instrumentation
- Slack channel `#launch-watch` (or Discord) — pipe Sentry + Better Stack alerts
- Pinned doc with current rollback procedure (R-TASK-125)
- Pinned status page link

### Tests Required
- AT-141-1: launch-watch.md runbook exists
- AT-141-2: First-48h plan rehearsed with operator before launch
- AT-141-3: Pre-launch checklist completed: all R-TASK Phase 11 + Phase 12 items done

---

*End of R-TASK-134 through R-TASK-141 cluster*
