## Root cause

Edge function logs show `ai-agent loop error: schema is not a function`. This is thrown by `npm:ai` (AI SDK v5) when it tries to invoke the Standard Schema `~standard.validate` interface on the tool `inputSchema`. Zod added Standard Schema support in **3.25**, but the edge functions pin `npm:zod@3.23.8`. So every tool call fails immediately and the loop returns 500, which is what the browser sees as `FunctionsHttpError`.

Affected files (all pin the old zod):
- `supabase/functions/ai-agent/index.ts`
- `supabase/functions/agent-ingest/index.ts`
- `supabase/functions/connector-dispatch/index.ts`

## Fix

1. Bump the zod specifier from `npm:zod@3.23.8` → `npm:zod@3.25.76` in the three files above. No code changes needed — the `z.object/z.string/...` API is identical, this just unlocks Standard Schema so AI SDK v5 can validate tool inputs and `Output.object` schemas.
2. Redeploy `ai-agent`, `agent-ingest`, `connector-dispatch` and verify `ai-agent` returns 200 by calling it via `supabase--curl_edge_functions` with a minimal `{ messages: [{ role:"user", content:"hi" }] }`.
3. Check `supabase--edge_function_logs` for `ai-agent` — the `schema is not a function` line should be gone.

## Playwright test for the conversational AI

Add `docs/demo-screenshots/ai-chat-walkthrough.py` (headed Chromium, screenshots into `/tmp/browser/ai-chat/`). Flow:

1. Launch `chromium.launch(headless=False)` with viewport 1280×1800.
2. Seed + sign in as the Steve Jobs demo persona by invoking `seed-personas` then `signInWithPassword` directly via the Supabase REST endpoint (reuse pattern from `voice-walkthrough.py`).
3. Navigate to `/dashboard`, open the AI Chat Agent (floating brain icon → `VoiceCoordinatorButton`/`AIChatAgent`), screenshot `1_chat_open.png`.
4. Type "What's the status of our top project?" and press Enter. Wait for an assistant message to appear (poll the DOM for the second `[data-role="assistant"]` bubble or the streamed text node).
5. Screenshot `2_chat_response.png` and assert no `AI chat error` shows in the visible toast region.
6. Capture `page.on("console")` errors and `page.on("response")` for `/functions/v1/ai-agent` — assert status 200.
7. Close browser, print pass/fail summary.

Run it with `python docs/demo-screenshots/ai-chat-walkthrough.py` after the zod fix is deployed, then view screenshots to confirm the bot replied. No app/source code changes are needed for the test itself beyond adding the script.

## Out of scope

The `iframe-pos` warning and `App update check` logs come from the Lovable dev shell and are noise — no action.
