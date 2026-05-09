<!-- APPLY: CREATE -->
# ADR-003: Split Decision #11 into 11a (prompts) and 11b (JSX with mechanical modernization)

## Status
**APPROVED — 2026-05-05**

Approved by Steve Macurdy on 2026-05-05. Decision #11 is now split into 11a (prompts frozen, verbatim) and 11b (JSX modernizable behind golden-output behavioral tests). The five gated remediation tasks (R-TASK-109, R-TASK-110, R-TASK-126, R-TASK-127, R-TASK-128) are unblocked.

This ADR modifies existing approved Decision #11 in `ENGINEERING_DECISIONS.md`. Claude Code must update Decision #11 in the engineering decisions log on first Phase 11 session, recording the split with this ADR's date as the revision date.

## Context

Per audit OBSERVATION-003 (STRONG-MISMATCH), Decisions #11 and #13 collectively mandate that the 1,917-line agent JSX is ported "verbatim — var/function() syntax preserved, not modernized" and that "all AI prompt strings preserved word-for-word including anti-fact-scrambling rules."

The verbatim discipline is correct for two reasons:
1. AI prompt strings are fragile — changing them changes Claude's output behavior in unpredictable ways. The anti-fact-scrambling rules and step-specific instructions accumulated through testing.
2. The agent works in its current form. Resisting the instinct to "improve" it preserves tested behavior.

However, the discipline as written extends past AI prompts into JSX coding conventions:
- `var` (not `let`/`const`) — purely syntactic
- `function(){}` (not arrow) — purely syntactic
- No `useCallback` — debug pattern, not behavioral
- Inline event handlers with no stable names — fights the function-symbol map (GAP-005)
- Single 1,917-line file — fights component-level testing, lint exclusions, accessibility refactor

Five remediation tasks fight this directive:
- R-TASK-109 (contrast lint) — must exclude `components/agent/`
- R-TASK-110 (a11y baseline) — must exclude agent from WCAG conformance
- PATCH-001 (streaming /api/ai) — requires modifying the agent's `function ai()` caller
- R-TASK-130 (unit tests) — cannot test components/agent/ unit-style with verbatim inline handlers
- R-TASK-143 (UI function symbols) — agent doesn't follow the symbol map

Each fight requires a "is this modernization or is this fixing a defect?" judgment call that accumulates as cost on every TASK touching the agent.

## Decision (proposed)

**Split Decision #11 into two:**

### Decision #11a — AI prompt strings preserved verbatim (NO change from existing)
All system prompts, user-message templates, and step-specific AI instructions remain exactly as in `source/bestseller_book_agent.jsx`. Including:
- Anti-fact-scrambling rules
- Step-specific framing language
- Format/output constraints
- Tone instructions

This is non-negotiable. Changing prompts changes model behavior.

### Decision #11b — Agent JSX ported with mechanical syntax modernization (NEW)
JSX/TS code in `source/bestseller_book_agent.jsx` is ported with these mechanical modernizations explicitly allowed:
- `var` → `let` or `const` (where binding is local-scoped; preserves semantics)
- `function name(){}` → `const name = () => {}` (where there's no `this` binding to preserve)
- Inline event handler functions get stable names (e.g., `onClick={() => doX()}` becomes `onClick={handleX}` with `handleX` defined adjacent)
- Add TypeScript types to function parameters and return types where derivable
- Add `useCallback` only where measurably needed (re-render profiling shows benefit)
- Split the single 1,917-line file into per-step components (S0.tsx through S11.tsx + Shared.tsx) — file structure changes only, contents preserved

Forbidden:
- Behavior changes
- Step ordering changes
- State shape changes
- Removing or adding any UI elements
- Changing AI prompts (Decision #11a still applies)
- Removing any of the agent's existing features

### Behavioral verification

To prove no behavioral regression: build a golden-output test fixture.
- For 5 representative agent flows (e.g., "fantasy novel about a librarian", "thriller about a private investigator", etc.), run the v1 agent end-to-end
- Capture the AI prompt text and step transitions at each step
- After Decision #11b modernization, run the same fixtures
- Assert: prompt text identical, step transitions identical, final JSON output equivalent

This test (in R-TASK-131 Playwright suite) replaces the syntax-anchored verification.

## Rationale

The verbatim-port directive was right when the agent was a sandbox prototype that worked and the goal was preservation. As entry to a SaaS-at-scale codebase, applying the discipline to syntax preserves syntax, not behavior. Behavior is what we care about.

A behavioral test is what locks in behavior. Once that test exists, mechanical syntax modernization is safe and unlocks:
- Component-level testing
- Per-step accessibility refactor in v1.1
- Streaming refactor at v1 (PATCH-001)
- Function-symbol map application (GAP-005)
- Contrast lint inclusion (R-TASK-109)

## Consequences if approved

**Positive:**
- All five remediation tasks above proceed cleanly
- Future contributors can apply standard patterns to agent code
- Per-step files enable lazy loading + component testing
- Type safety extends through the agent

**Negative:**
- Building the golden-output test fixture is ~1 session of additional work
- The modernization itself is ~2 sessions of careful diff review
- Risk: a mechanical change subtly changes behavior (mitigated by golden tests)

## Consequences if rejected

**The verbatim-port directive remains as written.** Implication:
- R-TASK-109 contrast lint excludes agent (gap remains for components/agent/)
- R-TASK-110 a11y baseline excludes agent (limited WCAG conformance)
- PATCH-001 streaming requires either accepting non-streaming AI (capping at ~6K tokens, breaking Decision #25) or breaking Decision #11 informally to allow the network-layer change
- v1.1 a11y refactor of agent waits for a future ADR
- This ADR re-opened in v1.1 with same considerations

## Recommendation

**Approve.** The behavioral test is the right anchor for "we preserved the agent." Syntax-anchored verification is brittle; behavior-anchored verification is durable.

## Decision Record

```
Approved: Steve Macurdy   Date: 2026-05-05
```

Engineering Decisions log update required on first Phase 11 session: Decision #11 split into 11a (AI prompt strings — frozen, verbatim, behavioral test enforces) and 11b (JSX coding conventions — modernizable provided behavioral tests pass). Decision #13 audit-trail discipline preserved.

## Related

- OBSERVATION-003 (audit)
- ENGINEERING_DECISIONS.md Decision #11 (existing)
- ENGINEERING_DECISIONS.md Decision #13 (existing)
- R-TASK-109, R-TASK-110, PATCH-001, R-TASK-130, R-TASK-143
