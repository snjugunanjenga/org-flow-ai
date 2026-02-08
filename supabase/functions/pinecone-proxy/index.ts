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

    const PINECONE_API_KEY = Deno.env.get("PINECONE_API_KEY");
    const PINECONE_INDEX_HOST = Deno.env.get("PINECONE_INDEX_HOST");

    if (!PINECONE_API_KEY || !PINECONE_INDEX_HOST) {
      return new Response(JSON.stringify({ error: "Pinecone not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { action, ...payload } = await req.json();

    if (!action || !["upsert", "query", "delete", "fetch"].includes(action)) {
      return new Response(JSON.stringify({ error: "Invalid action. Use: upsert, query, delete, fetch" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Ensure index host has protocol
    const host = PINECONE_INDEX_HOST.startsWith("http")
      ? PINECONE_INDEX_HOST
      : `https://${PINECONE_INDEX_HOST}`;

    let pineconeUrl: string;
    let method = "POST";
    let body: string | undefined;

    switch (action) {
      case "upsert": {
        pineconeUrl = `${host}/vectors/upsert`;
        body = JSON.stringify({
          vectors: payload.vectors,
          namespace: payload.namespace || "",
        });
        break;
      }
      case "query": {
        pineconeUrl = `${host}/query`;
        body = JSON.stringify({
          vector: payload.vector,
          topK: payload.topK || 10,
          includeMetadata: payload.includeMetadata ?? true,
          includeValues: payload.includeValues ?? false,
          namespace: payload.namespace || "",
          filter: payload.filter,
        });
        break;
      }
      case "delete": {
        pineconeUrl = `${host}/vectors/delete`;
        body = JSON.stringify({
          ids: payload.ids,
          deleteAll: payload.deleteAll,
          namespace: payload.namespace || "",
          filter: payload.filter,
        });
        break;
      }
      case "fetch": {
        const ids = (payload.ids || []).map((id: string) => `ids=${id}`).join("&");
        const ns = payload.namespace ? `&namespace=${payload.namespace}` : "";
        pineconeUrl = `${host}/vectors/fetch?${ids}${ns}`;
        method = "GET";
        break;
      }
      default:
        pineconeUrl = "";
    }

    console.log(`Pinecone ${action} for user ${user.id}`);

    const pineconeResponse = await fetch(pineconeUrl, {
      method,
      headers: {
        "Api-Key": PINECONE_API_KEY,
        "Content-Type": "application/json",
        "Accept": "application/json",
      },
      ...(body ? { body } : {}),
    });

    if (!pineconeResponse.ok) {
      const errorText = await pineconeResponse.text();
      console.error("Pinecone error:", pineconeResponse.status, errorText);
      return new Response(JSON.stringify({ error: "Pinecone request failed", details: errorText }), {
        status: 502,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const result = await pineconeResponse.json();
    console.log(`Pinecone ${action} completed successfully`);

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Pinecone proxy error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
