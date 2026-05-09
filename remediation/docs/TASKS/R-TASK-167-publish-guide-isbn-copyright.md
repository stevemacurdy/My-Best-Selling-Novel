<!-- APPLY: CREATE -->
# R-TASK-167: ISBN & Copyright Guide (`app/publish/isbn-copyright/page.tsx`)

## Status: NOT STARTED
## Priority: HIGH
## Phase: 6
## Estimated Sessions: 1 (page shell) + ~3,000 words of operator-authored content
## Dependencies: TASK-002, R-TASK-160 (`lib/markdown.ts`), R-TASK-165 (`<GuideTOC>` + `<ComingSoonBadge>`), TASK-057 (ToS for copyright cross-bind)
## Cluster: PATCH-3 round 2 v1 content cluster

## Inference Summary

| Addition | Source |
|---|---|
| Long-form guide structure mirroring R-TASK-165 | Sibling guide consistency |
| Cross-binds to TASK-057 ToS "you retain copyright" language | TASK-057 expansion + standard self-pub legal hygiene |
| Includes "Bowker (US) vs Amazon free ISBN" decision | Standard self-pub content |
| Includes US Copyright Office registration walkthrough | Operator-targeted guide for US authors; non-US authors see brief callout |
| **Disclaimer prominent: not legal advice** | Legal-tinged content; operator should mirror TASK-057 caveat |

## Pre-flight: re-read current state

- Confirm R-TASK-165 ships first (provides `<GuideTOC>` and `<ComingSoonBadge>`).
- Confirm `/publish/isbn-copyright` in middleware public-routes whitelist.
- Confirm TASK-057 is in place — the cover language ("you retain copyright to manuscript content; AI-generated content is not copyrightable; operator does not assert rights") is what this guide cross-references.
- **Important:** This guide brushes against legal territory. Operator should review prose with counsel before launch — especially the copyright registration section and the "what registration buys you" claims.

## Files to Create

- `app/publish/isbn-copyright/page.tsx` — server component
- `content/publish/isbn-copyright.md` — operator-authored guide content

## Implementation Requirements

### Page structure

Hero:
- Heading: "ISBN and Copyright — The Boring Stuff That Matters"
- Subheading: "Two questions every self-pub author asks. Two answers nobody explains clearly. Here's the honest version."

**Disclaimer banner (prominent, brand-warning subtle styling, top of body, before TOC):**
> This guide is for US authors and reflects general practice as of mid-2026. It is not legal advice. For specific situations — work-for-hire, co-authorship, foreign rights, AI-generated content questions — consult a qualified attorney.

Body — 6 sections:

1. **What an ISBN actually is** — the registry, what it tracks, who needs one (publishers vs retailers vs metadata systems)
2. **Do you need an ISBN?** — Amazon ebook (no, KDP assigns ASIN); Amazon paperback (free KDP-assigned available); paperback distributed beyond Amazon (yes, you need your own); audiobook (typically yes via ACX)
3. **Bowker (US) vs Amazon free ISBN — the trade-off** — Bowker $125 single / $295 for 10; Amazon free but lists Amazon as publisher of record (cosmetic for most authors; matters for institutional sales). Honest take: most indie authors use Amazon free for ebook + first paperback; spring for Bowker once they're publishing 10+ titles or hitting non-Amazon distribution.
4. **Copyright basics** — automatic upon fixation in tangible form; registration is optional but valuable; what registration buys you (statutory damages, attorney's fees, prima facie evidence in litigation); the 3-month-after-publication deadline that matters
5. **Registering with the US Copyright Office** — eCO portal walkthrough, $45 single-author basic registration, the 3 typical deposit copies, processing timeline (currently ~6-12 months online, faster paper)
6. **AI and copyright — the unsettled part** — current Copyright Office position (June 2024 guidance: human-authored portions copyrightable; AI-generated portions not); what that means for agent-generated chapters; cross-link to TASK-057 ToS for the "operator-author retains copyright to your work" language

Closing:
- Repeat disclaimer in smaller text
- Pull-quote: something like "An ISBN is the cheapest way to look serious. Copyright registration is the cheapest insurance you'll ever buy."
- CTA: "Start Chapter One →"

### Cross-bind to TASK-057

In Section 6, include a callout: "Our [Terms of Service](/terms) reflects this position: you retain full copyright to your manuscript content. We claim no rights. AI-generated content is not separately owned by us. See the Content Ownership section of the ToS for the exact language."

### Operator content commitment

`content/publish/isbn-copyright.md`. Recommended length: ~3,000 words. The "AI and copyright" section is the most likely to date — operator should plan for review every 6-12 months as Copyright Office guidance evolves. Track that in `docs/CONTENT_REVIEW_SCHEDULE.md` (created here as a small additive doc).

If shipping with placeholder: `<ComingSoonBadge>` pattern; the disclaimer banner still shows.

### Brand styling

- Disclaimer banner: `bg-brand-warning/10 border-l-4 border-brand-warning p-4 my-6 text-sm`
- Otherwise same long-form patterns as R-TASK-165, R-TASK-166

### SEO

- Page title: "ISBN and Copyright for Self-Published Authors — A Practical Guide"
- Meta description: Operator-authored ~150 chars
- OG image: `/og-images/publish-isbn.png`
- Schema.org `HowTo` for the 6 sections

## Tests Required

- AT-167-1: `/publish/isbn-copyright` returns 200 OK without authentication
- AT-167-2: Disclaimer banner renders prominently above content
- AT-167-3: All 6 section anchors exist
- AT-167-4: Cross-link to `/terms` Content Ownership section present
- AT-167-5: `<ComingSoonBadge>` renders if shipping placeholder; disclaimer banner still shows even in placeholder mode
- AT-167-6: `docs/CONTENT_REVIEW_SCHEDULE.md` exists with this guide listed for 6-month review cycle
- AT-167-7: Mobile renders single-column with disclaimer banner full-width at top

## Session Notes
_(Filled by Claude Code during implementation)_
