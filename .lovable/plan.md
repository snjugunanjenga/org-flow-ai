

# Implementation Plan

This plan covers four workstreams: fixing the onboarding flow, adding onboarding tests, redesigning the Knowledge Graph as a food-web visualization, and building a new "Resources" tab that emulates Google NotebookLM.

---

## 1. Fix the Onboarding Flow

**Current Issues Identified:**
- The `ProtectedRoute` redirects to `/onboarding` if `onboarding_completed === false`, but after login in `Auth.tsx`, the user navigates directly to `/dashboard` without checking onboarding state -- this can cause a flash or race condition.
- If a user goes back to step 0 after creating an org, they can create duplicate organizations.
- The `user_roles` table INSERT is restricted by RLS (users can't insert), so `await supabase.from("user_roles").insert(...)` in step 0 silently fails.
- No guard on the `/onboarding` route itself -- users who already completed onboarding can revisit it and create duplicate orgs.

**Fixes:**
- Add an `OnboardingGuard` wrapper that redirects already-onboarded users away from `/onboarding` back to `/dashboard`.
- Fix the `user_roles` insertion: either remove it (since `org_memberships` already tracks the admin role) or add an RLS policy via migration to allow self-insert.
- Disable the "Back" button on step 1 if the org was already created, preventing duplicate org creation.
- After login in `Auth.tsx`, navigate to `/dashboard` and let `ProtectedRoute` handle the onboarding redirect (this already works correctly).

**Files to modify:**
- `src/pages/Onboarding.tsx` -- add guard logic, disable back on step 0
- `src/App.tsx` -- wrap `/onboarding` route with an auth check
- SQL migration -- add RLS policy for `user_roles` self-insert, OR remove the dead insert call

---

## 2. Onboarding Tests (Vitest + React Testing Library)

**Test file:** `src/pages/__tests__/Onboarding.test.tsx`

**Test cases:**
1. Renders step 0 (Create Organization) by default
2. Disables "Create Organization" button when org name is empty
3. Advances to step 1 after org creation (mocked Supabase)
4. Renders team chips on step 1 with suggested teams
5. Can add and remove custom teams
6. Advances to step 2 after team creation
7. Can add invite entries with email and role
8. "Skip & Go to Dashboard" button present when no invites added
9. Validates email format before adding invite

**Test file:** `src/components/auth/__tests__/ProtectedRoute.test.tsx`

**Test cases:**
1. Shows loading spinner while checking auth
2. Redirects to `/auth` when no user
3. Redirects to `/onboarding` when `onboarding_completed` is false
4. Renders children when authenticated and onboarded

**Mocking strategy:** Mock `@/contexts/AuthContext` and `@/integrations/supabase/client` to control auth state and database responses without hitting the backend.

---

## 3. Knowledge Graph -- Food-Web Visualization

**Concept:** Replace the current card grid with an interactive force-directed graph rendered on an HTML Canvas (no new dependencies). Nodes are positioned using a simple force simulation. Edges are drawn as curved lines with arrowheads, resembling an ecological food-web diagram.

**Visual design:**
- Nodes rendered as circles with type-based colors (existing palette) and size proportional to connection count
- Edges drawn as bezier curves with directional arrows showing the relationship flow (source -> target)
- Animated entrance: nodes float in from random positions and settle via spring physics
- Hover tooltip shows node label, type, and connection count
- Click opens the existing detail dialog
- Type filter buttons remain above the canvas
- Legend with node type colors stays visible

**Implementation:**
- Create `src/components/graph/ForceGraph.tsx` -- a Canvas-based force-directed graph component
  - Simple force simulation: repulsion between all nodes, attraction along edges, center gravity
  - Render loop with `requestAnimationFrame`
  - Mouse interaction: hover detection, click detection, drag-to-pan
- Modify `src/pages/dashboard/GraphView.tsx` -- replace the card grid with `<ForceGraph>`, keep filter bar and dialog
- Keep the relationships list below as a collapsible section for accessibility

**No new dependencies required** -- pure Canvas 2D rendering, similar to the existing `ParticleGraph.tsx` pattern.

---

## 4. New "Resources" Tab -- NotebookLM-Style Document Intelligence

Based on research into Google NotebookLM's feature set, this tab will provide a source-grounded AI research workspace.

### Core Features to Implement:

| Feature | Description |
|---|---|
| **Source Upload** | Upload Docx, Images, PDFs, paste text, paste URLs. Store in existing `documents` storage bucket. Track metadata in a new `resource_sources` table. |
| **Notebook Organization** | Group sources into "Notebooks" (a new `resource_notebooks` table). Each notebook is scoped to a project. |
| **Source-Grounded Q&A** | Chat interface that sends questions + source content to Lovable AI. Responses include inline citations referencing specific sources. |
| **Auto-Generated Guides** | On source upload, generate a notebook guide: key themes, table of contents, and suggested questions. |
| **AI Reports** | Generate structured reports (study guides, briefings, FAQs) grounded in selected sources. |
| **Mind Map View** | Visualize topics and relationships extracted from sources as an interactive mind map (Canvas-based, similar to the food-web graph). |
| **Source Pinning** | Pin specific sources for a query so the AI only uses those documents. |
| **Citation Verification** | Each AI response includes clickable citations that highlight the source passage. |

### Database Changes (SQL Migration):

```text
resource_notebooks
  - id (uuid, PK)
  - org_id (uuid, FK)
  - project_id (uuid, nullable FK to projects)
  - title (text)
  - description (text, nullable)
  - created_by (uuid)
  - created_at, updated_at

resource_sources
  - id (uuid, PK)
  - notebook_id (uuid, FK to resource_notebooks)
  - org_id (uuid)
  - source_type (text: 'pdf', 'text', 'url', 'gdoc')
  - title (text)
  - content (text) -- extracted text content
  - file_url (text, nullable) -- storage bucket URL
  - metadata (jsonb)
  - created_at

resource_chats
  - id (uuid, PK)
  - notebook_id (uuid, FK)
  - org_id (uuid)
  - user_id (uuid)
  - role (text: 'user' | 'assistant')
  - content (text)
  - citations (jsonb, nullable) -- [{source_id, passage, page}]
  - created_at

resource_outputs
  - id (uuid, PK)
  - notebook_id (uuid, FK)
  - org_id (uuid)
  - output_type (text: 'guide', 'report', 'faq', 'mind_map')
  - content (jsonb)
  - created_at
```

All tables scoped by `org_id` with RLS using `is_org_member()`.

### Frontend Architecture:

```text
src/pages/dashboard/ResourcesView.tsx         -- Main page
src/components/resources/NotebookList.tsx      -- List/create notebooks
src/components/resources/NotebookDetail.tsx    -- Single notebook workspace
src/components/resources/SourceUploader.tsx    -- Upload/paste sources
src/components/resources/SourceList.tsx        -- List sources with pin toggle
src/components/resources/ResourceChat.tsx      -- Grounded Q&A chat (streaming)
src/components/resources/NotebookGuide.tsx     -- Auto-generated guide display
src/components/resources/ReportGenerator.tsx   -- Generate structured reports
src/components/resources/MindMapView.tsx       -- Canvas mind map visualization
```

### Edge Function:

**`supabase/functions/resource-ai/index.ts`** -- Handles:
- `action: "generate-guide"` -- Takes source content, returns themes/TOC/questions
- `action: "chat"` -- Grounded Q&A with citations (streaming via Lovable AI)
- `action: "generate-report"` -- Structured report generation with citations
- `action: "extract-mind-map"` -- Extract topics and relationships for mind map

Uses Lovable AI gateway (`google/gemini-3-flash-preview`) with source content injected as context. System prompt instructs the model to cite sources by ID and passage.

### Sidebar Update:

Add to `mainNav` in `DashboardSidebar.tsx`:
```text
{ title: "Resources", url: "/dashboard/resources", icon: BookOpen }
```

Add route in `App.tsx`:
```text
<Route path="resources" element={<ResourcesView />} />
```

---

## Implementation Order

1. **Onboarding fixes** -- quick wins, unblocks testing
2. **Onboarding tests** -- validates the flow works
3. **Resources tab database + skeleton UI** -- tables, sidebar, basic CRUD
4. **Resources AI edge function** -- grounded Q&A and report generation
5. **Knowledge Graph food-web** -- visual redesign with force simulation
6. **Resources mind map + polish** -- Canvas visualization for extracted topics

