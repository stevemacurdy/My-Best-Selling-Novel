<!-- APPLY: REPLACE -->
<!-- Target: docs/TASKS/TASK-059-error-boundaries.md (in original mybsn package) -->
<!-- Backup: docs/EXPANDED-TASKS/backups/TASK-059-error-boundaries.pre-expansion-backup.md -->
<!-- Expanded 2026-05-09 from 87 words to ~810 words via PATCH-3 sub-deliverable B.3. -->

# TASK-059: Error Boundaries (`components/ErrorBoundary.tsx` + layout wraps)

## Status: NOT STARTED
## Priority: HIGH
## Phase: 9
## Estimated Sessions: 1
## Dependencies: TASK-002, R-TASK-106 (Sentry integration)
## Requirements Covered: R28
## Spec Reference: Section 9.2

## Inference Summary

| Addition | Source |
|---|---|
| Wrap top-level layouts: `(app)`, `(auth)`, `admin`, `account`, `demo`; plus `AgentShell` | Q-9.6 operator-answer (use default) |
| Generic copy with optional `context` prop for branded variants | Q-9.7 operator-answer (use default) |
| Sentry capture with `errorInfo.componentStack` as extras | Q-9.8 operator-answer (use default) |
| Reset = full page reload via `window.location.reload()` | Q-9.9 operator-answer (use default) |

Operator confirmed all questions on 2026-05-08.

## Pre-flight: re-read current state

- Confirm R-TASK-106 (Sentry integration) has shipped — `lib/sentry.ts` exposes `captureException`.
- View `app/(app)/layout.tsx`, `app/(auth)/layout.tsx`, `app/admin/layout.tsx`, `app/account/layout.tsx`, `app/demo/page.tsx` — these are the wrap points.
- Confirm `AgentShell` component path (typically `components/agent/AgentShell.tsx`).
- Public marketing pages (/, /pricing, /terms, etc.) are NOT wrapped per Q-9.6 default — minimal JS, low crash risk; React's default error UX is acceptable for those.

## Files to Create/Modify

- `components/ErrorBoundary.tsx` (NEW) — class-based error boundary with Sentry capture
- `components/ErrorFallback.tsx` (NEW) — branded error UI rendered when boundary trips
- `app/(app)/layout.tsx` (MODIFY) — wrap children with `<ErrorBoundary context="app">`
- `app/(auth)/layout.tsx` (MODIFY) — wrap with `<ErrorBoundary context="auth">`
- `app/admin/layout.tsx` (MODIFY) — wrap with `<ErrorBoundary context="admin">`
- `app/account/layout.tsx` (MODIFY) — wrap with `<ErrorBoundary context="account">`
- `app/demo/page.tsx` (MODIFY) — wrap with `<ErrorBoundary context="demo">` if not already in a layout
- `components/agent/AgentShell.tsx` (MODIFY) — wrap inner content with `<ErrorBoundary context="agent">`

## Implementation Requirements

### `<ErrorBoundary />` component

Class component (React error boundaries currently require class API; use of hook-based boundaries requires libraries like `react-error-boundary` which is also acceptable but adds a dep — class is simpler for v1).

```tsx
'use client';
import React from 'react';
import { captureException } from '@/lib/sentry';
import { ErrorFallback } from './ErrorFallback';

interface Props {
  children: React.ReactNode;
  context?: 'app' | 'auth' | 'admin' | 'account' | 'demo' | 'agent';
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends React.Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Q-9.8 — Sentry capture with errorInfo extras
    captureException(error, {
      tags: { boundary: this.props.context ?? 'unknown' },
      extra: {
        componentStack: errorInfo.componentStack,
        boundary_context: this.props.context,
      },
    });
  }

  handleReset = () => {
    // Q-9.9 — full page reload
    if (typeof window !== 'undefined') {
      window.location.reload();
    }
  };

  render() {
    if (this.state.hasError) {
      return <ErrorFallback context={this.props.context} onReset={this.handleReset} />;
    }
    return this.props.children;
  }
}
```

### `<ErrorFallback />` component

