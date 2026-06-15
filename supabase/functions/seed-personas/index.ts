// Seeds three demo organizations for the USAII Brief 3 submission:
//   1. Stanford CS Cohort   — student / IC persona  (plan: free trialing)
//   2. Northwind Product    — cross-team PM persona (plan: pro)
//   3. Lumen Robotics       — founder / leader      (plan: enterprise)
// Idempotent: re-running upserts users, org, memberships, teams, and
// only inserts rich data when the org has no messages yet.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const PASSWORD = "Demo!2026";

type Member = { email: string; name: string; role: "admin" | "manager" | "member"; dept: string; title: string };

type PersonaSpec = {
  slug: string;
  name: string;
  plan: "free" | "pro" | "enterprise";
  status: "trialing" | "active";
  admin: Member;
  members: Member[];
  teams: { name: string; color: string; description: string }[];
  seed: (ctx: SeedCtx) => Promise<void>;
};

type SeedCtx = {
  supabase: ReturnType<typeof createClient>;
  orgId: string;
  adminUserId: string;
  memberIds: Record<string, string>;
  daysAgo: (n: number) => string;
};

const now = () => new Date();
const daysAgo = (d: number) => new Date(Date.now() - d * 86400000).toISOString();

// ── Shared: daily Coordinator voice briefings + cross-team DMs ──────────────
async function seedDailyVoiceAndMessages(ctx: SeedCtx, personaName: string) {
  const { supabase, orgId, adminUserId, memberIds } = ctx;

  const briefings: Record<string, { agent: string; title: string; body: string; type: string }[]> = {
    "Apple": [
      { agent: "coordinator", title: "Morning brief — Vision Pro 2 launch", body: "Hardware team locked Vision Pro 2 chassis. Marketing keynote draft ready for your review. Two open conflicts: pricing tier and EU launch date.", type: "info" },
      { agent: "critic", title: "Conflict: pricing vs margin", body: "Marketing wants $2,999 entry; Finance modeled $3,499 minimum for 38% margin. Needs your call before keynote.", type: "warning" },
      { agent: "router", title: "Jony Ive flagged glass thickness", body: "Routed to Hardware + Software Materials. Cross-team review scheduled for Thursday.", type: "info" },
      { agent: "memory", title: "Captured: Q3 product council", body: "12 decisions, 4 risks, 3 dependencies — versioned and linked to Vision Pro 2 and macOS programs.", type: "success" },
      { agent: "coordinator", title: "Daily brief — Tuesday", body: "Vision Pro 2 on track. macOS 27 RC1 build green. Risk: EU regulatory delay on USB-C ports. Recommend Legal sync today.", type: "info" },
      { agent: "critic", title: "Stale decision: App Store policy", body: "Decision on third-party payment fees has not moved in 11 days. EU compliance window closing.", type: "warning" },
      { agent: "coordinator", title: "Weekly recap", body: "5 product launches tracking, 1 keynote in 14 days, 2 conflicts resolved, 1 still open. Top of mind: pricing.", type: "success" },
    ],
    "Stanford CS Cohort": [
      { agent: "coordinator", title: "Morning brief — Monday", body: "Good morning. Your highest-leverage tasks today: finish PSet 4 problem 3, then read Sculley et al. Section 4. Your advisor expects the methodology revision by Wednesday.", type: "info" },
      { agent: "critic", title: "Conflict in your calendar", body: "Your CS329S lab overlaps with your thesis advisor 1:1 on Thursday at 3pm. One must move.", type: "warning" },
      { agent: "router", title: "Jordan tagged you in lab notes", body: "Your labmate posted SAE ablation results — relevant to your thesis chapter 3.", type: "info" },
      { agent: "memory", title: "Knowledge captured: 3 new sources", body: "Added 3 lecture PDFs and 1 paper to your ML Systems notebook.", type: "success" },
      { agent: "coordinator", title: "Daily brief — Tuesday", body: "Pset progress: 60%. Thesis ablation queued for tonight. Interview prep slipping — schedule a mock for this weekend.", type: "info" },
      { agent: "critic", title: "Stale action item", body: "‘Update résumé with thesis results’ has not moved in 8 days.", type: "warning" },
      { agent: "coordinator", title: "Weekly recap", body: "This week you closed 4 of 6 high-priority items. Top blocker: SAE training compute. Next week focus: thesis intro draft.", type: "success" },
    ],
    "Northwind Product": [
      { agent: "coordinator", title: "Morning brief — Checkout slip", body: "Checkout v3 is slipping 2 weeks. Finance should know before Friday's pricing review. I drafted a summary in #leadership for your approval.", type: "warning" },
      { agent: "critic", title: "Decision conflict detected", body: "Engineering picked BigQuery; Finance flagged 18% cost overrun. Two contradictory decisions live in the graph.", type: "warning" },
      { agent: "router", title: "Legal needs to see onboarding copy", body: "Design's friendly copy lacks compliance disclaimers. I routed the doc to Legal.", type: "info" },
      { agent: "coordinator", title: "Daily brief — Tuesday", body: "5 cross-team threads need your input today. Top: GA4 rollout window collision with checkout launch. Recommend pushing GA4 by 1 week.", type: "info" },
      { agent: "memory", title: "Captured 8 decisions from Monday's exec sync", body: "Versioned and linked to 3 active projects.", type: "success" },
      { agent: "critic", title: "Headcount vs hiring freeze", body: "Two open senior eng reqs but Finance flagged a Q3 freeze rumor. Needs CEO clarification.", type: "warning" },
      { agent: "coordinator", title: "Weekly recap", body: "3 decisions made, 2 conflicts resolved, 1 still open. Velocity on Checkout v3 down 15% week over week.", type: "info" },
    ],
    "Lumen Robotics": [
      { agent: "coordinator", title: "Morning brief — FCC risk", body: "FCC certification is your single biggest risk this week. The consultant starts Monday but paperwork is 3 weeks behind. Recommend daily standup with Hugo until cleared.", type: "warning" },
      { agent: "critic", title: "Pilot deploy vs firmware freeze", body: "Pilot deploy is scheduled 2 weeks BEFORE firmware v4.0 code freeze. One of these dates must move.", type: "warning" },
      { agent: "router", title: "Series B — lead investor needs decision", body: "Lead investor expects your decision by July 30. I drafted a comparative term sheet summary in your Notes.", type: "info" },
      { agent: "memory", title: "Knowledge captured: 5 meetings, 12 decisions", body: "Monday exec sync, firmware review, pilot standup, Series B pipeline, supply chain risk — all versioned.", type: "success" },
      { agent: "coordinator", title: "Daily brief — Tuesday", body: "Atlas-1 prototype demo on track for Thursday. Supply chain dual-source complete. Single risk: FCC. Recommend founder attention today.", type: "info" },
      { agent: "critic", title: "Customer C slipping", body: "Pilot customer C is at risk of slipping to October. Owen needs to confirm by Friday.", type: "warning" },
      { agent: "coordinator", title: "Weekly recap", body: "Atlas-1 +12%, Firmware on track, Pilot 2/3 on track, Series B 3 term sheets, FCC AT RISK. Investor update draft ready for your review.", type: "success" },
    ],
  };

  const list = briefings[personaName] || briefings["Lumen Robotics"];
  // Insert one per day for the last 7 days, voice-enabled
  for (let i = 0; i < list.length; i++) {
    const b = list[i];
    await supabase.from("notifications").insert({
      org_id: orgId, user_id: adminUserId,
      title: b.title, body: b.body, type: b.type,
      source_agent: b.agent, agent_type: b.agent,
      voice_enabled: true,
      reasoning: `${b.agent} agent synthesized this from the latest org signals.`,
      created_at: daysAgo(list.length - 1 - i),
      read: i < list.length - 2, // last 2 unread
    });
  }

  // Rich DMs between admin and each member
  const memberArr = Object.entries(memberIds);
  const dmTemplates = [
    "Heads up — the AI just flagged a conflict in our roadmap. Got 5 min?",
    "Coordinator drafted a summary for the exec sync. Want me to send it?",
    "Quick sync on the FCC paperwork tomorrow?",
    "Loved your update — I'll route it to the rest of the leadership team.",
    "Critic agent flagged a stale decision. Can you take a look?",
    "Daily brief landed in my inbox — looks like we're on track 👍",
  ];
  for (const [, mid] of memberArr) {
    for (let i = 0; i < 3; i++) {
      const fromAdmin = i % 2 === 0;
      await supabase.from("direct_messages").insert({
        org_id: orgId,
        sender_id: fromAdmin ? adminUserId : mid,
        recipient_id: fromAdmin ? mid : adminUserId,
        content: dmTemplates[(i + memberArr.length) % dmTemplates.length],
        created_at: daysAgo(6 - i * 2),
      });
    }
  }

  // Channel messages already richer for Northwind; add a few for the other personas
  if (personaName !== "Northwind Product") {
    const channelMap: Record<string, string[]> = {
      "Lumen Robotics": ["#exec", "#hardware", "#firmware", "#ops"],
      "Apple": ["#keynote", "#hardware", "#software", "#marketing", "#design"],
      "Stanford CS Cohort": ["#coursework", "#research", "#career"],
    };
    const senderMap: Record<string, string[]> = {
      "Lumen Robotics": ["Founder Demo", "Hugo Hardware", "Farah Firmware", "Owen Ops"],
      "Apple": ["Steve Jobs", "Tim Cook", "Jony Ive", "Craig Federighi", "Phil Schiller"],
      "Stanford CS Cohort": ["Alex Student", "Dr. Riya Patel", "Jordan Kim"],
    };
    const channels = channelMap[personaName] ?? channelMap["Lumen Robotics"];
    const senderNames = senderMap[personaName] ?? senderMap["Lumen Robotics"];
    for (let i = 0; i < 18; i++) {
      await supabase.from("messages").insert({
        org_id: orgId, source_type: "slack",
        sender_name: senderNames[i % senderNames.length],
        channel: channels[i % channels.length],
        content: `Update #${i + 1} — ${personaName} status sync.`,
        created_at: daysAgo(20 - i),
      });
    }
  }
}

