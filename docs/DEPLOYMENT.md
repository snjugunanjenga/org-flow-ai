# Deployment

## Required Secrets

| Secret | Source | Used By |
|--------|--------|---------|
| `OPENAI_API_KEY` | OpenAI Dashboard | Embeddings, Coordinator, Voice |
| `PINECONE_API_KEY` | Pinecone Console | Vector DB operations |
| `PINECONE_INDEX_URL` | Pinecone Console | Vector DB endpoint |
| `NEO4J_URI` | Neo4j Aura | Graph database |
| `NEO4J_USERNAME` | Neo4j Aura | Graph auth |
| `NEO4J_PASSWORD` | Neo4j Aura | Graph auth |
| `SLACK_CLIENT_ID` | Slack API Dashboard | OAuth flow |
| `SLACK_CLIENT_SECRET` | Slack API Dashboard | OAuth flow |
| `SLACK_SIGNING_SECRET` | Slack API Dashboard | Webhook verification |
| `GOOGLE_CLIENT_ID` | Google Cloud Console | Gmail/Calendar OAuth |
| `GOOGLE_CLIENT_SECRET` | Google Cloud Console | Gmail/Calendar OAuth |

## Environment Setup

1. Enable Lovable Cloud (provisions Supabase)
2. Add secrets via Lovable Cloud > Secrets
3. Deploy edge functions (automatic on push)
4. Run seed data migration
5. Configure OAuth redirect URLs

## GitHub Actions

CI/CD pipeline runs on push/PR to `main`:
- Lint → Unit Tests → Build → E2E Tests → Deploy

See `.github/workflows/ci.yml` for full configuration.
