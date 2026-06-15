// Text-to-speech for agent notifications using ElevenLabs.
// Returns MP3 bytes (audio/mpeg). Auth-gated.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Agent → voice ID (ElevenLabs preset voices)
const VOICE_BY_AGENT: Record<string, string> = {
  memory: "EXAVITQu4vr4xnSDxMaL",      // Sarah
  router: "JBFqnCBsd6RMkjVDRZzb",      // George
  critic: "IKne3meq5aSn9XLyUdCD",      // Charlie
  coordinator: "XrExE9yKIg1WjnnlVkGX", // Matilda
  default: "EXAVITQu4vr4xnSDxMaL",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Not authenticated" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } }, auth: { autoRefreshToken: false, persistSession: false } },
    );
    const { data: { user }, error: authErr } = await supabase.auth.getUser();
    if (authErr || !user) {
      return new Response(JSON.stringify({ error: "Not authenticated" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const apiKey = Deno.env.get("ELEVENLABS_API_KEY");
    if (!apiKey) {
      return new Response(JSON.stringify({ error: "ElevenLabs not configured" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { text, agent } = await req.json();
    if (!text || typeof text !== "string" || text.length > 4000) {
      return new Response(JSON.stringify({ error: "Invalid 'text' (1-4000 chars required)" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const voiceId = VOICE_BY_AGENT[(agent || "default").toLowerCase()] ?? VOICE_BY_AGENT.default;

    const ttsRes = await fetch(
      `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}?output_format=mp3_44100_128`,
      {
        method: "POST",
        headers: { "xi-api-key": apiKey, "Content-Type": "application/json" },
        body: JSON.stringify({
          text,
          model_id: "eleven_turbo_v2_5",
          voice_settings: { stability: 0.5, similarity_boost: 0.75, style: 0.3, use_speaker_boost: true },
        }),
      },
    );

    if (!ttsRes.ok) {
      const errTxt = await ttsRes.text();
      console.error("ElevenLabs TTS failed:", ttsRes.status, errTxt);
      return new Response(JSON.stringify({ error: "TTS request failed", status: ttsRes.status, details: errTxt }), {
        status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const audio = await ttsRes.arrayBuffer();
    return new Response(audio, {
      headers: { ...corsHeaders, "Content-Type": "audio/mpeg", "Cache-Control": "public, max-age=86400" },
    });
  } catch (e: any) {
    console.error("voice-tts error:", e);
    return new Response(JSON.stringify({ error: e?.message ?? String(e) }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});