// ── Persona 1: Stanford CS Cohort ────────────────────────────────────────────
async function seedStanford(ctx: SeedCtx) {
  const { supabase, orgId, adminUserId } = ctx;

  const notebooks = [
    { title: "Algorithms — CS161", description: "Course notes, problem sets, and exam prep." },
    { title: "ML Systems — CS329S", description: "Production ML papers and lab notes." },
    { title: "Senior Thesis", description: "Sparse autoencoders for LLM interpretability." },
    { title: "Interview Prep", description: "Coding patterns, system design, behavioral stories." },
  ];
  const notebookIds: string[] = [];
  for (const nb of notebooks) {
    const { data } = await supabase.from("resource_notebooks").insert({
      org_id: orgId, title: nb.title, description: nb.description, created_by: adminUserId,
    }).select("id").single();
    if (data) notebookIds.push(data.id);
  }

  const sources = [
    { nb: 0, type: "pdf", title: "Lecture 7 — Dynamic Programming", content: "Bellman's principle of optimality and longest common subsequence derivation." },
    { nb: 0, type: "url", title: "CLRS Chapter 15 notes", content: "Memoization vs tabulation comparison with runtime analysis." },
    { nb: 0, type: "pdf", title: "Problem Set 4 solutions", content: "Knapsack, edit distance, matrix chain multiplication." },
    { nb: 1, type: "pdf", title: "Hidden Technical Debt in ML Systems", content: "Sculley et al. NeurIPS 2015 — feedback loops, glue code, configuration debt." },
    { nb: 1, type: "url", title: "MLOps maturity model", content: "Google's three-level maturity model for production ML pipelines." },
    { nb: 1, type: "pdf", title: "Lab 3: feature store design", content: "Offline/online consistency and point-in-time correctness." },
    { nb: 2, type: "pdf", title: "Sparse Autoencoders for Interpretability — Anthropic", content: "Dictionary learning over residual stream activations recovers monosemantic features." },
    { nb: 2, type: "pdf", title: "Toy Models of Superposition", content: "Linear representation hypothesis and capacity tradeoffs." },
    { nb: 2, type: "url", title: "Advisor feedback — methodology section", content: "Strengthen ablation; cite baseline reconstruction loss; add scaling curve." },
    { nb: 3, type: "pdf", title: "Cracking the Coding Interview — graph patterns", content: "BFS/DFS templates, topological sort, union-find variations." },
    { nb: 3, type: "url", title: "System design primer — rate limiter", content: "Token bucket, leaky bucket, sliding window log tradeoffs." },
    { nb: 3, type: "pdf", title: "Behavioral story bank", content: "STAR-format stories: ownership, ambiguity, failure, leadership." },
  ];
  const sourceIds: Record<number, string[]> = { 0: [], 1: [], 2: [], 3: [] };
  for (const s of sources) {
    const { data } = await supabase.from("resource_sources").insert({
      org_id: orgId, notebook_id: notebookIds[s.nb], source_type: s.type, title: s.title, content: s.content,
    }).select("id").single();
    if (data) sourceIds[s.nb].push(data.id);
  }

  const chats = [
    { nb: 0, role: "user", content: "Summarize when to use DP vs greedy." },
    { nb: 0, role: "assistant", content: "Use DP when the problem has optimal substructure AND overlapping subproblems; greedy works only when a local optimum is globally optimal (matroid structure).", citations: [{ source_id: sourceIds[0][0], snippet: "Bellman's principle of optimality" }] },
    { nb: 1, role: "user", content: "What are the biggest sources of technical debt in ML systems?" },
    { nb: 1, role: "assistant", content: "Feedback loops, glue code, configuration debt, and undeclared consumers — per Sculley et al.", citations: [{ source_id: sourceIds[1][0], snippet: "feedback loops, glue code" }] },
    { nb: 2, role: "user", content: "Summarize the methodology my advisor wants strengthened." },
    { nb: 2, role: "assistant", content: "Your advisor flagged three gaps: (1) ablate the sparsity coefficient, (2) cite the baseline reconstruction loss from Anthropic's SAE paper, (3) add a scaling curve across model widths.", citations: [{ source_id: sourceIds[2][2], snippet: "Strengthen ablation" }, { source_id: sourceIds[2][0], snippet: "dictionary learning" }] },
    { nb: 3, role: "user", content: "Give me a STAR story for handling ambiguity." },
    { nb: 3, role: "assistant", content: "Pull from your thesis pivot story in the bank — frame the unclear advisor goals as the Situation, your scoped 2-week spike as the Task, the SAE prototype as the Action, and the resulting paper draft as the Result.", citations: [{ source_id: sourceIds[3][2], snippet: "STAR-format stories" }] },
  ];
  for (const c of chats) {
    await supabase.from("resource_chats").insert({
      org_id: orgId, notebook_id: notebookIds[c.nb], user_id: adminUserId,
      role: c.role, content: c.content, citations: c.citations ?? null,
    });
  }

  // Action items as topics (the app surfaces high-priority topics as action items)
  const actions = [
    { title: "Finish PSet 4 problem 3", category: "coursework", priority: "high" },
    { title: "Read Sculley et al. by Friday", category: "coursework", priority: "medium" },
    { title: "Email advisor with revised methodology", category: "thesis", priority: "high" },
    { title: "Run SAE ablation on 4 widths", category: "thesis", priority: "high" },
    { title: "Mock interview — system design", category: "career", priority: "medium" },
    { title: "Update résumé with thesis results", category: "career", priority: "medium" },
  ];
  for (const a of actions) {
    await supabase.from("topics").insert({
      org_id: orgId, title: a.title, category: a.category, priority: a.priority,
      status: "active", owner_name: ctx.memberIds ? "Self" : "Self", source_type: "ai_generated",
    });
  }

  // A few notifications so the bell has content
  await supabase.from("notifications").insert([
    { org_id: orgId, user_id: adminUserId, title: "Advisor replied to your thesis email", body: "Suggested two more references for the literature review.", type: "info", source_agent: "router" },
    { org_id: orgId, user_id: adminUserId, title: "Action item due tomorrow", body: "Finish PSet 4 problem 3 by 11:59pm.", type: "warning", source_agent: "critic" },
  ]);
}

