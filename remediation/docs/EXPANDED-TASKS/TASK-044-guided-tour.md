<!-- APPLY: REPLACE -->
<!-- Target: docs/TASKS/TASK-044-guided-tour.md (in original mybsn package) -->
<!-- Backup: docs/EXPANDED-TASKS/backups/TASK-044-guided-tour.pre-expansion-backup.md -->
<!-- Expanded 2026-05-08 from 105 words to ~960 words via PATCH-3 sub-deliverable B.3. -->

# TASK-044: Guided Tour Page (`app/tour/page.tsx`)

## Status: NOT STARTED
## Priority: HIGH
## Phase: 6
## Estimated Sessions: 2
## Dependencies: TASK-002, TASK-007, TASK-046 (signup modal final-stop CTA), R-TASK-173 (`/how-it-works` referrers)
## Requirements Covered: R12, R30
## Spec Reference: Section 6.2

## Inference Summary

| Addition | Source |
|---|---|
| Tour copy verbatim from `bestseller_demo.jsx` source | Q-6.7 operator-answer (use default — audit verdict "complete and accurate") |
| Keep 3 interactive demos (GenreDemo, UploadDemo, AvoidDemo); 11 description-only stops | Q-6.8 operator-answer (use default — audit verdict; deeper interactivity is overengineering for v1) |
| **Final stop CTA "Start Chapter One →" mirroring hero/footer** | Q-6.9 + cascade decision 2026-05-08 |
| Persistent site header visible during tour | Q-6.10 operator-answer (use default — sticky header lets users sign up at any point) |
| Progress bar (top, horizontal) + clickable dots (bottom) | Q-6.11 operator-answer (use default — keep both navigation affordances) |
| GA event `tour_complete` on stop 14 reach | Q-6.9 + Q-9.2 taxonomy |
| GA event `tour_complete_to_signup` on final-stop CTA click | Q-6.9 + Q-9.2 taxonomy |
| Public route, no auth | TASK-007 public-routes whitelist |
| Cross-binds with R-TASK-173 `/how-it-works` (entry point referrers) | Q-E operator-answer (two pages, linked) |

Operator confirmed all questions on 2026-05-08.

## Pre-flight: re-read current state

