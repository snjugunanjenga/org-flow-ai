import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface DemoUser {
  email: string;
  fullName: string;
  role: "admin" | "manager" | "member";
  department: string;
  jobTitle: string;
}

const DEMO_ORG = { name: "Apple", slug: "appl" };

const DEMO_FOUNDER: DemoUser = {
  email: "steve.jobs@apple.com",
  fullName: "Steve Jobs",
  role: "admin",
  department: "Executive",
  jobTitle: "CEO & Founder",
};

const PLATFORM_ADMIN = {
  email: "admin@chiefofstaff.ai",
  fullName: "Platform Admin",
};

const DEMO_MEMBERS: DemoUser[] = [
  { email: "sarah.chen@apple.com", fullName: "Sarah Chen", role: "manager", department: "Engineering", jobTitle: "Engineering Lead" },
  { email: "marcus.johnson@apple.com", fullName: "Marcus Johnson", role: "manager", department: "Product", jobTitle: "Product Manager" },
  { email: "emily.rodriguez@apple.com", fullName: "Emily Rodriguez", role: "member", department: "Design", jobTitle: "Senior Designer" },
  { email: "david.kim@apple.com", fullName: "David Kim", role: "member", department: "Sales", jobTitle: "Sales Lead" },
  { email: "lisa.wang@apple.com", fullName: "Lisa Wang", role: "member", department: "Marketing", jobTitle: "Marketing Manager" },
  { email: "james.taylor@apple.com", fullName: "James Taylor", role: "member", department: "Legal", jobTitle: "General Counsel" },
  { email: "priya.patel@apple.com", fullName: "Priya Patel", role: "member", department: "HR", jobTitle: "HR Director" },
  { email: "alex.martinez@apple.com", fullName: "Alex Martinez", role: "member", department: "Operations", jobTitle: "Operations Manager" },
  { email: "rachel.green@apple.com", fullName: "Rachel Green", role: "member", department: "Engineering", jobTitle: "Software Engineer" },
];

const TEAMS = [
  { name: "Engineering", color: "#6366f1", description: "Software development and infrastructure" },
  { name: "Product", color: "#8b5cf6", description: "Product strategy and roadmap" },
  { name: "Design", color: "#ec4899", description: "UX/UI and brand design" },
  { name: "Sales", color: "#f59e0b", description: "Revenue and client relationships" },
  { name: "Marketing", color: "#10b981", description: "Growth and brand awareness" },
  { name: "Legal", color: "#6b7280", description: "Legal affairs and compliance" },
  { name: "HR", color: "#ef4444", description: "People operations and culture" },
  { name: "Operations", color: "#3b82f6", description: "Business operations and logistics" },
];

