# Database Schema

## Multi-Tenant Isolation

All tables include `org_id` with Row Level Security (RLS) policies. The `has_role()` security definer function prevents RLS recursion.

## Core Tables

### Auth & Organizations
- `profiles` — Auto-created on signup: display_name, avatar_url, department, job_title
- `organizations` — id, name, slug, created_by
- `org_memberships` — user_id, org_id, role (admin/manager/member)
- `user_roles` — Separate RBAC table with `has_role()` function

### Teams
- `teams` — id, org_id, name, description, color
- `team_memberships` — user_id, team_id, org_id, assigned_by, assigned_at

### Communications
- `messages` — source_type (email/slack/meeting_transcript), sender, recipients, content
- `meeting_transcripts` — full text, participants, duration, channel
- `meeting_summaries` — AI-generated notes, key decisions, action items
- `communication_logs` — Aggregated patterns for manager oversight

### Knowledge
- `topics` — Extracted topics/decisions with status, category, version
- `graph_edges` — Entity relationships with type and weight
- `knowledge_versions` — Version-stamped decisions with change history
- `conflicts` — Critic-flagged contradictions with severity and resolution
- `agent_memory` — Metadata referencing Pinecone vectors (id, org_id, key, agent_type)

### Projects
- `projects` — name, status, owner, team, dates, org_id
- `project_milestones` — milestone name, target date, status
- `project_tasks` — title, assignee, status, priority, linked milestone
- `project_updates` — Agent-generated progress entries

### Platform Administration
- `admin_newsletters` — Platform-wide communications with sent_count, status tracking
- `admin_audit_log` — Admin action tracking: action, target_type, target_id, metadata
- `subscriptions` — Org subscription lifecycle: plan, status, trial_ends_at (auto-created on org INSERT)

### System
- `notifications` — Routed notifications with reasoning
- `agent_logs` — Reasoning traces per agent type

## RLS Policies

- All SELECT: `org_id = get_user_org_id()`
- INSERT/UPDATE/DELETE on teams, roles: `has_role('manager')` or `has_role('admin')`
- Communication logs: `has_role('manager')` for SELECT

## External Databases

### Neo4j
Node types: Person, Topic, Decision, Project, Meeting
Relationships: COMMUNICATED_WITH, DECIDED_ON, MENTIONED_IN, WORKS_ON, ATTENDED

### Pinecone
- Index: `org-knowledge`
- Namespace: `org_{org_id}`
- Dimensions: 1536 (text-embedding-3-small)
- Metadata: agent_type, source_type, timestamp, entity_ids
