<!-- APPLY: REPLACE -->
<!-- Target: docs/TASKS/TASK-061-mobile-responsive.md (in original mybsn package) -->
<!-- Backup: docs/EXPANDED-TASKS/backups/TASK-061-mobile-responsive.pre-expansion-backup.md -->
<!-- Expanded 2026-05-06 from 98 words to ~970 words via PATCH-3 sub-deliverable B.3. -->

# TASK-061: Mobile Responsiveness

## Status: NOT STARTED
## Priority: HIGH
## Phase: 9
## Estimated Sessions: 2
## Dependencies: TASK-002, all UI tasks
## Requirements Covered: R34
## Spec Reference: Section 9.4

## Inference Summary

This expanded task replaces the original 98-word TASK-061. Each addition is sourced as follows:

| Addition | Source |
|---|---|
| Tailwind default breakpoints (sm 640, md 768, lg 1024, xl 1280, 2xl 1536) | Q-9.1 operator-answer (use default) |
| Per-page treatment matrix | Q-9.2 operator-answer (use default) |
| Agent: block screen with redirect message below 1024px | Q-9.3 operator-answer (use default — option a) |
| Hamburger drawer mobile nav | Q-9.4 operator-answer (use default) |
| 44x44pt touch target minimum (WCAG 2.5.5 AAA / 2.2 AA via expanded touch areas) | Q-9.5 confirmed; R-TASK-110 a11y baseline |
| `prefers-reduced-motion` for drawer animation | R-TASK-110 |
| Brand tokens for mobile-specific styling | TASK-002 + Q-1.6 (Tailwind) |

Operator confirmed all questions on 2026-05-06.

## Pre-flight: re-read current state

- Open `/`, `/pricing`, `/tour`, `/signup`, `/account`, `/app/[bookId]` (with a test book), `/admin` in mobile viewport (375px) before making any change. Document which pages already work, which break.
- View `app/layout.tsx` to confirm the global header/nav structure.
- Confirm R-TASK-110 (a11y baseline) has shipped — touch-target sizing relies on it.
- Confirm TASK-002 brand tokens are in place for mobile typography step-down.

## Files to Create/Modify

- `components/Header.tsx` (modify; add mobile drawer)
- `components/MobileNav.tsx` (NEW; the drawer component)
- `components/MobileBlockingMessage.tsx` (NEW; shown to mobile visitors of /app and /admin)
- `app/(app)/layout.tsx` (modify; render MobileBlockingMessage if viewport < 1024px)
- `app/admin/layout.tsx` (modify; same)
- `app/page.tsx`, `app/pricing/page.tsx`, `app/tour/page.tsx`, `app/(auth)/signin/page.tsx`, `app/(auth)/signup/page.tsx`, `app/account/page.tsx` (modify; verify per-page treatment matrix below)

## Implementation Requirements

### Per-page treatment matrix (Q-9.2 default)

| Page | < 640 (sm) | 640-767 (md) | 768-1023 (lg) | 1024+ |
|---|---|---|---|---|
| `/` landing | single column, hero CTA full-width, footer stacks | same | 2-column hero, 3-up features | full design |
| `/pricing` | single-column tier cards, full-width | single-column | 2-column | 3-column tier cards |
| `/tour` | full-width steps, dot navigation, no side panel | same | step + side description | full tour layout |
| `/signin`, `/signup`, `/forgot-password` | single column form, full-width fields | same | centered card 480px | centered card 480px |
| `/account` | stacked sections, no sidebar | same | 2-column with sidebar | full layout with sidebar |
| `/app/[bookId]` (agent) | **BLOCKED — see below** | BLOCKED | BLOCKED | full agent UI |
| `/admin` | **BLOCKED — see below** | BLOCKED | BLOCKED | full admin dashboard |
| `/admin/audit` | BLOCKED | BLOCKED | BLOCKED | full audit log table |

### Agent and admin: blocking message (Q-9.3 = (a))

`/app/[bookId]` and `/admin` (and sub-routes) detect viewport < 1024px and render the blocking message instead of the full UI. Use a server-component-friendly check via `User-Agent` header for initial render, plus a client-side `window.matchMedia('(min-width: 1024px)')` check that re-evaluates on resize.

