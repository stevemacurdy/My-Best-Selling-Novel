<!-- APPLY: REPLACE -->
<!-- Target: docs/TASKS/TASK-060-loading-states.md (in original mybsn package) -->
<!-- Backup: docs/EXPANDED-TASKS/backups/TASK-060-loading-states.pre-expansion-backup.md -->
<!-- Expanded 2026-05-09 from 88 words to ~750 words via PATCH-3 sub-deliverable B.3. -->

# TASK-060: Loading States (`components/Spin.tsx` + page-specific skeletons)

## Status: NOT STARTED
## Priority: MEDIUM
## Phase: 9
## Estimated Sessions: 1
## Dependencies: TASK-002, TASK-010 (`<Skeleton>` already exists from auth-guards)
## Requirements Covered: R29
## Spec Reference: Section 9.3

## Inference Summary

| Addition | Source |
|---|---|
| Generic `<Spin />` for short waits + page-specific skeletons for longer waits | Q-9.10 operator-answer (use default — both) |
| Pages requiring loading states: library, agent, admin, account, pricing during checkout, help on first SSR | Q-9.11 operator-answer (use default + additions) |
| Decision rule: spinner if <500ms or layout unknown; skeleton if ≥500ms AND layout known | Q-9.12 operator-answer (use default) |

Operator confirmed all questions on 2026-05-08.

## Pre-flight: re-read current state

- Confirm TASK-010 has shipped — `<Skeleton>` component exists from auth-guards work.
- View existing loading UX in `app/(app)/loading.tsx`, `app/admin/loading.tsx`, etc. Next.js 14 supports per-route `loading.tsx` files; complement the in-component approach.

## Files to Create/Modify

- `components/Spin.tsx` (NEW) — generic spinner
- `components/skeletons/BookListSkeleton.tsx` (NEW) — matches book-library list shape
- `components/skeletons/ChapterContentSkeleton.tsx` (NEW) — chapter prose placeholder
- `components/skeletons/AdminMetricsSkeleton.tsx` (NEW) — admin dashboard charts placeholder
- `components/skeletons/AccountSkeleton.tsx` (NEW) — account dashboard blocks placeholder
- `app/(app)/loading.tsx` (MODIFY) — uses BookListSkeleton + ChapterContentSkeleton
- `app/admin/loading.tsx` (MODIFY) — uses AdminMetricsSkeleton
- `app/account/loading.tsx` (MODIFY) — uses AccountSkeleton

## Implementation Requirements

### `<Spin />` component

```tsx
import { cn } from '@/lib/utils';

interface SpinProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  ariaLabel?: string;
}

export function Spin({ size = 'md', className, ariaLabel = 'Loading' }: SpinProps) {
  const sizeClass = { sm: 'w-4 h-4', md: 'w-6 h-6', lg: 'w-8 h-8' }[size];
  return (
    <span
      role="status"
      aria-label={ariaLabel}
      className={cn(
        sizeClass,
        'inline-block border-2 border-brand-gold border-t-transparent rounded-full animate-spin motion-reduce:animate-none',
        className
      )}
    />
  );
}
```

CSS-only animation (no library). `motion-reduce:animate-none` respects `prefers-reduced-motion` (R-TASK-110). Color: brand-gold per `lib/brand.ts`.

### Skeleton design rule (Q-9.12)

The decision matrix for which loading UX to use:

| Expected duration | Layout known? | UI |
|---|---|---|
| <500ms | any | `<Spin />` inline at the action point |
| ≥500ms | yes | Skeleton matching the eventual rendered shape |
| ≥500ms | no | `<Spin />` centered in the loading container |

Examples:
- Pricing page → Stripe Checkout button click: `<Spin />` inline in button (button text replaced; <500ms typical)
- `/app` book library load: `<BookListSkeleton />` (≥500ms typical for first SSR; layout known: list of book cards)
- Chapter content load when navigating between books: `<ChapterContentSkeleton />` (≥500ms; layout known: prose with title)
- AI generation in agent S6: `<Spin />` inline near the generate button (latency is the UX — streaming response renders progressively per PATCH-001)
- Help page tutorial render: only on cold first SSR; `<Spin />` (the markdown render is fast; layout depends on TOC extraction)

### Page-specific skeletons

**`<BookListSkeleton />`** — renders 3-5 placeholder book cards with brand-navyLight backgrounds and animated shimmer:
```tsx
export function BookListSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-8">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="bg-brand-navyLight rounded-lg p-6 animate-pulse motion-reduce:animate-none">
          <div className="h-6 bg-brand-navy rounded w-3/4 mb-3" />
          <div className="h-4 bg-brand-navy rounded w-1/2 mb-2" />
          <div className="h-4 bg-brand-navy rounded w-full" />
        </div>
      ))}
    </div>
  );
}
```

**`<ChapterContentSkeleton />`** — heading bar + 8-12 paragraph-shaped lines, mimicking long-form prose layout.

**`<AdminMetricsSkeleton />`** — 4 stat-card placeholders + chart placeholder + top-users-table placeholder.

**`<AccountSkeleton />`** — 3 block placeholders matching subscription/usage/info blocks from TASK-047.

### Pages requiring loading states (Q-9.11 confirmed + additions)

Per Q-9.11 default plus additions:
- ☑ `/app` book library — BookListSkeleton
- ☑ `/app/[bookId]` chapter content — ChapterContentSkeleton during data fetch
- ☑ `/admin` dashboard — AdminMetricsSkeleton
- ☑ `/account` dashboard — AccountSkeleton
- ☑ Pricing page Checkout button click — inline `<Spin />` in button label
- ☑ Help page first SSR — `<Spin />` (rare; cold-cache only)

Public marketing pages (/, /sample-chapter, /genres, /about, /press, /publish/*, etc.) generally do NOT need explicit loading states — they're statically generated and render instantly. If any specific page needs interactivity-driven loading (rare in v1), add inline `<Spin />` at the action point.

### Brand styling

- Spin: brand-gold border, animate-spin
- Skeletons: brand-navyLight on brand-navy, `animate-pulse motion-reduce:animate-none`
- All skeletons centered in container with sensible max-widths matching final content

### Accessibility

- `<Spin>` has `role="status"` + `aria-label` so screen readers announce loading
- Skeletons are decorative (no interactive role); the parent's `aria-busy="true"` is set by the parent during loading
- `prefers-reduced-motion` respected via `motion-reduce:animate-none` Tailwind class

## What this task does NOT do

- Does NOT include progress bars (used only in tour per TASK-044, scoped there)
- Does NOT include skeleton libraries (e.g., `react-loading-skeleton`) — pure Tailwind primitives
- Does NOT add loading states to public marketing pages (statically generated; not needed)

## Tests Required

- AT-259: `<Spin />` renders with `role="status"` and brand-gold styling
- AT-260: `<Spin />` does NOT animate when user has `prefers-reduced-motion: reduce`
- AT-261: BookListSkeleton renders 6 placeholder cards in grid
- AT-262: `/app` initial load shows BookListSkeleton, then content
- AT-263: `/admin` initial load shows AdminMetricsSkeleton, then content
- AT-264: Pricing Checkout button shows inline `<Spin />` between click and Stripe redirect
- AT-265: Mechanical: skeleton classNames include `motion-reduce:animate-none`
- AT-266: Public marketing pages do NOT mount any loading components (verify by inspecting `/`, `/pricing`, `/about`)

## Session Notes
_(Filled by Claude Code during implementation)_
