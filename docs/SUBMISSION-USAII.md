# USAII Global AI Hackathon 2026 — Submission

**Project:** Superhuman AI Chief of Staff — *Your Second Brain for Life, Learning & Work*
**Track:** College Core Challenge — Brief 3: *Productivity / Second Brain for Real Life*
**Window:** June 14–21, 2026
**Live App:** https://org-ai-chief-of-staff.lovable.app
**Repo:** https://github.com/snjugunanjenga/org-ai-chief-of-staff *(replace with final URL)*
**Eligibility:** Undergraduate students, registered on Devpost. ✅

---

## 1. Short description (≈250 words)

Modern life overflows with sources, decisions, meetings, and deadlines that nobody can hold in their head. Students juggle papers and problem sets, PMs chase decisions across teams, and founders try to read every signal at once. **Superhuman AI Chief of Staff** is a *second brain* that captures everything, grounds every answer in real sources, and turns complexity into clear next steps.

The product ships **one codebase, three personas, three demo orgs**:

- **Overloaded student / IC** — *Stanford CS Cohort* notebook with papers, problem sets, and a thesis, where every chat answer is cited and every decision becomes an action item.
- **Cross-team PM** — *Northwind Product* with a live knowledge graph, conflict detection, and a Router agent that decides *who needs to know* about every change.
- **Founder / leader** — *Lumen Robotics* with a daily executive brief synthesized by the Coordinator agent from meetings, projects, and risks across every team.

Under the hood, four AI agents (Memory, Router, Critic, Coordinator) collaborate through the AI SDK on the Lovable AI Gateway, backed by Postgres with row-level security, a Neo4j knowledge graph, and Pinecone semantic memory namespaced per tenant. Every answer carries its citation. Every cross-tenant boundary is enforced at the database. Every agent step is logged for audit.

## 2. Problem

People do not lack information — they lack a system that **remembers, connects, and routes** it. Existing tools (Notion, Slack, Drive) are storage. We need a brain.

## 3. Audience

Students, individual contributors, PMs, and founders — anyone whose inbox + calendar + docs have outgrown human working memory.

## 4. Solution

A multi-tenant web app that:
1. **Captures** sources (PDFs, URLs, chat, meetings, calendar, Slack, Gmail).
2. **Grounds** answers with citations from those sources.
3. **Detects** conflicts and stale decisions automatically.
4. **Routes** the right knowledge to the right person at the right time.
5. **Briefs** leaders with a daily synthesis across every signal.

## 5. Unique selling proposition

- **Three personas in one product** — most "second brain" tools serve one.
- **Citation-first chat** — no hallucinations without a source.
- **Live knowledge graph** — invisible dependencies become visible.
- **Multi-agent with auditable reasoning** — every step logged to `agent_logs`.
- **Tenant-isolated by design** — Postgres RLS + Pinecone namespaces + Neo4j filters.

## 6. Implementation

| Layer | Tech |
|---|---|
| Frontend | React 18, TypeScript, Vite, Tailwind, shadcn/ui, Framer Motion |
| Backend | Lovable Cloud (Postgres + Auth + Storage + Edge Functions) |
| AI | AI SDK + Lovable AI Gateway · `google/gemini-3-flash-preview` · `stepCountIs(50)` |
| Knowledge graph | Neo4j (via `neo4j-proxy` edge function) |
| Semantic memory | Pinecone (via `pinecone-proxy` edge function, namespaced per org) |
| Connectors | Google Calendar (custom OAuth), Slack + Gmail (Lovable Connector Gateway) |
| Voice | OpenAI Realtime push-to-talk |
| Tests | Vitest units + Playwright E2E |

Architecture diagram and full ERD live in `docs/ARCHITECTURE.md` and `docs/DATABASE.md`.

## 7. Three demo logins

| Persona | Org | Email | Password |
|---|---|---|---|
| Student | Stanford CS Cohort | `student.demo@chiefofstaff.app` | `Demo!2026` |
| PM | Northwind Product | `pm.demo@chiefofstaff.app` | `Demo!2026` |
| Founder | Lumen Robotics | `founder.demo@chiefofstaff.app` | `Demo!2026` |

Re-seed at any time from **Platform Admin → Organizations → Seed personas** (super-admin only). Endpoint: `POST /functions/v1/seed-personas` (idempotent).

## 8. Videos

- **Demo video (60s, HeyGen):** *<add URL after upload>*
- **Tech video (60s, HeyGen):** *<add URL after upload>*
- Scripts: `.workspace/skills/120x-architect-sub-agent/references/demo-script.md`

## 9. Responsible AI

- **Data sources:** all seed data is synthetic. User data stays inside the tenant org_id boundary.
- **Isolation:** Postgres RLS on every public table; Pinecone uses per-org namespaces; Neo4j queries filter by tenant.
- **Grounding:** every chat answer cites its source; no source ⇒ no answer.
- **No PII exfiltration:** edge functions never log secrets; admin actions written to `admin_audit_log`.
- **Bounded agents:** every agent loop limited via `stepCountIs(50)` to prevent runaway costs.
- **Auditability:** `agent_logs` records every Memory/Router/Critic/Coordinator step with reasoning.

## 10. Devpost submission checklist

- [ ] Project name + tagline ("Your second brain for life, learning & work")
- [ ] 250-word description (this doc, §1)
- [ ] 3 screenshots per persona (`docs/demo-screenshots/`)
- [ ] Demo video URL
- [ ] Tech video URL
- [ ] GitHub repo URL (final)
- [ ] Live app URL
- [ ] Three demo logins (this doc, §7)
- [ ] Responsible-AI statement (this doc, §9)
- [ ] Team eligibility confirmed
- [ ] Submitted before deadline

---

*Previous Hack-Nation submission preserved at `docs/SUBMISSION.md` for reference.*