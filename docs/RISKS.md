# Risks & Mitigations

| Risk | Severity | Mitigation |
|------|----------|------------|
| 3D graph performance with 500+ nodes | High | Clustering, LOD, 2D mobile fallback |
| OpenAI Realtime API latency | Medium | Streaming responses, thinking indicator, text fallback |
| Pinecone cold start / latency | Medium | Result caching, batch queries, pre-warming |
| Neo4j query complexity | Medium | Query timeouts, pre-computed layouts, result limits |
| Transcript summarization quality | Medium | Structured output schemas, manager review flag |
| Multi-tenant data leaks | Critical | RLS everywhere, E2E isolation tests |
| Edge function cold starts | Low | Warm-up pings, skeleton loaders |
| Embedding cost at scale | Medium | Batch processing, caching, text-embedding-3-small |
| Manager privacy concerns | Medium | Communication logs show patterns not content by default |
| OAuth token expiry | Low | Refresh token rotation, graceful fallback to simulated |
