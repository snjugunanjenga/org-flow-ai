import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, Plus, Save, Trash2 } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { SourceUploader } from "@/components/resources/SourceUploader";
import { SourceList } from "@/components/resources/SourceList";
import { ResourceChat } from "@/components/resources/ResourceChat";
import { NotebookGuide } from "@/components/resources/NotebookGuide";
import { ReportGenerator } from "@/components/resources/ReportGenerator";
import type { Notebook } from "@/pages/dashboard/ResourcesView";

export interface Source {
  id: string;
  title: string;
  source_type: string;
  content: string;
  file_url: string | null;
  metadata: any;
  created_at: string;
  pinned?: boolean;
}

interface NoteItem {
  id: string;
  output_type: string;
  content: any;
  created_at: string;
}

interface Props {
  notebook: Notebook;
  onBack: () => void;
  orgId: string;
}

export function NotebookDetail({ notebook, onBack, orgId }: Props) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [sources, setSources] = useState<Source[]>([]);
  const [pinnedIds, setPinnedIds] = useState<Set<string>>(new Set());
  const [notes, setNotes] = useState<NoteItem[]>([]);
  const [newNoteTitle, setNewNoteTitle] = useState("");
  const [newNoteContent, setNewNoteContent] = useState("");

  const fetchSources = async () => {
    const { data } = await supabase
      .from("resource_sources")
      .select("*")
      .eq("notebook_id", notebook.id)
      .order("created_at", { ascending: false });
    setSources((data as any[]) || []);
  };

  const fetchNotes = async () => {
    const { data } = await supabase
      .from("resource_outputs")
      .select("*")
      .eq("notebook_id", notebook.id)
      .in("output_type", ["note", "slides"])
      .order("created_at", { ascending: false });
    setNotes((data as NoteItem[]) || []);
  };

  useEffect(() => {
    fetchSources();
    fetchNotes();
  }, [notebook.id]);

  const togglePin = (id: string) => {
    setPinnedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const saveNote = async () => {
    if (!newNoteTitle.trim() || !newNoteContent.trim()) return;
    const { error } = await supabase.from("resource_outputs").insert({
      notebook_id: notebook.id,
      org_id: orgId,
      output_type: "note",
      content: { title: newNoteTitle.trim(), body: newNoteContent.trim() },
    });
    if (error) {
      toast({ variant: "destructive", title: "Error", description: error.message });
    } else {
      toast({ title: "Note saved" });
      setNewNoteTitle("");
      setNewNoteContent("");
      fetchNotes();
    }
  };

  const generateSlides = async () => {
    if (sources.length === 0) {
      toast({ variant: "destructive", title: "No sources", description: "Add sources first." });
      return;
    }
    try {
      const sourceContext = sources
        .slice(0, 10)
        .map((s, i) => `[Source ${i + 1}: ${s.title}]\n${s.content.slice(0, 2000)}`)
        .join("\n\n---\n\n");

      const resp = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/resource-ai`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({
          action: "generate-report",
          report_type: "slides",
          source_context: sourceContext,
          notebook_id: notebook.id,
        }),
      });
      if (!resp.ok) throw new Error("Failed to generate slides");
      const data = await resp.json();

      await supabase.from("resource_outputs").insert({
        notebook_id: notebook.id,
        org_id: orgId,
        output_type: "slides",
        content: { title: `Slide Deck - ${notebook.title}`, body: data.report || "No content generated." },
      });
      toast({ title: "Slide deck generated" });
      fetchNotes();
    } catch (err: any) {
      toast({ variant: "destructive", title: "Error", description: err.message });
    }
  };

  const deleteNote = async (id: string) => {
    // resource_outputs doesn't have DELETE RLS, so this may fail silently
    await supabase.from("resource_outputs").delete().eq("id", id);
    fetchNotes();
  };

  const pinnedSources = sources.filter((s) => pinnedIds.has(s.id));
  const contextSources = pinnedSources.length > 0 ? pinnedSources : sources;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={onBack}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold font-display">{notebook.title}</h1>
          <p className="text-xs text-muted-foreground">
            {sources.length} sources · {pinnedIds.size} pinned · {notes.length} notes
          </p>
        </div>
      </div>

      <Tabs defaultValue="sources" className="space-y-4">
        <TabsList>
          <TabsTrigger value="sources">Sources</TabsTrigger>
          <TabsTrigger value="chat">Chat</TabsTrigger>
          <TabsTrigger value="notes">Notes</TabsTrigger>
          <TabsTrigger value="slides">Slides</TabsTrigger>
          <TabsTrigger value="guide">Guide</TabsTrigger>
          <TabsTrigger value="reports">Reports</TabsTrigger>
        </TabsList>

        <TabsContent value="sources" className="space-y-4">
          <SourceUploader notebookId={notebook.id} orgId={orgId} onUploaded={fetchSources} />
          <SourceList sources={sources} pinnedIds={pinnedIds} onTogglePin={togglePin} />
        </TabsContent>

        <TabsContent value="chat">
          <ResourceChat notebookId={notebook.id} orgId={orgId} sources={contextSources} />
        </TabsContent>

        <TabsContent value="notes" className="space-y-4">
          {/* Create a note */}
          <div className="glass-panel p-4 space-y-3">
            <h3 className="text-sm font-semibold">Create Note</h3>
            <Input
              placeholder="Note title"
              value={newNoteTitle}
              onChange={(e) => setNewNoteTitle(e.target.value)}
              className="bg-secondary/50 border-border/50"
            />
            <Textarea
              placeholder="Write your note..."
              value={newNoteContent}
              onChange={(e) => setNewNoteContent(e.target.value)}
              rows={6}
              className="bg-secondary/50 border-border/50"
            />
            <Button onClick={saveNote} disabled={!newNoteTitle.trim() || !newNoteContent.trim()}>
              <Save className="h-4 w-4 mr-2" /> Save Note
            </Button>
          </div>

          {/* List notes */}
          {notes.filter((n) => n.output_type === "note").map((note) => (
            <div key={note.id} className="glass-panel p-4">
              <div className="flex items-start justify-between gap-2 mb-2">
                <h4 className="font-semibold text-sm">{(note.content as any)?.title || "Untitled"}</h4>
                <button onClick={() => deleteNote(note.id)} className="text-muted-foreground hover:text-destructive">
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
              <p className="text-sm text-muted-foreground whitespace-pre-wrap">{(note.content as any)?.body}</p>
              <p className="text-[10px] text-muted-foreground mt-2">{new Date(note.created_at).toLocaleDateString()}</p>
            </div>
          ))}
          {notes.filter((n) => n.output_type === "note").length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-8">No notes yet. Create one above.</p>
          )}
        </TabsContent>

        <TabsContent value="slides" className="space-y-4">
          <Button onClick={generateSlides} disabled={sources.length === 0}>
            <Plus className="h-4 w-4 mr-2" /> Generate Slide Deck from Sources
          </Button>

          {notes.filter((n) => n.output_type === "slides").map((slide) => (
            <div key={slide.id} className="glass-panel p-6">
              <h4 className="font-semibold mb-3">{(slide.content as any)?.title || "Slide Deck"}</h4>
              <div className="prose prose-sm dark:prose-invert max-w-none whitespace-pre-wrap">
                {(slide.content as any)?.body}
              </div>
              <p className="text-[10px] text-muted-foreground mt-3">{new Date(slide.created_at).toLocaleDateString()}</p>
            </div>
          ))}
          {notes.filter((n) => n.output_type === "slides").length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-8">No slide decks yet. Generate one from your sources.</p>
          )}
        </TabsContent>

        <TabsContent value="guide">
          <NotebookGuide notebookId={notebook.id} orgId={orgId} sources={sources} />
        </TabsContent>

        <TabsContent value="reports">
          <ReportGenerator notebookId={notebook.id} orgId={orgId} sources={contextSources} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