const PASSWORD = "pass123#";

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

    console.log("Starting demo data seed...");

    // Check if demo org already exists
    const { data: existingOrg } = await supabase
      .from("organizations")
      .select("id")
      .eq("slug", DEMO_ORG.slug)
      .maybeSingle();

    if (existingOrg) {
      console.log("Demo org already exists, skipping seed.");
      return new Response(
        JSON.stringify({ message: "Demo data already exists", org_id: existingOrg.id }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 1. Create platform admin
    console.log("Creating platform admin...");
    const { data: platformAdminAuth, error: paError } = await supabase.auth.admin.createUser({
      email: PLATFORM_ADMIN.email,
      password: PASSWORD,
      email_confirm: true,
      user_metadata: { full_name: PLATFORM_ADMIN.fullName },
    });
    if (paError && !paError.message.includes("already been registered")) {
      console.error("Platform admin error:", paError);
    }

    if (platformAdminAuth?.user) {
      // Give platform admin the admin role in user_roles
      await supabase.from("user_roles").insert({
        user_id: platformAdminAuth.user.id,
        role: "admin",
      });
      // Update profile
      await supabase.from("profiles").update({
        display_name: PLATFORM_ADMIN.fullName,
        department: "Platform",
        job_title: "Platform Administrator",
        onboarding_completed: true,
      }).eq("user_id", platformAdminAuth.user.id);
    }

    // 2. Create demo founder
    console.log("Creating demo founder:", DEMO_FOUNDER.email);
    const { data: founderAuth, error: fError } = await supabase.auth.admin.createUser({
      email: DEMO_FOUNDER.email,
      password: PASSWORD,
      email_confirm: true,
      user_metadata: { full_name: DEMO_FOUNDER.fullName },
    });
    if (fError) throw new Error(`Founder creation failed: ${fError.message}`);
    const founderId = founderAuth.user!.id;

    // Update founder profile
    await supabase.from("profiles").update({
      display_name: DEMO_FOUNDER.fullName,
      department: DEMO_FOUNDER.department,
      job_title: DEMO_FOUNDER.jobTitle,
      onboarding_completed: true,
    }).eq("user_id", founderId);

    // Give founder admin role in user_roles
    await supabase.from("user_roles").insert({ user_id: founderId, role: "admin" });

    // 3. Create demo organization
    console.log("Creating demo organization...");
    const { data: org, error: orgError } = await supabase
      .from("organizations")
      .insert({ name: DEMO_ORG.name, slug: DEMO_ORG.slug, created_by: founderId })
      .select()
      .single();
    if (orgError) throw new Error(`Org creation failed: ${orgError.message}`);
    const orgId = org.id;

    // Add founder as org admin
    await supabase.from("org_memberships").insert({
      org_id: orgId,
      user_id: founderId,
      role: "admin",
    });

    // 4. Create demo members
    const memberUserIds: Record<string, string> = {};
    for (const member of DEMO_MEMBERS) {
      console.log("Creating member:", member.email);
      const { data: memberAuth, error: mError } = await supabase.auth.admin.createUser({
        email: member.email,
        password: PASSWORD,
        email_confirm: true,
        user_metadata: { full_name: member.fullName },
      });
      if (mError) {
        console.error(`Member ${member.email} error:`, mError);
        continue;
      }
      const userId = memberAuth.user!.id;
      memberUserIds[member.email] = userId;

      // Update profile
      await supabase.from("profiles").update({
        display_name: member.fullName,
        department: member.department,
        job_title: member.jobTitle,
        onboarding_completed: true,
      }).eq("user_id", userId);

      // Add to org
      await supabase.from("org_memberships").insert({
        org_id: orgId,
        user_id: userId,
        role: member.role,
      });
    }

    // 5. Create teams
    console.log("Creating teams...");
    const teamIds: Record<string, string> = {};
    for (const team of TEAMS) {
      const { data: teamData, error: tError } = await supabase
        .from("teams")
        .insert({
          name: team.name,
          org_id: orgId,
          created_by: founderId,
          color: team.color,
          description: team.description,
        })
        .select()
        .single();
      if (tError) {
        console.error(`Team ${team.name} error:`, tError);
        continue;
      }
      teamIds[team.name] = teamData.id;
    }

    // 6. Assign members to teams
    console.log("Assigning team memberships...");
    const teamAssignments: Record<string, string[]> = {
      Engineering: ["sarah.chen@apple.com", "rachel.green@apple.com"],
      Product: ["marcus.johnson@apple.com"],
      Design: ["emily.rodriguez@apple.com"],
      Sales: ["david.kim@apple.com"],
      Marketing: ["lisa.wang@apple.com"],
      Legal: ["james.taylor@apple.com"],
      HR: ["priya.patel@apple.com"],
      Operations: ["alex.martinez@apple.com"],
    };

    for (const [teamName, emails] of Object.entries(teamAssignments)) {
      const teamId = teamIds[teamName];
      if (!teamId) continue;
      for (const email of emails) {
        const userId = memberUserIds[email];
        if (!userId) continue;
        await supabase.from("team_memberships").insert({
          team_id: teamId,
          org_id: orgId,
          user_id: userId,
          assigned_by: founderId,
        });
      }
    }

    // Also add founder to Engineering team
    if (teamIds["Engineering"]) {
      await supabase.from("team_memberships").insert({
        team_id: teamIds["Engineering"],
        org_id: orgId,
        user_id: founderId,
        assigned_by: founderId,
      });
    }

    console.log("Demo data seeded successfully!");
    return new Response(
      JSON.stringify({ success: true, org_id: orgId, message: "Demo data seeded successfully" }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Seed error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
