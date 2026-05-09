<!-- APPLY: REPLACE -->
<!-- Target: docs/TASKS/TASK-005-lazy-sdks.md (in original mybsn package) -->
<!-- Backup: docs/EXPANDED-TASKS/backups/TASK-005-lazy-sdks.pre-expansion-backup.md -->
<!-- Expanded 2026-05-08 from 110 words to ~840 words via PATCH-3 sub-deliverable B.3. -->

# TASK-005: Lazy SDK Clients (`lib/stripe.ts`, `lib/claude.ts`, `lib/resend.ts`)

## Status: NOT STARTED
## Priority: CRITICAL
## Phase: 1
## Estimated Sessions: 1
## Dependencies: TASK-001, TASK-003
## Requirements Covered: R7, R20
## Spec Reference: Section 1.5

## Inference Summary

This expanded task replaces the original 110-word TASK-005. Each addition is sourced as follows:

| Addition | Source |
|---|---|
| Lazy init pattern (no module-level instantiation) | ENGINEERING_DECISIONS Decision #10 + WoulfAI rule 13 |
| Stripe API version pinned to latest stable at ship date | Q-1.9 operator-answer (use default — latest stable, document choice) |
| Claude model passed by route, not in lib | Q-1.10 operator-answer (use default) |
| Resend "from" address from env var | Q-1.11 operator-answer (use default — env var, RESEND_FROM_EMAIL) |
| Timeout values: Anthropic 60s, Stripe 30s, Resend 30s | Q-1.12 operator-answer (use default); PATCH-001 maxDuration alignment for Anthropic |
| Cross-binding to PATCH-001 streaming refactor for Anthropic | PATCH-001 task body |
| Cross-binding to TASK-024 (webhook) and TASK-053-056 (email) | TASK-024 + TASK-054/055/056 expansions |

Operator confirmed all questions on 2026-05-08.

## Pre-flight: re-read current state

- View `lib/stripe.ts`, `lib/claude.ts`, `lib/resend.ts` if present. If any uses module-level instantiation (`const stripe = new Stripe(...)` at the top of the file), this task migrates to lazy-getter pattern.
- View `package.json` to confirm `stripe`, `@anthropic-ai/sdk`, and `resend` packages are installed.
- Verify TASK-003 has shipped — env vars (`STRIPE_SECRET_KEY`, `ANTHROPIC_API_KEY`, `RESEND_API_KEY`, `RESEND_FROM_EMAIL`) must be present in `.env.local`.

## Files to Create/Modify

- `lib/stripe.ts` (NEW)
- `lib/claude.ts` (NEW)
- `lib/resend.ts` (NEW)
- `package.json` (MODIFY; verify dependencies installed at correct versions)

## Implementation Requirements

All three files follow the same lazy-getter pattern. Module load is side-effect-free (matches WoulfAI rule 13); the SDK is instantiated on first call to `get*()` and cached for subsequent calls within the same Vercel function invocation. New invocations get fresh SDKs.

### `lib/stripe.ts`

```typescript
import Stripe from 'stripe';

let _stripe: Stripe | null = null;

export function getStripe(): Stripe {
  if (!_stripe) {
    _stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
      apiVersion: '2026-04-30.zelos',  // pin latest stable at TASK-005 ship date
      timeout: 30_000,                    // 30 seconds per Q-1.12
      maxNetworkRetries: 2,               // Stripe SDK default; documented for clarity
      typescript: true,
      appInfo: {
        name: 'mybestsellingnovel',
        version: '1.0.0',
        url: 'https://mybestsellingnovel.com',
      },
    });
  }
  return _stripe;
}
```

**API version pinning:** Per Q-1.9 default, pin the latest stable Stripe API version available at TASK-005 ship date. The exact value `2026-04-30.zelos` shown above is the latest stable as of audit date 2026-05-04; verify on Stripe Dashboard at ship time and update if a newer stable has shipped. Document the chosen version in CLAUDE.md so future migrations are diffable. Stripe API versions are backwards-compatible within a major version, but pinning makes regressions diagnosable.

**`appInfo`:** Stripe surfaces this in their dashboard logs and emails. Helps the operator distinguish v1 traffic from v2 traffic in future API-version migration windows.

### `lib/claude.ts`

