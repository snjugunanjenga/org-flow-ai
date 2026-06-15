
# Phases 4–6 — USAII Brief 3 Submission (Screenshot-Driven HeyGen)

## 0. Reframing (read first)

Attached brief = **USAII Challenge 3, Undergraduate "Second Brain"**, not Hack-Nation. Rubric: Problem 20 / AI Reasoning 30 / Solution Design 25 / Impact 15 / Responsible AI 10. We pitch **Direction B — Zero-to-One Builder**: take a vague student/early-career idea and turn it into a 30/60/90 plan. Our Coordinator/Memory/Critic/Router stack already does this — we just retell the story for the student persona.

Brief-specific deliverables we don't yet satisfy:
- 3–5 minute pitch video (Hack-Nation only needed 60 s).
- Explicit Human-in-the-Loop callout.
- Explicit Risk + Mitigation.
- Devpost Qualifier Approval Code field.

We already have a complete library of **real product screenshots** under `docs/demo-screenshots/{student,pm,founder,ai-chat}/` — 37 PNGs. The plan reuses them as the illustration source for HeyGen instead of recording new video.

---

## Phase 4 — Submission docs (no app code)

1. `docs/SUBMISSION-USAII.md` — rewrite against Devpost field list:
   - Qualifier Approval Code (placeholder)
   - Track: UG · Challenge 3 · Direction B
   - Project Description (300 words, Second Brain framing)
   - AI Architecture table: **Inputs → AI capability → Processing → Outputs**
   - Human-in-Loop: *"AI never commits a milestone. Every Coordinator-drafted milestone needs explicit user Accept."* Why: students must own their roadmap.
   - Responsible AI Guardrail: risk = **over-reliance / false confidence**. Mitigation = **confidence chip** (low/med/high) derived from Pinecone similarity + Critic conflict count, with source memories shown inline.
   - Tools Used, Data Disclosure (synthetic Apple-org seed), free vs paid breakdown.
2. `docs/RESPONSIBLE-AI.md` — single-page expansion with screenshots of confidence chip + Accept/Skip UI.
3. `docs/1-page-report.html` — refresh as judges' PDF one-pager.
4. `docs/SUBMISSION.md` — add note pointing to USAII doc so Hack-Nation answers don't leak.

---

## Phase 5 — Two HeyGen videos from screenshots (not screen-capture)

**Approach:** HeyGen avatar narrates over Ken-Burns pans/zooms on the existing PNG screenshots. No Playwright video recording, no live screen capture. Master cut = both 60 s reels + a 90 s middle stitched into one ≤ 3 min Devpost video.

Output: `/mnt/documents/heygen/{reel-a-intro.mp4, reel-b-demo.mp4, pitch-final-3min.mp4}`.

### Pipeline

```text
Real PNGs (docs/demo-screenshots/**) ──┐
HeyGen avatar MP4 (transparent BG)   ──┼──► ffmpeg compositor (scripts/compose-heygen.sh, new)
Captions (.ass from HeyGen export)   ──┤      • Ken Burns zoompan on stills
Ducked music bed (royalty-free)      ──┘      • avatar PiP bottom-right 320×180
                                              • burned captions Inter 48px white
                                              • concat: A + middle + B + 5 s outro
                                              ▼
                                       pitch-final-3min.mp4
```

### Screenshot-to-shot mapping (real files, already in repo)

| Shot | PNG | Ken-Burns motion |
|---|---|---|
| Landing | `student/01-overview.png` | slow zoom-in 1.0 → 1.08 |
| Plan view | `student/02-projects.png` | pan-left across milestones |
| Knowledge graph | `pm/03-graph.png` | zoom-out 1.15 → 1.0 |
| Agent panel | `founder/04-agents.png` | static + fade-in callouts |
| Resources/notebooks | `student/07-resources.png` | pan-down |
| Calendar + Meet | `founder/08-calendar.png` | zoom-in on event card |
| Conflict (Critic) | `pm/05-topics.png` | red-tint flash + zoom |
| Analytics | `founder/11-analytics.png` | pan across charts |
| Chat: confidence chip | `ai-chat/3_chat_response.png` | zoom-in 1.0 → 1.25 onto chip |

If a beat needs a still we don't have (confidence chip, Accept/Skip), Phase 6 ships the UI and we re-run `docs/demo-screenshots/walkthrough.py` to capture only the missing frames.

### Reel A — Intro / pitch (60 s) — **script for approval**

| t | Visual | Voiceover |
|---|---|---|
| 0–6 | Avatar full-frame, logo lower-third | "Every student has a great idea that dies in a Google Doc. We built the Second Brain that doesn't let that happen." |
| 6–14 | Zoom on `student/01-overview.png` | "Modern life overloads you with information and forces high-stakes decisions with incomplete data. Tools either oversimplify with pros-and-cons lists, or overwhelm." |
| 14–24 | Pan across `student/02-projects.png` | "Superhuman Second Brain turns a vague idea into a 30, 60, 90 execution plan — using four cooperating AI agents, not one chatbot." |
| 24–34 | Static `founder/04-agents.png` with callouts | "Memory extracts. Router routes. Critic catches contradictions. Coordinator answers in plain English." |
| 34–44 | Stack chip overlay on `pm/03-graph.png` | "React, Supabase row-level security, Neo4j graph, Pinecone embeddings, Gemini via Lovable AI Gateway. Production-grade, not a prototype." |
| 44–52 | Three-tile pricing card (generated PNG) | "Free for students. Twelve dollars a month for solo creators. Thirty-nine per seat for cohorts." |
| 52–60 | Avatar + URL card | "Built in seven days by a three-person team. Try it: second-brain.lovable.app." |

