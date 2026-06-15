// Mints a short-lived ElevenLabs Conversational Agent WebRTC token
// so authenticated users can start a voice conversation with the Coordinator.
// The agent itself must be configured in the ElevenLabs dashboard; pass its
// ID via the request body OR the AGENT_ID env var.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
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

    let agentId: string | undefined;
    try {
      const body = await req.json();
      agentId = body?.agent_id;
    } catch { /* body optional */ }
    agentId = agentId || Deno.env.get("ELEVENLABS_AGENT_ID");

    if (!agentId) {
      return new Response(JSON.stringify({
        error: "Missing agent_id",
        hint: "Create a Conversational AI agent in your ElevenLabs dashboard and pass its ID, or set ELEVENLABS_AGENT_ID secret.",
      }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const tokRes = await fetch(
      `https://api.elevenlabs.io/v1/convai/conversation/token?agent_id=${encodeURIComponent(agentId)}`,
      { headers: { "xi-api-key": apiKey } },
    );

    if (!tokRes.ok) {
      const errTxt = await tokRes.text();
      console.error("Agent token failed:", tokRes.status, errTxt);
      return new Response(JSON.stringify({ error: "Agent token request failed", details: errTxt }), {
        status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await tokRes.json();
    return new Response(JSON.stringify({ token: data.token, agent_id: agentId }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e: any) {
    console.error("voice-agent-token error:", e);
    return new Response(JSON.stringify({ error: e?.message ?? String(e) }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});