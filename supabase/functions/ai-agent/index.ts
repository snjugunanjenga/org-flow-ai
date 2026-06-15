// Coordinator-driven multi-agent loop.
// The Coordinator runs on the AI SDK with four tools that wrap the other agents:
//   search_memory  → Pinecone vector query (namespace = org_id)
//   graph_lookup   → Neo4j proxy MATCH scoped to org_id
//   invoke_router  → score stakeholders, write notifications
//   invoke_critic  → flag conflicts and stale decisions
// Every tool execution writes a row to agent_logs so the UI can render the trace.
import { generateText, stepCountIs, tool } from "npm:ai";
import { z } from "npm:zod@3.23.8";
import { corsHeaders, embedText, jsonResponse, logAgent, requireUser } from "../_shared/auth.ts";
import { createLovableAiGatewayProvider } from "../_shared/ai-gateway.ts";

const SYSTEM_PROMPT = `You are the Coordinator Agent of a Superhuman AI Chief of Staff.
You orchestrate three specialist agents through tools:
- search_memory: semantic retrieval from the org's knowledge base (Pinecone).
- graph_lookup: relationship lookups in the org's knowledge graph (Neo4j).
- invoke_router: scores who needs to know and posts in-app notifications.
- invoke_critic: scans for conflicts, contradictions, and stale decisions.

Citation-first rule: every factual claim must cite an id returned by search_memory or graph_lookup.
If you have no grounded source, say so and ask a clarifying question instead of inventing facts.
Be concise. Prefer 3–6 sentence answers with bullet citations.`;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const { service, userId, orgId } = await requireUser(req, { requireOrg: true });
    const body = await req.json().catch(() => ({}));
    const messages = Array.isArray(body.messages) ? body.messages : [];
    if (messages.length === 0) return jsonResponse({ error: "messages[] required" }, 400);

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) return jsonResponse({ error: "AI not configured" }, 500);

    const gateway = createLovableAiGatewayProvider(LOVABLE_API_KEY);
    const model = gateway("google/gemini-3-flash-preview");

    const startCoord = Date.now();
    const trace: Array<{ agent: string; action: string; output: string }> = [];

    const pinecone = async (action: string, payload: Record<string, unknown>) => {
      const host = Deno.env.get("PINECONE_INDEX_HOST");
      const key = Deno.env.get("PINECONE_API_KEY");
      if (!host || !key) return null;
      const url = host.startsWith("http") ? host : `https://${host}`;
      const r = await fetch(`${url}/${action === "query" ? "query" : "vectors/upsert"}`, {
        method: "POST",
        headers: { "Api-Key": key, "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify(payload),
      });
      if (!r.ok) {
        console.error("pinecone", r.status, await r.text());
        return null;
      }
      return await r.json();
    };

    const neo4j = async (query: string, parameters: Record<string, unknown>) => {
      const uri = Deno.env.get("NEO4J_URI");
      const user = Deno.env.get("NEO4J_USERNAME");
      const pass = Deno.env.get("NEO4J_PASSWORD");
      if (!uri || !user || !pass) return null;
      const http = uri.replace(/^neo4j\+s:\/\//, "https://").replace(/^neo4j:\/\//, "http://").replace(/^bolt\+s:\/\//, "https://").replace(/^bolt:\/\//, "http://");
      const r = await fetch(`${http}/db/neo4j/tx/commit`, {
        method: "POST",
        headers: { Authorization: `Basic ${btoa(`${user}:${pass}`)}`, "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({ statements: [{ statement: query, parameters }] }),
      });
      if (!r.ok) return null;
      const data = await r.json();
      return data?.results?.[0] ?? null;
    };

    const tools = {
      search_memory: tool({
        description: "Semantic search over the organization's knowledge base. Returns up to topK source snippets with ids that you MUST cite.",
        inputSchema: z.object({
          query: z.string().describe("The natural-language query to embed and search."),
          topK: z.number().int().min(1).max(10).optional(),
        }),
        execute: async ({ query, topK }) => {
          const t0 = Date.now();
          const vector = await embedText(query);
          let matches: Array<{ id: string; score: number; text: string }> = [];
          if (vector) {
            const result = await pinecone("query", { vector, topK: topK ?? 5, includeMetadata: true, namespace: orgId! });
            matches = (result?.matches ?? []).map((m: any) => ({ id: m.id, score: m.score, text: String(m.metadata?.text ?? m.metadata?.title ?? "").slice(0, 400) }));
          }
          // Fallback to recent topics / decisions when Pinecone is unavailable
          if (matches.length === 0) {
            const { data } = await service.from("topics").select("id,title,description").eq("org_id", orgId!).order("created_at", { ascending: false }).limit(topK ?? 5);
            matches = (data ?? []).map((t: any) => ({ id: t.id, score: 0.5, text: `${t.title} — ${t.description ?? ""}`.slice(0, 400) }));
          }
          await logAgent(service, { orgId: orgId!, agent: "memory", action: "search_memory", input: query, output: JSON.stringify(matches.map((m) => m.id)), durationMs: Date.now() - t0 });
          trace.push({ agent: "memory", action: "search_memory", output: `${matches.length} matches` });
          return { matches };
        },
      }),
      graph_lookup: tool({
        description: "Find related entities (people, topics, projects) in the org's knowledge graph.",
        inputSchema: z.object({
          entity: z.string().describe("Name of the entity to look up."),
          depth: z.number().int().min(1).max(3).optional(),
        }),
        execute: async ({ entity, depth }) => {
          const t0 = Date.now();
          const result = await neo4j(
            `MATCH (n {org_id: $org})-[r*1..${depth ?? 2}]-(m {org_id: $org}) WHERE toLower(n.name) CONTAINS toLower($q) RETURN n.name AS source, m.name AS target, type(r[0]) AS relation LIMIT 20`,
            { org: orgId!, q: entity },
          );
          const edges = (result?.data ?? []).map((row: any) => ({ source: row.row?.[0], target: row.row?.[1], relation: row.row?.[2] }));
          await logAgent(service, { orgId: orgId!, agent: "memory", action: "graph_lookup", input: entity, output: `${edges.length} edges`, durationMs: Date.now() - t0 });
          trace.push({ agent: "memory", action: "graph_lookup", output: `${edges.length} edges` });
          return { edges };
        },
      }),
      invoke_router: tool({
        description: "Score stakeholders for a knowledge update and post an in-app notification to each. Use after you've decided something important changed.",
        inputSchema: z.object({
          title: z.string(),
          body: z.string(),
          reasoning: z.string().describe("Why this needs to be routed and to whom."),
          maxRecipients: z.number().int().min(1).max(10).optional(),
        }),
        execute: async ({ title, body, reasoning, maxRecipients }) => {
          const t0 = Date.now();
          const { data: members } = await service.from("org_memberships").select("user_id,role").eq("org_id", orgId!).limit(maxRecipients ?? 5);
          const recipients = (members ?? []).slice(0, maxRecipients ?? 5);
          for (const m of recipients) {
            await service.from("notifications").insert({ org_id: orgId!, user_id: m.user_id, title, body, type: "info", source_agent: "router", reasoning });
          }
          await logAgent(service, { orgId: orgId!, agent: "router", action: "notify", input: title, output: `routed to ${recipients.length}`, reasoning, durationMs: Date.now() - t0 });
          trace.push({ agent: "router", action: "notify", output: `routed to ${recipients.length}` });
          return { routed: recipients.length };
        },
      }),
      invoke_critic: tool({
        description: "Scan retrieved context for contradictions or stale decisions. Use when sources disagree or a decision looks outdated.",
        inputSchema: z.object({
          title: z.string(),
          description: z.string(),
          severity: z.enum(["low", "medium", "high", "critical"]).optional(),
          parties: z.array(z.string()).optional(),
        }),
        execute: async ({ title, description, severity, parties }) => {
          const t0 = Date.now();
          const { data, error } = await service.from("conflicts").insert({ org_id: orgId!, title, description, severity: severity ?? "medium", parties: parties ?? [], detected_by: "critic_agent" }).select("id").single();
          await logAgent(service, { orgId: orgId!, agent: "critic", action: "flag_conflict", input: title, output: error ? "error" : "logged", durationMs: Date.now() - t0 });
          trace.push({ agent: "critic", action: "flag_conflict", output: title });
          return { conflictId: data?.id ?? null };
        },
      }),
    };

    try {
      const result = await generateText({
        model,
        system: SYSTEM_PROMPT,
        messages,
        tools,
        stopWhen: stepCountIs(50),
      });

      await logAgent(service, {
        orgId: orgId!,
        agent: "coordinator",
        action: "respond",
        input: messages.at(-1)?.content?.slice(0, 500) ?? "",
        output: result.text.slice(0, 1000),
        reasoning: `${result.steps.length} steps, ${trace.length} tool calls`,
        durationMs: Date.now() - startCoord,
      });

      return jsonResponse({
        // Back-compat with the existing AIChatAgent client (reads choices[0].message.content)
        choices: [{ message: { role: "assistant", content: result.text } }],
        text: result.text,
        trace,
        usage: result.usage,
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      if (/429|rate/i.test(message)) return jsonResponse({ error: "Rate limit exceeded, please try again." }, 429);
      if (/402|credit/i.test(message)) return jsonResponse({ error: "AI credits exhausted." }, 402);
      console.error("ai-agent loop error", message);
      return jsonResponse({ error: "AI loop failed", details: message }, 500);
    }
  } catch (e) {
    if (e instanceof Response) return e;
    console.error("ai-agent fatal", e);
    return jsonResponse({ error: (e as Error).message }, 500);
  }
});
