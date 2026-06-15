import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

export const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

export type RequireUserResult = {
  supabase: ReturnType<typeof createClient>;
  service: ReturnType<typeof createClient>;
  userId: string;
  orgId: string | null;
};

export async function requireUser(req: Request, opts: { requireOrg?: boolean } = {}): Promise<RequireUserResult> {
  const authHeader = req.headers.get("Authorization");
  if (!authHeader) throw new Response(JSON.stringify({ error: "Not authenticated" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_ANON_KEY")!,
    { global: { headers: { Authorization: authHeader } }, auth: { autoRefreshToken: false, persistSession: false } },
  );
  const service = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    { auth: { autoRefreshToken: false, persistSession: false } },
  );

  const token = authHeader.replace("Bearer ", "");
  const { data, error } = await supabase.auth.getClaims(token);
  if (error || !data?.claims) {
    throw new Response(JSON.stringify({ error: "Not authenticated" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
  const userId = data.claims.sub as string;

  let orgId: string | null = null;
  const explicit = req.headers.get("X-Org-Id");
  if (explicit) {
    const { data: m } = await service.from("org_memberships").select("org_id").eq("user_id", userId).eq("org_id", explicit).maybeSingle();
    if (m) orgId = explicit;
  }
  if (!orgId) {
    const { data: m } = await service.from("org_memberships").select("org_id").eq("user_id", userId).order("created_at", { ascending: true }).limit(1).maybeSingle();
    if (m) orgId = m.org_id as string;
  }

  // Super-admins are not members of any single org — fall back to the first
  // organization so platform-admin tooling can call org-scoped endpoints.
  if (!orgId) {
    const { data: isAdmin } = await service
      .from("user_roles")
      .select("role")
      .eq("user_id", userId)
      .eq("role", "admin")
      .maybeSingle();
    if (isAdmin) {
      const { data: anyOrg } = await service
        .from("organizations")
        .select("id")
        .order("created_at", { ascending: true })
        .limit(1)
        .maybeSingle();
      if (anyOrg) orgId = anyOrg.id as string;
    }
  }

  if (opts.requireOrg && !orgId) {
    throw new Response(JSON.stringify({ error: "No organization for user" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }

  return { supabase, service, userId, orgId };
}

export function jsonResponse(body: unknown, status = 200, extra: HeadersInit = {}) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json", ...extra },
  });
}

export async function logAgent(
  service: ReturnType<typeof createClient>,
  row: { orgId: string; agent: "memory" | "router" | "critic" | "coordinator"; action: string; input?: string; output?: string; reasoning?: string; durationMs?: number },
) {
  try {
    await service.from("agent_logs").insert({
      org_id: row.orgId,
      agent_type: row.agent,
      action: row.action,
      input_summary: row.input?.slice(0, 1000) ?? null,
      output_summary: row.output?.slice(0, 2000) ?? null,
      reasoning: row.reasoning?.slice(0, 2000) ?? null,
      duration_ms: row.durationMs ?? null,
    });
  } catch (e) {
    console.error("logAgent failed", e);
  }
}

export async function embedText(text: string): Promise<number[] | null> {
  const key = Deno.env.get("LOVABLE_API_KEY");
  if (!key) return null;
  try {
    const r = await fetch("https://ai.gateway.lovable.dev/v1/embeddings", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({ model: "text-embedding-3-small", input: text.slice(0, 8000) }),
    });
    if (!r.ok) return null;
    const data = await r.json();
    return data?.data?.[0]?.embedding ?? null;
  } catch {
    return null;
  }
}

export function sha256Hex(input: string): Promise<string> {
  const buf = new TextEncoder().encode(input);
  return crypto.subtle.digest("SHA-256", buf).then((d) =>
    Array.from(new Uint8Array(d)).map((b) => b.toString(16).padStart(2, "0")).join(""),
  );
}