
## 1. Persona switcher on hero (frontend)

- `HeroSection.tsx`: add a 4-option persona picker (Founder / PM / Student / Super Admin) next to "Try the Demo". Selecting one signs in with the matching seeded credentials and lands in that mock org.
- `PersonaCards.tsx`: convert each card into an "Enter as {persona}" CTA that performs the same login.
- Self-heal already in place (invokes `seed-personas` on first failure) covers all four accounts.

## 2. Voice conversational AI notifications

- **Connector**: link ElevenLabs standard connector → `ELEVENLABS_API_KEY` server-side.
- **Edge function `voice-notification`**: takes `notification_id`, fetches text, calls ElevenLabs TTS (`eleven_turbo_v2_5`, voice = Sarah), returns MP3 bytes. Auth-gated.
- **Edge function `voice-agent-token`**: mints an ElevenLabs Conversational Agent WebRTC token so users can talk back to the Coordinator agent from the bell.
- **UI**: extend `NotificationsView.tsx` with a ▶︎ play button per notification + a "Talk to Coordinator" mic button using `@elevenlabs/react` `useConversation`.

## 3. Daily voice notifications (mock + live)

- **Mock seed**: extend `seed-personas` to insert 7 days of agent-authored notifications and messages per persona (mix of Memory/Router/Critic/Coordinator, with `voice_enabled=true` flag).
- **Migration**: add `voice_enabled boolean default false` and `voice_audio_url text` columns to `notifications`.
- **Live**: new edge function `daily-voice-digest` generates one Coordinator briefing per active user per day. Schedule via `pg_cron` at 08:00 UTC using `pg_net.http_post`.

## 4. Knowledge graph + Neo4j/Pinecone health

- **Edge function `graph-healthcheck`**: pings Neo4j (`RETURN 1`) and Pinecone (`describe_index_stats` on org namespace), returns `{neo4j: ok|fail, pinecone: ok|fail, latency_ms}`.
- **UI badge**: small status pill in `SettingsView` ("Integrations") and `AdminView` ("System health") that polls the healthcheck every 30s.
- **Seed real graph data**: extend `seed-personas` to push ~20 nodes/edges into Neo4j and ~20 embeddings into Pinecone per demo org so `/dashboard/graph` renders non-empty data for judges.
- **Playwright** (`docs/demo-screenshots/graph-walkthrough.py`): for each persona logs in, opens `/dashboard/graph`, waits for canvas nodes, asserts >0 rendered, screenshots `graph-{persona}.png`. Added to `scripts/demo-walkthrough.sh`.

## 5. Updated mock messages

- `seed-personas` also inserts 10–15 `direct_messages` and `messages` per persona with realistic content tied to their org's projects, so DM/Messages views are populated.

## 6. Wiring & docs

- `package.json`: add `demo:voice-test` (curls `voice-notification` for each persona) and `demo:graph-health`.
- `README.md`: document ElevenLabs setup, new persona switcher, voice features, graph health endpoint, cron schedule.

## Technical details

- New tables/columns: `notifications.voice_enabled`, `notifications.voice_audio_url`, `notifications.agent_type` (if missing).
- `pg_cron` + `pg_net` enabled in a migration; cron row inserted via `supabase--insert` (per scheduling guidance — not migration — to keep keys per-project).
- ElevenLabs voice IDs: Sarah `EXAVITQu4vr4xnSDxMaL` (Memory/Coordinator), George `JBFqnCBsd6RMkjVDRZzb` (Router), Charlie `IKne3meq5aSn9XLyUdCD` (Critic).
- `@elevenlabs/react` added via `bun add`.
- Health check function uses existing `NEO4J_*` and `PINECONE_*` secrets.
- All new edge functions: CORS headers, JWT validation, Zod input schemas.
