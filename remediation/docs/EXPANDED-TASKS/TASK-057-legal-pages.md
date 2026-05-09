<!-- APPLY: REPLACE -->
<!-- Target: docs/TASKS/TASK-057-legal-pages.md (in original mybsn package) -->
<!-- Backup: docs/EXPANDED-TASKS/backups/TASK-057-legal-pages.pre-expansion-backup.md -->
<!-- Expanded 2026-05-06 from 114 words to ~1380 words via PATCH-3 sub-deliverable B.3.
     This was the only NEEDS-OPERATOR-INPUT task; all 8 Phase 8 questions answered by operator on 2026-05-06. -->

# TASK-057: Legal Pages — Terms of Service & Privacy Policy

## Status: NOT STARTED
## Priority: HIGH
## Phase: 8
## Estimated Sessions: 2
## Dependencies: TASK-002
## Requirements Covered: R28, R29
## Spec Reference: Section 8.4

## Inference Summary

This expanded task replaces the original 114-word TASK-057. Each addition is sourced as follows:

| Addition | Source |
|---|---|
| Governing law: Utah; venue: Tooele County, Utah | Q-8.1 operator-answer |
| Refund window: 14 days, all tiers, no pro-rata | Q-8.2 operator-answer (lifetime tier eliminated; refund applies to monthly + annual recurring only) |
| AUP inline summary in ToS, full AUP at /aup | Q-8.4 = (a) operator-answer |
| 3 acceptance checkboxes at signup (ToS+AUP combined / Privacy / Refunds) | Q-8.4 = (a); Q-2.8; R-TASK-120 |
| 12-month limitation of liability cap | Q-8.5 operator-answer (recurring-only, no lifetime carveout needed since lifetime eliminated) |
| Privacy Policy data category enumeration | Q-8.6 operator-answer (confirmed) |
| 90-day manuscript retention after deletion request | Q-8.7 operator-answer (overrode 30-day default; R-TASK-102 also updated) |
| AI/ML disclosure language matches Anthropic DPA | Q-8.8 operator-answer (confirmed) |
| **No lifetime tier language** | A.3 lifetime elimination 2026-05-06 (Q-8.2); Decision #29 + #33 revisions |

Operator confirmed all questions on 2026-05-06.

## Pre-flight: re-read current state

- View `app/terms/page.tsx` and `app/privacy/page.tsx` if present. If they contain "lifetime" language anywhere, that's stale (pre-A.3) and must be removed.
- View `migrations/014_document_acceptances.sql` (R-TASK-120) — confirm in place.
- Confirm Anthropic DPA has been signed by operator (R-TASK-105 dependency for the AI/ML disclosure language). If unsigned at TASK-057 ship time, mark the AI/ML section as DRAFT and revisit when DPA is in hand.

## Files to Create/Modify

- `app/terms/page.tsx` (NEW)
- `app/privacy/page.tsx` (NEW)
- `lib/legal/versions.ts` (NEW; version constants imported by signup acceptance recording)

## Implementation Requirements

### `lib/legal/versions.ts`

```typescript
// Bump these when policy text materially changes; old acceptances become stale per R-TASK-120
export const TOS_VERSION = '2026-05-06';
export const PRIVACY_VERSION = '2026-05-06';
export const REFUNDS_VERSION = '2026-05-06';
// AUP is inline in ToS per Q-8.4 = (a); not a separate version.
```

R-TASK-120's re-acceptance flow checks the `document_acceptances` table on every authenticated request — if the user's accepted version is older than the current version, they hit an acceptance wall before continuing.

### `app/terms/page.tsx` — Terms of Service

Server component, public route (per TASK-007 whitelist). Renders the policy as a long-form document with a sticky "Last updated" header showing TOS_VERSION. Use Crimson Pro typography from `lib/brand.ts`.

**Required sections (in order):**

1. **Acceptance** — "By creating an account, you agree to these Terms..."
2. **Service description** — what the service does
3. **Subscription & billing** — Explorer (free), Author monthly $29 / annual $313.20, Publisher monthly $79 / annual $853.20. Auto-renewal language. **No lifetime SKU mentioned anywhere** (eliminated 2026-05-06).
4. **Refund policy** (per Q-8.2): 14-day full refund window from purchase date for any recurring subscription (monthly or annual). No pro-rata refunds for partial periods. Cancellation outside the 14-day window stops auto-renewal but does not refund the current period. Cross-link to /refunds for the standalone Refund Policy.
5. **Acceptable Use Policy (inline summary per Q-8.4 = (a))** — section heading "Acceptable Use." Plain-language summary of the prohibited behaviors (illegal content, IP infringement, automated abuse, harassment, account-stacking, reverse-engineering, malware, etc.). Closes with: "The full Acceptable Use Policy is at /aup; this section provides a summary."
6. **Content ownership** — operator-author retains copyright to manuscript content. Operator (the company) holds no claim. AI-generated content is not copyrighted and operator does not assert rights. Operator-author is responsible for the originality of their work.
7. **Account responsibilities** — keep credentials secure, MFA recommended, one account per person, accurate registration info.
8. **Termination** — operator (company) may terminate accounts for AUP violations. User may terminate at any time via /account; deletion process per Privacy Policy.
9. **Disclaimers** — service provided "as is," AI output may be inaccurate, user reviews all output before publication.
10. **Limitation of liability** (per Q-8.5): operator's aggregate liability shall not exceed the fees paid by the user in the most recent 12 months prior to the event giving rise to the claim. (Standard SaaS recurring-only formulation. The lifetime SKU's special carveout is not needed because lifetime tier was eliminated.)
11. **Indemnification** — user indemnifies operator for claims arising from user's content or use of service.
12. **Governing law and venue** (per Q-8.1): "These Terms are governed by the laws of the State of Utah. Any dispute arising under or relating to these Terms shall be brought exclusively in the state or federal courts located in Tooele County, Utah, and the parties consent to personal jurisdiction in that venue."
13. **Changes to terms** — operator may revise; material changes trigger re-acceptance via the in-app flow per R-TASK-120.
14. **Contact** — link to /help (per R-TASK-107 support inbox).

