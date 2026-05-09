<!-- APPLY: REPLACE -->
<!-- Target: docs/TASKS/TASK-052-admin-dashboard-ui.md (in original mybsn package) -->
<!-- Backup: docs/EXPANDED-TASKS/backups/TASK-052-admin-dashboard-ui.pre-expansion-backup.md -->
<!-- Expanded 2026-05-06 from 101 words to ~1050 words via PATCH-3 sub-deliverable B.3. -->

# TASK-052: Admin Dashboard UI (`app/admin/page.tsx`)

## Status: NOT STARTED
## Priority: HIGH
## Phase: 7
## Estimated Sessions: 2
## Dependencies: TASK-010, TASK-049, TASK-050, TASK-051
## Requirements Covered: R20, R23
## Spec Reference: Section 7.1

## Inference Summary

This expanded task replaces the original 101-word TASK-052. Each addition is sourced as follows:

| Addition | Source |
|---|---|
| 5 charts on main view (MRR / signups / tier dist / top-20 AI users / genre) | Q-7.1 operator-answer (use default); Decision #30 admin scope |
| Tier-distribution chart shows 5 segments not 6 | A.3 lifetime elimination 2026-05-06 |
| Default 30-day range, 7d/30d/90d/YTD/all-time presets | Q-7.2 operator-answer (use default) |
| Drill-down to `/admin/users/[id]` detail page | Q-7.3 operator-answer (use default) |
| Audit log on separate `/admin/audit` route, super_admin-gated | Q-7.4 operator-answer (use default); R-TASK-111 |
| super_admin-only views (audit, mutations, billing) | Q-7.5 operator-answer (use default); R-TASK-113 |
| 60-second polling on charts; manual refresh button | Q-7.6 operator-answer (use default) |
| Recharts library | TASK-001 frontend stack defaults; consistent with bestseller_demo.jsx |

Operator confirmed all questions on 2026-05-06.

## Pre-flight: re-read current state

- View `app/admin/page.tsx` if present.
- View `app/admin/users/[id]/page.tsx` to confirm whether the user-detail drill-down target exists.
- View `app/admin/audit/page.tsx` to confirm whether the audit log surface exists (per R-TASK-111).
- Confirm TASK-049 (metrics API), TASK-050 (genres API), TASK-051 (users API) have shipped — they're upstream dependencies.

## Files to Create/Modify

- `app/admin/page.tsx` (NEW or REPLACE)
- `app/admin/users/[id]/page.tsx` (NEW)
- `app/admin/audit/page.tsx` (NEW; super_admin-gated)
- `components/admin/MRRChart.tsx`, `SignupsChart.tsx`, `TierDistribution.tsx`, `TopUsersTable.tsx`, `GenrePieChart.tsx` (NEW)
- `components/admin/DateRangePicker.tsx` (NEW)
- `components/admin/RefreshButton.tsx` (NEW)

## Implementation Requirements

### Layout

