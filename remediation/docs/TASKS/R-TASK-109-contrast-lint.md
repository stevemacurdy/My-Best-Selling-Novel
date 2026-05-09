<!-- APPLY: CREATE -->
# R-TASK-109: Contrast Lint Script + CI Integration

## Status: NOT STARTED
## Priority: HIGH
## Phase: 11
## Estimated Sessions: 1
## Dependencies: R-TASK-108, R-TASK-124 (CI pipeline exists)
## Resolves Gaps: GAP-068
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

- `scripts/contrast-lint.ts` — Node script that scans .tsx/.jsx files for forbidden bg/text pairings
- `.github/workflows/contrast-lint.yml` — CI step (or merge into general lint workflow from R-TASK-124)
- `docs/architecture/CONTRAST_LINT_USAGE.md` — how to interpret lint failures and add exceptions

## Files to Modify

- `package.json` — add script `"lint:contrast": "tsx scripts/contrast-lint.ts"` and integrate into `lint` aggregate script

## Lint script

```typescript
// scripts/contrast-lint.ts
import { readFileSync } from 'node:fs';
import { glob } from 'glob';
import { forbiddenPairings, allowedPairings } from '../lib/brand';

interface Violation {
  file: string;
  line: number;
  text: string;
  rule: string;
}

const violations: Violation[] = [];

// Patterns:
//   bg-brand-{color}  → background color
//   text-brand-{color} → text color
//   text-brand-{color}/{opacity} → opacity variant (forbidden on dark bg)

const FILE_GLOBS = ['app/**/*.{ts,tsx}', 'components/**/*.{ts,tsx}'];
const EXCLUDED = ['**/node_modules/**', 'components/agent/**'];  // agent is verbatim-port; address per ADR-003

const files = (await Promise.all(FILE_GLOBS.map(g =>
  glob(g, { ignore: EXCLUDED })
))).flat();

const bgRe = /bg-brand-([a-z-]+)/g;
const textRe = /text-brand-([a-z-]+)(?:\/(\d+))?/g;
const classNameRe = /className\s*=\s*["'`{]([^"'`}]+)["'`}]/g;

for (const file of files) {
  const content = readFileSync(file, 'utf8');
  const lines = content.split('\n');

  lines.forEach((line, idx) => {
    const matches = line.matchAll(classNameRe);
    for (const m of matches) {
      const classes = m[1];
      const bgs = [...classes.matchAll(bgRe)].map(b => b[1]);
      const texts = [...classes.matchAll(textRe)].map(t => ({ color: t[1], opacity: t[2] }));

      // Rule 1: forbidden pairings
      for (const bg of bgs) {
        for (const txt of texts) {
          const pair: readonly [string, string] = [bg.replace('-', ''), txt.color.replace('-', '')];
          if (forbiddenPairings.some(([fb, ft]) =>
            fb.toLowerCase() === pair[0] && ft.toLowerCase() === pair[1]
          )) {
            violations.push({
              file, line: idx + 1, text: line.trim(),
              rule: `Forbidden pairing: bg-brand-${bg} + text-brand-${txt.color}`,
            });
          }
        }
      }

      // Rule 2: opacity variants on dark backgrounds
      const darkBgs = ['night', 'midnight', 'navy'];
      const onDark = bgs.some(b => darkBgs.includes(b.replace('-', '')));
      if (onDark) {
        for (const txt of texts) {
          if (txt.opacity && parseInt(txt.opacity) < 100) {
            violations.push({
              file, line: idx + 1, text: line.trim(),
              rule: `Opacity variant text-brand-${txt.color}/${txt.opacity} on dark bg — use a dimmer named color (boneDim) instead`,
            });
          }
        }
      }

      // Rule 3: ternary class detection (heuristic: contains '?' and ':' inside className)
      // Lint can only catch obvious cases; full ternary verification is manual
      if (classes.includes('?') && classes.includes(':')) {
        // Check both arms have explicit text-brand-* if either has bg-brand-*
        // (simplified — full impl would parse the ternary)
      }
    }
  });
}

if (violations.length > 0) {
  console.error(`\n❌ ${violations.length} contrast violation(s):\n`);
  for (const v of violations) {
    console.error(`  ${v.file}:${v.line}`);
    console.error(`    Rule: ${v.rule}`);
    console.error(`    Code: ${v.text}\n`);
  }
  process.exit(1);
} else {
  console.log(`✅ Contrast lint passed across ${files.length} files`);
}
```

## CI integration (`.github/workflows/contrast-lint.yml`)

If R-TASK-124 already creates a `lint.yml`, add `npm run lint:contrast` as a step there. Otherwise:

```yaml
name: Contrast Lint
on: [pull_request]
jobs:
  contrast:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: '20' }
      - run: npm ci
      - run: npm run lint:contrast
```

## Exception mechanism

If you legitimately need a forbidden pairing (e.g., an explicit "warning banner" that uses gold-on-warning-bg by design), add `// contrast-lint-disable-next-line` above the line:

```tsx
{/* contrast-lint-disable-next-line — design intent: warning banner */}
<div className="bg-brand-warning text-brand-gold">…</div>
```

The lint script must be modified to skip lines following this comment (one-line disable, not block).

## Agent component exclusion

Per the EXCLUDED glob, the lint skips `components/agent/`. The reason is Decision #11 (verbatim port). When ADR-003 is adopted (split Decision #11 to allow mechanical modernization), this exclusion can be removed and agent components run through the lint. For v1 with original Decision #11 in force, the agent's contrast issues remain manual review.

## Tests Required

- AT-109-1: Script flags forbidden pairing (gold on paper) when introduced into a test file
- AT-109-2: Script flags opacity variant on dark bg
- AT-109-3: Script passes when only allowed pairings are present
- AT-109-4: contrast-lint-disable-next-line comment suppresses one violation
- AT-109-5: CI workflow fails the PR when violations are introduced
- AT-109-6: Script completes in < 5 seconds across the full codebase

## Session Notes
_(Filled by Claude Code during implementation)_
