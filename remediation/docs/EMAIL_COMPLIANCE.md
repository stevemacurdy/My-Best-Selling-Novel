# EMAIL_COMPLIANCE.md

**Purpose:** CAN-SPAM stance, opt-in policy, EU-stricter toggle path. Reference doc for how email collection, sending, and unsubscribing work in the v1 build.

**Last updated:** 2026-05-09 (created in PATCH-3 round 2; cross-references R-TASK-119, R-TASK-170, R-TASK-171, R-TASK-172, TASK-054, TASK-055, TASK-056).

---

## CAN-SPAM Act compliance (US)

Every commercial email sent from `noreply@mybestsellingnovel.com` must include:

1. **Sender identification.** From address: `My Best Selling Novel <noreply@mybestsellingnovel.com>`. Reply-to: `steve@mybestsellingnovel.com` for transactional emails (welcome, upgrade) where operator wants to invite replies. For purely marketing sends (Sunday Prompt newsletter), reply-to may default to `noreply@`.
2. **Honest subject line.** No bait-and-switch. The literary voice ("You showed up. Now the work.") is honest framing of the email's content.
3. **Postal address.** Hardcoded in `lib/emails/_layout.tsx` per Q-8.5 lock: `1068 Industrial Park Circle, Grantsville, UT 84029`. Single source of truth — every email gets the same address. If operator's address ever changes, update the layout once.
4. **Unsubscribe mechanism.** Required for all commercial messages. Resend Broadcasts auto-injects an unsubscribe link in every send when the recipient is on an audience. For transactional one-offs (welcome email to non-newsletter user), unsubscribe link is omitted (welcome is transactional, not marketing).
5. **Honor unsubscribe within 10 business days.** Resend handles automatically — once a user clicks unsubscribe, they're flagged in the audience and excluded from future sends.

---

## Opt-in policy

The v1 build uses **double opt-in** for the footer Sunday Prompt newsletter and **single opt-in with disclosure** for the lead-magnet outline-template form. Rationale:

| Surface | Opt-in type | Why |
|---|---|---|
| Footer newsletter capture (R-TASK-170) | Double opt-in (confirmation email required before list-add) | User receives only newsletter — no other value at point of capture; confirmation prevents accidental signups + email-typo abuse |
| Lead magnet outline template (R-TASK-171) | Single opt-in WITH disclosed checkbox | User exchanges email for PDF; clear disclosure on form ("submitting adds you to newsletter") + checkbox provides explicit consent at submission time. Single opt-in is acceptable under CAN-SPAM with disclosure |
| Affiliate waitlist (R-TASK-172) | Single opt-in | User self-identifies as wanting to promote; very low spam risk; signup IS consent to receive program-launch notifications. Separate Resend audience from the Sunday Prompt list |

**Both surfaces include a checkbox or disclosure indicating what list the user is being added to.** No "secret" list-adds.

---

## EU/GDPR-stricter toggle path (deferred to v1.1)

If operator decides to harden compliance for EU residents (or wants to opt all users into a stricter posture), the toggle is:

1. **Both the footer newsletter capture AND the lead magnet form switch to double opt-in.**
   - In `app/api/newsletter/subscribe/route.ts` — already double opt-in; no change.
   - In `app/api/resources/outline-template/route.ts` — change `addContact(email, { unconfirmed: false })` to `addContact(email, { unconfirmed: true })` and add a confirmation-email step before delivering the PDF.
   - PDF delivery deferred until confirmation is clicked (typically 0-30 minutes; users are accustomed to this pattern).

2. **Add geographical detection** (optional, more complex):
   - Detect EU residents via Cloudflare's `cf-ipcountry` header or similar
   - Apply double opt-in only to EU residents; single opt-in elsewhere (the GDPR vs CAN-SPAM differential)
   - Operator-decision territory; recommend simpler "double opt-in everywhere" path for v1.1

3. **Add explicit privacy-policy consent checkbox** before any email submit:
   - Currently the privacy disclosure is small text below the form ("Your email goes into our Sunday-prompt list. [Privacy policy]")
   - GDPR-stricter posture moves this to an explicit unchecked checkbox the user must check: "I agree to the [Privacy Policy](/privacy)"
   - Reduces conversion ~10-15% based on industry data; operator decides whether the legal posture is worth the conversion hit

Document status of these toggles here as operator makes decisions.

---

## Resend webhook integration (deferred to v1.1)

Resend supports webhook events for:
- `email.delivered`
- `email.bounced` (hard bounce — invalid address)
- `email.complained` (recipient marked as spam)
- `email.opened` (if open-tracking enabled)
- `email.clicked` (if link-tracking enabled)

Subscribing would let v1.1 surface email health metrics:
- Bounce rate per send → list hygiene
- Complaint rate → content quality + sending reputation
- Open rate per subject line → A/B test welcome / upgrade variants
- Click rate per CTA → which CTAs convert best

Per Q-8.14 default, deferred. When v1.1 enables:
1. Add `app/api/resend/webhook/route.ts` to handle delivery events
2. Create `email_events` table in a new migration
3. Add admin dashboard widget surfacing recent bounces / complaints

---

## Operator action items (live list)

- [ ] Verify Resend domain DKIM/SPF/DMARC records are present in Cloudflare DNS (TASK-068 + R-TASK-122)
- [ ] Decide reply-to address for newsletter sends (`noreply@` vs `steve@` vs new `hello@` inbox)
- [ ] Decide whether to add `legal@mybestsellingnovel.com` inbox (R-TASK-174 references; could route to `help@` for v1)
- [ ] Confirm operator's postal address remains current — if change, update `lib/emails/_layout.tsx`
- [ ] Document Resend account credentials rotation cadence per R-TASK-115 key rotation procedure