```tsx
interface FallbackProps {
  context?: 'app' | 'auth' | 'admin' | 'account' | 'demo' | 'agent';
  onReset: () => void;
}

const CONTEXT_COPY: Record<string, string> = {
  app: 'Something went wrong while loading the app.',
  auth: 'Something went wrong while loading the sign-in page.',
  admin: 'Something went wrong while loading the admin dashboard.',
  account: 'Something went wrong while loading your account.',
  demo: 'Something went wrong while loading the tour.',
  agent: 'Something went wrong while loading the writing agent.',
};

export function ErrorFallback({ context, onReset }: FallbackProps) {
  const message = (context && CONTEXT_COPY[context]) ?? 'Something went wrong.';
  return (
    <div className="min-h-[400px] flex items-center justify-center p-8">
      <div className="text-center max-w-md">
        <h2 className="text-h2 text-brand-white mb-4">{message}</h2>
        <p className="text-brand-textMuted mb-6">
          We've logged the error and we'll look into it. In the meantime, try reloading.
        </p>
        <button
          onClick={onReset}
          className="bg-brand-gold text-brand-navy px-6 py-3 rounded font-medium hover:bg-brand-goldDim"
        >
          Reload
        </button>
      </div>
    </div>
  );
}
```

Per Q-9.7 default — generic copy with context-prop variants; per Q-9.9 — Reload button calls `window.location.reload()` (resets the boundary's error state by re-mounting the entire app fresh).

### Wrap points

Each layout/component receives `<ErrorBoundary context="...">`:

```tsx
// app/(app)/layout.tsx
import { ErrorBoundary } from '@/components/ErrorBoundary';

export default function AppLayout({ children }) {
  return (
    <ErrorBoundary context="app">
      {/* AuthGuard, header, etc. */}
      {children}
    </ErrorBoundary>
  );
}
```

The agent boundary wraps `<AgentShell>`'s inner content (not the shell itself, so even if the shell crashes the wrapping layout's boundary catches). Defense in depth: nested boundaries fire from innermost to outermost.

### Public marketing pages — not wrapped

Per Q-9.6 default, the public marketing pages (`/`, `/pricing`, legal pages, content cluster pages) are NOT wrapped in custom boundaries. Reasons:
- Minimal client JS — most are server-rendered prose
- Low crash risk — no complex state or third-party API calls
- React's default error UX (server error surfaced as 500 page via `app/error.tsx`) is acceptable for these surfaces
- Less code to maintain

If a marketing page does add complex client interactivity in v1.1 (e.g., interactive demo widget on `/sample-chapter`), wrap that specific component.

### Sentry integration

`captureException` called with:
- `tags.boundary` = the context prop (lets Sentry filter errors by which boundary fired)
- `extra.componentStack` = React's component stack for the error
- `extra.boundary_context` = duplicate of the tag for searchability

R-TASK-128 alerting can route boundary trips to operator alerts based on context (admin boundary fires = high priority; demo boundary fires = lower priority).

### Brand styling

`<ErrorFallback>` uses the brand-aligned styling per `lib/brand.ts`:
- `bg-brand-navy` background (inherits from layout)
- Heading in Crimson Pro
- Reload button: brand-gold filled
- Centered, max-w-md container

### Accessibility

- Heading is `<h2>` (top-level page heading is gone when boundary fires; h2 maintains hierarchy)
- Button has visible focus ring
- ARIA `role="alert"` on the wrapper div so screen readers announce immediately

## What this task does NOT do

- Does NOT replace React's default `error.tsx` route-level error handling — that complements boundaries
- Does NOT include retry-without-reload — Q-9.9 explicitly chose full reload
- Does NOT preserve form state across boundary trips (R-TASK-144 soft-delete UX may add unsaved-work guards in Phase 11)

## Tests Required

- AT-251: Throwing an error inside a boundary's children triggers the fallback UI
- AT-252: Clicking Reload calls `window.location.reload()`
- AT-253: Sentry receives the exception with `boundary` tag matching context
- AT-254: Sentry extras include `componentStack`
- AT-255: Each wrap point shows the correct context-specific copy when its boundary trips
- AT-256: Public marketing pages render React's default error UX (not the custom fallback) when an error occurs
- AT-257: Boundary fallback respects `prefers-reduced-motion` (no transition animations on the fallback render)
- AT-258: ARIA `role="alert"` triggers screen reader announcement

## Session Notes
_(Filled by Claude Code during implementation)_
