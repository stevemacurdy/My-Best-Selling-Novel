<!-- APPLY: CREATE -->
# R-TASK-164: Press Kit Page (`app/press/page.tsx`)

## Status: NOT STARTED
## Priority: MEDIUM
## Phase: 6
## Estimated Sessions: 1
## Dependencies: TASK-002 (brand store), R-TASK-160 (`lib/markdown.ts` if used)
## Cluster: PATCH-3 round 2 v1 content cluster

## Inference Summary

| Addition | Source |
|---|---|
| Press contact + boilerplate + downloadable assets | Standard SaaS press kit; operator footer Column 4 includes "Press" |
| Operator-authored boilerplate (~200-400 words) | Press boilerplate is operator's institutional voice |
| Logo pack ZIP, founder photo, screenshot pack | Standard press kit assets |
| Press contact email (separate from /help) | Operator decision; default `press@mybestsellingnovel.com` or operator's direct email |
| No auth | TASK-007 public-routes whitelist |

## Pre-flight: re-read current state

- Confirm `/press` in middleware public-routes whitelist.
- Confirm operator has a press contact email configured (Resend domain accepts `press@`, or Steve's direct email is fine for v1).
- Operator provides asset pack (logos, screenshots) — see "Operator deliverables" below.

## Files to Create

- `app/press/page.tsx` — server component
- `public/press-kit.zip` — ZIP file containing logos, screenshots, founder photo, boilerplate
- `public/press/logo-light.svg`, `logo-dark.svg`, `logo-mark.svg` — three logo variants
- `public/press/screenshot-1.png` through `screenshot-4.png` — 4 product screenshots
- `public/press/founder-photo.jpg` — high-res Steve photo
- `content/press-boilerplate.md` — boilerplate paragraph operator commits

## Implementation Requirements

### Page structure

Hero:
- Heading: "Press Kit"
- Subheading: "Everything press, podcasts, and partners need."

Body, organized in sections:

**1. About My Best Selling Novel (boilerplate, 200-400 words):**
Render `content/press-boilerplate.md`. Operator commits standard institutional copy that publications can paste directly. Include: what the product does, when it launched, where it's based (Grantsville, UT), founder name + title, and a single contact line.

**2. Press contact:**
- Email: `press@mybestsellingnovel.com` (or operator's direct address — operator decision)
- "We respond within 48 hours."

**3. Brand assets — downloads:**
- Single CTA button: "Download full press kit (ZIP, ~5MB)" → `/press-kit.zip`
- Below: individual asset thumbnails with download links:
  - Logo light (SVG)
  - Logo dark (SVG)
  - Logo mark only (SVG)
  - Founder photo (JPG, 2400×2400)
  - 4 product screenshots (PNG, 1920×1080)

**4. Recent coverage (placeholder for v1):**
Empty section with "Coming soon — recent press will appear here" badge. Leave structure in place so operator can add `content/press-coverage.md` later (a simple markdown list of links to articles, podcasts, etc.). Track in `docs/CONTENT_TODO.md`.

**5. Quick facts (bulleted):**
- Founded: 2026
- Founder: Steve Macurdy
- Location: Grantsville, Utah
- Stack: Next.js 14, Supabase, Stripe, Anthropic Claude
- Tagline: "Stop calling yourself an aspiring author."

### Operator deliverables

Operator provides before launch:
- 3 logo variants in SVG (light, dark, mark-only) — use `lib/brand.ts` colors
- 4 product screenshots in 1920×1080 PNG
- 1 founder photo at 2400×2400 minimum
- 1 boilerplate paragraph (`content/press-boilerplate.md`)

If any are missing at v1 ship, the page renders without that asset — no placeholders for missing assets (presence implies promise).

### Brand styling

- Page background `bg-brand-navy`
- Section dividers: thin `border-b border-brand-navyLight`
- Asset thumbnails: `bg-brand-navyLight rounded p-4 hover:ring-1 hover:ring-brand-gold/40`
- Download button: brand-gold primary CTA styling

### SEO

- Page title: "Press Kit — My Best Selling Novel"
- Meta description: Boilerplate's first sentence
- OG image: dedicated press OG with logo on brand-navy
- Schema.org: `Organization` with `logo`, `foundingDate`, `founder`, `address`

### Build pipeline

The press kit ZIP is generated at build time by a small script: `scripts/build-press-kit.ts` reads from `public/press/*` and zips into `public/press-kit.zip`. Add `prebuild` step in `package.json` to invoke. Or generate manually and commit the ZIP — simpler for v1; revisit if assets change frequently.

## Tests Required

- AT-164-1: `/press` returns 200 OK without authentication
- AT-164-2: All listed asset download links return 200 (verify each href)
- AT-164-3: Press kit ZIP downloads and contains all 8 assets when extracted
- AT-164-4: Press contact email is correct (matches operator's chosen address)
- AT-164-5: `/press` in middleware public-routes whitelist
- AT-164-6: Mobile renders with stacked sections; download button full-width
- AT-164-7: If any asset missing, that thumbnail/link is omitted (not broken)

## Session Notes
_(Filled by Claude Code during implementation)_
