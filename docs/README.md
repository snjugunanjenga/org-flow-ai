# Superhuman AI Chief of Staff

## Vision

An AI-powered organizational intelligence platform that serves as a "Chief of Staff" — tracking decisions, routing information, detecting conflicts, and providing a living source of truth via an interactive 3D knowledge graph.

## Hackathon Alignment

This project addresses all 5 core hackathon scenarios:
1. **Overwhelmed Founder**: AI surfaces what matters across all teams
2. **Left-Out IC**: Router Agent ensures no one is left behind
3. **Cross-Team PM**: Knowledge graph reveals dependencies and conflicts
4. **Communication Gaps**: Critic Agent flags silos and contradictions
5. **Decision Tracking**: Version-stamped knowledge base with full history

## Quick Start

```bash
# Clone and install
git clone <repo-url>
cd superhuman-cos
npm install

# Start development
npm run dev
```

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React + Vite + Tailwind + react-force-graph-3d |
| Auth | Supabase Auth (email + Google OAuth) |
| Relational DB | Supabase PostgreSQL (RLS, multi-tenant) |
| Graph DB | Neo4j |
| Vector DB | Pinecone |
| Embeddings | OpenAI text-embedding-3-small |
| Edge Functions | Supabase |
| Voice | OpenAI Realtime API |
| Integrations | Slack, Gmail, Google Calendar |
| Testing | Vitest + Playwright |
| CI/CD | GitHub Actions |

## Documentation

- [Architecture](./ARCHITECTURE.md)
- [Database Schema](./DATABASE.md)
- [Agent System](./AGENTS.md)
- [API Reference](./API.md)
- [Testing Strategy](./TESTING.md)
- [Seed Data](./SEED-DATA.md)
- [Risks & Mitigations](./RISKS.md)
- [Deployment](./DEPLOYMENT.md)
- [Roadmap](./ROADMAP.md)
- [Implementation Plan](./PLAN.md)
