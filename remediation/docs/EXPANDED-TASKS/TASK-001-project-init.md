<!-- APPLY: REPLACE -->
<!-- Target: docs/TASKS/TASK-001-project-init.md (in original mybsn package) -->
<!-- Backup: docs/EXPANDED-TASKS/backups/TASK-001-project-init.pre-expansion-backup.md -->
<!-- Expanded 2026-05-06 from 101 words to ~880 words via PATCH-3 sub-deliverable B.3 (operator-confirmed expansion). -->

# TASK-001: Project Initialization

## Status: NOT STARTED
## Priority: CRITICAL
## Phase: 1
## Estimated Sessions: 1
## Dependencies: None (first task)
## Requirements Covered: R1
## Spec Reference: Section 1.1

## Inference Summary

This expanded task replaces the original 101-word TASK-001. Each addition is sourced as follows:

| Addition | Source |
|---|---|
| Next.js 14 App Router + TypeScript scaffold | ENGINEERING_DECISIONS Decision #1 |
| Tailwind 3.4 styling decision | Q-1.6 operator-answer (use default: Tailwind) |
| `lib/brand.ts` canonical store created in TASK-002 | Q-1.4 operator-answer (TASK-002 owns canonical store) |
| ESLint + Prettier + strict-mode tsconfig flags | Q-1.1 operator-answer (use default) |
| npm scripts list | Q-1.2 operator-answer (use default); R-TASK-109 (lint:contrast); R-TASK-130 (test/test:e2e) |
| `next.config.js` image remotePatterns whitelist | Q-1.3 operator-answer (use default); R-TASK-115 backup vendor (R2) |
| `.gitignore` template | Next.js 14 conventions + Decision #2 stack |

Operator confirmed all questions on 2026-05-06. No `[INFERRED-BY-CLAUDE]` content remains.

## Pre-flight: re-read current state

Before making any change, view the current state of the repo. This task is the first task in the original 68-task package; for a fresh build, the repo is empty and all of the below applies. If the repo has any prior commits (e.g., from a partial earlier attempt), view these specific files first to confirm what's present:

- `package.json`, `tsconfig.json`, `next.config.js`, `tailwind.config.ts`, `.eslintrc.json`, `.prettierrc`, `.gitignore`

If any are present, scope this task to the deltas only. If `package.json` already lists the dependencies below, do not reinstall — just verify versions match.

## Files to Create/Modify

- `package.json`
- `tsconfig.json`
- `next.config.js`
- `tailwind.config.ts`
- `.eslintrc.json`
- `.prettierrc`
- `.prettierignore`
- `.gitignore`
- `app/layout.tsx` (minimal)
- `app/page.tsx` (placeholder; real content lands in TASK-043)
- `README.md` (project description)

## Implementation Requirements

### Initialize via `create-next-app`

Run `npx create-next-app@14 . --typescript --tailwind --app --src-dir false --import-alias "@/*"` from an empty directory. This bootstraps Next.js 14 with the App Router, TypeScript, Tailwind CSS 3.4, the `@/*` import alias rooted at the project root, and standard ESLint config. Confirm output produces a working `npm run dev` baseline before proceeding.

### TypeScript configuration (`tsconfig.json`)

Apply strict-mode flags beyond the create-next-app defaults: `"strict": true` (already default), plus `"noUncheckedIndexedAccess": true` (catches `arr[0]` returning `T | undefined`) and `"noImplicitOverride": true` (forces the `override` keyword on subclass methods). Path alias remains `"@/*": ["./*"]`. Do not relax these flags during build; if a real bug surfaces a flag conflict, fix the code rather than the config.

### Tailwind configuration (`tailwind.config.ts`)

Stub the config to consume tokens from `lib/brand.ts` (created in TASK-002 — see Q-1.4 operator answer that TASK-002 owns the canonical brand store). For TASK-001, install the package and create the config with default content paths (`./app/**/*.{js,ts,jsx,tsx,mdx}`, `./components/**/*.{js,ts,jsx,tsx,mdx}`, `./lib/**/*.{js,ts,jsx,tsx,mdx}`). Theme extensions stay empty until TASK-002 lands; the empty extension block is fine because Tailwind's default palette covers the placeholder content from `app/page.tsx`.

### Next.js configuration (`next.config.js`)

```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '*.supabase.co' },
      { protocol: 'https', hostname: '*.r2.cloudflarestorage.com' },
    ],
  },
};
module.exports = nextConfig;
```

The Supabase host is for cover storage (Decision #15); R2 host is for R-TASK-115 backup destinations. Stripe and Anthropic are not in the list because they don't render images. If a future task needs another host, add it then — don't speculatively whitelist.

### ESLint + Prettier

Install `eslint-config-next` (already pulled by create-next-app) plus `@typescript-eslint/eslint-plugin`, `@typescript-eslint/parser`, `eslint-config-prettier`, and `prettier` as dev dependencies. `.eslintrc.json` extends `next/core-web-vitals`, `eslint:recommended`, `@typescript-eslint/recommended`, and `prettier` (last to disable conflicting rules). `.prettierrc` uses defaults except: `"singleQuote": true`, `"trailingComma": "all"`, `"printWidth": 100`. `.prettierignore` excludes `.next/`, `node_modules/`, `public/`, and `*.md` (markdown is hand-formatted in this codebase).

### npm scripts (`package.json`)

```json
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "lint:contrast": "tsx scripts/contrast-lint.ts",
    "type-check": "tsc --noEmit",
    "test": "vitest run",
    "test:e2e": "playwright test",
    "db:reset": "supabase db reset"
  }
}
```

`lint:contrast` is a placeholder until R-TASK-109 ships the script — the npm script entry exists from day one so CI configuration can reference it without conditional logic. `test` and `test:e2e` are placeholders until R-TASK-130 establishes the testing baseline. `db:reset` requires the Supabase CLI (`brew install supabase/tap/supabase` or equivalent on the operator's machine) and is documented in the README.

### `.gitignore`

Use Next.js 14 default plus: `.env.local`, `.env*.local`, `*.tsbuildinfo`, `coverage/`, `playwright-report/`, `test-results/`, `.vercel/`, `.DS_Store`, `Thumbs.db`. The Supabase-CLI `.branches/` directory is also ignored. No sensitive files (DPAs, signed PDFs in `docs/legal/dpas/`) are committed; that directory has its own `.gitignore` with `*` to belt-and-suspenders the rule.

### Husky NOT installed in v1

Per Q-1.1 default, no Husky pre-commit hooks are installed in v1. CI enforces. If pre-commit hooks become useful later (e.g., to catch obvious type errors before push), add Husky in a future task as an additive change.

## Tests Required

- AT-001: `npm run build` passes with zero errors and zero warnings on a fresh clone (after `npm install`)
- AT-002: `npm run lint` passes
- AT-003: `npm run type-check` passes
- AT-004: `app/page.tsx` renders a placeholder homepage when running `npm run dev`
- AT-005: `package.json` contains all 9 npm scripts listed above

## Session Notes
_(Filled by Claude Code during implementation)_
