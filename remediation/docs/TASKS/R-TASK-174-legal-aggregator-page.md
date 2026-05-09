<!-- APPLY: CREATE -->
# R-TASK-174: Legal Aggregator Page (`app/legal/page.tsx`)

## Status: NOT STARTED
## Priority: HIGH
## Phase: 8
## Estimated Sessions: 1
## Dependencies: TASK-002 (brand store), TASK-057 (ToS), R-TASK-119 (legal pages cluster), TASK-007 (public-routes whitelist)
## Cluster: PATCH-3 round 2 v1 content cluster

## Inference Summary

| Addition | Source |
|---|---|
| Single index page listing all 9 legal policies | Q-H operator-answer (single `/legal` link from footer footnote line) |
| Each policy: name, 1-2 sentence description, "last updated" date, link | Standard legal-aggregator pattern |
| Public route, no auth | TASK-007 |
| `/legal` linked from footer footnote line: "Legal · Built by WoulfAI" | Q-H operator-answer (footnote line option 1) |
| No content of the policies themselves — just an index | This page is a navigation surface; policies live at /terms, /privacy, etc. |

## Pre-flight: re-read current state

- Confirm R-TASK-119 has shipped or is in plan — defines the 9 legal pages.
- Confirm TASK-057 has shipped (Terms of Service) — referenced from the index.
- Confirm `/legal` in middleware public-routes whitelist.
- Each linked policy page must exist before this index is useful (otherwise dead links — operator's stated principle).

## Files to Create

- `app/legal/page.tsx` — server component
- `lib/legal-pages.ts` — exports `LEGAL_PAGES` array used here and elsewhere (e.g., footer dropdown if added later)

## Implementation Requirements

### Page structure

Hero:
- Heading: "Legal"
- Subheading: "Everything legal we have to publish, in one place. Plain language where we can; lawyer language where we have to."

Body — list of all 9 policies. Each entry:
- Policy name (h3, brand-white)
- 1-2 sentence plain-language description (body text, brand-textMuted)
- "Last updated: [date]" (small, brand-textMuted)
- "Read the full policy →" link to the policy URL

The 9 policies (sourced from R-TASK-119):

1. **Terms of Service** (/terms)
   _The contract between you and us. What we're providing, what we're not, what happens if things go wrong._

2. **Privacy Policy** (/privacy)
   _What data we collect, why, how long we keep it, and your rights to access or delete it._

3. **Refund Policy** (/refunds)
   _14-day money-back guarantee on all paid plans. The window, the process, what's covered._

4. **Acceptable Use Policy** (/aup)
   _What you can and can't do with the platform. Inline summary in the ToS; full text here._

5. **Cookies Policy** (/cookies)
   _What cookies we use, what they do, and how to opt out (where applicable)._

6. **DMCA Policy** (/dmca)
   _How copyright holders can request takedowns; how to file counter-notices; our designated agent for service._

7. **AI/ML Disclosure** (/ai-disclosure)
   _Our use of large language models in the agent — Anthropic Claude, our prompts, our handling of model outputs and your inputs._

8. **Vulnerability Disclosure Policy** (/vuln-disclosure)
   _How security researchers can report vulnerabilities to us responsibly. 90-day disclosure timeline, no bounty program in v1._

9. **Accessibility Statement** (/a11y-statement)
   _Our commitment to WCAG 2.1 AA compliance, what's currently compliant, and where we're still working._

### `lib/legal-pages.ts`

```typescript
export interface LegalPage {
  slug: string;          // e.g., 'terms'
  url: string;           // e.g., '/terms'
  title: string;
  description: string;
  lastUpdated: string;   // ISO 8601 date
}

export const LEGAL_PAGES: LegalPage[] = [
  { slug: 'terms', url: '/terms', title: 'Terms of Service', description: '...', lastUpdated: '2026-05-08' },
  { slug: 'privacy', url: '/privacy', title: 'Privacy Policy', description: '...', lastUpdated: '2026-05-08' },
  // ... 9 entries total
];
```

The `lastUpdated` dates auto-update when each policy page's source markdown changes (or operator manually updates this array on publication). For v1, manual is fine.

### Closing block

- Plain-language statement: "Have a question we don't answer? [Email us](mailto:legal@mybestsellingnovel.com) or [hit support](/help)."
- Operator decides whether to use a dedicated `legal@` inbox or route to `help@` (R-TASK-107). Default: route to help inbox; add `legal@` only if volume justifies it.

### Brand styling

- Page background `bg-brand-navy`
- Each policy entry: `bg-brand-navyLight rounded p-6 my-3 hover:ring-1 hover:ring-brand-gold/30`
- Stack in single column; max-w-[720px] centered
- "Last updated" date: small, brand-textMuted

### SEO

- Page title: "Legal — My Best Selling Novel"
- Meta description: "Terms, privacy, refunds, cookies, DMCA, AI disclosure, vulnerability disclosure, and accessibility — all in one place."
- OG image: brand OG fallback
- No Schema.org structured data (this is a navigation page, not content)

### Analytics

- GA event `legal_index_view` on page load
- GA event `legal_page_click` on each policy link click (with `policy_slug` property)

### Footer integration

The footnote line below the © in the footer (per Q-H operator-answer option 1) reads:

`Legal · Built by WoulfAI`

Both items are links: "Legal" → `/legal`, "Built by WoulfAI" → operator-decided URL (woulfai.com or wherever; operator commits before launch). This integration ships in TASK-043 footer expansion; cross-bind in TASK-043 Pre-flight notes.

## Tests Required

- AT-174-1: `/legal` returns 200 OK without authentication
- AT-174-2: All 9 policy entries render with name + description + last-updated + link
- AT-174-3: Each policy link returns 200 (verify each is in plan/shipped; if any is "Coming soon," badge it with `<ComingSoonBadge>`)
- AT-174-4: GA `legal_page_click` event fires with correct `policy_slug` property
- AT-174-5: `/legal` in middleware public-routes whitelist
- AT-174-6: Mobile renders single-column with full-width entries
- AT-174-7: `lib/legal-pages.ts` exports `LEGAL_PAGES` array; importable from footer + this page + future surfaces

## Session Notes
_(Filled by Claude Code during implementation)_
