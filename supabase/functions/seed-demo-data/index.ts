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
  { email: "sarah.chen@apple.com", fullName: "Sarah Chen", role: "manager", department: "Engineering", jobTitle: "VP Engineering" },
  { email: "marcus.johnson@apple.com", fullName: "Marcus Johnson", role: "manager", department: "Product", jobTitle: "VP Product" },
  { email: "emily.rodriguez@apple.com", fullName: "Emily Rodriguez", role: "member", department: "Design", jobTitle: "Head of Design" },
  { email: "david.kim@apple.com", fullName: "David Kim", role: "member", department: "Sales", jobTitle: "VP Sales" },
  { email: "lisa.wang@apple.com", fullName: "Lisa Wang", role: "member", department: "Marketing", jobTitle: "VP Marketing" },
  { email: "james.taylor@apple.com", fullName: "James Taylor", role: "member", department: "Legal", jobTitle: "General Counsel" },
  { email: "priya.patel@apple.com", fullName: "Priya Patel", role: "member", department: "HR", jobTitle: "Chief People Officer" },
  { email: "alex.martinez@apple.com", fullName: "Alex Martinez", role: "member", department: "Operations", jobTitle: "VP Operations" },
  { email: "rachel.green@apple.com", fullName: "Rachel Green", role: "member", department: "Engineering", jobTitle: "Senior Software Engineer" },
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

    let orgId: string;
    let founderId: string;
    const memberUserIds: Record<string, string> = {};

    if (existingOrg) {
      console.log("Demo org exists, seeding additional data...");
      orgId = existingOrg.id;
      
      // Get founder
      const { data: founderMem } = await supabase
        .from("org_memberships")
        .select("user_id")
        .eq("org_id", orgId)
        .eq("role", "admin")
        .limit(1)
        .maybeSingle();
      founderId = founderMem?.user_id || "";

      // Get all member IDs
      const { data: allMembers } = await supabase
        .from("org_memberships")
        .select("user_id")
        .eq("org_id", orgId);
      
      if (allMembers) {
        // Fetch profiles to map emails
        const userIds = allMembers.map(m => m.user_id);
        const { data: profiles } = await supabase
          .from("profiles")
          .select("user_id, display_name")
          .in("user_id", userIds);
        
        // Map by name to email for lookup
        for (const member of DEMO_MEMBERS) {
          const p = profiles?.find(pr => pr.display_name === member.fullName);
          if (p) memberUserIds[member.email] = p.user_id;
        }
      }
    } else {
      // Full setup - create users, org, teams
      console.log("Creating platform admin...");
      const { data: platformAdminAuth, error: paError } = await supabase.auth.admin.createUser({
        email: PLATFORM_ADMIN.email, password: PASSWORD, email_confirm: true,
        user_metadata: { full_name: PLATFORM_ADMIN.fullName },
      });
      if (paError && !paError.message.includes("already been registered")) console.error("PA error:", paError);
      if (platformAdminAuth?.user) {
        await supabase.from("user_roles").insert({ user_id: platformAdminAuth.user.id, role: "admin" });
        await supabase.from("profiles").update({
          display_name: PLATFORM_ADMIN.fullName, department: "Platform",
          job_title: "Platform Administrator", onboarding_completed: true,
        }).eq("user_id", platformAdminAuth.user.id);
      }

      console.log("Creating founder:", DEMO_FOUNDER.email);
      const { data: founderAuth, error: fError } = await supabase.auth.admin.createUser({
        email: DEMO_FOUNDER.email, password: PASSWORD, email_confirm: true,
        user_metadata: { full_name: DEMO_FOUNDER.fullName },
      });
      if (fError) throw new Error(`Founder creation failed: ${fError.message}`);
      founderId = founderAuth.user!.id;
      await supabase.from("profiles").update({
        display_name: DEMO_FOUNDER.fullName, department: DEMO_FOUNDER.department,
        job_title: DEMO_FOUNDER.jobTitle, onboarding_completed: true,
      }).eq("user_id", founderId);
      await supabase.from("user_roles").insert({ user_id: founderId, role: "admin" });

      const { data: org, error: orgError } = await supabase
        .from("organizations")
        .insert({ name: DEMO_ORG.name, slug: DEMO_ORG.slug, created_by: founderId })
        .select().single();
      if (orgError) throw new Error(`Org creation failed: ${orgError.message}`);
      orgId = org.id;

      await supabase.from("org_memberships").insert({ org_id: orgId, user_id: founderId, role: "admin" });

      for (const member of DEMO_MEMBERS) {
        const { data: memberAuth, error: mError } = await supabase.auth.admin.createUser({
          email: member.email, password: PASSWORD, email_confirm: true,
          user_metadata: { full_name: member.fullName },
        });
        if (mError) { console.error(`Member ${member.email}:`, mError); continue; }
        const userId = memberAuth.user!.id;
        memberUserIds[member.email] = userId;
        await supabase.from("profiles").update({
          display_name: member.fullName, department: member.department,
          job_title: member.jobTitle, onboarding_completed: true,
        }).eq("user_id", userId);
        await supabase.from("org_memberships").insert({ org_id: orgId, user_id: userId, role: member.role });
      }

      // Create teams
      const teamIds: Record<string, string> = {};
      for (const team of TEAMS) {
        const { data: teamData } = await supabase.from("teams").insert({
          name: team.name, org_id: orgId, created_by: founderId, color: team.color, description: team.description,
        }).select().single();
        if (teamData) teamIds[team.name] = teamData.id;
      }

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
          await supabase.from("team_memberships").insert({ team_id: teamId, org_id: orgId, user_id: userId, assigned_by: founderId });
        }
      }
      if (teamIds["Engineering"]) {
        await supabase.from("team_memberships").insert({ team_id: teamIds["Engineering"], org_id: orgId, user_id: founderId, assigned_by: founderId });
      }
    }

    // ── Check if rich data already seeded ──
    const { data: existingMessages } = await supabase.from("messages").select("id").eq("org_id", orgId).limit(1);
    if (existingMessages && existingMessages.length > 0) {
      return new Response(JSON.stringify({ success: true, message: "Data already seeded", org_id: orgId }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log("Seeding messages, meetings, projects, topics, conflicts...");

    // ── MESSAGES ──
    const now = new Date();
    const daysAgo = (d: number) => new Date(now.getTime() - d * 86400000).toISOString();
    
    const messageData = [
      { org_id: orgId, source_type: "slack", sender_name: "Steve Jobs", channel: "#general", content: "Team, our mission has never been clearer. We're not just building products — we're crafting the future of how people interact with technology. The next 90 days will define the next decade.", created_at: daysAgo(30) },
      { org_id: orgId, source_type: "slack", sender_name: "Sarah Chen", channel: "#engineering", content: "Platform v2.0 architecture review complete. We're going with PostgreSQL for the relational layer. The performance benchmarks are 3x better than what we had. Migration plan is ready.", created_at: daysAgo(28) },
      { org_id: orgId, source_type: "slack", sender_name: "Marcus Johnson", channel: "#product", content: "Based on user research, I've updated the PRD to reference MongoDB for the document store. We need flexible schemas for the new content management features.", created_at: daysAgo(27) },
      { org_id: orgId, source_type: "email", sender_name: "Lisa Wang", subject: "Q1 Launch Campaign Timeline", recipients: ["Steve Jobs", "Marcus Johnson", "David Kim"], content: "Hi team, I've locked in the launch date for March 15th. All creative assets need to be finalized by March 1st. Media buys are confirmed. This is going to be insanely great.", created_at: daysAgo(25) },
      { org_id: orgId, source_type: "slack", sender_name: "Sarah Chen", channel: "#engineering", content: "Heads up — our sprint deadline is March 18th. We cannot ship the API before that. @Lisa can we discuss the launch timeline? There might be a conflict.", created_at: daysAgo(24) },
      { org_id: orgId, source_type: "slack", sender_name: "Emily Rodriguez", channel: "#design", content: "New design system components are ready for review. I've reimagined the entire interaction model. It's intuitive, beautiful, and feels like magic. Preview link in thread.", created_at: daysAgo(22) },
      { org_id: orgId, source_type: "slack", sender_name: "David Kim", channel: "#sales", content: "Enterprise pipeline is looking strong. 12 new Fortune 500 prospects this month. The product demo is converting at 40%. We need to talk about pricing strategy for the new tier.", created_at: daysAgo(20) },
      { org_id: orgId, source_type: "email", sender_name: "James Taylor", subject: "Compliance Audit - Immediate Attention Required", recipients: ["Steve Jobs", "Priya Patel"], content: "Steve, the SOC 2 Type II audit has been paused pending review of our data handling procedures. We need Legal and HR alignment on the new privacy framework before proceeding.", created_at: daysAgo(18) },
      { org_id: orgId, source_type: "slack", sender_name: "Priya Patel", channel: "#hr", content: "Employee engagement scores are in: 4.2/5 overall, up from 3.8 last quarter. Engineering and Design are highest. Sales team flagged workload concerns. Setting up skip-levels.", created_at: daysAgo(15) },
      { org_id: orgId, source_type: "slack", sender_name: "Alex Martinez", channel: "#operations", content: "Supply chain update: Component lead times have improved to 6 weeks from 10. New vendor qualification for the M3 chip packaging is on track. Cost reduction target of 15% is achievable.", created_at: daysAgo(14) },
      { org_id: orgId, source_type: "slack", sender_name: "Rachel Green", channel: "#engineering", content: "Finished the API gateway refactor. Latency is down 40%. The new caching layer is handling 10K req/s in staging. Ready for production deploy after review.", created_at: daysAgo(12) },
      { org_id: orgId, source_type: "slack", sender_name: "Marcus Johnson", channel: "#product", content: "Priority ranking update: 1) Platform v2.0, 2) Enterprise API, 3) Mobile redesign. This differs from last week's meeting where we had Mobile as #2. Aligning with Steve's vision.", created_at: daysAgo(10) },
      { org_id: orgId, source_type: "slack", sender_name: "Steve Jobs", channel: "#general", content: "I've been thinking about this all weekend. The intersection of technology and liberal arts is where we create magic. The new product experience needs to feel effortless — like it reads your mind.", created_at: daysAgo(8) },
      { org_id: orgId, source_type: "email", sender_name: "Sarah Chen", subject: "Platform v2.0 - Critical Path Update", recipients: ["Steve Jobs", "Marcus Johnson", "Rachel Green"], content: "We're at 60% completion. Database migration is done. API layer is 80%. Frontend integration starts next week. On track for April 1st internal beta.", created_at: daysAgo(5) },
      { org_id: orgId, source_type: "slack", sender_name: "Lisa Wang", channel: "#marketing", content: "Campaign creative A/B test results: the 'Think Different Again' messaging outperformed by 2.3x. Updating all assets. Social media strategy brief attached.", created_at: daysAgo(3) },
      { org_id: orgId, source_type: "slack", sender_name: "David Kim", channel: "#sales", content: "Closed the Accenture deal — $2.4M ARR. Biggest enterprise win this quarter. Their CTO specifically called out our AI capabilities as the differentiator.", created_at: daysAgo(2) },
      { org_id: orgId, source_type: "slack", sender_name: "Emily Rodriguez", channel: "#design", content: "Usability testing results for the new onboarding flow: task completion up 35%, time-to-value reduced from 12 minutes to 4. Users are describing it as 'delightful'.", created_at: daysAgo(1) },
    ];
    await supabase.from("messages").insert(messageData);

    // ── MEETING TRANSCRIPTS & SUMMARIES ──
    const meetings = [
      {
        title: "Weekly Leadership Sync",
        participants: ["Steve Jobs", "Sarah Chen", "Marcus Johnson", "Emily Rodriguez"],
        content: "Steve opened discussing the vision for Platform v2.0. Sarah provided engineering update — 60% complete, PostgreSQL migration successful. Marcus raised concerns about feature prioritization, suggesting mobile redesign should be elevated. Emily presented new design system. Steve emphasized simplicity above all. Decision: Platform v2.0 remains top priority. Action items: Sarah to finalize API by March 20, Emily to deliver design specs by March 10.",
        duration_minutes: 45,
        meeting_date: daysAgo(7),
        summary: "Leadership aligned on Platform v2.0 as top priority. Engineering at 60% completion. New design system approved. Mobile redesign deprioritized to Q2.",
        key_decisions: ["Platform v2.0 is top priority", "PostgreSQL confirmed as database", "Mobile redesign moved to Q2", "Design system v3 approved"],
        action_items: [{ assignee: "Sarah Chen", task: "Finalize API by March 20", due: "2026-03-20" }, { assignee: "Emily Rodriguez", task: "Deliver design specs", due: "2026-03-10" }],
        sentiment: "positive",
      },
      {
        title: "Product-Engineering Alignment",
        participants: ["Sarah Chen", "Marcus Johnson", "Rachel Green"],
        content: "Marcus presented updated PRD referencing MongoDB for document storage. Sarah pushed back strongly — engineering has standardized on PostgreSQL with JSONB columns. Rachel demonstrated JSONB performance is sufficient. Marcus agreed to revise PRD. Discussion on API versioning strategy. Decided on semantic versioning with backward compatibility guarantee.",
        duration_minutes: 60,
        meeting_date: daysAgo(14),
        summary: "Resolved database technology conflict. PostgreSQL with JSONB will be used instead of MongoDB. API versioning strategy agreed upon.",
        key_decisions: ["PostgreSQL JSONB over MongoDB", "Semantic API versioning adopted", "Backward compatibility guaranteed for 2 major versions"],
        action_items: [{ assignee: "Marcus Johnson", task: "Revise PRD to reference PostgreSQL", due: "2026-02-20" }],
        sentiment: "neutral",
      },
      {
        title: "Q1 Go-To-Market Review",
        participants: ["Steve Jobs", "Lisa Wang", "David Kim", "Marcus Johnson"],
        content: "Lisa presented March 15 launch timeline. David shared enterprise pipeline — 12 Fortune 500 prospects. Steve questioned whether the product will be ready by March 15 given engineering's March 18 sprint deadline. Lisa agreed to evaluate backup dates. David proposed a tiered pricing model. Steve wants pricing to feel premium but accessible. Decision: evaluate March 22 as alternative launch date.",
        duration_minutes: 50,
        meeting_date: daysAgo(20),
        summary: "Launch date conflict identified between Marketing (March 15) and Engineering (March 18). Evaluating March 22 as compromise. Enterprise pipeline strong with 12 F500 prospects.",
        key_decisions: ["Evaluate March 22 launch date", "Tiered pricing model approved in concept", "Enterprise demo to be updated with new features"],
        action_items: [{ assignee: "Lisa Wang", task: "Prepare March 22 launch plan", due: "2026-02-25" }, { assignee: "David Kim", task: "Finalize tiered pricing proposal", due: "2026-02-28" }],
        sentiment: "cautious",
      },
      {
        title: "Compliance & Legal Review",
        participants: ["James Taylor", "Priya Patel", "Steve Jobs"],
        content: "James reported SOC 2 Type II audit is paused. Data handling procedures need revision. Priya raised employee data privacy concerns under new regulations. Steve emphasized this cannot block the launch but must be resolved. Decision: form a cross-functional privacy taskforce. James to engage external counsel for accelerated review.",
        duration_minutes: 40,
        meeting_date: daysAgo(16),
        summary: "SOC 2 audit paused pending data handling review. Privacy taskforce to be formed. External counsel to be engaged for accelerated compliance.",
        key_decisions: ["Form cross-functional privacy taskforce", "Engage external counsel", "Compliance must not block product launch"],
        action_items: [{ assignee: "James Taylor", task: "Engage external counsel", due: "2026-02-15" }, { assignee: "Priya Patel", task: "Draft privacy framework", due: "2026-02-20" }],
        sentiment: "concerned",
      },
      {
        title: "Engineering Sprint Planning",
        participants: ["Sarah Chen", "Rachel Green"],
        content: "Sprint 14 review: 23 of 25 story points completed. API gateway refactor delivered 40% latency improvement. Sprint 15 planning: focus on Platform v2.0 frontend integration, auth system upgrade, and performance optimization. Rachel proposed implementing edge caching. Sarah approved with caveat on testing coverage.",
        duration_minutes: 35,
        meeting_date: daysAgo(5),
        summary: "Sprint 14 delivered 92% completion rate. API latency improved 40%. Sprint 15 focuses on frontend integration and edge caching implementation.",
        key_decisions: ["Edge caching approved", "Auth system upgrade prioritized", "90% test coverage required for new features"],
        action_items: [{ assignee: "Rachel Green", task: "Implement edge caching POC", due: "2026-03-05" }],
        sentiment: "positive",
      },
    ];

    for (const m of meetings) {
      const { data: transcript } = await supabase.from("meeting_transcripts").insert({
        org_id: orgId, title: m.title, participants: m.participants,
        content: m.content, duration_minutes: m.duration_minutes, meeting_date: m.meeting_date,
      }).select().single();
      
      if (transcript) {
        await supabase.from("meeting_summaries").insert({
          org_id: orgId, transcript_id: transcript.id, title: m.title,
          summary: m.summary, key_decisions: m.key_decisions,
          action_items: m.action_items, sentiment: m.sentiment,
        });
      }
    }

    // ── TOPICS & DECISIONS ──
    const topicsData = [
      { org_id: orgId, title: "PostgreSQL as primary database", description: "Engineering standardized on PostgreSQL for all relational data. JSONB columns for document-like flexibility.", category: "decision", status: "active", priority: "high", owner_name: "Sarah Chen", source_type: "meeting", created_at: daysAgo(28) },
      { org_id: orgId, title: "Platform v2.0 Architecture", description: "Microservices architecture with API gateway, edge caching, and PostgreSQL backend.", category: "decision", status: "active", priority: "critical", owner_name: "Sarah Chen", source_type: "meeting", created_at: daysAgo(25) },
      { org_id: orgId, title: "Q1 Product Launch Date", description: "Target launch date under review. Marketing proposed March 15, Engineering sprint ends March 18. Evaluating March 22.", category: "decision", status: "in_review", priority: "high", owner_name: "Lisa Wang", source_type: "meeting", created_at: daysAgo(20) },
      { org_id: orgId, title: "Design System v3", description: "Complete redesign of component library. Approved by Steve. Focus on simplicity, delight, and accessibility.", category: "decision", status: "active", priority: "high", owner_name: "Emily Rodriguez", source_type: "meeting", created_at: daysAgo(15) },
      { org_id: orgId, title: "Enterprise Pricing Strategy", description: "Tiered pricing model: Starter, Pro, Enterprise. Premium positioning with accessible entry point.", category: "decision", status: "in_review", priority: "high", owner_name: "David Kim", source_type: "meeting", created_at: daysAgo(12) },
      { org_id: orgId, title: "SOC 2 Type II Compliance", description: "Audit paused. Privacy taskforce formed. External counsel engaged for accelerated review.", category: "topic", status: "blocked", priority: "critical", owner_name: "James Taylor", source_type: "meeting", created_at: daysAgo(16) },
      { org_id: orgId, title: "Mobile Redesign", description: "Deprioritized to Q2 per leadership decision. Platform v2.0 takes precedence.", category: "decision", status: "deferred", priority: "medium", owner_name: "Marcus Johnson", source_type: "meeting", created_at: daysAgo(10) },
      { org_id: orgId, title: "Edge Caching Strategy", description: "Rachel proposed edge caching for API responses. Approved with 90% test coverage requirement.", category: "decision", status: "active", priority: "medium", owner_name: "Rachel Green", source_type: "meeting", created_at: daysAgo(5) },
      { org_id: orgId, title: "Employee Engagement Initiative", description: "Scores improved to 4.2/5. Sales team workload concerns flagged. Skip-level meetings scheduled.", category: "topic", status: "active", priority: "medium", owner_name: "Priya Patel", source_type: "slack", created_at: daysAgo(15) },
      { org_id: orgId, title: "Supply Chain Optimization", description: "Lead times improved from 10 to 6 weeks. 15% cost reduction target achievable with new vendor.", category: "topic", status: "active", priority: "medium", owner_name: "Alex Martinez", source_type: "slack", created_at: daysAgo(14) },
      { org_id: orgId, title: "API Versioning Standard", description: "Semantic versioning with backward compatibility for 2 major versions.", category: "decision", status: "active", priority: "medium", owner_name: "Sarah Chen", source_type: "meeting", created_at: daysAgo(14) },
      { org_id: orgId, title: "'Think Different Again' Campaign", description: "A/B test showed 2.3x performance lift. All creative assets being updated to this messaging.", category: "decision", status: "active", priority: "high", owner_name: "Lisa Wang", source_type: "slack", created_at: daysAgo(3) },
    ];
    await supabase.from("topics").insert(topicsData);

    // ── CONFLICTS ──
    const conflictsData = [
      { org_id: orgId, title: "Database Technology Mismatch", description: "Engineering decided on PostgreSQL; Product PRD references MongoDB for document storage. Creates architectural confusion and potential rework.", severity: "high", status: "resolved", parties: ["Engineering", "Product"], resolution: "Resolved: PostgreSQL with JSONB columns will be used. PRD updated.", detected_by: "critic_agent", created_at: daysAgo(14), resolved_at: daysAgo(12) },
      { org_id: orgId, title: "Launch Date vs Sprint Deadline Conflict", description: "Marketing locked March 15 launch date. Engineering sprint ends March 18. Product cannot be demo-ready 3 days before engineering completes.", severity: "critical", status: "open", parties: ["Marketing", "Engineering"], detected_by: "critic_agent", created_at: daysAgo(20) },
      { org_id: orgId, title: "Priority Ranking Contradiction", description: "Two meeting summaries show contradictory priority rankings. Leadership sync has Mobile as deprioritized, but Product channel shows it as #2 priority.", severity: "medium", status: "open", parties: ["Product", "Leadership"], detected_by: "critic_agent", created_at: daysAgo(8) },
      { org_id: orgId, title: "Compliance Blocking Launch", description: "Steve stated compliance must not block product launch, but SOC 2 audit is paused and enterprise customers require certification. Contradictory directives.", severity: "high", status: "open", parties: ["Legal", "Executive"], detected_by: "critic_agent", created_at: daysAgo(10) },
      { org_id: orgId, title: "Sales Workload vs Engagement Targets", description: "HR engagement scores flag Sales team workload concerns, but pipeline targets have increased 30%. Unsustainable trajectory identified.", severity: "medium", status: "open", parties: ["Sales", "HR"], detected_by: "critic_agent", created_at: daysAgo(7) },
    ];
    await supabase.from("conflicts").insert(conflictsData);

    // ── PROJECTS ──
    const projectsData = [
      { org_id: orgId, name: "Platform v2.0 Migration", description: "Complete platform rewrite with new architecture, PostgreSQL backend, and redesigned API layer.", status: "active", progress: 60, owner_name: "Sarah Chen", team_name: "Engineering", start_date: "2025-11-01", target_date: "2026-04-01" },
      { org_id: orgId, name: "Q1 Product Launch", description: "Go-to-market campaign for Platform v2.0. Includes media buys, enterprise demos, and 'Think Different Again' messaging.", status: "active", progress: 40, owner_name: "Lisa Wang", team_name: "Marketing", start_date: "2026-01-15", target_date: "2026-03-22" },
      { org_id: orgId, name: "SOC 2 Compliance Audit", description: "SOC 2 Type II certification. Currently paused pending data handling procedure review and privacy framework.", status: "on_hold", progress: 25, owner_name: "James Taylor", team_name: "Legal", start_date: "2025-12-01", target_date: "2026-06-01" },
      { org_id: orgId, name: "Customer Onboarding Redesign", description: "Redesigned onboarding flow reducing time-to-value from 12 to 4 minutes. Usability testing complete.", status: "completed", progress: 100, owner_name: "Emily Rodriguez", team_name: "Design", start_date: "2025-10-01", target_date: "2026-01-31" },
    ];
    
    for (const p of projectsData) {
      const { data: project } = await supabase.from("projects").insert(p).select().single();
      if (!project) continue;
      const pid = project.id;

      // Milestones & tasks per project
      if (p.name === "Platform v2.0 Migration") {
        const { data: m1 } = await supabase.from("project_milestones").insert({ project_id: pid, org_id: orgId, name: "Database Migration", target_date: "2026-01-15", status: "completed" }).select().single();
        const { data: m2 } = await supabase.from("project_milestones").insert({ project_id: pid, org_id: orgId, name: "API Layer Complete", target_date: "2026-03-20", status: "in_progress" }).select().single();
        const { data: m3 } = await supabase.from("project_milestones").insert({ project_id: pid, org_id: orgId, name: "Internal Beta Launch", target_date: "2026-04-01", status: "pending" }).select().single();
        
        await supabase.from("project_tasks").insert([
          { project_id: pid, milestone_id: m1?.id, org_id: orgId, title: "Schema design & review", assignee_name: "Sarah Chen", status: "done", priority: "high" },
          { project_id: pid, milestone_id: m1?.id, org_id: orgId, title: "Data migration scripts", assignee_name: "Rachel Green", status: "done", priority: "high" },
          { project_id: pid, milestone_id: m2?.id, org_id: orgId, title: "API gateway refactor", assignee_name: "Rachel Green", status: "done", priority: "high" },
          { project_id: pid, milestone_id: m2?.id, org_id: orgId, title: "Auth system upgrade", assignee_name: "Sarah Chen", status: "in_progress", priority: "high" },
          { project_id: pid, milestone_id: m2?.id, org_id: orgId, title: "Edge caching implementation", assignee_name: "Rachel Green", status: "todo", priority: "medium" },
          { project_id: pid, milestone_id: m3?.id, org_id: orgId, title: "Frontend integration", assignee_name: "Emily Rodriguez", status: "todo", priority: "high" },
          { project_id: pid, milestone_id: m3?.id, org_id: orgId, title: "Performance testing", assignee_name: "Sarah Chen", status: "todo", priority: "medium" },
        ]);

        await supabase.from("project_updates").insert([
          { project_id: pid, org_id: orgId, content: "Database migration completed successfully. PostgreSQL performance benchmarks show 3x improvement. Zero data loss.", created_at: daysAgo(20) },
          { project_id: pid, org_id: orgId, content: "API gateway refactor delivered 40% latency reduction. 10K req/s sustained in staging environment.", created_at: daysAgo(12) },
          { project_id: pid, org_id: orgId, content: "Sprint 14 completed at 92% velocity. Auth system upgrade in progress. On track for April 1st internal beta.", created_at: daysAgo(5) },
        ]);
      }

      if (p.name === "Q1 Product Launch") {
        await supabase.from("project_milestones").insert([
          { project_id: pid, org_id: orgId, name: "Creative Assets Finalized", target_date: "2026-03-01", status: "in_progress" },
          { project_id: pid, org_id: orgId, name: "Media Buys Confirmed", target_date: "2026-03-10", status: "completed" },
          { project_id: pid, org_id: orgId, name: "Launch Day", target_date: "2026-03-22", status: "pending" },
        ]);

        await supabase.from("project_updates").insert([
          { project_id: pid, org_id: orgId, content: "'Think Different Again' A/B test shows 2.3x performance. Campaign messaging locked in.", created_at: daysAgo(3) },
          { project_id: pid, org_id: orgId, content: "Launch date adjusted to March 22 to align with Engineering sprint completion.", created_at: daysAgo(15) },
        ]);
      }
    }

    // ── NOTIFICATIONS (for founder) ──
    if (founderId) {
      const notifs = [
        { org_id: orgId, user_id: founderId, title: "Critical Conflict Detected", body: "Launch date (March 15) conflicts with Engineering sprint deadline (March 18). Immediate attention required.", type: "warning", reasoning: "Critic Agent detected timeline misalignment between Marketing and Engineering deliverables.", source_agent: "critic", created_at: daysAgo(20) },
        { org_id: orgId, user_id: founderId, title: "Database Decision Resolved", body: "PostgreSQL vs MongoDB conflict has been resolved. Engineering and Product aligned on PostgreSQL with JSONB.", type: "success", reasoning: "Conflict resolution confirmed in Product-Engineering meeting.", source_agent: "critic", read: true, created_at: daysAgo(12) },
        { org_id: orgId, user_id: founderId, title: "Enterprise Deal Closed", body: "Accenture deal closed at $2.4M ARR. Largest enterprise win this quarter.", type: "info", reasoning: "Router Agent identified this as high-priority notification for executive visibility.", source_agent: "router", created_at: daysAgo(2) },
        { org_id: orgId, user_id: founderId, title: "Compliance Risk", body: "SOC 2 audit paused. Enterprise customers require certification before procurement. This may impact Q2 pipeline.", type: "warning", reasoning: "Critic Agent flagged contradiction between launch timeline and compliance requirements.", source_agent: "critic", created_at: daysAgo(10) },
        { org_id: orgId, user_id: founderId, title: "Employee Engagement Improved", body: "Overall engagement score improved to 4.2/5 (up from 3.8). Sales team workload concerns flagged for attention.", type: "info", reasoning: "Router Agent surfaced HR report as relevant to executive decision-making.", source_agent: "router", created_at: daysAgo(15) },
        { org_id: orgId, user_id: founderId, title: "Sprint 14 Velocity Report", body: "Engineering completed 92% of planned story points. API latency improved 40%. Team is performing above historical average.", type: "info", reasoning: "Memory Agent compiled engineering performance metrics.", source_agent: "memory", read: true, created_at: daysAgo(5) },
      ];
      await supabase.from("notifications").insert(notifs);

      // Also add notifications for some team members
      for (const [email, userId] of Object.entries(memberUserIds)) {
        if (email === "sarah.chen@apple.com") {
          await supabase.from("notifications").insert([
            { org_id: orgId, user_id: userId, title: "Database Conflict Flagged", body: "Product PRD references MongoDB but Engineering standardized on PostgreSQL. Review needed.", type: "warning", source_agent: "critic", created_at: daysAgo(14) },
            { org_id: orgId, user_id: userId, title: "Sprint 15 Planning Ready", body: "Sprint 14 retrospective complete. Sprint 15 backlog has been prioritized.", type: "info", source_agent: "coordinator", created_at: daysAgo(4) },
          ]);
        }
        if (email === "marcus.johnson@apple.com") {
          await supabase.from("notifications").insert([
            { org_id: orgId, user_id: userId, title: "PRD Update Required", body: "Database technology decision finalized as PostgreSQL. Product PRD needs revision.", type: "warning", source_agent: "critic", created_at: daysAgo(12) },
          ]);
        }
      }
    }

    // ── AGENT LOGS ──
    const agentLogs = [
      { org_id: orgId, agent_type: "memory", action: "extract_entities", input_summary: "Processed 17 messages across #general, #engineering, #product channels", output_summary: "Extracted 24 entities: 10 people, 6 topics, 5 decisions, 3 projects", reasoning: "NLP pipeline identified key organizational entities. Confidence: 94%", duration_ms: 1200, created_at: daysAgo(1) },
      { org_id: orgId, agent_type: "critic", action: "detect_conflicts", input_summary: "Analyzed 12 decisions and 5 meeting summaries", output_summary: "Detected 5 conflicts: 1 critical, 2 high, 2 medium severity", reasoning: "Cross-referenced decision timestamps and ownership. Found contradictory database choices and timeline misalignments.", duration_ms: 2400, created_at: daysAgo(1) },
      { org_id: orgId, agent_type: "router", action: "route_notifications", input_summary: "6 new notifications generated from conflict detection and decision tracking", output_summary: "Routed to 4 stakeholders based on role and relevance scoring", reasoning: "Used org membership roles and topic ownership to determine routing. Priority scoring based on severity and recency.", duration_ms: 800, created_at: daysAgo(1) },
      { org_id: orgId, agent_type: "coordinator", action: "generate_summary", input_summary: "Weekly activity across all channels and meetings", output_summary: "Generated executive brief covering 5 key topics, 3 active conflicts, and 4 project status updates", reasoning: "Synthesized inputs from Memory, Critic, and Router agents. Prioritized by executive relevance.", duration_ms: 3200, created_at: daysAgo(1) },
      { org_id: orgId, agent_type: "memory", action: "update_knowledge_graph", input_summary: "5 meeting summaries with 15 decisions", output_summary: "Created 32 graph edges connecting people, topics, and decisions", reasoning: "Mapped participant-to-decision relationships and topic hierarchies.", duration_ms: 1800, created_at: daysAgo(2) },
      { org_id: orgId, agent_type: "critic", action: "version_check", input_summary: "Compared decision versions across 3 weeks", output_summary: "Flagged 2 decisions with conflicting version histories", reasoning: "Priority ranking changed without explicit team alignment. Flagged for review.", duration_ms: 1100, created_at: daysAgo(3) },
    ];
    await supabase.from("agent_logs").insert(agentLogs);

    // ── GRAPH EDGES ──
    const graphEdges = [
      { org_id: orgId, source_type: "person", source_label: "Steve Jobs", target_type: "project", target_label: "Platform v2.0", relationship: "SPONSORS", weight: 1.0 },
      { org_id: orgId, source_type: "person", source_label: "Sarah Chen", target_type: "project", target_label: "Platform v2.0", relationship: "LEADS", weight: 1.0 },
      { org_id: orgId, source_type: "person", source_label: "Rachel Green", target_type: "project", target_label: "Platform v2.0", relationship: "WORKS_ON", weight: 0.9 },
      { org_id: orgId, source_type: "person", source_label: "Lisa Wang", target_type: "project", target_label: "Q1 Product Launch", relationship: "LEADS", weight: 1.0 },
      { org_id: orgId, source_type: "person", source_label: "Emily Rodriguez", target_type: "decision", target_label: "Design System v3", relationship: "DECIDED_ON", weight: 1.0 },
      { org_id: orgId, source_type: "person", source_label: "Marcus Johnson", target_type: "topic", target_label: "Mobile Redesign", relationship: "ADVOCATES", weight: 0.8 },
      { org_id: orgId, source_type: "person", source_label: "James Taylor", target_type: "project", target_label: "SOC 2 Compliance", relationship: "LEADS", weight: 1.0 },
      { org_id: orgId, source_type: "person", source_label: "David Kim", target_type: "decision", target_label: "Enterprise Pricing", relationship: "DECIDED_ON", weight: 0.9 },
      { org_id: orgId, source_type: "decision", source_label: "PostgreSQL", target_type: "project", target_label: "Platform v2.0", relationship: "IMPACTS", weight: 1.0 },
      { org_id: orgId, source_type: "topic", source_label: "Launch Date", target_type: "project", target_label: "Q1 Product Launch", relationship: "BLOCKS", weight: 0.9 },
      { org_id: orgId, source_type: "person", source_label: "Sarah Chen", target_type: "person", target_label: "Rachel Green", relationship: "COLLABORATES_WITH", weight: 0.95 },
      { org_id: orgId, source_type: "person", source_label: "Steve Jobs", target_type: "person", target_label: "Sarah Chen", relationship: "COMMUNICATES_WITH", weight: 0.9 },
      { org_id: orgId, source_type: "person", source_label: "Steve Jobs", target_type: "person", target_label: "Marcus Johnson", relationship: "COMMUNICATES_WITH", weight: 0.85 },
      { org_id: orgId, source_type: "person", source_label: "Lisa Wang", target_type: "person", target_label: "David Kim", relationship: "COLLABORATES_WITH", weight: 0.8 },
      { org_id: orgId, source_type: "meeting", source_label: "Leadership Sync", target_type: "decision", target_label: "Platform v2.0 Priority", relationship: "PRODUCED", weight: 1.0 },
      { org_id: orgId, source_type: "meeting", source_label: "GTM Review", target_type: "topic", target_label: "Launch Date", relationship: "DISCUSSED", weight: 1.0 },
      { org_id: orgId, source_type: "person", source_label: "Priya Patel", target_type: "topic", target_label: "Employee Engagement", relationship: "OWNS", weight: 1.0 },
      { org_id: orgId, source_type: "person", source_label: "Alex Martinez", target_type: "topic", target_label: "Supply Chain", relationship: "OWNS", weight: 1.0 },
    ];
    await supabase.from("graph_edges").insert(graphEdges);

    // ── COMMUNICATION LOGS ──
    const commLogs = [
      { org_id: orgId, team_name: "Engineering", period: "weekly", messages_count: 142, avg_response_time_mins: 8.5, sentiment_score: 0.82, collaboration_score: 0.91 },
      { org_id: orgId, team_name: "Product", period: "weekly", messages_count: 87, avg_response_time_mins: 15.2, sentiment_score: 0.71, collaboration_score: 0.78 },
      { org_id: orgId, team_name: "Design", period: "weekly", messages_count: 64, avg_response_time_mins: 12.0, sentiment_score: 0.88, collaboration_score: 0.85 },
      { org_id: orgId, team_name: "Sales", period: "weekly", messages_count: 198, avg_response_time_mins: 5.3, sentiment_score: 0.65, collaboration_score: 0.72 },
      { org_id: orgId, team_name: "Marketing", period: "weekly", messages_count: 95, avg_response_time_mins: 11.7, sentiment_score: 0.79, collaboration_score: 0.83 },
      { org_id: orgId, team_name: "Legal", period: "weekly", messages_count: 32, avg_response_time_mins: 24.5, sentiment_score: 0.58, collaboration_score: 0.62 },
      { org_id: orgId, team_name: "HR", period: "weekly", messages_count: 45, avg_response_time_mins: 18.0, sentiment_score: 0.84, collaboration_score: 0.76 },
      { org_id: orgId, team_name: "Operations", period: "weekly", messages_count: 56, avg_response_time_mins: 14.3, sentiment_score: 0.75, collaboration_score: 0.80 },
    ];
    await supabase.from("communication_logs").insert(commLogs);

    console.log("Full demo data seeded successfully!");
    return new Response(
      JSON.stringify({ success: true, org_id: orgId, message: "Complete demo data seeded" }),
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
