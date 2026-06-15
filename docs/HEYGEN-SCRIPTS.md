# HeyGen Scripts — For Approval

Three scripts, total ≈ 3 min 30 s. HeyGen avatar (Daisy / Professional, ElevenLabs "Adam – Conversational") narrates over real product screenshots already in `docs/demo-screenshots/`. No screen recording.

**Action required:** read each VO column, edit any line that doesn't sound right, then reply "approved" or paste changes. I will not generate any HeyGen avatar takes until you say the word.

---

## Reel A — Intro / Pitch (60 s)

Frame: avatar full-frame for bookends, screenshot Ken-Burns for the middle.

| #   | t (s) | On-screen (real image)                                                                    | Voiceover (read aloud — count syllables)                                                                                                                                  |
| --- | ----- | ----------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| A1  | 0–6   | Avatar full-frame, logo lower-third                                                       | "Every student has a great idea that dies in a Google Doc. We built the Second Brain that doesn't let that happen."                                                       |
| A2  | 6–14  | `student/01-overview.png`, slow zoom 1.00 → 1.08                                          | "Modern life buries us in information and still forces high-stakes decisions with incomplete data. Most tools either oversimplify, or overwhelm."                         |
| A3  | 14–24 | `student/02-projects.png`, pan-left across milestones                                     | "Superhuman Second Brain turns a vague idea into a thirty, sixty, ninety day execution plan — using four cooperating AI agents, not one chatbot."                         |
| A4  | 24–34 | `founder/04-agents.png`, static + fade-in callouts on each agent card                     | "Memory extracts what matters. Router decides who needs to know. Critic catches contradictions. Coordinator answers in plain English."                                    |
| A5  | 34–44 | `pm/03-graph.png` with stack chips overlay (React · Supabase · Neo4j · Pinecone · Gemini) | "React and Supabase row-level security on the front. Neo4j for the graph. Pinecone for memory. Gemini through the Lovable AI Gateway. Production-grade, not a prototype." |
| A6  | 44–52 | Pricing card (PNG to generate: Free / $12 / $39 per seat)                                 | "Free for students. Twelve dollars a month for solo creators. Thirty-nine per seat for cohorts."                                                                          |
| A7  | 52–60 | Avatar + URL card `https://org-ai-chief-of-staff.lovable.app`                             | "Built in seven days by a three-person team. Try it — https://org-ai-chief-of-staff.lovable.app"                                                                          |

Word count: ~140 words → ~58 s at HeyGen's default pace. Safe.

---

## Middle — Walkthrough (90 s)

Frame: screenshots only, avatar PiP bottom-right 320×180. 9 stills, ~10 s each.

| #   | t (s) | On-screen (real image)                                               | Voiceover                                                                                                                  |
| --- | ----- | -------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------- |
| M1  | 0–10  | `student/01-overview.png`                                            | "Here is a student opening Second Brain for the first time. One workspace, every signal."                                  |
| M2  | 10–20 | `student/02-projects.png`                                            | "She asks for a plan. The Coordinator drafts milestones, owners, and risks — every row is a suggestion she has to accept." |
| M3  | 20–30 | `student/07-resources.png`                                           | "Notebooks pull from her uploaded docs and connected apps. Every answer cites the source memory."                          |
| M4  | 30–40 | `ai-chat/1_chat_open.png` → `ai-chat/3_chat_response.png` cross-fade | "The Coordinator chat is always one tap away — even mid-meeting."                                                          |
| M5  | 40–50 | Zoom on confidence chip in `ai-chat/3_chat_response.png`             | "Each response carries a confidence chip — high, medium, or low — derived from retrieval similarity and Critic agreement." |
| M6  | 50–60 | `founder/04-agents.png`                                              | "Four agents, not one. Memory writes. Router decides reach. Critic challenges. Coordinator narrates."                      |
| M7  | 60–70 | `pm/03-graph.png` slow pan                                           | "The knowledge graph makes invisible dependencies visible — who knows what, and where the gaps are."                       |
| M8  | 70–80 | `pm/05-topics.png` red-tint flash on flagged item                    | "When two meetings contradict, the Critic stops the work, surfaces the conflict, and asks a human."                        |
| M9  | 80–90 | `founder/11-analytics.png`                                           | "Analytics close the loop — is the plan actually moving? AI suggests. The human decides. That line never moves."           |

