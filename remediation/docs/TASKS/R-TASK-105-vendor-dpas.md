<!-- APPLY: CREATE -->
# R-TASK-105: Vendor DPA Acquisition & Tracking

## Status: NOT STARTED
## Priority: CRITICAL
## Phase: 11 (kickoff) — calendar tail extends into Phase 12 for vendor signatures
<!-- Phase relocation (2026-05-06): R-TASK-105 was originally tagged Phase 12. Relocated to Phase 11 to resolve the forward reference in R-TASK-122 (staging environment), which legitimately depends on Supabase DPA being in place before second-project provisioning. The 1-3 week vendor-signature wait still happens in calendar parallel — engineering work just kicks off in Phase 11. -->
## Estimated Sessions: 1 (kickoff) + 1-3 weeks calendar time (vendor signature)
## Dependencies: None
## Resolves Gaps: GAP-041
## Spec Reference: AUDIT_REPORT.md CRITICAL section

## Pre-flight: re-read current state

Before making any change, read the current state of every file listed in "Files to Modify" below. Verify the gap(s) addressed by this task are still present in the current code. Specifically:

- For each file in "Files to Modify": view the file and confirm the condition the audit observed (e.g., "no rate limiting on /api/ai") still applies.
- For each gap in "Resolves Gaps": confirm the gap remains open. The audit was conducted on 2026-05-04; if the codebase changed since, the gap may have been partially or fully addressed.
- If a gap is no longer present, report this finding in PROGRESS.md, mark this task as superseded, and stop. Do not make changes.
- If a gap is partially addressed, scope this task to the remaining work and document in this file's Session Notes what was already addressed and skipped.
- If the gap is still fully present as the audit described, proceed with the rest of this task.

This pre-flight catches the case where the codebase changed between audit and remediation — exactly the failure mode that produces silent overwrites of unrelated work.

## Files to Create

- `docs/legal/dpas/INDEX.md` — vendor DPA tracker (vendor, status, signed_date, contract_url, contact)
- `docs/legal/dpas/supabase-dpa.pdf` — signed Supabase DPA (downloaded after signature)
- `docs/legal/dpas/anthropic-dpa.pdf` — signed Anthropic DPA
- `docs/legal/dpas/stripe-dpa.pdf` — signed Stripe DPA
- `docs/legal/dpas/resend-dpa.pdf` — signed Resend DPA
- `docs/legal/dpas/vercel-dpa.pdf` — signed Vercel DPA
- `docs/legal/dpas/google-analytics-dpa.pdf` — Google Ads/Analytics DPA (signed via Admin console)

## Vendor-by-vendor procedure

### Supabase
- Plan: Pro ($25/mo) — DPA available on request
- Action: Email support@supabase.io with subject "DPA Request — [account email]"; or self-serve via Dashboard → Organization → Settings → Compliance
- Typical turnaround: 24-72 hours
- Signature: DocuSign or counter-signed PDF
- Subprocessors: AWS (us-east-1 by default), GCP (some services)

### Anthropic
- Plan: Standard API access — DPA available on request
- Action: Email privacy@anthropic.com with subject "DPA Request — [organization]"
- Typical turnaround: 1-2 weeks (legal review)
- Signature: counter-signed PDF
- Note: Anthropic's data handling addendum specifies that customer data (your prompt + completion) is not used to train models on the standard API tier
- Subprocessors: AWS (primary infra)

### Stripe
- Plan: any
- Action: Self-serve at https://stripe.com/legal/dpa (downloadable)
- No counter-signature required — signing the Stripe Services Agreement constitutes acceptance of the DPA
- Save the DPA PDF to docs/legal/dpas/ for your records
- Subprocessors: AWS, additional listed in their DPA appendix

### Resend
- Plan: any
- Action: Verify Resend account exists; download published DPA PDF from https://resend.com/static/documents/resend-dpa-signed.pdf as evidence; the DPA is auto-binding via Resend ToS acceptance per their DPA text "This Addendum shall become legally binding upon Customer entering into the Agreement."
- Typical turnaround: immediate (click-through)
- Subprocessors: AWS (us-east-1)

