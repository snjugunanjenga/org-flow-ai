import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { LayoutDashboard, Users, FolderKanban, MessageSquare, Brain, AlertTriangle, TrendingUp } from "lucide-react";
import { useOrgId } from "@/hooks/use-org-id";

export default function DashboardOverview() {
  const { user } = useAuth();
  const orgId = useOrgId();
  const [orgName, setOrgName] = useState<string | null>(null);
  const [stats, setStats] = useState({ teams: 0, members: 0, projects: 0, messages: 0, topics: 0, conflicts: 0 });
  const [recentActivity, setRecentActivity] = useState<any[]>([]);
  const [unreadNotifs, setUnreadNotifs] = useState(0);

  useEffect(() => {
    if (!orgId || !user) return;
    const load = async () => {
      const [
        { data: org },
        { data: teams },
        { data: members },
        { data: projects },
        { data: messages },
        { data: topics },
        { data: conflicts },
        { data: notifs },
        { data: agentLogs },
      ] = await Promise.all([
        supabase.from("organizations").select("name").eq("id", orgId).maybeSingle(),
        supabase.from("teams").select("id").eq("org_id", orgId),
        supabase.from("org_memberships").select("id").eq("org_id", orgId),
        supabase.from("projects").select("id").eq("org_id", orgId),
        supabase.from("messages").select("id").eq("org_id", orgId),
        supabase.from("topics").select("id").eq("org_id", orgId),
        supabase.from("conflicts").select("id, status").eq("org_id", orgId),
        supabase.from("notifications").select("id, read").eq("user_id", user.id),
        supabase.from("agent_logs").select("agent_type, action, output_summary, created_at").eq("org_id", orgId).order("created_at", { ascending: false }).limit(5),
      ]);

      setOrgName(org?.name || null);
      setStats({
        teams: teams?.length || 0,
        members: members?.length || 0,
        projects: projects?.length || 0,
        messages: messages?.length || 0,
        topics: topics?.length || 0,
        conflicts: conflicts?.filter(c => c.status === "open")?.length || 0,
      });
      setUnreadNotifs(notifs?.filter(n => !n.read)?.length || 0);
      setRecentActivity(agentLogs || []);
    };
    load();
  }, [orgId, user]);

  const cards = [
    { label: "Teams", value: stats.teams, icon: Users, color: "text-primary" },
    { label: "Members", value: stats.members, icon: Users, color: "text-accent" },
    { label: "Projects", value: stats.projects, icon: FolderKanban, color: "text-primary" },
    { label: "Messages", value: stats.messages, icon: MessageSquare, color: "text-accent" },
    { label: "Topics", value: stats.topics, icon: AlertTriangle, color: "text-primary" },
    { label: "Open Conflicts", value: stats.conflicts, icon: AlertTriangle, color: "text-destructive" },
  ];

  const agentColors: Record<string, string> = {
    memory: "bg-[hsl(var(--agent-memory))]",
    router: "bg-[hsl(var(--agent-router))]",
    critic: "bg-[hsl(var(--agent-critic))]",
    coordinator: "bg-[hsl(var(--agent-coordinator))]",
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold font-display">
          Welcome{orgName ? ` to ${orgName}` : ""}
        </h1>
        <p className="text-muted-foreground mt-1">Your organizational intelligence command center.</p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        {cards.map((c) => (
          <div key={c.label} className="glass-panel p-5">
            <div className="flex items-center justify-between mb-3">
              <c.icon className={`h-5 w-5 ${c.color}`} />
            </div>
            <p className="text-2xl font-bold font-display">{c.value}</p>
            <p className="text-xs text-muted-foreground mt-1">{c.label}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="glass-panel p-6">
          <h3 className="text-lg font-semibold font-display mb-4">Recent Agent Activity</h3>
          <div className="space-y-3">
            {recentActivity.map((log, i) => (
              <div key={i} className="flex items-start gap-3 py-2 border-b border-border/30 last:border-0">
                <div className={`w-2 h-2 rounded-full mt-2 shrink-0 ${agentColors[log.agent_type] || "bg-muted"}`} />
                <div className="min-w-0">
                  <p className="text-sm font-medium capitalize">{log.agent_type} · {log.action.replace(/_/g, " ")}</p>
                  <p className="text-xs text-muted-foreground truncate">{log.output_summary}</p>
                </div>
              </div>
            ))}
            {recentActivity.length === 0 && (
              <p className="text-sm text-muted-foreground">No agent activity yet.</p>
            )}
          </div>
        </div>

        <div className="glass-panel p-6">
          <h3 className="text-lg font-semibold font-display mb-4">
            Notifications
            {unreadNotifs > 0 && (
              <span className="ml-2 text-xs px-2 py-0.5 rounded-full bg-destructive/10 text-destructive">{unreadNotifs} unread</span>
            )}
          </h3>
          <p className="text-sm text-muted-foreground">
            {unreadNotifs > 0
              ? `You have ${unreadNotifs} unread notifications. Visit the Notifications tab to review AI-routed alerts.`
              : "All caught up! No new notifications."}
          </p>
        </div>
      </div>
    </div>
  );
}
