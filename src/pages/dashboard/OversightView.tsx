import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useOrgId } from "@/hooks/use-org-id";
import { Eye, TrendingUp, MessageSquare, CheckCircle, AlertTriangle, Target } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell, Legend } from "recharts";

interface CommLog {
  team_name: string;
  messages_count: number;
  avg_response_time_mins: number;
  sentiment_score: number;
  collaboration_score: number;
}

interface Project {
  id: string;
  name: string;
  status: string;
  progress: number;
  team_name: string | null;
}

interface Task {
  id: string;
  project_id: string;
  status: string;
  priority: string;
}

const COLORS = ["hsl(250, 80%, 60%)", "hsl(170, 70%, 45%)", "hsl(280, 70%, 60%)", "hsl(40, 90%, 55%)", "hsl(200, 80%, 55%)"];

export default function OversightView() {
  const orgId = useOrgId();
  const [logs, setLogs] = useState<CommLog[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);

  useEffect(() => {
    if (!orgId) return;
    Promise.all([
      supabase.from("communication_logs").select("*").eq("org_id", orgId),
      supabase.from("projects").select("id, name, status, progress, team_name").eq("org_id", orgId),
      supabase.from("project_tasks").select("id, project_id, status, priority").eq("org_id", orgId),
    ]).then(([{ data: cl }, { data: p }, { data: t }]) => {
      setLogs(cl || []);
      setProjects((p as Project[]) || []);
      setTasks(t || []);
    });
  }, [orgId]);

  const responseData = logs.map(l => ({ name: l.team_name, time: l.avg_response_time_mins }));

  // Project progress data
  const projectProgressData = projects.map(p => ({
    name: p.name.length > 15 ? p.name.slice(0, 15) + "..." : p.name,
    progress: p.progress,
    status: p.status,
  }));

  // Task status distribution
  const taskStatusCounts = { todo: 0, in_progress: 0, done: 0 };
  tasks.forEach(t => { if (t.status in taskStatusCounts) taskStatusCounts[t.status as keyof typeof taskStatusCounts]++; });
  const taskPieData = [
    { name: "To Do", value: taskStatusCounts.todo },
    { name: "In Progress", value: taskStatusCounts.in_progress },
    { name: "Done", value: taskStatusCounts.done },
  ].filter(d => d.value > 0);

  // Tasks per project
  const tasksPerProject = projects.map(p => {
    const projectTasks = tasks.filter(t => t.project_id === p.id);
    return {
      name: p.name.length > 12 ? p.name.slice(0, 12) + "..." : p.name,
      todo: projectTasks.filter(t => t.status === "todo").length,
      in_progress: projectTasks.filter(t => t.status === "in_progress").length,
      done: projectTasks.filter(t => t.status === "done").length,
    };
  });

  // Risk indicators
  const risks = projects.filter(p => p.progress < 30 && p.status === "active").map(p => ({
    project: p.name,
    risk: "Low progress",
    severity: "high",
  }));
  const blockedTasks = tasks.filter(t => t.priority === "high" && t.status === "todo");
  if (blockedTasks.length > 2) risks.push({ project: "Multiple", risk: `${blockedTasks.length} high-priority tasks pending`, severity: "medium" });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold font-display">Manager Oversight</h1>
        <p className="text-muted-foreground mt-1">Team progression, task analytics, and risk identification.</p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="glass-panel p-5">
          <Target className="h-5 w-5 text-primary mb-2" />
          <p className="text-2xl font-bold">{projects.length}</p>
          <p className="text-xs text-muted-foreground">Active Projects</p>
        </div>
        <div className="glass-panel p-5">
          <CheckCircle className="h-5 w-5 text-accent mb-2" />
          <p className="text-2xl font-bold">{taskStatusCounts.done}</p>
          <p className="text-xs text-muted-foreground">Tasks Completed</p>
        </div>
        <div className="glass-panel p-5">
          <TrendingUp className="h-5 w-5 text-primary mb-2" />
          <p className="text-2xl font-bold">{tasks.length > 0 ? Math.round((taskStatusCounts.done / tasks.length) * 100) : 0}%</p>
          <p className="text-xs text-muted-foreground">Completion Rate</p>
        </div>
        <div className="glass-panel p-5">
          <AlertTriangle className="h-5 w-5 text-destructive mb-2" />
          <p className="text-2xl font-bold">{risks.length}</p>
          <p className="text-xs text-muted-foreground">Risk Alerts</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Project progress */}
        <div className="glass-panel p-6">
          <h3 className="text-lg font-semibold font-display mb-4">Project Progress</h3>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={projectProgressData} layout="vertical">
              <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" unit="%" />
              <YAxis dataKey="name" type="category" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" width={120} />
              <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }} formatter={(v: number) => `${v}%`} />
              <Bar dataKey="progress" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Task distribution */}
        <div className="glass-panel p-6">
          <h3 className="text-lg font-semibold font-display mb-4">Task Status Distribution</h3>
          <ResponsiveContainer width="100%" height={260}>
            <PieChart>
              <Pie data={taskPieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={90} label={({ name, value }) => `${name}: ${value}`}>
                {taskPieData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Pie>
              <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }} />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Tasks per project stacked */}
        <div className="glass-panel p-6">
          <h3 className="text-lg font-semibold font-display mb-4">Tasks by Project</h3>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={tasksPerProject}>
              <XAxis dataKey="name" tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" />
              <YAxis tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
              <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }} />
              <Legend />
              <Bar dataKey="done" stackId="a" fill="hsl(170, 70%, 45%)" name="Done" />
              <Bar dataKey="in_progress" stackId="a" fill="hsl(250, 80%, 60%)" name="In Progress" />
              <Bar dataKey="todo" stackId="a" fill="hsl(var(--muted-foreground))" name="To Do" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Response time */}
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
      </div>

      {/* Risk alerts */}
      {risks.length > 0 && (
        <div className="glass-panel p-6">
          <h3 className="text-lg font-semibold font-display mb-4 flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-destructive" /> Risk Alerts
          </h3>
          <div className="space-y-3">
            {risks.map((r, i) => (
              <div key={i} className="flex items-center justify-between py-2 border-b border-border/30 last:border-0">
                <div>
                  <p className="text-sm font-medium">{r.project}</p>
                  <p className="text-xs text-muted-foreground">{r.risk}</p>
                </div>
                <span className={`text-xs px-2 py-1 rounded ${r.severity === "high" ? "bg-destructive/10 text-destructive" : "bg-[hsl(40_90%_55%)]/10 text-[hsl(40_90%_55%)]"}`}>
                  {r.severity}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Team Health */}
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
  );
}
