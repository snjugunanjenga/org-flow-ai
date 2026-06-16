import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";

const GATEWAY = "https://connector-gateway.lovable.dev";
const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY") ?? "";

type Provider = "gdoc" | "gsheet" | "gslides" | "gdrive" | "sharepoint" | "onedrive" | "outlook" | "url";

interface Detected {
  provider: Provider;
  externalId: string;
  raw: string;
}

function detect(url: string): Detected {
  const u = url.trim();
  let m: RegExpMatchArray | null;
  if ((m = u.match(/docs\.google\.com\/document\/d\/([^/?#]+)/))) return { provider: "gdoc", externalId: m[1], raw: u };
  if ((m = u.match(/docs\.google\.com\/spreadsheets\/d\/([^/?#]+)/))) return { provider: "gsheet", externalId: m[1], raw: u };
  if ((m = u.match(/docs\.google\.com\/presentation\/d\/([^/?#]+)/))) return { provider: "gslides", externalId: m[1], raw: u };
  if ((m = u.match(/drive\.google\.com\/file\/d\/([^/?#]+)/))) return { provider: "gdrive", externalId: m[1], raw: u };
  if ((m = u.match(/drive\.google\.com\/open\?id=([^&]+)/))) return { provider: "gdrive", externalId: m[1], raw: u };
  if (/sharepoint\.com\//i.test(u)) return { provider: "sharepoint", externalId: u, raw: u };
  if (/(onedrive\.live\.com|1drv\.ms)\//i.test(u)) return { provider: "onedrive", externalId: u, raw: u };
  if (/outlook\.office\.com\//i.test(u)) {
    const id = u.match(/\/id\/([^/?#]+)/)?.[1] ?? u;
    return { provider: "outlook", externalId: id, raw: u };
  }
  return { provider: "url", externalId: u, raw: u };
}

function gwHeaders(connectorKeyEnv: string): HeadersInit | null {
  const key = Deno.env.get(connectorKeyEnv);
  if (!key || !LOVABLE_API_KEY) return null;
  return {
    Authorization: `Bearer ${LOVABLE_API_KEY}`,
    "X-Connection-Api-Key": key,
  };
}

function flattenDocBody(body: any): string {
  const out: string[] = [];
  for (const el of body?.content ?? []) {
    const para = el?.paragraph;
    if (!para) continue;
    for (const e of para.elements ?? []) {
      const t = e?.textRun?.content;
      if (t) out.push(t);
    }
  }
  return out.join("").slice(0, 200_000);
}

async function fetchContent(d: Detected): Promise<{ title: string; content: string; mime?: string }> {
  if (d.provider === "url") {
    return { title: d.raw, content: `[URL source: ${d.raw}]` };
  }

  if (d.provider === "gdoc") {
    const h = gwHeaders("GOOGLE_DOCS_API_KEY") ?? gwHeaders("GOOGLE_DRIVE_API_KEY");
    if (!h) throw new Error("Google Docs connector not linked");
    const r = await fetch(`${GATEWAY}/google_docs/v1/documents/${d.externalId}`, { headers: h });
    if (!r.ok) throw new Error(`Google Docs ${r.status}: ${await r.text()}`);
    const j = await r.json();
    return { title: j.title ?? "Google Doc", content: flattenDocBody(j.body), mime: "application/vnd.google-apps.document" };
  }

  if (d.provider === "gsheet") {
    const h = gwHeaders("GOOGLE_SHEETS_API_KEY") ?? gwHeaders("GOOGLE_DRIVE_API_KEY");
    if (!h) throw new Error("Google Sheets connector not linked");
    const meta = await fetch(`${GATEWAY}/google_sheets/v4/spreadsheets/${d.externalId}?fields=properties.title,sheets.properties.title`, { headers: h });
    if (!meta.ok) throw new Error(`Google Sheets ${meta.status}: ${await meta.text()}`);
    const mj = await meta.json();
    const firstSheet = mj?.sheets?.[0]?.properties?.title ?? "Sheet1";
    const v = await fetch(`${GATEWAY}/google_sheets/v4/spreadsheets/${d.externalId}/values/${firstSheet}!A1:Z1000`, { headers: h });
    const vj = await v.json();
    const rows = (vj?.values ?? []) as string[][];
    const csv = rows.map((r) => r.join("\t")).join("\n").slice(0, 200_000);
    return { title: mj?.properties?.title ?? "Google Sheet", content: csv, mime: "application/vnd.google-apps.spreadsheet" };
  }

  if (d.provider === "gdrive" || d.provider === "gslides") {
    const h = gwHeaders("GOOGLE_DRIVE_API_KEY");
    if (!h) throw new Error("Google Drive connector not linked");
    const meta = await fetch(`${GATEWAY}/google_drive/drive/v3/files/${d.externalId}?fields=id,name,mimeType,size`, { headers: h });
    if (!meta.ok) throw new Error(`Google Drive ${meta.status}: ${await meta.text()}`);
    const mj = await meta.json();
    let content = `[${mj.mimeType} · ${mj.name}]`;
    if (mj.mimeType?.startsWith("text/") || mj.mimeType === "application/json") {
      const c = await fetch(`${GATEWAY}/google_drive/drive/v3/files/${d.externalId}?alt=media`, { headers: h });
      content = (await c.text()).slice(0, 200_000);
    } else if (mj.mimeType === "application/vnd.google-apps.presentation") {
      const c = await fetch(`${GATEWAY}/google_drive/drive/v3/files/${d.externalId}/export?mimeType=text/plain`, { headers: h });
      if (c.ok) content = (await c.text()).slice(0, 200_000);
    }
    return { title: mj.name ?? "Drive file", content, mime: mj.mimeType };
  }

  if (d.provider === "sharepoint") {
    const h = gwHeaders("MICROSOFT_SHAREPOINT_API_KEY");
    if (!h) throw new Error("Microsoft SharePoint connector not linked");
    return { title: d.raw, content: `[SharePoint link saved: ${d.raw}]\nFetch content via the SharePoint connector once item ID is provided.` };
  }

  if (d.provider === "onedrive") {
    const h = gwHeaders("MICROSOFT_ONEDRIVE_API_KEY");
    if (!h) throw new Error("Microsoft OneDrive connector not linked");
    return { title: d.raw, content: `[OneDrive link saved: ${d.raw}]` };
  }

  if (d.provider === "outlook") {
    const h = gwHeaders("MICROSOFT_OUTLOOK_API_KEY");
    if (!h) throw new Error("Microsoft Outlook connector not linked");
    const r = await fetch(`${GATEWAY}/microsoft_outlook/me/messages/${encodeURIComponent(d.externalId)}?$select=subject,bodyPreview,body,from`, { headers: h });
    if (!r.ok) throw new Error(`Outlook ${r.status}: ${await r.text()}`);
    const j = await r.json();
    const body = (j?.body?.content ?? j?.bodyPreview ?? "").replace(/<[^>]+>/g, " ").slice(0, 200_000);
    return { title: j?.subject ?? "Outlook message", content: body };
  }

  return { title: d.raw, content: `[Unknown source: ${d.raw}]` };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const auth = req.headers.get("Authorization") ?? "";
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const anon = Deno.env.get("SUPABASE_ANON_KEY")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const userClient = createClient(supabaseUrl, anon, { global: { headers: { Authorization: auth } } });
    const { data: userData, error: userErr } = await userClient.auth.getUser();
    if (userErr || !userData?.user) {
      return new Response(JSON.stringify({ error: "Not authenticated" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    const userId = userData.user.id;

    const body = await req.json().catch(() => ({}));
    const { notebook_id, org_id, url } = body ?? {};
    if (!notebook_id || !org_id || !url || typeof url !== "string") {
      return new Response(JSON.stringify({ error: "notebook_id, org_id, url required" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const admin = createClient(supabaseUrl, serviceKey);
    const { data: membership } = await admin.from("org_memberships").select("user_id").eq("org_id", org_id).eq("user_id", userId).maybeSingle();
    if (!membership) {
      return new Response(JSON.stringify({ error: "Not a member of this org" }), { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const detected = detect(url);
    const fetched = await fetchContent(detected);

    const { data: inserted, error: insErr } = await admin.from("resource_sources").insert({
      notebook_id,
      org_id,
      source_type: detected.provider,
      title: fetched.title,
      content: fetched.content,
      file_url: detected.raw,
      metadata: { provider: detected.provider, external_id: detected.externalId, mime_type: fetched.mime ?? null },
    }).select("id").single();
    if (insErr) throw insErr;

    // Link to the knowledge graph: run Memory Agent ingest (Pinecone + topic node)
    // then write graph edges Notebook -> Source -> Topic so the Mind Map / Graph view
    // shows provable provenance for every decision derived from this source.
    let topicId: string | null = null;
    try {
      const ingestRes = await fetch(`${supabaseUrl}/functions/v1/agent-ingest`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: auth,
          "x-org-id": org_id,
        },
        body: JSON.stringify({
          source: `notebook:${notebook_id}:${detected.provider}`,
          text: `${fetched.title}\n\n${fetched.content}`.slice(0, 12_000),
        }),
      });
      if (ingestRes.ok) {
        const ij = await ingestRes.json().catch(() => ({}));
        topicId = ij?.topic_id ?? null;
        const sourceLabel = fetched.title.slice(0, 120);
        const edges: Array<Record<string, unknown>> = [
          {
            org_id,
            source_type: "notebook",
            source_label: notebook_id,
            target_type: "source",
            target_label: sourceLabel,
            relationship: "contains",
          },
        ];
        if (topicId && ij?.memo?.title) {
          edges.push({
            org_id,
            source_type: "source",
            source_label: sourceLabel,
            target_type: "topic",
            target_label: ij.memo.title,
            relationship: "evidence_for",
            weight: 1.0,
          });
        }
        await admin.from("graph_edges").insert(edges);
      } else {
        console.warn("agent-ingest failed", ingestRes.status, await ingestRes.text());
      }
    } catch (linkErr) {
      console.warn("graph link error", linkErr);
    }

    return new Response(JSON.stringify({ ok: true, id: inserted?.id, provider: detected.provider, topic_id: topicId }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e) {
    console.error("resource-source-fetch error", e);
    return new Response(JSON.stringify({ error: (e as Error).message ?? "Unknown error" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});