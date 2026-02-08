# Implementation Plan — Phase Workflow

## Execution Order

### Sprint 1: Foundation
1. **Documentation** — All `/docs` files created
2. **Design System** — Dark theme, tokens, glassmorphism utilities
3. **Landing Page** — Hero, value props, how it works, CTAs

### Sprint 2: Auth & Data
4. **Lovable Cloud** — Enable backend
5. **Auth** — Email/password + Google OAuth, RBAC
6. **Database Schema** — All tables, RLS policies, triggers
7. **Seed Data** — Demo org with realistic data

### Sprint 3: Intelligence
8. **Neo4j Setup** — Graph database, edge function proxy
9. **Pinecone Setup** — Vector index, embedding pipeline
10. **Agent System** — Memory, Router, Critic, Coordinator

### Sprint 4: Dashboard
11. **Dashboard Shell** — Sidebar, layout, navigation
12. **Views** — All 11 dashboard views
13. **3D Graph** — react-force-graph-3d with Neo4j data

### Sprint 5: Integrations
14. **Slack** — OAuth, webhooks, transcript pipeline
15. **Gmail** — OAuth, email sync
16. **Calendar** — Meeting sync, scheduling

### Sprint 6: Advanced
17. **Voice** — OpenAI Realtime API WebSocket
18. **Project Tracking** — Full project management
19. **Manager Oversight** — Communication analytics

### Sprint 7: Quality
20. **Unit Tests** — Vitest coverage
21. **E2E Tests** — Playwright scenarios
22. **CI/CD** — GitHub Actions pipeline
23. **Demo Polish** — Animations, scripted demo
