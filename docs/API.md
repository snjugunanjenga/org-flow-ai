# API Reference

## Edge Functions

All edge functions are deployed via Supabase. Authentication is required unless noted.

### Agent Functions

| Function | Method | Description |
|----------|--------|-------------|
| `memory-agent` | POST | Process message/transcript, extract entities, generate embeddings |
| `router-agent` | POST | Determine stakeholders for new knowledge |
| `critic-agent` | POST | Scan for conflicts and contradictions |
| `coordinator-agent` | POST | Handle user queries, orchestrate agents |

### Graph Functions

| Function | Method | Description |
|----------|--------|-------------|
| `neo4j-proxy` | POST | Execute Cypher queries securely |
| `graph-layout` | GET | Get pre-computed graph positions |
| `graph-search` | POST | Search graph with filters |

### Integration Functions

| Function | Method | Description |
|----------|--------|-------------|
| `slack-webhook` | POST | Receive Slack events (public) |
| `slack-oauth` | GET/POST | Slack OAuth 2.0 flow |
| `gmail-sync` | POST | Sync emails via Gmail API |
| `calendar-sync` | POST | Sync meetings via Calendar API |

### Embedding Functions

| Function | Method | Description |
|----------|--------|-------------|
| `pinecone-proxy` | POST | Upsert/query Pinecone vectors |
| `generate-embedding` | POST | Generate embedding via OpenAI |

## Caching Strategy

### Client-Side (React Query)
- Graph data: `staleTime: 30s`, `gcTime: 5min`
- Activity feed: `staleTime: 10s`, `gcTime: 2min`
- People/Projects: `staleTime: 5min`, `gcTime: 30min`

### Server-Side (Edge Function)
- Cache-Control headers for stable data
- In-memory cache: `org_id + query_hash + time_bucket`
- Neo4j layouts: 5min TTL
- Pinecone results: cached for repeated queries
- Invalidation: on new message/transcript ingestion
