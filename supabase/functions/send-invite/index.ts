import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    // Get auth token from request
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Not authenticated" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Create client with user's token for auth checks
    const supabaseUser = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: authHeader } },
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const { data: { user }, error: authError } = await supabaseUser.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Not authenticated" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { email, org_id, role = "member" } = await req.json();
    if (!email || !org_id) {
      return new Response(JSON.stringify({ error: "email and org_id are required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Use service role client to check membership and create invitation
    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    // Check if caller is manager/admin of the org
    const { data: membership } = await supabaseAdmin
      .from("org_memberships")
      .select("role")
      .eq("org_id", org_id)
      .eq("user_id", user.id)
      .single();

    if (!membership || !["admin", "manager"].includes(membership.role)) {
      return new Response(JSON.stringify({ error: "Not authorized to invite members" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Check if invitation already exists
    const { data: existing } = await supabaseAdmin
      .from("invitations")
      .select("id, token")
      .eq("org_id", org_id)
      .eq("email", email)
      .eq("status", "pending")
      .maybeSingle();

    if (existing) {
      const siteUrl = req.headers.get("origin") || Deno.env.get("SITE_URL") || supabaseUrl.replace(".supabase.co", ".lovable.app");
      const inviteLink = `${siteUrl}/accept-invite?token=${existing.token}`;
      return new Response(
        JSON.stringify({ message: "Invitation already exists", invite_link: inviteLink, token: existing.token }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Create invitation
    const token = crypto.randomUUID();
    const { error: insertError } = await supabaseAdmin.from("invitations").insert({
      org_id,
      email,
      role,
      invited_by: user.id,
      token,
    });

    if (insertError) {
      console.error("Insert invitation error:", insertError);
      return new Response(JSON.stringify({ error: "Failed to create invitation" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const siteUrl = req.headers.get("origin") || Deno.env.get("SITE_URL") || "";
    const inviteLink = `${siteUrl}/accept-invite?token=${token}`;

    console.log(`Invitation created for ${email} to org ${org_id} with token ${token}`);

    return new Response(
      JSON.stringify({ success: true, invite_link: inviteLink, token }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Send invite error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
