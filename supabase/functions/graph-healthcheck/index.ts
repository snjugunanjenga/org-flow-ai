// Pings Neo4j and Pinecone and reports status + latency.
// Authenticated callers only.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

async function pingNeo4j(): Promise<{ ok: boolean; latency_ms: number; error?: string }> {
  const t0 = Date.now();
  try {
    const uri = Deno.env.get("NEO4J_URI");
    const user = Deno.env.get("NEO4J_USERNAME");
    const pass = Deno.env.get("NEO4J_PASSWORD");
    if (!uri || !user || !pass) return { ok: false, latency_ms: 0, error: "Neo4j env not configured" };

    const httpUri = uri
      .replace("neo4j+s://", "https://").replace("neo4j://", "http://")
      .replace("bolt+s://", "https://").replace("bolt://", "http://");
    const res = await fetch(`${httpUri}/db/neo4j/tx/commit`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Basic ${btoa(`${user}:${pass}`)}`,
      },
      body: JSON.stringify({ statements: [{ statement: "RETURN 1 AS ok" }] }),
    });
    const body = await res.json().catch(() => ({}));
    const ok = res.ok && !(body?.errors?.length > 0);
    return { ok, latency_ms: Date.now() - t0, error: ok ? undefined : JSON.stringify(body?.errors ?? res.statusText) };
  } catch (e: any) {
    return { ok: false, latency_ms: Date.now() - t0, error: e?.message ?? String(e) };
  }
}

async function pingPinecone(namespace: string): Promise<{ ok: boolean; latency_ms: number; vectors?: number; error?: string }> {
  const t0 = Date.now();
  try {
    const apiKey = Deno.env.get("PINECONE_API_KEY");
    const host = Deno.env.get("PINECONE_INDEX_HOST");
    if (!apiKey || !host) return { ok: false, latency_ms: 0, error: "Pinecone env not configured" };
    const url = (host.startsWith("http") ? host : `https://${host}`) + "/describe_index_stats";
    const res = await fetch(url, {
      method: "POST",
      headers: { "Api-Key": apiKey, "Content-Type": "application/json" },
      body: JSON.stringify({}),
    });
    const body = await res.json().catch(() => ({}));
    if (!res.ok) return { ok: false, latency_ms: Date.now() - t0, error: JSON.stringify(body) };
    const ns = body?.namespaces?.[namespace];
    return { ok: true, latency_ms: Date.now() - t0, vectors: ns?.vectorCount ?? body?.totalVectorCount ?? 0 };
  } catch (e: any) {
    return { ok: false, latency_ms: Date.now() - t0, error: e?.message ?? String(e) };
  }
}

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

    let namespace = "default";
    try {
      const body = await req.json();
      if (body?.namespace && typeof body.namespace === "string") namespace = body.namespace;
    } catch { /* body optional */ }

    const [neo4j, pinecone] = await Promise.all([pingNeo4j(), pingPinecone(namespace)]);

    return new Response(JSON.stringify({
      ok: neo4j.ok && pinecone.ok,
      neo4j, pinecone,
      checked_at: new Date().toISOString(),
    }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e: any) {
    console.error("graph-healthcheck error:", e);
    return new Response(JSON.stringify({ error: e?.message ?? String(e) }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});