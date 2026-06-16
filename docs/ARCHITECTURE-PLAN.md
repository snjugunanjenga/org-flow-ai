# Architectural Plan — Meeting Intelligence + Responsible AI

Vertical slices, each shippable end-to-end (UI → edge → graph → test). Phases
are sequential; sprints inside a phase can parallelize.

## Guiding principles (Software-Architect lens)

- **Vertical over horizontal.** Each sprint ends in a demoable user path, not a layer.
- **Reuse before invent.** Use the 31 existing tables, 4 agents, and current edge functions. New tables only when provenance/governance demand them.
- **Provable knowledge.** Every claim ships with `source_id`, `version`, and a confidence score. No citation → no publish.
- **Idempotent + durable.** All cross-system writes go through Inngest steps with Redis dedupe keys.
- **Responsible by construction.** Grounding, bias, PII, and human review are pipeline stages, not afterthoughts.

---

## Phase 0 — Foundations (shipped)

Docs, auth, RLS, OrgProvider, Neo4j/Pinecone proxies, 4-agent skeleton, notebook sources via cloud connectors, Resources → graph linking. Tracked in `docs/ROADMAP.md` Phase 1–2.

## Phase 1 — Connector Trust (Calendar + Meet)

**Outcome:** Demo personas click "Test connection" on Calendar/Meet and see green within 2s.

- **Sprint 1.1 — Connection verification**
  - Edge fn `calendar-connection-test` → `users/me/calendarList` via gateway.
  - `ConnectorsPanel.tsx` test button + status pill per row.
- **Sprint 1.2 — Calendar auto-sync**
  - `calendar-sync` wired to Inngest cron `calendar.sync.scheduled` every 10 min, per org.
  - Pre-create `meeting_transcripts` placeholder when event has `conferenceData.entryPoints[meet]`.

## Phase 2 — Orchestration Backbone (Inngest + Redis)

**Outcome:** All AI work runs as durable, idempotent, observable steps.

- **Sprint 2.1 — Inngest serve endpoint**
  - Connect Inngest connector; edge fn `inngest-handler` serves functions.
  - Register: `calendar.sync.scheduled`, `meeting.transcript.received`, `meeting.summarize`, `knowledge.embed_and_route`, `critic.review`.
- **Sprint 2.2 — Redis (Upstash) primitives**
  - Secrets: `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN`.
  - Helpers: `dedupe:{org}:{hash}` SETNX, `ratelimit:{org}:{fn}` token bucket, `embed:{hash}` cache (TTL 7d).

## Phase 3 — Meeting Intelligence Pipeline

**Outcome:** Transcript arrives → summary, decisions, action items, graph nodes, citations — within 90s.

- **Sprint 3.1 — Ingest & summarize**
  - `meeting.transcript.received` fan-out to summary / decisions / actions via `step.run` (Gemini structured output).
  - Writes `meeting_summaries`; decisions persisted with `knowledge_version`.
- **Sprint 3.2 — Embed & route**
  - Memory Agent: redact PII → embed → Pinecone (org namespace).
  - Router Agent: top-k Pinecone + Neo4j neighborhood → attach Meeting → Decision → Topic/Project/Team via `graph_edges` (`auto_routed=true` when confidence ≥ 0.72, else queued for review).
- **Sprint 3.3 — Critic pass**
  - Re-asks "is each claim grounded in retrieved chunks?"; writes contradictions to `conflicts`.

## Phase 4 — Responsible AI & Governance

**Outcome:** Every agent run has a verdict; managers can audit and override.

- **Sprint 4.1 — Guardrails**
  - PII redactor (regex + LLM) before any embed.
  - Grounding check: refuse responses without `source_id` citations.
  - Bias classifier (`{bias_flags[], severity}`); medium+ blocks auto-route.
- **Sprint 4.2 — Governance log**
  - Table `governance_verdicts` (agent_run_id, grounded, bias_flags, pii_redacted, reviewer_id, status), RLS to org managers, GRANTs included.
  - `GovernancePanel.tsx` under Admin → Governance.
- **Sprint 4.3 — Human-in-the-loop**
  - Oversight view surfaces "needs review" queue from `graph_edges` where `auto_routed=false`.

## Phase 5 — Verification (Playwright E2E)

**Outcome:** Green CI run proves the whole pipeline per persona.

- **Sprint 5.1 — Persona harness**
  - `tests/e2e/_helpers/supabase-session.ts` pre-mints sessions for Student, PM, Founder.
- **Sprint 5.2 — Meeting pipeline spec**
  - `tests/e2e/meeting-pipeline.spec.ts`: connect → seed fixture → trigger Inngest event → poll summaries → assert Pinecone vectors → assert Neo4j path → query Coordinator → assert citation chip → assert governance verdict.
- **Sprint 5.3 — Screenshots & narration**
  - Wire screenshots into `docs/demo-screenshots/` + HeyGen shot list.

## Phase 6 — Demo Polish & Submission

Aligns with `docs/SUBMISSION-USAII.md`: persona walkthroughs, 60s demo + 60s tech video, Responsible-AI section, rubric mapping (33/33/33).

---

## Cross-cutting tracks

- **Security memory** updated on every new endpoint touching org data.
- **Subscription gates** via `FeatureGate` on Calendar test, Governance tab, Coordinator citations (Pro+).
- **Observability:** every Inngest step logs to `agent_logs` with `{model, prompt_hash, sources[], confidence, guardrail_verdicts}`.

## Risks & mitigations

| Risk | Mitigation |
| --- | --- |
| Meet transcript not auto-delivered | Manual upload via SourceUploader; pipeline path identical. |
| Gemini schema-state overflow | Split bias + decisions into separate calls; short enums. |
| Connector token expiry | `verify_credentials` on panel; offer `reconnect`. |
| Pinecone quota | Embed cache in Redis; batch upserts per meeting. |

## Out of scope (this plan)

- Custom Meet bot recorder (rely on Google native recording).
- SharePoint/OneDrive/Outlook ingest (existing notebook flow covers).
- SOC2 controls beyond governance log.
