<!-- APPLY: REPLACE -->
<!-- Target: docs/TASKS/TASK-046-signup-modal.md (in original mybsn package) -->
<!-- Backup: docs/EXPANDED-TASKS/backups/TASK-046-signup-modal.pre-expansion-backup.md -->
<!-- Expanded 2026-05-09 from 87 words to ~830 words via PATCH-3 sub-deliverable B.3. -->

# TASK-046: Signup Modal (`components/SignupModal.tsx`)

## Status: NOT STARTED
## Priority: HIGH
## Phase: 6
## Estimated Sessions: 1
## Dependencies: TASK-002, TASK-008 (signup-page extracts shared `<SignupForm>`), TASK-043 (consumed from landing page CTAs), TASK-045 (consumed from pricing CTAs)
## Requirements Covered: R12, R32
## Spec Reference: Section 6.4

## Inference Summary

| Addition | Source |
|---|---|
| Modal wraps shared `<SignupForm>` extracted from TASK-008 | Q-6.16 operator-answer (use default — DRY; both modal and dedicated `/signup` use same form internals) |
| Backdrop click + ESC key + X button all close; no state preservation | Q-6.17 operator-answer (use default — close means opt-out; reopen starts fresh) |
| GA `signup_modal_opened` with `source` property | Q-6.18 operator-answer (use default); Q-9.2 taxonomy |
| Submit button copy "Start Chapter One →" mirroring hero/footer | Cascade decision 2026-05-08 |
| Modal closes on successful signup; user redirected to `/app` | Standard signup UX |

Operator confirmed all questions on 2026-05-08.

## Pre-flight: re-read current state