// ── Persona 2: Northwind Product ─────────────────────────────────────────────
async function seedNorthwind(ctx: SeedCtx) {
  const { supabase, orgId, adminUserId, memberIds } = ctx;

  // Projects
  const projects = [
    { name: "Checkout v3", description: "Unified checkout across web + mobile.", team_name: "Engineering", progress: 65, status: "active", owner_name: "PM Demo" },
    { name: "Pricing Refresh", description: "Tiered pricing model + paywall UX.", team_name: "GTM", progress: 40, status: "active", owner_name: "PM Demo" },
    { name: "Mobile Onboarding", description: "First-run experience for iOS + Android.", team_name: "Design", progress: 80, status: "active", owner_name: "PM Demo" },
    { name: "Data Platform Migration", description: "Move warehouse to BigQuery.", team_name: "Engineering", progress: 25, status: "active", owner_name: "PM Demo" },
    { name: "GA4 Rollout", description: "Replace legacy analytics tracking.", team_name: "GTM", progress: 90, status: "active", owner_name: "PM Demo" },
  ];
  for (const p of projects) {
    const { data } = await supabase.from("projects").insert({ org_id: orgId, ...p }).select("id").single();
    if (data?.id) {
      await supabase.from("project_milestones").insert([
        { project_id: data.id, org_id: orgId, name: `${p.name} — kickoff & scope`, status: "done", target_date: daysAgo(45).slice(0, 10) },
        { project_id: data.id, org_id: orgId, name: `${p.name} — mid-flight review`, status: "in_progress", target_date: daysAgo(-7).slice(0, 10) },
        { project_id: data.id, org_id: orgId, name: `${p.name} — launch readiness`, status: "pending", target_date: daysAgo(-30).slice(0, 10) },
      ]);
    }
  }

  // Decisions (topics)
  const decisions = [
    "Adopt Stripe Elements for checkout",
    "Freeze pricing tiers at 3 plans",
    "Use Expo for mobile onboarding",
    "Pick BigQuery over Snowflake",
    "Migrate to GA4 by July",
    "Standardize on React Hook Form",
    "Move email to Resend",
    "Deprecate legacy admin panel",
    "Adopt feature flags via PostHog",
    "Quarterly OKRs locked",
    "Hire two senior eng for Q3",
    "Sunset desktop app installer",
  ];
  const topicIds: string[] = [];
  for (const t of decisions) {
    const { data } = await supabase.from("topics").insert({
      org_id: orgId, title: t, category: "decision", status: "decided",
      priority: "medium", source_type: "meeting", owner_name: "PM Demo",
    }).select("id").single();
    if (data) topicIds.push(data.id);
  }

  // Conflicts
  const conflicts = [
    { title: "Checkout v3 launch date vs Pricing freeze", description: "Engineering targets July 15 for Checkout v3, but GTM wants pricing finalized before launch — currently slipping to August.", severity: "high", parties: ["Engineering", "GTM"] },
    { title: "Stripe Elements vs custom form", description: "Two PRs propose conflicting approaches; needs a single owner.", severity: "medium", parties: ["Engineering", "Design"] },
    { title: "BigQuery vs Snowflake — cost model disagreement", description: "Data team picked BigQuery; Finance flagged 18% overrun risk.", severity: "high", parties: ["Engineering", "Finance"] },
    { title: "Onboarding copy tone", description: "Design pushing friendly tone; Legal requiring compliance disclaimers.", severity: "low", parties: ["Design", "Legal"] },
    { title: "GA4 rollout overlapping with checkout launch", description: "Two large rollouts in same week risks attribution chaos.", severity: "medium", parties: ["Engineering", "GTM"] },
    { title: "Headcount plan vs hiring freeze rumor", description: "Two senior eng reqs open but Finance flagged Q3 freeze.", severity: "high", parties: ["Engineering", "Finance"] },
  ];
  for (const c of conflicts) {
    await supabase.from("conflicts").insert({
      org_id: orgId, title: c.title, description: c.description, severity: c.severity,
      status: "open", parties: c.parties, detected_by: "critic",
      topic_ids: topicIds.slice(0, 2),
    });
  }

  // Notifications routed by Router
  const memberArr = Object.values(memberIds);
  const recipients = [adminUserId, ...memberArr];
  const notifs = [
    "Checkout v3 slipped 2 weeks — Finance should know",
    "Pricing decision finalized — please update sales decks",
    "Onboarding copy needs Legal sign-off this week",
    "BigQuery cost model flagged by Finance",
    "GA4 rollout collides with Checkout launch window",
    "New senior eng req posted — Recruiting alerted",
  ];
  for (const r of recipients) {
    for (const n of notifs) {
      await supabase.from("notifications").insert({
        org_id: orgId, user_id: r, title: n,
        body: "Router agent identified you as a stakeholder based on team membership and decision history.",
        type: "info", source_agent: "router",
        reasoning: "Stakeholder match score 0.82 — cross-team dependency detected.",
      });
    }
  }

  // A few cross-team messages
  const channels = ["#eng", "#design", "#gtm", "#leadership"];
  for (let i = 0; i < 25; i++) {
    await supabase.from("messages").insert({
      org_id: orgId, source_type: "slack",
      sender_name: ["PM Demo", "Eng Lead", "Design Lead", "GTM Lead"][i % 4],
      channel: channels[i % channels.length],
      content: `Cross-team update #${i + 1} — sharing context on ${decisions[i % decisions.length]}.`,
      created_at: daysAgo(30 - i),
    });
  }
}

