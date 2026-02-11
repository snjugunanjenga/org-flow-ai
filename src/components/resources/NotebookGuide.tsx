import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Sparkles, Loader2 } from "lucide-react";
import type { Source } from "@/components/resources/NotebookDetail";

interface Props {
  notebookId: string;
  orgId: string;
  sources: Source[];
}

const AI_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/resource-ai`;

export function NotebookGuide({ notebookId, orgId, sources }: Props) {
  const [guide, setGuide] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const generate = async () => {
    if (sources.length === 0) {
      toast({ variant: "destructive", title: "No sources", description: "Add sources first." });
      return;
    }
    setLoading(true);
    try {
      const sourceContext = sources
        .slice(0, 10)
        .map((s, i) => `[Source ${i + 1}: ${s.title}]\n${s.content.slice(0, 2000)}`)
        .join("\n\n---\n\n");

      const resp = await fetch(AI_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({
          action: "generate-guide",
          source_context: sourceContext,
          notebook_id: notebookId,
        }),
      });

      if (!resp.ok) throw new Error("Failed to generate guide");
      const data = await resp.json();
      setGuide(data.guide || "No guide generated.");
    } catch (err: any) {
      toast({ variant: "destructive", title: "Error", description: err.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <Button onClick={generate} disabled={loading || sources.length === 0}>
        {loading ? (
          <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Generating...</>
        ) : (
          <><Sparkles className="h-4 w-4 mr-2" />Generate Notebook Guide</>
        )}
      </Button>

      {guide && (
        <div className="glass-panel p-6 prose prose-sm dark:prose-invert max-w-none whitespace-pre-wrap">
          {guide}
        </div>
      )}
    </div>
  );
}
