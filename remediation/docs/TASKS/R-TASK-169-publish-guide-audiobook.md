<!-- APPLY: CREATE -->
# R-TASK-169: Audiobook Guide (`app/publish/audiobook/page.tsx`)

## Status: NOT STARTED
## Priority: HIGH
## Phase: 6
## Estimated Sessions: 1 (page shell) + ~3,000 words of operator-authored content
## Dependencies: TASK-002, R-TASK-160 (`lib/markdown.ts`), R-TASK-165 (`<GuideTOC>` + `<ComingSoonBadge>`), TASK-038 (agent S6 audio capability)
## Cluster: PATCH-3 round 2 v1 content cluster

## Inference Summary

| Addition | Source |
|---|---|
| Long-form guide structure mirroring sibling guides | Sibling guide consistency (R-TASK-165, 166, 167) |
| Cross-binds to agent S6 audio recording (TASK-038) | Q-D operator-answer (use default — market the existing capability); ADR-003 verbatim port |
| ACX + Findaway Voices + alternative distributors | Standard self-pub audiobook content |
| Narrator hire vs DIY framework | Mirrors R-TASK-166 cover design DIY-vs-hire pattern |
| **No new product / service in v1** | Q-D default — guide markets existing agent capability, does not introduce a separate audiobook service |
| Realistic cost numbers | Operator commits to ~$100-300/finished-hour narrator hire ranges accurate as of 2026 |

## Pre-flight: re-read current state

- Confirm R-TASK-165 has shipped (`<GuideTOC>` + `<ComingSoonBadge>`).
- Confirm `/publish/audiobook` in middleware public-routes whitelist.
- Confirm agent S6 audio recording works in v1 (TASK-038 verbatim port + TASK-019 audio API). The guide cross-references S6 as the in-app option for DIY narration.
- Operator decides ship state per Q-G commitment.

## Files to Create

- `app/publish/audiobook/page.tsx` — server component
- `content/publish/audiobook.md` — operator-authored guide content

## Implementation Requirements

### Page structure

Hero:
- Heading: "Audiobook — The Other 30% of the Market"
- Subheading: "Audio is the fastest-growing format in fiction. Here's how to get yours into Audible without losing your mind or your money."

Body — 7 sections:

1. **Why audiobook matters now** — market size (~30% of fiction listening hours by 2026), genre skew (Romance, Thriller, Sci-Fi/Fantasy convert highest), commute and chore-time consumption pattern
2. **Three paths to a finished audiobook** — DIY (you record using the agent's S6 step), hire a narrator (ACX or direct), royalty-share-with-narrator (no upfront cost, split 50/50 with narrator)
3. **Path 1: DIY in-app narration** — Cross-binds to agent S6: "Step 6 of the My Best Selling Novel agent records your narration chapter-by-chapter. Output is webm/mp4 ready for export." When DIY makes sense (you have a strong reading voice, your genre is non-fiction or memoir, your budget is zero); when DIY doesn't (your genre is heavy dialogue with multiple character voices, English isn't your first language and the audiobook's English is the product, you have a perfectionism gene)
4. **Path 2: Hire a narrator** — typical rates $100-300/finished-hour as of 2026; a 70K-word novel = ~9 finished hours = $900-2,700 narrator cost; how to audition (sample paragraph approach), how to direct (style guide; pronunciation list; 3 character voice notes max)
5. **Path 3: Royalty share via ACX** — no upfront cost; 50/50 royalty split for life of contract; you have to be Audible exclusive (37.5% royalty); pros (zero cash); cons (exclusivity, 7-year minimum contract, narrator quality varies)
6. **ACX (Audible) vs Findaway Voices vs alternatives** — ACX exclusive: 37.5% royalty, Audible/Amazon/iTunes only; ACX non-exclusive: 25% royalty, same distribution; Findaway Voices: 80% royalty (after distributor cut), distributes to 30+ retailers including libraries, no exclusivity. Honest take: Findaway for prolific authors with non-Audible audience; ACX for first-timers
7. **Technical specs and mastering** — file format (44.1kHz / 192kbps minimum), per-chapter file structure, RMS levels, peak ceiling, room tone consistency, Audacity vs Auphonic for mastering pass

Closing:
- Pull-quote: something like "An audiobook isn't a different book. It's the same book, told to someone driving home."
- CTA: "Start Chapter One →" (the agent's S6 step is included on every paid plan — the audio capability is built in, not an add-on)

### Cross-bind to agent S6

In Section 3, include a prominent callout block:

```
[ Built into every plan ]
Step 6 of the My Best Selling Novel agent guides you through chapter-by-chapter
narration. Click record. Read. Save. Export to webm or mp4 ready for ACX upload.
This is included on Author and Publisher tiers — no add-on, no extra fee.
```

### Tier alignment

The guide markets audio recording as a feature of paid tiers (per Q-D default — no new product). Make sure the page does NOT imply "Audiobook Add-On" as a separate purchase. Despite the operator's footer column 2 listing "Audiobook Add-On," the guide content frames it as an included capability. Operator may want to revisit the footer label to "Audiobook" (drop "Add-On") to avoid confusion. Flag in TASK-043 footer expansion Pre-flight.

### Operator content commitment

`content/publish/audiobook.md`. Recommended length: ~3,000 words. The narrator-hire rate ranges ($100-300/hour) and ACX royalty percentages should be verified at write time — these change. Add to `docs/CONTENT_REVIEW_SCHEDULE.md` for 6-month review cycle (alongside R-TASK-167 ISBN/copyright).

If shipping with placeholder: same `<ComingSoonBadge>` pattern; cross-bind callout to S6 still shows even in placeholder mode (the agent capability exists regardless of guide content readiness).

### Brand styling

- Same long-form patterns as siblings
- "Built into every plan" callout: `bg-brand-gold/10 border-l-4 border-brand-gold p-4 my-6`

### SEO

- Page title: "Audiobook Self-Publishing — DIY, Hire, or Royalty Share?"
- Meta description: Operator-authored ~150 chars
- OG image: `/og-images/publish-audiobook.png`
- Schema.org `HowTo` for the 7 sections

## Tests Required

- AT-169-1: `/publish/audiobook` returns 200 OK without authentication
- AT-169-2: All 7 section anchors exist
- AT-169-3: "Built into every plan" callout in Section 3 renders prominently
- AT-169-4: Cross-link to agent S6 step (in /tour or /how-it-works) present
- AT-169-5: No language implies audiobook is a separate paid add-on
- AT-169-6: `<ComingSoonBadge>` renders correctly in placeholder mode; cross-bind callout still shows
- AT-169-7: `docs/CONTENT_REVIEW_SCHEDULE.md` includes this guide for 6-month review
- AT-169-8: Mobile renders single-column

## Session Notes
_(Filled by Claude Code during implementation)_
