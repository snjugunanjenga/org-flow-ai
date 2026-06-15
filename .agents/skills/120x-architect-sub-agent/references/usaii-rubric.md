# USAII Rubric Cheatsheet

Equal-weight rubric (33% each). Plan deliverables so every feature touches at least two pillars.

## Technical Depth (33%)
- Real multi-agent loop (Memory → Router → Critic → Coordinator) wired to live Neo4j + Pinecone, not mocked.
- Row-level security on every public table, with documented policies.
- Edge functions split by concern (`ai-agent`, `resource-ai`, `neo4j-proxy`, `pinecone-proxy`, connectors).
- AI SDK + Lovable AI Gateway, `stopWhen: stepCountIs(50)`, structured Output for extraction.
- Tests: Vitest units + Playwright E2E + CI on PR.

## Creativity & Innovation (33%)
- "Second brain" framing: turn complexity into clear next steps.
- Knowledge-graph visualization that surfaces invisible dependencies.
- Three personas in one product — student, PM, founder — without forking the codebase.
- Citation-first chat (every answer ties back to a source).
- Voice + push-to-talk for ambient capture.

## Communication (33%)
- 60-sec demo + 60-sec tech video via HeyGen, narrated cleanly.
- 1-page report (`docs/1-page-report.html`) printable to PDF.
- README hero block answers: what · who · why · how in 90 seconds.
- Persona-driven walkthrough screenshots in `docs/demo-screenshots/`.
- Responsible-AI statement: data sources, isolation, citations, no PII exfiltration.

## Anti-patterns (auto-deduct)
- Mocked AI behavior shipped as "real".
- Single persona demo (rubric rewards range).
- Architecture diagram with no live counterpart in the repo.
- Docs that contradict the running app.