<!-- APPLY: CREATE -->
# R-TASK-171: Lead Magnet — Outline Template (`app/resources/outline-template/page.tsx`)

## Status: NOT STARTED
## Priority: HIGH
## Phase: 6
## Estimated Sessions: 1 (page + API + integration) + operator commits PDF asset
## Dependencies: TASK-002 (brand store), R-TASK-104 (rate-limiting), R-TASK-170 (newsletter audience), TASK-007 (public-routes whitelist)
## Cluster: PATCH-3 round 2 v1 content cluster

## Inference Summary

| Addition | Source |
|---|---|
| Email gate before download | Q-C operator-answer (use default — gated; newsletter retention asset) |
| PDF as the magnet (vs text/web template) | Standard lead-magnet format; high perceived value, ~10-page worksheet |
| Auto-add to newsletter audience on submit (skips confirmation email) | Implicit consent at point of email submission for the magnet; per CAN-SPAM if disclosed at form (must disclose) |
| Or: double opt-in same as R-TASK-170 (safer, lower conversion) | Recommend disclosure path with explicit opt-in checkbox |
| Public route, no auth | TASK-007 |
| Rate-limit 10/hour/IP per R-TASK-104 | Same pattern as newsletter subscribe |

## Pre-flight: re-read current state

- Confirm R-TASK-170 has shipped — this task uses `lib/newsletter.ts` `addContact()`.
- Confirm `/resources/outline-template` and `/api/resources/outline-template` in middleware public-routes whitelist.
- Operator commits the PDF asset before launch. If not ready, page renders "Coming soon" with email capture still active (collect leads now, deliver when PDF is ready — operator emails the PDF retroactively).

## Files to Create

- `app/resources/outline-template/page.tsx` — server component
- `app/api/resources/outline-template/route.ts` — POST: validates email, adds to newsletter audience, returns signed download URL (or sends via email)
- `public/resources/outline-template.pdf` — operator-authored PDF (~10-page novel-outline worksheet)
- (reuses `<NewsletterCapture>` from R-TASK-170 with a magnet variant, OR has dedicated form — see Implementation)

## Implementation Requirements

### Page structure

Hero:
- Heading: "The Novel Outline Template That Actually Works"
- Subheading: "10 pages. Every section your draft needs before you write a word. Yours free."

Body:
- A bulleted preview of what's inside the PDF (4-6 bullets):
  - "The 12-beat structure (works for thrillers, romance, literary, you name it)"
  - "Character motivation worksheet — what your protagonist wants vs needs"
  - "Scene-level outline cards (printable)"
  - "The 'midpoint shift' checklist"
  - "Chapter 1 hook diagnostic"
  - "Plot-hole detector for your synopsis"

- Email-gate form:
  - Email input
  - Optional checkbox (recommended for legal clarity): "Send me one writing prompt every Sunday morning. No spam, no upsells, no '10 ways to crush your goals.'" — checked by default in v1; flip to unchecked for stricter EU/GDPR posture
  - Submit button: "Send me the template →"

- Below the form, in small text:
  - "We'll email the template to you immediately. Your email goes into our Sunday-prompt list. [Privacy policy](/privacy)."

After submit:
- Inline confirmation: "Check your inbox — the template just landed."
- Page replaces the form with a thank-you state including the literary punchline: "Now go outline something."

### Submit flow

POST `/api/resources/outline-template` with `{ email, subscribe_to_newsletter: boolean }`:

1. Validate email; rate-limit per R-TASK-104 (10/hour/IP)
2. **Send the PDF via email** using Resend transactional. Subject: "Your novel outline template — from My Best Selling Novel". Email body links to the PDF (signed URL valid 7 days, or direct attachment). Including the PDF as an email attachment is preferred — recipient gets immediate value without click-through.
3. **If `subscribe_to_newsletter=true`:** call `lib/newsletter.ts addContact(email, { unconfirmed: false })` — direct add (single opt-in), since the user explicitly checked the box at form submission. Per CAN-SPAM, single opt-in is acceptable given disclosure on form.
4. **If `subscribe_to_newsletter=false`:** do not add to newsletter; user only receives the magnet PDF email.
5. Return 200 + ok message.

### Why single opt-in here vs double opt-in for R-TASK-170 footer subscribe?

- Footer subscribe: user only gets newsletter; no other value at point of capture; **double opt-in** to confirm intent and prevent abuse.
- Lead magnet: user is exchanging email for PDF; high implicit consent; **single opt-in is acceptable** with clear disclosure that submitting adds them to newsletter (the checkbox + small text).

For stricter posture (EU residents, regulated industries), flip both to double opt-in. Document this as a v2 toggle in `docs/EMAIL_COMPLIANCE.md` (created in R-TASK-170).

### Email template — magnet delivery

```
Subject: Your novel outline template — from My Best Selling Novel
From: My Best Selling Novel <noreply@mybestsellingnovel.com>

[Header with brand-gold accent]

Here's the template you asked for:
[ Download the PDF ]  ← button linking to signed URL OR PDF attached

A few notes:
- Print page 3 (the scene cards). Use them.
- Page 7 is the part most authors skip. Don't.
- If you get stuck, the My Best Selling Novel agent walks you through 12 steps from outline to published novel. [Start Chapter One →]

Made for writers, by writers who got tired of waiting,
— Steve

[ Postal address per R-TASK-119 ]
[ Unsubscribe link if subscribed to newsletter ]
```

### Operator content commitment

- PDF: operator authors `outline-template.pdf` before launch. ~10 pages. Brand-aligned design (brand-navy + brand-gold). Tools: Canva, Affinity Publisher, or InDesign. If operator commissions a designer, ~$200-500 cost for a polished version.
- Email body copy: above template; operator can refine voice.

If shipping with placeholder PDF (single-page "Coming soon — full template arriving [date]"): captures still work, set up retroactive delivery via Resend Broadcasts to all collected emails when PDF is ready.

### Brand styling

- Page background `bg-brand-navy`
- Form: card-style on `bg-brand-navyLight`, centered, max-w-[480px]
- Submit button: brand-gold primary
- Bullets: brand-gold checkmarks (heroicons or inline SVG)

### SEO

- Page title: "Free Novel Outline Template — Download Now"
- Meta description: "10-page outline worksheet covering structure, character motivation, scene cards, and plot-hole detection. Free download."
- OG image: PDF cover preview rendered to PNG
- Schema.org: `Offer` markup with `price=0`

### Analytics

- GA event `lead_magnet_view` on page load
- GA event `lead_magnet_submit` on form submit (with `subscribed_newsletter` boolean property)

## Tests Required

- AT-171-1: `/resources/outline-template` returns 200 OK without auth
- AT-171-2: Submit valid email → 200 + magnet PDF email arrives in test inbox within 30s
- AT-171-3: Submit valid email with checkbox checked → contact added to newsletter audience as confirmed (single opt-in)
- AT-171-4: Submit valid email with checkbox unchecked → contact NOT added to newsletter; only magnet email sent
- AT-171-5: Invalid email → 400; rate-limit triggers at 11th submit/hour
- AT-171-6: PDF downloads and renders correctly (verify by opening in Preview/Acrobat)
- AT-171-7: Email body contains operator's postal address + (if subscribed) unsubscribe link
- AT-171-8: GA `lead_magnet_submit` fires with correct property
- AT-171-9: If shipping with placeholder PDF, captures still succeed; tracked in `docs/CONTENT_TODO.md`
- AT-171-10: `/resources/outline-template` and `/api/resources/outline-template` in middleware public-routes whitelist

## Session Notes
_(Filled by Claude Code during implementation)_
