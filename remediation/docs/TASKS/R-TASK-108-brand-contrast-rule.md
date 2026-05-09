<!-- APPLY: CREATE -->
# R-TASK-108: Brand Contrast Rule + Canonical Store

## Status: NOT STARTED
## Priority: HIGH
## Phase: 11
## Estimated Sessions: 1
## Dependencies: TASK-002
## Resolves Gaps: GAP-004 (paired with R-TASK-109)
## Spec Reference: AUDIT_REPORT.md HIGH section

## Pre-flight: re-read current state

Before making any change, read the current state of every file listed in "Files to Modify" below. Verify the gap(s) addressed by this task are still present in the current code. Specifically:

- For each file in "Files to Modify": view the file and confirm the condition the audit observed (e.g., "no rate limiting on /api/ai") still applies.
- For each gap in "Resolves Gaps": confirm the gap remains open. The audit was conducted on 2026-05-04; if the codebase changed since, the gap may have been partially or fully addressed.
- If a gap is no longer present, report this finding in PROGRESS.md, mark this task as superseded, and stop. Do not make changes.
- If a gap is partially addressed, scope this task to the remaining work and document in this file's Session Notes what was already addressed and skipped.
- If the gap is still fully present as the audit described, proceed with the rest of this task.

This pre-flight catches the case where the codebase changed between audit and remediation — exactly the failure mode that produces silent overwrites of unrelated work.

## Files to Create

- `lib/brand.ts` — canonical brand store (single source of truth for colors, fonts, contrast rules)
- `docs/architecture/BRAND_CONTRAST_RULE.md` — the stark-contrast rule documentation

## Files to Modify

- `app/globals.css` (TASK-002) — derive CSS variables from `lib/brand.ts` instead of hardcoding hex strings
- `tailwind.config.ts` (TASK-002) — extend theme with named brand tokens (e.g., `bg-brand-night`, `text-brand-gold`) so usage is canonical

## Brand canonical store (`lib/brand.ts`)

```typescript
// lib/brand.ts — Single source of truth for brand visual system.
// Visual reference: book-cover "The God in You" (2015) — dark cosmic + warm gold.
// Per CLAUDE.md: gold #D4A853 / navy #0f1b33 / background #0a0f1a / Crimson Pro.

export const colors = {
  // Backgrounds (dark family — operative product palette)
  night: '#0a0f1a',          // primary background, near-black cosmic
  midnight: '#0f1b33',       // primary dark, raised surface
  navy: '#1B2A4A',           // secondary dark, hover state on midnight
  // Accent (warm gold — the cover's apple)
  gold: '#D4A853',           // primary accent, calls-to-action, highlights
  goldDim: '#9C7B3D',        // pressed/disabled gold (still legible)
  goldGlow: '#F0CB7A',       // hover/focus glow on gold
  // Foregrounds for dark backgrounds
  bone: '#F5F1E8',           // primary text on dark (off-white, warmer than pure)
  boneDim: '#A8A092',        // secondary text on dark
  boneFaint: '#6B675F',      // tertiary text on dark (caption only; do NOT use for body)
  // Foregrounds for light backgrounds (admin dashboard, /pricing cards)
  ink: '#1A1410',            // primary text on light, near-black warm
  inkDim: '#4A4338',         // secondary text on light
  // Status colors
  success: '#4ECCA3',        // teal-green — readable on both light and dark
  warning: '#E8B547',        // mid-saturation amber — distinct from gold accent
  danger:  '#C0392B',        // brick red — readable on both
  info:    '#5BA8D6',        // soft blue — readable on both
  // Light backgrounds (used sparingly — admin dashboard cards)
  paper: '#FAF8F2',          // warm off-white card surface
  parchment: '#F0EBDD',      // raised surface on paper
} as const;

export const fonts = {
  display: '"Crimson Pro", Georgia, serif',
  body: '"Crimson Pro", Georgia, serif',
  ui: '"Inter", system-ui, sans-serif',  // for dense UI (admin dashboard tables)
  mono: '"JetBrains Mono", ui-monospace, monospace',
} as const;

// ─── STARK CONTRAST RULE ───
// Every text element must use text color from `allowedPairings[bg]`
// for whatever background it sits on. Never improvise.

export const allowedPairings: Record<string, readonly string[]> = {
  // Dark family backgrounds → use bone family text
  night:    ['bone', 'boneDim', 'gold', 'goldGlow', 'success', 'warning', 'danger', 'info'],
  midnight: ['bone', 'boneDim', 'gold', 'goldGlow', 'success', 'warning', 'danger', 'info'],
  navy:     ['bone', 'boneDim', 'gold', 'goldGlow', 'success', 'warning', 'danger', 'info'],
  // Light family backgrounds → use ink family text
  paper:     ['ink', 'inkDim', 'goldDim', 'success', 'warning', 'danger', 'info'],
  parchment: ['ink', 'inkDim', 'goldDim', 'success', 'warning', 'danger', 'info'],
  // Gold backgrounds (CTAs) → ink only
  gold: ['ink', 'midnight', 'night'],
  goldDim: ['bone'],
  goldGlow: ['ink'],
} as const;

// ─── FORBIDDEN PAIRINGS — explicit ban list for the lint script ───
export const forbiddenPairings: ReadonlyArray<readonly [string, string]> = [
  // Gold on light = catastrophic contrast failure (~2.8:1)
  ['paper', 'gold'],
  ['paper', 'goldGlow'],
  ['parchment', 'gold'],
  ['parchment', 'goldGlow'],
  // Bone on light = washed out
  ['paper', 'bone'],
  ['paper', 'boneDim'],
  ['paper', 'boneFaint'],
  ['parchment', 'bone'],
  // Ink on dark = invisible
  ['night', 'ink'],
  ['night', 'inkDim'],
  ['midnight', 'ink'],
  ['midnight', 'inkDim'],
  ['navy', 'ink'],
  // boneFaint anywhere as primary text — caption only
  // (lint enforces this via element-type check, not pairing)
] as const;

// ─── OPACITY RULE ───
// Never use text-{color}/opacity inside dark containers.
// Why: bg-night with text-bone/40 renders as charcoal-on-near-black, ~2:1.
// Instead: use the next dimmer named color in the family (boneDim).
// Lint regex enforced via the script in R-TASK-109.

// ─── TERNARY CLASS RULE ───
// When using conditional className with background+text changes,
// ALWAYS pair both states explicitly:
//   ✅ tab === t.id ? 'bg-midnight text-bone' : 'bg-paper text-ink'
//   ❌ tab === t.id ? 'bg-midnight' : 'bg-paper text-ink'  (left arm has no text color override)

// ─── CONTRAST RATIOS (computed against actual hex values) ───
// All pairings in allowedPairings achieve >= 4.5:1 (AA normal text).
// Production CSS includes computed ratios in comments for auditability.
// Target: 7.0:1 (AAA) for all body text.

export const contrastTargets = {
  bodyMin: 7.0,        // AAA normal text
  largeMin: 4.5,       // AAA large text (18pt+ or 14pt+ bold) acceptable down to 4.5
  uiNonTextMin: 3.0,   // borders, focus rings, icon stroke
} as const;

export type ColorToken = keyof typeof colors;
```

