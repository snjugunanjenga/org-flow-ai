import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useOrgId } from "@/hooks/use-org-id";
import { AlertTriangle, CheckCircle, Clock, XCircle, ArrowUpRight, Plus, Pencil, Trash2, X } from "lucide-react";
import { format } from "date-fns";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";

interface Topic {
  id: string;
  title: string;
  description: string | null;
  category: string;
  status: string;
  priority: string;
  owner_name: string | null;
  created_at: string;
}

interface Conflict {
  id: string;
  title: string;
  description: string;
  severity: string;
  status: string;
  parties: string[];
  resolution: string | null;
  created_at: string;
}

const priorityColors: Record<string, string> = {
  critical: "bg-destructive/10 text-destructive border-destructive/20",
  high: "bg-[hsl(40_90%_55%)]/10 text-[hsl(40_90%_55%)] border-[hsl(40_90%_55%)]/20",
  medium: "bg-primary/10 text-primary border-primary/20",
  low: "bg-muted text-muted-foreground border-border",
};

const statusIcons: Record<string, any> = {
  active: ArrowUpRight,
  in_review: Clock,
  blocked: XCircle,
  deferred: Clock,
  resolved: CheckCircle,
  completed: CheckCircle,
};

const severityColors: Record<string, string> = {
  critical: "border-l-destructive bg-destructive/5",
  high: "border-l-[hsl(40_90%_55%)] bg-[hsl(40_90%_55%)]/5",
  medium: "border-l-primary bg-primary/5",
  low: "border-l-muted-foreground bg-muted/50",
};

