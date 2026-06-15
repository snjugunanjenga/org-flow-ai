# Architecture — Superhuman AI Chief of Staff

> USAII Global AI Hackathon 2026 · College Brief 3 (Productivity / Second Brain).
> Reframed from the original Hack-Nation Challenge 3 build. One codebase, three personas, three demo orgs.

## 1. Goals

- **Second brain** that captures sources, grounds every answer with citations, detects conflicts, and routes knowledge to the right people.
- **Multi-tenant by construction** — Postgres RLS + Pinecone namespaces + Neo4j tenant filters.
- **Auditable multi-agent reasoning** — every Memory/Router/Critic/Coordinator step persisted to `agent_logs`.
- **Demo-ready in 60 seconds** — three persona orgs reachable from one login each.

## 2. Three-persona product surface

| Persona | Demo Org | Plan | Surface emphasis |
|---|---|---|---|
| Overloaded student / IC | Stanford CS Cohort | free (trialing) | Notebooks · cited chat · auto action items |
| Cross-team PM | Northwind Product | pro | Knowledge graph · Critic conflicts · Router "who needs to know" |
| Founder / leader | Lumen Robotics | enterprise | Coordinator daily brief · projects · cross-team risks |

All three orgs are seeded idempotently by `supabase/functions/seed-personas` (medium depth — 15–25 items per surface).

## 3. System diagram

```
┌─────────────────────────────────────────────────────────┐
│                    React Frontend                       │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌───────────┐ │
│  │ 3D Graph │ │Dashboard │ │ AI Chat  │ │   Voice   │ │
│  │(r-f-g-3d)│ │  Views   │ │Interface │ │(Realtime) │ │
│  └────┬─────┘ └────┬─────┘ └────┬─────┘ └─────┬─────┘ │
│       └─────────────┴────────────┴─────────────┘       │
│                    React Query Cache                    │
└────────────────────────┬────────────────────────────────┘
                         │ HTTPS / WebSocket
┌────────────────────────┴────────────────────────────────┐
│              Supabase Edge Functions                    │
│  ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐ ┌─────────────┐  │
│  │Memory│ │Router│ │Critic│ │Coord.│ │ Integrations│  │
│  │Agent │ │Agent │ │Agent │ │Agent │ │Slack/Gmail/  │  │
│  │(Blue)│ │(Grn) │ │(Red) │ │(Purp)│ │Calendar     │  │
│  └──┬───┘ └──┬───┘ └──┬───┘ └──┬───┘ └──────┬──────┘  │
│     └────────┴────────┴────────┴─────────────┘         │
└───────┬──────────────────┬──────────────────┬──────────┘
        │                  │                  │
┌───────┴──────┐  ┌────────┴───────┐  ┌───────┴──────┐
│  Supabase    │  │    Neo4j       │  │   Pinecone   │
│  PostgreSQL  │  │  Graph DB      │  │  Vector DB   │
│  (RLS, Auth) │  │  (Knowledge)   │  │  (Semantic)  │
└──────────────┘  └────────────────┘  └──────────────┘
```

## 4. Multi-agent loop (Phase 2 — live)

Single AI SDK driver in `supabase/functions/ai-agent/index.ts`, routed through the Lovable AI Gateway. Default model: `google/gemini-3-flash-preview`. Hard cap: `stopWhen: stepCountIs(50)`.

```text
 user / signal
      │
      ▼
 ┌──────────┐    extract entities, embed, upsert
 │  Memory  │──► Pinecone (namespace=org_id) + Neo4j (tenant-tagged nodes)
 └────┬─────┘
      │ new knowledge
      ▼
 ┌──────────┐    score stakeholders by role + radius + similarity
 │  Router  │──► notifications (Postgres) + Slack/Gmail dispatch
 └────┬─────┘
      │
      ▼
 ┌──────────┐    detect conflicts, stale decisions, silos
 │  Critic  │──► conflicts table + Critic reasoning panel
 └────┬─────┘
      │
      ▼
 ┌──────────────┐  hybrid retrieval (Pinecone + Neo4j) → answer + citations
 │ Coordinator  │──► chat reply · daily executive brief · voice response
 └──────────────┘
```

Every step writes to `agent_logs` with `{agent, org_id, input, reasoning, output, latency_ms}`. The UI streams the same trace into the color-coded "thinking" panels in `AIChatAgent` and `AgentsView`.

## 5. Data flow

1. **Ingestion** — Slack messages, Gmail threads, Google Calendar events, meeting transcripts, uploaded PDFs/URLs.
2. **Processing** — Memory Agent extracts entities (people, topics, decisions, action items) and generates `text-embedding-3-small` embeddings.
3. **Storage** — structured rows → Postgres (31 tables, all RLS-protected); relationships → Neo4j; embeddings → Pinecone (per-org namespace).
4. **Analysis** — Critic detects conflicts/staleness; Router scores stakeholders.
5. **Versioning** — every decision/fact change writes a `knowledge_versions` row for audit + rollback.
6. **Visualization** — Mind Map canvas + 3D ForceGraph render Neo4j topology with tenant filter.
7. **Interaction** — Coordinator answers chat/voice with citation-first responses; daily brief generated on schedule.

## 6. Connector architecture (Phase 3)

