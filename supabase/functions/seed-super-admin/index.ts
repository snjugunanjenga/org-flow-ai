import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    // 1. Create the super admin user
    const email = "simonnjenganjuguna@gmail.com";
    const password = "aqC!xeF2";

    // Check if user already exists
    const { data: existingUsers } = await supabase.auth.admin.listUsers();
    let userId: string;
    const existing = existingUsers?.users?.find((u: any) => u.email === email);

    if (existing) {
      userId = existing.id;
      console.log("Super admin user already exists:", userId);
    } else {
      const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: { full_name: "Simon Njenga" },
      });
      if (createError) throw createError;
      userId = newUser.user.id;
      console.log("Created super admin user:", userId);
    }

    // 2. Ensure profile exists
    const { data: profile } = await supabase
      .from("profiles")
      .select("id")
      .eq("user_id", userId)
      .maybeSingle();

    if (!profile) {
      await supabase.from("profiles").insert({
        user_id: userId,
        display_name: "Simon Njenga",
        onboarding_completed: true,
        job_title: "Platform Super Admin",
        department: "Platform Operations",
      });
    } else {
      await supabase
        .from("profiles")
        .update({
          display_name: "Simon Njenga",
          onboarding_completed: true,
          job_title: "Platform Super Admin",
          department: "Platform Operations",
        })
        .eq("user_id", userId);
    }

    // 3. Add admin role in user_roles
    await supabase.from("user_roles").upsert(
      { user_id: userId, role: "admin" },
      { onConflict: "user_id,role" }
    );

    // 4. Insert mock audit log data
    const auditActions = [
      { action: "subscription_updated", target_type: "subscription", metadata: { org_name: "Apple Inc.", old_plan: "free", new_plan: "pro" } },
      { action: "subscription_updated", target_type: "subscription", metadata: { org_name: "Tesla Motors", old_plan: "free", new_plan: "enterprise" } },
      { action: "newsletter_sent", target_type: "newsletter", metadata: { subject: "Platform Update v2.0", target_audience: "all", sent_count: 15 } },
      { action: "org_suspended", target_type: "organization", metadata: { org_name: "Inactive Corp", reason: "Non-payment" } },
      { action: "newsletter_sent", target_type: "newsletter", metadata: { subject: "New AI Features Available", target_audience: "pro", sent_count: 8 } },
      { action: "subscription_updated", target_type: "subscription", metadata: { org_name: "Startup XYZ", old_plan: "pro", new_plan: "free" } },
      { action: "org_reviewed", target_type: "organization", metadata: { org_name: "Apple Inc.", notes: "Quarterly review completed" } },
      { action: "newsletter_sent", target_type: "newsletter", metadata: { subject: "Security Update Notice", target_audience: "all", sent_count: 22 } },
    ];

    for (const audit of auditActions) {
      await supabase.from("admin_audit_log").insert({
        admin_user_id: userId,
        ...audit,
      });
    }

    // 5. Insert mock newsletters
    const newsletters = [
      { subject: "Welcome to AI Chief of Staff Platform", body: "We're excited to welcome all organizations to our platform. This newsletter covers the latest features including AI-powered agents, knowledge graph visualization, and resource management.\n\nKey highlights:\n- Multi-agent AI system for organizational intelligence\n- Real-time knowledge graph with food-web visualization\n- NotebookLM-style document research workspace\n- Team communication oversight and analytics", target_audience: "all", sent_by: userId, sent_count: 22, status: "sent" },
      { subject: "Pro Plan: Advanced AI Features Now Available", body: "Dear Pro subscribers,\n\nWe've rolled out several advanced features exclusive to Pro and Enterprise plans:\n\n1. Unlimited AI queries with source-grounded citations\n2. Advanced report generation (study guides, briefings, FAQs)\n3. Mind map visualization from document analysis\n4. Priority support and dedicated onboarding\n\nUpgrade your experience today!", target_audience: "pro", sent_by: userId, sent_count: 8, status: "sent" },
      { subject: "Platform Maintenance Window - Feb 28", body: "We will be performing scheduled maintenance on February 28, 2026 from 2:00 AM to 4:00 AM UTC.\n\nExpected impact:\n- Brief interruption to real-time features\n- AI agent processing may be delayed\n- All data will be preserved\n\nPlease plan accordingly.", target_audience: "all", sent_by: userId, sent_count: 15, status: "sent" },
    ];

    for (const nl of newsletters) {
      await supabase.from("admin_newsletters").insert(nl);
    }

    return new Response(
      JSON.stringify({ success: true, userId, message: "Super admin created with mock data" }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
