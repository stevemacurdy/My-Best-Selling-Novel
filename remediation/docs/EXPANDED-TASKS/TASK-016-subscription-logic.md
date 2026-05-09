<!-- APPLY: REPLACE -->
<!-- Target: docs/TASKS/TASK-016-subscription-logic.md (in original mybsn package) -->
<!-- Backup: docs/EXPANDED-TASKS/backups/TASK-016-subscription-logic.pre-expansion-backup.md -->
<!-- Expanded 2026-05-06 from 98 words to ~960 words via PATCH-3 sub-deliverable B.3.
     Significant content removed because lifetime tier was eliminated 2026-05-06 (PATCH-3 A.3); previously lifetime accounted for ~25% of this task's surface area. -->

# TASK-016: Subscription Tier & Limits Library (`lib/subscription.ts`)

## Status: NOT STARTED
## Priority: CRITICAL
## Phase: 3
## Estimated Sessions: 1
## Dependencies: TASK-015
## Requirements Covered: R5, R6
## Spec Reference: Section 3.4

## Inference Summary

This expanded task replaces the original 98-word TASK-016. Each addition is sourced as follows:

| Addition | Source |
|---|---|
| TIER_LIMITS exact shape (max_books, ai_calls_per_month, can_export, can_upload_audio, can_use_folder_upload, priority_queue) | Q-3.1 operator-answer (use default); ENGINEERING_DECISIONS Decision #5/#6/#7 (post-revision) |
| `team_seats: 0` for all tiers | Q-3.1 default; R-TASK-101 Path A LOCKED |
| `canPerform` action enum | Q-3.3 operator-answer (use default) |
| Status transition matrix | Q-3.4 operator-answer (use default); Stripe SaaS conventions; Decision #3 |
| **No lifetime tier** | A.3 lifetime elimination 2026-05-06 (Q-8.2); ADR-004 voided |
| Server-side enforcement only | Decision #17 |

Operator confirmed all questions on 2026-05-06.

## Pre-flight: re-read current state

- View `lib/subscription.ts` if present. The file may have been partially built; if so, verify it does NOT contain any `'lifetime'` status handling, any `isLifetime()` helper, or any reference to `NEXT_PUBLIC_LIFETIME_ENABLED`. All such code was removed by A.3 cascade. If found, report as a regression.
- View `migrations/015_subscriptions_usage.sql` (TASK-015) and confirm the `subscription_status` enum does NOT include `'lifetime'` (also removed by A.3).
- Confirm `lib/api-auth.ts` (TASK-006) is in place for caller-side use.

## Files to Create/Modify

- `lib/subscription.ts` (NEW)

## Implementation Requirements

### TIER_LIMITS constant (Q-3.1 default)

```typescript
// lib/subscription.ts

export type Tier = 'explorer' | 'author' | 'publisher';
export type SubscriptionStatus = 'free' | 'active' | 'past_due' | 'cancelled';

export interface TierLimits {
  max_books: number | 'unlimited';
  ai_calls_per_month: number;
  can_export: boolean;
  can_upload_audio: boolean;
  can_use_folder_upload: boolean;
  priority_queue: boolean;
  team_seats: number;  // always 0 in v1 per R-TASK-101 Path A
}

export const TIER_LIMITS: Record<Tier, TierLimits> = {
  explorer: {
    max_books: 1,
    ai_calls_per_month: 25,
    can_export: false,
    can_upload_audio: false,
    can_use_folder_upload: false,
    priority_queue: false,
    team_seats: 0,
  },
  author: {
    max_books: 'unlimited',
    ai_calls_per_month: 500,
    can_export: true,
    can_upload_audio: true,
    can_use_folder_upload: false,
    priority_queue: true,
    team_seats: 0,
  },
  publisher: {
    max_books: 'unlimited',
    ai_calls_per_month: 2_000,
    can_export: true,
    can_upload_audio: true,
    can_use_folder_upload: true,
    priority_queue: true,
    team_seats: 0,  // R-TASK-101 Path A: team seats deferred to v2
  },
};
```

### `canPerform` (Q-3.3 default)

