# HeyGen Video Generation Plan

> Two ≤60-second videos required by the USAII Global AI Hackathon submission:
> a **Demo** track (what it does) and a **Tech** track (how it's built). Both
> are generated with [HeyGen](https://app.heygen.com) avatars + voice, then
> composited with screen-capture from the live demo at
> https://org-ai-chief-of-staff.lovable.app.

---

## 1. Goals & constraints

| Constraint | Value |
|---|---|
| Max duration | 60 seconds each |
| Resolution | 1920×1080, 30 fps, MP4 (H.264 + AAC) |
| Captions | Burned-in (HeyGen auto-captions, manually QA'd) |
| Hosting | Unlisted YouTube — links pasted into submission form |
| Brand voice | Confident, concrete, founder-energy. No buzzwords. |
| Persona on-camera | HeyGen avatar **"Daisy / Professional"** (warm, neutral) |
| Voice | ElevenLabs voice clone via HeyGen — default fallback: `Adam – Conversational` |

---

## 2. Production pipeline

```text
 Script (.md)
    │
    ▼
 HeyGen Studio ─────────► Avatar + voice render (MP4 with talking head, 1080p)
    │
    ▼
 Screen capture from /dashboard (Playwright walkthrough already in repo:
    docs/demo-screenshots/walkthrough.py — extend to .webm via page.video)
    │
    ▼
 ffmpeg compositor (scripts/compose-heygen.sh, to add):
    – picture-in-picture talking head (bottom-right, 320×180)
    – screen capture as main layer
    – ducked background music (–18 LUFS)
    – burned-in caption overlay (.ass from HeyGen export)
    │
    ▼
 Final MP4 → /mnt/documents/heygen/{demo,tech}-final.mp4
```

### Tools / accounts needed

- HeyGen **Creator** plan (≥ 15 min/month of 1080p export)
- One avatar slot (pick from stock; no custom-avatar training needed)
- ffmpeg (already in sandbox PATH)
- The existing `docs/demo-screenshots/walkthrough.py` Playwright script,
  extended with `context.new_page(record_video_dir=...)` for screen capture

---

## 3. Demo track — 60 s script

**Hook → Problem → Product → Proof → CTA.** All numbers below come from the
actual seeded personas.

| t | On-screen | Voiceover (avatar) |
|---|---|---|
| 0–6 s | Avatar full-frame, logo lower-third | "Forty percent of decisions in your org never get written down. We fix that." |
| 6–14 s | Cut to `student.demo` Overview | "Meet your AI Chief of Staff — one place for every meeting, message, and decision." |
| 14–24 s | Switch to `pm.demo` → `/dashboard/graph` | "Cross-team PMs see dependencies as a live 3D knowledge graph, not a spreadsheet." |
| 24–34 s | Switch to `founder.demo` → `/dashboard/agents` | "Four AI agents — Memory, Router, Critic, Coordinator — surface conflicts before they bite." |
| 34–46 s | `/dashboard/calendar` creating a Meet event | "Google Calendar and Meet built in. Slack and Gmail ingest in one click." |
| 46–56 s | Avatar back full-frame, side-by-side persona cards | "Student, PM, founder — three personas, one product, shipped today." |
| 56–60 s | URL card: `org-ai-chief-of-staff.lovable.app` | "Try it. Demo password Demo-2026." |

---

## 4. Tech track — 60 s script

| t | On-screen | Voiceover (avatar) |
|---|---|---|
| 0–6 s | Avatar + tech-stack chips (React, Supabase, Neo4j, Pinecone, OpenAI) | "Here's how it's built." |
| 6–18 s | Architecture diagram from `docs/ARCHITECTURE.md` | "React + Vite front end. Supabase Postgres with row-level security on every one of 31 tables. Edge functions in Deno do the heavy lifting." |
| 18–32 s | Code zoom on `supabase/functions/ai-agent/index.ts` | "The Coordinator agent calls Lovable AI Gateway — Gemini for routing, GPT-class models for synthesis — then hits Neo4j for graph traversal and Pinecone for semantic recall." |
| 32–44 s | `connector-dispatch` + Slack/Gmail icons | "Connector Gateway pulls Slack and Gmail signals, dedupes them, fans them out to the Memory agent." |
| 44–54 s | CI badge + Vitest output | "Vitest unit tests, Playwright persona walkthroughs, and GitHub Actions on every PR." |
| 54–60 s | Repo URL + QR code | "Open source. Code, schemas, and videos in the repo." |

---

## 5. HeyGen-specific settings

- **Scene length:** keep each HeyGen scene ≤ 12 s — long scenes blow the 60 s budget on transitions.
- **Avatar movement:** `Subtle` (avoid the default `Energetic` — too distracting over screen capture).
- **Background:** transparent PNG so we can chroma-composite later. Toggle "Remove Background" in HeyGen export.
- **Voice settings:** `Stability 60`, `Similarity 75`, `Style 30`. Generate twice and keep the take with fewer breath artifacts.
- **Caption style:** Inter, 48 px, white, 4 px black stroke, bottom-center, 90 % opacity card behind text.

---

## 6. Checklist

- [ ] Avatar + voice locked (Daisy / Adam-Conversational)
- [ ] Demo script approved (this doc, §3)
- [ ] Tech script approved (this doc, §4)
- [ ] HeyGen render — Demo (MP4, 1080p, transparent BG)
- [ ] HeyGen render — Tech (MP4, 1080p, transparent BG)
- [ ] Playwright screen captures (extend `walkthrough.py` to record `.webm`)
- [ ] Composite both via `scripts/compose-heygen.sh` (to add)
- [ ] Upload unlisted to YouTube, paste links in `docs/SUBMISSION-USAII.md`
- [ ] QA: caption legibility, audio LUFS, 60 s hard cap, no PII in shots

---

## 7. Cost / time estimate

| Item | Time | Cost |
|---|---|---|
| Script polish | 30 min | $0 |
| HeyGen Creator monthly | — | ~$29 |
| Avatar renders (2 × 60 s @ 1080p) | ~10 min render | included |
| Screen capture + composite | 1 hr | $0 |
| Upload + thumbnail | 15 min | $0 |
| **Total** | **~2 hrs hands-on** | **~$29** |