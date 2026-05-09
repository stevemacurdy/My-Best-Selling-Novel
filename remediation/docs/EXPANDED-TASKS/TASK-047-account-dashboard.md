<!-- APPLY: REPLACE -->
<!-- Target: docs/TASKS/TASK-047-account-dashboard.md (in original mybsn package) -->
<!-- Backup: docs/EXPANDED-TASKS/backups/TASK-047-account-dashboard.pre-expansion-backup.md -->
<!-- Expanded 2026-05-09 from 102 words to ~1080 words via PATCH-3 sub-deliverable B.3.
     A.3 cascade applied — lifetime tier badge eliminated; subscription_status enum drops 'lifetime'. -->

# TASK-047: Account Dashboard (`app/account/page.tsx`)

## Status: NOT STARTED
## Priority: HIGH
## Phase: 6
## Estimated Sessions: 2
## Dependencies: TASK-002, TASK-006 (verifyToken), TASK-010 (auth-guards), TASK-016 (subscription-logic), TASK-023 (Stripe portal), R-TASK-119 (refunds)
## Requirements Covered: R12, R32
## Spec Reference: Section 6.5

## Inference Summary

| Addition | Source |
|---|---|
| Tier badge color-coded text-only; crown icon for Publisher | Q-6.19 operator-answer (use default); A.3 cascade (no lifetime tier badge) |
| Subscription status display per status (active/past_due/cancelled/free) | Q-6.20 operator-answer (use default); TASK-016 enum |
| AI calls bar chart with brand-warning at ≥80%, brand-error at 100% | Q-6.21 operator-answer (use default) |
| Book count format per tier (Explorer "1/1 — upgrade for unlimited"; paid "3 books") | Q-6.22 operator-answer (use default) |
| Stripe portal button: "Manage Subscription" | Q-6.23 operator-answer (use default) |
| Lifetime status removed from rendering matrix | A.3 cascade |

Operator confirmed all questions on 2026-05-08.

## Pre-flight: re-read current state

- View `app/account/page.tsx` if present.
- Confirm TASK-010 `<AuthGuard>` is in place — wraps the account section.
- Confirm `lib/subscription.ts` (TASK-016) exposes the helper for tier limits + current usage.
- Confirm TASK-023 `/api/stripe/portal` is in place — Manage Subscription button POSTs here.
- Verify `subscription_status` values that ship in v1: `'active' | 'past_due' | 'cancelled' | 'free'`. `'lifetime'` was eliminated 2026-05-06 (A.3); ensure no stale references in profile or subscription tables.

## Files to Create/Modify

- `app/account/page.tsx` — server component (auth-guarded)
- `app/account/billing/page.tsx` — billing-specific section (linked from main account page; same data, more focused view)
- `components/account/TierBadge.tsx` — reusable tier badge
- `components/account/AICallsUsageBar.tsx` — usage bar with thresholds
- `components/account/SubscriptionStatusBlock.tsx` — status copy + CTAs per status

## Implementation Requirements

### Page structure

Top of page:
- Greeting: "Welcome back, [first name]" (or just "Welcome back" if name absent)
- Right-anchored: tier badge + subscription status pill

Three main blocks below:

**1. Subscription block:**
- Tier badge (large)
- Status copy + appropriate CTA per Q-6.20 status matrix:
  - `active`: "Active — renews [Jan 15, 2027]" + "Manage Subscription" button → `/api/stripe/portal`
  - `past_due`: brand-warning banner: "Payment failed. [Update billing]" + Stripe portal CTA
  - `cancelled`: brand-textMuted: "Cancellation scheduled — access until [Jan 15, 2027]" + "Resume subscription" button (calls Stripe portal which has resume flow)
  - `free` (Explorer): "Explorer tier — [Upgrade to Author]" link to `/pricing`
- Refund-window awareness: if user is within 14 days of subscribe, surface a small line: "Within your 14-day money-back window. [Read refund policy](/refunds)" — cross-bind to R-TASK-119

**2. Usage block:**
- AI calls used / limit per Q-6.21:
  ```
  AI calls this month
  [progress bar]
  5 / 25 calls used
  ```
  Bar fill: brand-gold at <80%; brand-warning at 80–99%; brand-error at 100%.
  At 100%: surface upgrade CTA inline: "Upgrade to Author for 500/month"
- Book count per Q-6.22:
  - Explorer: `1 / 1 book` (or `1 / 1 — upgrade for unlimited` if at limit)
  - Author / Publisher: `3 books`
  - Click-through to `/app` (book library)

**3. Account info block:**
- Email (read-only display; managed via Supabase Auth — link to settings if email change supported in v1)
- Full name (editable inline; PUT to profiles table)
- Member since (created_at date, brand-textMuted)
- Sign out button (secondary; full-width on mobile)

