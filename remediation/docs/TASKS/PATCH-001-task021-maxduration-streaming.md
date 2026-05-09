<!-- APPLY: CREATE -->
# PATCH-001: TASK-021 — Add maxDuration + Streaming to /api/ai

## Status: NOT STARTED
## Priority: CRITICAL
## Phase: 4 patch (run as part of TASK-021 implementation, not after)
## Estimated Sessions: 0.5 (folded into TASK-021)
## Dependencies: TASK-021
## Resolves Gaps: GAP-086
## Spec Reference: AUDIT_REPORT.md CRITICAL section

## Pre-flight: re-read current state

Before making any change, read the current state of every file listed in "Files to Modify" below. Verify the gap(s) addressed by this task are still present in the current code. Specifically:

- For each file in "Files to Modify": view the file and confirm the condition the audit observed (e.g., "no rate limiting on /api/ai") still applies.
- For each gap in "Resolves Gaps": confirm the gap remains open. The audit was conducted on 2026-05-04; if the codebase changed since, the gap may have been partially or fully addressed.
- If a gap is no longer present, report this finding in PROGRESS.md, mark this task as superseded, and stop. Do not make changes.
- If a gap is partially addressed, scope this task to the remaining work and document in this file's Session Notes what was already addressed and skipped.
- If the gap is still fully present as the audit described, proceed with the rest of this task.

This pre-flight catches the case where the codebase changed between audit and remediation — exactly the failure mode that produces silent overwrites of unrelated work.

## What this patch changes

The original TASK-021 specifies a Claude proxy route with `max_tokens` capped at 16,384 but does not configure Vercel runtime constraints. Default Next.js App Router function timeout on Vercel is 10s (Hobby) / 15s (Pro default). Claude Sonnet 4 generating 16K tokens takes 30-90s. Without this patch, every long-form AI Draft and chapter-write call times out before completion.

## Files to Modify

- `app/api/ai/route.ts` (created by TASK-021)

## Required additions to TASK-021's implementation

### 1. Route segment config (top of file)

```typescript
// app/api/ai/route.ts

export const runtime = 'nodejs';        // SDK requires Node runtime, not Edge
export const maxDuration = 60;           // 60 seconds; max on Vercel Pro default
export const dynamic = 'force-dynamic';  // never cache AI responses
```

If you upgrade to Vercel Pro+Fluid, raise `maxDuration` to 300. Anthropic streaming completes 16K tokens in 30-60s typical; 60s gives safety margin.

### 2. Switch to streaming response

Original TASK-021 uses `messages.create` (non-streaming, blocks until full response). Switch to `messages.stream`:

```typescript
import Anthropic from '@anthropic-ai/sdk';

export async function POST(req: NextRequest) {
  const user = await verifyToken(req);
  if (!user) return unauthorized();

  // ... rate limit check (R-TASK-104) ...
  // ... tier limit check ...

  const body = await req.json();
  const { prompt, system, max_tokens = 4096, step_name, function_name, book_id } = body;
  const cappedMax = Math.min(max_tokens, 16384);

  const claude = getClaude();
  const startedAt = Date.now();

  // Server-Sent Events streaming response
  const stream = new ReadableStream({
    async start(controller) {
      const encoder = new TextEncoder();
      let fullText = '';
      let inputTokens = 0;
      let outputTokens = 0;
      let success = true;
      let errorMessage: string | null = null;

      try {
        const response = claude.messages.stream({
          model: 'claude-sonnet-4-20250514',
          max_tokens: cappedMax,
          system,
          messages: [{ role: 'user', content: prompt }],
        });

        for await (const event of response) {
          if (event.type === 'content_block_delta' && event.delta.type === 'text_delta') {
            const chunk = event.delta.text;
            fullText += chunk;
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'delta', text: chunk })}\n\n`));
          }
          if (event.type === 'message_delta' && event.usage) {
            outputTokens = event.usage.output_tokens;
          }
          if (event.type === 'message_start' && event.message.usage) {
            inputTokens = event.message.usage.input_tokens;
          }
        }

        controller.enqueue(encoder.encode(`data: ${JSON.stringify({
          type: 'done',
          usage: { input_tokens: inputTokens, output_tokens: outputTokens },
        })}\n\n`));
      } catch (err) {
        success = false;
        errorMessage = err instanceof Error ? err.message : String(err);
        // Sentry capture per R-TASK-106
        captureWithContext(err, { user_id: user.id, step_name, function_name, book_id });
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({
          type: 'error',
          error: 'ai_call_failed',
        })}\n\n`));
      } finally {
        controller.close();
        // Fire-and-forget logging (do NOT await; client already disconnected)
        logUsage({
          user_id: user.id,
          book_id,
          step_name,
          function_name,
          input_tokens: inputTokens,
          output_tokens: outputTokens,
          total_tokens: inputTokens + outputTokens,
          model: 'claude-sonnet-4-20250514',
          latency_ms: Date.now() - startedAt,
          success,
          error_message: errorMessage,
        }).catch(() => {});
        if (success) {
          incrementAiUsage(user.id).catch(() => {});
        }
      }
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  });
}
```

