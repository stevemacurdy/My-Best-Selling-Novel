<!-- APPLY: REPLACE -->
<!-- Target: docs/TASKS/TASK-002-global-styles.md (in original mybsn package) -->
<!-- Backup: docs/EXPANDED-TASKS/backups/TASK-002-global-styles.pre-expansion-backup.md -->
<!-- Expanded 2026-05-06 from 112 words to ~1100 words via PATCH-3 sub-deliverable B.3 (operator-confirmed expansion). -->

# TASK-002: Global Styles + Brand Canonical Store

## Status: NOT STARTED
## Priority: CRITICAL
## Phase: 1
## Estimated Sessions: 2
## Dependencies: TASK-001
## Requirements Covered: R1, R34
## Spec Reference: Section 1.2

## Inference Summary

This expanded task replaces the original 112-word TASK-002. Each addition is sourced as follows:

| Addition | Source |
|---|---|
| Crimson Pro typography | ENGINEERING_DECISIONS Decision #19 |
| Gold #D4A853 + navy #0f1b33 base palette | ENGINEERING_DECISIONS Decision #19 |
| Extended brand palette (error/success/warning/muted/secondary navy variants) | Q-1.4 operator-answer (use default); cover image IMG_5384 mood |
| `lib/brand.ts` canonical store ownership | Q-1.4 operator-answer (TASK-002 creates it; R-TASK-108 enforces) |
| Tailwind tokens consumed from `lib/brand.ts` | Q-1.6 operator-answer (Tailwind throughout) |
| Typography scale (h1 48/56, h2 36/44, h3 28/36, body 18/28, small 16/24, caption 14/20) | Q-1.5 operator-answer (use default) |
| Animation timings (fadeIn 240ms, glow 2.4s, float 4s, spin 800ms) | Q-1.7 operator-answer (use default) |
| `prefers-reduced-motion` wrapping | R-TASK-110 a11y baseline |
| Mobile typography step-down | Q-1.5 default |

Operator confirmed all questions on 2026-05-06. No `[INFERRED-BY-CLAUDE]` content remains.

## Pre-flight: re-read current state

Before making any change:
- View `app/globals.css` if present — TASK-001 created a stub from create-next-app default. Confirm it's still the stub or note any prior customization.
- View `lib/brand.ts` — should NOT exist yet. If it does, this task is partially complete; scope to deltas only.
- View `tailwind.config.ts` — TASK-001 created a stub with empty theme extension. Confirm.
- If R-TASK-108 (brand contrast rule + canonical store) has shipped before this task (out-of-order execution), STOP and reconcile: R-108 was supposed to enforce a store created by TASK-002, not create the store itself.

## Files to Create/Modify

- `lib/brand.ts` (NEW) — canonical brand store
- `tailwind.config.ts` (modify) — extend theme from `lib/brand.ts`
- `app/globals.css` (modify) — keyframes, scrollbar, focus-ring, base resets
- `app/layout.tsx` (modify) — load Crimson Pro from Google Fonts, apply font className

## Implementation Requirements

### `lib/brand.ts` — canonical store

This file is the single source of truth for every color, font, spacing, breakpoint, and animation value in the codebase. Other tasks consume from here; nothing else hard-codes a hex value or a duration. R-TASK-108 enforces this rule via grep checks.

```typescript
// lib/brand.ts
export const colors = {
  // Decision #19 base palette
  navy: '#0f1b33',         // primary background, dark surfaces
  gold: '#D4A853',         // primary CTA, brand accent
  white: '#ffffff',         // text on dark surfaces

  // Extended palette (Q-1.4 default)
  navyLight: '#1B2A4A',     // secondary surface (cards on navy)
  navyDeep: '#0a121f',      // tertiary surface, page-deep
  goldDim: '#a37f33',       // gold on hover/pressed
  goldGlow: 'rgba(212, 168, 83, 0.4)',  // for animated glow effects

  // Semantic states
  error: '#dc2626',          // red-600
  errorBg: '#fef2f2',        // red-50, light error background
  success: '#16a34a',        // green-600
  successBg: '#f0fdf4',
  warning: '#ea580c',        // orange-600
  warningBg: '#fff7ed',

  // Neutrals on light surfaces
  textOnLight: '#1B2A4A',
  textMuted: '#6b7280',      // gray-500
  textSubtle: '#9ca3af',     // gray-400 — only for decorative text on light backgrounds, NEVER for body text on dark
  borderLight: '#e5e7eb',    // gray-200
  surfaceLight: '#f9fafb',   // gray-50
} as const;

export const typography = {
  family: {
    serif: '"Crimson Pro", Georgia, serif',
    sans: 'system-ui, -apple-system, "Segoe UI", Roboto, sans-serif',
    mono: 'ui-monospace, "SF Mono", Menlo, monospace',
  },
  scale: {
    h1: { size: '48px', lineHeight: '56px', weight: 600 },
    h2: { size: '36px', lineHeight: '44px', weight: 600 },
    h3: { size: '28px', lineHeight: '36px', weight: 600 },
    body: { size: '18px', lineHeight: '28px', weight: 400 },
    small: { size: '16px', lineHeight: '24px', weight: 400 },
    caption: { size: '14px', lineHeight: '20px', weight: 400 },
  },
  scaleMobile: {
    h1: { size: '36px', lineHeight: '44px', weight: 600 },
    h2: { size: '28px', lineHeight: '36px', weight: 600 },
    h3: { size: '24px', lineHeight: '32px', weight: 600 },
    body: { size: '16px', lineHeight: '24px', weight: 400 },
    small: { size: '14px', lineHeight: '20px', weight: 400 },
    caption: { size: '12px', lineHeight: '18px', weight: 400 },
  },
} as const;

export const motion = {
  fadeIn: '240ms ease-out',
  glow: '2.4s ease-in-out infinite',
  float: '4s ease-in-out infinite',
  spin: '800ms linear infinite',
} as const;

export const breakpoints = {
  sm: '640px',
  md: '768px',
  lg: '1024px',
  xl: '1280px',
  '2xl': '1536px',
} as const;
```