### Vercel
- Plan: Pro and above includes DPA in Terms; Hobby tier does not include DPA
- Action: Sign Vercel Pro plan; DPA is incorporated by reference. For explicit signed copy, contact privacy@vercel.com
- Subprocessors: AWS, GCP, Cloudflare (CDN)

### Google Analytics
- Plan: GA4 free
- Action: Accept Google Ads Data Processing Terms in Admin → Account Settings → Data Sharing
- Note: GA4 Data Processing Terms function as the DPA
- Important: configure GA4 with `IP anonymization=true` and `Google Signals=false` for EU compliance

### mammoth (DOCX parser, npm package)
- No DPA needed — runs in your Vercel function, vendor doesn't process data on their infrastructure

### Google Fonts (CDN)
- DPA not required if you self-host fonts. RECOMMENDED: download Crimson Pro WOFF2 files and serve from your own /public/fonts/ to avoid Google CDN tracking entirely. This is a 30-minute change in `app/layout.tsx`.
- Alternative: use `next/font/google` which proxies fonts through your own domain — eliminates Google's view of user IPs

## DPA tracker schema

`docs/legal/dpas/INDEX.md` format:

```markdown
# Data Processing Agreement Tracker

| Vendor | Status | Requested | Signed | Expires | Subprocessors | Contact |
|---|---|---|---|---|---|---|
| Supabase | ✅ Resolved (self-serve) | 2026-05-04 | 2026-05-09 | Indefinite | AWS, GCP | support@supabase.io |
| Anthropic | ✅ Resolved (click-through) | 2026-05-04 | 2026-05-09 | Indefinite | AWS | privacy@anthropic.com |
| Stripe | ✅ Self-served | 2026-05-04 | 2026-05-04 | Indefinite | AWS | (built into ToS) |
| Resend | ✅ Resolved (click-through) | 2026-05-04 | 2026-05-09 | Indefinite | AWS | https://resend.com/legal/dpa [^resend] |
| Vercel | ✅ Pro plan | 2026-05-04 | 2026-05-04 | with subscription | AWS, GCP, CF | privacy@vercel.com |
| Google Analytics | ✅ Accepted | 2026-05-04 | 2026-05-04 | Indefinite | Google Cloud | (Admin console) |

[^resend]: Auto-bound via ToS per DPA text; pre-signed PDF at https://resend.com/static/documents/resend-dpa-signed.pdf
```

## Public Privacy Policy update

After all DPAs in place, update `app/privacy/page.tsx` (TASK-057) to include:

```markdown
## Subprocessors

We use the following subprocessors to provide our services. Each is bound by
a Data Processing Agreement that meets GDPR Article 28 requirements:

- **Supabase Inc.** — database, authentication, file storage (US, AWS infrastructure)
- **Anthropic PBC** — AI text generation (US, AWS infrastructure)
- **Stripe Inc.** — payment processing (US, multi-region)
- **Resend Inc.** — transactional email (US, AWS infrastructure)
- **Vercel Inc.** — application hosting (multi-region, AWS+GCP)
- **Google LLC (Google Analytics)** — usage analytics (US/EU, Google Cloud)

We will notify users of any changes to this list by email and via this
Privacy Policy at least 30 days before the change takes effect, in
accordance with our Subprocessor Change Policy.
```

This pairs with R-TASK-121 (subprocessor disclosure cadence).

## Tests Required

- AT-105-1: All 6 vendor DPAs are signed/accepted; PDFs in docs/legal/dpas/
- AT-105-2: INDEX.md tracker is current; all status fields show ✅
- AT-105-3: Privacy Policy lists all subprocessors and notice cadence
- AT-105-4: GA4 configured with IP anonymization=true, Google Signals=false (verified in GA4 Admin)
- AT-105-5: Crimson Pro served from own domain (not Google CDN) OR explicit user notification of Google Fonts use included in Cookie Policy

## Calendar Note

DPA signature is the longest-pole item in the launch readiness path because vendors control the timeline. Initiate this task **before any other Phase 12 work** so signatures arrive in parallel with other prep. Most signatures complete in 1-2 weeks; Anthropic legal review can take longer.

If launch must precede DPA completion, DO NOT serve EU/UK users until DPAs are in place. Implement geo-block in middleware.ts as interim measure.

## Session Notes
_(Filled by operator — DPAs require human signature, not Claude Code)_