### `<TierBadge>` component (Q-6.19)

```tsx
interface TierBadgeProps {
  tier: 'explorer' | 'author' | 'publisher';
  size?: 'sm' | 'md' | 'lg';
}

export function TierBadge({ tier, size = 'md' }: TierBadgeProps) {
  if (tier === 'explorer') {
    return <span className="text-brand-textMuted text-sm">Explorer</span>;
  }
  if (tier === 'author') {
    return <span className="text-brand-gold font-medium">Author</span>;
  }
  // Publisher: gold + crown icon (small visual lift)
  return (
    <span className="text-brand-gold font-medium inline-flex items-center gap-1">
      <CrownIcon className="w-4 h-4" />
      Publisher
    </span>
  );
}
```

No 'lifetime' case — eliminated A.3.

### `<AICallsUsageBar>` (Q-6.21)

```tsx
interface UsageBarProps { used: number; limit: number; }

export function AICallsUsageBar({ used, limit }: UsageBarProps) {
  const pct = Math.min(100, (used / limit) * 100);
  const colorClass =
    pct >= 100 ? 'bg-brand-error' :
    pct >= 80 ? 'bg-brand-warning' :
    'bg-brand-gold';

  return (
    <div>
      <div className="text-sm text-brand-textMuted mb-2">AI calls this month</div>
      <div className="h-3 bg-brand-navyLight rounded">
        <div className={`h-full ${colorClass} rounded transition-all`} style={{ width: `${pct}%` }} />
      </div>
      <div className="mt-2 text-sm text-brand-white">
        {used} / {limit} calls used
        {pct >= 100 && <UpgradeCTA tier="author" />}
      </div>
    </div>
  );
}
```

### `<SubscriptionStatusBlock>` (Q-6.20)

Renders the appropriate copy + CTA per status. Centralizes the matrix so it stays consistent with TASK-016 enum changes.

### Manage Subscription button (Q-6.23)

Button copy: "Manage Subscription" (per Q-6.23 default — most user-friendly). Click → POST `/api/stripe/portal` (TASK-023) → redirect to Stripe-hosted portal.

If user has no `stripe_customer_id` (Explorer who never paid), the button is replaced with "Upgrade to Author" → `/pricing`.

### Auth gate

Page wrapped with `<AuthGuard>` from TASK-010. Unauthenticated visitors redirected to `/signin?returnTo=/account`.

### Mobile

- Three blocks stack single-column
- Tier badge moves below greeting (no right-anchoring)
- "Manage Subscription" button full-width
- Usage bar uses full available width

### Brand styling

- Page background `bg-brand-navy`
- Block cards: `bg-brand-navyLight rounded-lg p-6 my-4`
- Headings in Crimson Pro
- Labels in brand-textMuted; values in brand-white
- Past_due banner: `bg-brand-warning/10 border-l-4 border-brand-warning p-4 rounded`

### SEO

- Page title: "Account — My Best Selling Novel"
- Meta description: standard "Account dashboard" — auth-gated, less SEO-critical
- `noindex` meta tag (this is private user data)

### Analytics (Q-9.2 cross-bind)

- `account_dashboard_view` on load
- `manage_subscription_click` on CTA
- `upgrade_inline_click` when AI-calls 100% triggers inline upgrade CTA

## What this task does NOT do

- Does NOT process subscription changes — Stripe portal handles
- Does NOT show admin metrics — that's `/admin` (TASK-052)
- Does NOT support email change in v1 (Supabase Auth requires confirmation flow; defer to v1.1 unless operator requests)
- Does NOT show book detail — `/app/[bookId]` handles that

## Tests Required

- AT-197: `/account` redirects unauthenticated user to `/signin?returnTo=/account`
- AT-198: Authenticated Author tier user sees Author tier badge + active status + 500 AI call limit + unlimited books indicator
- AT-199: Explorer at limit (25/25 AI calls) sees brand-error bar fill + inline upgrade CTA
- AT-200: Past_due user sees warning banner with Stripe portal CTA
- AT-201: Cancelled user sees "access until [date]" copy + Resume option
- AT-202: Free user (no Stripe customer) sees "Upgrade to Author" instead of "Manage Subscription"
- AT-203: Mechanical: zero occurrences of `subscription_status === 'lifetime'` or `tier === 'lifetime'` in this page or its components
- AT-204: Within-14-day refund window: refund-policy link surfaces inline
- AT-205: Mobile: blocks stack; CTAs full-width
- AT-206: Page has `noindex` meta tag

## Session Notes
_(Filled by Claude Code during implementation)_
