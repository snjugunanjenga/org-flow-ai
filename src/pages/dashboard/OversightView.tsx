import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useOrgId } from "@/hooks/use-org-id";
import { Eye, TrendingUp, TrendingDown, Clock, MessageSquare } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";

interface CommLog {
  team_name: string;
  messages_count: number;
  avg_response_time_mins: number;
  sentiment_score: number;
  collaboration_score: number;
}

export default function OversightView() {
  const orgId = useOrgId();
  const [logs, setLogs] = useState<CommLog[]>([]);

  useEffect(() => {
    if (!orgId) return;
    supabase.from("communication_logs").select("*").eq("org_id", orgId)
      .then(({ data }) => setLogs(data || []));
  }, [orgId]);

  const responseData = logs.map(l => ({ name: l.team_name, time: l.avg_response_time_mins }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold font-display">Manager Oversight</h1>
        <p className="text-muted-foreground mt-1">Communication analytics and team health monitoring.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="glass-panel p-6">
          <h3 className="text-lg font-semibold font-display mb-4">Avg Response Time by Team</h3>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={responseData} layout="vertical">
              <XAxis type="number" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" unit="m" />
              <YAxis dataKey="name" type="category" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" width={90} />
              <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }} formatter={(v: number) => `${v}m`} />
              <Bar dataKey="time" fill="hsl(var(--accent))" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="glass-panel p-6">
          <h3 className="text-lg font-semibold font-display mb-4">Team Health</h3>
          <div className="space-y-3">
            {logs.sort((a, b) => b.sentiment_score - a.sentiment_score).map(l => {
              const health = l.sentiment_score >= 0.80 ? "Excellent" : l.sentiment_score >= 0.70 ? "Good" : l.sentiment_score >= 0.60 ? "Fair" : "Needs Attention";
              const color = l.sentiment_score >= 0.80 ? "text-accent" : l.sentiment_score >= 0.70 ? "text-primary" : l.sentiment_score >= 0.60 ? "text-[hsl(40_90%_55%)]" : "text-destructive";
              return (
                <div key={l.team_name} className="flex items-center justify-between py-2 border-b border-border/30 last:border-0">
                  <div className="flex items-center gap-3">
                    <MessageSquare className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">{l.team_name}</p>
                      <p className="text-[10px] text-muted-foreground">{l.messages_count} msgs/wk · {l.avg_response_time_mins}m avg response</p>
                    </div>
                  </div>
                  <span className={`text-xs font-medium ${color}`}>{health}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
