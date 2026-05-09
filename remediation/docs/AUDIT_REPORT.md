<!-- APPLY: CREATE -->
# AUDIT REPORT — My Best Selling Novel

**Audit date:** 2026-05-03
**Audit scope target:** AGAINST_TARGET (target = `product`)
**Auditor:** Steve Macurdy
**Schema version:** 1.1
**META_GENERATOR version:** 2.0

---

## Audit setup summary

**Artifacts provided:**
- Spec docs: `mybestsellingnovel_build_package.zip` containing CLAUDE.md (98 lines), BUILD_STRATEGY.md (222 lines), ENGINEERING_DECISIONS.md (146 lines, 33 approved decisions), PROGRESS.md, SESSION_PROMPT_TEMPLATE.md, README.md, .env.local.example, 68 atomic TASK files (TASK-001 through TASK-068), and source artifacts: `bestseller_book_agent.jsx` (1,917 lines), `bestseller_demo.jsx` (330 lines), `bestseller_agent_tutorial.md` (296 lines).
- Standing orders: CLAUDE.md inside the build package serves as the project standing-orders document.
- Visual references: book-cover image *The God in You* (the operator's 2015 publication, supplied as the brand mood reference): dark cosmic background, warm metallic gold accent, white serif/script type, aspirational/transformational tone.
- Codebase extractor output: not applicable — pre-build spec, no codebase yet. Layer 2 substituted by direct reading of the source/ JSX during gap detection.
- Deliberate exclusions: none.

**Schema population result:**
- Confirmed observations: ~73
- Inferable but undocumented: ~15
- MISSING-FROM-EXISTING: ~157 fields → collapsed to 106 distinct gaps
- N/A with reason: 4 (codebase_context pre-build, multi-tenant fields when seats abandoned, i18n v1, background-job isolation)

**Gap and observation counts:**

| Severity / Confidence | Count |
|---|---|
| CRITICAL gaps                | 9   |
| STRONG-MISMATCH observations | 2   |
| HIGH gaps                    | 36  |
| LIKELY-MISMATCH observations | 3   |
| MEDIUM gaps                  | 42  |
| MARGINAL observations        | 1   |
| LOW gaps                     | 19  |
| **Total gaps**               | **106** |
| **Total observations**       | **6** |

> **Reconciled 2026-05-06.** The original summary table reported HIGH=35, LOW=18, total=104. The body of this report contains 106 canonical gap entries (verified by GAP-ID enumeration: GAP-001 through GAP-106 with no skipped numbers; severity breakdown by section header counts to 9/36/42/19). The original count of 104 was a transcription error in the summary table; the body has always contained 106. Updated to match.

---

## How to read this report

- Items are ordered by severity: CRITICAL → STRONG-MISMATCH → HIGH → LIKELY-MISMATCH → MEDIUM → MARGINAL → LOW.
- Each item is flagged at the start as either `[GAP]` or `[OBSERVATION]`.
- **Gaps** include consequence statements (*Causes to happen* / *Causes to not happen*) and ARE candidates for remediation.
- **Observations** include "*What gets harder if you keep this*" reasoning and are NOT remediation candidates — they require separate decision conversations outside this audit.
- At the end of the report, you will be asked to choose what to remediate: `FIX_ALL`, `FIX_SELECTED: [list]`, or `FIX_NONE`.

---

## CRITICAL — Gaps requiring immediate attention

### `[GAP-011]` `[CRITICAL]` `[INCONSISTENT]` — Team seats marketed but not designed

**Field:** tenancy + auth.flows.invitation
**Observed:** Decision #7 markets Publisher tier as "unlimited books, 2,000 AI calls/mo, folder upload, **2 team seats**." No team table, no membership table, no invitation flow, no seat-aware RLS, no seat-switching mechanism exists anywhere in the spec packet. RLS policies in TASK-013/014 all use `auth.uid() = user_id` (single-user ownership).
**Required (target scope = product):** if a feature is in the pricing card, it has to ship.

*Causes to happen:* a Publisher customer who pays $79/mo, $853.20/year, or $3,456.78 lifetime expecting 2 seats will pay, log in, find no way to invite a teammate, and request a refund. They will also leave a public review describing the discrepancy. At your projected scale of 1,000 paying users, even a 5% Publisher conversion rate gives you 50 customers paying for a non-existent feature.

*Causes to not happen:* there is no path for a co-author or assistant to access a shared book. The "team" use case (which the tier markets) cannot be served, blocking the buyer persona "Elena, indie romance author publishing 4 books/year" who would plausibly want a co-writer or VA seat.

---

### `[GAP-015]` `[CRITICAL]` `[MISSING]` — No account-deletion flow

**Field:** auth.flows.offboarding
**Observed:** no account-deletion flow distinct from sign-out exists in any TASK file. The closest is TASK-017's book-deletion CASCADE, which removes a single book — not the account.
**Required (target scope = product):** documented self-service account deletion that propagates to DB, Storage, Stripe customer, Resend audience, and GA. CCPA/GDPR enforcement.

*Causes to happen:* the first EU resident or California resident who exercises right-to-deletion (which they can do at any time, by any wording, including a single-line email) will get no automated path. You will manually run SQL DELETE statements against production while they wait, and the wait itself is a violation if it exceeds the regulatory window (30 days CCPA, 1 month GDPR).

*Causes to not happen:* customers who decide to leave will silently churn rather than delete, leaving live PII in your DB indefinitely. Your data-protection footprint grows monotonically. When you eventually have a breach, the impact is larger than necessary because dormant accounts were never purged.

---

### `[GAP-017]` `[CRITICAL]` `[MISSING]` — No MFA on admin role

**Field:** auth.mfa_policy (admin)
**Observed:** no MFA at any tier. The admin role has read access to every user's `books.book_data` JSONB and `chapters.content` rows. The admin signs in with email + password (Supabase default, no breach-list check per GAP-016).
**Required (target scope = product):** MFA required for the admin role at minimum; offered (not required) for paying users.

*Causes to happen:* when an admin password leaks via reuse on another breached site (the most common compromise vector — 60%+ of admin breaches per Verizon DBIR), the attacker downloads every customer's full manuscript. Manuscripts are commercially valuable IP — unpublished novels of the personas Sarah, Marcus, Elena. The breach announcement says "we exposed every manuscript in the system." That story ends the company.

*Causes to not happen:* there is no second factor that survives a password compromise. There is no audit-log signal of the compromise (per GAP-010, no audit log exists), so the breach goes undetected for as long as the attacker chooses.

---

### `[GAP-021]` `[CRITICAL]` `[MISSING]` — No rate limiting on /api/ai

**Field:** api.rate_limits (especially /api/ai)
**Observed:** zero rate limiting across all 11 routes. /api/ai is the most expensive endpoint — each call to Claude Sonnet 4 with max_tokens=16,384 costs roughly $0.05–0.10 at current Anthropic pricing. The only gate is `ai_calls_this_month < TIER_LIMITS[tier].ai_calls_per_month` which checks count, not rate.
**Required (target scope = product):** per-route rate limits, especially burst limits on cost-incurring endpoints. Anthropic API has its own rate limits; without your own gate, a malicious user can spam Claude 5×/sec until your Anthropic key gets rate-limited globally for all users.

*Causes to happen:* a single Publisher-tier user (or compromised account) can issue 2,000 calls in 10 minutes by scripting. Your Anthropic bill spikes by $100–$200 in that window with nothing flagged. Repeat across 5 compromised accounts, you've burned ~$1,000 with no alarm, and your Anthropic key gets temporarily suspended, taking down /api/ai for every paying customer.

*Causes to not happen:* there is no "too many requests" signal at the gateway — you cannot distinguish abuse from organic burst usage. There is no 429 to return to misbehaving clients. You will discover the abuse retroactively via the Anthropic billing dashboard.

---

### `[GAP-029]` `[CRITICAL]` `[MISSING]` — No data-deletion path across systems

**Field:** data_protection.deletion_path
**Observed:** clusters with GAP-015 but distinct — even if account deletion exists at the auth-flow level, there is no documented procedure for fulfilling a deletion request across: Postgres rows + Supabase Storage objects + Stripe customer record + Resend audience entry + GA event history + Vercel function logs (which may contain manuscript snippets per GAP-032).
**Required (target scope = product):** documented per-system deletion procedure, with completion timeline measurable against the 30-day CCPA / 1-month GDPR regulatory windows.

*Causes to happen:* a deletion request from a CA or EU resident triggers manual scrambling. You run DB deletes; manuscript files in `book-audio` Storage bucket persist; Stripe customer record persists; Resend audience entry persists; GA events with the user's pseudo-ID persist; Vercel logs with the user's request bodies persist for 30+ days. The user's "right to deletion" is not actually fulfilled. Regulatory complaint is enforceable.

*Causes to not happen:* you will not be able to issue a deletion certificate ("we have deleted all data associated with your account") without lying. EU/UK users who care about this will choose competitors who can issue one.

---

### `[GAP-041]` `[CRITICAL]` `[MISSING]` — No DPAs with vendors

**Field:** third_party.dependencies[].dpa_status
**Observed:** no Data Processing Agreements signed/tracked with any vendor. The 8 vendors processing user data on your behalf — Supabase (DB + Auth + Storage), Anthropic (manuscript content via prompts), Stripe (payment data + email), Resend (email), Vercel (function logs containing PII), Google Analytics (pseudo-IDs + UA), mammoth (server-side DOCX content), Google Fonts CDN (referrer leak only) — all process EU resident data the moment one EU resident signs up.
**Required (target scope = product, GDPR Art. 28):** signed DPAs with every processor before any EU/UK data is processed.

*Causes to happen:* the moment one EU resident signs up (which can be day one — you have no geo-block), you are processing their PII through 7+ subprocessors with no Art. 28 contract in place. That is a per-incident GDPR violation. Maximum fine is 4% of global revenue or €20M, whichever is higher. Realistic enforcement at your scale is a complaint from a single user causing a regulatory inquiry that costs €15–50K to navigate.

*Causes to not happen:* you cannot list subprocessors in your Privacy Policy with confidence (GAP-045). You cannot answer a basic enterprise customer's "do you have DPAs in place?" with yes — closing your B2B-adjacent path through "Elena, indie romance author" who runs as an LLC.

---

### `[GAP-053]` `[CRITICAL]` `[MISSING]` — No error tracking

**Field:** observability.error_tracking_tool
**Observed:** no Sentry / Honeybadger / Bugsnag / Rollbar configured. TASK-059 ("Error Boundaries") creates React error boundary components — these catch the crash and show a UI message, but the error is logged only to `console.error`, which exists nowhere a developer can see in production. Vercel function logs exist but are unaggregated, unsearchable beyond 1–30 days, and have no alerting.
**Required (target scope = product):** error tracking with stack traces, user/release context, and alerting on error-rate spikes.

*Causes to happen:* the moment a `null` reference, a Stripe webhook signature verification edge case, or a Claude API JSON parse error hits production, the user sees a broken UI, and you learn about it only when they email support (per GAP-095, no support inbox exists, so they don't email — they leave). Errors compound silently. Your "AI call success rate ≥ 98%" target in CLAUDE.md has no measurement infrastructure to verify it.

*Causes to not happen:* your post-launch days will not include the standard SaaS feedback loop of "Sentry alerted me to an error → fixed → deployed → verified". You will be operating on customer reports only. Mean time to detection for any production bug = hours-to-days, when it should be minutes.

---

### `[GAP-086]` `[CRITICAL]` `[INCONSISTENT]` — Vercel function timeout vs Claude response time

**Field:** performance / Vercel function configuration on /api/ai
**Observed:** TASK-021 ("AI proxy route") specifies `getClaude().messages.create` with `max_tokens` capped at 16,384, but does not configure Next.js route segment config. Vercel's default function `maxDuration` for Next.js App Router on Hobby is 10s, on Pro is 15s for default, configurable up to 60s on Pro and 300s on Pro+Fluid. Claude Sonnet 4 streaming a 16,384-token response takes 30–90 seconds.
**Required (target scope = product):** explicit `export const maxDuration = 60` (or higher) on /api/ai, plus streaming response support so users see tokens as they generate.

*Causes to happen:* every chapter-write call (S6) and every long-form AI Draft call (S4) will time out at 10–15s before Claude finishes responding. The user sees a generic timeout error after waiting. The agent shows "AI Draft" and the user clicks; nothing useful comes back. This is your most-used and most-paid-for feature.

*Causes to not happen:* large chapter generations will not complete. Authors paying $79/mo for "long-form AI generation" will get truncated or empty results. The "Time to first AI output ≤ 15 seconds" CLAUDE.md success metric is unachievable for the most consequential calls because the function dies before the first token arrives.

---

### `[GAP-095]` `[CRITICAL]` `[MISSING]` — No support inbox

**Field:** launch_readiness.support_inbox
**Observed:** no support email named in any spec document. The closest is `ADMIN_EMAILS=steve@woulfgroup.com`, which is platform admin (and is a different domain than the product domain mybestsellingnovel.com). No support tool. No documented escalation.
**Required (target scope = product):** a support email at the product domain (e.g., support@mybestsellingnovel.com) routed to a tool or person; published in the footer, in the welcome email, and on /help.

*Causes to happen:* your first paying customer with any problem — billing dispute on the $3,456.78 lifetime tier, account locked, /api/ai returning errors, manuscript appearing corrupted — has no place to email. They will: (a) email steve@woulfgroup.com which is not branded; (b) tweet the complaint publicly; (c) Stripe-chargeback. The chargeback ratio matters — Stripe puts merchants on probation at 0.75% chargeback rate, with subsequent fines.

*Causes to not happen:* you will not be able to put "Contact us at support@mybestsellingnovel.com" in your TOS, in your welcome email, in your footer. The product reads as run by a person who doesn't want to be contacted, which kills trust at the price points (especially $3,456.78 lifetime).

---

## STRONG-MISMATCH — Architectural observations (informational only, not remediated)

### `[OBSERVATION-003]` `[STRONG-MISMATCH]` — Verbatim-port directive scope

**Field:** process / Decisions #11 + #13
**Observed choice:** Decisions #11 and #13 mandate that the 1,917-line agent JSX is ported "verbatim — var/function() syntax preserved, not modernized" and that "all AI prompt strings preserved word-for-word including anti-fact-scrambling rules." The agent currently uses `var` (not let/const), `function(){}` (not arrow), no `useCallback`, raw fetch to Anthropic API (replaced with /api/ai), inline event handlers, no TypeScript inside the function bodies.
**Better fit for SaaS-at-scale:** the verbatim-port discipline is appropriate for the AI prompt strings — they are fragile and changing them changes model behavior. The same discipline applied to the JSX itself is harder to defend: var/let conversion is mechanical and lossless; useCallback omission is a stated rule but also a debug pattern that hides re-render bugs; the 1,917-line single-file structure works against the schema's required wiring tables, function-symbol map, and accessibility plan.

**Reasoning:** this decision was right when the agent was a sandbox prototype that worked and you wanted to preserve it. As an entry to a SaaS-at-scale codebase, it imports a prototype's coding conventions into a production codebase and then forbids the convergence. The result will be a codebase with two coding standards — modern in lib/, app/api/, app/(routes)/ and frozen-in-time in components/agent/. Future contributors (or future Claude Code sessions) will be confused which rules apply where; CI lint configurations will need exclusions for components/agent/; type safety will degrade at the boundary. The AI prompt verbatim rule is correct and should stay. The JSX verbatim rule is the part this observation flags.

*What gets harder if you keep this:* every accessibility fix to the agent (GAP-069 specifically) will fight the verbatim rule. The contrast lint (GAP-068) cannot enforce on agent components without an exclusion list. The function-symbol map (GAP-005) cannot bind to the agent's inline event handlers without naming them — which the verbatim rule forbids. Each remediation task that touches the agent will require an explicit "is this modernization or is this fixing a defect?" judgment call. That judgment call accumulates as a cost on every TASK in the agent-port phase and beyond.

*What the audit will not do:* rewrite the verbatim directive. The principle of preserving the agent's tested behavior is right; the mechanism (don't modernize syntax) is the part worth re-examining.

*Suggested next step:* split Decision #11 into two decisions. **#11a:** AI prompt strings preserved verbatim — this stays, no exceptions. **#11b:** agent JSX ported with mechanical syntax modernization (var→let/const where the binding is local; function()→arrow where there's no this-binding; useCallback added only where measurably needed) but no behavioral changes to the steps. Add a behavioral test (golden-output test against fixture inputs) so behavior preservation is verifiable rather than syntax-anchored. Document the split in an ADR.

---

### `[OBSERVATION-005]` `[STRONG-MISMATCH]` — Manual-test pattern across all 10 phases

**Field:** testing-as-process across all phases
**Observed choice:** Phase 10 of the build strategy ("Integration Testing", TASK-063 through TASK-068) is structured as manual checklist tests. Every TASK file's "Tests Required" section names manual acceptance criteria (AT-NNN). There are zero automated test files in the spec packet, no Jest/Vitest config, no Playwright/Cypress config, no test data factories, no fixtures, no CI test runs.
**Better fit for SaaS-at-scale:** a working test infrastructure shipped before Phase 5 (agent port) so that the 14 agent components have something to regress against, plus contract tests for Stripe webhook event shapes, plus an RLS isolation test that asserts user A cannot read user B's books.

**Reasoning:** this is the choice the audit is most confident is wrong for product scope. The verbatim-port directive (Decision #11) is the single largest body of code in the build (~1,900 lines from a sandbox), and the only verification that the port preserves behavior is "manually click through it." Future Claude Code sessions will refactor `lib/subscription.ts` (it is referenced from /api/ai, /api/books, /api/stripe/checkout, /api/admin/metrics, the agent — a 5+ file dependency) and the only way to know the refactor was safe is the same manual click-through. At SaaS-at-scale, the refactor cadence is weekly; manual-test cycle time is hours-to-days; the math doesn't work. The manual-only pattern compounds with several other gaps: GAP-061 (no unit test floor), GAP-063 (no E2E framework), GAP-064 (no Stripe contract test), GAP-065 (no automated RLS isolation test), GAP-094 (manual migration paste). Each of these is a HIGH-severity gap individually. As a pattern they are an architectural choice — "we will verify by manual procedure" — that is not viable for SaaS-at-scale.

*What gets harder if you keep this:* the 4-month mark is when the pattern breaks visibly. By then the codebase has accumulated ~5 patches/week × 16 weeks = ~80 changes, each verified against a manual procedure that takes 2–3 hours to run end-to-end. You will run the procedure once a sprint, not once a change. Regressions accumulate between sprints. By the 6-month mark, customers are reporting bugs that the manual procedure didn't catch, and the cost to add automated tests retroactively is now 3× what it would have been at Phase 1.

*What the audit will not do:* rewrite Phase 10 to automate the tests. The schema's "testing" section gaps (GAP-061 through GAP-066) collectively constitute the remediation if you choose to fix; this observation is about whether to fix them or accept the manual pattern.

*Suggested next step:* at minimum, add Vitest for `lib/` (subscription, api-auth) and a Playwright smoke test for the auth flow + a single agent step before launch. Defer broader E2E to v1.1. Document the deferral explicitly in the v-next list (GAP-104) so the trade-off is visible. Revisit at the 100-paying-customer mark.

---

## HIGH — Gaps requiring attention within 6 months

### `[GAP-004]` `[HIGH]` `[MISSING]` — Stark-contrast rule absent

**Field:** brand.contrast.* (rule, allowed_pairings, forbidden_pairings, opacity_rule, ternary_class_rule, minimum_ratio, minimum_ratio_large_text)
**Observed:** the dark-mode + gold UI with #D4A853 gold on #0a0f1a background gives ~9:1 (passes AAA). But once Claude Code generates an admin dashboard card (TASK-052) with `bg-white` and inadvertently uses gold text (a plausible match-the-brand instinct), gold-on-white is ~2.8:1 — fails AA. Without a contrast rule, the lint script GAP-068 calls for, and the allowed_pairings list, every new card and modal is a guessing game.
**Required:** the schema's stark-contrast rule with allowed_pairings, forbidden_pairings, opacity rule, ternary class rule, AAA target (7.0).

*Causes to happen:* gold-on-white headings in cards and modals (likely in /pricing tier cards, /admin stat cards, /account billing cards) shipping at 2.8:1, illegible to users with mild vision issues — which is 4–5% of US adults.

*Causes to not happen:* there will be no automated check that catches the violation at PR time; it ships, a screenshot ends up in a Twitter thread about "AI tools that don't even pass AA", and you fix it under public pressure.

---

### `[GAP-010]` `[HIGH]` `[MISSING]` — No audit event log

**Field:** data_model.audit_event_log_schema
**Observed:** no actor/action/target log for: role grant/revoke (admin), tier change outside webhook, deletion (book/chapter/audio/account), admin reads of user manuscripts (CRITICAL pairing — admin can read but no record of who read what when).

*Causes to happen:* when a customer asks "did anyone read my manuscript before I published it?", you cannot answer. When you suspect an admin's account was compromised, you cannot tell what they accessed. When someone disputes "I never canceled my subscription," you have only Stripe's record, not your own.

*Causes to not happen:* no SOC 2 readiness without an audit log of admin access. The stated target persona "B2B-adjacent Elena's LLC" cannot pass even basic vendor security review.

---

### `[GAP-012]` `[HIGH]` `[MISSING]` — Tenancy offboarding policy

**Field:** tenancy.offboarding_policy
**Observed:** no procedure when account is deleted, subscription expires, fraud chargeback occurs, or lifetime "lifetime of product" terminates.

*Causes to not happen:* when a Publisher customer's annual subscription lapses, no documented data-retention policy. Their books and chapters persist forever in your DB at storage cost. Reactivation flow is undefined.

---

### `[GAP-014]` `[HIGH]` `[MISSING]` — Role-change flow

**Field:** auth.flows.role_change
**Observed:** admin role granted via `ADMIN_EMAILS` env var only — set at deploy time, not during operation. No procedure for granting admin to a new hire or revoking admin from a departed contractor short of a redeploy.

*Causes to happen:* when you hire your first contractor or co-founder, you redeploy with their email in `ADMIN_EMAILS`. When they leave, you redeploy again. Between leave and redeploy, they retain admin access. The window is hours-to-days.

*Causes to not happen:* there is no audit trail of who was admin when (per GAP-010). After a year, you cannot reconstruct who had access.

---

### `[GAP-016]` `[HIGH]` `[WEAK]` — Password policy

**Field:** auth.password_policy
**Observed:** Supabase Auth defaults: 6 characters minimum, no breach-list check, no complexity. For users storing 200K-word copyrighted manuscripts, this is dramatically below standard.

*Causes to happen:* credential-stuffing attacks succeed against any user whose password is in the haveibeenpwned breach list (estimated 30–40% of consumer passwords). The attacker downloads the user's manuscript JSONB. The user discovers the access via a "you signed in from a new device" email if Supabase has it enabled (default no).

*Causes to not happen:* you cannot truthfully claim "industry-standard password protection" in your Privacy Policy.

---

### `[GAP-022]` `[HIGH]` `[MISSING]` — No idempotency on Stripe webhook

**Field:** api.idempotency_strategy
**Observed:** Stripe officially retries failed webhook deliveries up to 3 days. Stripe also occasionally re-delivers events that succeeded due to internal restarts. TASK-024's webhook handler does not deduplicate by `event.id`.

*Causes to happen:* the same `customer.subscription.created` event delivers twice. The `subscriptions` row is upserted twice (acceptable). But for `checkout.session.completed` with mode=payment (the lifetime path, TASK-025), the row is INSERTed twice without a uniqueness constraint on session ID — a customer who paid $3,456.78 once shows two lifetime subscriptions in your DB. Your admin metrics double-count their payment.

*Causes to not happen:* you cannot answer "have I processed this Stripe event?" with confidence in any reconciliation report.

---

### `[GAP-026]` `[HIGH]` `[MISSING]` — Key rotation cadence

**Field:** data_protection.key_rotation_cadence
**Observed:** no rotation schedule for ANTHROPIC_API_KEY, STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET, SUPABASE_SERVICE_ROLE_KEY, RESEND_API_KEY.

*Causes to happen:* when one of these leaks (accidental git commit, Vercel env-var screenshot in Slack, departing contractor never revoked), the response is improvised under pressure. Mean time to rotate first-ever rotation: hours-to-days, during which the leaked key is live.

*Causes to not happen:* SOC 2 readiness is blocked. Quarterly key rotation hygiene is impossible without procedure.

---

### `[GAP-027]` `[HIGH]` `[WEAK]` — Off-Supabase backup

**Field:** data_protection.backup_cadence_retention
**Observed:** Supabase Pro provides 7-day PITR. No off-Supabase backup. No tested extraction. Manuscripts ARE the product — not metadata, not analytics, but the user's primary creative output.

*Causes to happen:* a Supabase region outage of any duration during which their PITR is also unavailable (rare but possible) means you cannot serve any customer's manuscripts. There is no documented "restore to a different Postgres" path.

*Causes to not happen:* customers asking "do you back up my work outside your primary cloud?" cannot be answered yes.

---

### `[GAP-030]` `[HIGH]` `[MISSING]` — User data export

**Field:** data_protection.export_path
**Observed:** users put 200K-word manuscripts in your DB. There is no "Download all my work" button, no per-book export endpoint that produces a manuscript file, no archive-on-departure.

*Causes to happen:* a customer who decides to leave (because of price, a competitor, or dissatisfaction) discovers there is no way to take their manuscript out except chapter-by-chapter copy/paste from the agent UI. The decision to leave hardens into "and I'm warning others to never use it."

*Causes to not happen:* GDPR Article 20 right to data portability is not fulfilled.

---

### `[GAP-031]` `[HIGH]` `[MISSING]` — Data residency unspecified

**Field:** data_protection.residency
**Observed:** Supabase project region not specified anywhere; Vercel region not specified; Anthropic API region not specified; Resend region not specified. EU customer data may transit US infrastructure without DPAs/SCCs.

*Causes to happen:* an EU enterprise customer (B2B-adjacent path through Elena's LLC) asks "where is our data stored?" and the only honest answer is "I'm not sure — wherever Supabase, Vercel, and Anthropic put it by default."

*Causes to not happen:* EU enterprise sales path is closed. EU regulators investigating any incident can find the data trail untraceable.

---

### `[GAP-037]` `[HIGH]` `[WEAK]` — Legal compliance manifest incomplete

**Field:** legal_compliance.manifest
**Observed:** TOS + Privacy Policy planned (TASK-057). Missing for product scope: AUP (banned content for AI), Refund Policy (especially for $3,456.78 lifetime), Cookie Policy (EU), DMCA takedown (users upload manuscripts that may contain copyrighted material), AI/ML disclosure (whether content is used for AI training), Vulnerability Disclosure contact, Accessibility Statement.

*Causes to happen:* a user runs Anthropic's Sonnet 4 to generate banned content (CSAM-adjacent fiction, defamatory passages, mass copyright reproduction). Anthropic's usage policy passes through to you. Without an AUP, you have no contractual basis to terminate the user. Anthropic terminates your API key. Every user loses /api/ai.

*Causes to not happen:* the lifetime tier's $3,456.78 price has no stated refund window. A buyer's-remorse customer has no documented path; they Stripe-chargeback (GAP-095 makes this worse), pushing your chargeback rate up.

---

### `[GAP-039]` `[HIGH]` `[MISSING]` — TOS/Privacy acceptance recording

**Field:** legal_compliance.acceptance_recording
**Observed:** TASK-057 generates TOS + Privacy pages but no DB schema for recording user acceptance with version + timestamp + IP + UA.

*Causes to happen:* when you change the TOS (e.g., adding the AUP from GAP-037), you have no way to require existing users to re-accept the new terms. Legally enforceable changes require either (a) explicit user re-acceptance or (b) prominent notice with a long opt-out window. You can do neither without a versioning + acceptance table.

*Causes to not happen:* you cannot prove in a dispute that user X agreed to TOS version Y at time Z.

---

### `[GAP-045]` `[HIGH]` `[MISSING]` — Subprocessor disclosure cadence

**Field:** third_party.subprocessor_disclosure_cadence
**Observed:** required when Privacy Policy lists subprocessors (which it must, per GDPR Art. 28). Your subprocessor list will be: Supabase, Anthropic, Stripe, Resend, Vercel, Google Analytics, mammoth (vendor lib, no DPA needed but a processor), Google Fonts. When Anthropic adds a sub-processor (which they do periodically), you must propagate that change.

*Causes to not happen:* customers who tracked subprocessor changes via your Privacy Policy will catch you out-of-date and lose trust.

---

### `[GAP-047]` `[HIGH]` `[MISSING]` — No staging environment

**Field:** environments.matrix
**Observed:** every change is tested against production Supabase, production Stripe, production Anthropic. The only "staging" is `localhost:3000` with `stripe listen --forward-to`.

*Causes to happen:* the first Stripe webhook regression (e.g., a refactor that moves event.type matching) hits real customers' real billing. A failed checkout.session.completed handler means a customer paid for lifetime and stayed on Explorer. They see Stripe charged them; they see your tier still says Explorer; they email or chargeback.

*Causes to not happen:* there is no place to test a destructive migration before running it on production data. Test data is whatever you create in the same Supabase project customers use.

---

### `[GAP-048]` `[HIGH]` `[MISSING]` — DR/failover plan

**Field:** environments.dr_environment_required
**Observed:** 99.5% uptime target = 3.6 hours of downtime allowance per month. Single-region Supabase, single-region Vercel, single Anthropic API. Any one of these going down for 4+ hours blows the target.

*Causes to happen:* Supabase has had multi-hour incidents historically; Vercel has had similar. You will hit 99.5% only by luck, not design. The target's measurement (per GAP-059, no uptime monitoring) is also absent — you will not even know when you missed it.

*Causes to not happen:* the SLA implication of 99.5% can never be promised to enterprise customers (Elena's LLC) with confidence.

---

### `[GAP-050]` `[HIGH]` `[MISSING]` — CI/CD pipeline

**Field:** cicd
**Observed:** no .github/workflows/, no merge gates. CLAUDE.md's commit/push rules ("npm run build must pass before push") are operator discipline only. One missed `tsc --noEmit`, one rushed push, breaks production for everyone.

*Causes to happen:* the first time Claude Code or you commits a type error and pushes (which happens to everyone), Vercel auto-deploys it; the build fails on Vercel; the previous deploy is still live, but the next push that fixes the type error has to follow. If anything else needs to ship in that window, it cannot.

*Causes to not happen:* no automated lint, no test run, no security scan blocks a bad PR. Git history accumulates breakages.

---

### `[GAP-051]` `[HIGH]` `[MISSING]` — Security scans

**Field:** cicd.security_scans
**Observed:** no GitHub secret scanning, no Gitleaks, no dependency CVE scanner.

*Causes to happen:* if you ever commit `.env.local` by accident (despite .gitignore — it happens via wildcard rules misfiring or via copying a config dump into a markdown file), ANTHROPIC_API_KEY or STRIPE_SECRET_KEY ends up in a public Git history. Without secret scanning, the key persists until you see a billing surprise.

*Causes to not happen:* known dependency CVEs in Next.js / @supabase/ssr / stripe / @anthropic-ai/sdk are not flagged at PR time.

---

### `[GAP-054]` `[HIGH]` `[MISSING]` — Centralized logging

**Field:** observability.logging
**Observed:** Vercel default function logs only. No centralized aggregation. No structured-logging convention (no requestId, userId in logs).

*Causes to happen:* when /api/ai returns 500 for a specific user, debugging requires SSHing-equivalent into Vercel logs and grep-ing — a workflow that was viable for solo developers in 2015 but that you will quickly outgrow at 1,000 paying customers. Every incident is an archaeology dig.

*Causes to not happen:* you cannot correlate a Stripe event with a Vercel log line with an ai_usage_logs row across the same request.

---

### `[GAP-055]` `[HIGH]` `[MISSING]` — System metrics

**Field:** observability.metrics_tool
**Observed:** GA4 covers user analytics. No system metrics on /api/ai p95 latency, error rate, queue depth.

*Causes to not happen:* the "AI call success rate ≥ 98%" target in CLAUDE.md has no measurement. You will discover it's at 92% only when ai_usage_logs is queried manually months in.

---

### `[GAP-057]` `[HIGH]` `[MISSING]` — Alert thresholds

**Field:** observability.alert_thresholds
**Observed:** no alerting on Stripe webhook failures (silent revenue leak), /api/ai 5xx spikes (silent feature outage), auth failure burst (credential stuffing in progress), function timeout rate (the GAP-086 issue).

*Causes to happen:* the GAP-086 Vercel timeout bug, when it ships, has no alert. You discover via customer complaints that "AI Draft doesn't work" — days into the regression.

*Causes to not happen:* incident detection time is "until a customer complains".

---

### `[GAP-059]` `[HIGH]` `[MISSING]` — Uptime monitoring

**Field:** observability.uptime_monitoring
**Observed:** "Vercel status page" in CLAUDE.md is Vercel's status, not yours. No external synthetic monitor. No /api/health endpoint (GAP-060) for one to hit.

*Causes to not happen:* the 99.5% uptime claim has no measurement infrastructure. You will not know your actual uptime within 1 percentage point of accuracy.

---

### `[GAP-061]` `[HIGH]` `[MISSING]` — Unit-test coverage floor

**Field:** testing.unit_test_coverage_floor
**Observed:** zero unit tests in spec packet. No Jest/Vitest configured. No coverage threshold.

*Causes to happen:* every refactor risks regression. The verbatim-port directive (Decision #11) means you can't refactor the agent — but you'll inevitably refactor `lib/subscription.ts`, `lib/api-auth.ts`, the Stripe webhook handler. Each refactor is a roll of the dice.

*Causes to not happen:* CI cannot block a regression because there is nothing to fail.

---

### `[GAP-063]` `[HIGH]` `[MISSING]` — E2E framework

**Field:** testing.e2e_framework
**Observed:** Phase 10 lists E2E flows as manual checklists (TASK-063 through TASK-066). No Playwright/Cypress.

*Causes to happen:* the billing flow regresses at TASK-024 (webhook handler change). Your manual E2E from TASK-065 was run in March but the regression ships in May. You discover via the GAP-095 absent support inbox = customer chargeback.

*Causes to not happen:* there is no automated full-flow verification before deploy.

---

### `[GAP-064]` `[HIGH]` `[MISSING]` — Stripe contract test

**Field:** testing.contract_tests
**Observed:** no contract test asserting that Stripe's event payload shape (specifically `customer.subscription.created`, `customer.subscription.updated`, `customer.subscription.deleted`, `checkout.session.completed`) maps correctly to your DB writes.

*Causes to happen:* Stripe API version change (which they do periodically) introduces a field rename or shape change. Your webhook silently fails on the new event shape. Customers pay; tier doesn't update; you discover via chargeback.

*Causes to not happen:* you cannot regression-test the webhook against historical Stripe event fixtures before deploying webhook changes.

---

### `[GAP-065]` `[HIGH]` `[MISSING]` — RLS isolation test

**Field:** testing.security_tests
**Observed:** no automated test that user A cannot read user B's `books`, `chapters`, `audio_chunks` rows even after refactoring.

*Causes to happen:* a refactor that moves a query from `select('*')` to `select(*).eq('user_id', user.id)` and then later "simplifies" by removing the eq() (because RLS is supposed to handle it) — works in dev where there's only one user, fails in prod where suddenly user A sees user B's manuscript.

*Causes to not happen:* the cross-user-leak class of bug — the worst possible bug class for a SaaS storing copyrighted IP — has no automated guard.

---

### `[GAP-067]` `[HIGH]` `[MISSING]` — WCAG conformance level

**Field:** accessibility.target_conformance_level
**Observed:** no WCAG target (default for product would be WCAG 2.2 AA). The schema's contrast extension (1.1) requires this.

*Causes to happen:* an ADA complaint from a US user with vision disability is enforceable. EU customers fall under the European Accessibility Act starting 2025 — most consumer-facing services must comply. Without a stated target, you cannot defend against an enforceability claim.

---

### `[GAP-068]` `[HIGH]` `[MISSING]` — Contrast lint

**Field:** accessibility.contrast_lint_required + implementation
**Observed:** schema 1.1 explicitly requires a CI lint that reads the canonical store's allowed_pairings/forbidden_pairings as source of truth. Neither exists.

*Causes to not happen:* every PR that adds a UI component is a contrast roulette. The first regression ships and ships again because nothing checks.

---

### `[GAP-069]` `[HIGH]` `[MISSING]` — Keyboard navigation + screen reader support

**Field:** accessibility.keyboard_navigation + screen_reader_support
**Observed:** S2 (Upload & Organize) has drag-and-drop. S5 (Chapter Guide) has interactive Avoid system. S6 (Write & Record) has audio recorder. All described as JSX with mouse-anchored interactions.

*Causes to not happen:* a keyboard-only or screen-reader user cannot complete the agent's primary flow. They cannot use the product. Your TAM excludes the disability community.

---

### `[GAP-078]` `[HIGH]` `[MISSING]` — EU cookie consent

**Field:** analytics.cookie_consent_for_eu
**Observed:** GA4 sets cookies. Stripe Checkout sets cookies. Supabase Auth sets cookies. EU + UK + Switzerland require consent before non-essential cookies fire.

*Causes to happen:* the first EU visit triggers GA4 cookies before consent. ICO (UK) and EU DPAs have enforced this with 6-figure fines on consumer SaaS.

*Causes to not happen:* you cannot legally serve EU/UK at all without the consent banner.

---

### `[GAP-079]` `[HIGH]` `[MISSING]` — Email templates (8 missing for product scope)

**Field:** notifications.email_templates
**Observed:** Welcome + Upgrade exist (TASK-054, TASK-055). Missing: email verification, branded password reset, renewal reminder, dunning, cancellation confirmation, lifetime confirmation (distinct from upgrade), receipt/invoice from your domain, downgrade notification.

*Causes to happen:* without email verification, signup spam (bot signups, throwaway emails) inflates user counts and uses your free Explorer AI calls (25/month × N bots). Without dunning, when a card fails, the customer's tier silently drops to Explorer; they think you broke things.

*Causes to not happen:* renewal reminders for annual ($313.20 / $853.20) reduce involuntary churn — without them, you'll see annual customers surprise-renew and chargeback.

---

### `[GAP-081]` `[HIGH]` `[MISSING]` — Email deliverability (SPF/DKIM/DMARC)

**Field:** notifications.deliverability_setup
**Observed:** SPF, DKIM, DMARC records on mybestsellingnovel.com not specified. Resend requires DKIM by default; SPF and DMARC need explicit DNS records.

*Causes to happen:* welcome emails land in spam folders for ~30%+ of recipients without DMARC pass. New users assume the product never sent them anything; they bounce.

*Causes to not happen:* the welcome email's role as activation driver is broken at the channel level.

---

### `[GAP-091]` `[HIGH]` `[MISSING]` — Failure mode specs (zero exist)

**Field:** failure_specs.features
**Observed:** no per-feature failure mode table for any feature. Concrete unhandled scenarios already named: Stripe webhook partial-write, audio chunk orphan, AI 529 overload, S2 DOCX over Vercel 4.5MB body limit, Supabase Auth down.

*Causes to happen:* each unhandled failure is a confused user with no feedback. A 200K-word DOCX upload exceeds Vercel's body limit; the user sees a generic "Network error" and assumes their manuscript is lost.

*Causes to not happen:* support (when it exists per GAP-095) cannot triage common failures without a runbook.

---

### `[GAP-094]` `[HIGH]` `[MISSING]` — Migration testing

**Field:** database_migrations.testing_required
**Observed:** manual paste into Supabase production console with no CI fresh + CI seeded + staging-actual cycle.

*Causes to happen:* the first migration that has a typo (DROP COLUMN intended for a dev test that ships to prod by paste-error, or an `ALTER TABLE` without a transaction wrapper) is destructive on real customer data with no undo.

*Causes to not happen:* migration safety reviews (GAP-093) cannot catch syntax errors that only manifest on populated data.

---

### `[GAP-096]` `[HIGH]` `[MISSING]` — On-call rotation

**Field:** launch_readiness.oncall_rotation
**Observed:** even a one-person rotation is unnamed. No on-call tool. No escalation procedure. CLAUDE.md mentions Steve but doesn't establish an on-call commitment.

*Causes to happen:* the first Saturday-night Stripe webhook regression (when most online consumer purchases happen) goes unnoticed because there is no alarm path that wakes anyone.

*Causes to not happen:* response SLA (GAP-097) cannot be promised to customers.

---

### `[GAP-099]` `[HIGH]` `[MISSING]` — Public status page

**Field:** launch_readiness.status_page_url
**Observed:** no public status page (statuspage.io / Better Stack / instatus.com / similar).

*Causes to happen:* when /api/ai is degraded due to Anthropic outage, every customer separately emails you (per GAP-095, support address absent makes this worse) asking what's wrong. You explain the same thing 50 times.

*Causes to not happen:* a public statement of "we know, we're working on it" cannot be made to all customers at once.

---

### `[GAP-103]` `[HIGH]` `[MISSING]` — Post-launch monitoring window

**Field:** definition_of_done.post_launch_monitoring_window
**Observed:** no documented "what's watched in the first 48 hours, what triggers rollback".

*Causes to not happen:* the first regression shipped at launch will not have a clear escalation/rollback path. You will improvise it under pressure.

---

## LIKELY-MISMATCH — Architectural observations (informational only, not remediated)

### `[OBSERVATION-001]` `[LIKELY-MISMATCH]` — Supabase as auth + DB + Storage triple-bind

**Observed choice:** a single vendor (Supabase) provides authentication, primary database, and file storage for the entire product. All three are coupled at the SDK layer (`@supabase/ssr`, `@supabase/supabase-js`) and at the data layer (RLS policies use `auth.uid()` which is a Supabase-specific construct).
**Better fit:** the primary database in Supabase is fine — Postgres + RLS + PITR is appropriate. The triple-bind concerns auth and storage. Auth could be Clerk, WorkOS, or Auth0 (all of which export Supabase-compatible JWTs you can pass to RLS); separating auth from DB de-risks the highest-blast-radius vendor relationship. Storage could be Cloudflare R2 or AWS S3 (cheaper at the 100GB tier and beyond, plus better CDN economics for audio playback).

**Reasoning:** at projected scale the Supabase triple-bind compounds three risks at once. (a) When Supabase has a multi-hour outage — which has happened historically — your auth, your DB, and your audio Storage all go down simultaneously, with no degradation possible. (b) Supabase's pricing curve gets steep above Pro: the next tier (Team) is $599/mo for marginal benefit, and audio storage at scale will exceed 100GB. (c) Vendor exit cost grows monotonically with customer count — at 10,000 customers, migrating off Supabase is months of work.

*What gets harder if you keep this:* at the 1,000-paying-customer mark you'll feel auth-specific limits — Supabase Auth has rate limits on signin/signup that you cannot tune; you cannot add advanced auth features (social SSO, SAML, granular MFA) without significant adapter work. At the 10,000-user mark, Storage costs and migration risk both compound. At any scale, a Supabase incident takes the entire product down with no degraded mode possible.

*What the audit will not do:* propose remediation tasks to change the stack.

*Suggested next step:* ship v1 on Supabase as designed, but document the exit plan now (per GAP-044 remediation if you choose to fix it). Set a tripwire — when you cross 5,000 paying users, schedule a separate decision conversation about extracting auth to a dedicated provider. Document the trade-off in an ADR so future contributors understand the lock-in is intentional.

---

### `[OBSERVATION-002]` `[LIKELY-MISMATCH]` — Chapter-row grain at scale

**Field:** data_model — `chapters` as a separate table (Decision #22) with no chunking strategy beyond chapters
**Observed choice:** Decision #22 split book content from a JSONB column into a `chapters` table — one row per chapter, content TEXT, with `UNIQUE(book_id, chapter_index)`. This is a strict improvement over the original JSONB-everything approach. But the table's grain is "chapter," and the spec also targets 200K-word manuscripts with 16,384-token AI calls per chapter (Decision #25) — meaning some chapters can themselves be 12K+ words, ~80KB of text per row.
**Better fit at scale:** chapter-as-row is fine for v1. At scale, the right grain becomes either (a) chapter-with-content-versioning (storing diffs, not full content, in an audit-style versioning table, with the "current" row only updated on chapter-end), or (b) paragraph-level chunking inside each chapter (used by competitors like Sudowrite for collaborative editing and AI inline operations).

**Reasoning:** the chapter-row grain works as long as one user is editing one chapter at a time and saves are infrequent. Both assumptions weaken at scale: Publisher-tier 2-seat collaboration (GAP-011) introduces concurrent edits to the same chapter; smart-diff auto-save during active writing produces high write rates against a row whose other cells (title, word_count, updated_at) get touched on every save. Without versioning, the "I lost 30 minutes of work" support tickets cannot be resolved beyond Supabase PITR.

*What gets harder if you keep this:* collaborative editing (the GAP-011 feature) needs versioning underneath; bolting it on later requires a migration of every existing chapter row into a versioning table, with rewrite of the smart-diff save logic. Around the 1,000-paying-user mark, you'll see the first "I lost work" tickets that the chapter-row model cannot resolve except through PITR.

*What the audit will not do:* change the data model. Decision #22 is reasonable for v1; the alternative is over-engineering for scale you don't yet have.

*Suggested next step:* add a `chapters_versions` table to the deferred-to-v-next list (GAP-104) so it's an explicit choice. When you close on the team-seats decision (GAP-011), revisit this together. Document the trade-off in an ADR.

---

### `[OBSERVATION-004]` `[LIKELY-MISMATCH]` — Lifetime tier as legal/financial liability shape

**Field:** auth.mechanism + the lifetime tier
**Observed choice:** Decision #29 added a Lifetime tier ("Author Lifetime $567.89, Publisher Lifetime $3,456.78") with terms "access lasts for the lifetime of the product; if the product shuts down, lifetime access ends." The auth mechanism is email/password with no MFA (GAP-017) and Supabase defaults (GAP-016).
**Better fit for the lifetime price point:** a $3,456.78 SKU implies a customer relationship more like a B2B contract than a B2C subscription. Customers paying that price will reasonably expect (a) written guarantees about minimum service duration, (b) data export commitments, (c) refund window for buyer's remorse (typical SaaS 14-day or 30-day), (d) account hardening that befits the price (MFA at minimum), and (e) enforceable contract terms (acceptance recording per GAP-039).

**Reasoning:** at $29/mo the customer is annoyed for one billing cycle if anything goes wrong; at $3,456.78 they have a financial incentive to dispute, chargeback, demand refund, or pursue a small-claims action. The lifetime tier raises the legal exposure ceiling on every other gap in the audit — without an account deletion flow (GAP-015), without DPAs (GAP-041), without acceptance recording (GAP-039), without a refund policy (GAP-037 expansion), each of those gaps becomes more enforceable when the disputed transaction is $3,456.78 rather than $29.

*What gets harder if you keep this:* the first lifetime customer dispute lands inside a control surface that cannot defend itself. A buyer's-remorse customer files a chargeback at the credit-card level (Stripe takes 1.5%-2% chargeback fee plus $15 dispute fee per case); without acceptance recording you cannot prove what they agreed to; without a refund policy you cannot point to a documented remedy; without MFA on their account, "I didn't make this purchase" is harder to refute. Stripe's chargeback ratio threshold is 0.75% — at lifetime price points, a small number of disputes can push you over.

*What the audit will not do:* remove the lifetime tier or change the price. It's a business decision about customer mix and revenue smoothing.

*Suggested next step:* keep the lifetime tier but make it explicit in the deferred-to-v-next list which surrounding controls (refund policy, acceptance recording, lifetime confirmation email distinct from upgrade, MFA-required-for-lifetime-tier) must ship together with the tier going live in Stripe. Treat the lifetime tier as a product-level dependency on those gaps, not as an independent feature.

---

## MEDIUM — Technical-debt and velocity gaps

### `[GAP-001]` `[MEDIUM]` `[MISSING]` — `project.scale_at_24mo` unspecified
*Causes to not happen:* you cannot size capacity decisions (DB pool, function memory, Anthropic budget). Many other gaps' severity scoring depends on this anchor; without it, the audit must use plausible defaults that may be wrong for your actual plan.

### `[GAP-005]` `[MEDIUM]` `[MISSING]` — `ui.function_symbol_map` absent
*Causes to not happen:* Claude Code generating UI components per task will pick handler names ad hoc; later sessions re-use names inconsistently. The wizard from GAP-008 (if built) cannot reference a stable symbol set.

### `[GAP-006]` `[MEDIUM]` `[MISSING]` — Per-screen state tables absent
*Causes to not happen:* loading/empty/error states get implemented inconsistently per page; some pages will show spinners, some skeletons, some flash content. UX consistency drifts.

### `[GAP-007]` `[MEDIUM]` `[MISSING]` — Per-screen wiring tables absent
*Causes to not happen:* without a per-screen control→symbol→handler→service map, Claude Code session N decides to call `fetch('/api/books')` while session M decides to call a wrapper; over time the codebase has both.

### `[GAP-008]` `[MEDIUM]` `[MISSING]` — UI wizard / persistent helper
*Causes to not happen:* first-time users land on /app, see a 12-step agent, and have no platform-level orientation. The agent itself is a guided flow but doesn't onboard the user to the platform's features (account, billing, library, help).

### `[GAP-009]` `[MEDIUM]` `[WEAK]` — Hard-cascade-only delete policy
*Causes to happen:* the first customer who clicks Delete on a book they meant to keep loses 200K words. Supabase PITR can recover within 7 days but the procedure is hands-on and slow.
*Causes to not happen:* "undo delete" UX cannot exist.

### `[GAP-019]` `[MEDIUM]` `[MISSING]` — Auth Matrix per route
*Causes to not happen:* per-route auth/authz/rate-limit/audit-log is decided ad hoc per TASK file rather than from a canonical matrix.

### `[GAP-020]` `[MEDIUM]` `[MISSING]` — API versioning strategy
*Causes to happen:* one-way door.
*Causes to not happen:* when v2 needs a different /api/books shape, every existing client breaks.

### `[GAP-028]` `[MEDIUM]` `[MISSING]` — RTO / RPO unstated
*Causes to not happen:* recovery objectives unstated; you cannot promise SLA-bearing customers numbers.

### `[GAP-032]` `[MEDIUM]` `[MISSING]` — Log scrubbing rules
*Causes to happen:* if you ever log /api/ai request bodies (a common debugging move), manuscript content lands in Vercel logs that have 30-day retention and broader internal access than the DB itself.

### `[GAP-033]` `[MEDIUM]` `[MISSING]` — Prod access audit
*Causes to not happen:* SOC 2 readiness blocked.

### `[GAP-034]` `[MEDIUM]` `[MISSING]` — Canonical store
*Causes to not happen:* your next price change requires editing 4+ files in lockstep (decision log, env, pricing page, welcome email, SESSION_PROMPT_TEMPLATE, marketing site). One miss = a customer charged $29.00 sees a pricing page saying $39.00.

### `[GAP-038]` `[MEDIUM]` `[MISSING]` — Cookie inventory
*Causes to not happen:* required when Cookie Policy ships (GAP-037 expansion).

### `[GAP-042]` `[MEDIUM]` `[MISSING]` — Vendor SLA / breaks_on_down / degraded_mode / fallback_vendor
*Causes to not happen:* per-vendor outage planning. When Anthropic is down, the agent could in principle degrade to "your draft is preserved, AI features paused" — it currently hard-errors.

### `[GAP-043]` `[MEDIUM]` `[MISSING]` — Vendor cost / renewal modeling
Anthropic costs unbounded; could be $500/mo at 1,000 paying users (very rough: 1,000 × 100 calls/mo avg × $0.05/call). Not modeled.

### `[GAP-044]` `[MEDIUM]` `[MISSING]` — Vendor lock-in / exit plans
*Causes to not happen:* Supabase triple-bind (auth+DB+storage) means migration cost grows with customer count; at 1,000 customers a Supabase exit is ~3–6 weeks of development.

### `[GAP-049]` `[MEDIUM]` `[MISSING]` — Per-environment config / promotion / data seeding
*Causes to not happen:* once you have staging (GAP-047 fix), you need config split.

### `[GAP-052]` `[MEDIUM]` `[MISSING]` — Deploy strategy / rollback procedure
*Causes to not happen:* Vercel allows one-click rollback but no documented procedure means the first time you need it, you're learning under pressure.

### `[GAP-056]` `[MEDIUM]` `[MISSING]` — Tracing tool
*Causes to not happen:* request-tracing across /api/ai → Anthropic → ai_usage_logs is grep-driven.

### `[GAP-058]` `[MEDIUM]` `[MISSING]` — Runbook paths
*Causes to not happen:* when you hire support help, no incident playbook exists.

### `[GAP-060]` `[MEDIUM]` `[MISSING]` — Health check endpoint
*Causes to not happen:* uptime monitoring (GAP-059 fix) needs an endpoint to hit.

### `[GAP-062]` `[MEDIUM]` `[MISSING]` — Integration tests automated
*Causes to not happen:* TASK-026 manual procedure cannot be re-run cheaply.

### `[GAP-066]` `[MEDIUM]` `[MISSING]` — Performance / load tests
*Causes to not happen:* the 200K-word manuscript workload has never been tested under concurrent load. First load spike reveals limits.

### `[GAP-070]` `[MEDIUM]` `[MISSING]` — Color independence
*Causes to not happen:* `var GC` (genre color map) uses color as primary categorization with no text/icon redundancy. Color-blind users (~8% of men) cannot distinguish genres in the Genre Scanner.

### `[GAP-072]` `[MEDIUM]` `[MISSING]` — Text-zoom support
*Causes to not happen:* Crimson Pro at unspecified base; some users zoom to 200% and lose layout integrity.

### `[GAP-075]` `[MEDIUM]` `[MISSING]` — User-content locale handling
*Causes to happen:* a Spanish-language manuscript hits English-locked AI prompts; the AI critiques structure in English; the result is broken for non-English authors but the product accepts their signup.

### `[GAP-076]` `[MEDIUM]` `[MISSING]` — Analytics events manifest
*Causes to not happen:* you'll be running blind on conversion funnel from day one. You cannot answer "where do users drop off in the signup-to-first-book flow?" Decisions are intuition-only.

### `[GAP-077]` `[MEDIUM]` `[MISSING]` — Event naming convention / PII-in-events policy
*Causes to happen:* without policy, a developer adds `email` as an event param "for debugging" and PII flows to GA4 in violation of GA4's own TOS.

### `[GAP-080]` `[MEDIUM]` `[MISSING]` — Unsubscribe handling on commercial email
*Causes to happen:* the upgrade email (commercial) without unsubscribe link is a CAN-SPAM violation in the US.

### `[GAP-082]` `[MEDIUM]` `[MISSING]` — Bounce handling
*Causes to not happen:* hard-bounced addresses stay in profiles, polluting metrics.

### `[GAP-084]` `[MEDIUM]` `[WEAK]` — Web Vitals targets
"≤3s cold start" stated; no LCP/CLS/INP/TBT individual targets.

### `[GAP-085]` `[MEDIUM]` `[MISSING]` — API latency budgets
*Causes to not happen:* no per-endpoint budget.

### `[GAP-087]` `[MEDIUM]` `[MISSING]` — DB query budgets
*Causes to happen:* the GROUP BY on profiles for tier breakdown will full-scan; at 10,000 users it's ~1s; at 100,000 it's ~10s and the admin page times out.

### `[GAP-088]` `[MEDIUM]` `[MISSING]` — Service resource ceilings
*Causes to happen:* audio upload routes at default 1024 MB function memory will OOM on >100MB MP3 files, and you've sold 100GB Storage so this WILL happen.

### `[GAP-090]` `[MEDIUM]` `[MISSING]` — Load-test thresholds
*Causes to not happen:* the 200K-word manuscript workload not tested under concurrent load.

### `[GAP-092]` `[MEDIUM]` `[WEAK]` — Migration manifest fields
*Causes to not happen:* missing rollback / locks / online-offline metadata per migration.

### `[GAP-093]` `[MEDIUM]` `[MISSING]` — Destructive migration review path
*Causes to not happen:* destructive migration review is informal.

### `[GAP-104]` `[MEDIUM]` `[MISSING]` — `definition_of_done.deferred_to_v_next` list
*Causes to not happen:* the team-seats item lives in pricing card with no resolution; the deferral list is the place to commit.

### `[GAP-106]` `[MEDIUM]` `[MISSING]` — Risk register entire
*Causes to not happen:* the 10 Non-Negotiable Rules in CLAUDE.md function as informal anchors but not as a formal misunderstanding/silent-failure/blast-radius register.

### `[GAP-018]` `[MEDIUM]` `[WEAK]` — Session lifetime undocumented
Supabase defaults are fine but undocumented = next change is unintentional.

### `[GAP-013]` `[MEDIUM]` `[MISSING]` — Invitation flow (paired with GAP-011 resolution)
Depends on the team-seats decision. If seats are kept, this is the implementation gap.

### `[GAP-040]` `[MEDIUM]` `[MISSING]` — TOS re-acceptance flow (paired with GAP-039)
Without re-acceptance UX, you cannot legally enforce TOS changes against existing users.

---

## MARGINAL — Architectural observations (informational only, not remediated)

### `[OBSERVATION-006]` `[MARGINAL]` — REST vs tRPC

**Field:** api.contract_style
**Observed choice:** 11 REST routes under app/api/, all consumed only by your own web app (per `api.consumers` = own web app only).
**Better fit (alternative):** tRPC — typesafe RPC where the server route signature and client call site share types end-to-end.

**Reasoning:** the only argument for tRPC at v1 is developer-experience — types flow automatically. With one consumer and a small API surface (11 routes), the velocity gain is real but small. With Decision #11's verbatim-port directive in play, the agent's existing fetch() patterns are locked in, so tRPC would introduce a second pattern in the codebase. Net: REST is fine.

*What gets harder if you keep this:* nothing material at v1. If you ever add a mobile app or expose a public API, you'll add OpenAPI/Swagger generation on top of the REST routes — at which point tRPC's type-safety advantage flips into a multi-consumer disadvantage.

*What the audit will not do:* change the API style. The choice is defensible.

*Suggested next step:* keep REST. Document the choice in an ADR ("we chose REST over tRPC at v1 because we have one consumer and the agent's existing fetch patterns lock-in the simpler approach").

---

## LOW — Cosmetic, documentation, and marginal-impact gaps

### `[GAP-002]` `[LOW]` `[MISSING]` — Error/destructive color unspecified
Pick one (suggest #C0392B or your own); 2-line addition.

### `[GAP-003]` `[LOW]` `[MISSING]` — Logo not supplied
Required before /pricing, /landing, footer ship; you can supply at any time.

### `[GAP-023]` `[LOW]` `[MISSING]` — PII inventory
Documentation gap; the fields exist.

### `[GAP-024]` `[LOW]` `[WEAK]` — Encryption-at-rest documented
Supabase default; just write it down.

### `[GAP-025]` `[LOW]` `[WEAK]` — TLS 1.3 not pinned
Vercel defaults are TLS 1.2+; pin 1.3 or accept default.

### `[GAP-035]` `[LOW]` `[MISSING]` — CI grep-lint for canonical store
Depends on GAP-034 first.

### `[GAP-036]` `[LOW]` `[MISSING]` — Microcopy catalog
The welcome email text is the smallest viable starter catalog.

### `[GAP-046]` `[LOW]` `[MISSING]` — Vendor change-control process
Single-line policy is enough at v1.

### `[GAP-071]` `[LOW]` `[MISSING]` — `prefers-reduced-motion` support
CSS in 1 file.

### `[GAP-073]` `[LOW]` `[MISSING]` — A11y issue SLA
Single-line SLA statement.

### `[GAP-074]` `[LOW]` `[MISSING]` — i18n future v2 plan
Single-line statement of intent.

### `[GAP-083]` `[LOW]` `[MISSING]` — Email template versioning
One column on a templates table you don't have yet.

### `[GAP-089]` `[LOW]` `[MISSING]` — Cold-start budget
Vercel cold starts are 200ms–1s; pin 1s budget.

### `[GAP-097]` `[LOW]` `[MISSING]` — Response SLA
Single-sentence statement.

### `[GAP-098]` `[LOW]` `[MISSING]` — Changelog publication path
Pick a URL.

### `[GAP-100]` `[LOW]` `[MISSING]` — Feedback channel
Pick a tool (email is fine).

### `[GAP-101]` `[LOW]` `[WEAK]` — Acceptance criteria framing
CLAUDE.md metrics exist; just need pass/fail framing.

### `[GAP-102]` `[LOW]` `[MISSING]` — Required-tests list
Clusters with testing gaps.

### `[GAP-105]` `[LOW]` `[MISSING]` — Scope-expansion threshold
Pick a number (5 or 10).

---

## Audit metadata

| Field | Value |
|---|---|
| audit_date | 2026-05-03 |
| scope_target_mode | AGAINST_TARGET |
| target_scope | product |
| original_built_scope | pre-build spec (closest fit: product-with-prototype-discipline) |
| artifacts_provided | spec_docs, standing_orders, visual_references |
| deliberately_excluded | (none) |
| layer_3_used | false |
| auditor_name | Steve Macurdy |
| gap_count_by_severity | CRITICAL: 9, HIGH: 36, MEDIUM: 42, LOW: 19 |
| observation_count_by_confidence | STRONG-MISMATCH: 2, LIKELY-MISMATCH: 3, MARGINAL: 1 |
| remediation_selection | (filled at end of audit) |

---

*End of audit report.*