```typescript
export type Action =
  | 'create_book'
  | 'ai_call'
  | 'export_pdf'
  | 'export_epub'
  | 'export_docx'
  | 'upload_audio'
  | 'folder_upload';

export interface UsageContext {
  tier: Tier;
  status: SubscriptionStatus;
  current_book_count: number;
  ai_calls_this_month: number;
}

export function canPerform(action: Action, ctx: UsageContext): { allowed: true } | { allowed: false; reason: string } {
  // 1. Status check — past_due and cancelled get reduced surface
  if (ctx.status === 'past_due' && action !== 'create_book') {
    return { allowed: false, reason: 'subscription_past_due' };
  }
  if (ctx.status === 'cancelled') {
    // Per Q-3.4: keep tier limits until period_end. The webhook sets status='cancelled'
    // but the user's effective tier remains until expiry. If status reaches 'cancelled'
    // AND period_end has passed, the webhook downgrades them to 'free' + 'explorer'.
    // So at status='cancelled' we still honor tier limits below.
  }

  const limits = TIER_LIMITS[ctx.tier];
  switch (action) {
    case 'create_book':
      if (limits.max_books !== 'unlimited' && ctx.current_book_count >= limits.max_books) {
        return { allowed: false, reason: 'book_limit_reached' };
      }
      return { allowed: true };

    case 'ai_call':
      if (ctx.ai_calls_this_month >= limits.ai_calls_per_month) {
        return { allowed: false, reason: 'ai_quota_exceeded' };
      }
      return { allowed: true };

    case 'export_pdf':
    case 'export_epub':
    case 'export_docx':
      return limits.can_export
        ? { allowed: true }
        : { allowed: false, reason: 'export_requires_paid_tier' };

    case 'upload_audio':
      return limits.can_upload_audio
        ? { allowed: true }
        : { allowed: false, reason: 'audio_requires_paid_tier' };

    case 'folder_upload':
      return limits.can_use_folder_upload
        ? { allowed: true }
        : { allowed: false, reason: 'folder_upload_requires_publisher_tier' };

    default: {
      const exhaustive: never = action;
      return { allowed: false, reason: `unknown_action:${exhaustive}` };
    }
  }
}
```

The exhaustive `never` check at the bottom forces TypeScript to complain if a new action is added but not handled — defense against silent under-enforcement.

### Status transitions (Q-3.4 default)

The webhook handler in TASK-024 is the source of truth. This task documents the matrix the helper assumes:

| Trigger | New status | Effective tier | When applied |
|---|---|---|---|
| Stripe `subscription.created` | `active` | `author` or `publisher` per price ID | immediately |
| Stripe `subscription.updated` (upgrade Author→Publisher) | `active` | new tier | immediately (Stripe pro-rates) |
| Stripe `subscription.updated` (downgrade Publisher→Author) | `active` | NEW tier flag set; effective_tier stays old | tier flips at `current_period_end` (handled by daily cron, not webhook) |
| Stripe `invoice.payment_failed` | `past_due` | unchanged | immediately |
| Stripe `subscription.deleted` (user cancels) | `cancelled` | unchanged | tier flips to `explorer` + status to `free` at `current_period_end` (daily cron) |

The daily cron `app/api/cron/period-end-rollover/route.ts` runs at 3am UTC and:
1. Finds rows where `status='cancelled' AND current_period_end < NOW()` → set `status='free'`, `tier='explorer'`
2. Finds rows where downgrade is scheduled and `current_period_end < NOW()` → flip to scheduled tier

### Server-side only enforcement

Per Decision #17, `canPerform` is called only from API route handlers and server components — NEVER from client components. The client may render UI hints ("Upgrade to unlock") based on `tier`, but the actual gate is server-enforced. Mechanical check: `grep -rn "canPerform" components/` should return zero results (excluding tests).

### What this task does NOT do

- Does NOT include any `isLifetime` helper, `'lifetime'` status, or `NEXT_PUBLIC_LIFETIME_ENABLED` reference. The lifetime tier was eliminated 2026-05-06 (A.3); any such code is a regression.
- Does NOT include team-seat checks. Path A locked: `team_seats=0` for all tiers; book sharing and invitations are out-of-scope for v1.
- Does NOT track AI call counts itself — that's `ai_usage_logs` table (TASK-015) consumed via a SELECT in this helper's caller.

## Tests Required

- AT-031: `canPerform('create_book', { tier: 'explorer', current_book_count: 1 })` returns `{ allowed: false, reason: 'book_limit_reached' }`
- AT-032: `canPerform('ai_call', { tier: 'author', ai_calls_this_month: 499 })` returns allowed; at 500, returns quota_exceeded
- AT-033: `canPerform('folder_upload', { tier: 'author' })` returns reason `'folder_upload_requires_publisher_tier'`
- AT-034: Mechanical: file does NOT contain strings `'lifetime'`, `'NEXT_PUBLIC_LIFETIME'`, or `'team_seat'` (other than the documented `team_seats: 0` constant)
- AT-035: Adding a new `Action` literal without updating the `switch` causes a TypeScript compile error (exhaustiveness check)

## Session Notes
_(Filled by Claude Code during implementation)_
