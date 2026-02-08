import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { LayoutDashboard, Users, FolderKanban, MessageSquare, Brain } from "lucide-react";

export default function DashboardOverview() {
  const { user } = useAuth();
  const [orgName, setOrgName] = useState<string | null>(null);
  const [stats, setStats] = useState({ teams: 0, members: 0 });

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      const { data: mem } = await supabase
        .from("org_memberships")
        .select("org_id")
        .eq("user_id", user.id)
        .limit(1)
        .maybeSingle();
      if (!mem) return;

      const [{ data: org }, { data: teams }, { data: members }] = await Promise.all([
        supabase.from("organizations").select("name").eq("id", mem.org_id).maybeSingle(),
        supabase.from("teams").select("id").eq("org_id", mem.org_id),
        supabase.from("org_memberships").select("id").eq("org_id", mem.org_id),
      ]);

      setOrgName(org?.name || null);
      setStats({ teams: teams?.length || 0, members: members?.length || 0 });
    };
    load();
  }, [user]);

  const cards = [
    { label: "Teams", value: stats.teams, icon: Users, color: "text-primary" },
    { label: "Members", value: stats.members, icon: Users, color: "text-accent" },
    { label: "Projects", value: "—", icon: FolderKanban, color: "text-primary" },
    { label: "Messages", value: "—", icon: MessageSquare, color: "text-accent" },
    { label: "AI Agents", value: "4 active", icon: Brain, color: "text-primary" },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold font-display">
          Welcome{orgName ? ` to ${orgName}` : ""}
        </h1>
        <p className="text-muted-foreground mt-1">Your organizational intelligence command center.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
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
          <h3 className="text-lg font-semibold font-display mb-4">Recent Activity</h3>
          <p className="text-sm text-muted-foreground">Activity feed will show agent actions, decisions, and team updates.</p>
        </div>
        <div className="glass-panel p-6">
          <h3 className="text-lg font-semibold font-display mb-4">Quick Actions</h3>
          <p className="text-sm text-muted-foreground">Agent commands, message routing, and conflict resolution shortcuts.</p>
        </div>
      </div>
    </div>
  );
}