### 3. Update client agent caller (`components/agent/ai.ts` from TASK-030)

Original TASK-030 calls `fetch('/api/ai')` and parses JSON response. With streaming, switch to SSE consumption:

```typescript
// components/agent/ai.ts

export async function ai(prompt: string, sys: string, mt: number = 4096, opts?: AIOpts) {
  const token = (await getSupabaseClient().auth.getSession()).data.session?.access_token;
  if (!token) throw new Error('not_authenticated');

  const res = await fetch('/api/ai', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
    body: JSON.stringify({ prompt, system: sys, max_tokens: mt, ...opts }),
  });

  if (res.status === 429) {
    const retry = parseInt(res.headers.get('Retry-After') ?? '60', 10);
    throw new RateLimitError(`Slow down — try again in ${retry} seconds`, retry);
  }
  if (res.status === 403) {
    throw new UsageLimitError('Monthly AI call limit reached');
  }
  if (!res.ok) throw new Error(`ai_failed_${res.status}`);

  const reader = res.body!.getReader();
  const decoder = new TextDecoder();
  let buf = '';
  let fullText = '';
  let usage: any = null;

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buf += decoder.decode(value, { stream: true });
    const lines = buf.split('\n\n');
    buf = lines.pop() ?? '';
    for (const line of lines) {
      if (!line.startsWith('data: ')) continue;
      const data = JSON.parse(line.slice(6));
      if (data.type === 'delta') {
        fullText += data.text;
        opts?.onChunk?.(data.text);
      } else if (data.type === 'done') {
        usage = data.usage;
      } else if (data.type === 'error') {
        throw new Error(data.error);
      }
    }
  }

  return { content: fullText, usage };
}
```

The `opts.onChunk` callback lets agent components show tokens as they arrive — improving the perceived performance dramatically. Steps that already render the full response into a textarea (like S6 chapter writing) can now stream into the textarea in real time.

### 4. Verbatim-port reconciliation note

The agent's existing `function ai()` in source/bestseller_book_agent.jsx is non-streaming. Per Decision #11 (verbatim port), this CAN be modified — the change is to the call signature/network layer, not to AI prompts (Decision #13 protected) or to step logic. ADR-003 (in this packet) recommends splitting Decision #11 to allow exactly this kind of mechanical/network modernization. The streaming caller is a strict superset: callers that ignore `onChunk` get the same final string they got before.

If you reject ADR-003, the alternative is to keep non-streaming and accept that:
- max_tokens must be capped at ~6,000 (instead of 16,384) to fit in Vercel's 60s timeout
- Decision #25 ("raised to 16,384 tokens for longer chapters") becomes unachievable
- Authors paying $79/mo for the long-form generation feature get a degraded version

## Tests Required

- AT-021-PATCH-1: POST to /api/ai with max_tokens=12000 returns SSE stream that completes within 60s
- AT-021-PATCH-2: SSE stream emits multiple `delta` events before `done` event
- AT-021-PATCH-3: ai_usage_logs row written after stream completes; tokens recorded correctly
- AT-021-PATCH-4: Increment ai_usage counter increments by 1 per successful call
- AT-021-PATCH-5: When Claude API returns 529 (overloaded), stream emits `error` event; user sees friendly message; counter NOT incremented
- AT-021-PATCH-6: Agent S6 chapter write shows incremental text appearing in real time as Claude generates
- AT-021-PATCH-7: Vercel function logs show no timeout errors for max_tokens=16384 calls

## Apply this patch by editing TASK-021 directly

Add to TASK-021's "Implementation Requirements" section the contents above. Add to TASK-021's "Tests Required" the AT-021-PATCH-N items.

## Session Notes
_(Filled by Claude Code during TASK-021 implementation)_
