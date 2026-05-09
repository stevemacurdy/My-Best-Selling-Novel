# CONTENT_REVIEW_SCHEDULE.md

**Purpose:** Schedule for reviewing time-sensitive content. Some claims, rates, and legal positions drift over months; this doc lists what to review, when, and what to verify.

**Last updated:** 2026-05-09 (created in PATCH-3 round 2 v1 cluster delivery).

---

## 6-month review cycle

These contain rates, royalty math, or evolving legal positions. Review every 6 months and update if drift is material.

| Content | Path | What to verify |
|---|---|---|
| ISBN & Copyright guide | `/publish/isbn-copyright` | (1) Bowker single-ISBN price (currently $125 single / $295 for 10); (2) US Copyright Office basic registration fee (currently $45); (3) Copyright Office AI guidance — June 2024 position is "human-authored portions copyrightable; AI-generated portions not"; verify whether updated guidance has shipped |
| Audiobook guide | `/publish/audiobook` | (1) Narrator hire rates ($100-300/finished hour as of 2026); (2) ACX exclusive royalty (currently 37.5%); ACX non-exclusive (currently 25%); (3) Findaway Voices royalty (currently 80% after distributor cut); (4) ACX 7-year royalty-share contract length |
| Print on Demand guide | `/publish/print-on-demand` | (1) KDP Print royalty math (currently 60% list minus print cost minus 40% Amazon cut); (2) IngramSpark setup fee (currently ~$49 per title or free with their on-demand toggle); (3) Trim sizes by genre — verify market preferences haven't shifted |
| KDP Setup guide | `/publish/kdp-setup` | (1) KDP royalty bands (35% vs 70%; the $9.99 cliff); (2) KDP Select exclusivity terms; (3) KPF format requirements; (4) Description character limit (currently 4,000) |
| Cover Design guide | `/publish/cover-design` | (1) Designer hire rate ranges (currently $300-$1,500); (2) Tool list (Canva, BookBolt, Photoshop, Affinity Publisher); (3) KDP cover specs |
| Stripe API version | `lib/stripe.ts` | Current pinned version vs latest stable; consider upgrading on a 12-month cadence |
| Anthropic model identifier | Wherever model is passed in `app/api/ai/` calls | Currently `claude-sonnet-4-5` (audit date 2026-05-04); verify still GA + competitive |

---

## 12-month review cycle

| Content | Path | What to verify |
|---|---|---|
| Rotating literary quotes | `lib/literary-quotes.ts` | Refresh curated list annually; rotate in new authors; remove any quotes that have become overused or fall out of cultural rotation |
| Genre demand/competition scores | `lib/genre-scores.ts` | Per ADR-003 these mirror the agent's S0 Genre Scanner. When the agent's scores update (ADR-003 verbatim port — only update agent, then sync `lib/genre-scores.ts`), this doc is the trigger |
| About page (`/about`) | `content/about.md` | Update to reflect current product reality, team, and milestones |
| Founder's note (`/founders-note`) | `content/founders-note.md` | Operator decides whether to refresh; some founder notes age well, some don't |
| Press boilerplate | `content/press-boilerplate.md` | Update with new milestones, customer count, traction numbers |

---

## Trigger-based review (not on calendar)

Review immediately if any of these happen:

- US Copyright Office issues new AI guidance → update R-TASK-167 ISBN/copyright guide
- Stripe deprecates an API version → bump `lib/stripe.ts` per `docs/STRIPE_SETUP.md`
- Anthropic releases a major Claude model upgrade → evaluate switching `app/api/ai/` model parameter
- Operator's mailing address changes → update postal address in `lib/emails/_layout.tsx` (CAN-SPAM compliance)
- Resend's free-tier limits change → re-evaluate vendor choice if newsletter volume strains
- Vercel pricing changes → re-evaluate hosting at scale gate
- Supabase Auth flow changes → re-verify TASK-007 middleware + TASK-009 signin/forgot still work
- Stripe Tax becomes worth enabling (operator's choice; Q-4.3 deferred to v1.1) → re-run TASK-020 STRIPE_SETUP.md Section 2
- Affiliate program is ready to launch → R-TASK-172 evolves; tracking infra ships per `docs/AFFILIATE_v1_1_PLAN.md`

---

## Sign-off after each review

When operator completes a review cycle, append to this file under "Review history":

```markdown
## Review history

### 2026-11-09 (6-month review)
- ISBN guide: Bowker raised single-ISBN to $135. Updated `content/publish/isbn-copyright.md`.
- Audiobook guide: ACX exclusive royalty unchanged at 37.5%. No update.
- Anthropic model: bumped to `claude-sonnet-4-7` (Sonnet upgrade Q4 2026). Updated all AI route calls.
- ...
```

This produces an auditable trail of when content was last refreshed.