// ── Persona 3: Lumen Robotics ────────────────────────────────────────────────
async function seedLumen(ctx: SeedCtx) {
  const { supabase, orgId, adminUserId } = ctx;

  const projects = [
    { name: "Atlas-1 Prototype", team_name: "Hardware", progress: 55, status: "active" },
    { name: "Firmware 4.0", team_name: "Firmware", progress: 70, status: "active" },
    { name: "Pilot Customer Deployment", team_name: "Ops", progress: 30, status: "active" },
    { name: "Series B Raise", team_name: "Finance", progress: 50, status: "active" },
    { name: "FCC Certification", team_name: "Hardware", progress: 20, status: "at_risk" },
    { name: "Supply Chain Resilience", team_name: "Ops", progress: 60, status: "active" },
  ];
  const projectIds: string[] = [];
  for (const p of projects) {
    const { data } = await supabase.from("projects").insert({
      org_id: orgId, owner_name: "Founder Demo", description: p.name + " roadmap", ...p,
    }).select("id").single();
    if (data) projectIds.push(data.id);
  }

  for (const pid of projectIds) {
    await supabase.from("project_milestones").insert([
      { project_id: pid, org_id: orgId, name: "Kickoff complete", status: "done", target_date: "2026-04-01" },
      { project_id: pid, org_id: orgId, name: "Mid-quarter review", status: "in_progress", target_date: "2026-07-15" },
      { project_id: pid, org_id: orgId, name: "Launch readiness", status: "todo", target_date: "2026-09-30" },
    ]);
  }

  const meetings = [
    { title: "Monday Exec Sync", summary: "Hardware on track for Atlas-1 prototype demo; FCC paperwork at risk.", decisions: ["Hire FCC consultant"], sentiment: "cautious" },
    { title: "Firmware Review", summary: "v4.0 passing all regression tests; ready for pilot deploy.", decisions: ["Pin v4.0 for pilot"], sentiment: "positive" },
    { title: "Pilot Customer Standup", summary: "Two customers ready for September install; one slipping to October.", decisions: ["Defer customer C to October"], sentiment: "neutral" },
    { title: "Series B Pipeline Review", summary: "Three term sheets in flight; lead investor decision by July 30.", decisions: ["Accept lead by July 30"], sentiment: "positive" },
    { title: "Supply Chain Risk Review", summary: "Lead times for actuators stretching to 12 weeks; alternate vendor qualified.", decisions: ["Dual-source actuators"], sentiment: "cautious" },
  ];
  for (let i = 0; i < 20; i++) {
    const m = meetings[i % meetings.length];
    await supabase.from("meeting_summaries").insert({
      org_id: orgId, title: `${m.title} — Week ${i + 1}`, summary: m.summary,
      key_decisions: m.decisions,
      action_items: [{ assignee: "Founder Demo", task: "Review and broadcast outcome", due: daysAgo(-7).slice(0, 10) }],
      sentiment: m.sentiment, created_at: daysAgo(40 - i),
    });
  }

  const agentLogs = [
    { agent_type: "memory", action: "extract_entities", input_summary: "Monday exec sync transcript", output_summary: "Extracted 7 decisions, 3 risks, 12 stakeholders.", reasoning: "Used Gemini 3 Flash with structured Output schema." },
    { agent_type: "router", action: "score_stakeholders", input_summary: "FCC delay decision", output_summary: "Routed to: Founder, Hardware Lead, Finance Lead.", reasoning: "Pinecone similarity > 0.78 across knowledge graph." },
    { agent_type: "critic", action: "detect_conflict", input_summary: "Pilot deploy date vs firmware freeze", output_summary: "Conflict detected — pilot deploy is 2 weeks before firmware code freeze.", reasoning: "Critic compared topic versions across two meeting summaries." },
    { agent_type: "coordinator", action: "generate_daily_brief", input_summary: "Today's signals across all teams", output_summary: "Daily brief generated with 5 sections and 3 risks.", reasoning: "Coordinator orchestrated Memory + Router + Critic and synthesized via Lovable AI Gateway." },
  ];
  for (let i = 0; i < 15; i++) {
    const a = agentLogs[i % agentLogs.length];
    await supabase.from("agent_logs").insert({
      org_id: orgId, ...a, duration_ms: 800 + i * 50, created_at: daysAgo(15 - i),
    });
  }

  // Daily exec brief surfaced as a top-priority topic
  await supabase.from("topics").insert({
    org_id: orgId, title: "Daily Executive Brief",
    description: "Atlas-1 on track. FCC certification AT RISK — needs founder attention. Series B lead by July 30. Supply chain dual-source complete.",
    category: "brief", status: "active", priority: "high",
    source_type: "coordinator_agent", owner_name: "Coordinator",
  });
}

