// agent-ingest: normalize an external signal (Slack message, Gmail thread, uploaded doc),
// extract entities via the Memory Agent, upsert to Pinecone, and trigger Router + Critic.
// Idempotent on (org_id, source_hash).
import { generateText, Output } from "npm:ai";
import { z } from "npm:zod@3.25.76";
import { corsHeaders, embedText, jsonResponse, logAgent, requireUser, sha256Hex } from "../_shared/auth.ts";
import { createLovableAiGatewayProvider } from "../_shared/ai-gateway.ts";

const MEMORY_SYSTEM = `Extract structured organizational knowledge from a single signal.
Return: a short title, a 1-sentence summary, key entities (people/topics/projects), and any explicit decisions or action items.
If the signal looks contradictory with common org norms, set conflictHint=true.`;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const { service, orgId, userId } = await requireUser(req, { requireOrg: true });
    const body = await req.json().catch(() => ({}));
    const text: string = (body.text ?? "").trim();
    const source: string = body.source ?? "manual";
    if (!text) return jsonResponse({ error: "text required" }, 400);

    const hash = await sha256Hex(`${source}:${text}`);
    const { data: dup } = await service.from("ingest_dedupe").select("source_hash").eq("org_id", orgId!).eq("source_hash", hash).maybeSingle();
    if (dup) return jsonResponse({ deduped: true, source_hash: hash });

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) return jsonResponse({ error: "AI not configured" }, 500);
    const gateway = createLovableAiGatewayProvider(LOVABLE_API_KEY);
    const model = gateway("google/gemini-3-flash-preview");

    const t0 = Date.now();
    const { experimental_output } = await generateText({
      model,
      system: MEMORY_SYSTEM,
      prompt: text.slice(0, 6000),
      experimental_output: Output.object({
        schema: z.object({
          title: z.string(),
          summary: z.string(),
          entities: z.array(z.string()).default([]),
          decisions: z.array(z.string()).default([]),
          actionItems: z.array(z.string()).default([]),
          conflictHint: z.boolean().default(false),
        }),
      }),
    });
    const memo = experimental_output;

    // Upsert to Pinecone (namespace = org_id)
    const vector = await embedText(`${memo.title}\n${memo.summary}\n${text.slice(0, 2000)}`);
    if (vector) {
      const host = Deno.env.get("PINECONE_INDEX_HOST");
      const key = Deno.env.get("PINECONE_API_KEY");
      if (host && key) {
        const url = (host.startsWith("http") ? host : `https://${host}`) + "/vectors/upsert";
        await fetch(url, {
          method: "POST",
          headers: { "Api-Key": key, "Content-Type": "application/json" },
          body: JSON.stringify({ vectors: [{ id: hash, values: vector, metadata: { title: memo.title, text: memo.summary, source } }], namespace: orgId! }),
        });
      }
    }

    // Persist as a topic for graph visibility
    const { data: topic } = await service.from("topics").insert({ org_id: orgId!, title: memo.title, description: memo.summary, created_by: userId }).select("id").single();

    await service.from("ingest_dedupe").insert({ org_id: orgId!, source_hash: hash });
    await logAgent(service, { orgId: orgId!, agent: "memory", action: "ingest", input: source, output: memo.title, reasoning: memo.summary, durationMs: Date.now() - t0 });

    // Router: notify org managers about new decisions / action items
    if (memo.decisions.length || memo.actionItems.length) {
      const { data: managers } = await service.from("org_memberships").select("user_id").eq("org_id", orgId!).in("role", ["admin", "manager"]).limit(5);
      for (const m of managers ?? []) {
        await service.from("notifications").insert({ org_id: orgId!, user_id: m.user_id, title: `New: ${memo.title}`, body: memo.summary, type: "info", source_agent: "router", reasoning: `${memo.decisions.length} decisions, ${memo.actionItems.length} action items` });
      }
      await logAgent(service, { orgId: orgId!, agent: "router", action: "auto_notify", input: memo.title, output: `routed to ${managers?.length ?? 0}` });
    }

    // Critic: surface possible conflicts
    if (memo.conflictHint) {
      await service.from("conflicts").insert({ org_id: orgId!, title: `Possible conflict: ${memo.title}`, description: memo.summary, severity: "medium", detected_by: "critic_agent" });
      await logAgent(service, { orgId: orgId!, agent: "critic", action: "flag_conflict", input: memo.title, output: "logged" });
    }

    return jsonResponse({ ingested: true, topic_id: topic?.id ?? null, memo });
  } catch (e) {
    if (e instanceof Response) return e;
    console.error("agent-ingest error", e);
    return jsonResponse({ error: (e as Error).message }, 500);
  }
});