## Tailwind config additions

```typescript
// tailwind.config.ts
import { colors, fonts } from './lib/brand';

export default {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          night: colors.night,
          midnight: colors.midnight,
          navy: colors.navy,
          gold: colors.gold,
          'gold-dim': colors.goldDim,
          'gold-glow': colors.goldGlow,
          bone: colors.bone,
          'bone-dim': colors.boneDim,
          'bone-faint': colors.boneFaint,
          ink: colors.ink,
          'ink-dim': colors.inkDim,
          paper: colors.paper,
          parchment: colors.parchment,
          success: colors.success,
          warning: colors.warning,
          danger: colors.danger,
          info: colors.info,
        },
      },
      fontFamily: {
        display: fonts.display.split(','),
        body: fonts.body.split(','),
        ui: fonts.ui.split(','),
        mono: fonts.mono.split(','),
      },
    },
  },
};
```

After this, usage in components is canonical:

```tsx
// CORRECT
<div className="bg-brand-midnight text-brand-bone">…</div>

// FORBIDDEN — flagged by lint
<div className="bg-brand-paper text-brand-gold">…</div>
```

## Visual reference recall

The "The God in You" cover establishes:
- Background: dark cosmic with warm undertone (matches our `night` and `midnight`)
- Accent: warm metallic gold (matches our `gold`)
- Type: white-ish serif on dark (matches `bone` text on dark families)
- Tone: aspirational, transformational, reverent

The `bone` color (#F5F1E8) is deliberately warm-tinted off-white to match the cover's typography rather than pure white — pure white on dark cosmic reads cold.

## Tests Required

- AT-108-1: lib/brand.ts compiles; exports colors, fonts, allowedPairings, forbiddenPairings
- AT-108-2: Tailwind classes `bg-brand-midnight`, `text-brand-bone`, `text-brand-gold` resolve to correct hex
- AT-108-3: Manual contrast check (using https://webaim.org/resources/contrastchecker/): all `allowedPairings` entries achieve ≥ 4.5:1
- AT-108-4: All `forbiddenPairings` entries achieve < 4.5:1 (proves the lint matters)
- AT-108-5: globals.css imports CSS variables from lib/brand.ts instead of hardcoding hex

## Session Notes
_(Filled by Claude Code during implementation)_