### `tailwind.config.ts` — extend from `lib/brand.ts`

```typescript
import type { Config } from 'tailwindcss';
import { colors, typography, motion } from './lib/brand';

const config: Config = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './lib/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: { brand: colors },
      fontFamily: {
        serif: typography.family.serif.split(','),
        sans: typography.family.sans.split(','),
      },
      animation: {
        fadeIn: `fadeIn ${motion.fadeIn}`,
        glow: `glow ${motion.glow}`,
        float: `float ${motion.float}`,
        spin: `spin ${motion.spin}`,
      },
      keyframes: { /* see globals.css */ },
    },
  },
  plugins: [],
};
export default config;
```

Components reference colors as `bg-brand-navy`, `text-brand-gold`, etc.

### `app/globals.css`

Define keyframes (`fadeIn`, `glow`, `float`, `spin`), scrollbar styling on dark backgrounds (thin, gold-on-navy thumb, navy track), focus-ring styling (`outline: 2px solid theme('colors.brand.gold')` with 2px offset), and base resets. All animations are wrapped in `@media (prefers-reduced-motion: reduce) { animation: none !important; }` per R-TASK-110 a11y baseline.

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  body {
    @apply font-serif text-[18px] leading-[28px] bg-brand-navy text-brand-white;
  }
  h1 { @apply text-[48px] leading-[56px] font-semibold; }
  h2 { @apply text-[36px] leading-[44px] font-semibold; }
  h3 { @apply text-[28px] leading-[36px] font-semibold; }

  @media (max-width: 768px) {
    body { @apply text-[16px] leading-[24px]; }
    h1 { @apply text-[36px] leading-[44px]; }
    h2 { @apply text-[28px] leading-[36px]; }
    h3 { @apply text-[24px] leading-[32px]; }
  }

  *:focus-visible {
    outline: 2px solid theme('colors.brand.gold');
    outline-offset: 2px;
  }
}

@keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
@keyframes glow { 0%, 100% { box-shadow: 0 0 20px theme('colors.brand.goldGlow'); } 50% { box-shadow: 0 0 40px theme('colors.brand.goldGlow'); } }
@keyframes float { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-8px); } }
@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }

@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after { animation: none !important; transition: none !important; }
}

/* Scrollbar (WebKit) */
::-webkit-scrollbar { width: 8px; height: 8px; }
::-webkit-scrollbar-track { background: theme('colors.brand.navyDeep'); }
::-webkit-scrollbar-thumb { background: theme('colors.brand.gold'); border-radius: 4px; }
::-webkit-scrollbar-thumb:hover { background: theme('colors.brand.goldDim'); }
```

### `app/layout.tsx` — Crimson Pro from Google Fonts

```tsx
import { Crimson_Pro } from 'next/font/google';
const crimson = Crimson_Pro({ subsets: ['latin'], variable: '--font-crimson' });

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={crimson.variable}>
      <body>{children}</body>
    </html>
  );
}
```

`next/font/google` self-hosts the font files at build time, eliminating the FOUT/FOIT and the third-party request to Google's CDN (better Core Web Vitals + GDPR posture per R-TASK-119 cookies/privacy).

## Tests Required

- AT-006: `lib/brand.ts` exports `colors`, `typography`, `motion`, `breakpoints` constants; all are `as const` typed
- AT-007: `tailwind.config.ts` consumes from `lib/brand.ts` (no hard-coded hex values)
- AT-008: `app/globals.css` contains `@media (prefers-reduced-motion: reduce)` block
- AT-009: Body renders in Crimson Pro on a fresh `npm run dev` (visual check; check computed font in DevTools)
- AT-010: Focus ring appears on tab-navigation across all interactive elements
- AT-011: `npm run build` passes with zero warnings about color classes

## Session Notes
_(Filled by Claude Code during implementation)_

<!-- v4.1 spec correction 2026-05-09: typography.family.serif must lead with 'var(--font-crimson)' for next/font compatibility; literal "Crimson Pro" alone falls back to Georgia. -->
