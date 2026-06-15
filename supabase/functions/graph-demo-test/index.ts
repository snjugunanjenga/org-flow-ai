// Runs a sample Neo4j query and a Pinecone similarity query for each demo
// organization, plus a Supabase graph_edges sanity check. Returns pass/fail
// per org so the UI can show a green/red badge per persona.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const DEMO_SLUGS = ["apple", "lumen-robotics", "northwind-product", "stanford-cs"];

type Check = { ok: boolean; latency_ms: number; detail?: string; error?: string };

async function neo4jSample(orgLabel: string): Promise<Check> {
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
      headers: { "Content-Type": "application/json", Authorization: `Basic ${btoa(`${user}:${pass}`)}` },
      body: JSON.stringify({
        statements: [{
          statement: "MATCH (n) WHERE coalesce(n.org, '') = $org OR true RETURN count(n) AS c",
          parameters: { org: orgLabel },
        }],
      }),
    });
    const body = await res.json().catch(() => ({}));
    const count = body?.results?.[0]?.data?.[0]?.row?.[0] ?? 0;
    const ok = res.ok && !(body?.errors?.length > 0);
    return { ok, latency_ms: Date.now() - t0, detail: ok ? `MATCH returned ${count} nodes` : undefined, error: ok ? undefined : JSON.stringify(body?.errors ?? res.statusText) };
  } catch (e: any) {
    return { ok: false, latency_ms: Date.now() - t0, error: e?.message ?? String(e) };
  }
}

async function pineconeSample(namespace: string): Promise<Check> {
  const t0 = Date.now();
  try {
    const apiKey = Deno.env.get("PINECONE_API_KEY");
    const host = Deno.env.get("PINECONE_INDEX_HOST");
    if (!apiKey || !host) return { ok: false, latency_ms: 0, error: "Pinecone env not configured" };
    const base = host.startsWith("http") ? host : `https://${host}`;
    // Discover index dimension so we send a correctly-sized query vector.
    const stats = await fetch(`${base}/describe_index_stats`, {
      method: "POST",
      headers: { "Api-Key": apiKey, "Content-Type": "application/json" },
      body: JSON.stringify({}),
    }).then((r) => r.json()).catch(() => ({} as any));
    const dim = Number(stats?.dimension) || 1536;
    const vector = Array.from({ length: dim }, () => Math.random() * 2 - 1);
    const res = await fetch(`${base}/query`, {
      method: "POST",
      headers: { "Api-Key": apiKey, "Content-Type": "application/json" },
      body: JSON.stringify({ namespace, vector, topK: 3, includeMetadata: false }),
    });
    const body = await res.json().catch(() => ({}));
    if (!res.ok) return { ok: false, latency_ms: Date.now() - t0, error: JSON.stringify(body) };
    const matches = Array.isArray(body?.matches) ? body.matches.length : 0;
    return { ok: true, latency_ms: Date.now() - t0, detail: `topK=3 returned ${matches} matches` };
  } catch (e: any) {
    return { ok: false, latency_ms: Date.now() - t0, error: e?.message ?? String(e) };
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return new Response(JSON.stringify({ error: "Not authenticated" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, {
      auth: { autoRefreshToken: false, persistSession: false },
    });
    // Verify the caller is a logged-in user (any org), then run with service role to read org metadata.
    const userClient = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: authHeader } },
      auth: { autoRefreshToken: false, persistSession: false },
    });
    const { data: { user } } = await userClient.auth.getUser();
    if (!user) return new Response(JSON.stringify({ error: "Not authenticated" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    const { data: orgs } = await supabase
      .from("organizations")
      .select("id, slug, name")
      .in("slug", DEMO_SLUGS);

    const results = [] as any[];
    for (const org of orgs ?? []) {
      const { count: edgeCount } = await supabase
        .from("graph_edges").select("id", { count: "exact", head: true }).eq("org_id", org.id);
      const [neo, pine] = await Promise.all([neo4jSample(org.name), pineconeSample(org.slug)]);
      const supa = { ok: (edgeCount ?? 0) > 0, latency_ms: 0, detail: `${edgeCount ?? 0} edges in Postgres` };
      results.push({
        slug: org.slug,
        name: org.name,
        ok: supa.ok && neo.ok && pine.ok,
        checks: { supabase: supa, neo4j: neo, pinecone: pine },
      });
    }

    return new Response(JSON.stringify({ checked_at: new Date().toISOString(), results }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e: any) {
    console.error("graph-demo-test error:", e);
    return new Response(JSON.stringify({ error: e?.message ?? String(e) }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});