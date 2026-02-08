# Multi-Agent System

## Architecture

Four specialized agents, each with distinct responsibilities and color coding.

## Memory Agent (Blue — `hsl(220, 80%, 65%)`)

**Purpose**: Extract, embed, and store organizational knowledge.

### Pipeline
1. Receive message/transcript from integration
2. Extract entities (people, topics, decisions) via LLM
3. Generate embedding via OpenAI `text-embedding-3-small`
4. Upsert to Pinecone (namespaced by org_id)
5. Store metadata in Supabase `agent_memory` table
6. Update Neo4j graph with new nodes/relationships
7. Create version-stamped `knowledge_versions` entry

### Meeting Transcript Pipeline
1. Receive full transcript from Slack integration
2. Generate structured summary (key points, decisions, action items)
3. Save summary to `meeting_summaries`
4. Extract decisions → link to existing topics/projects
5. Trigger Critic Agent for conflict detection

## Router Agent (Green — `hsl(150, 70%, 50%)`)

**Purpose**: Determine who needs to know what.

### Logic
1. Receive new knowledge entry from Memory Agent
2. Query Pinecone for semantically related stakeholders
3. Score relevance using knowledge radius and role
4. Generate "who needs to know" list with reasoning
5. Create notifications in `notifications` table
6. Post-meeting: notify absent stakeholders with summary

## Critic Agent (Red — `hsl(0, 70%, 55%)`)

**Purpose**: Detect conflicts, gaps, and staleness in knowledge.

### Detection Methods
- Semantic search for contradictory decisions (Pinecone cosine similarity)
- Cross-reference meeting summaries with existing knowledge versions
- Flag stalled projects (no activity threshold)
- Identify communication silos (Neo4j community detection)
- Alert on missed milestones

## Coordinator Agent (Purple — `hsl(280, 70%, 65%)`)

**Purpose**: User-facing orchestrator for natural language queries.

### Capabilities
- Natural language queries with hybrid retrieval (Pinecone + Neo4j)
- Orchestrate Memory/Router/Critic agents as needed
- Persistent conversation memory stored as embeddings
- Work planning and project status synthesis
- Communication drafting
- Voice command interpretation

## Reasoning Display

All agents expose their reasoning via collapsible "thinking" panels:
- Color-coded by agent type
- Typewriter animation for progressive disclosure
- Shows retrieved memories with Pinecone relevance scores
- Shows Neo4j graph paths for traversal queries
- Shows conflict reasoning with source references