export default function TopicsView() {
  const orgId = useOrgId();
  const { user } = useAuth();
  const { toast } = useToast();
  const [topics, setTopics] = useState<Topic[]>([]);
  const [conflicts, setConflicts] = useState<Conflict[]>([]);
  const [selectedTopic, setSelectedTopic] = useState<Topic | null>(null);
  const [selectedConflict, setSelectedConflict] = useState<Conflict | null>(null);
  const [showCreateTopic, setShowCreateTopic] = useState(false);
  const [editTopic, setEditTopic] = useState<Topic | null>(null);
  const [form, setForm] = useState({ title: "", description: "", category: "decision", priority: "medium", owner_name: "" });

  const loadData = async () => {
    if (!orgId) return;
    const [{ data: t }, { data: c }] = await Promise.all([
      supabase.from("topics").select("*").eq("org_id", orgId).order("created_at", { ascending: false }),
      supabase.from("conflicts").select("*").eq("org_id", orgId).order("created_at", { ascending: false }),
    ]);
    setTopics(t || []);
    setConflicts(c || []);
  };

  useEffect(() => { loadData(); }, [orgId]);

  const handleCreateTopic = async () => {
    if (!orgId || !form.title.trim()) return;
    const { error } = await supabase.from("topics").insert({
      org_id: orgId,
      title: form.title.trim(),
      description: form.description.trim() || null,
      category: form.category,
      priority: form.priority,
      owner_name: form.owner_name.trim() || null,
    });
    if (error) { toast({ variant: "destructive", title: "Error", description: error.message }); return; }
    toast({ title: "Topic created" });
    setShowCreateTopic(false);
    setForm({ title: "", description: "", category: "decision", priority: "medium", owner_name: "" });
    loadData();
  };

  const handleUpdateTopic = async () => {
    if (!editTopic) return;
    const { error } = await supabase.from("topics").update({
      title: form.title.trim(),
      description: form.description.trim() || null,
      category: form.category,
      priority: form.priority,
      owner_name: form.owner_name.trim() || null,
    }).eq("id", editTopic.id);
    if (error) { toast({ variant: "destructive", title: "Error", description: error.message }); return; }
    toast({ title: "Topic updated" });
    setEditTopic(null);
    loadData();
  };

  const handleDeleteTopic = async (id: string) => {
    // Topics table doesn't allow delete via RLS, so update status instead
    const { error } = await supabase.from("topics").update({ status: "completed" }).eq("id", id);
    if (error) { toast({ variant: "destructive", title: "Error", description: error.message }); return; }
    toast({ title: "Topic archived" });
    setSelectedTopic(null);
    loadData();
  };

  const handleResolveConflict = async (id: string, resolution: string) => {
    const { error } = await supabase.from("conflicts").update({ status: "resolved", resolution }).eq("id", id);
    if (error) { toast({ variant: "destructive", title: "Error", description: error.message }); return; }
    toast({ title: "Conflict resolved" });
    setSelectedConflict(null);
    loadData();
  };

  const openEdit = (topic: Topic) => {
    setForm({ title: topic.title, description: topic.description || "", category: topic.category, priority: topic.priority, owner_name: topic.owner_name || "" });
    setEditTopic(topic);
  };

  const openCreate = () => {
    setForm({ title: "", description: "", category: "decision", priority: "medium", owner_name: "" });
    setShowCreateTopic(true);
  };

  const openConflicts = conflicts.filter(c => c.status === "open");
  const resolvedConflicts = conflicts.filter(c => c.status === "resolved");

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold font-display">Topics & Decisions</h1>
          <p className="text-muted-foreground mt-1">Tracked decisions, extracted topics, and conflict detection.</p>
        </div>
        <Button onClick={openCreate} size="sm"><Plus className="h-4 w-4 mr-1" /> New Topic</Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Topics */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold font-display">Active Topics ({topics.length})</h3>
          <div className="space-y-3">
            {topics.map(topic => {
              const StatusIcon = statusIcons[topic.status] || Clock;
              return (
                <button key={topic.id} onClick={() => setSelectedTopic(topic)} className="glass-panel p-4 w-full text-left hover:ring-1 hover:ring-primary/30 transition-all cursor-pointer">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <StatusIcon className="h-4 w-4 text-muted-foreground shrink-0" />
                        <h4 className="text-sm font-semibold truncate">{topic.title}</h4>
                      </div>
                      <p className="text-xs text-muted-foreground line-clamp-2">{topic.description}</p>
                      <div className="flex items-center gap-2 mt-2">
                        <span className={`text-[10px] px-1.5 py-0.5 rounded border ${priorityColors[topic.priority] || priorityColors.medium}`}>{topic.priority}</span>
                        <span className="text-[10px] text-muted-foreground capitalize">{topic.category}</span>
                        {topic.owner_name && <span className="text-[10px] text-muted-foreground">· {topic.owner_name}</span>}
                      </div>
                    </div>
                    <span className="text-[10px] text-muted-foreground shrink-0">{format(new Date(topic.created_at), "MMM d")}</span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Conflicts */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold font-display flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-destructive" /> Conflicts ({openConflicts.length} open)
          </h3>
          <div className="space-y-3">
            {openConflicts.map(c => (
              <button key={c.id} onClick={() => setSelectedConflict(c)} className={`glass-panel p-4 border-l-4 w-full text-left hover:ring-1 hover:ring-primary/30 transition-all cursor-pointer ${severityColors[c.severity] || severityColors.medium}`}>
                <h4 className="text-sm font-semibold mb-1">{c.title}</h4>
                <p className="text-xs text-muted-foreground mb-2">{c.description}</p>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-destructive/10 text-destructive uppercase">{c.severity}</span>
                  <span className="text-[10px] text-muted-foreground">{c.parties?.join(" vs ")}</span>
                </div>
              </button>
            ))}
            {resolvedConflicts.length > 0 && (
              <>
                <h4 className="text-sm font-semibold text-muted-foreground mt-4">Resolved</h4>
                {resolvedConflicts.map(c => (
                  <button key={c.id} onClick={() => setSelectedConflict(c)} className="glass-panel p-4 opacity-60 w-full text-left hover:opacity-80 transition-all cursor-pointer">
                    <div className="flex items-center gap-2 mb-1">
                      <CheckCircle className="h-4 w-4 text-accent" />
                      <h4 className="text-sm font-semibold">{c.title}</h4>
                    </div>
                    <p className="text-xs text-muted-foreground">{c.resolution}</p>
                  </button>
                ))}
              </>
            )}
          </div>
        </div>
      </div>

      {/* Topic Detail Dialog */}
      <Dialog open={!!selectedTopic} onOpenChange={() => setSelectedTopic(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>{selectedTopic?.title}</DialogTitle></DialogHeader>
          {selectedTopic && (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">{selectedTopic.description || "No description."}</p>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div><span className="text-muted-foreground">Category:</span> <span className="capitalize ml-1">{selectedTopic.category}</span></div>
                <div><span className="text-muted-foreground">Priority:</span> <span className={`ml-1 px-1.5 py-0.5 rounded text-xs border ${priorityColors[selectedTopic.priority]}`}>{selectedTopic.priority}</span></div>
                <div><span className="text-muted-foreground">Status:</span> <span className="capitalize ml-1">{selectedTopic.status}</span></div>
                <div><span className="text-muted-foreground">Owner:</span> <span className="ml-1">{selectedTopic.owner_name || "Unassigned"}</span></div>
                <div className="col-span-2"><span className="text-muted-foreground">Created:</span> <span className="ml-1">{format(new Date(selectedTopic.created_at), "PPP")}</span></div>
              </div>
              <div className="flex gap-2 pt-2">
                <Button variant="outline" size="sm" onClick={() => { openEdit(selectedTopic); setSelectedTopic(null); }}><Pencil className="h-3 w-3 mr-1" /> Edit</Button>
                <Button variant="destructive" size="sm" onClick={() => handleDeleteTopic(selectedTopic.id)}><Trash2 className="h-3 w-3 mr-1" /> Archive</Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Conflict Detail Dialog */}
      <Dialog open={!!selectedConflict} onOpenChange={() => setSelectedConflict(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>{selectedConflict?.title}</DialogTitle></DialogHeader>
          {selectedConflict && (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">{selectedConflict.description}</p>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div><span className="text-muted-foreground">Severity:</span> <span className="uppercase ml-1 text-destructive">{selectedConflict.severity}</span></div>
                <div><span className="text-muted-foreground">Status:</span> <span className="capitalize ml-1">{selectedConflict.status}</span></div>
                <div className="col-span-2"><span className="text-muted-foreground">Parties:</span> <span className="ml-1">{selectedConflict.parties?.join(", ")}</span></div>
                {selectedConflict.resolution && <div className="col-span-2"><span className="text-muted-foreground">Resolution:</span> <span className="ml-1">{selectedConflict.resolution}</span></div>}
              </div>
              {selectedConflict.status === "open" && (
                <div className="space-y-2 pt-2">
                  <Textarea id="resolution" placeholder="Enter resolution..." className="bg-secondary/50" onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      handleResolveConflict(selectedConflict.id, (e.target as HTMLTextAreaElement).value);
                    }
                  }} />
                  <Button size="sm" onClick={() => {
                    const el = document.getElementById("resolution") as HTMLTextAreaElement;
                    if (el?.value) handleResolveConflict(selectedConflict.id, el.value);
                  }}><CheckCircle className="h-3 w-3 mr-1" /> Resolve</Button>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Create/Edit Topic Dialog */}
      <Dialog open={showCreateTopic || !!editTopic} onOpenChange={() => { setShowCreateTopic(false); setEditTopic(null); }}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>{editTopic ? "Edit Topic" : "New Topic"}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Title</label>
              <Input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="Topic title" className="bg-secondary/50" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Description</label>
              <Textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="Describe the topic..." className="bg-secondary/50" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <label className="text-sm font-medium">Category</label>
                <Select value={form.category} onValueChange={v => setForm({ ...form, category: v })}>
                  <SelectTrigger className="bg-secondary/50"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="decision">Decision</SelectItem>
                    <SelectItem value="strategy">Strategy</SelectItem>
                    <SelectItem value="technical">Technical</SelectItem>
                    <SelectItem value="process">Process</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Priority</label>
                <Select value={form.priority} onValueChange={v => setForm({ ...form, priority: v })}>
                  <SelectTrigger className="bg-secondary/50"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="critical">Critical</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="low">Low</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Owner</label>
              <Input value={form.owner_name} onChange={e => setForm({ ...form, owner_name: e.target.value })} placeholder="Owner name" className="bg-secondary/50" />
            </div>
            <Button className="w-full" onClick={editTopic ? handleUpdateTopic : handleCreateTopic}>
              {editTopic ? "Update Topic" : "Create Topic"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
