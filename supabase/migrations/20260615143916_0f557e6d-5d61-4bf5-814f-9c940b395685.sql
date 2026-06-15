
ALTER TABLE public.notifications
  ADD COLUMN IF NOT EXISTS voice_enabled boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS voice_audio_url text,
  ADD COLUMN IF NOT EXISTS agent_type text;
