<!-- APPLY: REPLACE -->
<!-- Target: docs/TASKS/TASK-062-brand-consistency.md (in original mybsn package) -->
<!-- Backup: docs/EXPANDED-TASKS/backups/TASK-062-brand-consistency.pre-expansion-backup.md -->
<!-- Expanded 2026-05-09 from 91 words to ~960 words via PATCH-3 sub-deliverable B.3.
     This is the sitewide brand-consistency sweep — addresses Q-6.6 deferral from TASK-043. -->

# TASK-062: Brand Consistency Sweep

## Status: NOT STARTED
## Priority: HIGH
## Phase: 9
## Estimated Sessions: 2
## Dependencies: TASK-002 (brand store), TASK-043 (landing page locked first), TASK-057 (legal pages canonical naming)
## Requirements Covered: R12, R32
## Spec Reference: Section 9.5

## Inference Summary

| Addition | Source |
|---|---|
| Search-replace targets enumerated | Q-9.13 operator-answer (use default) |
| Per-page meta descriptions | Q-9.14 operator-answer (use default) |
| OG + Twitter Card meta on every page | Q-9.15 operator-answer (use default) |
| Full favicon set (apple-touch + manifest icons) | Q-9.16 operator-answer (use default) |
| ADR-003 verbatim port preserved (agent files exempt from rename sweep) | ADR-003 |
| Domain canonical: mybestsellingnovel.com | Decision #26 |

Operator confirmed all questions on 2026-05-08.

## Pre-flight: re-read current state

- View ALL files containing strings to be replaced. Run a global grep before mutations:
  ```bash
  grep -rn "Bestseller Book Agent\|books\.woulfai\.com\|MyBSN" app/ components/ lib/ docs/ public/ \
    --include='*.ts' --include='*.tsx' --include='*.md' --include='*.html'
  ```
- Confirm ADR-003 verbatim-port boundaries: agent files in `lib/agent/`, `bestseller_book_agent.jsx`, `bestseller_demo.jsx` (or wherever they ended up post-port) are exempt — those keep their original variable names and component names per ADR-003. Marketing/UX text WITHIN those files that's user-visible may still be renamed if it's not behavior-affecting; confirm case-by-case.
- View `app/layout.tsx` for current meta tag setup; this task standardizes per-page metadata.
- Confirm `public/` directory structure for favicon assets.

## Files to Create/Modify

- All files containing legacy brand strings (mass MODIFY via grep + sed or careful manual edits)
- `app/layout.tsx` (MODIFY) — root metadata + favicon links
- Per-page `metadata` exports in `app/*/page.tsx` (MODIFY each)
- `public/favicon.ico`, `apple-touch-icon.png`, `icon-192.png`, `icon-512.png`, `manifest.json` (NEW)
- `public/og-image.png` — default brand OG (NEW)

## Implementation Requirements

### Search-replace targets (Q-9.13)

Mechanical replacements (case-sensitive):

| From | To | Scope |
|---|---|---|
| `Bestseller Book Agent` | `My Best Selling Novel` | All non-agent files |
| `bestseller_book_agent` | (preserve as-is) | ONLY in `lib/agent/` and other ADR-003 verbatim-port files; rename elsewhere to `mybsn_book_agent` if used as identifier |
| `books.woulfai.com` | `mybestsellingnovel.com` | All files |
| `Book Agent` (standalone, not "Bestseller Book Agent") | `My Best Selling Novel` | Non-agent files only |
| `MyBSN` (uppercase shorthand) | (preserve as-is in dev docs only; replace with `My Best Selling Novel` in user-facing files) | User-facing files: replace; internal dev docs: keep |
| `WOULF` / `woulf-ai-platform` (legacy repo refs) | (preserve in repo metadata; this is `github.com/stevemacurdy/ai-agent-platform` per WoulfAI standing orders) | Documentation links only |

Run as **two passes**: first the mechanical grep+replace on non-agent files; second a manual review of agent files to ensure no inadvertent renames violate ADR-003.

After replacement, verify with:
```bash
# Should return zero results outside lib/agent/ and verbatim-port files
grep -rn "Bestseller Book Agent" app/ components/ lib/ docs/ \
  --include='*.ts' --include='*.tsx' --include='*.md' \
  | grep -v "lib/agent/" | grep -v "bestseller_book_agent.jsx"
```

### Per-page meta descriptions (Q-9.14)

Each page exports `metadata`:

```tsx
// Example for app/page.tsx
export const metadata: Metadata = {
  title: 'Stop calling yourself an aspiring author. — My Best Selling Novel',
  description: 'Outline to published novel in six weeks. AI-powered novel writing for indie authors. From blank page to bestseller list — guided 12-step agent, three-path manuscript intake, built-in marketing intelligence.',
  // ...
};
```