```typescript
import Anthropic from '@anthropic-ai/sdk';

let _claude: Anthropic | null = null;

export function getClaude(): Anthropic {
  if (!_claude) {
    _claude = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY!,
      timeout: 60_000,    // 60s per Q-1.12; aligns with PATCH-001 maxDuration on /api/ai
      maxRetries: 2,      // SDK default; explicit for clarity
    });
  }
  return _claude;
}
```

**Model not pinned in lib:** Per Q-1.10 default, the model identifier (e.g., `claude-sonnet-4-5`) is passed as a parameter from `app/api/ai/route.ts` on every call. This lets PATCH-001 / R-TASK-126 / future model upgrades change the model without touching `lib/claude.ts`. The lib is purely the lazy SDK init.

**60-second timeout:** Aligns with PATCH-001's `export const maxDuration = 60` on the `/api/ai` route. If a Claude call hangs, the SDK throws before the route handler hits Vercel's wall-clock limit, giving the route handler a chance to log to Sentry (R-TASK-106) and return a clean 504 to the client.

**Streaming:** PATCH-001 uses `stream: true` on AI calls. Streaming responses don't share the 60s timeout the same way — the timeout applies to time-to-first-token, not full-response duration. Documented in PATCH-001 implementation notes.

### `lib/resend.ts`

```typescript
import { Resend } from 'resend';

let _resend: Resend | null = null;

export function getResend(): Resend {
  if (!_resend) {
    _resend = new Resend(process.env.RESEND_API_KEY!);
    // Resend SDK does not expose a timeout option as of current version;
    // wrap calls in `Promise.race(...)` with a 30s deadline at the call site if needed.
  }
  return _resend;
}

/** From-address used by all transactional email sends. */
export function getFromAddress(): string {
  return process.env.RESEND_FROM_EMAIL!;
}
```

**Resend timeout:** The Resend SDK doesn't accept a timeout parameter directly. For the 30-second SLA per Q-1.12, callers wrap with `Promise.race`:

```typescript
// In TASK-056 email-wiring or similar:
const TIMEOUT = 30_000;
await Promise.race([
  getResend().emails.send({...}),
  new Promise((_, reject) => setTimeout(() => reject(new Error('resend timeout')), TIMEOUT)),
]);
```

Per Q-8.12 default in TASK-056 (log-and-drop on failure), a Resend timeout becomes a Sentry warning and the user proceeds without the email. Acceptable for v1 — the subsequent webhook (e.g., Stripe receipt) provides redundancy.

**`getFromAddress()` helper:** Centralizes the env-var read so consumers don't sprinkle `process.env.RESEND_FROM_EMAIL!` across multiple files. Single source of truth for the brand "from" identity (`noreply@mybestsellingnovel.com` per Decision #28).

## What this task does NOT do

- Does NOT make any Anthropic, Stripe, or Resend calls — those happen in route handlers
- Does NOT validate that env vars are present at module load — validation happens at first `get*()` call (lazy)
- Does NOT cache SDK clients across Vercel function invocations — each cold start re-instantiates; that's acceptable since instantiation is fast (<10ms each)
- Does NOT pin Anthropic SDK or Resend SDK versions in this task; version pinning is in `package.json` (TASK-001)

## Tests Required

- AT-014: Importing `lib/stripe.ts` does NOT make a network call (verify via mocking or by checking `npm run build` doesn't try to validate STRIPE_SECRET_KEY)
- AT-015: First `getStripe()` call returns a Stripe instance with `apiVersion === '2026-04-30.zelos'` (or whatever was pinned)
- AT-016: First `getClaude()` call returns an Anthropic instance with `timeout === 60000`
- AT-017: `getResend()` and `getFromAddress()` both work; `getFromAddress()` returns the `RESEND_FROM_EMAIL` value
- AT-018: Mechanical: no `new Stripe(`, `new Anthropic(`, or `new Resend(` outside `lib/stripe.ts`, `lib/claude.ts`, `lib/resend.ts` (`grep -rn "new Stripe\|new Anthropic\|new Resend(" app/ lib/ --include='*.ts' | grep -vE "lib/(stripe|claude|resend).ts"` returns zero results)

## Session Notes
_(Filled by Claude Code during implementation)_