// ── Persona registry ─────────────────────────────────────────────────────────
// ── Persona: Apple (Steve Jobs) ──────────────────────────────────────────────
async function seedApple(ctx: SeedCtx) {
  const { supabase, orgId, adminUserId } = ctx;

  const projects = [
    { name: "Vision Pro 2", team_name: "Hardware", progress: 60, status: "active" },
    { name: "macOS 27", team_name: "Software", progress: 80, status: "active" },
    { name: "iPhone Air", team_name: "Hardware", progress: 45, status: "active" },
    { name: "Q4 Keynote", team_name: "Marketing", progress: 70, status: "active" },
    { name: "EU USB-C Compliance", team_name: "Software", progress: 35, status: "at_risk" },
  ];
  for (const p of projects) {
    const { data } = await supabase.from("projects").insert({
      org_id: orgId, owner_name: "Steve Jobs", description: p.name + " program plan", ...p,
    }).select("id").single();
    if (data?.id) {
      await supabase.from("project_milestones").insert([
        { project_id: data.id, org_id: orgId, name: `${p.name} — design lock`, status: "done", target_date: daysAgo(60).slice(0, 10) },
        { project_id: data.id, org_id: orgId, name: `${p.name} — engineering complete`, status: "in_progress", target_date: daysAgo(-14).slice(0, 10) },
        { project_id: data.id, org_id: orgId, name: `${p.name} — keynote-ready`, status: "pending", target_date: daysAgo(-45).slice(0, 10) },
      ]);
    }
  }

  const decisions = [
    "Lock Vision Pro 2 chassis dimensions",
    "Ship macOS 27 with Apple Intelligence on-device",
    "Price Vision Pro 2 at $3,499",
    "Keynote staged at Steve Jobs Theater",
    "Deprecate Intel macOS builds",
    "Adopt USB-C across all EU SKUs",
    "Open third-party payment in EU only",
  ];
  for (const t of decisions) {
    await supabase.from("topics").insert({
      org_id: orgId, title: t, category: "decision", status: "decided",
      priority: "high", source_type: "meeting", owner_name: "Steve Jobs",
    });
  }

  await supabase.from("conflicts").insert([
    { org_id: orgId, title: "Pricing vs margin on Vision Pro 2", description: "Marketing wants $2,999 entry; Finance needs $3,499 minimum.", severity: "high", status: "open", parties: ["Marketing", "Finance"], detected_by: "critic" },
    { org_id: orgId, title: "EU USB-C launch date", description: "Hardware ready Sept 12; Legal flags compliance window.", severity: "medium", status: "open", parties: ["Hardware", "Legal"], detected_by: "critic" },
  ]);

  const meetings = [
    { title: "Product Council", summary: "Vision Pro 2 chassis locked. Pricing tabled.", decisions: ["Lock chassis"], sentiment: "positive" },
    { title: "Keynote Dry Run", summary: "Steve walked through 7 demos; cut 2.", decisions: ["Cut Watch segment"], sentiment: "neutral" },
    { title: "EU Regulatory Sync", summary: "USB-C compliance and DMA payment rules.", decisions: ["Open third-party payment EU only"], sentiment: "cautious" },
  ];
  for (let i = 0; i < 12; i++) {
    const m = meetings[i % meetings.length];
    await supabase.from("meeting_summaries").insert({
      org_id: orgId, title: `${m.title} — Week ${i + 1}`, summary: m.summary,
      key_decisions: m.decisions,
      action_items: [{ assignee: "Steve Jobs", task: "Approve and broadcast", due: daysAgo(-3).slice(0, 10) }],
      sentiment: m.sentiment, created_at: daysAgo(30 - i * 2),
    });
  }
}