### `app/privacy/page.tsx` — Privacy Policy

Server component, public route. Same Crimson Pro typography.

**Required sections:**

1. **Information we collect** (per Q-8.6 confirmed):
   - Account data (email, name, password hash via Supabase Auth)
   - Subscription data (tier, status, payment metadata via Stripe — operator does not store card numbers)
   - AI prompts and responses (the manuscript content sent to Claude, plus Claude's responses, retained per the retention table below)
   - **Manuscript content** (book text, chapter content, audio uploads stored in Supabase Storage)
   - Usage analytics (per Decision #29: GA4 page views and conversion events)
   - Support communications (per R-TASK-107: emails to /help@)
2. **How we use information** — to provide the service, process payments, communicate operationally, improve the product (aggregated/anonymized analytics only; never selling data).
3. **Third-party processors** — Supabase (database + storage + auth), Stripe (billing), Anthropic (AI inference), Resend (email), Vercel (hosting), Google Analytics (analytics). All under DPA per R-TASK-105. Subprocessor list is /subprocessors and changes are notified per R-TASK-121.
4. **AI/ML disclosure** (per Q-8.8 confirmed): "When you use AI features (chapter writing, plot suggestions, copy editing, etc.), the manuscript content and prompt are sent to Anthropic's Claude API for processing. Per our Data Processing Agreement with Anthropic, your content is NOT used to train Anthropic's models. Anthropic retains the content for up to 30 days for abuse monitoring and trust-and-safety purposes, after which it is deleted from Anthropic's systems. Within our own systems, retention is per the table below."
5. **Data retention** (per Q-8.7):
   | Category | Retention after account deletion request |
   |---|---|
   | Manuscript content (books, chapters, audio) | **90 days** in Supabase Storage + Postgres, then permanently deleted |
   | AI prompts + responses (`ai_usage_logs`) | **90 days**, then permanently deleted |
   | Account data (`profiles`, `auth.users`) | 90-day grace period (account is recoverable); permanently deleted at day 90 |
   | Audit log entries | 7 years (compliance), with PII stripped after the 90-day grace period |
   | Stripe payment records | Retained per Stripe's policies; operator does not control |
6. **Your rights** — access, export (per R-TASK-117 user data export), correct, delete (per R-TASK-102 3-stage deletion lifecycle: request → 90-day grace → permanent purge). Link to /account for self-service.
7. **Cookies** — link to /cookies (per R-TASK-119).
8. **Security** — encryption at rest + in transit, MFA available, security disclosure at /vuln-disclosure.
9. **Children** — service not directed at children under 13. If you believe a child has signed up, contact us at /help.
10. **International users** — service is hosted in the United States; data may be transferred there. EU users see /subprocessors for sub-processors and DPA terms.
11. **Changes** — material changes trigger re-acceptance per R-TASK-120.
12. **Contact** — link to /help.

### Brand styling

Long-form prose. Container max-width 720px (optimal reading line length for Crimson Pro 18px). Padding 32px on desktop, 16px on mobile. Section headings `text-h2`. Sticky header with "Last updated: 2026-05-06" using `text-brand-textMuted`. Body `text-brand-white` on `bg-brand-navy`.

### What this task does NOT do

- Does NOT include any mention of lifetime tier (eliminated 2026-05-06)
- Does NOT include team-seat language (R-TASK-101 Path A)
- Does NOT replace the standalone Refund Policy at /refunds (built separately by R-TASK-119); this task's refund section in the ToS is a summary that cross-links to the full /refunds page
- Does NOT include the 7 separate policy pages from R-TASK-119 (AUP, Cookies, DMCA, AI/ML disclosure, Vuln Disclosure, A11y Statement, Refunds) — TASK-057 is just ToS + Privacy. R-TASK-119 expansion adds the others.

## Tests Required

- AT-090: `/terms` renders without errors and contains the 14 required sections
- AT-091: `/privacy` renders without errors and contains the 12 required sections
- AT-092: Mechanical: neither page contains the strings "lifetime", "Lifetime", "lifetime tier", or "team seats"
- AT-093: Mechanical: ToS contains "Tooele County" and "State of Utah" exactly once each (in the Governing law section)
- AT-094: Mechanical: Privacy Policy retention table contains "90 days" for manuscript content
- AT-095: Both pages render in Crimson Pro 18px body text on navy background
- AT-096: Mobile (768px) renders with single-column layout and 16px body text per Q-1.5/Q-9.1 defaults

## Session Notes
_(Filled by Claude Code during implementation)_

> **Operator note (2026-05-06):** This task uses the legal language drafted from operator answers Q-8.1 through Q-8.8. **Before publishing live**, operator should have these pages reviewed by counsel licensed in Utah, particularly the limitation of liability cap and the Tooele County exclusive-venue clause. Counsel review is OUT-OF-SCOPE for Claude Code implementation but IN-SCOPE for the Phase 12 launch checklist.
