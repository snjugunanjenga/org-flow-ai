
# Phase 2 (Intelligence) + Phase 3 (Connectors) + Tests

Goal: ship a real multi-agent loop wired through the AI SDK, plus Slack/Gmail Connector Gateway ingestion, plus a complete test layer (Vitest + Deno + Playwright) ready for HeyGen capture.

## 1. Shared edge helpers

Create `supabase/functions/_shared/` (new):
- `ai-gateway.ts` — `createLovableAiGatewayProvider`, `getLovableAiGatewayResponseHeaders`, `withLovableAiGatewayRunIdHeader` (verbatim from skill).
- `auth.ts` — `requireUser(req)` returns `{ supabase, user, orgId }`; resolves active `org_id` via `org_memberships`.
- `embeddings.ts` — `embed(text)` via Lovable AI Gateway `text-embedding-3-small` proxy.
- `log-agent.ts` — `logAgent({orgId, userId, agent, input, reasoning, output, latency_ms})` insert into `agent_logs`.

## 2. Phase 2 — real multi-agent AI SDK loop

Rewrite `supabase/functions/ai-agent/index.ts` as a Coordinator driver using `streamText` + tools (`stopWhen: stepCountIs(50)`).

```text
Coordinator (streamText)
├─ tool: search_memory  (Pinecone query, namespace=org_id) → snippets+citations
├─ tool: graph_lookup   (neo4j-proxy MATCH with WHERE n.org_id=$org)
├─ tool: invoke_memory  (extract entities → embed → upsert Pinecone + Neo4j + Postgres)
├─ tool: invoke_router  (score stakeholders, write notifications)
└─ tool: invoke_critic  (detect conflicts → insert conflicts rows)
```

- Every tool `execute()` writes to `agent_logs` (color = agent identity).
- Each `execute()` returns compact JSON (≤2 KB) so the model can cite.
- Citations enforced in system prompt: "no source ⇒ no answer".
- Stream response via `result.toUIMessageStreamResponse({ headers: corsHeaders })`, wrapped in `withLovableAiGatewayRunIdHeader`.
- Model: `google/gemini-3-flash-preview`. JWT verified in code via `getClaims`.

New edge function `supabase/functions/agent-ingest/index.ts`:
- Used by connectors + Resources upload. Runs Memory tool standalone on raw text, then triggers Router + Critic. Idempotent on `(org_id, source_hash)`.

Update `src/components/dashboard/AIChatAgent.tsx` to use `@ai-sdk/react` `useChat` + `DefaultChatTransport` pointing at `/functions/v1/ai-agent`. Render `message.parts` with `react-markdown`. Show tool-call activity (Memory/Router/Critic labels with color) inline.

Update `src/pages/dashboard/AgentsView.tsx` to subscribe to `agent_logs` realtime for the active org and render a color-coded reasoning stream.

## 3. Phase 3 — Slack + Gmail via Connector Gateway

Trigger `standard_connectors--connect` for `slack` and `google_mail` in build mode (user picks workspace connections).

New edge functions:
- `connector-slack-ingest/index.ts` — polls `conversations.history` for configured channels (saved in new `connector_subscriptions` table), normalizes messages, calls `agent-ingest`.
- `connector-gmail-ingest/index.ts` — `users.me.messages?q=is:unread newer_than:1d`, normalizes thread → `agent-ingest`.
- `connector-dispatch/index.ts` — Router-driven outbound: `chat.postMessage` (Slack) or `messages/send` (Gmail) when Router decides a notification needs external delivery.

Pattern (per connector):
```ts
const url = `https://connector-gateway.lovable.dev/${id}/${path}`;
const res = await fetch(url, { headers: {
  Authorization: `Bearer ${Deno.env.get("LOVABLE_API_KEY")}`,
  "X-Connection-Api-Key": Deno.env.get(`${ID}_API_KEY`)!,
}});
```

New migration `connector_subscriptions` (org_id, connector, external_id, cursor, last_synced_at, enabled) with full GRANT + RLS (manager-or-admin write, member read).

UI: `src/pages/dashboard/SettingsView.tsx` gains a "Connectors" panel listing Slack/Gmail/Calendar status, channel/label pickers, and a "Run sync now" button (invokes the ingest function). Each demo persona gets a Demo Mode banner explaining the connector path.

Calendar stays on existing custom OAuth (`calendar-sync`); only polish: list active subscriptions and surface upcoming events in Overview.

## 4. Tests

### 4.1 Vitest (frontend)
New `*.test.tsx` files (jsdom):
- `AIChatAgent.test.tsx` — renders, sends user message, mocks `useChat`, asserts tool-call chips display.
- `AgentsView.test.tsx` — renders agent_logs stream, color-codes by agent.
- `SettingsView.connectors.test.tsx` — toggles a subscription, asserts invoke called.
- `ProjectsView.test.tsx`, `NotificationsView.test.tsx`, `GraphView.test.tsx` — smoke + RLS-scoped query mocks.
- `useSubscription.test.ts` — plan gating returns correct booleans.
- Add MSW handlers under `src/test/msw.ts` for Supabase + edge functions.

### 4.2 Deno edge tests
Add `*_test.ts` next to each function (loaded via `dotenv/load.ts`, `Deno.test`, fetch + `await res.text()`):
- `ai-agent/index_test.ts` — 401 without auth; happy path with mocked gateway via `Deno.env` injection of `LOVABLE_API_KEY=test` and a fetch stub via `globalThis.fetch` wrap; asserts `agent_logs` row created.
- `neo4j-proxy/index_test.ts` — 400 on missing query; 401 on no auth.
- `pinecone-proxy/index_test.ts` — invalid action 400; namespace passthrough.
- `agent-ingest/index_test.ts` — idempotency on duplicate source_hash.
- `connector-slack-ingest/index_test.ts` + `connector-gmail-ingest/index_test.ts` — gateway URL/headers shape; 401 surfaces; cursor advances.
- `seed-personas/index_test.ts` — second invocation does not duplicate rows.

Run via `supabase--test_edge_functions` with `--allow-net --allow-env` (default).

### 4.3 Playwright persona walkthroughs
Scripts under `/tmp/browser/personas/` (one per persona), reusing the `LOVABLE_BROWSER_SUPABASE_*` env seeding pattern with the three demo logins (Stanford, Northwind, Lumen).

Per persona, 8 screenshots → `docs/demo-screenshots/<persona>/NN_*.png`:
1. Login + dashboard overview
2. Persona-specific surface (notebook / graph / brief)
3. Open AI chat, ask a question, capture streaming + tool-call chips
4. Reasoning trace in AgentsView
5. Connector settings (Slack/Gmail status)
6. Notifications routed by Router
7. Conflicts (Critic) or daily brief (Coordinator)
8. Subscription tier indicator

`docs/demo-screenshots/manifest.json` lists all 24 with captions for HeyGen.

### 4.4 CI
`.github/workflows/ci.yml`:
```yaml
on: [push, pull_request]
jobs:
  test:
    steps:
      - bun install
      - bun run lint
      - bunx vitest run
