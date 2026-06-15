// Outbound message dispatcher for Router Agent notifications.
// Routes a notification to Slack (chat.postMessage) or Gmail (users/me/messages/send)
// using the Lovable Connector Gateway. Falls back to a stub log if a connector is missing
// so the demo stays resilient.
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { createClient } from "npm:@supabase/supabase-js@2";
import { z } from "npm:zod@3.23.8";

const Body = z.object({
  channel: z.enum(["slack", "gmail"]),
  to: z.string().min(1), // slack channel id (C…) OR email address
  subject: z.string().optional(),
  text: z.string().min(1),
  org_id: z.string().uuid().optional(),
  notification_id: z.string().uuid().optional(),
});

const GATEWAY = "https://connector-gateway.lovable.dev";
const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
const SLACK_API_KEY = Deno.env.get("SLACK_API_KEY");
const GMAIL_API_KEY = Deno.env.get("GOOGLE_MAIL_API_KEY");

function b64url(s: string) {
  return btoa(s).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

async function sendSlack(channel: string, text: string) {
  if (!LOVABLE_API_KEY || !SLACK_API_KEY) {
    return { ok: false, simulated: true, reason: "slack_not_linked" };
  }
  const res = await fetch(`${GATEWAY}/slack/api/chat.postMessage`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${LOVABLE_API_KEY}`,
      "X-Connection-Api-Key": SLACK_API_KEY,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ channel, text }),
  });
  const data = await res.json().catch(() => ({}));
  return { ok: res.ok && data?.ok !== false, response: data };
}

async function sendGmail(to: string, subject: string, text: string) {
  if (!LOVABLE_API_KEY || !GMAIL_API_KEY) {
    return { ok: false, simulated: true, reason: "gmail_not_linked" };
  }
  const raw = b64url(
    [`To: ${to}`, `Subject: ${subject}`, 'Content-Type: text/plain; charset="UTF-8"', "", text].join("\r\n"),
  );
  const res = await fetch(`${GATEWAY}/google_mail/gmail/v1/users/me/messages/send`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${LOVABLE_API_KEY}`,
      "X-Connection-Api-Key": GMAIL_API_KEY,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ raw }),
  });
  const data = await res.json().catch(() => ({}));
  return { ok: res.ok, response: data };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const parsed = Body.safeParse(await req.json());
    if (!parsed.success) {
      return new Response(JSON.stringify({ error: parsed.error.flatten() }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const { channel, to, subject, text, notification_id } = parsed.data;
    const result =
      channel === "slack"
        ? await sendSlack(to, text)
        : await sendGmail(to, subject ?? "Update from your AI Chief of Staff", text);

    // Best-effort: mark notification dispatched
    if (notification_id) {
      try {
        const supabase = createClient(
          Deno.env.get("SUPABASE_URL")!,
          Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
        );
        await supabase
          .from("notifications")
          .update({ delivered_at: new Date().toISOString(), delivery_meta: result })
          .eq("id", notification_id);
      } catch (_) {
        // schema may not have delivery_meta column; ignore
      }
    }

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: result.ok ? 200 : 502,
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});