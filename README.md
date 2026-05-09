# My Best Selling Novel

AI-guided book writing platform. Next.js 14 + Supabase + Stripe + Anthropic.

## Quick start

```bash
npm install
cp .env.local.example .env.local
# populate values per the phase-comment checklist in .env.local.example
npm run dev
```

## Scripts

- `npm run dev` — local dev server
- `npm run build` — production build
- `npm run start` — start production build
- `npm run lint` — Next.js + ESLint
- `npm run lint:contrast` — brand contrast lint (placeholder until R-TASK-109)
- `npm run type-check` — `tsc --noEmit`
- `npm run test` — Vitest unit tests (placeholder until R-TASK-130)
- `npm run test:e2e` — Playwright smoke tests (placeholder until R-TASK-131)
- `npm run db:reset` — reset Supabase schema (requires Supabase CLI)

## Documentation

Build spec lives in `remediation/` (v4 packet). Start with `remediation/REMEDIATION_OVERVIEW.md`.