```
Deno + Playwright jobs documented but not enforced (need secrets).

## 5. Files (high-level)

```text
supabase/functions/
  _shared/{ai-gateway,auth,embeddings,log-agent}.ts        (new)
  ai-agent/index.ts                                         (rewrite — AI SDK tool loop)
  ai-agent/index_test.ts                                    (new)
  agent-ingest/index.ts + index_test.ts                     (new)
  connector-slack-ingest/index.ts + _test.ts                (new)
  connector-gmail-ingest/index.ts + _test.ts                (new)
  connector-dispatch/index.ts                               (new)
  neo4j-proxy/index_test.ts                                 (new)
  pinecone-proxy/index_test.ts                              (new)
  seed-personas/index_test.ts                               (new)

src/
  components/dashboard/AIChatAgent.tsx                      (rewrite to useChat + parts)
  components/dashboard/ConnectorsPanel.tsx                  (new)
  pages/dashboard/AgentsView.tsx                            (realtime agent_logs)
  pages/dashboard/SettingsView.tsx                          (mount ConnectorsPanel)
  hooks/use-agent-logs.ts                                   (new realtime hook)
  test/msw.ts                                               (new)
  **/__tests__/*.test.tsx                                   (six new files)

supabase/migrations/<ts>_connector_subscriptions.sql        (new)
.github/workflows/ci.yml                                    (new)
docs/demo-screenshots/manifest.json                         (new, populated after Playwright)
```

## 6. Secrets / connectors required

- `LOVABLE_API_KEY` ✅
- `PINECONE_*`, `NEO4J_*` ✅
- Slack connection via `standard_connectors--connect slack` → `SLACK_API_KEY`
- Gmail connection via `standard_connectors--connect google_mail` → `GOOGLE_MAIL_API_KEY`

If a connection cannot be linked at run time, ingest functions fall through to a "synthetic signal" mode using seed-personas content so the demo path never breaks.

## 7. Implementation order

1. `_shared/*` helpers + `connector_subscriptions` migration.
2. Rewrite `ai-agent` with AI SDK tool loop → `supabase--test_edge_functions ai-agent`.
3. `agent-ingest` + Deno test.
4. Slack/Gmail connector linking + ingest functions + dispatch + Deno tests.
5. Frontend: `useChat` chat agent, `AgentsView` realtime, `ConnectorsPanel`.
6. Vitest suites + MSW.
7. Deno tests across functions.
8. Playwright persona walkthroughs → 24 screenshots + manifest.
9. CI workflow.
10. Re-run all tests, fix regressions, update `docs/ARCHITECTURE.md` status table and `.lovable/plan.md` to mark Phase 2/3/5 done.

## 8. Out of scope (kept for later phases)

- Phase 4 voice (OpenAI Realtime) — pending.
- HeyGen video render — pending (screenshots produced here are the inputs).
- Stripe/Paddle billing.
- Removing Apple/Steve Jobs demo org.

## Phase 2-3 Completion Log (2026-06-15)
- Linked Slack and Gmail via Connector Gateway → `SLACK_API_KEY` + `GOOGLE_MAIL_API_KEY` injected.
- New edge function `connector-dispatch` routes Router-Agent notifications to Slack `chat.postMessage` or Gmail `users/me/messages/send`; falls back to `{ simulated: true }` if a connector is missing so the demo stays resilient.
- Deno smoke tests added for `ai-agent`, `agent-ingest`, and `connector-dispatch`.
- `.github/workflows/ci.yml` runs `bun install` + `bunx vitest run` on every PR / push to main.
- Vitest suite green (Resources, Onboarding, ConnectorsPanel, …). Playwright persona walkthroughs remain a follow-up.