Page-specific descriptions (samples; operator may refine voice):
- `/`: hero+pitch summary
- `/pricing`: "Simple pricing: free Explorer tier with 1 book + 25 AI calls, or upgrade to Author ($29/mo) for unlimited books. 14-day money-back guarantee."
- `/tour`: "14-stop guided walkthrough of the My Best Selling Novel agent. See exactly how the 12 steps from outline to published novel work."
- `/help`: "Step-by-step tutorial covering all 12 steps of the My Best Selling Novel writing agent."
- `/genres`: "Every fiction and non-fiction category we support. Browse demand and competition data, then start writing."
- `/sample-chapter`: "What an AI-written first chapter actually reads like."
- `/about`, `/founders-note`: brief context (operator drafts as part of page content commitment)
- `/publish/kdp-setup`, `/publish/cover-design`, etc.: per-guide descriptions per cluster R-TASKs
- `/press`: "Press kit, brand assets, founder photo, and contact for press, podcasts, and partners."
- `/affiliate`: "Help writers find us. Earn 30% recurring commission. Join the waitlist."
- `/legal`, `/terms`, `/privacy`, `/refunds`, etc.: simple "[Policy name] for My Best Selling Novel."

Cluster pages get descriptions per their R-TASK SEO sections (R-TASK-160 through R-TASK-176).

### OG + Twitter Card meta (Q-9.15)

Default brand OG image at `public/og-image.png`: 1200×630, brand-navy background, brand-gold "My Best Selling Novel" wordmark, hero tagline embedded ("Stop calling yourself an aspiring author."). Per page, the metadata override allows custom OG (e.g., `/sample-chapter` may want a different OG).

```tsx
// app/layout.tsx — defaults; pages override
export const metadata: Metadata = {
  metadataBase: new URL('https://mybestsellingnovel.com'),
  openGraph: {
    type: 'website',
    siteName: 'My Best Selling Novel',
    locale: 'en_US',
    images: [{ url: '/og-image.png', width: 1200, height: 630, alt: 'My Best Selling Novel' }],
  },
  twitter: {
    card: 'summary_large_image',
    site: '@mybestsellingnovel',  // operator confirms handle if claimed; else omit
    creator: '@stevemacurdy',  // operator confirms handle if claimed; else omit
    images: ['/og-image.png'],
  },
};
```

If operator hasn't claimed Twitter handles by launch, omit `site` + `creator` keys; the cards still render with the image.

### Favicon set (Q-9.16)

Generate from a single source SVG (brand-gold pen icon on brand-navy):

| File | Size | Purpose |
|---|---|---|
| `public/favicon.ico` | 32×32 multi-resolution | Browser tab |
| `public/apple-touch-icon.png` | 180×180 | iOS home screen |
| `public/icon-192.png` | 192×192 | Android / PWA |
| `public/icon-512.png` | 512×512 | Android / PWA splash |
| `public/manifest.json` | — | PWA descriptor |

```json
// public/manifest.json
{
  "name": "My Best Selling Novel",
  "short_name": "MyBSN",
  "icons": [
    { "src": "/icon-192.png", "sizes": "192x192", "type": "image/png" },
    { "src": "/icon-512.png", "sizes": "512x512", "type": "image/png" }
  ],
  "theme_color": "#0f1b33",
  "background_color": "#0f1b33",
  "display": "standalone",
  "start_url": "/"
}
```

Tools: `realfavicongenerator.net` accepts a single SVG and outputs the full set; or generate manually from operator's source asset.

`app/layout.tsx` Head includes:
```html
<link rel="icon" href="/favicon.ico" sizes="32x32" />
<link rel="apple-touch-icon" href="/apple-touch-icon.png" />
<link rel="manifest" href="/manifest.json" />
<meta name="theme-color" content="#0f1b33" />
```

### Mechanical post-sweep verification

After completing the sweep, run verification:

```bash
# 1. No legacy brand strings remain in user-facing surfaces
grep -rn "Bestseller Book Agent" app/ components/ docs/ --include='*.tsx' --include='*.ts' --include='*.md' \
  | grep -v "ADR-003-verbatim-port" \
  | grep -v "audit-history" && echo "FAIL: legacy strings still present" && exit 1

# 2. Every page has metadata export
for f in app/**/page.tsx; do
  grep -q "export const metadata" "$f" || echo "MISSING metadata in $f"
done

# 3. Favicon set complete
for asset in favicon.ico apple-touch-icon.png icon-192.png icon-512.png manifest.json og-image.png; do
  [ -f "public/$asset" ] || echo "MISSING public/$asset"
done

echo "Brand consistency sweep verified"
```

## What this task does NOT do

- Does NOT modify agent code (ADR-003 verbatim port)
- Does NOT change package.json or repo name (`stevemacurdy/ai-agent-platform` per WoulfAI standing orders — internal repo identifier; brand-facing user content uses "My Best Selling Novel")
- Does NOT change file/component names within the agent's port (`bestseller_book_agent.jsx`, etc.)
- Does NOT generate the actual OG/favicon assets — operator commits source assets

## Tests Required

- AT-267: Mechanical grep returns zero "Bestseller Book Agent" matches outside agent verbatim-port files
- AT-268: Every `app/**/page.tsx` file exports a `metadata` object
- AT-269: All 6 favicon assets present in `public/`
- AT-270: `app/layout.tsx` includes favicon link tags + manifest + theme-color
- AT-271: Default OG image renders correctly when shared on Facebook/LinkedIn (manual test via debugger tools)
- AT-272: Twitter Card debugger validates metadata structure
- AT-273: Mobile theme color (`#0f1b33`) shows as browser chrome on iOS Safari + Chrome Android
- AT-274: PWA manifest valid (Lighthouse audit passes PWA basics — installability acceptable; full PWA service worker deferred to v1.1)

## Session Notes
_(Filled by Claude Code during implementation)_