Word count: ~190 words → ~85 s. Safe.

---

## Reel B — Demo (60 s)

Frame: screenshots primary, avatar PiP bottom-right.

| #   | t (s) | On-screen (real image)                                             | Voiceover                                                                                                    |
| --- | ----- | ------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------ |
| B1  | 0–6   | `student/01-overview.png` zoom                                     | "Meet Steve, an early-career PM at Apple, planning an internal AI guild."                                    |
| B2  | 6–14  | `ai-chat/2_chat_input.png` → `3_chat_response.png`                 | "He asks the Coordinator: launch this guild in ninety days."                                                 |
| B3  | 14–24 | `student/02-projects.png` + Accept/Skip overlay                    | "Every milestone is a suggestion. Steve accepts the ones he owns. The AI never commits for him."             |
| B4  | 24–32 | Zoom on confidence chip                                            | "Each answer carries a confidence chip — derived from retrieval similarity and Critic agreement, not vibes." |
| B5  | 32–42 | `founder/08-calendar.png` + Gmail / Slack / Calendar logos fade-in | "Gmail, Slack, Google Calendar and Meet feed the Memory agent. One OAuth click each."                        |
| B6  | 42–52 | `pm/05-topics.png` red flash → `pm/03-graph.png` pan               | "The Critic flags contradictions across meetings before they cost a week."                                   |
| B7  | 52–60 | Avatar full-frame + URL card                                       | "From idea, to plan, to action — in one tool. That's Second Brain."                                          |

Word count: ~125 words → ~55 s. Safe.

---

## Source images (all already real product screenshots — no AI illustrations)

| Slot                  | Path                                                     | Exists |
| --------------------- | -------------------------------------------------------- | ------ |
| Student overview      | `docs/demo-screenshots/student/01-overview.png`          | ✅     |
| Student projects/plan | `docs/demo-screenshots/student/02-projects.png`          | ✅     |
| Student resources     | `docs/demo-screenshots/student/07-resources.png`         | ✅     |
| Agents panel          | `docs/demo-screenshots/founder/04-agents.png`            | ✅     |
| Knowledge graph       | `docs/demo-screenshots/pm/03-graph.png`                  | ✅     |
| Topics / conflict     | `docs/demo-screenshots/pm/05-topics.png`                 | ✅     |
| Calendar + Meet       | `docs/demo-screenshots/founder/08-calendar.png`          | ✅     |
| Analytics             | `docs/demo-screenshots/founder/11-analytics.png`         | ✅     |
| Chat open             | `docs/demo-screenshots/ai-chat/1_chat_open.png`          | ✅     |
| Chat input            | `docs/demo-screenshots/ai-chat/2_chat_input.png`         | ✅     |
| Chat response         | `docs/demo-screenshots/ai-chat/3_chat_response.png`      | ✅     |
| Pricing card          | _to generate (`imagegen`, premium) before Reel A render_ | ⏳     |
| URL/outro card        | _to generate (premium, text legibility)_                 | ⏳     |

Phase 6 deliverables (confidence chip + Accept/Skip UI) must land before re-capturing `ai-chat/3_chat_response.png` and `student/02-projects.png`, otherwise B3 / B4 / M5 show the old UI.

---

## Approval checklist (reply with this filled in)

- [ ] Reel A VO approved (or edits inline)
- [ ] Middle VO approved (or edits inline)
- [ ] Reel B VO approved (or edits inline)
- [ ] Avatar = Daisy / Professional — or override: **\_\_**
- [ ] Voice = Adam Conversational — or override: **\_\_**
- [ ] Pricing line = Free / $12 / $39 per seat — or override: **\_\_**
- [ ] URL in outro = `https://org-ai-chief-of-staff.lovable.app` — or override: **\_\_**

Once approved I will (in order): build Phase 6 UI (chip + Accept/Skip + landing reframe), re-capture the three stale screenshots, generate the pricing + outro PNGs, then render reels via the ffmpeg compositor and stitch the 3-minute master.
