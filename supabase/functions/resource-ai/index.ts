import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { action, messages, source_context, notebook_id, report_type } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    if (action === "chat") {
      const systemPrompt = `You are an AI research assistant grounded in the user's uploaded sources. 
Answer questions based ONLY on the provided source material. 
When citing information, reference the source by its number in brackets like [Source 1].
If the sources don't contain relevant information, say so honestly.

## Sources:
${source_context || "No sources provided."}`;

      const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messages: [
            { role: "system", content: systemPrompt },
            ...(messages || []),
          ],
          stream: true,
        }),
      });

      if (!response.ok) {
        const t = await response.text();
        console.error("AI gateway error:", response.status, t);
        return new Response(JSON.stringify({ error: "AI gateway error" }), {
          status: response.status,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      return new Response(response.body, {
        headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
      });
    }

    if (action === "generate-guide") {
      const prompt = `Based on the following sources, generate a comprehensive notebook guide with:
1. **Key Themes** - Main topics across all sources
2. **Table of Contents** - Structured overview of the content
3. **Suggested Questions** - 5-10 questions a researcher could explore

## Sources:
${source_context || "No sources provided."}`;

      const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messages: [
            { role: "system", content: "You are a research assistant that creates structured guides from source material. Cite sources by number [Source N]." },
            { role: "user", content: prompt },
          ],
        }),
      });

      if (!response.ok) {
        const t = await response.text();
        return new Response(JSON.stringify({ error: t }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const data = await response.json();
      const guide = data.choices?.[0]?.message?.content || "Unable to generate guide.";

      return new Response(JSON.stringify({ guide }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "generate-report") {
      const typePrompts: Record<string, string> = {
        briefing: "Create an executive briefing document with key findings, risks, and recommendations.",
        faq: "Create a FAQ document with common questions and answers based on the sources.",
        "study-guide": "Create a study guide with key concepts, definitions, and review questions.",
        slides: "Create a slide deck outline with 8-12 slides. Each slide should have a title and 3-5 bullet points. Format as: ## Slide N: Title\\n- bullet point",
      };

      const prompt = `${typePrompts[report_type] || typePrompts.briefing}

Cite all information with source references [Source N].

## Sources:
${source_context || "No sources provided."}`;

      const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messages: [
            { role: "system", content: "You are a report generator that creates structured, source-grounded documents. Always cite sources." },
            { role: "user", content: prompt },
          ],
        }),
      });

      if (!response.ok) {
        const t = await response.text();
        return new Response(JSON.stringify({ error: t }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const data = await response.json();
      const report = data.choices?.[0]?.message?.content || "Unable to generate report.";

      return new Response(JSON.stringify({ report }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ error: "Unknown action" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("resource-ai error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
