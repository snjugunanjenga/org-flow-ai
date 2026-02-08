# Architecture

## System Diagram

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

## Data Flow

1. **Ingestion**: Messages arrive via Slack/Gmail/Calendar integrations
2. **Processing**: Memory Agent extracts entities, generates embeddings
3. **Storage**: Structured data → PostgreSQL, relationships → Neo4j, embeddings → Pinecone
4. **Analysis**: Critic Agent detects conflicts, Router Agent identifies stakeholders
5. **Visualization**: 3D graph renders Neo4j-computed layouts
6. **Interaction**: Users query via chat/voice, Coordinator orchestrates agents

## Key Design Decisions

- **Neo4j over client-side graph**: Server-side computation for complex traversals
- **Pinecone over pgvector**: Production-grade vector search with namespace isolation
- **Multi-tenant via RLS**: All data scoped by `org_id` at the database level
- **Edge Functions**: Serverless, auto-scaling, secure secret management
- **Simulated fallback**: All integrations work without API keys using seed data
