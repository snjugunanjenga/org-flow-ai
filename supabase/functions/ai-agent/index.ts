import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const AGENT_PROMPTS: Record<string, string> = {
  memory: `You are the Memory Agent for an AI Chief of Staff system. Your role is to:
- Extract key entities (people, topics, decisions, projects) from messages
- Identify relationships between entities
- Track decision history and version changes
- Summarize important information for organizational memory
Respond with structured analysis. Be concise and factual.`,

  router: `You are the Router Agent for an AI Chief of Staff system. Your role is to:
- Determine which team members need to know about specific information
- Identify stakeholders for decisions
- Route critical knowledge to the right people
- Assess urgency and priority of information
Respond with routing recommendations and reasoning.`,

  critic: `You are the Critic Agent for an AI Chief of Staff system. Your role is to:
- Detect contradictions between decisions
- Flag potential conflicts between teams or individuals
- Identify misalignment with stated goals
- Rate severity of conflicts (low/medium/high/critical)
Respond with conflict analysis and recommended resolution steps.`,

  coordinator: `You are the Coordinator Agent, the main interface for the AI Chief of Staff system. You orchestrate the other agents (Memory, Router, Critic) and interact directly with users. Your role is to:
- Answer questions about the organization's knowledge
- Summarize recent decisions and activities
- Provide actionable recommendations
- Coordinate responses from specialized agents
Be helpful, clear, and proactive. Reference organizational context when available.`,
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Not authenticated" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Verify user
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } }, auth: { autoRefreshToken: false, persistSession: false } }
    );
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Not authenticated" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { messages, agent = "coordinator", stream = false } = await req.json();
    const systemPrompt = AGENT_PROMPTS[agent] || AGENT_PROMPTS.coordinator;

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      return new Response(JSON.stringify({ error: "AI not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          ...messages,
        ],
        stream,
      }),
    });

    if (!aiResponse.ok) {
      const status = aiResponse.status;
      if (status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded, please try again later." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await aiResponse.text();
      console.error("AI gateway error:", status, t);
      return new Response(JSON.stringify({ error: "AI gateway error" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (stream) {
      return new Response(aiResponse.body, {
        headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
      });
    }

    const data = await aiResponse.json();
    console.log(`Agent [${agent}] responded for user ${user.id}`);

    return new Response(JSON.stringify(data), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Agent error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