| Connector | Mechanism | Edge function | Demo path |
|---|---|---|---|
| Google Calendar + Meet | Custom OAuth 2.0 | `calendar-sync` | event sync, Meet link auto-create, deadline tracking |
| Slack | Lovable Connector Gateway (`standard_connectors--connect`) | `ai-agent` (consumer) | message in → Memory extract → graph + notification |
| Gmail | Lovable Connector Gateway | `ai-agent` (consumer) | thread in → Memory extract → decision/action item |

Every connector path satisfies the minimum demo contract: **1 external signal → Memory extracts → appears in graph + notifications within 1 tick**.

## 7. Multi-tenancy & isolation

- `OrgProvider` React context — active `org_id` for the session; supports multi-org users.
- Postgres — RLS on every public table; `auth.uid()` joined to `organization_members`; `service_role` reserved for edge functions.
- Roles — `app_role` enum (`admin`, `manager`, `member`) in a separate `user_roles` table, checked via `public.has_role()` SECURITY DEFINER.
- Pinecone — index segmented by `namespace = org_id`; queries cannot cross.
- Neo4j — every node carries `org_id` label; Cypher generated by `neo4j-proxy` always injects `WHERE n.org_id = $org`.
- Platform superadmin (`simonnjenganjuguna@gmail.com`) bypasses tenant filters only on `/dashboard/admin`, audited via `admin_audit_log`.

## 8. Subscription enforcement

- `useSubscription` hook → React-Query-cached plan + limits.
- `<FeatureGate plan="pro">` gates UI surfaces.
- Auto-trigger creates a 30-day free trial on org creation.
- Demo orgs map to the three tiers (Stanford → free, Northwind → pro, Lumen → enterprise) so judges see every plan.

## 9. Voice (Phase 4)

- OpenAI Realtime API over WebSocket from `AIChatAgent`.
- Push-to-talk for the Coordinator agent; transcription seeds the same multi-agent loop as chat.
- Web Speech API fallback when Realtime is unavailable; agent opt-out toggle in settings.

## 10. Quality, demo mode, CI (Phase 5)

- **Vitest** units for `Resources`, `Admin`, `Onboarding`, `ProtectedRoute`, `DirectMessages`, `Calendar`.
- **Playwright** E2E smoke + persona walkthroughs (24 screenshots → `docs/demo-screenshots/`).
- **GitHub Actions** — lint + vitest on push.
- **Demo Mode** toggle — Platform Admin button calls `seed-personas`, then routes to a scripted tour per persona.
- Mobile responsive sweep on the 13 dashboard views.

## 11. Build-time tooling — `120x-architect-sub-agent`

Lovable skill at `.workspace/skills/120x-architect-sub-agent/` (drafted at `.agents/skills/120x-architect-sub-agent/`, applied via `skills--apply_draft`). Operator loop: **Discover → Define → Design → Deliver → Demo**. References: `usaii-rubric.md`, `persona-playbook.md`, `demo-script.md`, `doc-templates.md`. The skill is invoked for planning/architecture/submission work — it ships no runtime code.

## 12. Key design decisions

- **Neo4j over client-side graph**: Server-side computation for complex traversals
- **Pinecone over pgvector**: Production-grade vector search with namespace isolation
- **Multi-tenant via RLS**: All data scoped by `org_id` at the database level
- **Edge Functions**: Serverless, auto-scaling, secure secret management
- **Simulated fallback**: All integrations work without API keys using seed data
- **AI SDK over bespoke loops**: bounded `stepCountIs(50)`, model swap via gateway without code changes
- **Citation-first chat**: hallucination guardrail — no source ⇒ no answer
- **One skill, no runtime cost**: `120x-architect-sub-agent` runs only at build time

## 13. Roadmap status (USAII window: June 14–21, 2026)

| Phase | Scope | Status |
|---|---|---|
| 1 — Foundation | 31 tables, RLS, auth, dashboard shell | ✅ shipped |
| 2 — Intelligence | Neo4j + Pinecone + agent loop live | 🟡 wiring in progress |
| 3 — Connectors | Slack + Gmail via Connector Gateway, Calendar polish | 🟡 in progress |
| 4 — Voice + Projects | Realtime push-to-talk, AI weekly status | ⏳ pending |
| 5 — Quality + Demo | Vitest, Playwright, CI, demo mode, mobile | ⏳ pending |
| Submission | 24 screenshots, 2 HeyGen videos, USAII packet | ⏳ pending |

Full task tracker: [`.lovable/plan.md`](../.lovable/plan.md). Submission packet: [`docs/SUBMISSION-USAII.md`](./SUBMISSION-USAII.md).

## 14. Multi-tenant architecture

See [MULTI-TENANCY.md](./MULTI-TENANCY.md) for full details.

- **OrgProvider** context provides centralized org state, multi-org switching
- **useSubscription** hook caches subscription plan/limits via React Query
- **FeatureGate** component enforces plan limits in the UI
- **AdminGuard** protects `/dashboard/admin` route (platform superadmin only)
- Auto-subscription trigger creates free trial on org creation

## 15. Platform administration

See [ADMIN.md](./ADMIN.md) for full details.

- Platform Admin dashboard at `/dashboard/admin` with Analytics, Organizations, Subscriptions, Newsletters, and Audit Log tabs
- `admin_audit_log` table tracks all admin actions
- Cross-tenant visibility via platform admin RLS policies
