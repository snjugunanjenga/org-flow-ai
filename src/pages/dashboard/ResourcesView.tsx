import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useOrgId } from "@/hooks/use-org-id";
import { useAuth } from "@/contexts/AuthContext";
import { NotebookList } from "@/components/resources/NotebookList";
import { NotebookDetail } from "@/components/resources/NotebookDetail";

export interface Notebook {
  id: string;
  title: string;
  description: string | null;
  project_id: string | null;
  created_at: string;
}

export default function ResourcesView() {
  const orgId = useOrgId();
  const { user } = useAuth();
  const [notebooks, setNotebooks] = useState<Notebook[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchNotebooks = async () => {
    if (!orgId) return;
    const { data } = await supabase
      .from("resource_notebooks")
      .select("*")
      .eq("org_id", orgId)
      .order("created_at", { ascending: false });
    setNotebooks((data as any[]) || []);
    setLoading(false);
  };

  useEffect(() => {
    fetchNotebooks();
  }, [orgId]);

  const handleCreate = async (title: string) => {
    if (!orgId || !user) return;
    const { data, error } = await supabase
      .from("resource_notebooks")
      .insert({ title, org_id: orgId, created_by: user.id })
      .select()
      .single();
    if (error) {
      console.error("Create notebook error:", error);
      return;
    }
    if (data) {
      setNotebooks((prev) => [data as any, ...prev]);
      setSelectedId((data as any).id);
    }
  };

  const selected = notebooks.find((n) => n.id === selectedId);

  if (selected) {
    return (
      <NotebookDetail
        notebook={selected}
        onBack={() => setSelectedId(null)}
        orgId={orgId!}
      />
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold font-display">Resources</h1>
        <p className="text-muted-foreground mt-1">
          Source-grounded AI research workspace — upload documents, ask questions, and generate reports.
        </p>
      </div>
      <NotebookList
        notebooks={notebooks}
        loading={loading}
        onSelect={setSelectedId}
        onCreate={handleCreate}
      />
    </div>
  );
}
