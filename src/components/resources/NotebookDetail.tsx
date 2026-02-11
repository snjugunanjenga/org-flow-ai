import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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

interface Props {
  notebook: Notebook;
  onBack: () => void;
  orgId: string;
}

export function NotebookDetail({ notebook, onBack, orgId }: Props) {
  const { user } = useAuth();
  const [sources, setSources] = useState<Source[]>([]);
  const [pinnedIds, setPinnedIds] = useState<Set<string>>(new Set());

  const fetchSources = async () => {
    const { data } = await supabase
      .from("resource_sources")
      .select("*")
      .eq("notebook_id", notebook.id)
      .order("created_at", { ascending: false });
    setSources((data as any[]) || []);
  };

  useEffect(() => {
    fetchSources();
  }, [notebook.id]);

  const togglePin = (id: string) => {
    setPinnedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
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
            {sources.length} sources · {pinnedIds.size} pinned
          </p>
        </div>
      </div>

      <Tabs defaultValue="sources" className="space-y-4">
        <TabsList>
          <TabsTrigger value="sources">Sources</TabsTrigger>
          <TabsTrigger value="chat">Chat</TabsTrigger>
          <TabsTrigger value="guide">Guide</TabsTrigger>
          <TabsTrigger value="reports">Reports</TabsTrigger>
        </TabsList>

        <TabsContent value="sources" className="space-y-4">
          <SourceUploader
            notebookId={notebook.id}
            orgId={orgId}
            onUploaded={fetchSources}
          />
          <SourceList
            sources={sources}
            pinnedIds={pinnedIds}
            onTogglePin={togglePin}
          />
        </TabsContent>

        <TabsContent value="chat">
          <ResourceChat
            notebookId={notebook.id}
            orgId={orgId}
            sources={contextSources}
          />
        </TabsContent>

        <TabsContent value="guide">
          <NotebookGuide
            notebookId={notebook.id}
            orgId={orgId}
            sources={sources}
          />
        </TabsContent>

        <TabsContent value="reports">
          <ReportGenerator
            notebookId={notebook.id}
            orgId={orgId}
            sources={contextSources}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
