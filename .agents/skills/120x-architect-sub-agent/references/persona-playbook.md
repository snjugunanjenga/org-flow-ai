# Persona Playbook — Three Demo Orgs

All three orgs coexist in the multi-tenant DB. Each has its own admin login, subscription plan, and signature flow. Demo Mode in Platform Admin re-seeds them idempotently via `supabase/functions/seed-personas`.

| Persona | Org | Admin login | Plan | Color |
|---|---|---|---|---|
| Overloaded Student / IC | **Stanford CS Cohort** | `student.demo@chiefofstaff.app` / `Demo!2026` | free (trialing) | indigo |
| Cross-team PM | **Northwind Product** | `pm.demo@chiefofstaff.app` / `Demo!2026` | pro | emerald |
| Founder / Leader | **Lumen Robotics** | `founder.demo@chiefofstaff.app` / `Demo!2026` | enterprise | amber |

## Stanford CS Cohort — Student / IC

- 3 teams: Coursework, Research, Career.
- 4 notebooks: Algorithms, ML Systems, Thesis, Interview Prep.
- ~20 sources (PDFs/URLs) split across notebooks.
- 18 grounded chats with citations; 12 AI-generated action items.

**Demo flow (90s):** Login → open `Thesis` notebook → upload PDF → ask "summarize the methodology" → see citations → open Action Items pane.

## Northwind Product — Cross-team PM

- 3 teams: Engineering, Design, GTM.
- 5 projects with milestones.
- 22 topics (decisions), 6 conflicts, 18 routed notifications, 25 messages.

**Demo flow (90s):** Login → Graph view → click conflict node → Critic reasoning panel → Router "who needs to know" list → Notifications tab.

## Lumen Robotics — Founder / Leader

- 4 teams: Hardware, Firmware, Ops, Finance.
- 6 projects, 20 meeting summaries, 15 agent_logs across all four agents.
- Coordinator-generated daily executive brief on Overview.

**Demo flow (90s):** Login → Overview → daily brief card → Analytics → cross-team risk widget.

## Screenshot checklist (8 per org)

1. Login screen with prefilled email.
2. Dashboard overview / KPIs.
3. Sidebar expanded showing all views.
4. Signature view #1 (Notebook / Graph / Overview brief).
5. Signature view #2 (Chat citations / Critic reasoning / Analytics).
6. Agent reasoning panel mid-stream.
7. Notifications or Action Items.
8. Settings → Subscription plan badge (showcases tier).

Save as `docs/demo-screenshots/<org-slug>/<step>.png` and add an entry to `manifest.json`.