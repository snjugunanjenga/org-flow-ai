# Roadmap

## Phase 1: MVP (Current)
- [x] Project documentation
- [x] Landing page with 3D background
- [x] Auth & multi-tenant architecture
- [x] Team & role management
- [x] Database schema & seed data
- [x] Dashboard shell with navigation
- [x] Platform Admin (analytics, org management, audit log, newsletters)
- [x] Multi-tenant subscription enforcement (OrgProvider, FeatureGate, useSubscription)
- [x] AdminGuard route protection
- [x] Super Admin account with mock data

## Phase 2: Intelligence Layer
- [ ] Neo4j knowledge graph integration
- [ ] Pinecone vector DB + embeddings
- [ ] Multi-agent system (Memory, Router, Critic, Coordinator)
- [ ] Agent reasoning display

## Phase 3: Integrations
- [ ] Slack connector (real + simulated)
- [ ] Gmail connector (real + simulated)
- [ ] Google Calendar connector (real + simulated)
- [ ] Meeting transcript pipeline

## Phase 4: Advanced Features
- [ ] Voice interaction (OpenAI Realtime API)
- [ ] Project tracking with agent-generated updates
- [ ] Manager communication oversight
- [ ] Caching layer (React Query + Edge Function)

## Phase 5: Quality & Polish
- [ ] Vitest unit/integration tests (80% coverage)
- [ ] Playwright E2E tests
- [ ] GitHub Actions CI/CD
- [ ] Dark theme, glassmorphism, animations
- [ ] Demo mode with scripted scenarios
- [ ] Mobile responsive + PWA

## Phase 6: Meeting Intelligence + Responsible AI
See `docs/ARCHITECTURE-PLAN.md` for the vertical-sprint breakdown.
- [ ] Connector Trust (Calendar/Meet test + auto-sync)
- [ ] Inngest + Upstash Redis orchestration backbone
- [ ] Meeting pipeline: summarize → embed → route → critic
- [ ] Responsible-AI guardrails + governance log
- [ ] Playwright E2E across 3 personas
## Scaling Considerations
- Neo4j cluster for graph query throughput
- Pinecone pod scaling for embedding volume
- Edge function concurrency limits
- PostgreSQL connection pooling
- CDN for static assets

## Monitoring
- Edge function error rates and latency
- Neo4j query performance
- Pinecone query latency and index fullness
- Agent response quality metrics
- User engagement analytics
