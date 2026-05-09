<!-- APPLY: CREATE -->
# R-TASK-110: Accessibility Baseline (WCAG 2.2 AA)

## Status: NOT STARTED
## Priority: HIGH
## Phase: 11
## Estimated Sessions: 2
## Dependencies: TASK-002, R-TASK-108
## Resolves Gaps: GAP-067, GAP-069
## Spec Reference: AUDIT_REPORT.md HIGH section

## Pre-flight: re-read current state

Before making any change, read the current state of every file listed in "Files to Modify" below. Verify the gap(s) addressed by this task are still present in the current code. Specifically:

- For each file in "Files to Modify": view the file and confirm the condition the audit observed (e.g., "no rate limiting on /api/ai") still applies.
- For each gap in "Resolves Gaps": confirm the gap remains open. The audit was conducted on 2026-05-04; if the codebase changed since, the gap may have been partially or fully addressed.
- If a gap is no longer present, report this finding in PROGRESS.md, mark this task as superseded, and stop. Do not make changes.
- If a gap is partially addressed, scope this task to the remaining work and document in this file's Session Notes what was already addressed and skipped.
- If the gap is still fully present as the audit described, proceed with the rest of this task.

This pre-flight catches the case where the codebase changed between audit and remediation — exactly the failure mode that produces silent overwrites of unrelated work.

## Files to Create

- `docs/architecture/A11Y_BASELINE.md` — WCAG 2.2 AA target documentation, scope, exclusions, SLA
- `lib/a11y.ts` — accessibility helpers (focus management utilities, sr-only class helper, prefers-reduced-motion check)

## Files to Modify

- `app/layout.tsx` (TASK-002) — add `<html lang="en">`, default focus-visible CSS, skip-to-main link
- `app/globals.css` (TASK-002) — `:focus-visible` outline ring (4.5:1 contrast against any bg per `lib/brand`), `prefers-reduced-motion: reduce` overrides for transitions/animations, sr-only class
- All button-like elements (Cd, B in `components/agent/Shared.tsx` — TASK-028) — verify `role="button"`, `tabindex="0"`, keyboard handler. NOTE: agent components are subject to verbatim-port directive — see ADR-003 for the path forward
- All form inputs (TA, Inp in TASK-028) — verify `<label>` association via htmlFor or wrapping
- `components/AuthGuard.tsx`, `AdminGuard.tsx` (TASK-010) — render `aria-live="polite"` redirect notice rather than blank page

## Scope of WCAG 2.2 AA target

**In scope (must conform at v1):**
- All landing/marketing pages: `/`, `/pricing`, `/demo`, `/help`, `/terms`, `/privacy`, `/contact`
- All auth flows: `/signin`, `/signup`, `/forgot`, `/account`, `/account/security`, `/account/delete`
- Account dashboard: `/account`
- Admin dashboard: `/admin/*` (admin users tend to be ourselves; nonetheless this is product, not internal)

**Out of scope at v1, deferred to v1.1 with explicit ADR (per OBS-003):**
- The 12-step agent (`/app` and its step components S0-S11) — verbatim-port directive currently blocks substantive accessibility refactor. ADR-003 recommends splitting Decision #11 to enable a11y work on agent components in v1.1.

**v1 commitment to users with disabilities:** the platform's marketing, sign-up, payment, and account management are AA-conformant. The agent itself has known accessibility gaps documented in `docs/architecture/A11Y_BASELINE.md` and on /accessibility-statement page (R-TASK-119 generates this).

## Per-screen requirements

For each in-scope screen:
1. Page has unique, descriptive `<title>` matching its purpose
2. Single `<h1>` per page; heading hierarchy doesn't skip levels
3. All interactive elements reachable by keyboard (Tab order matches visual order)
4. Focus visible at all times when tabbing (focus-visible ring, contrast ≥ 3:1 against any background)
5. All form inputs have associated `<label>` (visible or sr-only)
6. All images have alt text (decorative images: `alt=""`; meaningful: descriptive)
7. Color is not the only means of conveying information (covered by R-TASK-148 for genre map)
8. Errors are announced via `aria-live="polite"` regions
9. Modal dialogs (signup modal per TASK-046, deletion confirm per R-TASK-102) trap focus, restore focus on close, dismissable with Escape
10. Page tested with keyboard-only navigation; full task completable
11. Page tested with VoiceOver (macOS) or NVDA (Windows); content readable in logical order

## Key implementation patterns

### Skip-to-main link (`app/layout.tsx`)

```tsx
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-50 focus:bg-brand-midnight focus:text-brand-bone focus:px-4 focus:py-2 focus:rounded">
          Skip to main content
        </a>
        <main id="main">{children}</main>
      </body>
    </html>
  );
}
```

### Focus ring (`globals.css`)

```css
:focus-visible {
  outline: 2px solid var(--brand-gold-glow);
  outline-offset: 2px;
  border-radius: 4px;
}

.sr-only {
  position: absolute;
  width: 1px; height: 1px; padding: 0; margin: -1px;
  overflow: hidden; clip: rect(0, 0, 0, 0);
  white-space: nowrap; border: 0;
}

@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }
}
```

### Live regions for dynamic content

```tsx
// Agent step status — announce when AI generates content
<div role="status" aria-live="polite" aria-atomic="true" className="sr-only">
  {loading ? 'Generating content…' : `Generated ${wordCount} words`}
</div>
```

## Tests Required

- AT-110-1: All in-scope pages pass axe-core auto-check (R-TASK-130 wires this into tests)
- AT-110-2: Manual keyboard-only walk: signup → upgrade → account-settings → MFA enroll → signout completes
- AT-110-3: VoiceOver walk of /pricing reads all tier cards in logical order with prices announced
- AT-110-4: prefers-reduced-motion: reduce disables all transitions/animations
- AT-110-5: Modal dialog (deletion confirm from R-TASK-102) traps focus and restores on close
- AT-110-6: Skip-to-main link works from every page
- AT-110-7: Lighthouse Accessibility score ≥ 95 on /, /pricing, /signup, /signin, /account

## A11y issue SLA (also satisfies GAP-073)

Documented in `docs/architecture/A11Y_BASELINE.md`:
- **Severity 1 (blocks task completion for users with disability):** fix within 14 days
- **Severity 2 (significant inconvenience):** fix within 60 days
- **Severity 3 (minor):** fix in next quarterly release

## Session Notes
_(Filled by Claude Code during implementation)_
