import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // Auth check
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Not authenticated" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

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

    const NEO4J_URI = Deno.env.get("NEO4J_URI");
    const NEO4J_USERNAME = Deno.env.get("NEO4J_USERNAME");
    const NEO4J_PASSWORD = Deno.env.get("NEO4J_PASSWORD");

    if (!NEO4J_URI || !NEO4J_USERNAME || !NEO4J_PASSWORD) {
      return new Response(JSON.stringify({ error: "Neo4j not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { query, parameters = {} } = await req.json();
    if (!query) {
      return new Response(JSON.stringify({ error: "Missing 'query' field" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Neo4j HTTP API - convert bolt URI to HTTP
    const httpUri = NEO4J_URI
      .replace("neo4j+s://", "https://")
      .replace("neo4j://", "http://")
      .replace("bolt+s://", "https://")
      .replace("bolt://", "http://");

    const neo4jUrl = `${httpUri}/db/neo4j/tx/commit`;
    const credentials = btoa(`${NEO4J_USERNAME}:${NEO4J_PASSWORD}`);

    console.log(`Neo4j query for user ${user.id}: ${query.substring(0, 100)}`);

    const neo4jResponse = await fetch(neo4jUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Basic ${credentials}`,
        "Accept": "application/json",
      },
      body: JSON.stringify({
        statements: [{ statement: query, parameters }],
      }),
    });

    if (!neo4jResponse.ok) {
      const errorText = await neo4jResponse.text();
      console.error("Neo4j error:", neo4jResponse.status, errorText);
      return new Response(JSON.stringify({ error: "Neo4j query failed", details: errorText }), {
        status: 502,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const result = await neo4jResponse.json();

    if (result.errors && result.errors.length > 0) {
      console.error("Neo4j query errors:", JSON.stringify(result.errors));
      return new Response(JSON.stringify({ error: "Neo4j query error", details: result.errors }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const records = result.results?.[0] || { columns: [], data: [] };
    console.log(`Neo4j returned ${records.data?.length || 0} records`);

    return new Response(JSON.stringify({ records }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Neo4j proxy error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