- View `bestseller_demo.jsx` (the audit's source artifact). Tour content lives there. **Per ADR-003 verbatim port for agent code, but the tour is a marketing surface — not agent code, so it's modernizable.** That said: operator confirmed Q-6.7 default ("use verbatim"), so don't rewrite copy unless explicitly asked.
- View `app/tour/page.tsx` if present.
- Confirm `/tour` in middleware public-routes whitelist (TASK-007).
- Confirm 3 interactive demo components exist or need creation: `<GenreDemo>`, `<UploadDemo>`, `<AvoidDemo>` (verify from demo source).

## Files to Create/Modify

- `app/tour/page.tsx` — main tour container, server component shell with client-state child
- `components/marketing/Tour.tsx` — client component managing current-stop state, progress bar, navigation
- `components/marketing/TourProgressBar.tsx` — horizontal bar at top
- `components/marketing/TourDotNav.tsx` — clickable dots at bottom
- `components/marketing/demos/GenreDemo.tsx` (port from `bestseller_demo.jsx`)
- `components/marketing/demos/UploadDemo.tsx` (port from `bestseller_demo.jsx`)
- `components/marketing/demos/AvoidDemo.tsx` (port from `bestseller_demo.jsx`)

## Implementation Requirements

### Tour structure

14 stops total. Each stop is a labeled section with copy from `bestseller_demo.jsx`. 3 stops include interactive demos; 11 are description-only. Per audit verdict: this ratio is correct — the 3 demos showcase the most differentiated capabilities; description-only stops are detailed enough to read like a feature tour without demanding interaction.

### Per-stop UX

```
[ Sticky header ] (always visible per Q-6.10)
[ Progress bar — fills proportionally as user advances 1/14 → 14/14 ]

[ Stop content area ]
  - Stop number + title (Crimson Pro h2)
  - Body copy (verbatim from demo source)
  - Demo if applicable (GenreDemo / UploadDemo / AvoidDemo)
  - "Next →" button (or "Start Chapter One →" on stop 14)

[ Dot navigation — 14 dots, clickable, current dot brand-gold filled ]
```

Stops with interactive demos (per audit / demo source — verify exact mapping):
- **Stop 4** (or wherever Genre Scanner is in source): `<GenreDemo />`
- **Stop 6** (Upload step): `<UploadDemo />`
- **Stop 9** (Avoid System / Plot logic): `<AvoidDemo />`

### Final stop (stop 14) CTA

Per operator cascade decision 2026-05-08: the final stop's CTA mirrors hero/footer:

```
[Stop 14 closing copy from demo source]

[Brand-gold filled button]
Start Chapter One →
```

CTA opens `<SignupModal>` (TASK-046) with `source="tour_complete"`. Fires GA events:
- `tour_complete` on stop 14 reach (with `duration_seconds` property — time elapsed since stop 1)
- `tour_complete_to_signup` on CTA click

### Progress bar (Q-6.11)

Horizontal at top of tour viewport, brand-gold fill on brand-navyLight track. Fills `(currentStop / 14) * 100%`. Smooth transition with `prefers-reduced-motion` respected (R-TASK-110).

### Dot navigation (Q-6.11)

14 small circles at bottom of viewport. Current dot: `bg-brand-gold ring-2 ring-brand-gold/40`. Inactive dots: `bg-brand-textMuted/40`. Click any dot to jump to that stop. Keyboard accessible (left/right arrows = previous/next; Home/End = first/last).

### Sticky header (Q-6.10)

The main site header (logo, navigation, "Start Chapter One →" CTA) stays visible at top of tour viewport. Operator decision: tour is immersive but not modal — users can sign up at any moment without losing tour progress.

### State management

`<Tour>` is a client component (`'use client'`). State shape:

```typescript
const [currentStop, setCurrentStop] = useState(1);
const [tourStartTime] = useState(() => Date.now());

const handleNext = () => { /* advance, fire GA on stop 14 */ };
const handlePrev = () => { /* go back */ };
const handleJumpTo = (n: number) => { /* via dot click */ };
```

Persist `currentStop` to `sessionStorage` (per browser-storage allowance in production code; not in artifact context per claude.ai). On reload mid-tour, restore stop. Clears when user closes tab.

### Cross-bind to /how-it-works

Per Q-E + R-TASK-173: `/how-it-works` step entries link to `/tour#step-{N}`. The Tour component reads the URL hash on mount and jumps to that stop:

```typescript
useEffect(() => {
  const hash = window.location.hash.replace('#step-', '');
  const stopNum = parseInt(hash, 10);
  if (Number.isInteger(stopNum) && stopNum >= 1 && stopNum <= 14) {
    setCurrentStop(stopNum);
  }
}, []);
```

This makes `/how-it-works` → click step 6 → land at `/tour#step-6` → tour starts at stop 6 instead of stop 1.

### SEO

- Page title: "Take the Tour — My Best Selling Novel"
- Meta description: "14-stop guided walkthrough of the My Best Selling Novel agent. See exactly how the 12 steps from outline to published novel work."
- OG image: tour-themed brand OG
- Schema.org `WebPage` with `breadcrumb` showing Home > Tour

### Brand styling

- Page background `bg-brand-navy`
- Stop content area centered, max-w-[760px]
- Body copy in 18/28 brand-white
- Heading in Crimson Pro per TASK-002 scale
- Buttons: brand-gold primary; brand-navyLight secondary (for "Previous")

### Mobile

- Progress bar full-width
- Dots wrap to 2 rows if needed (8 dots row 1 + 6 dots row 2)
- Demos stack content vertically; touch-friendly buttons
- Sticky header collapses to logo + hamburger; CTA visible in expanded menu

## What this task does NOT do

- Does NOT modify the agent itself (per ADR-003 verbatim port)
- Does NOT add new tour stops (the 14 from demo source are the canonical set)
- Does NOT change the 3 demo components' interactive behavior — port verbatim per demo source

## Tests Required

- AT-167 (renumbered for traceability): All 14 stops render with copy matching demo source
- AT-168: 3 interactive demos render and function (GenreDemo, UploadDemo, AvoidDemo)
- AT-169: Progress bar fills proportionally as user advances
- AT-170: Dot navigation: clicking any dot jumps to that stop
- AT-171: Keyboard navigation: left/right arrows = previous/next; Home/End = first/last
- AT-172: Stop 14 CTA opens signup modal with `source="tour_complete"`
- AT-173: GA `tour_complete` event fires when stop 14 reached, with `duration_seconds` property
- AT-174: GA `tour_complete_to_signup` event fires on final CTA click
- AT-175: `/tour#step-6` URL hash directly jumps to stop 6
- AT-176: Sticky header visible at all stops; signup CTA in header functional
- AT-177: Mobile breakpoints render without horizontal overflow
- AT-178: `/tour` in middleware public-routes whitelist

## Session Notes
_(Filled by Claude Code during implementation)_
