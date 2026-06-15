# 🧠 Superhuman AI Chief of Staff

> **Your second brain for life, learning, and work.** Capture every source, ground every answer, surface every conflict, and route the right knowledge to the right person — for students, PMs, and founders alike.

[![Built with Lovable](https://img.shields.io/badge/Built%20with-Lovable-ff69b4)](https://lovable.dev)
[![React](https://img.shields.io/badge/React-18.3-61DAFB?logo=react)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6?logo=typescript)](https://typescriptlang.org)
[![Supabase](https://img.shields.io/badge/Backend-Supabase-3FCF8E?logo=supabase)](https://supabase.com)
[![Challenge](https://img.shields.io/badge/Challenge%203-OpenAI%3A%20AI%20Chief%20of%20Staff-blueviolet)]()

**🏆 USAII Global AI Hackathon 2026 — College Brief 3: Productivity / Second Brain**

*(Previously: 4th Hack-Nation Global AI Hackathon · Challenge 3 – OpenAI: AI Chief of Staff)*

**🌐 Live Demo:** [https://org-ai-chief-of-staff.lovable.app](https://org-ai-chief-of-staff.lovable.app)

## Three personas, one product

| Persona | Org | Login | Plan |
|---|---|---|---|
| Overloaded student / IC | Stanford CS Cohort | `student.demo@chiefofstaff.app` | free (trialing) |
| Cross-team PM | Northwind Product | `pm.demo@chiefofstaff.app` | pro |
| Founder / leader | Lumen Robotics | `founder.demo@chiefofstaff.app` | enterprise |

Password for all demo logins: `Demo!2026`. Full submission packet: [`docs/SUBMISSION-USAII.md`](docs/SUBMISSION-USAII.md).

### 🚦 Submission status (June 14–21, 2026)

| Phase | Scope | Status |
|---|---|---|
| 1 — Foundation | 31 tables, RLS, auth, dashboard shell | ✅ shipped |
| 2 — Intelligence | Neo4j + Pinecone + Memory→Router→Critic→Coordinator live | 🟡 wiring |
| 3 — Connectors | Slack + Gmail (Connector Gateway), Calendar polish | 🟡 in progress |
| 4 — Voice + Projects | OpenAI Realtime push-to-talk, AI weekly status | ⏳ pending |
| 5 — Quality + Demo | Vitest, Playwright, CI, demo mode, mobile sweep | ⏳ pending |
| Submission | 24 Playwright screenshots, 2 HeyGen videos, USAII packet | ⏳ pending |

Build-time planning is driven by the **[`120x-architect-sub-agent`](.workspace/skills/120x-architect-sub-agent/SKILL.md)** Lovable skill (Discover → Define → Design → Deliver → Demo). Active tracker: [`.lovable/plan.md`](.lovable/plan.md). Architecture deep-dive: [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md).

---

## 🎯 The Problem

In fast-growing organizations, **critical knowledge is trapped in silos**. Decisions made in one meeting contradict plans from another. Engineers are left out of conversations that affect their work. Project managers juggle fragmented tools to track progress across teams. Leaders lack a single source of truth — leading to duplicated work, missed deadlines, and strategic misalignment.

**40% of decisions made in meetings are never documented.** Cross-team dependencies go untracked until they cause deadline slips. Existing tools (Slack, Jira, Google Docs) create more silos rather than bridging them.

## 💡 The Solution

Superhuman AI Chief of Staff is a **real-time organizational intelligence layer** powered by a multi-agent AI system. It continuously monitors communication, extracts key entities, detects conflicts before they escalate, and routes the right knowledge to the right people at the right time.

Think of it as an **always-on Chief of Staff** that never sleeps, never forgets, and always knows who needs to know what.

---

## ✨ Key Features

| Feature | Description |
|---------|-------------|
| 🤖 **Multi-Agent AI System** | Four specialized agents (Memory, Router, Critic, Coordinator) collaborate to process organizational signals |
| 🔗 **Interactive Knowledge Graph** | 3D visualization of people, topics, decisions, and their relationships — making invisible dependencies visible |
| 📅 **Google Calendar + Meet** | Full OAuth 2.0 integration — sync events, create meetings with auto-generated Google Meet links |
| 💬 **Communication Hub** | Direct messaging, team channels, and cross-functional communication tracking |
| 📊 **Analytics Dashboard** | Real-time metrics on collaboration scores, sentiment analysis, and response times |
| 🔍 **AI Conflict Detection** | Proactive identification of contradictions, resource conflicts, and misaligned priorities |
| 📁 **Document Storage** | Secure file uploads attached to projects, topics, and decisions |
| 👥 **Multi-Tenant Organizations** | Role-based access control (Admin, Manager, Member) with team management |
| 🔔 **Smart Notifications** | AI-routed alerts based on relevance scoring and stakeholder roles |
| 🏗️ **Project Tracking** | Projects, milestones, and tasks with progress visualization and AI-powered risk detection |

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────┐
│                   React Frontend                     │
│  Dashboard · Graph · Calendar · Messages · Analytics │
│  13 interactive views · Framer Motion animations     │
└──────────────────────┬──────────────────────────────┘
                       │ HTTPS / WebSocket
              ┌────────┴────────┐
              │  Supabase Cloud  │
              │  ┌────────────┐  │
              │  │ PostgreSQL │  │  ← 22 tables, RLS-protected
              │  │   Auth     │  │  ← Email + Google OAuth
              │  │  Storage   │  │  ← Document attachments
              │  │Edge Funcs  │  │  ← 6 serverless functions
              │  └────────────┘  │
              └────────┬────────┘
                       │
        ┌──────────────┼──────────────┐
        │              │              │
   ┌────┴────┐  ┌──────┴──────┐  ┌───┴────┐
   │  Neo4j  │  │  Pinecone   │  │ Google │
   │ (Graph) │  │ (Vectors)   │  │  APIs  │
   └─────────┘  └─────────────┘  └────────┘
```

### Data Flow

1. **Ingestion** — Messages, meeting transcripts, and documents flow into the system
2. **Processing** — Memory Agent extracts entities and generates embeddings
3. **Storage** — Structured data → PostgreSQL, relationships → Neo4j, embeddings → Pinecone
4. **Analysis** — Critic Agent detects conflicts, Router Agent identifies stakeholders
5. **Visualization** — Knowledge graph renders organizational relationships in 3D
6. **Interaction** — Users query via AI chat, Coordinator orchestrates agent responses

---

## 🛠️ Tech Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| **Frontend** | React 18, TypeScript, Vite, Tailwind CSS, Framer Motion | Interactive UI with 13 dashboard views |
| **UI Library** | shadcn/ui, Radix Primitives, Recharts | Accessible components and data visualization |
| **Backend** | Supabase (PostgreSQL, Edge Functions, Auth, Storage) | Multi-tenant data layer with Row Level Security |
| **AI Processing** | Lovable AI Gateway (Gemini, GPT-5) | Entity extraction, conflict detection, summarization |
| **Knowledge Graph** | Neo4j Aura | Organizational relationship mapping and traversal |
| **Semantic Memory** | Pinecone + OpenAI Embeddings | Contextual search and similarity matching |
| **Calendar** | Google Calendar API + OAuth 2.0 | Event sync and Google Meet creation |
| **Testing** | Vitest | Unit and integration testing |

---

## 🤖 AI Agent System

The platform's core innovation is a **multi-agent AI architecture** where four specialized agents collaborate:

| Agent | Color | Role |
|-------|-------|------|
| **Memory Agent** | 🔵 Blue | Extracts entities (people, topics, decisions) from signals, generates embeddings, updates the knowledge graph |
| **Router Agent** | 🟢 Green | Scores relevance using semantic similarity and role context, routes notifications to the right stakeholders |
| **Critic Agent** | 🔴 Red | Detects conflicts, contradictions, and communication silos using cross-referencing and semantic comparison |
| **Coordinator Agent** | 🟣 Purple | User-facing orchestrator — handles natural language queries, generates executive summaries, manages agent workflows |

All agents expose their reasoning via collapsible "thinking" panels with color-coded typewriter animations, showing retrieved memories, graph paths, and conflict reasoning with source references.

---

## 🚀 Quick Start

### Prerequisites

- [Node.js](https://nodejs.org/) 18+ (recommended: use [nvm](https://github.com/nvm-sh/nvm))
- A Lovable account (for Cloud backend)

### Installation

```bash
# 1. Clone the repository
git clone <YOUR_GIT_URL>
cd superhuman-cos

# 2. Install dependencies
npm install

# 3. Start development server
npm run dev
```

The app runs at `http://localhost:5173` by default.

### Demo Access

Click **"Try the Demo"** on the landing page to explore with pre-seeded organizational data.

---

## 🔑 Environment & Secrets

The `.env` file is auto-managed by Lovable Cloud. Required backend secrets:

| Secret | Source | Used By |
|--------|--------|---------|
| `OPENAI_API_KEY` | [OpenAI Dashboard](https://platform.openai.com) | Embeddings & AI agents |
| `PINECONE_API_KEY` | [Pinecone Console](https://app.pinecone.io) | Vector DB operations |
| `PINECONE_INDEX_HOST` | Pinecone Console | Vector DB endpoint |
| `NEO4J_URI` | [Neo4j Aura](https://console.neo4j.io) | Graph database |
| `NEO4J_USERNAME` | Neo4j Aura | Graph auth |
| `NEO4J_PASSWORD` | Neo4j Aura | Graph auth |
| `GOOGLE_CLIENT_ID` | [Google Cloud Console](https://console.cloud.google.com) | Calendar OAuth |
| `GOOGLE_CLIENT_SECRET` | Google Cloud Console | Calendar OAuth |

---

## 📅 Google Calendar + Meet Setup

1. Create **OAuth 2.0 Credentials** in [Google Cloud Console](https://console.cloud.google.com/apis/credentials)
2. Enable the **Google Calendar API**
3. Configure the **OAuth Consent Screen** — add test users if in Testing mode
4. Add **Authorized Redirect URIs**:
   - `https://<your-domain>/dashboard/calendar`
5. Store `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` as backend secrets

> ⚠️ **Common 403 Error**: Ensure your redirect URI is whitelisted AND your email is added as a test user in Google Cloud Console (if app is in Testing mode).

---

## 📂 Project Structure

```
src/
├── components/
│   ├── calendar/        # Calendar grid, event form
│   ├── dashboard/       # Layout, sidebar, AI chat agent
│   ├── landing/         # Hero, value props, persona cards
│   └── ui/              # shadcn/ui component library (50+ components)
├── contexts/            # Auth context provider
├── hooks/               # Custom hooks (org-id, google-calendar, toast)
├── pages/
│   ├── dashboard/       # 13 dashboard views
│   └── ...              # Auth, onboarding, landing, accept-invite
├── integrations/        # Supabase client & auto-generated types
└── lib/                 # Utility functions

supabase/
├── functions/
│   ├── ai-agent/        # AI coordinator & entity extraction
│   ├── calendar-sync/   # Google Calendar OAuth & sync
│   ├── neo4j-proxy/     # Graph database proxy
│   ├── pinecone-proxy/  # Vector database proxy
│   ├── seed-demo-data/  # Demo data seeder
│   └── send-invite/     # Team invitation emails
├── migrations/          # Database schema migrations
└── config.toml          # Edge function configuration

docs/                    # Architecture, agents, API, database, submission docs
```

---

## 🔒 Security

- **Row Level Security (RLS)** on all 22 tables — users only see their organization's data
- **Multi-tenant isolation** via `org_id` scoping at the database level
- **OAuth tokens** encrypted and stored per-user with automatic refresh
- **Edge functions** authenticate via JWT before processing any request
- **Role-based access**: Admin, Manager, Member with policy enforcement
- **No hardcoded secrets** — all API keys stored in secure backend vault

---

## 📊 What We Built (Results & Impact)

- **22 database tables** with comprehensive RLS policies for secure multi-tenant operation
- **6 Edge Functions** powering AI agents, calendar sync, graph proxy, vector search, invitations, and demo seeding
- **13 dashboard views**: Overview, Graph, Agents, Messages, Topics, Teams, Projects, Oversight, Notifications, Analytics, Settings, Calendar, Direct Messages
- **4 AI agents** (Memory, Router, Critic, Coordinator) with logged activity and reasoning chains
- **Full Google Calendar + Meet integration** with OAuth token management and automatic refresh
- **Real-time collaboration** with direct messaging and team communication channels
- **50+ UI components** built with shadcn/ui and Radix Primitives

---

## 📖 Documentation

| Document | Description |
|----------|-------------|
| [Architecture](./docs/ARCHITECTURE.md) | System diagram and design decisions |
| [Database Schema](./docs/DATABASE.md) | Complete table definitions and relationships |
| [Agent System](./docs/AGENTS.md) | AI agent pipelines and reasoning display |
| [API Reference](./docs/API.md) | Edge function endpoints and parameters |
| [Testing Strategy](./docs/TESTING.md) | Test approach and coverage |
| [Seed Data](./docs/SEED-DATA.md) | Demo data structure |
| [Risks & Mitigations](./docs/RISKS.md) | Risk assessment |
| [Deployment](./docs/DEPLOYMENT.md) | Deployment guide |
| [Roadmap](./docs/ROADMAP.md) | Future development plans |
| [Submission](./docs/SUBMISSION.md) | Hackathon submission details |

---

## 🏆 Hackathon: Challenge 3 – OpenAI: AI Chief of Staff

This project was built for the **4th Hack-Nation Global AI Hackathon**. It directly addresses **Challenge 3: AI Chief of Staff** and covers all 5 core scenarios:

| Scenario | How We Solve It |
|----------|----------------|
| **Overwhelmed Founder** | Coordinator Agent generates executive briefings surfacing what matters |
| **Left-Out IC** | Router Agent ensures no one is left behind with relevance-scored notifications |
| **Cross-Team PM** | Knowledge graph reveals dependencies, conflicts, and blockers across teams |
| **Communication Gaps** | Critic Agent flags silos, contradictions, and stalled projects |
| **Decision Tracking** | Version-stamped knowledge base with full history and audit trail |

---

## 🏷️ Technologies & Tags

`React` · `TypeScript` · `Tailwind CSS` · `Supabase` · `PostgreSQL` · `Neo4j` · `Pinecone` · `OpenAI` · `Google Calendar API` · `OAuth 2.0` · `Framer Motion` · `Vite` · `Edge Functions` · `Multi-Agent AI` · `Knowledge Graph` · `Semantic Search` · `RLS` · `Multi-Tenant`

---

## 📄 License

This project is proprietary. All rights reserved.

---

<p align="center">
  <b>Built with ❤️ using <a href="https://lovable.dev">Lovable</a></b>
</p>
