# Doc Skeletons (USAII alignment)

## README.md hero

```
# <Product Name>
> One-sentence value prop in the user's language.

- Track: USAII College Brief 3 — Productivity / Second Brain
- Window: June 14–21, 2026
- Live: <url>  ·  Repo: <url>  ·  Demo video: <url>

## Three personas, one product
- Student → ...
- PM → ...
- Founder → ...
```

## docs/ARCHITECTURE.md outline

1. System diagram (ASCII + PNG export).
2. Data model — tables, RLS posture, GRANTs.
3. Agent loop — Memory → Router → Critic → Coordinator with `stepCountIs(50)`.
4. Tenancy — org_id everywhere, Pinecone namespaces, Neo4j filters.
5. Integrations — Calendar (custom OAuth), Slack + Gmail (connector gateway).

## docs/SUBMISSION.md outline

1. Project title + track + eligibility statement.
2. 150–300 word short description.
3. Problem · Audience · Solution · USP · Implementation · Impact.
4. Tech stack table.
5. Three persona demo logins.
6. Demo + Tech video links.
7. Responsible-AI statement.
8. Devpost submission checklist.

## docs/ROADMAP.md

Phase 1 MVP · Phase 2 Intelligence · Phase 3 Connectors · Phase 4 Voice/Tracking · Phase 5 Quality. Mark each item `[x]` or `[ ]` and link to the PR/commit that closed it.