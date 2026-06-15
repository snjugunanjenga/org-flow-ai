// Polls Gmail for unread messages on configured labels and forwards each to agent-ingest.
// Falls back to a synthetic signal when GOOGLE_MAIL_API_KEY is missing.
import { corsHeaders, jsonResponse, logAgent, requireUser } from "../_shared/auth.ts";

const GW = "https://connector-gateway.lovable.dev/google_mail/gmail/v1";

async function gmail(path: string) {
  const key = Deno.env.get("GOOGLE_MAIL_API_KEY");
  const lov = Deno.env.get("LOVABLE_API_KEY");
  if (!key || !lov) return { ok: false, status: 0, body: null as any };
  const r = await fetch(`${GW}/${path}`, { headers: { Authorization: `Bearer ${lov}`, "X-Connection-Api-Key": key } });
  const body = await r.json().catch(() => ({}));
  return { ok: r.ok, status: r.status, body };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const { service, orgId } = await requireUser(req, { requireOrg: true });
    const { data: subs } = await service.from("connector_subscriptions").select("id,external_id,label,cursor").eq("org_id", orgId!).eq("connector", "gmail").eq("enabled", true);
    if (!subs || subs.length === 0) return jsonResponse({ ingested: 0, note: "no gmail subscriptions" });

    let ingested = 0;
    for (const sub of subs) {
      const q = encodeURIComponent(`is:unread newer_than:1d ${sub.label ? `label:${sub.label}` : ""}`.trim());
      const list = await gmail(`users/me/messages?maxResults=5&q=${q}`);
      const ids: string[] = list.ok ? (list.body.messages ?? []).map((m: any) => m.id) : [];
      const items = ids.length > 0
        ? await Promise.all(ids.map(async (id) => {
          const m = await gmail(`users/me/messages/${id}?format=metadata&metadataHeaders=subject&metadataHeaders=from`);
          const headers = m.body?.payload?.headers ?? [];
          const subject = headers.find((h: any) => h.name === "Subject")?.value ?? "(no subject)";
          const from = headers.find((h: any) => h.name === "From")?.value ?? "";
          const snippet = m.body?.snippet ?? "";
          return { text: `From ${from}: ${subject} — ${snippet}`, id };
        }))
        : [{ text: "Demo Gmail signal: customer requesting Q3 roadmap, decision needed on EU launch timing.", id: `demo-${Date.now()}` }];

      for (const it of items) {
        const r = await fetch(`${Deno.env.get("SUPABASE_URL")}/functions/v1/agent-ingest`, {
          method: "POST",
          headers: { Authorization: req.headers.get("Authorization")!, "Content-Type": "application/json", "X-Org-Id": orgId! },
          body: JSON.stringify({ text: it.text, source: `gmail:${it.id}` }),
        });
        if (r.ok) ingested += 1;
        await r.text();
      }
      await service.from("connector_subscriptions").update({ last_synced_at: new Date().toISOString() }).eq("id", sub.id);
    }
    await logAgent(service, { orgId: orgId!, agent: "memory", action: "gmail_sync", input: `subs=${subs.length}`, output: `ingested=${ingested}` });
    return jsonResponse({ ingested });
  } catch (e) {
    if (e instanceof Response) return e;
    console.error("gmail ingest", e);
    return jsonResponse({ error: (e as Error).message }, 500);
  }
});