- Confirm TASK-008 (signup-page) has shipped — this task EXTRACTS the form from TASK-008's page into a shared component, then both surfaces use it.
- View `app/(auth)/signup/page.tsx` (TASK-008's expanded form). The form logic — HIBP check (R-TASK-114), 3-checkbox acceptance per Q-8.4=a, MFA banner enrollment recording — moves to a new `<SignupForm>` component. The modal and the page both render `<SignupForm />` with different chrome.
- Confirm `lib/brand.ts` modal styling tokens (overlay color, max-width, animation tokens) are defined in TASK-002 expansion.

## Files to Create/Modify

- `components/SignupModal.tsx` (NEW) — modal wrapper
- `components/auth/SignupForm.tsx` (NEW) — extracted shared form
- `app/(auth)/signup/page.tsx` (MODIFY) — replace inline form with `<SignupForm />` import; preserve page chrome (header, breadcrumbs, etc.)

## Implementation Requirements

### Modal structure

```tsx
'use client';
import { useEffect } from 'react';
import { SignupForm } from '@/components/auth/SignupForm';

interface SignupModalProps {
  open: boolean;
  onClose: () => void;
  source: 'landing_hero' | 'pricing_author_monthly' | 'pricing_author_annual' | 'pricing_publisher_monthly' | 'pricing_publisher_annual' | 'tour_complete' | 'footer_closing_cta' | 'genre_<name>' | 'other';
  // Optional intent — preserves what user wanted (e.g., subscribe to specific tier post-signup)
  intent?: { type: 'subscribe'; priceId: string };
}

export function SignupModal({ open, onClose, source, intent }: SignupModalProps) {
  // ESC key close
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open, onClose]);

  // GA event on open
  useEffect(() => {
    if (open) {
      window.gtag?.('event', 'signup_modal_opened', { source });
    }
  }, [open, source]);

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" onClick={onClose}>
      <div className="absolute inset-0 bg-brand-navy/80 backdrop-blur-sm" />
      <div className="relative w-full max-w-[480px] mx-4 bg-brand-navyLight rounded-lg shadow-2xl ring-1 ring-brand-gold/20 p-8" onClick={(e) => e.stopPropagation()}>
        <button onClick={onClose} aria-label="Close" className="absolute top-4 right-4 text-brand-textMuted hover:text-brand-white">×</button>
        <h2 className="text-h2 text-brand-white mb-6">Start Chapter One.</h2>
        <SignupForm intent={intent} onSuccess={onClose} submitLabel="Start Chapter One →" />
      </div>
    </div>
  );
}
```

### Close behavior (Q-6.17 default)

Three close mechanisms:
1. Backdrop click (outermost div `onClick`)
2. ESC key (window listener while modal open)
3. X button (top-right, branded textMuted color)

No state preservation. If user closes mid-fill, reopening starts with empty fields. Per Q-6.17, simplicity wins for v1; preservation can be added in v1.1 if user feedback requests.

### `<SignupForm>` extracted component

This is the form Logic that previously lived in TASK-008. Move (don't copy) to `components/auth/SignupForm.tsx`. Both `<SignupModal>` and `app/(auth)/signup/page.tsx` import it.

Form fields (unchanged from TASK-008):
- Email (lowercase trim)
- Password (min 12 chars; HIBP check per R-TASK-114)
- Full name (optional)
- 3 acceptance checkboxes (ToS+AUP combined per Q-8.4=a, Privacy, Refunds)

Form props:
```typescript
interface SignupFormProps {
  intent?: { type: 'subscribe'; priceId: string };  // post-signup redirect to checkout
  onSuccess?: () => void;
  submitLabel?: string;
  source?: string;  // forwarded to GA on signup
}
```

After successful signup:
- Fire GA `sign_up` event with `source` and `tier='explorer'`
- If `intent.type === 'subscribe'`: POST to `/api/stripe/checkout` with the priceId, redirect to Stripe
- Else if `onSuccess` provided: call it (modal calls `onClose`)
- Default: redirect to `/app`

### Modal triggers tracked in GA (Q-6.18)

Per Q-6.18 default, `signup_modal_opened` event fires with `source` property each time the modal opens. Sources include:
- `landing_hero` (TASK-043 hero CTA)
- `landing_footer_closing_cta` (TASK-043 footer closing CTA)
- `pricing_<tier>_<interval>` (TASK-045 pricing CTAs)
- `tour_complete` (TASK-044 stop 14 CTA)
- `genre_<name>` (R-TASK-161 genre tile CTAs)
- `affiliate_waitlist` (NOT — this is a separate form, not the signup modal)

### Brand styling

- Backdrop: `bg-brand-navy/80 backdrop-blur-sm`
- Modal card: `bg-brand-navyLight ring-1 ring-brand-gold/20 shadow-2xl`
- Animations: subtle fade-in (200ms) + scale-in (95% → 100%) — respects `prefers-reduced-motion` (R-TASK-110)
- Submit button: brand-gold filled with "Start Chapter One →" copy

### Accessibility

- `role="dialog"` `aria-modal="true"` on the inner card
- `aria-labelledby` pointing to the heading element
- Focus trap: when modal opens, focus moves to email input; tab cycles within modal; shift+tab from email goes to X button
- Restore focus to triggering CTA on close
- Escape key closes (already implemented above)

## What this task does NOT do

- Does NOT change the signup form's validation logic — extracted unchanged from TASK-008
- Does NOT preserve mid-fill state across opens (Q-6.17)
- Does NOT support a guest checkout flow (intent.subscribe requires signup first)

## Tests Required

- AT-188: Modal opens when CTA clicked; backdrop click closes
- AT-189: ESC key closes modal
- AT-190: X button closes modal
- AT-191: Closing mid-fill discards entered data; reopening starts empty
- AT-192: GA `signup_modal_opened` fires on each open with correct `source`
- AT-193: Successful signup with `intent.subscribe` redirects to Stripe Checkout
- AT-194: Successful signup without intent calls `onSuccess` (modal closes; user lands at `/app`)
- AT-195: Focus is trapped inside modal while open; restores to triggering element on close
- AT-196: `app/(auth)/signup/page.tsx` and `<SignupModal>` both render the same form (extracted shared component verified by both surfaces calling `<SignupForm />`)

## Session Notes
_(Filled by Claude Code during implementation)_