`/admin` page shows a header (current admin's name + role + manual refresh button + date range picker) and a 2-column grid of cards on desktop, single-column on mobile (per TASK-061 default — admin is desktop-first 1024px+, blocking message on mobile).

### Chart 1 — MRR over time (Q-7.1)

Line chart, x-axis = days, y-axis = MRR in USD. Source: `/api/admin/metrics?range=30d` (TASK-049). Computes daily MRR snapshots from `subscriptions` table at the end of each day. Use Recharts `<LineChart>` with `<Line type="monotone">`.

### Chart 2 — Signups over time

Line chart. Source: same metrics endpoint. Counts new `profiles` rows by created_at day.

### Chart 3 — Tier distribution

Recharts `<PieChart>` with `<Pie innerRadius>` for donut effect. **5 segments** (Q-7.1 default; reduced from 6 per A.3 — no lifetime tier):
- Explorer
- Author Monthly
- Author Annual
- Publisher Monthly
- Publisher Annual

Legend below the chart with absolute counts and percentages. Color from `lib/brand.ts` brand-gold for Author tiers, brand-navyLight for Publisher, brand-textMuted for Explorer.

### Chart 4 — Top 20 users by AI usage (current month)

Recharts `<BarChart>` horizontal. Rows are clickable — click → navigate to `/admin/users/[id]`. Source: `/api/admin/users?sort=ai_calls_desc&limit=20`.

### Chart 5 — Genre distribution

Recharts `<PieChart>`. Source: `/api/admin/genres`. Top 8 genres by book count, "Other" rolls up the rest.

### Date range picker (Q-7.2)

Component renders 5 preset buttons (7d / 30d / 90d / YTD / all-time) plus a custom range input. Default selected = 30d. Selecting a preset triggers re-fetch of all 5 charts (passing `range` query param).

### Drill-down (Q-7.3)

Clicking a row in the top-users table navigates to `/admin/users/[id]`. The detail page shows:
- Profile fields (email, full_name, role, created_at, MFA enrollment status)
- Subscription history (current + prior subs from `subscriptions` table with status timeline)
- AI usage timeline (line chart from `ai_usage_logs`)
- Recent audit-log events for this user (latest 50 from `audit_event_log` filtered by `target_user_id`, per R-TASK-111)
- Mutation buttons (super_admin-only; gated by `<AdminGuard requireSuperAdmin>` wrapper at the layout level): Grant role / Force MFA reset / Soft-delete account

### Audit log surface (Q-7.4)

`app/admin/audit/page.tsx` is wrapped by `<AdminGuard requireSuperAdmin>` (Q-7.5 — super_admin-only). Renders a paginated table of `audit_event_log` rows (R-TASK-111) with filters by event_type, actor_user_id, target_user_id, time range. Default sort: newest first. Page size 50.

### Super-admin scope (Q-7.5 default)

| Surface | admin | super_admin |
|---|---|---|
| `/admin` (charts, top-users read-only) | ✅ | ✅ |
| `/admin/users/[id]` view-only | ✅ | ✅ |
| `/admin/users/[id]` mutations (role/MFA/delete) | ❌ | ✅ |
| `/admin/audit` audit log | ❌ | ✅ |
| `/admin/billing` (refund issuance) | ❌ | ✅ |

`<AdminGuard>` enforces base admin access; mutation-bearing routes/components additionally check `user.role === 'super_admin'` server-side.

### Refresh strategy (Q-7.6 default)

- 60-second polling on all 5 charts via React's `useEffect` + `setInterval`. Polling pauses when the tab is hidden (`document.visibilityState !== 'visible'`).
- Manual refresh button always visible in the header. Clicking forces an immediate re-fetch of all 5 charts (independent of the polling interval).
- No Supabase realtime subscription in v1 (cost + complexity). If future needs justify it, add per-chart on a case-by-case basis.

### Brand styling

All cards use `lib/brand.ts` tokens. Card background `bg-brand-navyLight`, headings `text-brand-white text-h3`, chart colors derived from `colors.brand.*`. Date range picker: `bg-brand-navyDeep` for unselected presets, `bg-brand-gold text-brand-navy` for selected.

### What this task does NOT do

- Does NOT implement the metrics, genres, or users APIs — those are TASK-049/050/051.
- Does NOT implement the audit-event-log writes — those are throughout the codebase per R-TASK-111.
- Does NOT define alerting visualization — that lives in Better Stack / Sentry external dashboards per R-TASK-128. The admin dashboard does not embed external alert state in v1.
- Does NOT include any "lifetime" segment in the tier distribution chart (A.3 elimination).

## Tests Required

- AT-080: `/admin` renders 5 charts with sample data; tier distribution shows 5 segments
- AT-081: Date range picker default is 30d; switching to 7d triggers re-fetch
- AT-082: Top users table row click navigates to `/admin/users/[id]`
- AT-083: `/admin/audit` redirects regular admin to `/`; super_admin can access
- AT-084: Mutation buttons on user detail page are hidden for `role='admin'`, visible for `role='super_admin'`
- AT-085: Charts auto-refresh every 60 seconds when tab is visible; pause when hidden
- AT-086: Mechanical: tier distribution chart contains exactly 5 segment definitions, no "lifetime" string

## Session Notes
_(Filled by Claude Code during implementation)_
