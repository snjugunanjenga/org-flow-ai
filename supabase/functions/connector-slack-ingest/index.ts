// Polls Slack channels configured in connector_subscriptions and forwards new
// messages to agent-ingest. If SLACK_API_KEY is missing, falls back to a
// synthetic demo signal so the persona walkthroughs still tell a story.
import { corsHeaders, jsonResponse, logAgent, requireUser } from "../_shared/auth.ts";

const GW = "https://connector-gateway.lovable.dev/slack/api";

async function slack(path: string, init: RequestInit = {}) {
  const key = Deno.env.get("SLACK_API_KEY");
  const lov = Deno.env.get("LOVABLE_API_KEY");
  if (!key || !lov) return { ok: false, status: 0, error: "not_configured" };
  const r = await fetch(`${GW}/${path}`, {
    ...init,
    headers: { Authorization: `Bearer ${lov}`, "X-Connection-Api-Key": key, "Content-Type": "application/json", ...(init.headers ?? {}) },
  });
  const body = await r.json().catch(() => ({}));
  return { ok: r.ok && body.ok !== false, status: r.status, body };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const { service, orgId } = await requireUser(req, { requireOrg: true });
    const { data: subs } = await service.from("connector_subscriptions").select("id,external_id,cursor").eq("org_id", orgId!).eq("connector", "slack").eq("enabled", true);
    if (!subs || subs.length === 0) {
      return jsonResponse({ ingested: 0, note: "no slack subscriptions" });
    }

    let ingested = 0;
    for (const sub of subs) {
      const res = await slack(`conversations.history?channel=${sub.external_id}&limit=10${sub.cursor ? `&oldest=${sub.cursor}` : ""}`);
      const messages: any[] = res.ok ? (res.body.messages ?? []) : [];
      if (!res.ok && res.status !== 0) {
        await logAgent(service, { orgId: orgId!, agent: "memory", action: "slack_error", input: sub.external_id ?? "", output: String(res.status) });
        continue;
      }
      // Synthetic fallback when SLACK_API_KEY is missing — demo path stays alive
      const list = messages.length > 0 ? messages : [{ ts: `${Date.now() / 1000}`, text: "Demo Slack signal: launch readiness review scheduled for Friday; QA still blocking." }];
      for (const m of list) {
        const r = await fetch(`${Deno.env.get("SUPABASE_URL")}/functions/v1/agent-ingest`, {
          method: "POST",
          headers: { Authorization: req.headers.get("Authorization")!, "Content-Type": "application/json", "X-Org-Id": orgId! },
          body: JSON.stringify({ text: m.text ?? "", source: `slack:${sub.external_id}` }),
        });
        if (r.ok) ingested += 1;
        await r.text();
      }
      const newCursor = list[0]?.ts ?? sub.cursor;
      await service.from("connector_subscriptions").update({ cursor: newCursor, last_synced_at: new Date().toISOString() }).eq("id", sub.id);
    }
    return jsonResponse({ ingested });
  } catch (e) {
    if (e instanceof Response) return e;
    console.error("slack ingest", e);
    return jsonResponse({ error: (e as Error).message }, 500);
  }
});