```tsx
// components/MobileBlockingMessage.tsx
export default function MobileBlockingMessage({ destination }: { destination: 'app' | 'admin' }) {
  return (
    <div className="min-h-screen flex items-center justify-center p-8 bg-brand-navy">
      <div className="max-w-md text-center text-brand-white">
        <h1 className="text-h2 mb-4">Best on desktop</h1>
        <p className="mb-6">
          {destination === 'app'
            ? 'My Best Selling Novel works best on a desktop or laptop. The writing tools need room to breathe.'
            : 'The admin dashboard requires a desktop screen for the data tables and charts.'}
        </p>
        <a href="/account" className="inline-block px-6 py-3 bg-brand-gold text-brand-navy rounded font-semibold hover:bg-brand-goldDim">
          Continue to your account
        </a>
      </div>
    </div>
  );
}
```

This is option (a) from Q-9.3 — block screen with redirect path. Read-only mode (option b) is rejected because the agent is editing-heavy and read-only is confusing. Per ADR-003, the agent's prompts are frozen but the wrapper UX (this blocking message lives outside the 1,917-line agent JSX) is modernizable.

### Mobile navigation drawer (Q-9.4 default)

`<Header>` renders the desktop nav inline at lg+. Below lg, it renders a hamburger button (44x44pt touch target). Click → slides in `<MobileNav>` from the right.

```tsx
// components/MobileNav.tsx
'use client';
import { useState, useEffect } from 'react';
export default function MobileNav() {
  const [open, setOpen] = useState(false);
  // Close on route change
  // Close on backdrop click
  // ESC closes drawer
  return (
    <>
      <button
        aria-label="Open menu"
        className="lg:hidden p-3 min-w-[44px] min-h-[44px]"
        onClick={() => setOpen(true)}
      >
        <HamburgerIcon className="w-6 h-6" />
      </button>
      {open && (
        <>
          <div
            className="fixed inset-0 bg-black/50 z-40 lg:hidden"
            onClick={() => setOpen(false)}
            aria-hidden
          />
          <nav
            role="dialog"
            aria-label="Main navigation"
            className="fixed top-0 right-0 bottom-0 w-80 max-w-full bg-brand-navyLight z-50 p-6 overflow-y-auto motion-safe:animate-slideInRight"
          >
            {/* Close button + nav links */}
          </nav>
        </>
      )}
    </>
  );
}
```

Animation `slideInRight` defined in `tailwind.config.ts` keyframes; respects `prefers-reduced-motion` per the global `@media` rule from TASK-002.

### Touch targets (Q-9.5 confirmed)

All interactive elements meet **44x44pt minimum** on mobile breakpoints (per WCAG 2.5.5 AAA, also referenced by Apple HIG and Material Design). Use Tailwind utility `min-w-[44px] min-h-[44px]` on every button, link, checkbox, and form control. Where the visual element is smaller (e.g., a 24x24px icon), expand the clickable area via padding or pseudo-elements:

```tsx
<button className="relative p-3 min-w-[44px] min-h-[44px] before:absolute before:inset-0">
  <Icon className="w-6 h-6 mx-auto" />
</button>
```

Mechanical check: `lint:contrast` (R-TASK-109) is augmented with a touch-target lint that flags any `<button>`, `<a>`, or `<input>` not meeting the minimum.

### Mobile typography step-down

Already shipped in TASK-002 via the `@media (max-width: 768px)` block in `app/globals.css`. This task verifies the step-down is in effect on every page (not just verifies it exists) — visual QA pass on /, /pricing, /tour, /signup, /signin, /account in 375px and 768px viewports.

### What this task does NOT do

- Does NOT redesign the agent's internal UX — ADR-003 freezes the agent's prompts. The blocking message wraps the agent at the layout level.
- Does NOT add tablet-specific layouts beyond the breakpoint matrix above; if tablet UX needs more nuance, file a follow-up.
- Does NOT include mobile-only features (e.g., camera-based manuscript scanning); those are out of scope for v1.

## Tests Required

- AT-110: Visual QA pass: each page in the matrix renders correctly at 375px, 640px, 768px, 1024px, 1440px viewports
- AT-111: `/app/[bookId]` at viewport <1024px renders MobileBlockingMessage with destination="app"
- AT-112: `/admin` at viewport <1024px renders MobileBlockingMessage with destination="admin"
- AT-113: Mobile nav drawer opens on hamburger click, closes on backdrop click, closes on ESC
- AT-114: Mechanical: every interactive element on /signup at 375px viewport has computed `width >= 44px && height >= 44px`
- AT-115: `prefers-reduced-motion: reduce` disables drawer slide-in animation (drawer just appears/disappears)
- AT-116: Mobile body text is 16px on /, /pricing, /signup; verify in DevTools

## Session Notes
_(Filled by Claude Code during implementation)_
