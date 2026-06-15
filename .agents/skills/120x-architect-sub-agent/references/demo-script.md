# HeyGen Demo + Tech Video Scripts

Both videos are 60 seconds, narrated by a HeyGen avatar over Playwright screen captures plus the screenshot suite from `docs/demo-screenshots/`.

## Demo Video (60s) — three personas, one product

```
0:00–0:08  HOOK
           "Modern life is overloaded. Decisions, sources, deadlines —
            all colliding. Meet your second brain."

0:08–0:22  STUDENT (Stanford CS Cohort)
           [show notebook → upload PDF → grounded answer with citations]
           "A student drops a paper in. The Memory agent reads it,
            cites it, and turns it into action items."

0:22–0:38  PM (Northwind Product)
           [graph view → conflict node → Critic panel → Router list]
           "A PM sees a cross-team conflict surface itself. The Critic
            explains why. The Router decides who needs to know."

0:38–0:52  FOUNDER (Lumen Robotics)
           [overview → daily brief → analytics]
           "A founder gets a single daily brief — synthesized from
            every signal, every team, every meeting."

0:52–0:60  CLOSE
           "One second brain. For life, learning, and work."
```

## Tech Video (60s)

```
0:00–0:12  STACK
           "React + TypeScript + Tailwind. Lovable Cloud powers Postgres
            with Row Level Security, Auth, Storage, and Edge Functions.
            Neo4j for the knowledge graph. Pinecone for semantic memory."

0:12–0:30  AGENT LOOP
           "Four agents collaborate through the AI SDK on the Lovable
            Gateway. Memory extracts. Router scores relevance. Critic
            detects conflicts via Pinecone similarity. Coordinator
            synthesizes. Bounded with stepCountIs(50)."

0:30–0:45  ISOLATION
           "Every table is scoped by org_id with RLS. Pinecone uses
            per-org namespaces. Neo4j queries filter by tenant. Three
            personas, one codebase, zero cross-tenant leakage."

0:45–0:60  RESPONSIBLE AI
           "Every answer cites its source. No PII leaves the tenant.
            Agents log every step to admin_audit_log. That's how we
            ship AI you can trust."
```

## HeyGen production notes

- Avatar voice: confident, mid-pace, US-neutral.
- B-roll: 1280×1800 screenshots from `docs/demo-screenshots/` + 720p screen recording of the live preview.
- Captions on for accessibility.
- Outputs: `docs/videos/demo.mp4`, `docs/videos/tech.mp4`. Public URLs go into `docs/SUBMISSION.md`.