# 🧠 Superhuman AI Chief of Staff

> **An AI-powered organizational intelligence platform that acts as your always-on Chief of Staff** — tracking decisions, routing knowledge, detecting conflicts, and providing a living source of truth across your entire organization.

[![Built with Lovable](https://img.shields.io/badge/Built%20with-Lovable-ff69b4)](https://lovable.dev)
[![React](https://img.shields.io/badge/React-18.3-61DAFB?logo=react)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6?logo=typescript)](https://typescriptlang.org)
[![Supabase](https://img.shields.io/badge/Backend-Supabase-3FCF8E?logo=supabase)](https://supabase.com)

---

## 🎯 Problem Statement

Organizations suffer from **fragmented communication, lost decisions, and invisible conflicts**. Critical knowledge is trapped in silos, meetings go unrecorded, and leaders lack a single source of truth for what's happening across teams. The result: duplicated work, missed deadlines, and strategic misalignment.

## 💡 Solution

Superhuman AI Chief of Staff is a **real-time organizational intelligence layer** that:

- **Ingests signals** from meetings, messages, and documents
- **Extracts entities** (people, decisions, topics, dependencies) using AI
- **Routes knowledge** to the right stakeholders automatically
- **Detects conflicts** before they escalate
- **Visualizes everything** in an interactive knowledge graph

---

## ✨ Key Features

| Feature | Description |
|---------|-------------|
| 🤖 **AI Agent System** | Four specialized agents (Memory, Router, Critic, Coordinator) work together to process organizational signals |
| 🔗 **Knowledge Graph** | Interactive 3D visualization of people, topics, decisions, and their relationships |
| 📅 **Google Calendar + Meet** | Full OAuth integration — sync events, create meetings with auto-generated Google Meet links |
| 💬 **Communication Hub** | Direct messaging, team channels, and cross-functional communication tracking |
| 📊 **Analytics Dashboard** | Real-time metrics on team collaboration, sentiment analysis, and response times |
| 🔍 **Conflict Detection** | AI-powered identification of contradictions, resource conflicts, and misaligned priorities |
| 📁 **Document Storage** | Secure file uploads attached to projects, topics, and decisions |
| 👥 **Multi-Tenant Orgs** | Role-based access control (Admin, Manager, Member) with team management |
| 🔔 **Smart Notifications** | AI-routed alerts based on relevance scoring and stakeholder roles |
| 🏗️ **Project Tracking** | Full CRUD for projects, milestones, and tasks with progress visualization |

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────┐
│                   React Frontend                     │
│  Dashboard · Graph · Calendar · Messages · Analytics │
└──────────────────────┬──────────────────────────────┘
                       │
              ┌────────┴────────┐
              │  Supabase Cloud  │
              │  ┌────────────┐  │
              │  │ PostgreSQL │  │  ← RLS-protected, multi-tenant
              │  │   Auth     │  │  ← Email + OAuth
              │  │  Storage   │  │  ← Document attachments
              │  │Edge Funcs  │  │  ← AI agents, Calendar sync, Proxies
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

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | React 18 · TypeScript · Vite · Tailwind CSS · Framer Motion |
| **UI Components** | shadcn/ui · Radix Primitives · Recharts |
| **Backend** | Supabase (PostgreSQL, Edge Functions, Storage, Auth) |
| **AI** | Lovable AI Gateway (Gemini, GPT-5) · OpenAI Embeddings |
| **Graph DB** | Neo4j Aura (organizational knowledge graph) |
| **Vector DB** | Pinecone (semantic search & memory) |
| **Calendar** | Google Calendar API · Google Meet (OAuth 2.0) |
| **Testing** | Vitest |

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

Click **"Try the Demo"** on the landing page to explore with pre-seeded data (requires seed data to be loaded).

---

## 🔑 Environment Variables

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

## 📅 Google Calendar Setup

To enable Google Calendar + Meet integration:

1. **Create OAuth Credentials** in [Google Cloud Console](https://console.cloud.google.com/apis/credentials)
2. **Enable APIs**: Google Calendar API
3. **Configure OAuth Consent Screen**:
   - Add your domain(s) to Authorized Domains
   - Add scopes: `calendar.readonly`, `calendar.events`
   - **If in "Testing" mode**: Add your email as a test user
4. **Add Authorized Redirect URIs**:
   - `https://<your-preview-domain>/dashboard/calendar`
   - `https://<your-published-domain>/dashboard/calendar`
5. Store `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` as backend secrets

> ⚠️ **Common 403 Error**: If you get a 403 when clicking "Connect Google Calendar", ensure your redirect URI is whitelisted AND your email is added as a test user in Google Cloud Console (if the app is in Testing mode).

---

## 📂 Project Structure

```
src/
├── components/
│   ├── calendar/        # Calendar grid & event form
│   ├── dashboard/       # Layout, sidebar, AI chat agent
│   ├── landing/         # Hero, value props, persona cards
│   └── ui/              # shadcn/ui component library
├── contexts/            # Auth context provider
├── hooks/               # Custom hooks (org-id, google-calendar, toast)
├── pages/
│   ├── dashboard/       # All dashboard views (13 views)
│   └── ...              # Auth, onboarding, landing
├── integrations/        # Supabase client & types (auto-generated)
└── lib/                 # Utility functions

supabase/
├── functions/
│   ├── ai-agent/        # AI coordinator, entity extraction
│   ├── calendar-sync/   # Google Calendar OAuth & sync
│   ├── neo4j-proxy/     # Graph database proxy
│   ├── pinecone-proxy/  # Vector database proxy
│   ├── seed-demo-data/  # Demo data seeder
│   └── send-invite/     # Team invitation emails
├── migrations/          # Database schema migrations
└── config.toml          # Edge function configuration

docs/                    # Architecture, API, database, and submission docs
```

---

## 🤖 AI Agent System

The platform employs four specialized AI agents:

| Agent | Role |
|-------|------|
| **Memory Agent** | Extracts entities (people, topics, decisions) and updates the knowledge graph |
| **Router Agent** | Scores relevance and routes notifications to the right stakeholders |
| **Critic Agent** | Detects conflicts, contradictions, and communication silos |
| **Coordinator Agent** | Generates executive summaries and orchestrates agent workflows |

---

## 🔒 Security

- **Row Level Security (RLS)** on all tables — users only see their organization's data
- **Multi-tenant isolation** via `org_id` on every table
- **OAuth tokens** encrypted and stored per-user in `google_oauth_tokens`
- **Edge functions** authenticate via JWT before processing requests
- **Role-based access**: Admin, Manager, Member with policy enforcement

---

## 📖 Documentation

- [Architecture](./docs/ARCHITECTURE.md)
- [Database Schema](./docs/DATABASE.md)
- [Agent System](./docs/AGENTS.md)
- [API Reference](./docs/API.md)
- [Testing Strategy](./docs/TESTING.md)
- [Seed Data](./docs/SEED-DATA.md)
- [Risks & Mitigations](./docs/RISKS.md)
- [Deployment](./docs/DEPLOYMENT.md)
- [Roadmap](./docs/ROADMAP.md)
- [Implementation Plan](./docs/PLAN.md)
- [Hackathon Submission](./docs/SUBMISSION.md)

---

## 🏆 Hackathon

This project was built for the **Global AI Hackathon (Hack-Nation 4th Edition)**. It addresses all 5 core hackathon scenarios:

1. **Overwhelmed Founder** → AI surfaces what matters across all teams
2. **Left-Out IC** → Router Agent ensures no one is left behind
3. **Cross-Team PM** → Knowledge graph reveals dependencies and conflicts
4. **Communication Gaps** → Critic Agent flags silos and contradictions
5. **Decision Tracking** → Version-stamped knowledge base with full history

---

## 📄 License

This project is proprietary. All rights reserved.

---

<p align="center">
  <b>Built with ❤️ using <a href="https://lovable.dev">Lovable</a></b>
</p>
