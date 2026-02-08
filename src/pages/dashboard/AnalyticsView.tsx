import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useOrgId } from "@/hooks/use-org-id";
import { BarChart3, TrendingUp, TrendingDown, Minus } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";

interface CommLog {
  team_name: string;
  messages_count: number;
  avg_response_time_mins: number;
  sentiment_score: number;
  collaboration_score: number;
}

const COLORS = ["hsl(250, 80%, 60%)", "hsl(170, 70%, 45%)", "hsl(280, 70%, 60%)", "hsl(40, 90%, 55%)", "hsl(200, 80%, 55%)", "hsl(0, 70%, 55%)", "hsl(150, 70%, 50%)", "hsl(220, 80%, 60%)"];

export default function AnalyticsView() {
  const orgId = useOrgId();
  const [commLogs, setCommLogs] = useState<CommLog[]>([]);
  const [stats, setStats] = useState({ decisions: 0, conflicts: 0, edges: 0, messages: 0 });

  useEffect(() => {
    if (!orgId) return;
    Promise.all([
      supabase.from("communication_logs").select("*").eq("org_id", orgId),
      supabase.from("topics").select("id").eq("org_id", orgId),
      supabase.from("conflicts").select("id").eq("org_id", orgId),
      supabase.from("graph_edges").select("id").eq("org_id", orgId),
      supabase.from("messages").select("id").eq("org_id", orgId),
    ]).then(([{ data: cl }, { data: t }, { data: c }, { data: e }, { data: m }]) => {
      setCommLogs(cl || []);
      setStats({
        decisions: t?.length || 0,
        conflicts: c?.length || 0,
        edges: e?.length || 0,
        messages: m?.length || 0,
      });
    });
  }, [orgId]);

  const statCards: { label: string; value: number; trend: "up" | "down" | "neutral" }[] = [
    { label: "Decisions Tracked", value: stats.decisions, trend: "up" },
    { label: "Conflicts Detected", value: stats.conflicts, trend: "neutral" },
    { label: "Knowledge Nodes", value: stats.edges, trend: "up" },
    { label: "Messages Processed", value: stats.messages, trend: "up" },
  ];

  const trendIcons = { up: TrendingUp, down: TrendingDown, neutral: Minus };

  const messageData = commLogs.map(c => ({ name: c.team_name, messages: c.messages_count }));
  const sentimentData = commLogs.map(c => ({ name: c.team_name, value: Math.round(c.sentiment_score * 100) }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold font-display">Analytics</h1>
        <p className="text-muted-foreground mt-1">Organizational intelligence metrics and insights.</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {statCards.map(c => {
          const TrendIcon = trendIcons[c.trend];
          return (
            <div key={c.label} className="glass-panel p-5">
              <p className="text-xs text-muted-foreground mb-1">{c.label}</p>
              <div className="flex items-center gap-2">
                <p className="text-2xl font-bold font-display">{c.value}</p>
                <TrendIcon className={`h-4 w-4 ${c.trend === "up" ? "text-accent" : c.trend === "down" ? "text-destructive" : "text-muted-foreground"}`} />
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="glass-panel p-6">
          <h3 className="text-lg font-semibold font-display mb-4">Messages by Team</h3>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={messageData}>
              <XAxis dataKey="name" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
              <YAxis tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
              <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }} />
              <Bar dataKey="messages" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="glass-panel p-6">
          <h3 className="text-lg font-semibold font-display mb-4">Team Sentiment Scores</h3>
          <ResponsiveContainer width="100%" height={280}>
            <PieChart>
              <Pie data={sentimentData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} label={({ name, value }) => `${name}: ${value}%`} labelLine={false}>
                {sentimentData.map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Team Health Table */}
      <div className="glass-panel p-6">
        <h3 className="text-lg font-semibold font-display mb-4">Team Communication Health</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border/50">
                <th className="text-left py-2 text-xs text-muted-foreground font-medium">Team</th>
                <th className="text-right py-2 text-xs text-muted-foreground font-medium">Messages/wk</th>
                <th className="text-right py-2 text-xs text-muted-foreground font-medium">Avg Response</th>
                <th className="text-right py-2 text-xs text-muted-foreground font-medium">Sentiment</th>
                <th className="text-right py-2 text-xs text-muted-foreground font-medium">Collaboration</th>
              </tr>
            </thead>
            <tbody>
              {commLogs.map(c => (
                <tr key={c.team_name} className="border-b border-border/30">
                  <td className="py-2.5 font-medium">{c.team_name}</td>
                  <td className="py-2.5 text-right text-muted-foreground">{c.messages_count}</td>
                  <td className="py-2.5 text-right text-muted-foreground">{c.avg_response_time_mins}m</td>
                  <td className="py-2.5 text-right">
                    <span className={`${c.sentiment_score >= 0.75 ? "text-accent" : c.sentiment_score >= 0.65 ? "text-[hsl(40_90%_55%)]" : "text-destructive"}`}>
                      {Math.round(c.sentiment_score * 100)}%
                    </span>
                  </td>
                  <td className="py-2.5 text-right">
                    <span className={`${c.collaboration_score >= 0.80 ? "text-accent" : c.collaboration_score >= 0.70 ? "text-[hsl(40_90%_55%)]" : "text-destructive"}`}>
                      {Math.round(c.collaboration_score * 100)}%
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
