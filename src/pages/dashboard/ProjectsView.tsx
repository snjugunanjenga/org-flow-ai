import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useOrgId } from "@/hooks/use-org-id";
import { FolderKanban, CheckCircle, Clock, Pause, ArrowUpRight } from "lucide-react";
import { format } from "date-fns";
import { Progress } from "@/components/ui/progress";

interface Project {
  id: string;
  name: string;
  description: string | null;
  status: string;
  progress: number;
  owner_name: string | null;
  team_name: string | null;
  target_date: string | null;
}

interface Task {
  id: string;
  project_id: string;
  title: string;
  assignee_name: string | null;
  status: string;
  priority: string;
}

interface Update {
  id: string;
  project_id: string;
  content: string;
  created_at: string;
}

const statusConfig: Record<string, { icon: any; color: string; label: string }> = {
  active: { icon: ArrowUpRight, color: "text-accent", label: "Active" },
  on_hold: { icon: Pause, color: "text-[hsl(40_90%_55%)]", label: "On Hold" },
  completed: { icon: CheckCircle, color: "text-accent", label: "Completed" },
};

export default function ProjectsView() {
  const orgId = useOrgId();
  const [projects, setProjects] = useState<Project[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [updates, setUpdates] = useState<Update[]>([]);
  const [selectedProject, setSelectedProject] = useState<string | null>(null);

  useEffect(() => {
    if (!orgId) return;
    Promise.all([
      supabase.from("projects").select("*").eq("org_id", orgId).order("created_at", { ascending: false }),
      supabase.from("project_tasks").select("*").eq("org_id", orgId),
      supabase.from("project_updates").select("*").eq("org_id", orgId).order("created_at", { ascending: false }),
    ]).then(([{ data: p }, { data: t }, { data: u }]) => {
      setProjects(p || []);
      setTasks(t || []);
      setUpdates(u || []);
      if (p && p.length > 0) setSelectedProject(p[0].id);
    });
  }, [orgId]);

  const selectedTasks = tasks.filter(t => t.project_id === selectedProject);
  const selectedUpdates = updates.filter(u => u.project_id === selectedProject);
  const project = projects.find(p => p.id === selectedProject);

  const tasksByStatus = {
    done: selectedTasks.filter(t => t.status === "done"),
    in_progress: selectedTasks.filter(t => t.status === "in_progress"),
    todo: selectedTasks.filter(t => t.status === "todo"),
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold font-display">Projects</h1>
        <p className="text-muted-foreground mt-1">Track projects with AI-generated updates and milestone tracking.</p>
      </div>

      {/* Project cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {projects.map(p => {
          const config = statusConfig[p.status] || statusConfig.active;
          const Icon = config.icon;
          return (
            <button
              key={p.id}
              onClick={() => setSelectedProject(p.id)}
              className={`glass-panel p-5 text-left transition-all ${selectedProject === p.id ? "glass-panel-glow ring-1 ring-primary/30" : "hover:bg-muted/30"}`}
            >
              <div className="flex items-center justify-between mb-3">
                <Icon className={`h-5 w-5 ${config.color}`} />
                <span className={`text-[10px] px-1.5 py-0.5 rounded ${config.color} bg-current/10`}>{config.label}</span>
              </div>
              <h3 className="text-sm font-semibold font-display mb-1">{p.name}</h3>
              <p className="text-xs text-muted-foreground mb-3 line-clamp-2">{p.description}</p>
              <Progress value={p.progress} className="h-1.5" />
              <div className="flex items-center justify-between mt-2">
                <span className="text-[10px] text-muted-foreground">{p.progress}%</span>
                {p.target_date && <span className="text-[10px] text-muted-foreground">{format(new Date(p.target_date), "MMM d")}</span>}
              </div>
            </button>
          );
        })}
      </div>

      {/* Project detail */}
      {project && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Tasks */}
          <div className="lg:col-span-2 glass-panel p-6">
            <h3 className="text-lg font-semibold font-display mb-4">Tasks ({selectedTasks.length})</h3>
            <div className="grid grid-cols-3 gap-4">
              {(["todo", "in_progress", "done"] as const).map(status => (
                <div key={status}>
                  <h4 className="text-xs font-semibold uppercase text-muted-foreground mb-3">
                    {status === "in_progress" ? "In Progress" : status === "todo" ? "To Do" : "Done"} ({tasksByStatus[status].length})
                  </h4>
                  <div className="space-y-2">
                    {tasksByStatus[status].map(task => (
                      <div key={task.id} className={`p-3 rounded-lg border border-border/50 ${status === "done" ? "opacity-60" : ""} bg-card/40`}>
                        <p className="text-xs font-medium">{task.title}</p>
                        {task.assignee_name && (
                          <p className="text-[10px] text-muted-foreground mt-1">{task.assignee_name}</p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Updates */}
          <div className="glass-panel p-6">
            <h3 className="text-lg font-semibold font-display mb-4">AI Updates</h3>
            <div className="space-y-4">
              {selectedUpdates.map(u => (
                <div key={u.id} className="border-l-2 border-primary/30 pl-3">
                  <p className="text-xs text-muted-foreground">{u.content}</p>
                  <span className="text-[10px] text-muted-foreground/60 mt-1 block">
                    {format(new Date(u.created_at), "MMM d, yyyy")}
                  </span>
                </div>
              ))}
              {selectedUpdates.length === 0 && (
                <p className="text-xs text-muted-foreground">No updates yet.</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
