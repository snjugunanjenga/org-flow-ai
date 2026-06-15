import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useOrgId } from "@/hooks/use-org-id";
import { useAuth } from "@/contexts/AuthContext";
import { FolderKanban, CheckCircle, Clock, Pause, ArrowUpRight, Plus, Pencil, Trash2 } from "lucide-react";
import { format } from "date-fns";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { FileUploadButton } from "@/components/dashboard/FileUploadButton";
import { PlanMilestoneRow, type PlanMilestone } from "@/components/dashboard/PlanMilestoneRow";

interface Project {
  id: string;
  name: string;
  description: string | null;
  status: string;
  progress: number;
  owner_name: string | null;
  team_name: string | null;
  target_date: string | null;
  start_date: string | null;
  created_at: string;
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

interface Attachment {
  id: string;
  file_name: string;
  file_url: string;
  file_type: string | null;
  created_at: string;
}

const statusConfig: Record<string, { icon: any; color: string; label: string }> = {
  active: { icon: ArrowUpRight, color: "text-accent", label: "Active" },
  on_hold: { icon: Pause, color: "text-[hsl(40_90%_55%)]", label: "On Hold" },
  completed: { icon: CheckCircle, color: "text-accent", label: "Completed" },
};

export default function ProjectsView() {
  const orgId = useOrgId();
  const { user } = useAuth();
  const { toast } = useToast();
  const [projects, setProjects] = useState<Project[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [updates, setUpdates] = useState<Update[]>([]);
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [milestones, setMilestones] = useState<PlanMilestone[]>([]);
  const [selectedProject, setSelectedProject] = useState<string | null>(null);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [showCreateTask, setShowCreateTask] = useState(false);
  const [showCreateProject, setShowCreateProject] = useState(false);
  const [showEditProject, setShowEditProject] = useState(false);
  const [showProjectDetail, setShowProjectDetail] = useState(false);
  const [taskForm, setTaskForm] = useState({ title: "", assignee_name: "", priority: "medium", status: "todo" });
  const [projectForm, setProjectForm] = useState({ name: "", description: "", status: "active", progress: 0, owner_name: "", team_name: "", target_date: "", start_date: "" });

  const loadData = async () => {
    if (!orgId) return;
    const [{ data: p }, { data: t }, { data: u }, { data: m }] = await Promise.all([
      supabase.from("projects").select("*").eq("org_id", orgId).order("created_at", { ascending: false }),
      supabase.from("project_tasks").select("*").eq("org_id", orgId),
      supabase.from("project_updates").select("*").eq("org_id", orgId).order("created_at", { ascending: false }),
      supabase.from("project_milestones").select("id,name,status,target_date,project_id").eq("org_id", orgId).order("target_date", { ascending: true, nullsFirst: false }),
    ]);
    setProjects((p as Project[]) || []);
    setTasks(t || []);
    setUpdates(u || []);
    setMilestones(((m as any[]) || []) as any);
    if (!selectedProject && p && p.length > 0) setSelectedProject(p[0].id);
  };

  const loadAttachments = async () => {
    if (!orgId || !selectedProject) return;
    const { data } = await supabase.from("document_attachments").select("*").eq("resource_type", "project").eq("resource_id", selectedProject);
    setAttachments((data as Attachment[]) || []);
  };

  useEffect(() => { loadData(); }, [orgId]);
  useEffect(() => { loadAttachments(); }, [selectedProject]);

  const selectedTasks = tasks.filter(t => t.project_id === selectedProject);
  const selectedUpdates = updates.filter(u => u.project_id === selectedProject);
  const selectedMilestones = (milestones as any[]).filter(m => m.project_id === selectedProject);
  const project = projects.find(p => p.id === selectedProject);

  const tasksByStatus = {
    done: selectedTasks.filter(t => t.status === "done"),
    in_progress: selectedTasks.filter(t => t.status === "in_progress"),
    todo: selectedTasks.filter(t => t.status === "todo"),
  };

  const handleCreateTask = async () => {
    if (!orgId || !selectedProject || !taskForm.title.trim()) return;
    const { error } = await supabase.from("project_tasks").insert({
      org_id: orgId, project_id: selectedProject, title: taskForm.title.trim(),
      assignee_name: taskForm.assignee_name.trim() || null, priority: taskForm.priority, status: taskForm.status,
    });
    if (error) { toast({ variant: "destructive", title: "Error", description: error.message }); return; }
    toast({ title: "Task created" });
    setShowCreateTask(false);
    setTaskForm({ title: "", assignee_name: "", priority: "medium", status: "todo" });
    loadData();
  };

  const handleUpdateTaskStatus = async (taskId: string, newStatus: string) => {
    await supabase.from("project_tasks").update({ status: newStatus }).eq("id", taskId);
    loadData();
  };

  const handleUpdateTask = async () => {
    if (!selectedTask) return;
    await supabase.from("project_tasks").update({
      title: taskForm.title.trim(), assignee_name: taskForm.assignee_name.trim() || null,
      priority: taskForm.priority, status: taskForm.status,
    }).eq("id", selectedTask.id);
    toast({ title: "Task updated" });
    setSelectedTask(null);
    loadData();
  };

  const handleDeleteTask = async (taskId: string) => {
    await supabase.from("project_tasks").delete().eq("id", taskId);
    toast({ title: "Task deleted" });
    setSelectedTask(null);
    loadData();
  };

  const handleUpdateProjectProgress = async (projectId: string, progress: number) => {
    await supabase.from("projects").update({ progress }).eq("id", projectId);
    loadData();
  };

  const handleCreateProject = async () => {
    if (!orgId || !projectForm.name.trim()) return;
    const { error } = await supabase.from("projects").insert({
      org_id: orgId, name: projectForm.name.trim(), description: projectForm.description.trim() || null,
      status: projectForm.status, progress: projectForm.progress,
      owner_name: projectForm.owner_name.trim() || null, team_name: projectForm.team_name.trim() || null,
      target_date: projectForm.target_date || null, start_date: projectForm.start_date || null,
    });
    if (error) { toast({ variant: "destructive", title: "Error", description: error.message }); return; }
    toast({ title: "Project created" });
    setShowCreateProject(false);
    resetProjectForm();
    loadData();
  };

  const handleUpdateProject = async () => {
    if (!selectedProject) return;
    await supabase.from("projects").update({
      name: projectForm.name.trim(), description: projectForm.description.trim() || null,
      status: projectForm.status, progress: projectForm.progress,
      owner_name: projectForm.owner_name.trim() || null, team_name: projectForm.team_name.trim() || null,
      target_date: projectForm.target_date || null, start_date: projectForm.start_date || null,
    }).eq("id", selectedProject);
    toast({ title: "Project updated" });
    setShowEditProject(false);
    loadData();
  };

  const handleDeleteProject = async (id: string) => {
    // Delete tasks first, then project
    await supabase.from("project_tasks").delete().eq("project_id", id);
    await supabase.from("project_updates").delete().eq("project_id", id);
    await supabase.from("projects").delete().eq("id", id);
    toast({ title: "Project deleted" });
    setSelectedProject(null);
    setShowProjectDetail(false);
    loadData();
  };

  const resetProjectForm = () => setProjectForm({ name: "", description: "", status: "active", progress: 0, owner_name: "", team_name: "", target_date: "", start_date: "" });

  const openEditProject = () => {
    if (!project) return;
    setProjectForm({
      name: project.name, description: project.description || "", status: project.status,
      progress: project.progress, owner_name: project.owner_name || "", team_name: project.team_name || "",
      target_date: project.target_date || "", start_date: project.start_date || "",
    });
    setShowEditProject(true);
  };

  const openEditTask = (task: Task) => {
    setTaskForm({ title: task.title, assignee_name: task.assignee_name || "", priority: task.priority, status: task.status });
    setSelectedTask(task);
  };

  const statusLabels: Record<string, string> = { todo: "To Do", in_progress: "In Progress", done: "Done" };
  const nextStatus: Record<string, string> = { todo: "in_progress", in_progress: "done", done: "todo" };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold font-display">Projects</h1>
          <p className="text-muted-foreground mt-1">Track projects with AI-generated updates and milestone tracking.</p>
        </div>
        <div className="flex gap-2">
          <Button size="sm" onClick={() => { resetProjectForm(); setShowCreateProject(true); }}><Plus className="h-4 w-4 mr-1" /> New Project</Button>
          {project && <Button variant="outline" size="sm" onClick={openEditProject}><Pencil className="h-4 w-4 mr-1" /> Edit</Button>}
        </div>
      </div>

      {/* Project cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {projects.map(p => {
          const config = statusConfig[p.status] || statusConfig.active;
          const Icon = config.icon;
          return (
            <div key={p.id} className={`glass-panel p-5 transition-all cursor-pointer ${selectedProject === p.id ? "glass-panel-glow ring-1 ring-primary/30" : "hover:bg-muted/30"}`}>
              <div onClick={() => setSelectedProject(p.id)}>
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
              </div>
              <button onClick={() => { setSelectedProject(p.id); setShowProjectDetail(true); }} className="text-[10px] text-primary mt-2 hover:underline block">View Details →</button>
            </div>
          );
        })}
      </div>

      {/* Project detail */}
      {project && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 glass-panel p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold font-display">Tasks ({selectedTasks.length})</h3>
              <Button size="sm" variant="outline" onClick={() => { setTaskForm({ title: "", assignee_name: "", priority: "medium", status: "todo" }); setShowCreateTask(true); }}>
                <Plus className="h-4 w-4 mr-1" /> Add Task
              </Button>
            </div>
            <div className="grid grid-cols-3 gap-4">
              {(["todo", "in_progress", "done"] as const).map(status => (
                <div key={status}>
                  <h4 className="text-xs font-semibold uppercase text-muted-foreground mb-3">
                    {statusLabels[status]} ({tasksByStatus[status].length})
                  </h4>
                  <div className="space-y-2">
                    {tasksByStatus[status].map(task => (
                      <div
                        key={task.id}
                        className={`p-3 rounded-lg border border-border/50 ${status === "done" ? "opacity-60" : ""} bg-card/40 cursor-pointer hover:ring-1 hover:ring-primary/30 transition-all`}
                        onClick={() => openEditTask(task)}
                      >
                        <p className="text-xs font-medium">{task.title}</p>
                        {task.assignee_name && <p className="text-[10px] text-muted-foreground mt-1">{task.assignee_name}</p>}
                        <div className="flex items-center justify-between mt-1">
                          <span className={`text-[10px] px-1 rounded ${task.priority === "high" ? "bg-destructive/10 text-destructive" : task.priority === "low" ? "bg-muted text-muted-foreground" : "bg-primary/10 text-primary"}`}>{task.priority}</span>
                          <button className="text-[10px] text-primary hover:underline" onClick={(e) => { e.stopPropagation(); handleUpdateTaskStatus(task.id, nextStatus[task.status]); }}>
                            → {statusLabels[nextStatus[task.status]]}
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-6 pt-4 border-t border-border/30">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Project Progress</span>
                <span className="text-sm text-muted-foreground">{project.progress}%</span>
              </div>
              <input type="range" min="0" max="100" value={project.progress}
                onChange={e => handleUpdateProjectProgress(project.id, parseInt(e.target.value))}
                className="w-full accent-primary" />
            </div>
            <div className="mt-4 pt-4 border-t border-border/30">
              <h4 className="text-sm font-semibold mb-2">Attachments</h4>
              <FileUploadButton resourceType="project" resourceId={project.id} attachments={attachments} onUpload={loadAttachments} />
            </div>
          </div>
          <div className="glass-panel p-6">
            <h3 className="text-lg font-semibold font-display mb-3">Milestones ({selectedMilestones.length})</h3>
            <p className="text-[11px] text-muted-foreground mb-3">
              Coordinator-proposed milestones. Accept to commit, Skip to dismiss — both are logged for the Critic.
            </p>
            <div className="space-y-2 mb-6">
              {selectedMilestones.length === 0 && (
                <p className="text-xs text-muted-foreground">No milestones yet for this project.</p>
              )}
              {selectedMilestones.map((m: any) => (
                <PlanMilestoneRow key={m.id} milestone={m} onChange={loadData} />
              ))}
            </div>
            <h3 className="text-lg font-semibold font-display mb-4">AI Updates</h3>
            <div className="space-y-4">
              {selectedUpdates.map(u => (
                <div key={u.id} className="border-l-2 border-primary/30 pl-3">
                  <p className="text-xs text-muted-foreground">{u.content}</p>
                  <span className="text-[10px] text-muted-foreground/60 mt-1 block">{format(new Date(u.created_at), "MMM d, yyyy")}</span>
                </div>
              ))}
              {selectedUpdates.length === 0 && <p className="text-xs text-muted-foreground">No updates yet.</p>}
            </div>
          </div>
        </div>
      )}

      {/* Project detail dialog */}
      <Dialog open={showProjectDetail} onOpenChange={setShowProjectDetail}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>{project?.name}</DialogTitle></DialogHeader>
          {project && (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">{project.description || "No description."}</p>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div><span className="text-muted-foreground">Status:</span> <span className="capitalize ml-1">{project.status}</span></div>
                <div><span className="text-muted-foreground">Progress:</span> <span className="ml-1">{project.progress}%</span></div>
                <div><span className="text-muted-foreground">Owner:</span> <span className="ml-1">{project.owner_name || "Unassigned"}</span></div>
                <div><span className="text-muted-foreground">Team:</span> <span className="ml-1">{project.team_name || "None"}</span></div>
                {project.start_date && <div><span className="text-muted-foreground">Start:</span> <span className="ml-1">{format(new Date(project.start_date), "PPP")}</span></div>}
                {project.target_date && <div><span className="text-muted-foreground">Target:</span> <span className="ml-1">{format(new Date(project.target_date), "PPP")}</span></div>}
                <div><span className="text-muted-foreground">Tasks:</span> <span className="ml-1">{selectedTasks.length} ({tasksByStatus.done.length} done)</span></div>
                <div><span className="text-muted-foreground">Created:</span> <span className="ml-1">{format(new Date(project.created_at), "PPP")}</span></div>
              </div>
              <Progress value={project.progress} className="h-2" />
              <div className="flex gap-2 pt-2">
                <Button variant="outline" size="sm" onClick={() => { setShowProjectDetail(false); openEditProject(); }}><Pencil className="h-3 w-3 mr-1" /> Edit</Button>
                <Button variant="destructive" size="sm" onClick={() => handleDeleteProject(project.id)}><Trash2 className="h-3 w-3 mr-1" /> Delete</Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Task Detail/Edit Dialog */}
      <Dialog open={!!selectedTask} onOpenChange={() => setSelectedTask(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Edit Task</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Title</label>
              <Input value={taskForm.title} onChange={e => setTaskForm({ ...taskForm, title: e.target.value })} className="bg-secondary/50" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Assignee</label>
              <Input value={taskForm.assignee_name} onChange={e => setTaskForm({ ...taskForm, assignee_name: e.target.value })} className="bg-secondary/50" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <label className="text-sm font-medium">Status</label>
                <Select value={taskForm.status} onValueChange={v => setTaskForm({ ...taskForm, status: v })}>
                  <SelectTrigger className="bg-secondary/50"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todo">To Do</SelectItem>
                    <SelectItem value="in_progress">In Progress</SelectItem>
                    <SelectItem value="done">Done</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Priority</label>
                <Select value={taskForm.priority} onValueChange={v => setTaskForm({ ...taskForm, priority: v })}>
                  <SelectTrigger className="bg-secondary/50"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="low">Low</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex gap-2">
              <Button className="flex-1" onClick={handleUpdateTask}>Update Task</Button>
              <Button variant="destructive" size="icon" onClick={() => selectedTask && handleDeleteTask(selectedTask.id)}><Trash2 className="h-4 w-4" /></Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Create Task Dialog */}
      <Dialog open={showCreateTask} onOpenChange={setShowCreateTask}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>New Task</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Title</label>
              <Input value={taskForm.title} onChange={e => setTaskForm({ ...taskForm, title: e.target.value })} placeholder="Task title" className="bg-secondary/50" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Assignee</label>
              <Input value={taskForm.assignee_name} onChange={e => setTaskForm({ ...taskForm, assignee_name: e.target.value })} placeholder="Assignee name" className="bg-secondary/50" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <label className="text-sm font-medium">Priority</label>
                <Select value={taskForm.priority} onValueChange={v => setTaskForm({ ...taskForm, priority: v })}>
                  <SelectTrigger className="bg-secondary/50"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="low">Low</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Status</label>
                <Select value={taskForm.status} onValueChange={v => setTaskForm({ ...taskForm, status: v })}>
                  <SelectTrigger className="bg-secondary/50"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todo">To Do</SelectItem>
                    <SelectItem value="in_progress">In Progress</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <Button className="w-full" onClick={handleCreateTask}>Create Task</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Create Project Dialog */}
      <Dialog open={showCreateProject} onOpenChange={setShowCreateProject}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>New Project</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Name</label>
              <Input value={projectForm.name} onChange={e => setProjectForm({ ...projectForm, name: e.target.value })} placeholder="Project name" className="bg-secondary/50" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Description</label>
              <Textarea value={projectForm.description} onChange={e => setProjectForm({ ...projectForm, description: e.target.value })} placeholder="Describe the project..." className="bg-secondary/50" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <label className="text-sm font-medium">Owner</label>
                <Input value={projectForm.owner_name} onChange={e => setProjectForm({ ...projectForm, owner_name: e.target.value })} placeholder="Owner name" className="bg-secondary/50" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Team</label>
                <Input value={projectForm.team_name} onChange={e => setProjectForm({ ...projectForm, team_name: e.target.value })} placeholder="Team name" className="bg-secondary/50" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <label className="text-sm font-medium">Start Date</label>
                <Input type="date" value={projectForm.start_date} onChange={e => setProjectForm({ ...projectForm, start_date: e.target.value })} className="bg-secondary/50" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Target Date</label>
                <Input type="date" value={projectForm.target_date} onChange={e => setProjectForm({ ...projectForm, target_date: e.target.value })} className="bg-secondary/50" />
              </div>
            </div>
            <Button className="w-full" onClick={handleCreateProject}>Create Project</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Project Dialog */}
      <Dialog open={showEditProject} onOpenChange={setShowEditProject}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Edit Project</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Name</label>
              <Input value={projectForm.name} onChange={e => setProjectForm({ ...projectForm, name: e.target.value })} className="bg-secondary/50" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Description</label>
              <Textarea value={projectForm.description} onChange={e => setProjectForm({ ...projectForm, description: e.target.value })} className="bg-secondary/50" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <label className="text-sm font-medium">Status</label>
                <Select value={projectForm.status} onValueChange={v => setProjectForm({ ...projectForm, status: v })}>
                  <SelectTrigger className="bg-secondary/50"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="on_hold">On Hold</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Progress</label>
                <Input type="number" min="0" max="100" value={projectForm.progress} onChange={e => setProjectForm({ ...projectForm, progress: parseInt(e.target.value) || 0 })} className="bg-secondary/50" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <label className="text-sm font-medium">Owner</label>
                <Input value={projectForm.owner_name} onChange={e => setProjectForm({ ...projectForm, owner_name: e.target.value })} className="bg-secondary/50" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Team</label>
                <Input value={projectForm.team_name} onChange={e => setProjectForm({ ...projectForm, team_name: e.target.value })} className="bg-secondary/50" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <label className="text-sm font-medium">Start Date</label>
                <Input type="date" value={projectForm.start_date} onChange={e => setProjectForm({ ...projectForm, start_date: e.target.value })} className="bg-secondary/50" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Target Date</label>
                <Input type="date" value={projectForm.target_date} onChange={e => setProjectForm({ ...projectForm, target_date: e.target.value })} className="bg-secondary/50" />
              </div>
            </div>
            <Button className="w-full" onClick={handleUpdateProject}>Update Project</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