// ── Shared: knowledge graph edges so every persona has a visible graph ───────
async function seedGraphEdges(ctx: SeedCtx, personaName: string) {
  const { supabase, orgId } = ctx;
  const { count } = await supabase
    .from("graph_edges").select("id", { count: "exact", head: true }).eq("org_id", orgId);
  if ((count ?? 0) > 0) return;

  const edgeSets: Record<string, { source_type: string; source_label: string; target_type: string; target_label: string; relationship: string }[]> = {
    "Apple": [
      { source_type: "person", source_label: "Steve Jobs", target_type: "project", target_label: "Vision Pro 2", relationship: "owns" },
      { source_type: "person", source_label: "Tim Cook", target_type: "project", target_label: "EU USB-C Compliance", relationship: "owns" },
      { source_type: "person", source_label: "Jony Ive", target_type: "project", target_label: "Vision Pro 2", relationship: "designs" },
      { source_type: "person", source_label: "Craig Federighi", target_type: "project", target_label: "macOS 27", relationship: "owns" },
      { source_type: "person", source_label: "Phil Schiller", target_type: "project", target_label: "Q4 Keynote", relationship: "owns" },
      { source_type: "project", source_label: "Vision Pro 2", target_type: "decision", target_label: "Price at $3,499", relationship: "blocked_by" },
      { source_type: "project", source_label: "macOS 27", target_type: "decision", target_label: "On-device Apple Intelligence", relationship: "depends_on" },
      { source_type: "meeting", source_label: "Product Council", target_type: "decision", target_label: "Lock chassis", relationship: "produced" },
      { source_type: "meeting", source_label: "Keynote Dry Run", target_type: "project", target_label: "Q4 Keynote", relationship: "advanced" },
      { source_type: "topic", source_label: "EU DMA compliance", target_type: "project", target_label: "EU USB-C Compliance", relationship: "drives" },
      { source_type: "person", source_label: "Steve Jobs", target_type: "meeting", target_label: "Product Council", relationship: "chaired" },
      { source_type: "person", source_label: "Phil Schiller", target_type: "meeting", target_label: "Keynote Dry Run", relationship: "attended" },
    ],
    "Lumen Robotics": [
      { source_type: "person", source_label: "Founder Demo", target_type: "project", target_label: "Atlas-1 Prototype", relationship: "owns" },
      { source_type: "person", source_label: "Hugo Hardware", target_type: "project", target_label: "FCC Certification", relationship: "owns" },
      { source_type: "person", source_label: "Farah Firmware", target_type: "project", target_label: "Firmware 4.0", relationship: "owns" },
      { source_type: "project", source_label: "Atlas-1 Prototype", target_type: "decision", target_label: "Pin v4.0 for pilot", relationship: "depends_on" },
      { source_type: "meeting", source_label: "Monday Exec Sync", target_type: "decision", target_label: "Hire FCC consultant", relationship: "produced" },
      { source_type: "project", source_label: "FCC Certification", target_type: "topic", target_label: "Regulatory risk", relationship: "tagged" },
      { source_type: "person", source_label: "Owen Ops", target_type: "project", target_label: "Pilot Customer Deployment", relationship: "owns" },
      { source_type: "person", source_label: "Fiona Finance", target_type: "project", target_label: "Series B Raise", relationship: "owns" },
    ],
    "Northwind Product": [
      { source_type: "person", source_label: "PM Demo", target_type: "project", target_label: "Checkout v3", relationship: "owns" },
      { source_type: "person", source_label: "Priya Engineering", target_type: "project", target_label: "Data Platform Migration", relationship: "owns" },
      { source_type: "person", source_label: "Diego Design", target_type: "project", target_label: "Mobile Onboarding", relationship: "owns" },
      { source_type: "person", source_label: "Marta GTM", target_type: "project", target_label: "Pricing Refresh", relationship: "owns" },
      { source_type: "project", source_label: "Checkout v3", target_type: "decision", target_label: "Adopt Stripe Elements", relationship: "depends_on" },
      { source_type: "project", source_label: "Data Platform Migration", target_type: "decision", target_label: "Pick BigQuery", relationship: "depends_on" },
      { source_type: "topic", source_label: "BigQuery cost overrun", target_type: "project", target_label: "Data Platform Migration", relationship: "risks" },
    ],
    "Stanford CS Cohort": [
      { source_type: "person", source_label: "Alex Student", target_type: "topic", target_label: "Senior Thesis", relationship: "owns" },
      { source_type: "person", source_label: "Dr. Riya Patel", target_type: "topic", target_label: "Senior Thesis", relationship: "advises" },
      { source_type: "person", source_label: "Jordan Kim", target_type: "topic", target_label: "SAE ablation", relationship: "collaborates" },
      { source_type: "topic", source_label: "Senior Thesis", target_type: "decision", target_label: "Run ablation on 4 widths", relationship: "depends_on" },
      { source_type: "topic", source_label: "Interview Prep", target_type: "topic", target_label: "System design", relationship: "covers" },
    ],
  };

  const edges = edgeSets[personaName] ?? [];
  for (const e of edges) {
    await supabase.from("graph_edges").insert({ org_id: orgId, ...e, weight: 1.0 });
  }
}

