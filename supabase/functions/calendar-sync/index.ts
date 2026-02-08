import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const GOOGLE_CLIENT_ID = Deno.env.get("GOOGLE_CLIENT_ID")!;
const GOOGLE_CLIENT_SECRET = Deno.env.get("GOOGLE_CLIENT_SECRET")!;
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const SCOPES = [
  "https://www.googleapis.com/auth/calendar.readonly",
  "https://www.googleapis.com/auth/calendar.events",
].join(" ");

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

async function refreshAccessToken(refreshToken: string): Promise<{ access_token: string; expires_in: number }> {
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: GOOGLE_CLIENT_ID,
      client_secret: GOOGLE_CLIENT_SECRET,
      refresh_token: refreshToken,
      grant_type: "refresh_token",
    }),
  });
  if (!res.ok) {
    const err = await res.text();
    console.error("Token refresh failed:", err);
    throw new Error("Failed to refresh Google token");
  }
  return res.json();
}

async function getValidAccessToken(supabaseAdmin: ReturnType<typeof createClient>, userId: string): Promise<string> {
  const { data: tokenRow, error } = await supabaseAdmin
    .from("google_oauth_tokens")
    .select("*")
    .eq("user_id", userId)
    .single();

  if (error || !tokenRow) throw new Error("Google account not connected");

  const expiresAt = new Date(tokenRow.token_expires_at);
  if (expiresAt > new Date(Date.now() + 60_000)) {
    return tokenRow.access_token;
  }

  console.log("Refreshing expired Google token for user:", userId);
  const refreshed = await refreshAccessToken(tokenRow.refresh_token);

  await supabaseAdmin
    .from("google_oauth_tokens")
    .update({
      access_token: refreshed.access_token,
      token_expires_at: new Date(Date.now() + refreshed.expires_in * 1000).toISOString(),
    })
    .eq("user_id", userId);

  return refreshed.access_token;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const action = url.searchParams.get("action");

    const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Get user from auth header
    const authHeader = req.headers.get("Authorization");
    let userId: string | null = null;

    if (authHeader) {
      const supabaseUser = createClient(SUPABASE_URL, Deno.env.get("SUPABASE_ANON_KEY")!, {
        global: { headers: { Authorization: authHeader } },
      });
      const { data: { user } } = await supabaseUser.auth.getUser();
      userId = user?.id ?? null;
    }

    // ──────────────────────────────────────────────
    // ACTION: auth-url — Generate Google OAuth URL
    // ──────────────────────────────────────────────
    if (action === "auth-url") {
      if (!userId) return json({ error: "Not authenticated" }, 401);

      const body = await req.json();
      const redirectUri = body.redirect_uri;
      if (!redirectUri) return json({ error: "redirect_uri required" }, 400);

      const params = new URLSearchParams({
        client_id: GOOGLE_CLIENT_ID,
        redirect_uri: redirectUri,
        response_type: "code",
        scope: SCOPES,
        access_type: "offline",
        prompt: "consent",
        state: userId,
      });

      return json({ url: `https://accounts.google.com/o/oauth2/v2/auth?${params}` });
    }

    // ──────────────────────────────────────────────
    // ACTION: callback — Exchange auth code for tokens
    // ──────────────────────────────────────────────
    if (action === "callback") {
      const body = await req.json();
      const { code, redirect_uri, user_id } = body;
      if (!code || !redirect_uri) return json({ error: "code and redirect_uri required" }, 400);

      const targetUserId = user_id || userId;
      if (!targetUserId) return json({ error: "user_id required" }, 400);

      console.log("Exchanging auth code for user:", targetUserId);

      const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          client_id: GOOGLE_CLIENT_ID,
          client_secret: GOOGLE_CLIENT_SECRET,
          code,
          grant_type: "authorization_code",
          redirect_uri,
        }),
      });

      if (!tokenRes.ok) {
        const err = await tokenRes.text();
        console.error("Token exchange failed:", err);
        return json({ error: "Token exchange failed" }, 400);
      }

      const tokens = await tokenRes.json();
      console.log("Token exchange successful, storing tokens");

      const { error: upsertError } = await supabaseAdmin
        .from("google_oauth_tokens")
        .upsert({
          user_id: targetUserId,
          access_token: tokens.access_token,
          refresh_token: tokens.refresh_token,
          token_expires_at: new Date(Date.now() + tokens.expires_in * 1000).toISOString(),
          scope: tokens.scope,
        }, { onConflict: "user_id" });

      if (upsertError) {
        console.error("Token storage failed:", upsertError);
        return json({ error: "Failed to store tokens" }, 500);
      }

      return json({ success: true });
    }

    // ──────────────────────────────────────────────
    // ACTION: sync-events — Fetch Google Calendar events and upsert
    // ──────────────────────────────────────────────
    if (action === "sync-events") {
      if (!userId) return json({ error: "Not authenticated" }, 401);

      const body = await req.json();
      const orgId = body.org_id;
      if (!orgId) return json({ error: "org_id required" }, 400);

      const accessToken = await getValidAccessToken(supabaseAdmin, userId);

      const timeMin = new Date();
      timeMin.setMonth(timeMin.getMonth() - 1);
      const timeMax = new Date();
      timeMax.setMonth(timeMax.getMonth() + 3);

      const calParams = new URLSearchParams({
        timeMin: timeMin.toISOString(),
        timeMax: timeMax.toISOString(),
        singleEvents: "true",
        orderBy: "startTime",
        maxResults: "100",
      });

      console.log("Fetching Google Calendar events for user:", userId);

      const calRes = await fetch(
        `https://www.googleapis.com/calendar/v3/calendars/primary/events?${calParams}`,
        { headers: { Authorization: `Bearer ${accessToken}` } }
      );

      if (!calRes.ok) {
        const err = await calRes.text();
        console.error("Calendar API error:", err);
        return json({ error: "Failed to fetch calendar events" }, 502);
      }

      const calData = await calRes.json();
      const items = calData.items || [];
      console.log(`Fetched ${items.length} events from Google Calendar`);

      let synced = 0;
      for (const item of items) {
        const startTime = item.start?.dateTime || item.start?.date;
        const endTime = item.end?.dateTime || item.end?.date;
        if (!startTime || !endTime) continue;

        const attendees = (item.attendees || []).map((a: { email: string }) => a.email);
        const meetLink = item.hangoutLink || item.conferenceData?.entryPoints?.find(
          (e: { entryPointType: string; uri: string }) => e.entryPointType === "video"
        )?.uri || null;

        const eventData = {
          org_id: orgId,
          title: item.summary || "Untitled",
          description: item.description || null,
          start_time: new Date(startTime).toISOString(),
          end_time: new Date(endTime).toISOString(),
          location: item.location || null,
          meet_link: meetLink,
          event_type: meetLink ? "video_call" : "meeting",
          created_by: userId,
          attendees,
        };

        const { error: insertErr } = await supabaseAdmin
          .from("calendar_events")
          .insert(eventData);

        if (!insertErr) synced++;
      }

      console.log(`Synced ${synced} events to database`);
      return json({ synced, total: items.length });
    }

    // ──────────────────────────────────────────────
    // ACTION: create-meet-event — Create a Google Calendar event with Meet
    // ──────────────────────────────────────────────
    if (action === "create-meet-event") {
      if (!userId) return json({ error: "Not authenticated" }, 401);

      const body = await req.json();
      const { title, description, start_time, end_time, attendees, org_id } = body;

      if (!title || !start_time || !end_time || !org_id) {
        return json({ error: "title, start_time, end_time, org_id required" }, 400);
      }

      const accessToken = await getValidAccessToken(supabaseAdmin, userId);

      const eventBody: Record<string, unknown> = {
        summary: title,
        description: description || "",
        start: { dateTime: new Date(start_time).toISOString(), timeZone: "UTC" },
        end: { dateTime: new Date(end_time).toISOString(), timeZone: "UTC" },
        conferenceData: {
          createRequest: {
            requestId: crypto.randomUUID(),
            conferenceSolutionKey: { type: "hangoutsMeet" },
          },
        },
      };

      if (attendees && attendees.length > 0) {
        eventBody.attendees = attendees.map((email: string) => ({ email }));
      }

      console.log("Creating Google Calendar event with Meet for user:", userId);

      const createRes = await fetch(
        "https://www.googleapis.com/calendar/v3/calendars/primary/events?conferenceDataVersion=1",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(eventBody),
        }
      );

      if (!createRes.ok) {
        const err = await createRes.text();
        console.error("Event creation failed:", err);
        return json({ error: "Failed to create Google Calendar event" }, 502);
      }

      const created = await createRes.json();
      const meetLink = created.hangoutLink || created.conferenceData?.entryPoints?.find(
        (e: { entryPointType: string; uri: string }) => e.entryPointType === "video"
      )?.uri || null;

      console.log("Created event with Meet link:", meetLink);

      // Also save to our database
      const { error: dbErr } = await supabaseAdmin.from("calendar_events").insert({
        org_id,
        title,
        description: description || null,
        start_time: new Date(start_time).toISOString(),
        end_time: new Date(end_time).toISOString(),
        meet_link: meetLink,
        event_type: "video_call",
        created_by: userId,
        attendees: attendees || [],
      });

      if (dbErr) console.error("DB insert error (non-fatal):", dbErr);

      return json({
        success: true,
        google_event_id: created.id,
        meet_link: meetLink,
        html_link: created.htmlLink,
      });
    }

    // ──────────────────────────────────────────────
    // ACTION: check-connection — Check if user has Google connected
    // ──────────────────────────────────────────────
    if (action === "check-connection") {
      if (!userId) return json({ error: "Not authenticated" }, 401);

      const { data } = await supabaseAdmin
        .from("google_oauth_tokens")
        .select("id, token_expires_at, scope")
        .eq("user_id", userId)
        .single();

      return json({ connected: !!data, scope: data?.scope || null });
    }

    // ──────────────────────────────────────────────
    // ACTION: disconnect — Remove Google OAuth tokens
    // ──────────────────────────────────────────────
    if (action === "disconnect") {
      if (!userId) return json({ error: "Not authenticated" }, 401);

      await supabaseAdmin
        .from("google_oauth_tokens")
        .delete()
        .eq("user_id", userId);

      return json({ success: true });
    }

    return json({ error: `Unknown action: ${action}` }, 400);

  } catch (err) {
    console.error("calendar-sync error:", err);
    return json({ error: err instanceof Error ? err.message : "Internal error" }, 500);
  }
});
