import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Users } from "lucide-react";

interface Team {
  id: string;
  name: string;
  description: string | null;
  color: string | null;
}

interface Member {
  user_id: string;
  role: string;
  display_name: string | null;
  job_title: string | null;
  department: string | null;
}

export default function TeamsView() {
  const { user } = useAuth();
  const [teams, setTeams] = useState<Team[]>([]);
  const [members, setMembers] = useState<Member[]>([]);

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

      const [{ data: t }, { data: m }] = await Promise.all([
        supabase.from("teams").select("id, name, description, color").eq("org_id", mem.org_id),
        supabase.from("org_memberships").select("user_id, role").eq("org_id", mem.org_id),
      ]);

      setTeams(t || []);

      // Fetch profiles for members
      if (m && m.length > 0) {
        const userIds = m.map((x) => x.user_id);
        const { data: profiles } = await supabase
          .from("profiles")
          .select("user_id, display_name, job_title, department")
          .in("user_id", userIds);

        const merged = m.map((x) => {
          const p = profiles?.find((pr) => pr.user_id === x.user_id);
          return { ...x, display_name: p?.display_name || null, job_title: p?.job_title || null, department: p?.department || null };
        });
        setMembers(merged);
      }
    };
    load();
  }, [user]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold font-display">Teams</h1>
        <p className="text-muted-foreground mt-1">Manage your organization's teams and members.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {teams.map((t) => (
          <div key={t.id} className="glass-panel p-5">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: t.color || "#6366f1" }} />
              <h3 className="font-semibold font-display">{t.name}</h3>
            </div>
            <p className="text-xs text-muted-foreground">{t.description}</p>
          </div>
        ))}
      </div>

      <div className="glass-panel p-6">
        <h3 className="text-lg font-semibold font-display mb-4">Members ({members.length})</h3>
        <div className="space-y-3">
          {members.map((m) => (
            <div key={m.user_id} className="flex items-center justify-between py-2 border-b border-border/30 last:border-0">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                  <Users className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-medium">{m.display_name || "Unknown"}</p>
                  <p className="text-xs text-muted-foreground">{m.job_title} · {m.department}</p>
                </div>
              </div>
              <span className="text-xs px-2 py-1 rounded-full bg-primary/10 text-primary capitalize">{m.role}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