const PERSONAS: PersonaSpec[] = [
  {
    slug: "apple",
    name: "Apple",
    plan: "enterprise",
    status: "active",
    admin: { email: "steve.jobs@apple.com", name: "Steve Jobs", role: "admin", dept: "Executive", title: "CEO" },
    members: [
      { email: "tim.cook@apple.com", name: "Tim Cook", role: "manager", dept: "Operations", title: "COO" },
      { email: "jony.ive@apple.com", name: "Jony Ive", role: "manager", dept: "Design", title: "SVP Design" },
      { email: "craig.federighi@apple.com", name: "Craig Federighi", role: "manager", dept: "Software", title: "SVP Software" },
      { email: "phil.schiller@apple.com", name: "Phil Schiller", role: "manager", dept: "Marketing", title: "SVP Marketing" },
    ],
    teams: [
      { name: "Hardware", color: "#f59e0b", description: "Industrial design and silicon." },
      { name: "Software", color: "#6366f1", description: "macOS, iOS, visionOS." },
      { name: "Design", color: "#ec4899", description: "Industrial + interaction design." },
      { name: "Marketing", color: "#10b981", description: "Keynotes, launch, brand." },
    ],
    seed: seedApple,
  },
  {
    slug: "stanford-cs",
    name: "Stanford CS Cohort",
    plan: "free",
    status: "trialing",
    admin: { email: "student.demo@chiefofstaff.app", name: "Alex Student", role: "admin", dept: "Academic", title: "Senior CS Student" },
    members: [
      { email: "advisor.stanford@chiefofstaff.app", name: "Dr. Riya Patel", role: "manager", dept: "Research", title: "Faculty Advisor" },
      { email: "labmate.stanford@chiefofstaff.app", name: "Jordan Kim", role: "member", dept: "Research", title: "PhD Student" },
    ],
    teams: [
      { name: "Coursework", color: "#6366f1", description: "Classes, problem sets, exams." },
      { name: "Research", color: "#8b5cf6", description: "Thesis and lab work." },
      { name: "Career", color: "#10b981", description: "Internships and interviews." },
    ],
    seed: seedStanford,
  },
  {
    slug: "northwind-product",
    name: "Northwind Product",
    plan: "pro",
    status: "active",
    admin: { email: "pm.demo@chiefofstaff.app", name: "Sam PM", role: "admin", dept: "Product", title: "Group PM" },
    members: [
      { email: "eng.northwind@chiefofstaff.app", name: "Priya Engineering", role: "manager", dept: "Engineering", title: "Eng Lead" },
      { email: "design.northwind@chiefofstaff.app", name: "Diego Design", role: "manager", dept: "Design", title: "Design Lead" },
      { email: "gtm.northwind@chiefofstaff.app", name: "Marta GTM", role: "manager", dept: "GTM", title: "GTM Lead" },
    ],
    teams: [
      { name: "Engineering", color: "#6366f1", description: "Platform and product engineering." },
      { name: "Design", color: "#ec4899", description: "Product and brand design." },
      { name: "GTM", color: "#10b981", description: "Marketing, sales, success." },
    ],
    seed: seedNorthwind,
  },
  {
    slug: "lumen-robotics",
    name: "Lumen Robotics",
    plan: "enterprise",
    status: "active",
    admin: { email: "founder.demo@chiefofstaff.app", name: "Lina Founder", role: "admin", dept: "Executive", title: "CEO & Co-founder" },
    members: [
      { email: "hw.lumen@chiefofstaff.app", name: "Hugo Hardware", role: "manager", dept: "Hardware", title: "VP Hardware" },
      { email: "fw.lumen@chiefofstaff.app", name: "Farah Firmware", role: "manager", dept: "Firmware", title: "VP Firmware" },
      { email: "ops.lumen@chiefofstaff.app", name: "Owen Ops", role: "manager", dept: "Ops", title: "VP Operations" },
      { email: "fin.lumen@chiefofstaff.app", name: "Fiona Finance", role: "manager", dept: "Finance", title: "CFO" },
    ],
    teams: [
      { name: "Hardware", color: "#f59e0b", description: "Mechanical and electrical." },
      { name: "Firmware", color: "#6366f1", description: "Embedded software." },
      { name: "Ops", color: "#3b82f6", description: "Manufacturing and supply chain." },
      { name: "Finance", color: "#10b981", description: "Finance and fundraising." },
    ],
    seed: seedLumen,
  },
];