### Reel B — Demo / persona walkthrough (60 s) — **script for approval**

| t | Visual | Voiceover |
|---|---|---|
| 0–6 | `student/01-overview.png` zoom-in | "Meet Steve, an early-career PM at Apple, signing in to plan an internal AI guild." |
| 6–14 | `ai-chat/2_chat_input.png` → `ai-chat/3_chat_response.png` | "He asks the Coordinator: launch this guild in ninety days." |
| 14–24 | `student/02-projects.png` with Accept/Skip overlay | "Every milestone is a *suggestion*. Steve accepts the ones he owns. The AI never commits for him." |
| 24–32 | Zoom on confidence chip in `ai-chat/3_chat_response.png` | "Each answer carries a confidence chip — derived from Pinecone similarity and Critic agreement, not vibes." |
| 32–42 | `founder/08-calendar.png` + Gmail/Slack OAuth logos | "Gmail, Slack, Google Calendar and Meet feed the Memory agent. One click each." |
| 42–52 | `pm/05-topics.png` red-tint flash + `pm/03-graph.png` pan | "The Critic agent flags contradictions across meetings before they cost a week." |
| 52–60 | Avatar full-frame + URL | "From idea, to plan, to action — in one tool. That's Second Brain." |

### 90-s middle (between A and B) — **script for approval**

Voiceover continues over a slideshow of the existing screenshots, 6–8 s per still with Ken Burns and burned captions. Order: `student/01 → 02 → 07 → ai-chat/1 → ai-chat/3 → founder/04 → pm/03 → pm/05 → founder/08 → founder/11`.

| t | Beat | Voiceover |
|---|---|---|
| 0–15 | student overview + projects | "Here is a student asking the system to plan a side project. The Coordinator drafts milestones, owners, and risks." |
| 15–35 | resources + chat | "Every answer cites the source memory it came from. No silent hallucinations." |
| 35–60 | agents + graph + topics | "Memory writes. Critic challenges. Router decides who needs to know. The graph makes invisible dependencies visible." |
| 60–80 | calendar + analytics | "Calendar holds the plan accountable. Analytics show whether the user is actually executing." |
| 80–90 | RAI title-card | "AI suggests. Human decides. That line never moves." |

### Master cut

```text
[A 0:00–1:00] → [middle 1:00–2:30] → [B 2:30–3:30] → [5 s outro card]
```

Total: 3 min 35 s — well under brief's 5 min cap.

### Compositor

`scripts/compose-heygen.sh` (new):

```bash
# pseudo, full script written in Phase 5 build step
ffmpeg -loop 1 -t 6 -i shot.png \
  -vf "scale=1920:1080:force_original_aspect_ratio=increase,crop=1920:1080,zoompan=z='min(zoom+0.0008,1.08)':d=180:s=1920x1080:fps=30" \
  ...
# Concat all shot clips, overlay avatar PiP, mux with VO, burn captions
```

---

## Phase 6 — Surgical product polish (no schema changes)

Three changes, each maps to a visual beat the videos rely on.

1. **Confidence chip** — `src/components/dashboard/AIChatAgent.tsx`. Pill (low/med/high) on every assistant bubble, color from `max(retrieved.score)` → bucket `≥0.82 high, ≥0.65 med, else low`. No new edge function — `ai-agent` already returns scores.
2. **Accept / Skip on plan milestones** — new `src/components/resources/PlanMilestoneRow.tsx`, used inside `ResourceChat` when a `plan` tool result returns. Accepted rows persist to existing `projects` + `milestones` tables. **This is the HITL deliverable.**
3. **"Second Brain" landing reframe** — `HeroSection.tsx`, `ValuePropositions.tsx`, `PersonaCards.tsx`. Headline → *"The Second Brain that turns ideas into action."* Add `student.demo` and `creator.demo` rows to `seed-personas` (two array entries; idempotent).

Acceptance: `student.demo` can (a) ask for a 90-day plan, (b) see a confidence chip, (c) accept one milestone, (d) see it persisted on projects view — in under 2 minutes.

After Phase 6 lands, re-run `docs/demo-screenshots/walkthrough.py` so the chip + Accept/Skip appear in the captured stills used by Reel B.

---

## Sequencing

```text
Phase 4 docs (~3 hrs)
        ↓
Phase 6 polish (~4 hrs)   ← chip + Accept/Skip + landing reframe
        ↓
Re-run walkthrough.py to refresh ai-chat/* and student/02-projects.png
        ↓
Phase 5 HeyGen + ffmpeg compose (~2 hrs)
        ↓
Submit on Devpost
```

## What I need from you before Phase 5 starts

1. **Approve the three scripts above** (Reel A, Reel B, 90-s middle) — or paste edits.
2. **HeyGen avatar choice** — default `Daisy / Professional`, ElevenLabs voice `Adam – Conversational`. Override if you prefer another.
3. **Confirm pricing line** in Reel A (Free / $12 / $39 per seat) — adjust if numbers differ from `subscription-model` memory.

## Out of scope

- No new edge functions.
- No schema migrations.
- No new Slack/Gmail wiring — videos show existing OAuth screens.
- No live screen recording — illustrations are real product screenshots.
