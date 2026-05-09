<!-- APPLY: CREATE -->
# ADR-001: Ship v1 on Supabase as auth+DB+Storage triple-bind

## Status
Accepted (2026-05-04)

## Context

Per audit OBSERVATION-001 (LIKELY-MISMATCH), the v1 architecture binds three vendor-critical concerns to Supabase: authentication (`@supabase/ssr`), primary database (Postgres + RLS), and file storage (book-audio + book-covers buckets). All three are coupled at the SDK layer and at the data layer (RLS policies use `auth.uid()` which is a Supabase-specific JWT claim).

Risks from this binding:
- A multi-hour Supabase outage takes down auth, DB, and audio storage simultaneously — no partial degradation possible
- Supabase pricing curve gets steep above the Pro tier (next is Team at $599/mo)
- Vendor exit cost grows monotonically with customer count

Alternative architectures considered:
- Auth split (Clerk, WorkOS, Auth0) with Supabase remaining for DB
- Storage split (Cloudflare R2, AWS S3) with Supabase for DB + Auth
- Full extraction (self-managed Postgres + dedicated auth + R2)

## Decision

**Ship v1 on Supabase as currently designed.** Document the exit plan formally now (in `docs/architecture/VENDOR_EXIT_PLANS.md` per R-TASK-146). Set a tripwire at 5,000 paying users to reopen the question.

## Rationale

At v1 the marginal cost of splitting auth or storage exceeds the marginal benefit:
- Splitting auth means writing a JWT-translation layer between the new auth provider and Supabase RLS — non-trivial, error-prone, and adds a hop at every request
- Splitting storage means changing the audio upload + serve paths — manageable but adds another vendor relationship before launch
- Both splits add 2-3 weeks of work before launch with no customer-facing benefit

The risk that materializes most at v1 is the multi-hour outage scenario. Mitigations for v1:
- Off-Supabase backup (R-TASK-116) ensures data survives even total Supabase loss
- DR plan (R-TASK-123) documents the 4-hour RTO with restoration to alternate Postgres
- Status page (R-TASK-140) sets customer expectations during incidents

The pricing risk doesn't materialize until 5,000+ users — well past v1. The exit cost risk is monotonic but the slope is acceptable through 1,000-2,000 users.

## Consequences

**Positive:**
- v1 ships faster
- Single vendor relationship to manage during launch
- RLS policies remain simple (no auth-bridge complexity)

**Negative (accepted):**
- Outage of Supabase is full outage of product (mitigated by DR plan)
- Pricing inflexibility at scale (revisit at tripwire)
- Future migration cost grows (acceptable through customer count below tripwire)

## Tripwire

When paying user count crosses 5,000, schedule a separate decision conversation about extracting auth to a dedicated provider. Likely candidates: Clerk (developer-friendly, good Supabase integration patterns documented), WorkOS (enterprise-aligned).

The decision at the tripwire is not "must split" but "evaluate whether to split now or push to next tripwire at 10,000." Continuing at higher counts is fine; the explicit revisit is the discipline.

## Related

- OBSERVATION-001 (audit)
- R-TASK-116 (off-Supabase backup)
- R-TASK-123 (DR plan)
- R-TASK-146 (vendor exit plans documentation)