async function ensureUser(supabase: any, m: Member): Promise<string> {
  const { data: list } = await supabase.auth.admin.listUsers();
  const existing = list?.users?.find((u: any) => u.email === m.email);
  let uid: string;
  if (existing) {
    uid = existing.id;
    // Ensure the demo password is current — earlier seeds may have used a
    // different password and we want demo logins to be deterministic.
    await supabase.auth.admin.updateUserById(uid, { password: PASSWORD, email_confirm: true });
  } else {
    const { data: created, error } = await supabase.auth.admin.createUser({
      email: m.email, password: PASSWORD, email_confirm: true,
      user_metadata: { full_name: m.name },
    });
    if (error) throw new Error(`createUser ${m.email}: ${error.message}`);
    uid = created.user!.id;
  }
  await supabase.from("profiles").upsert(
    { user_id: uid, display_name: m.name, department: m.dept, job_title: m.title, onboarding_completed: true },
    { onConflict: "user_id" },
  );
  return uid;
}

async function seedPersona(supabase: any, spec: PersonaSpec) {
  // Admin user
  const adminUserId = await ensureUser(supabase, spec.admin);

  // Org (idempotent by slug)
  const { data: existingOrg } = await supabase
    .from("organizations").select("id").eq("slug", spec.slug).maybeSingle();
  let orgId: string;
  if (existingOrg) {
    orgId = existingOrg.id;
  } else {
    const { data: org, error } = await supabase.from("organizations")
      .insert({ name: spec.name, slug: spec.slug, created_by: adminUserId })
      .select("id").single();
    if (error) throw new Error(`org ${spec.slug}: ${error.message}`);
    orgId = org.id;
  }

  // Admin membership
  await supabase.from("org_memberships").upsert(
    { org_id: orgId, user_id: adminUserId, role: "admin" },
    { onConflict: "org_id,user_id" },
  );

  // Member users
  const memberIds: Record<string, string> = {};
  for (const m of spec.members) {
    const uid = await ensureUser(supabase, m);
    memberIds[m.email] = uid;
    await supabase.from("org_memberships").upsert(
      { org_id: orgId, user_id: uid, role: m.role },
      { onConflict: "org_id,user_id" },
    );
  }

  // Teams
  for (const t of spec.teams) {
    const { data: existingTeam } = await supabase.from("teams")
      .select("id").eq("org_id", orgId).eq("name", t.name).maybeSingle();
    if (!existingTeam) {
      await supabase.from("teams").insert({
        org_id: orgId, name: t.name, color: t.color, description: t.description, created_by: adminUserId,
      });
    }
  }

  // Subscription (upsert to chosen tier)
  await supabase.from("subscriptions").upsert(
    {
      org_id: orgId, plan: spec.plan, status: spec.status,
      trial_ends_at: new Date(Date.now() + 30 * 86400000).toISOString(),
      current_period_start: new Date().toISOString(),
    },
    { onConflict: "org_id" },
  );

  // Rich seed — only if org has no messages or notebooks
  const { count: msgCount } = await supabase
    .from("messages").select("id", { count: "exact", head: true }).eq("org_id", orgId);
  const { count: nbCount } = await supabase
    .from("resource_notebooks").select("id", { count: "exact", head: true }).eq("org_id", orgId);
  if ((msgCount ?? 0) === 0 && (nbCount ?? 0) === 0) {
    await spec.seed({ supabase, orgId, adminUserId, memberIds, daysAgo });
    // Layer on daily voice briefings + DMs for every persona
    await seedDailyVoiceAndMessages({ supabase, orgId, adminUserId, memberIds, daysAgo }, spec.name);
  }
  // Graph edges are idempotent-checked inside the helper; safe to always call
  await seedGraphEdges({ supabase, orgId, adminUserId, memberIds, daysAgo }, spec.name);

  return { slug: spec.slug, org_id: orgId, admin_email: spec.admin.email };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const results = [];
    for (const spec of PERSONAS) {
      const r = await seedPersona(supabase, spec);
      results.push(r);
    }

    return new Response(
      JSON.stringify({ success: true, password: PASSWORD, personas: results }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (e: any) {
    console.error("seed-personas error:", e);
    return new Response(
      JSON.stringify({ success: false, error: e?.message ?? String(e) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});